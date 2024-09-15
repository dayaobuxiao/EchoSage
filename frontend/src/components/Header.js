import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSun, FaMoon, FaUser, FaSignOutAlt, FaChevronDown, FaUserCircle, FaBars } from 'react-icons/fa';
import api from '../services/api';

const Header = ({ isLoggedIn, onLogout, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const [username, setUsername] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUsername();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUsername = async () => {
    try {
      const response = await api.get('/auth/user');
      setUsername(response.data.username);
    } catch (error) {
      console.error('Failed to fetch username:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      onLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md transition-colors duration-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-primary-500 dark:text-secondary-400">
            EchoSage
          </Link>
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="text-gray-600 dark:text-gray-300">
              <FaBars size={24} />
            </button>
          </div>
          <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              {isLoggedIn ? (
                <>
                  <Link to="/chat" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-secondary-400">Chat</Link>
                  {userRole === 'admin' && (
                    <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-secondary-400">Admin</Link>
                  )}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-secondary-400"
                    >
                      <FaUser className="mr-2" />
                      <span className="truncate max-w-[100px]">Hi, {username}</span>
                      <FaChevronDown className="ml-1" />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10">
                        <Link
                          to="/account"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FaUserCircle className="inline mr-2" />
                          Account
                        </Link>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <FaSignOutAlt className="inline mr-2" />
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition duration-300">Log in</Link>
                  <Link to="/signup" className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-md transition duration-300">Sign Up</Link>
                </>
              )}
              <button onClick={toggleDarkMode} className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-secondary-400">
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;