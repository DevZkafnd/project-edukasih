import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, PlayCircle, Info } from 'lucide-react';
import VideoPlayerWrapper from '../components/VideoPlayerWrapper';
import StepViewer from '../components/StepViewer';
import VoiceButton from '../components/VoiceButton';
import useAudio from '../hooks/useAudio';
import { API_BASE_URL } from '../config';

const MaterialDetailPage = () => {
  const { id } = useParams();
  const [materi, setMateri] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playText, stopAll } = useAudio();

  useEffect(() => {
    // Stop audio when unmounting
    return () => stopAll();
  }, [stopAll]);

  useEffect(() => {
    const fetchMateri = async () => {
      try {
        const response = await axios.get(`/api/materi/${id}`); 
        setMateri(response.data);
        setLoading(false);
        
        // Auto-play title after load
        setTimeout(() => {
          if (response.data) playText(response.data.judul);
        }, 1000);

      } catch (error) {
        console.error("Error fetching detail:", error);
        setLoading(false);
      }
    };
    fetchMateri();
  }, [id, playText]);

  if (loading) return <div className="p-10 text-center">Memuat...</div>;
  if (!materi) return <div className="p-10 text-center">Materi tidak ditemukan.</div>;

  const isVokasi = materi.kategori === 'vokasi' || materi.kategori === 'lifeskill';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={`/belajar/${materi.kategori}`} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={28} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 truncate flex-1">{materi.judul}</h1>
          <VoiceButton text="" audioScript={materi.judul} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Parent Guide Section */}
        {materi.panduan_ortu && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-r-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Info className="text-orange-500" size={28} />
              <h3 className="text-xl font-bold text-orange-700">Panduan Pendampingan (Info Ayah Bunda)</h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              {materi.panduan_ortu}
            </p>
          </div>
        )}

        {/* Video Section */}
        {materi.tipe_media === 'video_youtube' ? (
           <VideoPlayerWrapper url={materi.url_media} />
        ) : (materi.tipe_media === 'video_lokal' || /\.(mp4|mkv|avi|webm)$/i.test(materi.url_media)) ? (
           <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-brand-blue bg-black">
              <video 
                src={`${API_BASE_URL}${materi.url_media}`} 
                controls 
                className="w-full h-auto aspect-video"
              >
                Browser Anda tidak mendukung pemutar video.
              </video>
           </div>
        ) : (
           <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-brand-blue">
              <img src={`${API_BASE_URL}${materi.url_media}`} alt={materi.judul} className="w-full object-cover" />
           </div>
        )}

        {/* Content Section */}
        {isVokasi ? (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-2xl font-bold text-brand-blue">Langkah-langkah</h2>
                    <VoiceButton text="Baca Langkah" audioScript="Ikuti langkah-langkah berikut ini." />
                </div>
                {materi.langkah_langkah && materi.langkah_langkah.length > 0 ? (
                    <StepViewer steps={materi.langkah_langkah} />
                ) : (
                    <p className="text-gray-500 italic text-center">Belum ada langkah-langkah.</p>
                )}
            </div>
        ) : (
            <div className="bg-white rounded-3xl p-8 shadow-md border-2 border-brand-yellow/50">
                <h2 className="text-2xl font-bold text-brand-blue mb-4">Ayo Membaca</h2>
                <p className="text-xl leading-loose text-gray-700 font-medium">
                    {/* Placeholder text for academic if no content field exists yet. 
                        Maybe we should have added a 'deskripsi' or 'isi_materi' field?
                        For now, display generic text or title repetition.
                    */}
                    Mari kita pelajari tentang {materi.judul}. Perhatikan video di atas dengan seksama ya!
                </p>
            </div>
        )}

        {/* Quiz CTA */}
        <div className="pt-8 flex justify-center">
            <Link to={`/quiz/${id}`} className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-yellow to-brand-green rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <button className="relative bg-white text-brand-blue text-2xl font-bold py-4 px-12 rounded-full border-4 border-brand-blue flex items-center gap-3 hover:scale-105 transition-transform">
                    <PlayCircle size={32} />
                    Mulai Latihan
                </button>
            </Link>
        </div>

      </div>
    </div>
  );
};

export default MaterialDetailPage;
