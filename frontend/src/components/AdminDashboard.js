import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaUser, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { validateUsername, validatePassword, validateEmail } from '../utils/validationUtils';
import api from '../services/api';

const AdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [newOrganization, setNewOrganization] = useState('');
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', organization_id: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
    fetchUsers();
  }, []);

  useEffect(() => {
    validateForm();
  }, [newUser, touchedFields]);

  const fetchOrganizations  = async () => {
    try {
      const response = await api.get('/admin/organizations');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setErrors(prev => ({ ...prev, fetchOrganizations: 'Failed to fetch organizations' }));
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setErrors(prev => ({ ...prev, fetchUsers: 'Failed to fetch users' }));
    }
  };

  const createOrganization = async () => {
    try {
      await api.post('/admin/organizations', { name: newOrganization });
      setNewOrganization('');
      fetchOrganizations();
    } catch (error) {
      console.error('Failed to create organization:', error);
      setErrors(prev => ({ ...prev, createOrganization: 'Failed to create organization' }));
    }
  };

  const deleteOrganization = async (id) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/organizations/${id}`);
        fetchOrganizations();
      } catch (error) {
        console.error('Failed to delete organization:', error);
        setErrors(prev => ({ ...prev, deleteOrganization: 'Failed to delete organization' }));
      }
    }
  };

  const validateForm = async () => {
    const newErrors = {};
    if (touchedFields.username) {
      newErrors.username = await validateUsername(newUser.username);
    }
    if (touchedFields.email) {
      newErrors.email = validateEmail(newUser.email);
    }
    if (touchedFields.password) {
      newErrors.password = validatePassword(newUser.password);
    }
    if (touchedFields.organization_id && !newUser.organization_id) {
      newErrors.organization = 'Please select an organization';
    }
    setErrors(newErrors);

    const isValid = Object.values(newUser).every(value => value !== '') &&
                    Object.keys(touchedFields).length === Object.keys(newUser).length &&
                    Object.values(newErrors).every(error => !error);
    setIsFormValid(isValid);
  };

  const createUser = async () => {
    if (!isFormValid) return;

    try {
      await api.post('/admin/users', newUser);
      setNewUser({ username: '', email: '', password: '', organization_id: '' });
      setTouchedFields({});
      setErrors({});
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      setErrors(prev => ({ ...prev, createUser: 'Failed to create user' }));
    }
  };

  const updateUser = async () => {
    try {
      await api.put(`/admin/users/${editingUser.id}`, editingUser);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      if (error.response) {
        setErrors(prev => ({ ...prev, updateUser: error.response.data.error || 'Failed to update user' }));
      } else if (error.request) {
        setErrors(prev => ({ ...prev, updateUser: 'No response received from server' }));
      } else {
        setErrors(prev => ({ ...prev, updateUser: 'Error in making request' }));
      }
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        if (error.response) {
          setErrors(prev => ({ ...prev, deleteUser: error.response.data.error || 'Failed to delete user' }));
        } else {
          setErrors(prev => ({ ...prev, deleteUser: 'Failed to delete user' }));
        }
      }
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
    setTouchedFields({ ...touchedFields, [name]: true });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields({ ...touchedFields, [name]: true });
  };

  const navigateToOrganizationDocuments = (organizationId) => {
    navigate(`/documents/${organizationId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-primary dark:text-secondary">Admin Dashboard</h2>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FaBuilding className="mr-2" /> Organization Management
          </h3>
          <ul className="space-y-2 mb-4">
            {organizations.map(org => (
              <li key={org.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <span>{org.name}</span>
                <div>
                  <button onClick={() => navigateToOrganizationDocuments(org.id)} className="text-blue-500 hover:text-blue-700 mr-2">
                    Manage Documents
                  </button>
                  <button onClick={() => deleteOrganization(org.id)} className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex">
            <input
              type="text"
              value={newOrganization}
              onChange={(e) => setNewOrganization(e.target.value)}
              placeholder="New Organization Name"
              className="flex-grow mr-2 p-2 border rounded w-full outline-none bg-transparent text-gray-700 dark:text-gray-200"
            />
            <button onClick={createOrganization} className="bg-primary-600 text-white p-2 rounded">
              <FaPlus />
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FaUser className="mr-2" /> User Management
          </h3>
          <ul className="space-y-2 mb-4">
            {users.map(user => (
              <li key={user.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <span className="text-gray-800 dark:text-gray-200">
                  {user.username} - {user.email} - Role: {user.role}
                </span>
                <div>
                  <button onClick={() => setEditingUser(user)} className="text-blue-500 hover:text-blue-700 mr-2">
                    <FaEdit />
                  </button>
                  <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {editingUser ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editingUser.username}
                onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                placeholder="Username"
                className="w-full p-2 border rounded text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700"
                disabled
              />
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                placeholder="Email"
                className="w-full p-2 border rounded text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700"
                disabled
              />
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                className="w-full p-2 border rounded text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={updateUser} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                Update User
              </button>
              <button onClick={() => setEditingUser(null)} className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                name="username"
                value={newUser.username}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Username"
                className="w-full p-2 border rounded outline-none bg-transparent text-gray-700 dark:text-gray-200"
              />
              {touchedFields.username && errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Email"
                className="w-full p-2 border rounded outline-none bg-transparent text-gray-700 dark:text-gray-200"
              />
              {touchedFields.email && errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Password"
                className="w-full p-2 border rounded outline-none bg-transparent text-gray-700 dark:text-gray-200"
              />
              {touchedFields.password && errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              <select
                name="organization_id"
                value={newUser.organization_id}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full p-2 border rounded outline-none bg-transparent text-gray-700 dark:text-gray-200"
              >
                <option
                  value=""
                  className="w-full p-2 border rounded outline-none bg-transparent text-gray-700 dark:text-gray-700"
                  disabled selected
                >
                  Select Organization
                </option>
                {organizations.map(org => (
                  <option
                    key={org.id}
                    value={org.id}
                    className="w-full p-2 border rounded outline-none bg-transparent text-gray-700 dark:text-gray-700"
                  >
                    {org.name}
                  </option>
                ))}
              </select>
              {touchedFields.organization_id && errors.organization && <p className="text-red-500 text-xs">{errors.organization}</p>}
              <button
                onClick={createUser}
                className={`w-full bg-primary-600 text-white p-2 rounded ${!isFormValid && 'opacity-50 cursor-not-allowed'}`}
                disabled={!isFormValid}
              >
                Add User
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;