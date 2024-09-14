from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, Document
from ..extensions import db
from ..services.rag_service import RAGSystem
import os
import urllib.parse
import uuid

bp = Blueprint('documents', __name__)

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def safe_filename(filename):
    # 解码 URL 编码的文件名
    filename = urllib.parse.unquote(filename)
    # 获取文件扩展名
    _, ext = os.path.splitext(filename)
    # 使用 UUID 作为文件名，保留原始扩展名
    safe_name = f"{uuid.uuid4()}{ext}"
    return safe_name, filename

@bp.route('/organizations/<int:organization_id>/upload', methods=['POST'])
@jwt_required()
def upload_document(organization_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    if 'files' not in request.files:
        return jsonify({"error": "No file part"}), 400

    files = request.files.getlist('files')
    if not files:
        return jsonify({"error": "No selected files"}), 400

    uploaded_files = []
    rag_system = RAGSystem(organization_id)
    for file in files:
        if file and allowed_file(file.filename):
            safe_name, original_name = safe_filename(file.filename)
            if not os.path.exists(current_app.config['UPLOAD_FOLDER']):
                os.makedirs(current_app.config['UPLOAD_FOLDER'])
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], safe_name)
            file.save(file_path)

            new_document = Document(filename=original_name, file_path=safe_name, organization_id=organization_id)
            db.session.add(new_document)
            db.session.flush() #这会给 new_document 分配一个 id
            uploaded_files.append(new_document)
            rag_system.add_document(file_path)

    db.session.commit()

    return jsonify({"message": "Files uploaded and added to knowledge base successfully",
                    "document_ids": [doc.id for doc in uploaded_files]}), 201

@bp.route('/organizations/<int:organization_id>/documents', methods=['GET'])
@jwt_required()
def get_organization_documents(organization_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    documents = Document.query.filter_by(organization_id=organization_id).all()
    return jsonify([{"id": doc.id, "filename": doc.filename} for doc in documents]), 200

@bp.route('/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    document = Document.query.get(document_id)
    if not document:
        return jsonify({"error": "Document not found"}), 404

    # 从 RAG 系统的知识库中移除文档
    rag_system = RAGSystem(document.organization_id)
    # 获取文档的完整路径
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], document.file_path)
    # 从 RAG 系统中移除文档
    rag_system.remove_document(file_path)

    # 从文件系统中删除文件
    if os.path.exists(file_path):
        os.remove(file_path)

    # 从数据库中删除文档记录
    db.session.delete(document)
    db.session.commit()

    return jsonify({"message": "Document deleted successfully"}), 200