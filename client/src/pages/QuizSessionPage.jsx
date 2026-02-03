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

// Reliable Sound Effects (Base64 / CDN)
// Using placeholder for now or handle via TTS if URLs fail
const SOUND_CORRECT = null; // Will use TTS
const SOUND_WRONG = null; // Will use TTS
const SOUND_CLAP = null; // Will use TTS

const QuizSessionPage = () => {
  const { materiId } = useParams();
  const { user } = useAuth();
  const { playAudio, playText, stopAll } = useAudio();
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
      playText("Jawaban Benar! Hebat!");
      setScore(prev => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      playText("Kurang tepat, tetap semangat ya!");
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

  const finishQuiz = async (finalAnswers) => {
    // Send score to backend first to update stats
    await submitScore(finalAnswers);
    
    setShowResult(true);
    playText("Selamat! Kamu telah menyelesaikan kuis ini.");
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 }
    });
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

        // Refresh stats to include current attempt in leaderboard
        const statsResponse = await axios.get(`/api/kuis/stats/${kuis.materi}`);
        setLeaderboard(statsResponse.data.leaderboard);
        setStats(statsResponse.data.stats);

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

        {/* Leaderboard Section - REMOVED from here, moved to ResultModal as requested */}
        {/* "Siswa Terbaik ... harus muncul setelah selesai mengerjakan soal alias pop up nya muncul dibawah bintang" */}
      </div>

      <ResultModal 
        isOpen={showResult} 
        score={score} 
        total={kuis.pertanyaan.length} 
        onRetry={() => window.location.reload()}
        leaderboard={leaderboard}
      />
    </div>
  );
};

export default QuizSessionPage;
