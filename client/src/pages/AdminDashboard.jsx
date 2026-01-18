import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserPlus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useAudio from '../hooks/useAudio';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const { stopAll } = useAudio();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('/api/auth/teachers');
      setTeachers(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat daftar Guru');
    }
  };

  useEffect(() => {
    const id = setTimeout(fetchTeachers, 0);
    return () => clearTimeout(id);
  }, []);

  const handleLogout = () => {
    stopAll();
    logout();
    navigate('/login');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      nama: teacher.nama || '',
      username: teacher.username || '',
      password: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingTeacher(null);
    setFormData({
      nama: '',
      username: '',
      password: ''
    });
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Hapus akun guru "${teacher.nama}"?`)) return;
    try {
      setLoading(true);
      await axios.delete(`/api/auth/teachers/${teacher._id}`);
      toast.success('Akun Guru berhasil dihapus');
      setTeachers((prev) => prev.filter((t) => t._id !== teacher._id));
      if (editingTeacher && editingTeacher._id === teacher._id) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Gagal menghapus akun Guru');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingTeacher) {
        await axios.put(`/api/auth/teachers/${editingTeacher._id}`, formData);
        toast.success('Akun Guru berhasil diperbarui');
      } else {
        await axios.post('/api/auth/teachers', formData);
        toast.success('Akun Guru berhasil dibuat');
      }
      setFormData({ nama: '', username: '', password: '' });
      setEditingTeacher(null);
      await fetchTeachers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan akun Guru');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-brand-blue" size={32} />
            <div>
              <h1 className="text-xl font-bold text-brand-blue">EduKasih Admin</h1>
              <p className="text-xs text-gray-500">Panel Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition text-sm font-bold"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <UserPlus className="text-brand-blue" /> {editingTeacher ? 'Edit Akun Guru' : 'Buat Akun Guru Baru'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Nama Lengkap Guru</label>
              <input 
                type="text" 
                name="nama" 
                value={formData.nama} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                placeholder="Contoh: Ibu Budi"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Username</label>
              <input 
                type="text" 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                placeholder="Username untuk login"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Password</label>
              <input 
                type="text" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                placeholder="Password"
                required
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? 'Memproses...' : editingTeacher ? 'Simpan Perubahan' : 'Buat Akun Guru'}
              </button>
              {editingTeacher && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full mt-3 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          <div className="flex items-center justify-between mb  -4">
            <h2 className="text-xl font-bold text-gray-800">Daftar Akun Guru</h2>
          </div>
          {teachers.length === 0 ? (
            <p className="text-gray-500 text-sm mt-4">Belum ada akun Guru terdaftar.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Nama</th>
                    <th className="py-2 pr-4">Username</th>
                    <th className="py-2 pr-4">Dibuat</th>
                    <th className="py-2 pr-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t._id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{t.nama}</td>
                      <td className="py-2 pr-4">{t.username}</td>
                      <td className="py-2 pr-4">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="py-2 pr-4 space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(t)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-brand-blue hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          disabled={loading}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="font-bold text-brand-blue mb-2">Informasi Penting</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Akun ini khusus untuk Administrator.</li>
            <li>Gunakan halaman ini untuk mendaftarkan Guru baru.</li>
            <li>Pastikan username unik dan password aman.</li>
            <li>Guru yang didaftarkan akan memiliki akses penuh ke Dashboard Guru.</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
