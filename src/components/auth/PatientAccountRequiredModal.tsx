import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, UserPlus, LogIn, ShieldCheck, Heart } from 'lucide-react';

interface PatientAccountRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}

/**
 * Rhythm Medicity Mandatory Patient Account Instruction Modal
 * Displayed whenever an unauthenticated visitor attempts to book an appointment
 * from any entry point across the entire website.
 */
export const PatientAccountRequiredModal: React.FC<PatientAccountRequiredModalProps> = ({
  isOpen,
  onClose,
  redirectUrl = '/appointment',
}) => {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const targetRedirect = redirectUrl || '/appointment';

  const handleCreateAccount = () => {
    onClose();
    navigate(`/login?mode=register&redirect=${encodeURIComponent(targetRedirect)}`);
  };

  const handleLogin = () => {
    onClose();
    navigate(`/login?mode=login&redirect=${encodeURIComponent(targetRedirect)}`);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-auth-modal-title"
      >
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5DEC9] overflow-hidden z-10 my-8"
        >
          {/* Top Brand Stripe */}
          <div className="h-2 w-full bg-gradient-to-r from-[#006655] via-[#C4A760] to-[#004C3D]" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-20 focus:outline-none focus:ring-2 focus:ring-[#006655]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6 text-center">
            {/* Hospital Emblem & Security Icon Badge */}
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 rounded-3xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center shadow-inner border border-[#006655]/20">
                <Lock className="w-9 h-9 text-[#006655]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#006655] text-white flex items-center justify-center shadow-md border-2 border-white">
                <ShieldCheck className="w-4 h-4 text-[#C4A760]" />
              </div>
            </div>

            {/* Title & Description — EXACT SPECIFICATION REQUIRED BY HOSPITAL */}
            <div className="space-y-3 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2ED] text-[#006655] border border-[#006655]/20 text-[11px] font-black tracking-wider uppercase">
                <Heart className="w-3 h-3 text-[#006655] fill-[#006655]" />
                <span>Patient Access Gateway</span>
              </div>
              <h2
                id="patient-auth-modal-title"
                className="text-xl sm:text-2xl font-black text-[#004C3D] tracking-tight leading-snug"
              >
                Patient Account Required to Book Appointment
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                To book an appointment at Rhythm Medicity, you must first create your own patient account or log in to your existing account. Your account helps you manage your appointments, patient profile, payment history, and appointment letters securely.
              </p>
            </div>

            {/* Exactly TWO Primary Action Buttons */}
            <div className="flex flex-col gap-3 pt-2 w-full max-w-sm mx-auto">
              {/* BUTTON 1: Create a New Account */}
              <button
                type="button"
                onClick={handleCreateAccount}
                className="w-full h-12 flex items-center justify-center gap-2.5 px-6 rounded-2xl bg-[#006655] hover:bg-[#004C3D] text-white font-black text-sm shadow-md shadow-[#006655]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>Create a New Account</span>
              </button>

              {/* BUTTON 2: Already Have an Account? Login */}
              <button
                type="button"
                onClick={handleLogin}
                className="w-full h-12 flex items-center justify-center gap-2.5 px-6 rounded-2xl bg-white hover:bg-[#E0F2ED]/60 text-[#004C3D] hover:text-[#006655] font-black text-sm border-2 border-[#006655]/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-2xs"
              >
                <LogIn className="w-4 h-4 text-[#006655]" />
                <span>Already Have an Account? Login</span>
              </button>
            </div>

            {/* Optional Small Text */}
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium pt-1">
              Your health journey, managed securely with Rhythm Medicity.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
