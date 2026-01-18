import React, { useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AudioContext } from './AudioContextBase';

export const AudioProvider = ({ children }) => {
  const currentAudioRef = useRef(null);
  
  const stopAll = () => {
    // Stop Web Speech API (legacy cleanup)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Stop custom audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
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
      }).catch((e) => {
        console.warn("Audio auto-play blocked by browser policy (needs interaction):", e.message);
        // Do not alert/error, just log silently as this is expected behavior in some cases
      });
    }
    
    // Cleanup blob URL when audio ends if it is a blob
    audio.onended = () => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  };

  // Helper to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const playText = async (text, rate = 0.9) => {
    stopAll(); // Stop any previous audio first
    
    if (!text) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/tts/speak`, { text }, {
        responseType: 'arraybuffer'
      });

      // Check if response is actually JSON (error) despite requesting arraybuffer
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // Convert buffer to string to see error
        const errorText = new TextDecoder().decode(response.data);
        console.error("TTS Server Error (JSON):", errorText);
        throw new Error("Server returned JSON error instead of audio");
      }

      // Check for empty response
      if (!response.data || response.data.byteLength === 0) {
        throw new Error("Received empty audio data from server");
      }

      // Use Base64 Data URI to avoid Blob range request issues
      const base64String = arrayBufferToBase64(response.data);
      const audioUrl = `data:audio/mpeg;base64,${base64String}`;
      
      playAudio(audioUrl);
    } catch (error) {
      console.error("ElevenLabs TTS Error:", error);
      // Fallback to Web Speech API if server fails (e.g. no API key)
      if ('speechSynthesis' in window) {
        console.warn("Falling back to Web Speech API");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = rate;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, []);

  return (
    <AudioContext.Provider value={{ playText, playAudio, stopAll }}>
      {children}
    </AudioContext.Provider>
  );
};
