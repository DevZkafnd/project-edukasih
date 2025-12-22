import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import MaterialCard from '../components/MaterialCard';
import VoiceButton from '../components/VoiceButton';
import useAudio from '../hooks/useAudio';

const MaterialListPage = () => {
  const { kategori } = useParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { playText, stopAll } = useAudio();

  // Map category to display name
  const categoryNames = useMemo(() => ({
    akademik: 'Akademik',
    vokasi: 'Vokasional',
    lifeskill: 'Life Skills'
  }), []);

  useEffect(() => {
    // Auto-play audio with 1s delay
    const timer = setTimeout(() => {
      playText(`Ini adalah halaman materi ${categoryNames[kategori] || kategori}. Pilih salah satu untuk mulai belajar.`);
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
        setError("Gagal memuat materi. Coba lagi nanti ya!");
        setLoading(false);
      }
    };

    if (kategori) {
      fetchMaterials();
    }
  }, [kategori]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
        <Link to="/" className="self-start sm:self-auto flex items-center gap-2 text-brand-blue font-bold text-xl hover:underline">
          <ArrowLeft size={28} className="sm:w-8 sm:h-8" />
          <span className="text-lg sm:text-xl">Kembali</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center order-first sm:order-none">
          Belajar {categoryNames[kategori] || kategori}
        </h1>
        <div className="self-end sm:self-auto">
            <VoiceButton 
            text="Bacakan" 
            audioScript={`Ini adalah halaman materi ${categoryNames[kategori] || kategori}. Pilih salah satu untuk mulai belajar.`} 
            />
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500 animate-pulse">Sedang memuat materi...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-2xl text-red-500">{error}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <p className="text-xl text-gray-400">Belum ada materi di kategori ini.</p>
            <p className="mt-2 text-gray-400">Minta Ibu Guru untuk upload materi baru ya!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {materials.map((materi) => (
              <MaterialCard key={materi._id} materi={materi} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MaterialListPage;
