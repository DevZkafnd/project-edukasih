import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserPlus, Shield, Users, Star, Edit, Trash, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useAudio from '../hooks/useAudio';
import Logo from '../components/Logo';

const AdminDashboard = () => {
  const { logout, token } = useAuth();
  const { stopAll } = useAudio();
  const navigate = useNavigate();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' | 'students'

  // Teacher State
  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({ nama: '', username: '', password: '', mata_pelajaran: '', posisi: '' });
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Student State
  const [students, setStudents] = useState([]);
  const [createStudent, setCreateStudent] = useState({ nama: '', username: '', password: '', nama_orang_tua: '', jenjang: '', kelas: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({ nama: '', username: '', password: '', nama_orang_tua: '', skor_bintang: 0, jenjang: '', kelas: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const studentsPageSize = 8;
  const [loadingStudents, setLoadingStudents] = useState(false);

  // --- Fetch Data ---
  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const res = await axios.get('/api/auth/teachers');
      setTeachers(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat daftar Guru');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await axios.get('/api/auth/students');
      setStudents(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat daftar Siswa');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'teachers') fetchTeachers();
      if (activeTab === 'students') fetchStudents();
    }
  }, [activeTab, token]);

  const handleLogout = () => {
    stopAll();
    logout();
    navigate('/login');
  };

  // --- Teacher Handlers ---
  const handleTeacherChange = (e) => {
    setTeacherForm({ ...teacherForm, [e.target.name]: e.target.value });
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({
      nama: teacher.nama || '',
      username: teacher.username || '',
      password: '',
      mata_pelajaran: teacher.mata_pelajaran || '',
      posisi: teacher.posisi || ''
    });
  };

  const cancelEditTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({ nama: '', username: '', password: '', mata_pelajaran: '', posisi: '' });
  };

  const deleteTeacher = async (teacher) => {
    if (!window.confirm(`Hapus akun guru "${teacher.nama}"?`)) return;
    const toastId = toast.loading('Menghapus...');
    try {
      await axios.delete(`/api/auth/teachers/${teacher._id}`);
      toast.success('Akun Guru berhasil dihapus', { id: toastId });
      setTeachers((prev) => prev.filter((t) => t._id !== teacher._id));
      if (editingTeacher && editingTeacher._id === teacher._id) {
        cancelEditTeacher();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus akun Guru', { id: toastId });
    }
  };

  const submitTeacher = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(editingTeacher ? 'Menyimpan...' : 'Membuat...');
    try {
      if (editingTeacher) {
        await axios.put(`/api/auth/teachers/${editingTeacher._id}`, teacherForm);
        toast.success('Akun Guru berhasil diperbarui', { id: toastId });
      } else {
        await axios.post('/api/auth/teachers', teacherForm);
        toast.success('Akun Guru berhasil dibuat', { id: toastId });
      }
      setTeacherForm({ nama: '', username: '', password: '', mata_pelajaran: '', posisi: '' });
      setEditingTeacher(null);
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan akun Guru', { id: toastId });
    }
  };

  // --- Student Handlers ---
  const handleCreateStudentChange = (e) => {
    setCreateStudent({ ...createStudent, [e.target.name]: e.target.value });
  };

  const submitCreateStudent = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Membuat akun siswa...');
    try {
      await axios.post('/api/auth/students', createStudent);
      toast.success('Siswa berhasil dibuat', { id: toastId });
      setCreateStudent({ nama: '', username: '', password: '', nama_orang_tua: '', jenjang: '', kelas: '', ketunaan: '' });
      fetchStudents();
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
      skor_bintang: s.skor_bintang || 0,
      jenjang: s.jenjang || '',
      kelas: s.kelas || '',
      ketunaan: s.ketunaan || ''
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
      fetchStudents();
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
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus siswa', { id: toastId });
    }
  };

  // --- Student Filtering & Pagination ---
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


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-brand-blue">EduKasih Admin</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Panel Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm font-bold"
          >
            <LogOut size={18} /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            <button
                onClick={() => setActiveTab('teachers')}
                className={`pb-3 px-4 font-bold transition-all whitespace-nowrap ${
                    activeTab === 'teachers' 
                    ? 'text-brand-blue border-b-2 border-brand-blue' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Manajemen Guru
            </button>
            <button
                onClick={() => setActiveTab('students')}
                className={`pb-3 px-4 font-bold transition-all whitespace-nowrap ${
                    activeTab === 'students' 
                    ? 'text-brand-blue border-b-2 border-brand-blue' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Manajemen Siswa
            </button>
        </div>

        {/* --- TEACHERS TAB --- */}
        {activeTab === 'teachers' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <UserPlus className="text-brand-blue" /> {editingTeacher ? 'Edit Akun Guru' : 'Buat Akun Guru Baru'}
              </h2>
              
              <form onSubmit={submitTeacher} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Nama Lengkap Guru</label>
                  <input 
                    type="text" 
                    name="nama" 
                    value={teacherForm.nama} 
                    onChange={handleTeacherChange} 
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
                    value={teacherForm.username} 
                    onChange={handleTeacherChange} 
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
                    value={teacherForm.password} 
                    onChange={handleTeacherChange} 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                    placeholder={editingTeacher ? "Kosongkan jika tidak diubah" : "Password"}
                    required={!editingTeacher}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Mengajar Mata Pelajaran</label>
                    <input 
                      type="text" 
                      name="mata_pelajaran" 
                      value={teacherForm.mata_pelajaran} 
                      onChange={handleTeacherChange} 
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                      placeholder="Contoh: Matematika"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Posisi di Sekolah</label>
                    <input 
                      type="text" 
                      name="posisi" 
                      value={teacherForm.posisi} 
                      onChange={handleTeacherChange} 
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                      placeholder="Contoh: Wali Kelas 7A"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit" 
                    className="flex-1 bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    {editingTeacher ? 'Simpan Perubahan' : 'Buat Akun Guru'}
                  </button>
                  {editingTeacher && (
                    <button
                      type="button"
                      onClick={cancelEditTeacher}
                      className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Daftar Akun Guru</h2>
              {teachers.length === 0 ? (
                <p className="text-gray-500 text-sm mt-4">Belum ada akun Guru terdaftar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-4">Nama</th>
                        <th className="py-2 pr-4">Username</th>
                        <th className="py-2 pr-4">Dibuat</th>
                        <th className="py-2 pr-4">Posisi</th>
                        <th className="py-2 pr-4">Mengajar</th>
                        <th className="py-2 pr-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((t) => (
                        <tr key={t._id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{t.nama}</td>
                          <td className="py-3 pr-4">{t.username}</td>
                          <td className="py-3 pr-4">
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="py-3 pr-4">
                            {t.posisi ? (
                              <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-lg font-bold text-xs">
                                {t.posisi}
                              </span>
                            ) : <span className="text-gray-400 text-xs">-</span>}
                          </td>
                          <td className="py-3 pr-4">
                            {t.mata_pelajaran ? (
                              <span className="inline-block bg-blue-100 text-brand-blue px-2 py-0.5 rounded-lg font-bold text-xs">
                                {t.mata_pelajaran}
                              </span>
                            ) : <span className="text-gray-400 text-xs">-</span>}
                          </td>
                          <td className="py-3 pr-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEditTeacher(t)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-brand-blue hover:bg-blue-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTeacher(t)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100"
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
          </div>
        )}

        {/* --- STUDENTS TAB --- */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-fadeIn">
            
             <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-brand-blue" /> Manajemen Siswa
                </h2>
                <div className="w-full md:w-auto relative">
                    <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                        placeholder="Cari siswa..."
                        className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
             </div>

             {/* Create Student Form */}
             <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-brand-blue flex items-center gap-2">
                     <UserPlus size={20} /> Tambah Siswa Baru
                </h3>
                <form onSubmit={submitCreateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text" 
                        placeholder="Nama Lengkap Siswa"
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none"
                        value={createStudent.nama}
                        onChange={(e) => setCreateStudent({...createStudent, nama: e.target.value})}
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Username"
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none"
                        value={createStudent.username}
                        onChange={(e) => setCreateStudent({...createStudent, username: e.target.value})}
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Password"
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none"
                        value={createStudent.password}
                        onChange={(e) => setCreateStudent({...createStudent, password: e.target.value})}
                        required
                    />
                     <input 
                        type="text" 
                        placeholder="Nama Orang Tua"
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none"
                        value={createStudent.nama_orang_tua}
                        onChange={(e) => setCreateStudent({...createStudent, nama_orang_tua: e.target.value})}
                    />
                    
                    {/* New Fields: Jenjang & Kelas */}
                    <div className="flex flex-col md:flex-row gap-2 md:col-span-2">
                         <select 
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none w-full md:w-1/3"
                            value={createStudent.ketunaan}
                            onChange={(e) => setCreateStudent({...createStudent, ketunaan: e.target.value})}
                            required
                         >
                            <option value="">Pilih Ketunaan</option>
                            <option value="Tunanetra">Tunanetra</option>
                            <option value="Tunarungu">Tunarungu</option>
                            <option value="Tunagrahita">Tunagrahita</option>
                            <option value="Tunadaksa">Tunadaksa</option>
                            <option value="Autis">Autis</option>
                         </select>
                         <select 
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none w-full md:w-1/3"
                            value={createStudent.jenjang}
                            onChange={(e) => setCreateStudent({...createStudent, jenjang: e.target.value})}
                            required
                         >
                            <option value="">Pilih Jenjang</option>
                            <option value="TK">TK</option>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                         </select>
                         <input 
                            type="text" 
                            placeholder="Kelas (contoh: Kelas 1, 7A)"
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue outline-none w-full md:w-1/3"
                            value={createStudent.kelas}
                            onChange={(e) => setCreateStudent({...createStudent, kelas: e.target.value})}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="bg-brand-blue text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition md:col-span-2"
                    >
                        Buat Akun Siswa
                    </button>
                </form>
             </div>

              {/* Student List */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 border-b">
                        <th className="p-4 font-semibold">Nama Siswa</th>
                        <th className="p-4 font-semibold">Orang Tua</th>
                        <th className="p-4 font-semibold text-center">Total Bintang</th>
                        <th className="p-4 font-semibold">Terakhir Login</th>
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
                            <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                                {loadingStudents ? 'Memuat data siswa...' : 'Belum ada data siswa.'}
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
              </div>

              {/* Pagination */}
              {filteredStudents.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                    disabled={studentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    Halaman {studentPage} dari {totalStudentPages}
                  </span>
                  <button
                    onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                    disabled={studentPage >= totalStudentPages}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
          </div>
        )}

      </main>

      {/* Edit Student Modal */}
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
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Ketunaan</label>
                    <select
                    name="ketunaan"
                    value={editStudentForm.ketunaan}
                    onChange={handleEditStudentChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                    >
                        <option value="">Pilih Ketunaan</option>
                        <option value="Tunanetra">Tunanetra</option>
                        <option value="Tunarungu">Tunarungu</option>
                        <option value="Tunagrahita">Tunagrahita</option>
                        <option value="Tunadaksa">Tunadaksa</option>
                        <option value="Autis">Autis</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Jenjang</label>
                    <select
                    name="jenjang"
                    value={editStudentForm.jenjang}
                    onChange={handleEditStudentChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                    >
                        <option value="">Pilih Jenjang</option>
                        <option value="TK">TK</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Kelas</label>
                    <input
                    type="text"
                    name="kelas"
                    value={editStudentForm.kelas}
                    onChange={handleEditStudentChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                    placeholder="Contoh: Kelas 1, 7A"
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
  );
};

export default AdminDashboard;
