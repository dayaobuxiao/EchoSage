import api from '../services/api';

export const validateUsername = async (username) => {
  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  try {
    const response = await api.post('/auth/check_username', { username });
    if (!response.data.available) {
      return 'Username is already taken';
    }
  } catch (error) {
    console.error('Error checking username:', error);
    return 'Error checking username availability';
  }
  return null;
};

export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);

  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  } else if (!(hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas)) {
    return 'Password must include upper and lowercase letters, numbers, and special characters';
  }
  return null;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};