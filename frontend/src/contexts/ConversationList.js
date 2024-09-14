import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './ChatContext';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

const ConversationList = () => {
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
    updateConversationTitle
  } = useChat();

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editInputRef.current && !editInputRef.current.contains(event.target)) {
        handleEditCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEditStart = (id, currentTitle) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditSave = (id) => {
    if (editingTitle.trim() !== '') {
      updateConversationTitle(id, editingTitle.trim());
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      handleEditSave(id);
    }
  };

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto">
      <button
        onClick={createNewConversation}
        className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
      >
        <FaPlus className="mr-2" /> New Conversation
      </button>
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={`p-2 mb-2 rounded cursor-pointer flex justify-between items-center ${
            conv.id === currentConversationId ? 'bg-blue-200 dark:bg-blue-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {editingId === conv.id ? (
            <input
              ref={editInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, conv.id)}
              className="flex-grow bg-white dark:bg-gray-600 px-2 py-1 rounded"
              autoFocus
            />
          ) : (
            <span
              onClick={() => switchConversation(conv.id)}
              className="flex-grow truncate"
            >
              {conv.title}
            </span>
          )}
          <div>
            {editingId !== conv.id && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditStart(conv.id, conv.title);
                  }}
                  className="text-gray-600 hover:text-blue-500 mr-2"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="text-gray-600 hover:text-red-500"
                >
                  <FaTrash />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;