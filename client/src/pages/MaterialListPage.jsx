import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import MaterialCard from '../components/MaterialCard';
import VoiceButton from '../components/VoiceButton';
import useAudio from '../hooks/useAudio';
import useAuth from '../hooks/useAuth';
import Logo from '../components/Logo';
import BackgroundDecorations from '../components/BackgroundDecorations';

const MaterialListPage = () => {
  const { kategori } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { playText, stopAll } = useAudio();

  // Map category to display name
  const categoryNames = useMemo(() => ({
    akademik: 'Belajar (Membaca & Berhitung)',
    vokasi: 'Berkarya (Keterampilan)',
    lifeskill: 'Mandiri (Kegiatan Sehari-hari)'
  }), []);

  useEffect(() => {
    // Auto-play audio with 1s delay
    const timer = setTimeout(() => {
      const displayCategory = categoryNames[kategori] || kategori;
      // Simplifed voice prompt for kids
      let voiceText = "";
      if (kategori === 'akademik') voiceText = "Ini halaman Belajar. Pilih pelajaran yang kamu suka!";
      else if (kategori === 'vokasi') voiceText = "Ini halaman Berkarya. Ayo kita buat sesuatu!";
      else if (kategori === 'lifeskill') voiceText = "Ini halaman Mandiri. Ayo belajar kegiatan sehari-hari!";
      else voiceText = `Ini adalah halaman materi ${displayCategory}. Pilih salah satu untuk mulai belajar.`;
      
      playText(voiceText);
    }, 1000);

    return () => {
      clearTimeout(timer);
      stopAll();
    };
  }, [kategori, categoryNames, playText, stopAll]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get(`/api/materi?kategori=${kategori}`);
        setMaterials(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.response && err.response.status === 401) {
            navigate('/login');
            return;
        }
        setError("Gagal memuat materi. Coba lagi nanti ya!");
        setLoading(false);
      }
    };

    if (kategori) {
      fetchMaterials();
    }
  }, [kategori, navigate]);

  return (
    <div className="min-h-screen bg-blue-50/50 p-6 font-comic relative">
      <BackgroundDecorations />
      
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 sm:gap-0 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-lg border-4 border-white">
        <Link to="/" className="self-start sm:self-auto flex items-center gap-2 text-brand-blue font-bold text-xl hover:underline group">
          <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition">
            <ArrowLeft size={28} className="sm:w-8 sm:h-8" />
          </div>
          <span className="text-lg sm:text-xl font-comic">Kembali</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-blue text-center order-first sm:order-none drop-shadow-sm" style={{ fontFamily: 'Comic Neue, cursive' }}>
          {categoryNames[kategori] || kategori}
        </h1>
        <div className="self-end sm:self-auto flex flex-col items-end gap-2">
            {user && (
              <div className="flex gap-1">
                  <span className="bg-blue-100 text-brand-blue px-2 py-0.5 rounded-lg text-xs font-bold border-2 border-blue-200">{user.jenjang || 'SD'}</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs font-bold border-2 border-green-200">{user.kelas || 'Belum Ada Kelas'}</span>
              </div>
            )}
            <VoiceButton 
            text="Bacakan" 
            audioScript={
                kategori === 'akademik' ? "Ini halaman Belajar. Pilih pelajaran yang kamu suka!" :
                kategori === 'vokasi' ? "Ini halaman Berkarya. Ayo kita buat sesuatu!" :
                kategori === 'lifeskill' ? "Ini halaman Mandiri. Ayo belajar kegiatan sehari-hari!" :
                `Ini adalah halaman materi ${categoryNames[kategori] || kategori}.`
            } 
            />
        </div>
      </header>

      <main className="max-w-6xl mx-auto relative z-10">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-2xl text-brand-blue font-bold animate-pulse">Sedang menyiapkan materi...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-2xl text-red-500 font-bold bg-white/80 p-4 rounded-xl inline-block">{error}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border-4 border-white max-w-2xl mx-auto">
            <p className="text-2xl text-gray-400 font-bold mb-2">Wah, belum ada materi di sini.</p>
            <p className="text-xl text-brand-blue">Minta Ibu Guru untuk upload materi baru ya!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {materials.map((materi, index) => (
              <MaterialCard key={materi._id} materi={materi} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MaterialListPage;
