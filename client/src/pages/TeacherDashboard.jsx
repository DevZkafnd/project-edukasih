import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Upload, Users, BookOpen, Star, Calendar, MessageSquare, Trash, Edit, LayoutDashboard, Menu, X, Image as ImageIcon, Video, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useAudio from '../hooks/useAudio';
import { API_BASE_URL } from '../config';

const SidebarItem = ({ label, iconEl, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-brand-blue text-white shadow-md' 
        : 'text-gray-600 hover:bg-blue-50 hover:text-brand-blue'
    }`}
  >
    {iconEl}
    <span className="font-medium">{label}</span>
  </button>
);

const TeacherDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { stopAll } = useAudio();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('monitoring'); // 'monitoring', 'materi', 'upload'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed for mobile
  const [editMateri, setEditMateri] = useState(null); // If editing, stores materi object
  const isEdit = !!editMateri;
  const [createStudent, setCreateStudent] = useState({ nama: '', username: '', password: '', nama_orang_tua: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({ nama: '', username: '', password: '', nama_orang_tua: '', skor_bintang: 0 });
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const studentsPageSize = 8;

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    if (match && match[2] && match[2].length === 11) return match[2];
    return null;
  };
  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (filterKategori) {
      list = list.filter(m => m.kategori === filterKategori);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(m => (m.judul || '').toLowerCase().includes(q));
    }
    return list;
  }, [materials, search, filterKategori]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredMaterials.length / pageSize)), [filteredMaterials.length]);
  const paginatedMaterials = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, page, pageSize]);
  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => (s.nama || '').toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q));
  }, [students, studentSearch]);
  const totalStudentPages = useMemo(() => Math.max(1, Math.ceil(filteredStudents.length / studentsPageSize)), [filteredStudents.length]);
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * studentsPageSize;
    return filteredStudents.slice(start, start + studentsPageSize);
  }, [filteredStudents, studentPage, studentsPageSize]);

  // Form State
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'akademik',
    tipe_media: 'video_youtube',
    url_media: '',
    panduan_ortu: '',
    langkah_langkah: ''
  });
  const [file, setFile] = useState(null);
  // Removed unused uploadStatus state as we use toast now
  const fetchData = async () => {
    try {
      const [studentsRes, materialsRes] = await Promise.all([
        axios.get('/api/auth/students'),
        axios.get('/api/materi')
      ]);
      setStudents(studentsRes.data);
      setMaterials(materialsRes.data);
      setLoadingData(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'guru') {
        navigate('/login');
        return;
      }
      const id = setTimeout(fetchData, 0);
      return () => clearTimeout(id);
    }
  }, [user, authLoading, navigate]);

  

  

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
 
  const handleCreateStudentChange = (e) => {
    setCreateStudent({ ...createStudent, [e.target.name]: e.target.value });
  };
 
  const submitCreateStudent = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Membuat akun siswa...');
    try {
      await axios.post('/api/auth/students', createStudent);
      toast.success('Siswa berhasil dibuat', { id: toastId });
      setCreateStudent({ nama: '', username: '', password: '', nama_orang_tua: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat siswa', { id: toastId });
    }
  };
 
  const openEditStudent = (s) => {
    setEditingStudent(s);
    setEditStudentForm({
      nama: s.nama || '',
      username: s.username || '',
      password: '',
      nama_orang_tua: s.nama_orang_tua || '',
      skor_bintang: s.skor_bintang || 0
    });
  };
 
  const handleEditStudentChange = (e) => {
    const { name, value } = e.target;
    setEditStudentForm({ ...editStudentForm, [name]: name === 'skor_bintang' ? Number(value) : value });
  };
 
  const submitEditStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    const toastId = toast.loading('Menyimpan perubahan siswa...');
    try {
      const payload = { ...editStudentForm };
      if (!payload.password) delete payload.password;
      await axios.put(`/api/auth/students/${editingStudent._id}`, payload);
      toast.success('Data siswa diperbarui', { id: toastId });
      setEditingStudent(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui siswa', { id: toastId });
    }
  };
 
  const deleteStudentConfirm = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium">Hapus akun siswa ini?</p>
        <div className="flex gap-2 justify-end">
          <button 
            className="bg-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Batal
          </button>
          <button 
            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
            onClick={() => {
              toast.dismiss(t.id);
              deleteStudent(id);
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };
 
  const deleteStudent = async (id) => {
    const toastId = toast.loading('Menghapus siswa...');
    try {
      await axios.delete(`/api/auth/students/${id}`);
      toast.success('Siswa berhasil dihapus', { id: toastId });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus siswa', { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEdit ? 'Menyimpan perubahan...' : 'Sedang mengupload...');

    try {
      const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
      if (formData.tipe_media === 'video_youtube') {
        const vid = getYoutubeId(formData.url_media);
        if (!vid) {
          toast.error('Link YouTube tidak valid. Gunakan URL penuh seperti https://www.youtube.com/watch?v=...', { id: toastId });
          return;
        }
      } else if (formData.tipe_media === 'video_lokal') {
        if (!file && !isEdit) {
          toast.error('File video belum dipilih.', { id: toastId });
          return;
        }
        if (file) {
          if (!(file.type || '').startsWith('video/')) {
            toast.error('File yang dipilih bukan video.', { id: toastId });
            return;
          }
          if (file.size > MAX_VIDEO_SIZE) {
            toast.error('Ukuran video melebihi 100MB.', { id: toastId });
            return;
          }
        }
      }
      const data = new FormData();
      data.append('judul', formData.judul);
      data.append('kategori', formData.kategori);
      data.append('tipe_media', formData.tipe_media);
      data.append('panduan_ortu', formData.panduan_ortu);
      
      const stepsArray = formData.langkah_langkah.split('\n').filter(step => step.trim() !== '');
      stepsArray.forEach(step => data.append('langkah_langkah[]', step));

      if (formData.tipe_media === 'video_youtube') {
        data.append('url_media', formData.url_media);
      } else if (file) {
        data.append('media', file);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      let response;
      if (isEdit) {
        response = await axios.put(`/api/materi/${editMateri._id}`, data, config);
        toast.success('Materi berhasil diperbarui!', { id: toastId });
        setEditMateri(null); // Clear edit mode
        setActiveTab('materi'); // Go back to list
      } else {
        response = await axios.post('/api/materi', data, config);
        toast.success('Materi berhasil diupload! Mengalihkan...', { id: toastId });
        setTimeout(() => {
            navigate(`/manage-quiz/${response.data._id}`);
        }, 1000);
      }
      
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Gagal ${isEdit ? 'menyimpan' : 'mengupload'}: ` + (error.response?.data?.message || error.message), { id: toastId });
    }
  };

  const handleEditClick = (materi) => {
    setEditMateri(materi);
    setFormData({
      judul: materi.judul,
      kategori: materi.kategori,
      tipe_media: materi.tipe_media,
      url_media: materi.tipe_media === 'video_youtube' ? materi.url_media : '',
      panduan_ortu: materi.panduan_ortu || '',
      langkah_langkah: materi.langkah_langkah ? (Array.isArray(materi.langkah_langkah) ? materi.langkah_langkah.join('\n') : materi.langkah_langkah) : ''
    });
    setFile(null);
    setActiveTab('upload'); // Reuse upload form
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium">Hapus materi ini? Kuis terkait juga akan dihapus.</p>
        <div className="flex gap-2 justify-end">
          <button 
            className="bg-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Batal
          </button>
          <button 
            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete(id);
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const confirmDelete = async (id) => {
    const toastId = toast.loading('Menghapus...');
    try {
      await axios.delete(`/api/materi/${id}`);
      toast.success('Materi berhasil dihapus', { id: toastId });
      fetchData();
    } catch {
      toast.error('Gagal menghapus materi', { id: toastId });
    }
  };

  if (authLoading || loadingData) return <div className="p-10 text-center">Memuat Dashboard...</div>;

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="text-brand-blue" size={32} />
            <div>
              <h1 className="text-xl font-bold text-brand-blue">EduKasih</h1>
              <p className="text-xs text-gray-500">Dashboard Guru</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden text-gray-500 hover:text-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem 
            label="Monitoring Siswa" 
            iconEl={<Users size={20} />} 
            active={activeTab === 'monitoring'} 
            onClick={() => { setActiveTab('monitoring'); setIsSidebarOpen(false); }}
          />
          <SidebarItem 
            label="Manajemen Materi" 
            iconEl={<LayoutDashboard size={20} />} 
            active={activeTab === 'materi'} 
            onClick={() => { setActiveTab('materi'); setIsSidebarOpen(false); }}
          />
          <SidebarItem 
            label="Upload Materi Baru" 
            iconEl={<Upload size={20} />} 
            active={activeTab === 'upload'} 
            onClick={() => {
              setEditMateri(null);
              setFormData({
                judul: '',
                kategori: 'akademik',
                tipe_media: 'video_youtube',
                url_media: '',
                panduan_ortu: '',
                langkah_langkah: ''
              });
              setFile(null);
              setActiveTab('upload');
              setIsSidebarOpen(false);
            }}
          />
          
          <div className="pt-4 mt-4 border-t">
            <Link 
              to="/forum" 
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-brand-blue rounded-xl transition-all"
            >
                <MessageSquare size={20} />
                <span className="font-medium">Forum Kelas</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
              {user?.nama?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.nama}</p>
              <p className="text-xs text-gray-500">Guru</p>
            </div>
          </div>
          <button 
            onClick={() => { 
              stopAll();
              logout();
            }} 
            className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200 transition text-sm font-bold"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between md:hidden z-20">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="font-bold text-brand-blue">EduKasih Guru</span>
          <div className="w-8"></div> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-brand-blue" /> Monitoring Siswa
              </h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                  placeholder="Cari nama atau username siswa..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition bg-white"
                />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={submitCreateStudent} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-gray-700 font-bold mb-2">Nama</label>
                    <input
                      type="text"
                      name="nama"
                      value={createStudent.nama}
                      onChange={handleCreateStudentChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                      placeholder="Nama siswa"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-gray-700 font-bold mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={createStudent.username}
                      onChange={handleCreateStudentChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                      placeholder="Username"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-gray-700 font-bold mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={createStudent.password}
                      onChange={handleCreateStudentChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                      placeholder="Password"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-gray-700 font-bold mb-2">Nama Orang Tua</label>
                    <input
                      type="text"
                      name="nama_orang_tua"
                      value={createStudent.nama_orang_tua}
                      onChange={handleCreateStudentChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                      placeholder="Nama orang tua"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <button
                      type="submit"
                      className="w-full bg-brand-blue text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                      Buat Akun Siswa
                    </button>
                  </div>
                </form>
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 border-b">
                        <th className="p-4 font-semibold">Nama Siswa</th>
                        <th className="p-4 font-semibold">Orang Tua</th>
                        <th className="p-4 font-semibold text-center">Total Bintang</th>
                        <th className="p-4 font-semibold">Terakhir Login</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStudents.length > 0 ? (
                        paginatedStudents.map(student => (
                            <tr key={student._id} className="border-b hover:bg-gray-50 transition">
                            <td className="p-4 font-medium text-gray-800">{student.nama}</td>
                            <td className="p-4 text-gray-600">{student.nama_orang_tua || '-'}</td>
                            <td className="p-4 text-center">
                                <div className="inline-flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-yellow-700 font-bold">
                                <Star size={16} fill="currentColor" />
                                {student.skor_bintang || 0}
                                </div>
                            </td>
                            <td className="p-4 text-gray-500 text-sm">
                                {new Date(student.updatedAt).toLocaleDateString('id-ID')}
                            </td>
                            <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.skor_bintang > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {student.skor_bintang > 0 ? 'Aktif' : 'Belum Ada Progres'}
                                </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditStudent(student)}
                                  className="px-3 py-1 bg-blue-50 text-brand-blue rounded-lg hover:bg-blue-100 transition flex items-center gap-2 text-sm font-bold"
                                >
                                  <Edit size={14} /> Edit
                                </button>
                                <button
                                  onClick={() => deleteStudentConfirm(student._id)}
                                  className="px-3 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition flex items-center gap-2 text-sm font-bold"
                                >
                                  <Trash size={14} /> Hapus
                                </button>
                              </div>
                            </td>
                            </tr>
                        ))
                        ) : (
                        <tr>
                            <td colSpan="6" className="p-8 text-center text-gray-500 italic">Belum ada data siswa.</td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
              </div>
              {filteredStudents.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                    disabled={studentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    Halaman {studentPage} dari {totalStudentPages}
                  </span>
                  <button
                    onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                    disabled={studentPage >= totalStudentPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
              {editingStudent && (
                <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-gray-100">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-bold text-gray-800">Edit Akun Siswa</h3>
                      <button
                        onClick={() => setEditingStudent(null)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                        aria-label="Tutup"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <form onSubmit={submitEditStudent} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">Nama</label>
                          <input
                            type="text"
                            name="nama"
                            value={editStudentForm.nama}
                            onChange={handleEditStudentChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">Username</label>
                          <input
                            type="text"
                            name="username"
                            value={editStudentForm.username}
                            onChange={handleEditStudentChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">Password (opsional)</label>
                          <input
                            type="password"
                            name="password"
                            value={editStudentForm.password}
                            onChange={handleEditStudentChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                            placeholder="Kosongkan jika tidak diubah"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">Nama Orang Tua</label>
                          <input
                            type="text"
                            name="nama_orang_tua"
                            value={editStudentForm.nama_orang_tua}
                            onChange={handleEditStudentChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">Total Bintang</label>
                          <input
                            type="number"
                            min="0"
                            name="skor_bintang"
                            value={editStudentForm.skor_bintang}
                            onChange={handleEditStudentChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingStudent(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materi' && (
            <div className="space-y-6">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutDashboard className="text-brand-blue" /> Manajemen Materi & Kuis
                    </h2>
                    <button 
                        onClick={() => {
                            setEditMateri(null);
                            setActiveTab('upload');
                        }}
                        className="w-full sm:w-auto bg-brand-blue text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Upload size={18} /> Tambah Materi
                    </button>
               </div>
               <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                 <input
                   type="text"
                   value={search}
                   onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                   placeholder="Cari judul materi..."
                   className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition bg-white"
                 />
                 <div className="relative w-full sm:w-64">
                   <select
                     value={filterKategori}
                     onChange={(e) => { setFilterKategori(e.target.value); setPage(1); }}
                     className="appearance-none w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition bg-white"
                   >
                     <option value="">Semua Kategori</option>
                     <option value="akademik">Akademik</option>
                     <option value="vokasi">Vokasional</option>
                     <option value="lifeskill">Bina Diri</option>
                   </select>
                   <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                 </div>
               </div>

               {filteredMaterials.length === 0 ? (
                   <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                       <p className="text-gray-500 text-lg">Belum ada materi yang diupload.</p>
                       <button 
                         onClick={() => setActiveTab('upload')}
                         className="mt-4 text-brand-blue font-bold hover:underline"
                       >
                         Upload Sekarang
                       </button>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                       {paginatedMaterials.map(m => (
                           <div key={m._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group">
                               {/* Card Header/Preview */}
                               <div className="h-40 bg-gray-100 relative">
                                    {m.tipe_media === 'video_youtube' ? (
                                        (() => {
                                          const vid = getYoutubeId(m.url_media);
                                          if (!vid) {
                                            return (
                                              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                <Video size={48} />
                                              </div>
                                            );
                                          }
                                          const src = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                                          return (
                                            <img 
                                              src={src}
                                              alt={m.judul}
                                              className="w-full h-full object-cover"
                                              onError={(e) => e.target.src = 'https://placehold.co/600x400?text=Video'}
                                            />
                                          );
                                        })()
                                    ) : m.tipe_media === 'video_lokal' ? (
                                        <video
                                          src={`${API_BASE_URL}${m.url_media}`}
                                          className="w-full h-full object-cover"
                                          preload="metadata"
                                          muted
                                          playsInline
                                          onLoadedMetadata={(e) => {
                                            try { e.target.currentTime = 0.001; } catch (e2) { console.warn(e2); }
                                          }}
                                        />
                                    ) : (
                                        <img
                                          src={`${API_BASE_URL}${m.url_media}`}
                                          alt={m.judul}
                                          className="w-full h-full object-cover"
                                          onError={(e) => e.target.src = 'https://placehold.co/600x400?text=Gambar'}
                                        />
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase tracking-wide text-gray-600">
                                        {m.kategori}
                                    </div>
                               </div>
                               
                               {/* Card Body */}
                               <div className="p-5">
                                   <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1" title={m.judul}>{m.judul}</h3>
                                   <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                       {m.tipe_media === 'video_youtube' ? 'YouTube' : m.tipe_media === 'video_lokal' ? 'Video Lokal' : 'Gambar'}
                                       <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
                                       {new Date(m.createdAt).toLocaleDateString('id-ID')}
                                   </p>
                                   
                                   {/* Actions */}
                                   <div className="flex flex-col gap-2">
                                       <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEditClick(m)}
                                                className="flex-1 bg-blue-50 text-brand-blue py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                                            >
                                                <Edit size={16} /> Edit Info
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(m._id)}
                                                className="px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                                                title="Hapus"
                                            >
                                                <Trash size={16} />
                                            </button>
                                       </div>
                                       <Link 
                                           to={`/manage-quiz/${m._id}`}
                                           className="w-full bg-brand-yellow text-brand-blue py-2 rounded-lg text-sm font-bold hover:bg-yellow-400 transition flex items-center justify-center gap-2"
                                       >
                                           <Star size={16} /> Edit Kuis
                                       </Link>
                                   </div>
                                   </div>
                               </div>
                           ))}
                   </div>
               )}
               {filteredMaterials.length > 0 && (
                 <div className="flex items-center justify-center gap-2 pt-2">
                   <button
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1}
                     className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                   >
                     Prev
                   </button>
                   <span className="text-sm text-gray-600 px-2">
                     Halaman {page} dari {totalPages}
                   </span>
                   <button
                     onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                     disabled={page >= totalPages}
                     className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                   >
                     Next
                   </button>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                {editMateri ? <Edit className="text-brand-blue" /> : <Upload className="text-brand-blue" />}
                {editMateri ? 'Edit Materi' : 'Upload Materi Baru'}
              </h2>
              
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Judul Materi</label>
                        <input 
                        type="text" 
                        name="judul" 
                        value={formData.judul || ''} 
                        onChange={handleInputChange} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition" 
                        placeholder="Contoh: Belajar Membaca A" 
                        required 
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Kategori Belajar</label>
                        <div className="relative">
                          <select 
                            name="kategori" 
                            value={formData.kategori} 
                            onChange={handleInputChange} 
                            className="appearance-none w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition bg-white"
                          >
                            <option value="akademik">Akademik (Berhitung/Membaca)</option>
                            <option value="vokasi">Vokasional (Masak/Kerajinan)</option>
                            <option value="lifeskill">Bina Diri (Gosok Gigi/Mandi)</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                    </div>

                    <div>
                    <label className="block text-gray-700 font-bold mb-2">Panduan Orang Tua</label>
                    <textarea 
                        name="panduan_ortu" 
                        value={formData.panduan_ortu || ''} 
                        onChange={handleInputChange} 
                        rows="3" 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition bg-orange-50/30" 
                        placeholder="Contoh: Dampingi anak saat menirukan suara..." 
                    ></textarea>
                    </div>

                    {/* Vokasi Specific: Steps */}
                    {(formData.kategori === 'vokasi' || formData.kategori === 'lifeskill') && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="block text-gray-700 font-bold mb-2">Langkah-langkah (Satu per baris)</label>
                        <textarea 
                        name="langkah_langkah" 
                        value={formData.langkah_langkah || ''} 
                        onChange={handleInputChange} 
                        rows="4" 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition" 
                        placeholder={"1. Siapkan bahan\n2. Nyalakan kompor..."} 
                        ></textarea>
                    </div>
                    )}

                    {/* Media Upload Section */}
                    <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Media Pembelajaran</h3>
                    
                    {/* Warning Box */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-sm text-yellow-800">
                        <p className="font-bold mb-1">Perhatian Guru:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Video YouTube:</strong> Gunakan link lengkap (contoh: https://www.youtube.com/watch?v=...)</li>
                            <li><strong>Video Lokal:</strong> Maksimal 100MB. Format MP4/WebM. Pastikan koneksi internet stabil saat upload.</li>
                        </ul>
                    </div>

                    <div className="flex gap-4 mb-4">
                        <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition ${formData.tipe_media === 'video_youtube' ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-200 text-gray-500 hover:border-blue-200'}`}>
                        <input 
                            type="radio" 
                            name="tipe_media" 
                            value="video_youtube" 
                            checked={formData.tipe_media === 'video_youtube'} 
                            onChange={handleInputChange} 
                            className="hidden"
                        />
                        <span className="font-bold">Video YouTube</span>
                        </label>
                        <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition ${formData.tipe_media === 'video_lokal' ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-200 text-gray-500 hover:border-blue-200'}`}>
                        <input 
                            type="radio" 
                            name="tipe_media" 
                            value="video_lokal" 
                            checked={formData.tipe_media === 'video_lokal'} 
                            onChange={handleInputChange} 
                            className="hidden"
                        />
                        <span className="font-bold">Upload Video</span>
                        </label>
                        {/* opsi gambar_lokal dihapus */}
                    </div>

                    {formData.tipe_media === 'video_youtube' ? (
                        <div>
                        <label className="block text-gray-700 font-medium mb-2">Link YouTube</label>
                        <input 
                            type="text" 
                            name="url_media" 
                            value={formData.url_media || ''} 
                            onChange={handleInputChange} 
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition" 
                            placeholder="https://www.youtube.com/watch?v=..." 
                            required 
                        />
                        </div>
                    ) : (
                        <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Pilih File Video
                            {isEdit && <span className="text-gray-400 font-normal ml-2">(Biarkan kosong jika tidak ingin mengubah)</span>}
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
                            <input 
                                type="file" 
                                onChange={handleFileChange} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept={"video/*"}
                                required={!isEdit} // Required only for new uploads
                            />
                            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-gray-600 font-medium">
                                {file ? file.name : (isEdit ? "Klik untuk mengganti file (Opsional)" : "Klik atau seret file ke sini")}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                MP4, WebM (Max 100MB)
                            </p>
                        </div>
                        </div>
                    )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        {isEdit && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditMateri(null);
                                    setActiveTab('materi');
                                }}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                        )}
                        <button 
                            type="submit" 
                            className="flex-1 bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex justify-center items-center gap-2"
                        >
                            {isEdit ? <Edit size={20} /> : <Upload size={20} />}
                            {isEdit ? 'Simpan Perubahan' : 'Upload Materi'}
                        </button>
                    </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
