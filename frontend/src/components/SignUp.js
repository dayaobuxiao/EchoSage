import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaBuilding } from 'react-icons/fa';
import { validateUsername, validatePassword, validateEmail } from '../utils/validationUtils';
import api from '../services/api';

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    organization_id: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    validateForm();
  }, [formData, touchedFields]);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/auth/organizations');
      setOrganizations(response.data);
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Failed to fetch organizations. Please try again later.' }));
    }
  };

  const validateForm = async () => {
    const newErrors = {};
    if (touchedFields.username) {
      newErrors.username = await validateUsername(formData.username);
    }
    if (touchedFields.password) {
      newErrors.password = validatePassword(formData.password);
    }
    if (touchedFields.email) {
      newErrors.email = validateEmail(formData.email);
    }
    if (touchedFields.organization_id && !formData.organization_id) {
      newErrors.organization = 'Please select an organization';
    }
    setErrors(newErrors);

    const isValid = Object.values(formData).every(value => value !== '') &&
                    Object.keys(touchedFields).length === Object.keys(formData).length &&
                    Object.values(newErrors).every(error => !error);
    setIsFormValid(isValid);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setTouchedFields({ ...touchedFields, [name]: true });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields({ ...touchedFields, [name]: true });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const response = await api.post('/auth/register', formData);
      setSuccessMessage('Registration successful! Redirecting to login page...');
      localStorage.setItem('token', response.data.token);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setErrors(prev => ({ ...prev, general: error.response?.data?.msg || 'Registration failed. Please try again.' }));
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md px-6 py-8 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-700 dark:text-gray-200">Create an Account</h2>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="flex items-center border-2 rounded-md">
            <FaUser className="mx-2 text-gray-400" />
            <input
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Username"
              required
            />
          </div>
          {touchedFields.username && errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}

          <div className="flex items-center border-2 rounded-md">
            <FaEnvelope className="mx-2 text-gray-400" />
            <input
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Email"
              required
            />
          </div>
          {touchedFields.email && errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

          <div className="flex items-center border-2 rounded-md">
            <FaLock className="mx-2 text-gray-400" />
            <input
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Password"
              required
            />
          </div>
          {touchedFields.password && errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}

          <div className="flex items-center border-2 rounded-md">
            <FaBuilding className="mx-2 text-gray-400" />
            <select
              className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-200"
              name="organization_id"
              value={formData.organization_id}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
            >
              <option
                className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-700"
                value=""
                disabled selected
              >
                Select Organization
              </option>
              {organizations.map((org) => (
                <option
                  className="w-full px-2 py-2 outline-none border-none bg-transparent text-gray-700 dark:text-gray-700"
                  key={org.id}
                  value={org.id.toString()}
                >
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          {touchedFields.organization_id && errors.organization && <p className="text-red-500 text-xs">{errors.organization}</p>}

          <button
            type="submit"
            className={`w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600 ${!isFormValid && 'opacity-50 cursor-not-allowed'}`}
            disabled={!isFormValid}
          >
            Sign Up
          </button>
        </form>
        {successMessage && <p className="mt-4 text-sm text-center text-green-500">{successMessage}</p>}
        {errors.general && <p className="mt-4 text-sm text-center text-red-500">{errors.general}</p>}
        <p className="mt-4 text-xs text-center text-gray-600 dark:text-gray-400">
          Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;