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
    <div className="w-full md:w-64 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto">
      <button
        onClick={() => {
          createNewConversation();
          closeSidebar();
        }}
        className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center shadow-md"
      >
        <FaPlus className="mr-2" /> New Chat
      </button>
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={`relative p-3 mb-2 rounded-lg cursor-pointer flex items-center ${
            conv.id === currentConversationId ? 'bg-blue-200 dark:bg-blue-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          } transition-all duration-200 ease-in-out`}
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
            <>
              <span
                onClick={() => handleSwitchConversation(conv.id)}
                className="flex-grow truncate"
              >
                {conv.title}
              </span>
              <button
                onClick={() => toggleMenu(conv.id)}
                className="text-gray-600 hover:text-blue-500 ml-2 focus:outline-none"
              >
                <FaEllipsisV />
              </button>
            </>
          )}
          {showMenu === conv.id && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20"
            >
              <button
                onClick={() => handleEditStart(conv.id, conv.title)}
                className="block px-4 py-2 text-sm capitalize text-gray-700 hover:bg-blue-500 hover:text-white w-full text-left"
              >
                <FaEdit className="inline mr-2" /> Edit
              </button>
              <button
                onClick={() => {
                  deleteConversation(conv.id);
                  closeSidebar();
                }}
                className="block px-4 py-2 text-sm capitalize text-gray-700 hover:bg-red-500 hover:text-white w-full text-left"
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