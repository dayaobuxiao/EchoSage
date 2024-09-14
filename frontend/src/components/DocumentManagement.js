import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUpload, FaTrash, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';

const DocumentManagement = () => {
  const { organizationId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, [organizationId]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/documents/organizations/${organizationId}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

    const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  }, []);

  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (selectedFiles.length === 0) {
      setUploadStatus('Please choose one file at least.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      setUploadStatus('Uploading...');
      await api.post(`/documents/organizations/${organizationId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus('Succeed to upload.');
      fetchDocuments();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to upload documents:', error);
      setUploadStatus(`Fail to upload: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await api.delete(`/documents/${documentId}`);
      setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== documentId));
      console.log(`Document ${documentId} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleBack = () => {
    navigate('/admin');  // 导航回管理界面
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-primary dark:text-secondary">Document Management</h2>

      <button onClick={handleBack} className="mb-4 flex items-center text-primary dark:text-secondary hover:underline">
        <FaArrowLeft className="mr-2" /> Back to Admin Dashboard
      </button>

      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 ${isDragging ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-center text-gray-500 dark:text-gray-400 mb-2">Drag and drop files here or click to select files (.txt/.pdf/.docx)</p>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="fileInput"
        />
        <label htmlFor="fileInput" className="block w-full text-center bg-primary-600 text-white p-2 rounded-lg cursor-pointer transition duration-300">
          Select Files
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Selected Files:</h4>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <span>{file.name}</span>
                <button onClick={() => handleRemoveFile(index)} className="text-red-500 hover:text-red-700">
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
          <button onClick={handleUpload} className="mt-4 bg-primary-600 text-white p-2 rounded-lg transition duration-300">
            <FaUpload className="inline-block mr-2" /> Upload Documents
          </button>
        </div>
      )}

      {uploadStatus && <p className="mb-4 text-sm font-semibold text-primary dark:text-secondary">{uploadStatus}</p>}

      <h3 className="text-xl font-semibold mb-4">Document List</h3>
      <ul className="space-y-2">
        {documents.map(doc => (
          <li key={doc.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <span>{decodeURIComponent(doc.filename)}</span>
            <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700">
              <FaTrash />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentManagement;