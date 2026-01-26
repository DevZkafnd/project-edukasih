import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContextBase';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref untuk melacak aktivitas terakhir user (timestamp)
  const lastActivityRef = useRef(Date.now());

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('auth', JSON.stringify({ user: userData, token: tokenData }));
    lastActivityRef.current = Date.now(); // Reset timer saat login
  };

  const logout = () => {
    toast.dismiss(); // Hapus semua toast saat logout
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
  };

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
          if (parsed.token && parsed.user) {
            // 1. Set Header Axios SEGERA
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
            
            // 2. Restore State dari LocalStorage (Percaya LocalStorage dulu agar UX cepat & tidak mental)
            setUser(parsed.user);
            setToken(parsed.token);
            
            // 3. Opsional: Verifikasi Token di Background (Silent)
            // Kita tidak await ini agar loading cepat selesai.
            // Jika token invalid (401), interceptor global akan menangkapnya nanti saat user interaksi.
            // Atau kita bisa lakukan cek silent tanpa memblokir UI.
            axios.get('/api/auth/me').then(res => {
               // Update data user terbaru jika ada perubahan di server
               setUser(res.data);
               localStorage.setItem('auth', JSON.stringify({ user: res.data, token: parsed.token }));
            }).catch(err => {
               console.warn("Silent auth check failed:", err.message);
               // Jangan logout di sini, biarkan interceptor global yang bekerja jika benar-benar 401
            });
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
