import React from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const QuizCard = ({ question, currentQuestionIndex, onAnswer, selectedAnswer, correctAnswer, stats }) => {
  // Grid layout for answers
  return (
    <div className="w-full max-w-4xl mx-auto font-comic">
      {/* Question */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-[2rem] p-8 shadow-xl mb-8 border-b-8 border-brand-blue/20 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-yellow via-brand-green to-brand-blue" />
        <h2 className="text-3xl font-bold text-brand-blue mb-6 leading-relaxed" style={{ fontFamily: 'Comic Neue, cursive' }}>{question.teks_pertanyaan}</h2>
        {question.gambar_soal && (
          <img 
            src={question.gambar_soal.startsWith('/') ? `${API_BASE_URL}${question.gambar_soal}` : `${API_BASE_URL}/${question.gambar_soal}`} 
            alt="Soal" 
            className="mx-auto rounded-2xl max-h-64 object-contain shadow-md border-4 border-gray-100" 
          />
        )}
      </motion.div>

      {/* Answer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {question.opsi_jawaban.map((opsi, index) => {
          let buttonClass = "bg-white border-b-8 border-gray-200 text-gray-700 hover:border-brand-blue hover:-translate-y-1";
          let icon = null;
          let progressBar = null;

          // Visual Feedback Logic
          if (selectedAnswer !== null) {
            if (index === correctAnswer) {
              buttonClass = "bg-green-100 border-b-8 border-green-500 text-green-800 scale-105 shadow-none translate-y-1";
              icon = <Check size={40} className="absolute top-2 right-2 text-green-600 drop-shadow-sm" />;
            } else if (index === selectedAnswer && index !== correctAnswer) {
              buttonClass = "bg-red-100 border-b-8 border-red-500 text-red-800 shadow-none translate-y-1";
              icon = <X size={40} className="absolute top-2 right-2 text-red-600 drop-shadow-sm" />;
            } else {
              buttonClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed";
            }

          // Progress Bar Logic (Only show if answered)
          if (selectedAnswer !== null) {
              const hasStats = stats && stats[currentQuestionIndex] && stats[currentQuestionIndex].percentages;
              const percentage = hasStats && stats[currentQuestionIndex].percentages[index] !== undefined 
                ? stats[currentQuestionIndex].percentages[index] 
                : 0;

              // Show bar if we have stats OR if we want to show empty state
              // User wants to see "persentase", so even if 0% or no data, we should probably indicate it
              if (hasStats) {
                  progressBar = (
                    <div className="absolute bottom-0 left-0 w-full h-4 bg-gray-200 rounded-b-[2rem] overflow-hidden mt-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-blue-500"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                        {percentage}% Siswa Memilih Ini
                      </span>
                    </div>
                  );
              } else if (index === selectedAnswer) {
                   // Fallback for first user/no data: Show they are the first
                   progressBar = (
                    <div className="absolute bottom-0 left-0 w-full h-4 bg-gray-200 rounded-b-[2rem] overflow-hidden mt-2">
                         <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            Data belum tersedia (Siswa Pertama)
                         </span>
                    </div>
                   );
              }
          }
          }

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={selectedAnswer === null ? { scale: 1.02, rotate: index % 2 === 0 ? 1 : -1 } : {}}
              whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
              onClick={() => onAnswer(index)}
              disabled={selectedAnswer !== null}
              className={`relative p-8 rounded-[2rem] text-2xl font-bold shadow-lg transition-all flex items-center justify-center min-h-[140px] ${buttonClass}`}
            >
              {icon}
              {progressBar}
              {opsi.gambar ? (
                <img 
                  src={opsi.gambar.startsWith('/') ? `${API_BASE_URL}${opsi.gambar}` : `${API_BASE_URL}/${opsi.gambar}`} 
                  alt={`Jawaban ${index + 1}`} 
                  className="h-24 object-contain hover:scale-110 transition-transform mb-2" 
                />
              ) : (
                <span style={{ fontFamily: 'Comic Neue, cursive', marginBottom: progressBar ? '1rem' : '0' }}>{opsi.teks}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizCard;
