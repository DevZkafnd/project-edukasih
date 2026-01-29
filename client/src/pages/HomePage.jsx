import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Briefcase, Heart, MessageSquare, LogOut, Cloud, Sun, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import VoiceButton from '../components/VoiceButton';
import useAuth from '../hooks/useAuth';
import useAudio from '../hooks/useAudio';
import Logo from '../components/Logo';
import BackgroundDecorations from '../components/BackgroundDecorations';

const HomePage = () => {
  const { user, logout } = useAuth();
  const { playText, stopAll } = useAudio();

  // Auto-play audio with 1s delay to allow interaction (navigation) to register
  useEffect(() => {
    const timer = setTimeout(() => {
        playText("Halo! Selamat datang di EduKasih. Mau belajar apa hari ini?");
    }, 1000);

    return () => {
      clearTimeout(timer);
      stopAll();
    };
  }, [playText, stopAll]);

  const handleLogout = () => {
    stopAll();
    logout();
  };

  const categories = [
    { 
      id: 'akademik', 
      title: 'Belajar', 
      subtitle: 'Membaca & Berhitung',
      icon: <BookOpen size={64} className="text-white" />, 
      color: 'bg-brand-blue',
      voice: 'Ayo belajar membaca dan berhitung!'
    },
    { 
      id: 'vokasi', 
      title: 'Berkarya', 
      subtitle: 'Membuat Sesuatu',
      icon: <Briefcase size={64} className="text-white" />, 
      color: 'bg-brand-yellow',
      voice: 'Ayo membuat karya yang keren!'
    },
    { 
      id: 'lifeskill', 
      title: 'Mandiri', 
      subtitle: 'Kegiatan Sehari-hari',
      icon: <Heart size={64} className="text-white" />, 
      color: 'bg-brand-green',
      voice: 'Ayo belajar hidup mandiri!'
    }
  ];

  return (
    <div className="min-h-screen bg-blue-50/50 p-6 flex flex-col items-center relative font-comic">
      <BackgroundDecorations />

      <header className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-12 bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border-4 border-white gap-4 md:gap-0 transform hover:scale-[1.02] transition-transform duration-300">
        <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Logo className="w-16 h-16" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-brand-blue tracking-wide drop-shadow-sm" style={{ fontFamily: 'Comic Neue, cursive' }}>EduKasih</h1>
              <p className="text-gray-500 font-bold">Belajar Jadi Seru!</p>
            </div>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-4">
          {user ? (
            <>
              <div className="hidden sm:block text-right mr-2">
                <p className="text-sm text-gray-500 font-bold">Halo, Teman!</p>
                <p className="text-lg font-bold text-brand-blue">{user.nama}</p>
                <div className="flex gap-1 justify-end mt-1">
                  <span className="bg-blue-100 text-brand-blue px-2 py-0.5 rounded-lg text-xs font-bold border-2 border-blue-200">{user.jenjang || 'SD'}</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs font-bold border-2 border-green-200">{user.kelas || 'Belum Ada Kelas'}</span>
                </div>
              </div>
              <Link to="/forum" className="p-3 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 transition border-2 border-yellow-200" title="Forum Kelas">
                <MessageSquare size={24} />
              </Link>
              <button onClick={handleLogout} className="p-3 bg-red-100 text-red-500 rounded-full hover:bg-red-200 transition border-2 border-red-200" title="Keluar">
                <LogOut size={24} />
              </button>
            </>
          ) : (
            <Link to="/login" className="px-6 py-3 bg-brand-blue text-white rounded-full font-bold hover:bg-blue-600 text-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
              Masuk Yuk!
            </Link>
          )}
          <VoiceButton text="Bantuan" audioScript="Halo! Selamat datang di EduKasih. Mau belajar apa hari ini?" />
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.2, type: "spring", bounce: 0.5 }}
            whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }}
            whileTap={{ scale: 0.95 }}
            className="h-full"
          >
            <Link to={`/belajar/${cat.id}`} className="group block h-full">
              <div className={`${cat.color} rounded-[2.5rem] p-8 flex flex-col items-center justify-center h-80 shadow-xl border-b-8 border-black/10 group-hover:border-white transition-all relative overflow-hidden`}>
                {/* Shine Effect */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shine" />
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

                <motion.div 
                  className="mb-6 bg-white/20 p-6 rounded-full backdrop-blur-sm border-4 border-white/30"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                >
                  {React.cloneElement(cat.icon, { size: undefined, className: "text-white w-24 h-24 drop-shadow-md" })}
                </motion.div>
                
                <h2 className="text-4xl font-black text-white text-center mb-2 drop-shadow-lg tracking-wider" style={{ fontFamily: 'Comic Neue, cursive' }}>
                  {cat.title}
                </h2>
                <p className="text-brand-blue font-bold text-lg text-center bg-white px-6 py-2 rounded-full shadow-md transform group-hover:scale-110 transition-transform">
                  {cat.subtitle}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </main>

      <footer className="mt-16 text-gray-400 text-center font-bold">
        <p>© 2025 EduKasih - Teman Belajar Kita Semua</p>
      </footer>
    </div>
  );
};

export default HomePage;
