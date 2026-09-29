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
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Rhythm Medicity Patient Authentication Page
 * Strict Patient Registration, Existing Patient Login, Google OAuth,
 * Secure Password Reset, and Inactivity Expiration Handling.
 * Completely separate from Admin Authentication (/admin/login).
 */
export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginPatient, registerPatient, signInWithGoogle, resetPassword, updatePassword } = useAuth();
  const { showToast } = useToast();
  const { hospitalSettings } = useSettings();

  const queryParams = new URLSearchParams(location.search);
  const queryMode = queryParams.get('mode');
  const sessionExpired = queryParams.get('reason') === 'session_expired';

  const initialMode: 'login' | 'register' | 'forgot' | 'reset' =
    queryMode === 'register'
      ? 'register'
      : queryMode === 'forgot'
      ? 'forgot'
      : queryMode === 'reset' || location.hash.includes('access_token')
      ? 'reset'
      : 'login';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [identifier, setIdentifier] = useState(''); // Email or Mobile
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration Fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Status & Feedback States
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  useEffect(() => {
    const qMode = new URLSearchParams(location.search).get('mode');
    if (qMode === 'register' || qMode === 'forgot' || qMode === 'login' || qMode === 'reset') {
      setMode(qMode);
    }
  }, [location.search]);

  const queryRedirect = new URLSearchParams(location.search).get('redirect');
  const redirectPath = (location.state as any)?.from || queryRedirect || '/dashboard';
  const isFromAppointment =
    redirectPath.includes('appointment') ||
    redirectPath.includes('book-appointment') ||
    queryRedirect?.includes('appointment');

  // 1. Existing Patient Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showToast('Please enter your registered mobile number or email and password.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginPatient(identifier.trim(), password);
      if (!res.success) {
        showToast(res.error || 'Invalid credentials. Please verify your mobile number or password.', 'error');
      } else {
        showToast('Welcome back to Rhythm Medicity!', 'success');
        navigate(redirectPath, { replace: true });
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Create Patient Account
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Please enter your full legal name.', 'warning');
      return;
    }
    if (!mobile.trim() || mobile.replace(/\D/g, '').length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password should be at least 6 characters long.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Password and Confirm Password do not match.', 'warning');
      return;
    }
    if (!acceptTerms) {
      showToast('You must accept the Terms of Care and Privacy Policy to continue.', 'warning');
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
        showToast(res.error || 'Failed to create patient account.', 'error');
      } else {
        setRegisteredSuccess(true);
        showToast('Welcome to Rhythm Medicity! Your patient account is ready.', 'success');
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1500);
      }
    } catch (err: any) {
      showToast(err.message || 'Registration error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Continue with Google
  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    try {
      const res = await signInWithGoogle(redirectPath);
      if (!res.success) {
        showToast(res.error || 'Unable to connect to Google authentication provider.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Google authentication error', 'error');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  // 4. Send Password Reset Link
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Please provide your registered email address.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setResetSubmitted(true);
      showToast('If an account matches the submitted email address, password reset instructions will be sent.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Error processing password reset', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Update Password after Reset Token
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New Password and Confirm Password do not match.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updatePassword(newPassword);
      if (!res.success) {
        showToast(res.error || 'Failed to update password.', 'error');
      } else {
        setResetCompleted(true);
        showToast('Your password has been updated successfully.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error resetting password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg bg-[#FBF8F1] rounded-3xl border border-[#E5DEC9] shadow-xl p-6 sm:p-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <Link to="/" className="inline-block">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5DEC9] p-1.5 flex items-center justify-center mx-auto shadow-md hover:scale-105 transition-transform">
              <img src="/emblem.png" alt="RHYTHM MEDICITY" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#006655] tracking-tight">
            {mode === 'login'
              ? 'Patient Account Login'
              : mode === 'register'
              ? 'Create Patient Account'
              : mode === 'reset'
              ? 'Set Your New Password'
              : 'Reset Your Password'}
          </h1>
          <p className="text-xs text-[#004C3D] font-medium">
            {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'} Patient Secure Portal
          </p>
        </div>

        {/* Inactivity Session Expiration Banner */}
        {sessionExpired && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-sm">Session Timeout Notice:</strong>
              Your session has expired due to inactivity. Please log in again to access your patient account.
            </div>
          </div>
        )}

        {/* Registration Welcome Banner */}
        {registeredSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="font-black text-sm">Welcome to Rhythm Medicity!</div>
              <div className="text-xs text-emerald-800">Your patient account is ready. Redirecting...</div>
            </div>
          </div>
        )}

        {/* Appointment Intent Alert Banner */}
        {isFromAppointment && !registeredSuccess && !sessionExpired && (
          <div className="p-3.5 rounded-2xl bg-[#E0F2ED] border border-[#006655]/30 text-[#004C3D] text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#006655] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Appointment Booking In Progress:</strong>
              Sign in or create your patient account to confirm your consultation schedule.
            </div>
          </div>
        )}

        {/* Tab switch (Login vs Create Account) */}
        {mode !== 'forgot' && mode !== 'reset' && (
          <div className="flex bg-white p-1 rounded-2xl text-xs font-bold border border-[#E5DEC9]">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                mode === 'login' ? 'bg-[#006655] text-white shadow-xs font-black' : 'text-[#4F7B72] hover:text-[#006655]'
              }`}
            >
              Already Have an Account? Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                mode === 'register' ? 'bg-[#006655] text-white shadow-xs font-black' : 'text-[#4F7B72] hover:text-[#006655]'
              }`}
            >
              Create a New Account
            </button>
          </div>
        )}

        {/* 1. EXISTING PATIENT LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                Registered Email or Mobile Number *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 or patient@example.com"
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
                  className="text-xs text-[#006655] hover:text-[#C4A760] hover:underline font-bold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-shimmer btn-gold w-full py-3 rounded-xl text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 icon-hover-arrow" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#E5DEC9] w-full" />
              <span className="bg-[#FBF8F1] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                or
              </span>
              <div className="border-t border-[#E5DEC9] w-full" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E5DEC9] bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60"
            >
              {googleSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#006655]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              )}
              <span>Continue with Google</span>
            </button>

            {/* Link to Registration */}
            <div className="pt-2 text-center text-xs text-slate-600">
              New to Rhythm Medicity?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-black text-[#006655] hover:underline cursor-pointer"
              >
                Create a New Account
              </button>
            </div>
          </form>
        )}

        {/* 2. CREATE A NEW PATIENT ACCOUNT FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-sm">
            {/* Full Name */}
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

            {/* Mobile & Email */}
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
                    placeholder="patient@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>
              </div>
            </div>

            {/* Date of Birth & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="accept-terms-check"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5DEC9] text-[#006655] focus:ring-[#006655] mt-0.5 cursor-pointer"
              />
              <label htmlFor="accept-terms-check" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                I agree to Rhythm Medicity's{' '}
                <Link to="/terms" target="_blank" className="font-bold text-[#006655] hover:underline">
                  Terms of Care
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="font-bold text-[#006655] hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            {/* Create Patient Account Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-shimmer btn-gold w-full py-3 rounded-xl text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Patient Account</span>
                  <ArrowRight className="w-4 h-4 icon-hover-arrow" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#E5DEC9] w-full" />
              <span className="bg-[#FBF8F1] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                or
              </span>
              <div className="border-t border-[#E5DEC9] w-full" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E5DEC9] bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60"
            >
              {googleSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#006655]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              )}
              <span>Continue with Google</span>
            </button>

            {/* Link: Already have an account? Login */}
            <div className="pt-2 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-black text-[#006655] hover:underline cursor-pointer"
              >
                Login
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD VIEW */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <h2 className="text-base font-black text-[#004C3D]">Reset Your Password</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the email address associated with your Rhythm Medicity patient account. If an eligible account exists, we will send instructions to reset your password.
              </p>
            </div>

            {resetSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    If an account matches the submitted email address, password reset instructions will be sent to that email. Please check your inbox and spam folder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetSubmitted(false);
                    setMode('login');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs transition cursor-pointer"
                >
                  Return to Patient Login
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="patient@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-shimmer btn-gold w-full py-3 rounded-xl text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Password Reset Link</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs font-black text-[#006655] hover:underline cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* 4. SET NEW PASSWORD VIEW (Token / Recovery Mode) */}
        {mode === 'reset' && (
          <form onSubmit={handleUpdatePassword} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <h2 className="text-base font-black text-[#004C3D]">Set Your New Password</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Please enter and confirm your new secure password below to regain access to your patient account.
              </p>
            </div>

            {resetCompleted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-bold">Your password has been updated successfully.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-black text-xs transition cursor-pointer"
                >
                  Login to Your Account
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#004C3D] uppercase tracking-wider mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-shimmer btn-gold w-full py-3 rounded-xl text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        )}

        {/* Security & Hospital Protection Footer Note */}
        <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-center gap-2 text-[11px] text-[#82A39B]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#006655]" />
          <span>Rhythm Medicity Patient Account Security Protocol</span>
        </div>
      </div>
    </div>
  );
};
