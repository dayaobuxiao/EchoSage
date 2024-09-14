from langchain_community.embeddings.zhipuai import ZhipuAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_unstructured import UnstructuredLoader
from langchain.prompts import PromptTemplate
from unstructured.partition.auto import partition
from .custom_llm import CustomAPILLM
import os
import shutil
import logging
import mimetypes
import traceback

API_URL = ""
API_KEY = ""

organization_specific_template = """
You are an AI assistant dedicated to helping Organization {organization_id}. 
You must only use information specific to Organization {organization_id} and must not share or use information from any other organization.

Context: {context}

Question: {question}

Please provide an answer based solely on the information provided for Organization {organization_id}:
"""

organization_specific_prompt = PromptTemplate(
    input_variables=["organization_id", "context", "question"],
    template=organization_specific_template
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGSystem:
    def __init__(self, organization_id):
        self.organization_id = organization_id
        self.embeddings = ZhipuAIEmbeddings(
            model="embedding-2",
            api_key=API_KEY
        )
        self.vectorstore_path = f"/app/vectorstores/organization_{organization_id}"

        # 确保 vectorstore_path 存在
        os.makedirs(self.vectorstore_path, exist_ok=True)

        self.vectorstore = self._load_or_create_vectorstore()

        custom_llm = CustomAPILLM(
            api_url=API_URL,
            api_key=API_KEY
        )
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=custom_llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 5}) # 从向量数据库中搜索前5个最相关的
        )

    def _load_or_create_vectorstore(self):
        index_file = os.path.join(self.vectorstore_path, "index.faiss")
        if os.path.exists(index_file):
            logger.info(f"Loading existing vectorstore from {self.vectorstore_path}")
            return FAISS.load_local(
                self.vectorstore_path,
                self.embeddings,
                allow_dangerous_deserialization=True
            )

        logger.info("Creating new vectorstore with initial empty document")
        return self._create_new_vectorstore()

    def _create_new_vectorstore(self):
        vectorstore = FAISS.from_texts(["Initial empty document"], embedding=self.embeddings)
        vectorstore.save_local(self.vectorstore_path)
        return vectorstore


    def add_document(self, file_path):
        logger.info(f"Starting to process document: {file_path}")
        if not os.path.exists(file_path):
            logger.error(f"File does not exist: {file_path}")
            return

        # Check file size and type
        file_size = os.path.getsize(file_path)
        mime_type, _ = mimetypes.guess_type(file_path)
        logger.info(f"File size: {file_size} bytes, MIME type: {mime_type}")

        logger.info("Partitioning document with unstructured")
        try:
            elements = partition(filename=file_path)
            logger.info(f"Partitioned {len(elements)} elements from the document")

            # Log detailed information about each element
            for i, element in enumerate(elements):
                logger.debug(f"Element {i}: Type: {type(element)}, Category: {element.category}")
                logger.debug(f"Element {i} content preview: {str(element)[:100]}...")

        except Exception as e:
            logger.error(f"Error partitioning document: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return

        if len(elements) == 0:
            logger.warning(f"No elements extracted from {file_path}. The file might be empty or corrupted.")
            return

        texts = [str(element) for element in elements if hasattr(element, 'text')]
        logger.info(f"Extracted {len(texts)} text chunks")

        if len(texts) == 0:
            logger.warning(f"No text content found in {file_path}.")
            return

        logger.info("Adding text chunks to vectorstore")
        for i, text in enumerate(texts):
            logger.debug(f"Adding chunk {i + 1}/{len(texts)} to vectorstore. Preview: {text[:100]}...")
            self.vectorstore.add_texts([text])

        logger.info(f"Saving vectorstore to {self.vectorstore_path}")
        self.vectorstore.save_local(self.vectorstore_path)

        logger.info(f"Total documents in vectorstore after addition: {len(self.vectorstore.index_to_docstore_id)}")

    def query(self, question):
        """Query the RAG system with strict organization isolation."""
        # 添加公司特定的上下文
        context = self.vectorstore.similarity_search(question, k=5)
        prompt = organization_specific_prompt.format(
            organization_id=self.organization_id,
            context=context,
            question=question
        )

        response = self.qa_chain.invoke(prompt)

        # 验证响应不包含其他公司的信息
        if self._contains_other_organization_info(response):
            return "I apologize, but I can't provide that information."

        logger.info(f"Generated response: {response}")
        return response

    def _contains_other_organization_info(self, response):
        # 实现检查逻辑，例如查找其他公司ID或关键词
        # 这是一个简化的示例，您需要根据实际情况完善这个方法
        other_organization_ids = [str(i) for i in range(1, 1000) if i != self.organization_id]
        return any(f"Organization {id}" in response for id in other_organization_ids)

    # FAISS不支持删除单个文档，只能通过重建index的方式来变相删除了，缺点是性能较差
    def remove_document(self, document_path):
        """Remove a document by rebuilding the index without it."""
        # Get the base name of the document to be removed
        doc_to_remove = os.path.basename(document_path)

        # Get all documents in the vectorstore path
        all_docs = [f for f in os.listdir(self.vectorstore_path) if
                    os.path.isfile(os.path.join(self.vectorstore_path, f))]

        # Filter out the document to be removed
        docs_to_keep = [f for f in all_docs if f != doc_to_remove]

        if len(docs_to_keep) == len(all_docs):
            print(f"Document {doc_to_remove} not found in the index. No changes made.")
            return

        # Rebuild the index with the remaining documents
        self.rebuild_index([os.path.join(self.vectorstore_path, f) for f in docs_to_keep])

        print(f"Document {doc_to_remove} removed and index rebuilt.")

    def rebuild_index(self, document_paths):
        """Rebuild the entire index with the given documents."""
        logger.info(f"Starting index rebuild with {len(document_paths)} documents")
        texts = []
        for path in document_paths:
            try:
                logger.info(f"Processing document: {path}")

                if not os.path.exists(path):
                    logger.error(f"File does not exist: {path}")
                    continue

                # Check file size and type
                file_size = os.path.getsize(path)
                mime_type, _ = mimetypes.guess_type(path)
                logger.info(f"File size: {file_size} bytes, MIME type: {mime_type}")

                logger.info("Partitioning document with unstructured")
                elements = partition(filename=path)
                logger.info(f"Partitioned {len(elements)} elements from the document")

                # Extract text from all elements
                doc_texts = [str(element) for element in elements if hasattr(element, 'text')]
                logger.info(f"Extracted {len(doc_texts)} text chunks from {path}")

                if len(doc_texts) == 0:
                    logger.warning(f"No text content found in {path}. Skipping this document.")
                    continue

                texts.extend(doc_texts)

            except Exception as e:
                logger.error(f"Error processing file {path}: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                continue

        if not texts:
            logger.error("No valid documents to index. Aborting rebuild.")
            return

        # Create a new FAISS index
        new_vectorstore = FAISS.from_texts(texts, self.embeddings)

        # Save the new index
        if os.path.exists(self.vectorstore_path):
            logger.info(f"Removing old vectorstore at {self.vectorstore_path}")
            shutil.rmtree(self.vectorstore_path)

        logger.info(f"Saving new vectorstore to {self.vectorstore_path}")
        new_vectorstore.save_local(self.vectorstore_path)

        # Update the current vectorstore
        self.vectorstore = new_vectorstore
        logger.info(f"Index rebuilt with {len(texts)} text chunks from {len(document_paths)} documents.")
