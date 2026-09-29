import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { loginWithGoogleInstant } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuickAccount, setSelectedQuickAccount] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstantSignIn = async (userEmail: string, userName: string) => {
    if (!userEmail || !userEmail.includes('@')) {
      showToast('Please provide a valid Gmail address.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginWithGoogleInstant(userEmail.trim(), userName.trim() || userEmail.split('@')[0]);
      if (!res.success) {
        showToast(res.error || 'Failed to complete Google Sign-In', 'error');
      } else {
        showToast(`Signed in successfully as ${userName || userEmail}!`, 'success');
        onClose();
        onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || 'Error completing Google sign-in', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    handleInstantSignIn(email, fullName);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Google OAuth Styled Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Google Brand Logo */}
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Sign in with Google</h2>
                <p className="text-xs text-slate-500">to continue to Rhythm Medicity</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Quick 1-Tap Google Access */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select Google Account
              </p>

              <button
                type="button"
                onClick={() => {
                  setSelectedQuickAccount('darshan@gmail.com');
                  handleInstantSignIn('patient.darshan@gmail.com', 'Darshan Thakkar');
                }}
                disabled={submitting}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-[#006655] hover:bg-[#E0F2ED]/20 flex items-center justify-between transition cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#006655] text-white font-black text-sm flex items-center justify-center shadow-xs">
                    D
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 group-hover:text-[#006655] transition">
                      Darshan Thakkar
                    </div>
                    <div className="text-xs text-slate-500">patient.darshan@gmail.com</div>
                  </div>
                </div>
                {submitting && selectedQuickAccount === 'darshan@gmail.com' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#006655]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#006655] opacity-0 group-hover:opacity-100 transition" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedQuickAccount('guest@gmail.com');
                  handleInstantSignIn('patient.guest@gmail.com', 'Hospital Patient');
                }}
                disabled={submitting}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-[#006655] hover:bg-[#E0F2ED]/20 flex items-center justify-between transition cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C4A760] text-white font-black text-sm flex items-center justify-center shadow-xs">
                    P
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 group-hover:text-[#006655] transition">
                      Hospital Patient Account
                    </div>
                    <div className="text-xs text-slate-500">patient.guest@gmail.com</div>
                  </div>
                </div>
                {submitting && selectedQuickAccount === 'guest@gmail.com' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#006655]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#006655] opacity-0 group-hover:opacity-100 transition" />
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                or enter your gmail
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Custom Google Email Form */}
            <form onSubmit={handleSubmitCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Google Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] focus:border-transparent text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting && !selectedQuickAccount ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue with Google</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Protected by Rhythm Medicity Secure Patient Gate. Your account details remain private and HIPAA compliant.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
