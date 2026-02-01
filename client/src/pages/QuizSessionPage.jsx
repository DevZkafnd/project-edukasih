import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { ArrowLeft } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useAudio from '../hooks/useAudio';
import QuizCard from '../components/QuizCard';
import ResultModal from '../components/ResultModal';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import BackgroundDecorations from '../components/BackgroundDecorations';

// Reliable Sound Effects (CDN)
const SOUND_CORRECT = 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/bonus.mp3';
const SOUND_WRONG = 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/explosion_01.mp3'; 
const SOUND_CLAP = 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.mp3'; // Placeholder for completion

const QuizSessionPage = () => {
  const { materiId } = useParams();
  const { user } = useAuth();
  const { playAudio, stopAll } = useAudio();
  const [kuis, setKuis] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0); // Count of correct answers (for UI only)
  const [userAnswers, setUserAnswers] = useState([]); // Array of indices for Backend
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await axios.get(`/api/kuis/${materiId}`);
      setKuis(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setLoading(false);
    }
  }, [materiId]);

  useEffect(() => {
    const fetchStats = async () => {
        if (kuis && kuis.materi) {
             try {
                 const response = await axios.get(`/api/kuis/stats/${kuis.materi}`);
                 setStats(response.data.stats);
                 setLeaderboard(response.data.leaderboard);
             } catch (error) {
                 console.error("Error fetching quiz stats:", error);
             }
        }
    };
    fetchStats();
  }, [kuis]);

  useEffect(() => {
    const id = setTimeout(fetchQuiz, 0);
    return () => {
      clearTimeout(id);
      stopAll();
    };
  }, [fetchQuiz, stopAll]);

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return; // Prevent double click

    setSelectedAnswer(index);
    
    // Track answers for backend
    const updatedAnswers = [...userAnswers, index];
    setUserAnswers(updatedAnswers);

    const isCorrect = index === kuis.pertanyaan[currentQuestionIndex].indeks_jawaban_benar;

    if (isCorrect) {
      try { playAudio(SOUND_CORRECT); } catch (e) { console.warn("Audio error:", e); }
      setScore(prev => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      try { playAudio(SOUND_WRONG); } catch (e) { console.warn("Audio error:", e); }
    }

    // Auto next after delay
    setTimeout(() => {
      if (currentQuestionIndex < kuis.pertanyaan.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        finishQuiz(updatedAnswers);
      }
    }, 2000);
  };

  const finishQuiz = (finalAnswers) => {
    setShowResult(true);
    try { playAudio(SOUND_CLAP); } catch (e) { console.warn("Audio error:", e); }
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 }
    });

    // Send score to backend
    submitScore(finalAnswers);
  };

  const submitScore = async (finalAnswers) => {
    if (!user) {
        console.warn("User not logged in, cannot save score.");
        return;
    }

    try {
        await axios.post('/api/kuis/submit', {
            siswaId: user.id || user._id, // Handle potential ID field difference
            kuisId: kuis._id,
            jawabanSiswa: finalAnswers
        });
        console.log("Score submitted successfully!");
        toast.success("Nilai kamu berhasil disimpan!");
    } catch (error) {
        console.error("Error submitting score:", error);
        toast.error("Gagal menyimpan nilai.");
    }
  };

  if (loading) return <div className="p-10 text-center font-comic">Memuat Kuis...</div>;
  if (!kuis) return <div className="p-10 text-center font-comic">Kuis belum tersedia untuk materi ini.</div>;

  return (
    <div className="min-h-screen bg-blue-50/50 flex flex-col items-center py-10 px-4 font-comic relative">
      <BackgroundDecorations />
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 relative z-10">
        <Link to={`/materi/${kuis.materi}`} className="p-2 rounded-full hover:bg-white transition bg-white/50 backdrop-blur-sm border-2 border-white shadow-sm">
            <ArrowLeft size={32} className="text-brand-blue" />
        </Link>
        <div className="bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border-4 border-brand-blue/20">
            <span className="text-xl font-bold text-brand-blue" style={{ fontFamily: 'Comic Neue, cursive' }}>
                Soal {currentQuestionIndex + 1} / {kuis.pertanyaan.length}
            </span>
        </div>
        <div className="w-12 flex justify-end">
            <Logo className="w-12 h-12 drop-shadow-sm" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <QuizCard 
            question={kuis.pertanyaan[currentQuestionIndex]}
            currentQuestionIndex={currentQuestionIndex}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={kuis.pertanyaan[currentQuestionIndex].indeks_jawaban_benar}
            stats={stats}
        />

        {/* Leaderboard Section - Only visible when answer is selected or at end, but user wants it visible during quiz? 
            "terlihat nama siswa ... yang paling nilainya bagus"
            Maybe show it always or after first answer? Let's show it below the card always to motivate them.
        */}
        {leaderboard.length > 0 && (
            <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-[2rem] p-6 shadow-xl border-4 border-brand-blue/20">
                <h3 className="text-2xl font-bold text-brand-blue mb-4 text-center" style={{ fontFamily: 'Comic Neue, cursive' }}>
                    🏆 Siswa Terbaik (Jenjang Ini) 🏆
                </h3>
                <div className="grid gap-3">
                    {leaderboard.map((student, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border-2 border-brand-blue/10">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-brand-blue'}`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-bold text-brand-blue">{student.nama}</div>
                                    <div className="text-xs text-gray-500">{student.kelas}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-brand-green">{student.skor} Bintang</div>
                                <div className="text-xs text-gray-400">{new Date(student.waktu).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      <ResultModal 
        isOpen={showResult} 
        score={score} 
        total={kuis.pertanyaan.length}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
};

export default QuizSessionPage;
