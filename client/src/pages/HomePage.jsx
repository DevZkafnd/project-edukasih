import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Scissors, Calculator, MessageSquare, LogOut } from 'lucide-react';
import VoiceButton from '../components/VoiceButton';
import useAuth from '../hooks/useAuth';
import useAudio from '../hooks/useAudio';

const HomePage = () => {
  const { user, logout } = useAuth();
  const { playText, stopAll } = useAudio();

  // Auto-play audio with 1s delay
  useEffect(() => {
    const timer = setTimeout(() => {
      playText("Selamat datang di EduKasih. Pilih menu belajar kamu.");
    }, 1000);

    return () => {
      clearTimeout(timer);
      stopAll();
    };
  }, [playText, stopAll]);

  const categories = [
    { 
      id: 'akademik', 
      title: 'Berhitung', 
      icon: <Calculator size={64} className="text-white" />, 
      color: 'bg-brand-blue',
      voice: 'Ayo belajar berhitung!'
    },
    { 
      id: 'vokasi', 
      title: 'Belajar Masak', 
      icon: <Utensils size={64} className="text-white" />, 
      color: 'bg-brand-yellow',
      voice: 'Yuk belajar memasak yang enak!'
    },
    { 
      id: 'lifeskill', 
      title: 'Bina Diri', 
      icon: <Scissors size={64} className="text-white" />, 
      color: 'bg-brand-green',
      voice: 'Mari belajar merawat diri.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12 bg-white p-4 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold text-brand-blue">EduKasih</h1>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm font-medium text-gray-600 hidden sm:block">Halo, {user.nama}</span>
              <Link to="/forum" className="p-2 bg-blue-50 text-brand-blue rounded-full hover:bg-blue-100 transition" title="Forum Kelas">
                <MessageSquare size={24} />
              </Link>
              <button onClick={logout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition" title="Keluar">
                <LogOut size={24} />
              </button>
            </>
          ) : (
            <Link to="/login" className="px-5 py-2 bg-brand-blue text-white rounded-full font-bold hover:bg-blue-700 text-sm transition">
              Masuk
            </Link>
          )}
          <VoiceButton text="Bantuan" audioScript="Selamat datang di EduKasih. Pilih menu belajar kamu." />
        </div>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map((cat) => (
          <Link to={`/belajar/${cat.id}`} key={cat.id} className="group">
            <div className={`${cat.color} rounded-3xl p-8 flex flex-col items-center justify-center h-64 shadow-xl transform transition-transform group-hover:scale-105 border-4 border-transparent group-hover:border-white`}>
              <div className="mb-4 bg-white/20 p-4 rounded-full">
                {cat.icon}
              </div>
              <h2 className="text-3xl font-bold text-white text-center">{cat.title}</h2>
              {/* Optional: Add subtitle or voice button here if needed */}
            </div>
          </Link>
        ))}
      </main>

      <footer className="mt-12 text-gray-400 text-center">
        <p>© 2025 EduKasih - Belajar Jadi Menyenangkan</p>
      </footer>
    </div>
  );
};

export default HomePage;
