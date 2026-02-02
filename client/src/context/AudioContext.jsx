import React, { useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AudioContext } from './AudioContextBase';

export const AudioProvider = ({ children }) => {
  const currentAudioRef = useRef(null);
  const lastTextRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const queuedAudioRef = useRef(null);
  const playbackIdRef = useRef(0);
  
  const stopAll = useCallback(() => {
    playbackIdRef.current++; // Invalidate pending async playbacks
    queuedAudioRef.current = null; // Clear queued audio
    
    // Stop Web Speech API (legacy cleanup)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Stop custom audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, []);

  const playAudio = useCallback((url) => {
    stopAll();
    const audio = new Audio(url);
    audio.preload = 'auto';
    currentAudioRef.current = audio;
    
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        // Playing started
        queuedAudioRef.current = null;
      }).catch((e) => {
        if (e.name === 'NotAllowedError' || /not allowed|gesture|user interaction/i.test(e.message || '')) {
          console.log("Audio autoplay blocked. Queued for user interaction.");
          queuedAudioRef.current = url;
        } else if (e.name === 'NotSupportedError' || e.message.includes('no supported source')) {
          // Suppress "no supported source" error which happens when audio file is missing or blocked
          console.log("Audio source not supported or missing:", url);
        } else {
          console.warn("Audio playback failed:", e.message);
        }
      });
    }
    
    // Cleanup blob URL when audio ends if it is a blob
    audio.onended = () => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [stopAll]);

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

  const playText = useCallback(async (text, rate = 0.9) => {
    stopAll(); // Stop any previous audio first
    const currentPlaybackId = playbackIdRef.current;
    
    if (!text) return;

    lastTextRef.current = { text, rate };

    try {
      const response = await axios.post('/api/tts/speak', { text }, {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (playbackIdRef.current !== currentPlaybackId) return; // Abort if stopped/changed

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
      if (playbackIdRef.current !== currentPlaybackId) return; // Abort fallback too

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
  }, [stopAll, playAudio]);

  useEffect(() => {
    const unlock = () => {
      // Try to play queued audio if exists
      if (queuedAudioRef.current) {
        const url = queuedAudioRef.current;
        queuedAudioRef.current = null;
        playAudio(url);
      }

      if (audioUnlockedRef.current) return;
      
      const audio = new Audio();
      audio.muted = true;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          audio.pause();
          audioUnlockedRef.current = true;
        }).catch(() => {
          // Still blocked
        });
      } else {
        audioUnlockedRef.current = true;
      }
    };

    const events = ['pointerdown', 'touchstart', 'click', 'keydown'];
    events.forEach(event => window.addEventListener(event, unlock));

    return () => {
      events.forEach(event => window.removeEventListener(event, unlock));
    };
  }, []);

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
