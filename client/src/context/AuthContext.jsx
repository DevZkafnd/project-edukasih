import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContextBase';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref untuk menyimpan token terbaru (untuk menghindari masalah closure/stale state di interceptor)
  const tokenRef = useRef(null);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    tokenRef.current = tokenData; // Sync Ref
    localStorage.setItem('auth', JSON.stringify({ user: userData, token: tokenData }));
    lastActivityRef.current = Date.now(); // Reset timer saat login
  };

  const logout = () => {
    toast.dismiss(); // Hapus semua toast saat logout
    setUser(null);
    setToken(null);
    tokenRef.current = null; // Sync Ref
    localStorage.removeItem('auth');
  };

  // Ref untuk melacak aktivitas terakhir user (timestamp)
  const lastActivityRef = useRef(Date.now());
  
  // Logika Auto Logout jika idle 1 jam (3600000 ms)
  useEffect(() => {
    if (!token) return;

    // Fungsi update timestamp aktivitas (di-throttle agar ringan)
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Event listener untuk berbagai interaksi user
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    // Cek setiap 1 menit apakah user sudah idle > 1 jam
    const intervalId = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      const MAX_IDLE_TIME = 3600000; // 1 Jam

      if (idleTime > MAX_IDLE_TIME) {
        logout();
        toast.error("Sesi berakhir karena tidak ada aktivitas selama 1 jam.", { duration: 6000 });
      }
    }, 60000); // Cek tiap 60 detik

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(intervalId);
    };
  }, [token]);


  // 1. Setup Interceptors (Hanya sekali saat mount)
  useEffect(() => {
    // A. Request Interceptor: Selalu pasang token terbaru
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        // Cek token dari Ref (paling update) atau LocalStorage (fallback)
        let activeToken = tokenRef.current;
        if (!activeToken) {
           try {
             const stored = JSON.parse(localStorage.getItem('auth') || '{}');
             activeToken = stored.token;
           } catch (e) {}
        }

        if (activeToken) {
          config.headers.Authorization = `Bearer ${activeToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // B. Response Interceptor: Handle 401
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Unauthorized access detected.");
          // PENTING: Jangan langsung logout otomatis untuk menghindari "kick" saat refresh.
          // Cukup biarkan request gagal. Logout hanya dilakukan jika user benar-benar idle
          // atau klik tombol logout.
          // logout(); <--- DIBATALKAN DEMI UX
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // 2. Initial Auth Load
  useEffect(() => {
    const initAuth = async () => {
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          if (parsed.token && parsed.user) {
            // Restore State
            setUser(parsed.user);
            setToken(parsed.token);
            tokenRef.current = parsed.token; // PENTING: Update Ref segera
            
            // Set Default Header (Backup)
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
          }
        } catch (e) {
          console.error("Auth init error:", e);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);


  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
