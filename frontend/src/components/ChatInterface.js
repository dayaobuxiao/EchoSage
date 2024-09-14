import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { useChat } from '../contexts/ChatContext';
import ConversationList from '../contexts/ConversationList';
import api from '../services/api';

const ChatInterface = () => {
  const { conversations, currentConversationId, addMessage, createNewConversation } = useChat();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConversationList />
      <div className="flex-grow flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-colors duration-200">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentConversation?.messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-200 dark:bg-blue-700 text-text dark:text-gray-100' 
                  : 'bg-gray-200 dark:bg-gray-700 text-text dark:text-gray-100'
              }`}>
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-text dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              className={`px-4 py-2 bg-primary-600 text-white rounded-md transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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