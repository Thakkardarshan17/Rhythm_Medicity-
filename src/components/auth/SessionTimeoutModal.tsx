import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onContinue: () => void;
  onLogout: () => void;
  renewing?: boolean;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  remainingSeconds,
  onContinue,
  onLogout,
  renewing = false,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-warning-title"
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden z-10"
        >
          {/* Amber Warning Header Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 id="session-warning-title" className="text-lg font-black tracking-tight">
                Your session is about to expire
              </h2>
              <p className="text-xs text-amber-100 font-medium">Inactivity Security Protocol</p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-700 leading-relaxed">
              Your account session will expire soon because of inactivity. To protect your sensitive medical records and appointment data, we automatically sign out inactive sessions.
            </p>

            {/* Countdown Badge */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-center space-y-1">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                Automatic Sign Out In
              </span>
              <span className="font-mono text-3xl font-black text-amber-900 tracking-wider">
                {formattedTime}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 hover:text-rose-600 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Now</span>
              </button>

              <button
                type="button"
                onClick={onContinue}
                disabled={renewing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#006655]/20 transition disabled:opacity-50 cursor-pointer"
              >
                {renewing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                <span>Continue Session</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
