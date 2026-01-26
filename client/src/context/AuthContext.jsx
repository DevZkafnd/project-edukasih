import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContextBase';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Interceptor untuk menangkap error 401 global
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Jika token expired/invalid, logout otomatis
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Initial Auth Check
    const initAuth = async () => {
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          if (parsed.token) {
            // Set header default
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
            
            // Verify with Server (PENTING: Agar tidak terpental jika local data stale)
            // Kita coba fetch /api/auth/me. 
            // Jika sukses, update user. Jika 401, interceptor di atas akan handle logout.
            // Jika network error, kita gunakan data local sementara (Optimistic).
            try {
              const res = await axios.get('/api/auth/me');
              setUser(res.data);
              setToken(parsed.token);
              // Update local storage agar fresh
              localStorage.setItem('auth', JSON.stringify({ user: res.data, token: parsed.token }));
            } catch (err) {
              console.warn("Auth verification failed (using local data):", err);
              // Fallback ke data local jika bukan 401 (misal offline)
              if (!err.response || err.response.status !== 401) {
                 setUser(parsed.user);
                 setToken(parsed.token);
              }
              // Jika 401, interceptor sudah handle logout()
            }
          }
        } catch (e) {
          console.error("Auth init error:", e);
          localStorage.removeItem('auth');
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      let storedToken = token;
      if (!storedToken) {
        try {
          const raw = localStorage.getItem('auth');
          const parsed = raw ? JSON.parse(raw) : null;
          storedToken = parsed?.token || null;
        } catch (e) {
          storedToken = null;
        }
      }
      if (storedToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
