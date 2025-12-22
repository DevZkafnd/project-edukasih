import React, { useRef, useEffect } from 'react';
import { PlayCircle, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const MaterialCard = ({ materi }) => {
  const getThumbnail = (url) => {
    if (materi.tipe_media === 'video_youtube') {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = match && match[2] && match[2].length === 11 ? match[2] : null;
      return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : 'https://placehold.co/600x400?text=Video';
    } else {
      return `${API_BASE_URL}${url}`;
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

  return (
    <Link to={`/materi/${materi._id}`} className="block">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-brand-blue/20">
        <div className="relative h-48 bg-gray-200">
          {materi.tipe_media === 'video_lokal' ? (
            <video
              ref={videoRef}
              src={`${API_BASE_URL}${materi.url_media}`}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
              playsInline
            />
          ) : (
            <img 
              src={getThumbnail(materi.url_media)} 
              alt={materi.judul} 
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          )}
          <div className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md">
            {materi.tipe_media === 'video_youtube' ? (
              <PlayCircle className="text-red-500" size={24} />
            ) : (
              <ImageIcon className="text-brand-blue" size={24} />
            )}
          </div>
        </div>
        
        <div className="p-4">
          <span className="inline-block px-3 py-1 text-xs font-bold text-white bg-brand-blue rounded-full mb-2 uppercase tracking-wide">
            {materi.kategori}
          </span>
          <h3 className="text-xl font-bold text-gray-800 leading-tight mb-2">
            {materi.judul}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default MaterialCard;
