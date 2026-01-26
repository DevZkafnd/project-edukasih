import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'guru') {
        navigate('/dashboard-guru', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/dashboard-admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/auth/login', formData);
      const { user, token } = response.data;
      
      login(user, token);

      // Redirect based on role
      if (user.role === 'guru') {
        navigate('/dashboard-guru');
      } else if (user.role === 'admin') {
        navigate('/dashboard-admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-b-4 border-brand-blue">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo className="w-24 h-24 mb-4" />
          <h1 className="text-3xl font-bold text-brand-blue mb-2">EduKasih</h1>
          <p className="text-gray-500">Masuk untuk mulai belajar</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue transition"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue transition"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-brand-blue transition focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            Masuk Sekarang
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Belum punya akun? Hubungi Ibu Guru ya!</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
