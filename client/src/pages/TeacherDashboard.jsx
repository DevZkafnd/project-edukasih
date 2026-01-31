import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Upload, Users, BookOpen, Star, Calendar, MessageSquare, Trash, Edit, LayoutDashboard, Menu, X, Image as ImageIcon, Video, ChevronDown, CheckCircle, ChevronRight, FileText, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useAudio from '../hooks/useAudio';
import { API_BASE_URL } from '../config';
import Logo from '../components/Logo';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import PPTXPreview from '../components/PPTXPreview';

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
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'materials'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editMateri, setEditMateri] = useState(null);
  const isEdit = !!editMateri;
  
  // Drill-down State
  const [viewState, setViewState] = useState('KETUNAAN_SELECT'); // 'KETUNAAN_SELECT' | 'JENJANG_SELECT' | 'KELAS_SELECT' | 'STUDENT_LIST' | 'STUDENT_DETAIL'
  const [selectedKetunaan, setSelectedKetunaan] = useState(null);
  const [selectedJenjang, setSelectedJenjang] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Document Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  const handlePreview = (doc) => {
    setPreviewDocument(doc);
    setPreviewModalOpen(true);
  };

  // --- Derived Data for Drill-down ---
  const availableKetunaan = useMemo(() => {
    const ketunaanList = students.map(s => s.ketunaan || 'Umum').filter(k => k);
    return [...new Set(ketunaanList)].sort();
  }, [students]);

  const availableJenjang = useMemo(() => {
      if (!selectedKetunaan) return [];
      const jenjangs = students
        .filter(s => (s.ketunaan || 'Umum') === selectedKetunaan)
        .map(s => s.jenjang || 'SD');
      return [...new Set(jenjangs)].sort();
  }, [students, selectedKetunaan]);
  
  const availableKelas = useMemo(() => {
    if (!selectedJenjang || !selectedKetunaan) return [];
    const classes = students
        .filter(s => (s.jenjang || 'SD') === selectedJenjang && (s.ketunaan || 'Umum') === selectedKetunaan)
        .map(s => s.kelas || 'Belum Ada Kelas');
    return [...new Set(classes)].sort();
  }, [students, selectedJenjang, selectedKetunaan]);

  const studentsInClass = useMemo(() => {
    if (!selectedJenjang || !selectedKelas || !selectedKetunaan) return [];
    return students.filter(s => 
        (s.jenjang || 'SD') === selectedJenjang && 
        (s.kelas || 'Belum Ada Kelas') === selectedKelas &&
        (s.ketunaan || 'Umum') === selectedKetunaan
    );
  }, [students, selectedJenjang, selectedKelas, selectedKetunaan]);

  // Calculate Student Stats
  const studentStats = useMemo(() => {
    if (!selectedStudent) return { stars: 0, completed: 0, total: 0 };
    
    const stars = selectedStudent.skor_bintang || 0;
    // Count unique completed materials
    const completedSet = new Set(selectedStudent.history?.map(h => h.materi) || []);
    return {
      stars,
      completed: completedSet.size,
      total: materials.length // This might be just visible materials, but close enough
    };
  }, [selectedStudent, materials]);

  const completedMaterialIds = useMemo(() => {
    if (!selectedStudent || !selectedStudent.history) return new Set();
    return new Set(selectedStudent.history.map(h => h.materi));
  }, [selectedStudent]);

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    if (match && match[2] && match[2].length === 11) return match[2];
    return null;
  };
  
  const normalizeMediaUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const withSlash = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE_URL}${withSlash}`;
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

  // Form State
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'akademik',
    tipe_media: 'gambar_lokal',
    url_media: '',
    langkah_langkah: [''],
    panduan_ortu: '',
    jenjang: 'SD' // Replaced siswa with jenjang
  });
  const [file, setFile] = useState(null);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      // Fetch students list
      const studentsRes = await axios.get('/api/auth/students');
      setStudents(studentsRes.data);
      
      // If student is selected, fetch their materials
      if (selectedStudent) {
          const materialsRes = await axios.get(`/api/materi?siswa=${selectedStudent._id}`);
          setMaterials(materialsRes.data);
      } else {
          setMaterials([]);
      }
      
      setLoadingData(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoadingData(false);
    }
  };

  // Re-fetch when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
        fetchData();
    }
  }, [selectedStudent]);

  // Auto-fill Jenjang when switching to upload tab or when context changes
  useEffect(() => {
    if (activeTab === 'upload' && !isEdit && selectedJenjang) {
        setFormData(prev => ({ ...prev, jenjang: selectedJenjang }));
    }
  }, [activeTab, selectedJenjang, isEdit]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'guru') {
        navigate('/login');
        return;
      }
      // Initial fetch only for students list
      axios.get('/api/auth/students').then(res => {
          setStudents(res.data);
          setLoadingData(false);
      }).catch(err => {
          console.error("Error fetching students:", err);
          if (err.response && err.response.status === 401) {
             navigate('/login');
          }
          setLoadingData(false);
      });
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate Jenjang is selected
    if (!formData.jenjang) {
        toast.error("Silakan pilih jenjang terlebih dahulu.");
        return;
    }

    const toastId = toast.loading(isEdit ? 'Menyimpan perubahan...' : 'Sedang mengupload...');

    try {
      const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
      if (formData.tipe_media === 'video_youtube' || formData.tipe_media === 'link_eksternal') {
        const vid = formData.tipe_media === 'video_youtube' ? getYoutubeId(formData.url_media) : true;
        if (!vid && formData.tipe_media === 'video_youtube') {
          toast.error('Link YouTube tidak valid. Gunakan URL penuh seperti https://www.youtube.com/watch?v=...', { id: toastId });
          return;
        }
        if (!formData.url_media && formData.tipe_media === 'link_eksternal') {
            toast.error('Link Materi tidak boleh kosong.', { id: toastId });
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
            toast.error(`Ukuran video terlalu besar (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maksimal 100MB.`, { id: toastId });
            return;
          }
        }
      } else if (formData.tipe_media === 'dokumen' || formData.tipe_media === 'ppt') {
        if (!file && !isEdit) {
            toast.error('File dokumen belum dipilih.', { id: toastId });
            return;
        }
        if (file) {
            // Validasi Khusus PPTX (Max 25MB)
            if (formData.tipe_media === 'ppt') {
                const MAX_PPT_SIZE = 25 * 1024 * 1024; // 25MB
                if (file.size > MAX_PPT_SIZE) {
                    toast.error(`Ukuran file PPT terlalu besar (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maksimal 25MB.`, { id: toastId });
                    return;
                }
            } else {
                // Validasi Dokumen Lain (Max 100MB)
                if (file.size > MAX_VIDEO_SIZE) {
                    toast.error(`Ukuran dokumen terlalu besar (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maksimal 100MB.`, { id: toastId });
                    return;
                }
            }
        }
      }
      const data = new FormData();
      data.append('judul', formData.judul);
      data.append('kategori', formData.kategori);
      data.append('jenjang', formData.jenjang); // Append Jenjang
      data.append('tipe_media', formData.tipe_media);
      data.append('panduan_ortu', formData.panduan_ortu);
      
      // Validasi Ukuran File (General Safety Net)
      if (file && file.size > 100 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar! Maksimal 100MB.', { id: toastId });
        return;
      }

      // Optional: Assign to selected student if present (Legacy support, but primarily use Jenjang)
      if (selectedStudent) {
          data.append('siswa', selectedStudent._id);
      }
      
      const stepsArray = formData.langkah_langkah.split('\n').filter(step => step.trim() !== '');
      stepsArray.forEach(step => data.append('langkah_langkah', step));

      if (formData.tipe_media === 'video_youtube' || formData.tipe_media === 'link_eksternal') {
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
        
        // Jika Link Eksternal atau Dokumen atau PPT, tidak perlu otomatis ke pembuat kuis
        if (formData.tipe_media === 'link_eksternal' || formData.tipe_media === 'dokumen' || formData.tipe_media === 'ppt') {
             toast.success('Materi berhasil disimpan!', { id: toastId });
             // Reset Form
             setFile(null);
             setFormData({
                judul: '',
                kategori: 'akademik',
                jenjang: selectedJenjang || 'SD', // Keep current student jenjang
                tipe_media: 'gambar_lokal',
                url_media: '',
                panduan_ortu: '',
                langkah_langkah: ''
             });
             setActiveTab('materi');
        } else {
             toast.success('Materi berhasil diupload! Mengalihkan ke pembuat kuis...', { id: toastId });
             setTimeout(() => {
                navigate(`/manage-quiz/${response.data._id}`);
             }, 1000);
        }
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
      jenjang: materi.jenjang || 'SD', // Load existing jenjang
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
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
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
          {/* Student List (Home) */}
          <SidebarItem 
            label="Daftar Siswa" 
            iconEl={<Users size={20} />} 
            active={!selectedStudent} 
            onClick={() => { 
                setSelectedStudent(null); 
                setActiveTab('students'); 
                setIsSidebarOpen(false); 
            }}
          />

          {/* Context-aware items */}
          {selectedStudent && (
            <>
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Menu Siswa
                </div>
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
                        jenjang: selectedJenjang || 'SD',
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
            </>
          )}
          
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
              <div className="flex flex-wrap gap-1 mt-1">
                {user?.posisi && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs font-bold">{user.posisi}</span>
                )}
                {user?.mata_pelajaran && (
                  <span className="bg-blue-100 text-brand-blue px-2 py-0.5 rounded-lg text-xs font-bold">{user.mata_pelajaran}</span>
                )}
              </div>
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
          
          {/* View: Drill-down Flow (Default) */}
          {!selectedStudent && (
             <div className="space-y-6 animate-fadeIn">
               {/* Breadcrumb & Header */}
               <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Users className="text-brand-blue" /> Manajemen Siswa
                  </h2>
                  
                  {/* Breadcrumb Navigation */}
                  <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                      <button 
                          onClick={() => { setViewState('KETUNAAN_SELECT'); setSelectedKetunaan(null); setSelectedJenjang(null); setSelectedKelas(null); }}
                          className={`font-bold transition ${viewState === 'KETUNAAN_SELECT' ? 'text-brand-blue' : 'text-gray-500 hover:text-brand-blue'}`}
                      >
                          Ketunaan
                      </button>
                      {selectedKetunaan && (
                          <>
                            <ChevronRight size={14} className="text-gray-400" />
                            <button 
                                onClick={() => { setViewState('JENJANG_SELECT'); setSelectedJenjang(null); setSelectedKelas(null); }}
                                className={`font-bold transition ${viewState === 'JENJANG_SELECT' ? 'text-brand-blue' : 'text-gray-500 hover:text-brand-blue'}`}
                            >
                                {selectedKetunaan}
                            </button>
                          </>
                      )}
                      {selectedJenjang && (
                          <>
                              <ChevronRight size={14} className="text-gray-400" />
                              <button 
                                  onClick={() => { setViewState('KELAS_SELECT'); setSelectedKelas(null); }}
                                  className={`font-bold transition ${viewState === 'KELAS_SELECT' ? 'text-brand-blue' : 'text-gray-500 hover:text-brand-blue'}`}
                              >
                                  {selectedJenjang}
                              </button>
                          </>
                      )}
                      {selectedKelas && (
                          <>
                              <ChevronRight size={14} className="text-gray-400" />
                              <span className="font-bold text-brand-blue">{selectedKelas}</span>
                          </>
                      )}
                  </div>
               </div>

               {/* Level 0: Ketunaan Selection */}
               {viewState === 'KETUNAAN_SELECT' && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {availableKetunaan.length === 0 ? (
                            <div className="col-span-full bg-white p-12 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
                                <p className="text-gray-500 text-lg">Belum ada data ketunaan siswa.</p>
                            </div>
                       ) : (
                           availableKetunaan.map(ketunaan => (
                               <button
                                   key={ketunaan}
                                   onClick={() => { setSelectedKetunaan(ketunaan); setViewState('JENJANG_SELECT'); }}
                                   className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-blue transition flex flex-col items-center justify-center gap-4 group h-64"
                               >
                                   <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition duration-300">
                                       <Users size={48} />
                                   </div>
                                   <div className="text-center">
                                       <h3 className="text-xl font-bold text-gray-800">{ketunaan}</h3>
                                       <p className="text-gray-500 font-medium">
                                           {students.filter(s => (s.ketunaan || 'Umum') === ketunaan).length} Siswa
                                       </p>
                                   </div>
                               </button>
                           ))
                       )}
                   </div>
               )}

               {/* Level 1: Jenjang Selection */}
               {viewState === 'JENJANG_SELECT' && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {availableJenjang.map(jenjang => (
                           <button
                               key={jenjang}
                               onClick={() => { setSelectedJenjang(jenjang); setViewState('KELAS_SELECT'); }}
                               className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-blue transition flex flex-col items-center justify-center gap-4 group h-64"
                           >
                               <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-brand-blue group-hover:scale-110 transition duration-300">
                                   <span className="text-3xl font-bold">{jenjang}</span>
                               </div>
                               <div className="text-center">
                                   <h3 className="text-xl font-bold text-gray-800">Jenjang {jenjang}</h3>
                                   <p className="text-gray-500 font-medium">
                                       {students.filter(s => (s.jenjang || 'SD') === jenjang).length} Siswa
                                   </p>
                               </div>
                           </button>
                       ))}
                   </div>
               )}

               {/* Level 2: Kelas Selection */}
               {viewState === 'KELAS_SELECT' && (
                   <div className="space-y-4">
                       <h3 className="text-lg font-bold text-gray-700 mb-4">Pilih Kelas di Jenjang {selectedJenjang}</h3>
                       {availableKelas.length === 0 ? (
                           <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
                               <p className="text-gray-500 text-lg">Belum ada kelas terdaftar di jenjang ini.</p>
                           </div>
                       ) : (
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                               {availableKelas.map(kelas => (
                                   <button
                                       key={kelas}
                                       onClick={() => { setSelectedKelas(kelas); setViewState('STUDENT_LIST'); }}
                                       className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-blue transition text-left group"
                                   >
                                       <div className="flex justify-between items-start mb-3">
                                           <div className="bg-blue-100 text-brand-blue px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                               Kelas
                                           </div>
                                           <Users size={20} className="text-gray-300 group-hover:text-brand-blue transition" />
                                       </div>
                                       <h3 className="text-2xl font-bold text-gray-800 mb-2">{kelas}</h3>
                                       <p className="text-sm text-gray-500 font-medium">
                                           {students.filter(s => (s.jenjang || 'SD') === selectedJenjang && (s.kelas || 'Belum Ada Kelas') === kelas).length} Siswa
                                       </p>
                                   </button>
                               ))}
                           </div>
                       )}
                   </div>
               )}

               {/* Level 3: Student List */}
               {viewState === 'STUDENT_LIST' && (
                   <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Daftar Siswa - {selectedKelas} ({selectedJenjang} - {selectedKetunaan})</h3>
                        {studentsInClass.length === 0 ? (
                             <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
                                <p className="text-gray-500 text-lg">Tidak ada siswa di kelas ini.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {studentsInClass.map(student => (
                                    <button 
                                        key={student._id} 
                                        onClick={() => { 
                                            setSelectedStudent(student); 
                                            setActiveTab('materi');
                                        }}
                                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-blue hover:shadow-md transition cursor-pointer flex items-center gap-4 text-left group"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
                                            {student.nama.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 truncate">{student.nama}</h4>
                                            <p className="text-xs text-gray-500">{student.username}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                                    <Star size={10} fill="currentColor"/> {student.skor_bintang || 0}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-300 group-hover:text-brand-blue" />
                                    </button>
                                ))}
                            </div>
                        )}
                   </div>
               )}
            </div>
          )}

          {/* View: Selected Student Context */}
          {selectedStudent && (
            <>
                {/* Student Header Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => { setSelectedStudent(null); setActiveTab('students'); }}
                                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
                            >
                                <ChevronDown className="rotate-90" size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{selectedStudent.nama}</h1>
                                <div className="flex gap-2 mt-1 mb-1">
                                    <span className="bg-blue-100 text-brand-blue px-2 py-0.5 rounded text-xs font-bold">{selectedStudent.jenjang || 'SD'}</span>
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">{selectedStudent.kelas || 'Belum Ada Kelas'}</span>
                                </div>
                                <p className="text-gray-500 text-sm">Mengelola Materi & Progress Siswa</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="text-center px-4 border-r border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Bintang</p>
                                <p className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                                    <Star size={20} fill="currentColor" /> {studentStats.stars}
                                </p>
                            </div>
                            <div className="text-center px-4">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Materi Selesai</p>
                                <p className="text-2xl font-bold text-brand-blue flex items-center justify-center gap-1">
                                    <BookOpen size={20} /> {studentStats.completed} <span className="text-gray-300 text-lg">/ {studentStats.total}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {activeTab === 'materi' && (
            <div className="space-y-6">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutDashboard className="text-brand-blue" /> Manajemen Materi & Kuis
                    </h2>
                    <button 
                        onClick={() => {
                            setEditMateri(null);
                            setFormData({
                                judul: '',
                                kategori: 'akademik',
                                jenjang: selectedJenjang || 'SD',
                                tipe_media: 'video_youtube',
                                url_media: '',
                                panduan_ortu: '',
                                langkah_langkah: ''
                            });
                            setFile(null);
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
                         onClick={() => {
                            setEditMateri(null);
                            setFormData({
                                judul: '',
                                kategori: 'akademik',
                                jenjang: selectedJenjang || 'SD',
                                tipe_media: 'video_youtube',
                                url_media: '',
                                panduan_ortu: '',
                                langkah_langkah: ''
                            });
                            setFile(null);
                            setActiveTab('upload');
                         }}
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
                                    {/* Completion & Score Badge */}
                                    {completedMaterialIds.has(m._id) && (
                                        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                                            <div className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
                                                <CheckCircle size={12} /> Selesai
                                            </div>
                                            {(() => {
                                                const historyItem = selectedStudent?.history?.find(h => h.materi === m._id);
                                                const score = historyItem ? historyItem.skor : 0;
                                                if (score > 0) {
                                                    return (
                                                        <div className="bg-yellow-400 text-white px-2 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                                                            <Star size={12} fill="currentColor" /> {score} Bintang
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}
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
                                          src={normalizeMediaUrl(m.url_media)}
                                          className="w-full h-full object-cover"
                                          preload="metadata"
                                          muted
                                          playsInline
                                          onLoadedMetadata={(e) => {
                                            try { e.target.currentTime = 0.001; } catch (e2) { console.warn(e2); }
                                          }}
                                        />
                                    ) : m.tipe_media === 'dokumen' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50 text-orange-400">
                                           <FileText size={48} strokeWidth={1.5} />
                                           <span className="mt-2 font-bold text-xs uppercase tracking-wider">Dokumen</span>
                                        </div>
                                    ) : m.tipe_media === 'ppt' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50 text-orange-500">
                                           <BookOpen size={48} strokeWidth={1.5} />
                                           <span className="mt-2 font-bold text-xs uppercase tracking-wider">Presentasi</span>
                                        </div>
                                    ) : m.tipe_media === 'link_eksternal' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 text-purple-400">
                                           <LinkIcon size={48} strokeWidth={1.5} />
                                           <span className="mt-2 font-bold text-xs uppercase tracking-wider">Link Eksternal</span>
                                        </div>
                                    ) : (
                                        <img
                                          src={normalizeMediaUrl(m.url_media)}
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
                                   <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                       {m.tipe_media === 'video_youtube' ? 'YouTube' : m.tipe_media === 'video_lokal' ? 'Video Lokal' : m.tipe_media === 'link_eksternal' ? 'Link Eksternal' : m.tipe_media === 'ppt' ? 'Presentasi' : m.tipe_media === 'dokumen' ? 'Dokumen' : 'Gambar'}
                                       <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
                                       {new Date(m.createdAt).toLocaleDateString('id-ID')}
                                   </p>

                                   {/* Document Preview Link */}
                                   {(m.tipe_media === 'dokumen' || m.tipe_media === 'ppt') && (
                                       <button 
                                           onClick={() => handlePreview(m)}
                                           className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 mb-4 transition"
                                       >
                                           {m.tipe_media === 'ppt' ? <BookOpen size={14} /> : <FileText size={14} />} 
                                           {m.tipe_media === 'ppt' ? 'Lihat Preview PPT' : 'Lihat Dokumen'}
                                       </button>
                                   )}
                                   
                                   {/* YouTube Link Preview */}
                                   {m.tipe_media === 'video_youtube' && (
                                       <a 
                                           href={m.url_media} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 mb-4 transition"
                                       >
                                           <Video size={14} /> Tonton di YouTube
                                       </a>
                                   )}
                                   
                                   {/* External Link Button */}
                                   {m.tipe_media === 'link_eksternal' && (
                                       <a 
                                           href={m.url_media} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 mb-4 transition"
                                       >
                                           <LinkIcon size={14} /> Buka Link
                                       </a>
                                   )}

                                   {/* Student History Detail */}
                                   {(() => {
                                       const historyItem = selectedStudent?.history?.find(h => h.materi === m._id);
                                       if (historyItem && historyItem.riwayat_percobaan && historyItem.riwayat_percobaan.length > 0) {
                                           return (
                                               <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                                   <div className="flex justify-between items-center mb-2">
                                                       <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Riwayat Pengerjaan</span>
                                                       <span className="text-xs font-bold bg-white text-brand-blue px-2 py-0.5 rounded-full border border-blue-100">
                                                           {historyItem.riwayat_percobaan.length}x Percobaan
                                                       </span>
                                                   </div>
                                                   <div className="max-h-24 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                                                       {historyItem.riwayat_percobaan.slice().reverse().map((attempt, idx) => (
                                                           <div key={idx} className="flex justify-between items-center text-xs bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm">
                                                               <span className="text-gray-500">
                                                                   {new Date(attempt.tanggal).toLocaleDateString('id-ID', {
                                                                       day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'
                                                                   })}
                                                               </span>
                                                               <span className={`font-bold flex items-center gap-1 ${attempt.skor > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                                                                   <Star size={10} fill="currentColor" /> {attempt.skor}
                                                               </span>
                                                           </div>
                                                       ))}
                                                   </div>
                                               </div>
                                           );
                                       }
                                       return null;
                                   })()}
                                   
                                   <div className="flex items-center gap-2 mt-4">
                                       <button 
                                           onClick={() => handleEditClick(m)}
                                           className="flex-1 bg-blue-50 text-brand-blue py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-1"
                                       >
                                           <Edit size={16} /> Edit
                                       </button>
                                       <button 
                                           onClick={() => handleDelete(m._id)}
                                           className="flex-1 bg-red-50 text-red-500 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition flex items-center justify-center gap-1"
                                       >
                                           <Trash size={16} /> Hapus
                                       </button>
                                   </div>
                                   {m.tipe_media !== 'link_eksternal' && (
                                       <button 
                                            onClick={() => navigate(`/manage-quiz/${m._id}`)}
                                            className="w-full mt-2 border border-brand-blue text-brand-blue py-2 rounded-lg font-bold text-sm hover:bg-brand-blue hover:text-white transition"
                                       >
                                            <MessageSquare size={16} className="inline mr-1" /> Kelola Kuis
                                       </button>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
               
               {filteredMaterials.length > 0 && (
                   <div className="flex items-center justify-center gap-2 mt-8">
                       <button
                           onClick={() => setPage(p => Math.max(1, p - 1))}
                           disabled={page === 1}
                           className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                       >
                           Sebelumnya
                       </button>
                       <span className="text-sm text-gray-600 px-2">
                           Halaman {page} dari {totalPages}
                       </span>
                       <button
                           onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                           disabled={page >= totalPages}
                           className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                       >
                           Selanjutnya
                       </button>
                   </div>
               )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Upload className="text-brand-blue" /> {isEdit ? 'Edit Materi' : 'Upload Materi Baru'}
              </h2>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                {/* Warning Box */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-sm text-yellow-800">
                    <p className="font-bold mb-1">Perhatian Guru:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Video YouTube:</strong> Gunakan link lengkap (contoh: https://www.youtube.com/watch?v=...)</li>
                        <li><strong>Video Lokal:</strong> Maksimal 25MB. Format MP4/WebM. Pastikan koneksi internet stabil saat upload.</li>
                    </ul>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Judul */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Judul Materi</label>
                    <input
                      type="text"
                      name="judul"
                      value={formData.judul}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                      placeholder="Contoh: Belajar Berhitung 1-10"
                      required
                    />
                  </div>

                  {/* Kategori, Jenjang, Tipe Media (3 Column Grid) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Kategori */}
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Kategori</label>
                      <div className="relative">
                        <select
                          name="kategori"
                          value={formData.kategori}
                          onChange={handleInputChange}
                          className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition bg-white"
                        >
                          <option value="akademik">Akademik</option>
                          <option value="vokasi">Vokasional</option>
                          <option value="lifeskill">Bina Diri</option>
                        </select>
                        <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Jenjang */}
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Jenjang</label>
                      <div className="relative">
                        <select
                          name="jenjang"
                          value={formData.jenjang}
                          onChange={handleInputChange}
                          className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition bg-white"
                          required
                        >
                          <option value="TK">TK</option>
                          <option value="SD">SD</option>
                          <option value="SMP">SMP</option>
                          <option value="SMA">SMA</option>
                        </select>
                        <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedJenjang ? `Siswa ini berada di jenjang ${selectedJenjang}` : 'Pilih jenjang target'}
                      </p>
                    </div>
                    
                    {/* Tipe Media */}
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Tipe Media</label>
                      <div className="relative">
                        <select
                          name="tipe_media"
                          value={formData.tipe_media}
                          onChange={handleInputChange}
                          className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition bg-white"
                        >
                          <option value="gambar_lokal">Gambar (Upload)</option>
                          <option value="video_youtube">Video YouTube</option>
                          <option value="video_lokal">Video Lokal (Upload)</option>
                          <option value="dokumen">Dokumen (PDF/Word/Excel)</option>
                          <option value="ppt">Presentasi (PPT/PPTX)</option>
                          <option value="link_eksternal">Link Eksternal (Quizizz/Lainnya)</option>
                        </select>
                        <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Info Penugasan Siswa */}
                  {selectedStudent && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
                          <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold shadow-sm">
                              {selectedStudent.nama.charAt(0)}
                          </div>
                          <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Ditugaskan Khusus Untuk</p>
                              <p className="text-gray-800 font-bold text-lg">{selectedStudent.nama}</p>
                          </div>
                          <div className="ml-auto flex flex-col items-end">
                             <span className="bg-white text-brand-blue text-xs px-2 py-1 rounded-lg font-bold border border-blue-100 shadow-sm mb-1">
                                 {selectedStudent.jenjang || 'Umum'}
                             </span>
                             {selectedStudent.ketunaan && (
                                <span className="text-xs text-gray-500 font-medium">
                                    {selectedStudent.ketunaan}
                                </span>
                             )}
                          </div>
                      </div>
                  )}

                  {/* Media Input */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    {(formData.tipe_media === 'video_youtube' || formData.tipe_media === 'link_eksternal') ? (
                      <div>
                        <label className="block text-gray-700 font-bold mb-2">
                            {formData.tipe_media === 'video_youtube' ? 'Link YouTube' : 'Link Materi Eksternal'}
                        </label>
                        <input
                          type="url"
                          name="url_media"
                          value={formData.url_media}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                          placeholder={formData.tipe_media === 'video_youtube' ? "https://www.youtube.com/watch?v=..." : "https://quizizz.com/..."}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            {formData.tipe_media === 'video_youtube' ? 'Pastikan link video publik dan valid.' : 'Masukkan link lengkap ke materi/kuis eksternal.'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-gray-700 font-bold mb-2">
                          {formData.tipe_media === 'video_lokal' ? 'Upload Video' : 
                           formData.tipe_media === 'dokumen' ? 'Upload Dokumen' : 
                           formData.tipe_media === 'ppt' ? 'Upload Presentasi (PPT)' :
                           'Upload Gambar'}
                        </label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-brand-blue mb-1">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / (1024*1024)).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <>
                                        {formData.tipe_media === 'video_lokal' ? <Video className="text-gray-400 mb-2" size={32} /> : 
                                         formData.tipe_media === 'dokumen' ? <FileText className="text-gray-400 mb-2" size={32} /> :
                                         formData.tipe_media === 'ppt' ? <BookOpen className="text-gray-400 mb-2" size={32} /> :
                                         <ImageIcon className="text-gray-400 mb-2" size={32} />}
                                        <p className="mb-1 text-sm text-gray-500"><span className="font-bold">Klik untuk upload</span> atau drag and drop</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {formData.tipe_media === 'video_lokal' ? 'MP4, WebM (Max 100MB)' : 
                                           formData.tipe_media === 'dokumen' ? 'PDF, DOCX, XLSX (Max 100MB)' :
                                           formData.tipe_media === 'ppt' ? 'PPT, PPTX (Max 100MB)' :
                                           'JPG, PNG (Max 5MB)'}
                                        </p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" onChange={handleFileChange} accept={formData.tipe_media === 'video_lokal' ? "video/*" : formData.tipe_media === 'dokumen' ? ".pdf,.doc,.docx,.xls,.xlsx" : formData.tipe_media === 'ppt' ? ".ppt,.pptx" : "image/*"} />
                          </label>
                        </div>
                        {formData.tipe_media === 'video_lokal' && (
                          <p className="text-xs text-gray-500 mt-1">Format: MP4, MKV, AVI (Max 100MB). Disarankan menggunakan YouTube untuk video panjang.</p>
                        )}
                        
                        {/* Preview PPTX during Upload */}
                        {file && formData.tipe_media === 'ppt' && file.name.toLowerCase().endsWith('.pptx') && (
                             <div className="mt-4 border-t pt-4">
                                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <BookOpen size={16} /> Preview Tampilan Siswa:
                                </h3>
                                <div className="p-4 border rounded-lg bg-blue-50 text-blue-700 text-sm flex items-center gap-2">
                                    <AlertCircle size={20} />
                                    <span>
                                        Preview PPT akan tersedia setelah materi diupload (Menggunakan Microsoft Office Online Viewer).
                                    </span>
                                </div>
                             </div>
                        )}

                        {isEdit && !file && (
                            <p className="text-xs text-orange-500 mt-2 font-medium">
                                *Biarkan kosong jika tidak ingin mengubah media yang sudah ada.
                            </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Panduan Ortu */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Panduan untuk Orang Tua</label>
                    <textarea
                      name="panduan_ortu"
                      value={formData.panduan_ortu}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition h-24"
                      placeholder="Instruksi pendampingan..."
                    />
                  </div>

                  {/* Langkah-langkah */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Langkah-Langkah (Satu per baris)</label>
                    <textarea
                      name="langkah_langkah"
                      value={formData.langkah_langkah}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition h-32"
                      placeholder="1. Buka buku...&#10;2. Ambil pensil..."
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      {isEdit ? 'Simpan Perubahan' : 'Upload Materi'}
                    </button>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditMateri(null);
                                setActiveTab('materi');
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
                        >
                            Batal
                        </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
            </>
          )}

        </div>
      </main>

      <DocumentPreviewModal 
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        document={previewDocument}
        downloadUrl={previewDocument ? (previewDocument.url_media.startsWith('http') ? previewDocument.url_media : `${API_BASE_URL}/api/materi/download/${previewDocument._id}`) : '#'}
      />
    </div>
  );
};

export default TeacherDashboard;
