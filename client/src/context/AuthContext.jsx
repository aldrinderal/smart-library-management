import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Verify token on initial app load
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async ({ identifier, password, role }) => {
    try {
      const payload = { password, role };
      if (identifier.includes('@')) {
        payload.email = identifier;
      } else {
        payload.registerNumber = identifier;
      }

      const res = await api.post('/auth/login', payload);
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data.message || 'Login failed.' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login request failed.',
      };
    }
  };

  const register = async (studentData) => {
    try {
      const res = await api.post('/auth/register', studentData);
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data.message || 'Registration failed.' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration request failed.',
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

