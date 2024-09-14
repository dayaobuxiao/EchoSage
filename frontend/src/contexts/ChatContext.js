import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  useEffect(() => {
    const storedConversations = localStorage.getItem('conversations');
    if (storedConversations) {
      setConversations(JSON.parse(storedConversations));
    }
    const storedCurrentId = localStorage.getItem('currentConversationId');
    if (storedCurrentId) {
      setCurrentConversationId(storedCurrentId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('currentConversationId', currentConversationId);
    }
  }, [currentConversationId]);

  const addMessage = (text, sender) => {
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, { id: uuidv4(), text, sender, timestamp: new Date().toISOString() }]
          };
        }
        return conv;
      });
      return updatedConversations;
    });
  };

  const createNewConversation = () => {
    const newConversation = {
      id: uuidv4(),
      title: `Conversation ${conversations.length + 1}`,
      messages: []
    };
    setConversations([...conversations, newConversation]);
    setCurrentConversationId(newConversation.id);
  };

  const switchConversation = (id) => {
    setCurrentConversationId(id);
  };

  const deleteConversation = (id) => {
    setConversations(prevConversations => prevConversations.filter(conv => conv.id !== id));
    if (currentConversationId === id) {
      const remainingConversations = conversations.filter(conv => conv.id !== id);
      setCurrentConversationId(remainingConversations.length > 0 ? remainingConversations[0].id : null);
    }
  };

  const updateConversationTitle = (id, newTitle) => {
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === id ? { ...conv, title: newTitle } : conv
      )
    );
  };

  const value = {
    conversations,
    currentConversationId,
    addMessage,
    createNewConversation,
    switchConversation,
    deleteConversation,
    updateConversationTitle
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);