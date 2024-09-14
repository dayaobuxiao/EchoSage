import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
import ConversationList from './contexts/ConversationList';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import AutoLogout from './components/AutoLogout';
import DocumentManagement from "./components/DocumentManagement";
import AccountManagement from './components/AccountManagement';
import api from './services/api';

const App = () => {
  const [authState, setAuthState] = useState(() => ({
    isLoggedIn: localStorage.getItem('token') !== null,
    userRole: localStorage.getItem('userRole') || null,
    isVerified: false
  }));
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.get('/auth/verify-token');
          setAuthState(prev => ({ ...prev, isLoggedIn: true, isVerified: true }));
        } catch (error) {
          console.error('Token verification failed:', error);
          handleLogout();
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoggedIn: false, isVerified: true }));
      }
    };

    verifyToken();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleLogin = () => {
    setAuthState({
      isLoggedIn: true,
      userRole: localStorage.getItem('userRole'),
      isVerified: true
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setAuthState({
      isLoggedIn: false,
      userRole: null,
      isVerified: true
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!authState.isVerified) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <ChatProvider>
      <Router>
        <div className={`flex flex-col min-h-screen bg-background dark:bg-gray-900 text-text dark:text-gray-100 transition-colors duration-200`}>
          <Header isLoggedIn={authState.isLoggedIn} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          {authState.isLoggedIn && <AutoLogout onLogout={handleLogout} />}
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={authState.isLoggedIn ? <Navigate to="/chat" /> : <Login onLogin={handleLogin} />}
              />
              <Route
                path="/signup"
                element={authState.isLoggedIn ? <Navigate to="/chat" /> : <SignUp />}
              />
              <Route
                path="/chat"
                element={authState.isLoggedIn ? <ChatInterface /> : <Navigate to="/" />}
              />
              <Route
                path="/admin"
                element={
                  authState.isLoggedIn && authState.userRole === 'admin'
                    ? <AdminDashboard />
                    : <Navigate to={authState.isLoggedIn ? "/chat" : "/"} />
                }
              />
              <Route
                path="/documents/:organizationId"
                element={
                  authState.isLoggedIn && authState.userRole === 'admin'
                    ? <DocumentManagement  />
                    : <Navigate to="/" />
                }
              />
              <Route
                path="/account"
                element={
                  authState.isLoggedIn
                    ? <AccountManagement onLogout={handleLogout} />
                    : <Navigate to="/" />}
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ChatProvider>
  );
};

export default App;