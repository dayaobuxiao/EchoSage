import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import api from '../services/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userRole', response.data.user_role);
      onLogin();
      if (response.data.user_role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/chat');
      }
    } catch (error) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md px-6 py-8 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-700 dark:text-gray-200">Log in to your account</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center border-2 rounded-md">
            <FaUser className="mx-2 text-gray-400" />
            <input
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div className="flex items-center border-2 rounded-md">
            <FaLock className="mx-2 text-gray-400" />
            <input
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
            Log in
          </button>
        </form>
        {error && <p className="mt-4 text-xs text-center text-red-500">{error}</p>}
        <p className="mt-4 text-xs text-center text-gray-600 dark:text-gray-400">
          Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;