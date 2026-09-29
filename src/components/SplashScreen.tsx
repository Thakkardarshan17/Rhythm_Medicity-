import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, 
  ShieldCheck, 
  ShieldPlus, 
  UserCheck, 
  Building2, 
  Heart, 
  Clock 
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { hospitalSettings } = useSettings();
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(12);

  // Smooth loading progress from 12% to 100% over ~2.6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate smoothly towards completion
        const step = prev < 50 ? Math.floor(Math.random() * 8) + 5 : Math.floor(Math.random() * 12) + 8;
        return Math.min(100, prev + step);
      });
    }, 140);

    return () => clearInterval(interval);
  }, []);

  // When progress hits 100%, hold briefly then fade out gracefully
  useEffect(() => {
    if (progress >= 100) {
      const exitTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 450);
      }, 500);
      return () => clearTimeout(exitTimer);
    }
  }, [progress, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[#F4F9F7] text-slate-800 select-none overflow-hidden font-sans"
        >
          {/* ================= BACKGROUND LAYERS ================= */}
          {/* 1. Realistic Modern Hospital Campus on Right */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div 
              className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 bg-cover bg-right-top opacity-30 lg:opacity-45 mix-blend-multiply transition-opacity duration-1000"
              style={{ backgroundImage: `url('/splash-hospital-bg.jpg')` }}
            />
            {/* Soft gradient fade so left side is clean & legible */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F4F9F7] via-[#F4F9F7]/95 lg:via-[#F4F9F7]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#F4F9F7]/80 via-transparent to-[#F4F9F7]/90" />
          </div>

          {/* 2. Giant Translucent Medical Heart with ECG Pulse on Left */}
          <div className="absolute left-[-5%] top-[10%] w-[320px] sm:w-[460px] md:w-[560px] h-[320px] sm:h-[460px] md:h-[560px] pointer-events-none opacity-20 sm:opacity-25">
            <svg viewBox="0 0 400 400" className="w-full h-full text-emerald-500 stroke-current fill-emerald-100/40">
              <path
                d="M200,340 C120,280 40,210 40,130 C40,75 85,35 140,35 C175,35 195,55 200,65 C205,55 225,35 260,35 C315,35 360,75 360,130 C360,210 280,280 200,340 Z"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* ECG Pulse running across heart */}
              <path
                d="M10,200 L120,200 L145,170 L160,240 L185,120 L210,270 L235,160 L255,220 L275,200 L390,200"
                strokeWidth="7"
                stroke="#006655"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* ================= TOP BAR ================= */}
          <div className="relative z-10 w-full px-6 pt-5 sm:pt-6 flex items-start justify-end">
            {/* Elegant cursive handwriting tagline */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-right"
            >
              <span className="block font-serif italic text-base sm:text-lg text-[#004C3D] font-bold tracking-wide drop-shadow-sm">
                Health Heals Everything
              </span>
              <div className="flex items-center justify-end gap-1.5 mt-0.5 text-teal-700/60">
                <span className="w-6 sm:w-8 h-[1px] bg-teal-700/30" />
                <Heart className="w-3.5 h-3.5 text-teal-700 fill-teal-600/30" />
                <span className="w-6 sm:w-8 h-[1px] bg-teal-700/30" />
              </div>
            </motion.div>
          </div>

          {/* ================= CENTER BRANDING & PROGRESS ================= */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full -mt-2 sm:-mt-6">
            {/* 1. Emblem Card (White Rounded Box with Glow & Border) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl bg-white shadow-xl shadow-emerald-950/10 border-2 border-emerald-100 flex items-center justify-center p-3 mb-2"
            >
              <img
                src="/emblem.png"
                alt="RHYTHM MEDICITY EMBLEM"
                className="w-full h-full object-contain drop-shadow"
              />
            </motion.div>

            {/* 2. Micro ECG Pulse Wave directly below Emblem */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="h-6 flex items-center justify-center my-1"
            >
              <svg viewBox="0 0 140 24" className="w-28 sm:w-32 h-6 text-teal-700 stroke-current fill-none">
                <path
                  d="M0,12 L35,12 L45,4 L55,20 L65,2 L75,22 L85,9 L95,15 L105,12 L140,12"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>

            {/* 3. Hospital Name */}
            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wider text-[#004C3D] text-center"
            >
              {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}
            </motion.h1>

            {/* 4. Subtitle Tagline */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-1 text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.2em] text-[#006655] uppercase text-center"
            >
              {hospitalSettings.tagline || 'ONE STOP SOLUTION FOR COMPLETE CARE'}
            </motion.p>

            {/* 5. Four Feature Badges (Horizontal Pill Icons) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-4 gap-2 sm:gap-6 md:gap-8 mt-5 sm:mt-7 w-full max-w-xl px-2"
            >
              {/* Badge 1: Expert Doctors */}
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-teal-600/30 bg-white shadow-sm flex items-center justify-center text-teal-700 mb-1.5 transition-transform hover:scale-105">
                  <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">
                  Expert<br />Doctors
                </span>
              </div>

              {/* Badge 2: Advanced Technology */}
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-teal-600/30 bg-white shadow-sm flex items-center justify-center text-teal-700 mb-1.5 transition-transform hover:scale-105">
                  <ShieldPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">
                  Advanced<br />Technology
                </span>
              </div>

              {/* Badge 3: Better Patient Care */}
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-teal-600/30 bg-white shadow-sm flex items-center justify-center text-teal-700 mb-1.5 transition-transform hover:scale-105">
                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">
                  Better<br />Patient Care
                </span>
              </div>

              {/* Badge 4: Trusted Healthcare */}
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-teal-600/30 bg-white shadow-sm flex items-center justify-center text-teal-700 mb-1.5 transition-transform hover:scale-105">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">
                  Trusted<br />Healthcare
                </span>
              </div>
            </motion.div>

            {/* 6. Slogan Divider: —— Your Health Our Priority —— */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex items-center justify-center gap-3 my-4 sm:my-5 w-full"
            >
              <div className="w-12 sm:w-20 h-[1.5px] bg-teal-700/30 rounded-full" />
              <span className="text-xs sm:text-sm font-semibold text-[#004C3D] tracking-wide">
                Your Health Our Priority
              </span>
              <div className="w-12 sm:w-20 h-[1.5px] bg-teal-700/30 rounded-full" />
            </motion.div>

            {/* 7. Progress Bar */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="w-full max-w-xs sm:max-w-sm flex flex-col items-center"
            >
              <div className="w-full h-3 sm:h-3.5 bg-emerald-100/90 border border-emerald-300/80 rounded-full p-0.5 shadow-inner overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#006655] via-teal-500 to-[#10b981] rounded-full shadow-sm"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.15 }}
                />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-teal-900 mt-1.5 tracking-wide">
                Loading... {progress}%
              </span>
            </motion.div>
          </div>

          {/* ================= BOTTOM LAYERED CURVED WAVES ================= */}
          <div className="relative z-10 w-full pointer-events-none -mb-1">
            <svg
              viewBox="0 0 1440 180"
              className="w-full h-16 sm:h-24 md:h-28 block preserve-3d"
              preserveAspectRatio="none"
            >
              {/* Back Soft Wave with Gold Stroke */}
              <path
                d="M0,80 C320,160 560,30 920,110 C1200,160 1360,110 1440,90 L1440,180 L0,180 Z"
                fill="#006655"
                opacity="0.45"
              />
              {/* Gold Ribbon Divider */}
              <path
                d="M0,105 C380,170 700,50 1080,125 C1280,160 1390,130 1440,115 L1440,180 L0,180 Z"
                fill="none"
                stroke="#C4A760"
                strokeWidth="2.5"
                opacity="0.7"
              />
              {/* Middle Emerald Wave */}
              <path
                d="M0,115 C340,175 680,65 1060,135 C1260,170 1380,140 1440,125 L1440,180 L0,180 Z"
                fill="#004C3D"
                opacity="0.85"
              />
              {/* Front Dark Emerald Wave */}
              <path
                d="M0,135 C420,185 820,95 1200,150 C1320,165 1400,155 1440,145 L1440,180 L0,180 Z"
                fill="#003329"
              />
            </svg>
          </div>

          {/* ================= BOTTOM FEATURE STRIP ================= */}
          <div className="relative z-20 w-full bg-white border-t border-slate-100 shadow-2xl py-2.5 sm:py-3.5 px-3 sm:px-8">
            <div className="max-w-5xl mx-auto grid grid-cols-4 divide-x divide-slate-200">
              {/* Feature 1 */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 px-1 sm:px-4">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <ShieldPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 tracking-tight text-center sm:text-left">
                  Quality Care
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 px-1 sm:px-4">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 tracking-tight text-center sm:text-left">
                  Modern Infrastructure
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 px-1 sm:px-4">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 tracking-tight text-center sm:text-left">
                  Compassionate Team
                </span>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 px-1 sm:px-4">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 tracking-tight text-center sm:text-left">
                  24/7 Emergency
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
