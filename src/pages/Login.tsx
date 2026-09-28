import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User,
  Lock,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  Loader2,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginPatient, registerPatient, resetPassword } = useAuth();
  const { showToast } = useToast();
  const { hospitalSettings } = useSettings();

  const queryParams = new URLSearchParams(location.search);
  const queryMode = queryParams.get('mode');
  const initialMode: 'login' | 'register' | 'forgot' =
    queryMode === 'register' ? 'register' : queryMode === 'forgot' ? 'forgot' : 'login';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [identifier, setIdentifier] = useState(''); // Email or Mobile
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [submitting, setSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  useEffect(() => {
    const qMode = new URLSearchParams(location.search).get('mode');
    if (qMode === 'register' || qMode === 'forgot' || qMode === 'login') {
      setMode(qMode);
    }
  }, [location.search]);

  const queryRedirect = new URLSearchParams(location.search).get('redirect');
  const redirectPath = (location.state as any)?.from || queryRedirect || '/dashboard';
  const isFromAppointment = redirectPath.includes('appointment') || redirectPath.includes('book-appointment') || queryRedirect?.includes('appointment');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showToast('Please enter your registered mobile number/email and password.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginPatient(identifier.trim(), password);
      if (!res.success) {
        showToast(res.error || 'Invalid credentials. Please verify your mobile number or password.', 'error');
      } else {
        showToast('Welcome back to Rhythm Medicity.', 'success');
        navigate(redirectPath, { replace: true });
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !mobile.trim() || !password) {
      showToast('Please fill in all required registration fields.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password should be at least 6 characters long.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please re-enter.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerPatient({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        dob: dob || undefined,
        gender,
        password,
      });

      if (!res.success) {
        showToast(res.error || 'Failed to register account.', 'error');
      } else {
        setRegisteredSuccess(true);
        showToast('✓ Account Created Successfully', 'success');
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1200);
      }
    } catch (err: any) {
      showToast(err.message || 'Registration error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please provide your registered email address.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(email.trim());
      if (res.success) {
        showToast(res.message || 'Password reset link sent to your email.', 'success');
        setMode('login');
      } else {
        showToast(res.error || 'Failed to send password reset request.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error sending password reset', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg bg-[#FBF8F1] rounded-3xl border border-[#E5DEC9] shadow-xl p-6 sm:p-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <Link to="/" className="inline-block">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5DEC9] p-1.5 flex items-center justify-center mx-auto shadow-md hover:scale-105 transition-transform">
              <img src="/emblem.png" alt="RHYTHM MEDICITY" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#006655] tracking-tight">
            {mode === 'login'
              ? 'Patient Portal Sign In'
              : mode === 'register'
              ? 'New Patient Registration'
              : 'Reset Your Password'}
          </h1>
          <p className="text-xs text-[#004C3D]">
            {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'} Healthcare Portal
          </p>
        </div>

        {/* Success Toast Banner */}
        {registeredSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-sm">✓ Account Created Successfully</div>
              <div className="text-xs text-emerald-700">Logging you in automatically...</div>
            </div>
          </div>
        )}

        {/* Appointment Mandatory Alert Banner */}
        {isFromAppointment && !registeredSuccess && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Patient Account Mandatory:</strong>
              Please sign in or create an account to book your consultation and view your appointment status.
            </div>
          </div>
        )}

        {/* Tab switch */}
        {mode !== 'forgot' && (
          <div className="flex bg-white p-1 rounded-2xl text-xs font-bold border border-[#E5DEC9]">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl transition ${
                mode === 'login' ? 'bg-[#006655] text-white shadow-xs' : 'text-[#4F7B72] hover:text-[#006655]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl transition ${
                mode === 'register' ? 'bg-[#006655] text-white shadow-xs' : 'text-[#4F7B72] hover:text-[#006655]'
              }`}
            >
              New Patient (Create Account)
            </button>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                Mobile Number / Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 or patient@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-[#C4A760] hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-shimmer btn-gold w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Patient Portal</span>
                  <ArrowRight className="w-4 h-4 icon-hover-arrow" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1 text-xs text-[#006655] hover:text-[#C4A760] font-medium transition"
              >
                <span>Hospital Staff / Admin? Access Admin Console &rarr;</span>
              </Link>
            </div>
          </form>
        )}

        {/* 2. REGISTRATION FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit Mobile"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-shimmer btn-gold w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 icon-hover-arrow" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD VIEW */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-sm">
            <p className="text-xs text-[#4F7B72] leading-relaxed">
              Enter your registered email address and we will dispatch a secure password reset link to your inbox.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                Registered Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-shimmer btn-gold w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send Reset Instructions</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-bold text-[#006655] hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Privacy Note */}
        <div className="pt-3 border-t border-[#E5DEC9] text-center text-[11px] text-[#82A39B]">
          By continuing, you agree to Rhythm Medicity's{' '}
          <Link to="/terms" className="underline text-[#006655]">
            Terms of Care
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline text-[#006655]">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
};

