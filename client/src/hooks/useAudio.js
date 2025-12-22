import { useContext } from 'react';
import { AudioContext } from '../context/AudioContextBase';

const useAudio = () => useContext(AudioContext);

export default useAudio;
