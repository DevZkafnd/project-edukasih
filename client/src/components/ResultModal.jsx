import React from 'react';
import { Star, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResultModal = ({ isOpen, score, total, onRetry }) => {
  if (!isOpen) return null;

  // Calculate Stars (Normalized to 3 Stars)
  const maxStars = 3;
  const starsEarned = total > 0 ? Math.round((score / total) * maxStars) : 0;
  
  let message = "";
  if (starsEarned === 3) {
    message = "Luar Biasa! Kamu Hebat!";
  } else if (starsEarned === 2) {
    message = "Bagus Sekali! Terus Belajar!";
  } else if (starsEarned === 1) {
    message = "Lumayan, Ayo Coba Lagi!";
  } else {
    message = "Jangan Menyerah, Kamu Pasti Bisa!";
  }

  return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border-8 border-brand-blue"
        >
          <h2 className="text-4xl font-bold text-brand-blue mb-8">Hasil Belajar</h2>
          
          <div className="flex justify-center gap-4 mb-8">
            {/* Display fixed 3 stars */}
            {[...Array(maxStars)].map((_, i) => (
              <div key={i}>
                <Star 
                  size={64}
                  fill={i < starsEarned ? "#FFD500" : "#E5E7EB"} 
                  className={i < starsEarned ? "text-brand-yellow drop-shadow-lg" : "text-gray-200"}
                />
              </div>
            ))}
          </div>

          <p className="text-2xl font-bold text-gray-700 mb-2">Benar: {score} dari {total} Soal</p>
          <p className="text-xl text-brand-blue font-medium mb-10">{message}</p>

          <div className="flex gap-4 justify-center">
            <button 
              onClick={onRetry}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition"
            >
              <RotateCcw size={24} />
              Ulangi
            </button>
            <Link 
              to="/"
              className="flex items-center gap-2 bg-brand-blue text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition shadow-lg"
            >
              <Home size={24} />
              Selesai
            </Link>
          </div>
        </div>
      </div>
  );
};

export default ResultModal;
