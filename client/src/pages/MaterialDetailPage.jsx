import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, PlayCircle, Info, Link as LinkIcon, FileText, BookOpen } from 'lucide-react';
import VideoPlayerWrapper from '../components/VideoPlayerWrapper';
import StepViewer from '../components/StepViewer';
import VoiceButton from '../components/VoiceButton';
import useAudio from '../hooks/useAudio';
import { API_BASE_URL } from '../config';
import Logo from '../components/Logo';
import BackgroundDecorations from '../components/BackgroundDecorations';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

const MaterialDetailPage = () => {
  const { id } = useParams();
  const [materi, setMateri] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playText, stopAll } = useAudio();
  const [showPreview, setShowPreview] = useState(false);

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
          if (response.data) {
            // Read "Materi: [Title]" to give context
            playText(`Materi: ${response.data.judul}`);
          }
        }, 1000);
      } catch (error) {
        console.error("Error fetching detail:", error);
        setLoading(false);
      }
    };
    fetchMateri();
  }, [id, playText]);

  if (loading) return <div className="p-10 text-center font-comic">Memuat...</div>;
  if (!materi) return <div className="p-10 text-center font-comic">Materi tidak ditemukan.</div>;

  const normalizeMediaUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const withSlash = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE_URL}${withSlash}`;
  };

  const isVokasi = materi.kategori === 'vokasi' || materi.kategori === 'lifeskill';

  return (
    <div className="min-h-screen bg-blue-50/50 pb-20 font-comic relative">
      <BackgroundDecorations />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-20 border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={`/belajar/${materi.kategori}`} className="p-2 rounded-full hover:bg-blue-100 transition">
            <ArrowLeft size={28} className="text-brand-blue" />
          </Link>
          <h1 className="text-2xl font-bold text-brand-blue truncate flex-1" style={{ fontFamily: 'Comic Neue, cursive' }}>{materi.judul}</h1>
          <VoiceButton text="" audioScript={materi.judul} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Parent Guide Section */}
        {materi.panduan_ortu && (
          <div className="bg-orange-50/90 backdrop-blur-sm border-l-4 border-orange-400 p-6 rounded-r-xl shadow-sm">
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
        {materi.tipe_media === 'link_eksternal' ? (
           <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-md border-4 border-brand-blue flex flex-col items-center justify-center text-center gap-6">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-brand-blue animate-bounce">
                  <LinkIcon size={64} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Materi Eksternal</h2>
              <p className="text-xl text-gray-600">
                  Materi ini ada di website lain. Klik tombol di bawah untuk membukanya.
              </p>
           </div>
        ) : materi.tipe_media === 'dokumen' || materi.tipe_media === 'ppt' ? (
           <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-md border-4 border-brand-blue flex flex-col items-center justify-center text-center gap-6">
              <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 animate-pulse">
                  <FileText size={64} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">{materi.tipe_media === 'ppt' ? 'Presentasi Materi' : 'Dokumen Materi'}</h2>
              <p className="text-xl text-gray-600">
                  Materi ini berupa {materi.tipe_media === 'ppt' ? 'presentasi slide' : 'dokumen'}. Klik tombol di bawah untuk melihatnya.
              </p>
           </div>
        ) : materi.tipe_media === 'video_youtube' ? (
           <VideoPlayerWrapper url={materi.url_media} />
        ) : (materi.tipe_media === 'video_lokal' || /\.(mp4|mkv|avi|webm)$/i.test(materi.url_media)) ? (
           <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-brand-blue bg-black">
              <video 
                src={normalizeMediaUrl(materi.url_media)} 
                controls 
                className="w-full h-auto aspect-video"
              >
                Browser Anda tidak mendukung pemutar video.
              </video>
           </div>
        ) : (
           <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-brand-blue">
              <img src={normalizeMediaUrl(materi.url_media)} alt={materi.judul} className="w-full object-cover" />
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
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-md border-2 border-brand-yellow/50">
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
        <div className="pt-8 flex flex-col items-center gap-4">
            {materi.tipe_media === 'link_eksternal' ? (
                <a 
                    href={materi.url_media} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                    <button className="relative bg-white text-brand-blue text-2xl font-bold py-4 px-12 rounded-full border-4 border-brand-blue flex items-center gap-3 hover:scale-105 transition-transform">
                        <LinkIcon size={32} />
                        Buka Materi / Kuis
                    </button>
                </a>
            ) : materi.tipe_media === 'dokumen' || materi.tipe_media === 'ppt' ? (
                <div className="flex flex-col gap-4 items-center">
                    <button 
                        onClick={() => setShowPreview(true)}
                        className="group relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                        <div className="relative bg-white text-orange-600 text-2xl font-bold py-4 px-12 rounded-full border-4 border-orange-500 flex items-center gap-3 hover:scale-105 transition-transform">
                            {materi.tipe_media === 'ppt' ? <BookOpen size={32} /> : <FileText size={32} />}
                            {materi.tipe_media === 'ppt' ? 'Lihat Preview PPT' : 'Lihat Dokumen'}
                        </div>
                    </button>
                    
                    {/* Optional: Allow Quiz for documents if teacher created one. For now, show it. */}
                    <Link to={`/quiz/${id}`} className="group relative scale-90 opacity-90 hover:opacity-100 hover:scale-95 transition">
                         <button className="bg-white text-brand-blue text-xl font-bold py-3 px-8 rounded-full border-2 border-brand-blue flex items-center gap-2">
                            <PlayCircle size={24} />
                            Kerjakan Kuis (Jika Ada)
                        </button>
                    </Link>
                </div>
            ) : (
                <Link to={`/quiz/${id}`} className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-yellow to-brand-green rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                    <button className="relative bg-white text-brand-blue text-2xl font-bold py-4 px-12 rounded-full border-4 border-brand-blue flex items-center gap-3 hover:scale-105 transition-transform">
                        <PlayCircle size={32} />
                        Mulai Latihan
                    </button>
                </Link>
            )}
        </div>

      </div>

      {materi && (
        <DocumentPreviewModal 
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            document={materi}
            downloadUrl={materi.url_media.startsWith('http') ? materi.url_media : `${API_BASE_URL}/api/materi/download/${materi._id}`}
        />
      )}
    </div>
  );
};

export default MaterialDetailPage;
