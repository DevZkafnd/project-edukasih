import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, Star, Music, Heart, Smile } from 'lucide-react';

const FloatingItem = ({ children, delay = 0, duration = 10, xRange = [0, 50, 0], yRange = [0, -50, 0], className }) => (
  <motion.div
    animate={{ 
      x: xRange,
      y: yRange,
      rotate: [0, 10, -10, 0]
    }}
    transition={{ 
      duration: duration, 
      repeat: Infinity, 
      ease: "easeInOut",
      delay: delay 
    }}
    className={`absolute opacity-60 ${className}`}
  >
    {children}
  </motion.div>
);

const BackgroundDecorations = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
    {/* Sun - Rotating */}
    <motion.div 
      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
      transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 5, repeat: Infinity } }}
      className="absolute -top-10 -right-10 text-brand-yellow opacity-80"
    >
      <Sun size={200} fill="currentColor" className="text-yellow-400" />
    </motion.div>

    {/* Clouds - Moving Across */}
    <motion.div 
      animate={{ x: [-100, window.innerWidth + 100] }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      className="absolute top-20 left-0 text-blue-200 opacity-60"
    >
      <Cloud size={120} fill="currentColor" />
    </motion.div>
    
    <motion.div 
      animate={{ x: [-100, window.innerWidth + 100] }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear", delay: 10 }}
      className="absolute top-40 left-0 text-blue-100 opacity-70"
    >
      <Cloud size={80} fill="currentColor" />
    </motion.div>

    {/* Random Floating Icons */}
    <FloatingItem className="top-1/4 left-10 text-brand-green" delay={0} duration={8} xRange={[0, 30, 0]} yRange={[0, 20, 0]}>
      <Star size={40} fill="currentColor" />
    </FloatingItem>
    
    <FloatingItem className="bottom-1/3 right-20 text-brand-blue hidden md:block" delay={2} duration={12} xRange={[0, -40, 0]} yRange={[0, 40, 0]}>
      <Music size={50} />
    </FloatingItem>

    <FloatingItem className="bottom-10 left-1/4 text-pink-400" delay={1} duration={10}>
      <Heart size={35} fill="currentColor" />
    </FloatingItem>

    <FloatingItem className="top-1/3 right-1/3 text-yellow-500 hidden md:block" delay={3} duration={15} xRange={[0, 50, -50]} yRange={[0, -20, 20]}>
      <Smile size={45} />
    </FloatingItem>

    <FloatingItem className="top-1/2 left-20 text-purple-300 hidden sm:block" delay={4} duration={9}>
      <Star size={25} fill="currentColor" />
    </FloatingItem>
    
    {/* Bubbles/Circles */}
    <motion.div 
      animate={{ y: [0, -200], opacity: [0.6, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeOut" }}
      className="absolute bottom-0 left-1/2 w-8 h-8 bg-blue-200 rounded-full opacity-50 blur-sm"
    />
    <motion.div 
      animate={{ y: [0, -300], opacity: [0.5, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeOut", delay: 5 }}
      className="absolute bottom-0 left-1/3 w-12 h-12 bg-green-200 rounded-full opacity-40 blur-md"
    />
  </div>
);

export default BackgroundDecorations;
