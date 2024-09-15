import React from 'react';
import { Link } from 'react-router-dom';
import { FaRobot, FaDatabase, FaLock } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-6">Welcome to EchoSage</h1>
      <p className="text-xl mb-8">Your intelligent companion for all your questions and tasks.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
          <FaRobot className="text-5xl text-primary dark:text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">AI-Powered</h2>
          <p>Leverage advanced AI to get accurate and helpful responses.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
          <FaDatabase className="text-5xl text-primary dark:text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Knowledge Base</h2>
          <p>Access a vast database of information across various domains.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
          <FaLock className="text-5xl text-primary dark:text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Secure</h2>
          <p>Your data and conversations are protected with industry-standard security.</p>
        </div>
      </div>

      <Link to="/signup" className="bg-primary hover:bg-blue-600 text-primary dark:text-secondary font-bold py-2 px-4 rounded-full text-lg transition duration-300">
        Get Started
      </Link>
    </div>
  );
};

export default Home;