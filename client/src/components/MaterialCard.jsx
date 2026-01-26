import React, { useRef, useEffect } from 'react';
import { PlayCircle, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const MaterialCard = ({ materi, index = 0 }) => {
  const getThumbnail = (url) => {
    if (materi.tipe_media === 'video_youtube') {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = match && match[2] && match[2].length === 11 ? match[2] : null;
      return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : 'https://placehold.co/600x400?text=Video';
    } else {
      // Ensure URL is absolute path if it's a local file
      const safeUrl = url.startsWith('/') ? url : `/${url}`;
      return `${API_BASE_URL}${safeUrl}`;
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://placehold.co/600x400?text=Gambar+Rusak';
  };

  const videoRef = useRef(null);
  useEffect(() => {
    if (materi.tipe_media === 'video_lokal' && videoRef.current) {
      const v = videoRef.current;
      const onLoaded = () => {
        try {
          v.currentTime = 0.001;
        } catch (e) {
          console.warn(e);
        }
      };
      v.addEventListener('loadedmetadata', onLoaded);
      return () => v.removeEventListener('loadedmetadata', onLoaded);
    }
  }, [materi]);

  // Color mapping based on category (optional fallback if category is unknown)
  const borderColor = 
    materi.kategori === 'akademik' ? 'border-brand-blue' :
    materi.kategori === 'vokasi' ? 'border-brand-yellow' :
    'border-brand-green';

  return (
    <Link to={`/materi/${materi._id}`} className="block h-full">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
        whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 1 : -1, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
        whileTap={{ scale: 0.95 }}
        className={`bg-white rounded-3xl overflow-hidden shadow-lg border-b-8 ${borderColor} h-full flex flex-col`}
      >
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {materi.tipe_media === 'video_lokal' ? (
            <video
              ref={videoRef}
              src={`${API_BASE_URL}${materi.url_media.startsWith('/') ? materi.url_media : '/' + materi.url_media}`}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
              playsInline
            />
          ) : (
            <img 
              src={getThumbnail(materi.url_media)} 
              alt={materi.judul} 
              className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
              onError={handleImageError}
            />
          )}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md">
            {materi.tipe_media === 'video_youtube' || materi.tipe_media === 'video_lokal' ? (
              <PlayCircle className="text-red-500" size={28} />
            ) : (
              <ImageIcon className="text-brand-blue" size={28} />
            )}
          </div>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 text-xs font-bold text-white rounded-full uppercase tracking-wide ${
                materi.kategori === 'akademik' ? 'bg-brand-blue' :
                materi.kategori === 'vokasi' ? 'bg-brand-yellow text-gray-800' :
                'bg-brand-green text-gray-800'
            }`}>
              {materi.kategori === 'akademik' ? 'Belajar' :
               materi.kategori === 'vokasi' ? 'Berkarya' : 'Mandiri'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-700 leading-tight mb-2 line-clamp-2" style={{ fontFamily: 'Comic Neue, cursive' }}>
            {materi.judul}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
};

export default MaterialCard;
