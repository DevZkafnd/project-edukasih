import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContextBase';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      
      // Set header immediately to avoid race conditions
      if (parsed.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
      }

      const id = setTimeout(() => {
        setUser(parsed.user);
        setToken(parsed.token);
        setLoading(false);
      }, 0);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(id);
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('auth', JSON.stringify({ user: userData, token: tokenData }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
