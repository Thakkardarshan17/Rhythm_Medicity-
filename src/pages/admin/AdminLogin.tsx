import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { hospitalSettings } = useSettings();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) {
      showToast('Please enter both User ID and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      // User ID can be an email or mapped username
      const email = userId.includes('@') ? userId : `${userId.trim()}@rhythmmedicity.internal`;
      const res = await login(email, password);

      if (!res.success) {
        showToast(res.error || 'Invalid administrator credentials.', 'error');
      } else {
        showToast('Administrator authorized successfully.', 'success');
        navigate('/admin', { replace: true });
      }
    } catch (err: any) {
      showToast(err.message || 'Authorization failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#003329] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#006655]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#93D3C3]/60 hover:text-white transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Public Website
        </Link>
        <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center mx-auto shadow-xl border border-[#C4A760]/50">
          <img src="/emblem.png" alt="RHYTHM MEDICITY" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Admin Portal Authentication
        </h1>
        <p className="text-xs text-[#C4A760] font-medium">
          {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'} Secure Operational Controls
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[#004C3D]/50 border border-[#006655]/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-[#93D3C3] uppercase tracking-wider mb-1.5">
                USER ID / ADMIN EMAIL *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#C4A760] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="admin@rhythmmedicity.com or admin"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#006655] bg-[#003329] text-white placeholder-[#93D3C3]/40 focus:outline-none focus:ring-2 focus:ring-[#C4A760] focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#93D3C3] uppercase tracking-wider mb-1.5">
                PASSWORD *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C4A760] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#006655] bg-[#003329] text-white placeholder-[#93D3C3]/40 focus:outline-none focus:ring-2 focus:ring-[#C4A760] focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#C4A760] hover:bg-[#B0934C] disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-[#C4A760]/20 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Access Admin Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-[#006655]/40 text-center">
            <span className="text-[11px] text-[#93D3C3]/50">
              Only authorized hospital personnel. All access attempts are recorded in administrative audit logs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
