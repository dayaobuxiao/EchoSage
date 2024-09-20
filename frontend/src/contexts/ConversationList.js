 import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './ChatContext';
import { FaPlus, FaTrash, FaEdit, FaEllipsisV } from 'react-icons/fa';

const ConversationList = ({ closeSidebar }) => {
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
  const [showMenu, setShowMenu] = useState(null);
  const editInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editInputRef.current && !editInputRef.current.contains(event.target)) {
        handleEditCancel();
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(null);
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
    setShowMenu(null);
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

  const toggleMenu = (id) => {
    setShowMenu(showMenu === id ? null : id);
  };

  const handleSwitchConversation = (id) => {
    switchConversation(id);
    closeSidebar();
  };

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => {
          createNewConversation();
          closeSidebar();
        }}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 flex items-center justify-center"
      >
        <FaPlus className="mr-2" /> New Chat
      </button>
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out ${
            conv.id === currentConversationId ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {editingId === conv.id ? (
            <input
              ref={editInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, conv.id)}
              className="w-full bg-white dark:bg-gray-600 px-2 py-1 rounded border border-gray-300 dark:border-gray-500"
              autoFocus
            />
          ) : (
            <div className="flex items-center justify-between">
              <span
                onClick={() => handleSwitchConversation(conv.id)}
                className="flex-grow truncate text-gray-800 dark:text-gray-200"
              >
                {conv.title}
              </span>
              <button
                onClick={() => toggleMenu(conv.id)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              >
                <FaEllipsisV />
              </button>
            </div>
          )}
          {showMenu === conv.id && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-xl z-20 border border-gray-200 dark:border-gray-600"
            >
              <button
                onClick={() => handleEditStart(conv.id, conv.title)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <FaEdit className="inline mr-2" /> Edit
              </button>
              <button
                onClick={() => {
                  deleteConversation(conv.id);
                  closeSidebar();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <FaTrash className="inline mr-2" /> Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;