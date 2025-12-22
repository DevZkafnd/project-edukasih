import React from 'react';
import { Check, X } from 'lucide-react';

const QuizCard = ({ question, onAnswer, selectedAnswer, correctAnswer }) => {
  // Grid layout for answers
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Question */}
      <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-b-8 border-brand-blue/20 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">{question.teks_pertanyaan}</h2>
        {question.gambar_soal && (
          <img src={question.gambar_soal} alt="Soal" className="mx-auto rounded-xl max-h-64 object-contain" />
        )}
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {question.opsi_jawaban.map((opsi, index) => {
          let buttonStyle = "bg-white border-4 border-gray-200 text-gray-700 hover:border-brand-blue";
          let icon = null;

          // Visual Feedback Logic
          if (selectedAnswer !== null) {
            if (index === correctAnswer) {
              buttonStyle = "bg-green-100 border-4 border-green-500 text-green-800 scale-105";
              icon = <Check size={32} className="absolute top-4 right-4 text-green-600" />;
            } else if (index === selectedAnswer && index !== correctAnswer) {
              buttonStyle = "bg-red-100 border-4 border-red-500 text-red-800 shake-animation";
              icon = <X size={32} className="absolute top-4 right-4 text-red-600" />;
            } else {
              buttonStyle = "bg-gray-100 border-4 border-transparent text-gray-400 opacity-50";
            }
          }

          return (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              disabled={selectedAnswer !== null}
              className={`relative p-8 rounded-2xl text-2xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center min-h-[120px] ${buttonStyle}`}
            >
              {icon}
              {opsi.gambar ? (
                <img src={opsi.gambar} alt={`Jawaban ${index + 1}`} className="h-20 object-contain" />
              ) : (
                <span>{opsi.teks}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizCard;
