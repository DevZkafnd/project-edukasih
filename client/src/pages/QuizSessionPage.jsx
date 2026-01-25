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

// Dummy SFX URLs (In real app, import local assets)
const SOUND_CORRECT = 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3';
const SOUND_WRONG = 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3';
const SOUND_CLAP = 'https://assets.mixkit.co/sfx/preview/mixkit-small-group-clapping-475.mp3';

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
      playAudio(SOUND_CORRECT);
      setScore(prev => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      playAudio(SOUND_WRONG);
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
    playAudio(SOUND_CLAP);
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
  if (!kuis) return <div className="p-10 text-center font-comic">Kuis tidak ditemukan.</div>;

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
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={kuis.pertanyaan[currentQuestionIndex].indeks_jawaban_benar}
        />
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
