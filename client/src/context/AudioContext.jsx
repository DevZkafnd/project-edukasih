import React, { useRef, useEffect } from 'react';
import { AudioContext } from './AudioContextBase';

export const AudioProvider = ({ children }) => {
  const currentAudioRef = useRef(null);
  const speechRef = useRef(null);

  const stopAll = () => {
    // Stop Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Stop custom audio element if any (future proofing)
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  const playText = (text, rate = 0.9) => {
    stopAll(); // Stop any previous audio first
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = rate;
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playAudio = (url) => {
    stopAll();
    const audio = new Audio(url);
    audio.preload = 'auto';
    currentAudioRef.current = audio;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        // Playing started
      }).catch(() => {
        // Silently ignore autoplay or format errors to avoid console noise
      });
    }
  };

  // Cleanup on unmount (context rarely unmounts, but good practice)
  useEffect(() => {
    return () => stopAll();
  }, []);

  return (
    <AudioContext.Provider value={{ playText, playAudio, stopAll }}>
      {children}
    </AudioContext.Provider>
  );
};
