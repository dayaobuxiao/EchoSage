import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes

const AutoLogout = ({ onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let logoutTimer;

    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(handleLogout, AUTO_LOGOUT_TIME);
    };

    const handleLogout  = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      onLogout();
      navigate('/login');
    };

    const events = ['mousedown', 'keypress', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [navigate, onLogout]);

  return null;
};

export default AutoLogout;