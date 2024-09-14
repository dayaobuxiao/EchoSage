import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaEnvelope, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import { validateEmail, validatePassword } from '../utils/validationUtils';
import api from '../services/api';

const AccountManagement = ({ onLogout }) => {
  const [user, setUser] = useState({ username: '', email: '' });
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState('');
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    validateForm();
  }, [newEmail, newPassword, confirmPassword, touchedFields]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/user');
      setUser(response.data);
      setNewEmail(response.data.email);
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Failed to fetch user info' }));
      console.error('Failed to fetch user info:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (touchedFields.email) {
      newErrors.email = validateEmail(newEmail);
    }
    if (touchedFields.password) {
      newErrors.password = validatePassword(newPassword);
    }
    if (touchedFields.confirmPassword) {
      newErrors.confirmPassword = newPassword !== confirmPassword ? 'Passwords do not match' : null;
    }
    setErrors(newErrors);

    const isValid = Object.values(newErrors).every(error => !error) &&
                    (newEmail !== user.email || newPassword !== '');
    setIsFormValid(isValid);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setNewEmail(value);
    if (name === 'password') setNewPassword(value);
    if (name === 'confirmPassword') setConfirmPassword(value);
    if (name === 'deletePassword') setDeletePassword(value);
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setMessage('');
    setErrors({});

    if (newPassword !== confirmPassword) {
      setErrors('Passwords do not match');
      return;
    }

    try {
      const updateData = {};
      if (newEmail !== user.email) updateData.email = newEmail;
      if (newPassword) updateData.newPassword = newPassword;

      const response = await api.post('/auth/user/update', updateData);
      if (response.data.message === 'User information updated successfully') {
        setMessage('User information updated successfully');
        setTimeout(() => setMessage(''), 1500);
        setNewPassword('');
        setConfirmPassword('');
        setTouchedFields({});
      } else {
        setErrors(prev => ({ ...prev, general: 'Failed to update user information' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: error.response?.data?.error || 'Failed to update user information' }));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await api.post('/auth/delete-account', { password: deletePassword });
      if (response.data.message === "Account successfully deleted") {
        setIsDeleteModalOpen(false);
        setIsSuccessModalOpen(true);
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          onLogout();
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setErrors(prev => ({
        ...prev,
        deleteAccount: error.response?.data?.error || 'Failed to delete account. Please try again.'
      }));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md px-8 py-6 mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-700 dark:text-gray-200">Account Management</h2>

        <div className="mb-4 flex items-center text-gray-700 dark:text-gray-300">
          <FaUserCircle className="mr-2" />
          <span>Username: {user.username}</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center border-2 rounded-md">
            <FaEnvelope className="mx-2 text-gray-400" />
            <input
              type="email"
              name="email"
              value={newEmail}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="New Email"
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
            />
          </div>
          {touchedFields.email && errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

          <div className="flex items-center border-2 rounded-md">
            <FaLock className="mx-2 text-gray-400" />
            <input
              type="password"
              name="password"
              value={newPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="New Password"
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
            />
          </div>
          {touchedFields.password && errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}

          <div className="flex items-center border-2 rounded-md">
            <FaLock className="mx-2 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Confirm New Password"
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
            />
          </div>
          {touchedFields.confirmPassword && errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}

          <button
            type="submit"
            className={`w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600 ${!isFormValid && 'opacity-50 cursor-not-allowed'}`}
            disabled={!isFormValid}
          >
            Update Information
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-center text-green-500">{message}</p>}
        {errors.general && <p className="mt-4 text-sm text-center text-red-500">{errors.general}</p>}

        <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Delete Account</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Warning: This action is irreversible. All your data will be permanently deleted.
          </p>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:bg-red-600"
          >
            Delete Account
          </button>
        </div>

        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Confirm Account Deletion</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please enter your password to confirm account deletion:
              </p>
              <input
                type="password"
                name="deletePassword"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 mb-4 border rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
              />
              {errors.deleteAccount && <p className="text-red-500 text-xs mb-4">{errors.deleteAccount}</p>}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {isSuccessModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 text-center">
              <FaExclamationTriangle className="mx-auto text-5xl text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Account Deleted Successfully</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Your account has been successfully deleted. You will be redirected to the home page in 3 seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManagement;