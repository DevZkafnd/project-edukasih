import React from 'react';
import { Volume2 } from 'lucide-react';
import useAudio from '../hooks/useAudio';

const VoiceButton = ({ text, audioScript, className = "" }) => {
  const { playText } = useAudio();

  const handleSpeak = () => {
    playText(audioScript || text);
  };

  return (
    <button
      onClick={handleSpeak}
      className={`flex items-center gap-2 bg-brand-yellow text-black font-bold py-2 px-4 rounded-full shadow-md hover:scale-110 transition-transform duration-200 active:scale-95 ${className}`}
      aria-label="Play sound"
    >
      <Volume2 size={24} />
      <span>{text}</span>
    </button>
  );
};

export default VoiceButton;
