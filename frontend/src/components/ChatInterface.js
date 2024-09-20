import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane,FaBars } from 'react-icons/fa';
import { useChat } from '../contexts/ChatContext';
import ConversationList from '../contexts/ConversationList';
import api from '../services/api';

const ChatInterface = () => {
  const { conversations, currentConversationId, addMessage, createNewConversation } = useChat();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  const currentConversation = conversations.find(conv => conv.id === currentConversationId) || { messages: [] };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [currentConversation.messages]);

  const sendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    if (!currentConversationId) {
      createNewConversation();
    }

    addMessage(input, 'user');
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/rag/query', { question: input });
      addMessage(response.data.answer.result, 'bot');
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage("Sorry, I couldn't process your request.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for conversation list */}
      <div className={`fixed inset-y-0 left-0 transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} w-64 bg-white dark:bg-gray-800 overflow-y-auto transition duration-200 ease-in-out z-30 md:relative md:translate-x-0 border-r border-gray-200 dark:border-gray-700`}>
        <ConversationList closeSidebar={() => setShowSidebar(false)} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-4">
        {/* Chat header */}
        <div className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden">
            <FaBars size={24} />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white ml-4">EchoSage Chat</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg m-4">
          {currentConversation.messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}>
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              className={`px-4 py-2 bg-blue-500 text-white rounded-full transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : <FaPaperPlane />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;