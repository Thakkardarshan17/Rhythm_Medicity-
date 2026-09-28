import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { hospitalSettings } = useSettings();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 2.2 seconds total duration for a crisp, professional medical splash
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400); // allow fade out transition
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#003329] via-[#006655] to-[#003329] text-white select-none overflow-hidden"
        >
          {/* Subtle Background Glow & Ripple */}
          <div className="absolute w-96 h-96 rounded-full bg-[#E0F2ED]0/10 blur-3xl animate-pulse pointer-events-none" />

          {/* Central Logo & Heartbeat Container */}
          <div className="relative flex flex-col items-center z-10">
            {/* Ripple rings */}
            <div className="absolute inset-0 -m-8 rounded-full border border-teal-500/20 animate-ripple" />
            <div className="absolute inset-0 -m-16 rounded-full border border-teal-500/10 animate-ripple" style={{ animationDelay: '0.8s' }} />

            {/* Hospital Logo / Medical Mark */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative p-3.5 rounded-3xl bg-white shadow-2xl shadow-primary/50 border-2 border-secondary animate-heartbeat flex items-center justify-center"
            >
              <img
                src="/emblem.png"
                alt="RHYTHM MEDICITY"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </motion.div>

            {/* ECG Waveform Animation SVG */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '260px' }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
              className="my-5 h-8 flex items-center justify-center overflow-hidden"
            >
              <svg
                viewBox="0 0 300 40"
                className="w-full h-full text-accent stroke-current fill-none"
                style={{ strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}
              >
                <path
                  className="ecg-line"
                  d="M0,20 L60,20 L75,10 L90,30 L105,5 L120,35 L135,15 L150,25 L165,20 L300,20"
                />
              </svg>
            </motion.div>

            {/* Hospital Name Animation */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent via-white to-secondary text-center"
            >
              {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}
            </motion.h1>

            {/* Tagline Animation */}
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-2 text-xs sm:text-sm font-semibold tracking-widest text-secondary uppercase text-center px-4 drop-shadow"
            >
              {hospitalSettings.tagline || 'ONE STOP SOLUTION FOR COMPLETE CARE'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
