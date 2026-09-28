import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Calendar,
  Clock,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  LogOut,
  CalendarCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';
import {
  fullBookingSchema,
  FullBookingValues,
} from '../validations/bookingSchema';
import { DoctorService } from '../services/doctorService';
import { SpecialityService } from '../services/specialityService';
import { AppointmentService } from '../services/appointmentService';
import { Doctor, Speciality, Appointment } from '../types/database';
import { PaymentAdapter } from '../lib/paymentAdapter';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useDropdownOptions } from '../contexts/DropdownContext';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

export const AppointmentBooking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const preSelectedDoc = searchParams.get('doctor') || searchParams.get('doctorId') || '';
  const preSelectedSpec = searchParams.get('speciality') || searchParams.get('specialityId') || '';

  const { user, profile, patientProfile, registerPatient, loginPatient, logout } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Patient account mandatory & appointment history status
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [authFullName, setAuthFullName] = useState('');
  const [authMobile, setAuthMobile] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authAge, setAuthAge] = useState<number | ''>('');
  const [authGender, setAuthGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [authAddress, setAuthAddress] = useState('');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authLoginPassword, setAuthLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Dynamic Admin-Controlled Dropdowns
  const { options: genderOptions } = useDropdownOptions('gender');
  const { options: appointmentTypeOptions } = useDropdownOptions('appointment_type');
  const { options: visitReasonOptions } = useDropdownOptions('visit_reason');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('Regular OPD Consultation');

  // Time slots generation
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00'
  ];


  // Default appointment date: tomorrow or today
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FullBookingValues>({
    resolver: zodResolver(fullBookingSchema),
    defaultValues: {
      patientName: patientProfile?.full_name || '',
      patientAge: patientProfile?.age || undefined,
      patientGender: (patientProfile?.gender as any) || 'Male',
      patientAddress: patientProfile?.address || '',
      patientMobile: patientProfile?.mobile || '',
      specialityId: preSelectedSpec,
      doctorId: preSelectedDoc,
      appointmentDate: getTomorrowDate(),
      appointmentTime: '10:00',
      patientProblem: '',
      termsAccepted: false as any,
      termsVersion: 'v1.0',
    },
    mode: 'onTouched',
  });

  const selectedSpecialityId = watch('specialityId');
  const selectedDoctorId = watch('doctorId');
  const selectedDate = watch('appointmentDate');
  const selectedTime = watch('appointmentTime');
  const termsAccepted = watch('termsAccepted');

  // Load initial specialities
  useEffect(() => {
    const initData = async () => {
      try {
        const specs = await SpecialityService.getActiveSpecialities();
        setSpecialities(specs);

        if (preSelectedSpec) {
          setValue('specialityId', preSelectedSpec);
        } else if (specs.length > 0 && !selectedSpecialityId) {
          setValue('specialityId', specs[0].id);
        }
      } catch (err) {
        console.error('Error loading booking data:', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    initData();
  }, [preSelectedSpec, setValue]);

  // Load doctors filtered by speciality
  useEffect(() => {
    const loadDoctors = async () => {
      if (!selectedSpecialityId) {
        setDoctors([]);
        return;
      }
      try {
        const docs = await DoctorService.getActiveDoctors(selectedSpecialityId);
        setDoctors(docs);

        // Auto-select doctor if provided or first
        if (preSelectedDoc && docs.some((d) => d.id === preSelectedDoc)) {
          setValue('doctorId', preSelectedDoc);
        } else if (docs.length > 0 && (!selectedDoctorId || !docs.some((d) => d.id === selectedDoctorId))) {
          setValue('doctorId', docs[0].id);
        }
      } catch (err) {
        console.error('Error fetching doctors for booking:', err);
      }
    };

    loadDoctors();
  }, [selectedSpecialityId, preSelectedDoc, setValue]);

  // If user profile is loaded after mount, populate empty fields
  useEffect(() => {
    if (patientProfile) {
      if (!watch('patientName') && patientProfile.full_name) setValue('patientName', patientProfile.full_name);
      if (!watch('patientMobile') && patientProfile.mobile) setValue('patientMobile', patientProfile.mobile);
      if (!watch('patientAddress') && patientProfile.address) setValue('patientAddress', patientProfile.address);
      if (!watch('patientAge') && patientProfile.age) setValue('patientAge', patientProfile.age);
      if (patientProfile.gender) setValue('patientGender', patientProfile.gender);
    }
  }, [patientProfile, setValue, watch]);

  // Load existing appointments for the logged-in patient
  useEffect(() => {
    if (user?.id) {
      AppointmentService.getUserAppointments(
        user.id,
        patientProfile?.mobile || undefined,
        patientProfile?.email || user.email || undefined
      ).then((data) => {
        setExistingAppointments(data);
      });
    } else {
      setExistingAppointments([]);
    }
  }, [user?.id, patientProfile?.mobile, patientProfile?.email]);

  const handleAuthRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authFullName.trim()) {
      showToast('Please enter patient full name.', 'warning');
      return;
    }
    const cleanMobile = authMobile.trim().replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }
    if (!authEmail.trim() || !authEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }
    if (!authAge || Number(authAge) < 1) {
      showToast('Please enter patient age.', 'warning');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await registerPatient({
        fullName: authFullName.trim(),
        mobile: cleanMobile,
        email: authEmail.trim(),
        age: Number(authAge),
        gender: authGender,
        password: authPassword,
      });

      if (!res.success) {
        showToast(res.error || 'Failed to create patient account.', 'error');
      } else {
        setValue('patientName', authFullName.trim());
        setValue('patientMobile', cleanMobile);
        setValue('patientEmail', authEmail.trim());
        setValue('patientAge', Number(authAge));
        setValue('patientGender', authGender);
        if (authAddress.trim()) setValue('patientAddress', authAddress.trim());
        showToast('✓ Patient account created successfully! Proceed with your booking.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration error', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authIdentifier.trim() || !authLoginPassword) {
      showToast('Please enter your registered mobile/email and password.', 'warning');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await loginPatient(authIdentifier.trim(), authLoginPassword);
      if (!res.success) {
        showToast(res.error || 'Invalid credentials. Please verify your mobile/email and password.', 'error');
      } else {
        showToast('✓ Welcome back! Patient account verified.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Login error', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Step 1 to Step 2 Navigation
  const handleProceedToStep2 = async () => {
    if (!user) {
      showToast('Patient account is mandatory. Please create an account or sign in to continue.', 'warning');
      return;
    }
    const isValid = await trigger([
      'patientName',
      'patientAge',
      'patientGender',
      'patientAddress',
      'patientMobile',
    ]);
    if (isValid) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2 to Step 3 Navigation
  const handleProceedToStep3 = async () => {
    const isValid = await trigger([
      'specialityId',
      'doctorId',
      'appointmentDate',
      'appointmentTime',
      'patientProblem',
    ]);
    if (isValid) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Form submission: Create server-side order and navigate to payment
  const onSubmit = async (data: FullBookingValues) => {
    if (!user) {
      showToast('Patient account is mandatory to book an appointment.', 'error');
      setStep(1);
      return;
    }
    if (!data.termsAccepted) {
      showToast('You must accept the Terms & Conditions before proceeding.', 'warning');
      return;
    }

    setSubmittingOrder(true);
    try {
      // 1. Call server-side payment adapter
      const orderRes = await PaymentAdapter.createOrder(
        data.doctorId,
        data.specialityId,
        data.appointmentDate,
        data.appointmentTime,
        data.patientName
      );

      if (!orderRes.success) {
        showToast(orderRes.error || 'Failed to initialize booking order.', 'error');
        setSubmittingOrder(false);
        return;
      }

      // 2. Pass order information and booking form data into payment page
      navigate('/payment', {
        state: {
          orderId: orderRes.orderId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          provider: orderRes.provider,
          keyId: orderRes.keyId,
          doctorName: currentDoctor?.full_name || orderRes.doctorName || 'Doctor',
          specialityName: specialities.find((s) => s.id === data.specialityId)?.name || 'Speciality',
          bookingData: {
            ...data,
            patientUserId: user?.id || null,
          },
        },
      });
    } catch (err: any) {
      showToast(err.message || 'Error initializing appointment checkout', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#006655] mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Initializing Appointment Booking...</p>
      </div>
    );
  }

  // OWASP & RHYTHM MEDICITY SECURITY GATE: Unauthenticated patient must NOT access booking form directly
  if (!user) {
    const currentQuery = location.search ? location.search : (preSelectedDoc ? `?doctor=${preSelectedDoc}` : '');
    const returnUrl = `/appointment${currentQuery}`;
    const selectedDocObj = doctors.find((d) => d.id === (preSelectedDoc || selectedDoctorId));
    const selectedSpecObj = specialities.find((s) => s.id === (preSelectedSpec || selectedSpecialityId));

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-[#E5DEC9] shadow-xl p-8 sm:p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
          {/* Lock Icon */}
          <div className="w-20 h-20 rounded-3xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center mx-auto shadow-inner border border-[#006655]/20">
            <Lock className="w-10 h-10 text-[#006655]" />
          </div>

          {/* Dedicated Heading & Message */}
          <div className="flex flex-col items-center gap-3.5 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E0F2ED] text-[#006655] border border-[#006655]/20 text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#006655]" />
              <span>Patient Authentication Required</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#004C3D] tracking-tight leading-tight">
              Patient Account Required to Book Appointment
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-md">
              Please create a patient account or log in to continue with appointment booking.
            </p>
          </div>


          {/* Action Buttons: Login and Create Patient Account */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto pt-2 w-full">
            <Link
              to={`/login?redirect=${encodeURIComponent(returnUrl)}`}
              className="w-full sm:flex-1 h-12 flex items-center justify-center gap-2 px-6 rounded-2xl bg-[#006655] hover:bg-[#004C3D] text-white font-extrabold text-sm shadow-md shadow-[#006655]/20 transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>

            <Link
              to={`/login?mode=register&redirect=${encodeURIComponent(returnUrl)}`}
              className="w-full sm:flex-1 h-12 flex items-center justify-center gap-2 px-6 rounded-2xl bg-white hover:bg-[#E0F2ED] text-[#004C3D] hover:text-[#006655] font-extrabold text-sm border-2 border-[#006655]/40 transition-all hover:scale-[1.02] shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 text-[#006655]" />
              <span>Create Patient Account</span>
            </Link>
          </div>

          {/* Security & Benefits Guarantee */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#006655]" /> Secure Patient Portal
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#006655]" /> Instant Official A5 Slips
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#006655]" /> Realtime Status Tracking
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Top Banner & Multi-Step Progress Tracker */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-[#006655] uppercase tracking-widest block">
          Rhythm Medicity OPD
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#006655] tracking-tight">
          Schedule Patient Consultation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Complete the patient details, select your preferred doctor slot, and verify payment.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-100 rounded-2xl max-w-md mx-auto text-xs font-bold text-center">
        <div
          className={`py-2 rounded-xl transition ${
            step === 1 ? 'bg-white text-[#004C3D] shadow-xs' : 'text-slate-500'
          }`}
        >
          1. Patient Details
        </div>
        <div
          className={`py-2 rounded-xl transition ${
            step === 2 ? 'bg-white text-[#004C3D] shadow-xs' : 'text-slate-500'
          }`}
        >
          2. Slot & Doctor
        </div>
        <div
          className={`py-2 rounded-xl transition ${
            step === 3 ? 'bg-white text-[#004C3D] shadow-xs' : 'text-slate-500'
          }`}
        >
          3. Terms & Pay
        </div>
      </div>

      {/* Booking Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-8">
        {/* STEP 1: PATIENT DETAILS */}
        {/* STEP 1: PATIENT ACCOUNT & IDENTITY */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {!user ? (
              /* MANDATORY ACCOUNT CREATION / LOGIN GATEWAY */
              /* MANDATORY ACCOUNT CREATION / LOGIN GATEWAY */
              <div className="bg-gradient-to-br from-[#FBF8F1] via-white to-[#E0F2ED]/40 rounded-3xl border-2 border-[#006655]/25 p-6 sm:p-8 shadow-sm space-y-6">
                {/* Clean Full-Width Header */}
                <div className="space-y-4 pb-5 border-b border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#006655] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black tracking-wide uppercase shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      <span>Account Creation Mandatory</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-[#006655] tracking-tight">
                      Patient Account Required to Book Appointment
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                      As per hospital policy, patient account creation is mandatory before booking an OPD appointment.
                      Your account allows you to view your booked appointments, check live status, and download official A5 appointment slips.
                    </p>
                  </div>

                  {/* Benefit highlights */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006655]" />
                      <span>Track Appointment History</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <FileText className="w-3.5 h-3.5 text-[#006655]" />
                      <span>Download Official A5 Slips</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#006655]" />
                      <span>Verified Patient Identity</span>
                    </span>
                  </div>
                </div>

                {/* Full-Width Structured Tabs Switcher */}
                <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-[#006655] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>1. Create New Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-[#006655] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>2. Existing Patient Sign In</span>
                  </button>
                </div>

                {/* REGISTER MODE */}
                {authMode === 'register' && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-[#E0F2ED]/70 border border-[#006655]/20 rounded-xl p-3.5 text-xs text-[#004C3D] flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#006655] shrink-0" />
                      <div>
                        <strong className="font-bold">New Patient Registration:</strong> Fill in your details below to instantly create your hospital account and proceed with scheduling.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Patient Full Name *
                        </label>
                        <input
                          type="text"
                          value={authFullName}
                          onChange={(e) => setAuthFullName(e.target.value)}
                          placeholder="Legal full name of patient (e.g. Ramesh Patel)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Mobile Number (10 Digits) *
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={authMobile}
                          onChange={(e) => setAuthMobile(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 9876543210"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="e.g. patient@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Create Password (Min 6 Chars) *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Age (Years) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={authAge}
                          onChange={(e) => setAuthAge(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 35"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Gender *
                        </label>
                        <select
                          value={authGender}
                          onChange={(e) => setAuthGender(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                        >
                          {genderOptions.length > 0 ? (
                            genderOptions.map((opt) => (
                              <option key={opt.id} value={opt.name}>
                                {opt.name}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Residential Address
                        </label>
                        <input
                          type="text"
                          value={authAddress}
                          onChange={(e) => setAuthAddress(e.target.value)}
                          placeholder="Area, Street, City"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="font-bold text-[#006655] underline hover:text-[#004C3D] cursor-pointer"
                        >
                          Sign in here
                        </button>
                      </p>

                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={handleAuthRegister}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Creating Patient Account...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-[#C4A760]" />
                            <span>Create Account & Continue Booking →</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* LOGIN MODE */}
                {authMode === 'login' && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-[#E0F2ED]/70 border border-[#006655]/20 rounded-xl p-3.5 text-xs text-[#004C3D] flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#006655] shrink-0" />
                      <div>
                        <strong className="font-bold">Returning Patient Sign In:</strong> Enter your registered mobile number or email. You will see how many appointments you have booked and their current status.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Registered Mobile Number or Email *
                        </label>
                        <input
                          type="text"
                          value={authIdentifier}
                          onChange={(e) => setAuthIdentifier(e.target.value)}
                          placeholder="e.g. 9876543210 or name@mail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={authLoginPassword}
                            onChange={(e) => setAuthLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('register')}
                          className="font-bold text-[#006655] underline hover:text-[#004C3D] cursor-pointer"
                        >
                          Create one here (Mandatory)
                        </button>
                      </p>

                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={handleAuthLogin}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying Credentials...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-[#C4A760]" />
                            <span>Sign In & Continue Booking →</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* LOGGED IN PATIENT ACCOUNT & APPOINTMENT STATUS OVERVIEW */
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#003329] via-[#004C3D] to-[#003329] text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#E0F2ED] text-[#006655] font-black text-lg flex items-center justify-center shrink-0 border-2 border-[#C4A760]">
                        {(patientProfile?.full_name || profile?.full_name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-white">
                            {patientProfile?.full_name || profile?.full_name || 'Patient'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            Account Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {patientProfile?.mobile || 'Mobile Verified'} &bull; {patientProfile?.email || user.email || ''}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        showToast('Logged out of patient account', 'info');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition border border-white/20 self-start sm:self-auto cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Switch Account</span>
                    </button>
                  </div>

                  {/* Status & Booked Count Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-300 uppercase tracking-wider block">Total Booked</span>
                        <strong className="text-xl font-black text-white">{existingAppointments.length}</strong>
                      </div>
                      <div className="h-8 w-[1px] bg-white/20" />
                      <div>
                        <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Confirmed</span>
                        <strong className="text-xl font-black text-emerald-400">
                          {existingAppointments.filter((a) => a.appointment_status === 'CONFIRMED').length}
                        </strong>
                      </div>
                      <div className="h-8 w-[1px] bg-white/20" />
                      <div>
                        <span className="text-[10px] text-amber-300 uppercase tracking-wider block">Pending</span>
                        <strong className="text-xl font-black text-amber-400">
                          {existingAppointments.filter((a) => a.appointment_status === 'PENDING_PAYMENT').length}
                        </strong>
                      </div>
                    </div>

                    <Link
                      to="/dashboard/appointments"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C4A760] hover:bg-[#b0934c] text-slate-900 font-extrabold text-xs transition shadow-sm whitespace-nowrap self-start sm:self-auto"
                    >
                      <span>Check Booked Status ({existingAppointments.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Latest Appointment Alert if exists */}
                  {existingAppointments.length > 0 && (
                    <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>Latest Booking:</strong> #{existingAppointments[0].appointment_number} with {existingAppointments[0].doctor_name_snapshot} on {formatDate(existingAppointments[0].appointment_date)} &bull; Status:{' '}
                          <span className="font-extrabold text-emerald-300">{existingAppointments[0].appointment_status}</span>
                        </span>
                      </div>
                      <Link
                        to={`/appointment/${existingAppointments[0].id}`}
                        className="text-[#C4A760] hover:underline font-bold text-xs whitespace-nowrap flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Slip (A5)</span>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-[#006655] flex items-center gap-2">
                    <User className="w-5 h-5 text-[#006655]" />
                    Step 1: Patient Consultation Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Details auto-filled from your verified patient account. You can modify them if scheduling for a family member.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Patient Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('patientName')}
                      placeholder="Full legal name of the patient"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655]"
                    />
                    {errors.patientName && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.patientName.message}
                      </p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      {...register('patientAge', { valueAsNumber: true })}
                      placeholder="e.g. 35"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655]"
                    />
                    {errors.patientAge && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.patientAge.message}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Gender *
                    </label>
                    <select
                      {...register('patientGender')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                    >
                      {genderOptions.length > 0 ? (
                        genderOptions.map((opt) => (
                          <option key={opt.id} value={opt.name}>
                            {opt.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                    {errors.patientGender && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.patientGender.message}
                      </p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number (Indian 10-Digit) *
                    </label>
                    <input
                      type="tel"
                      {...register('patientMobile')}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655]"
                    />
                    {errors.patientMobile && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.patientMobile.message}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      {...register('patientEmail')}
                      placeholder="e.g. patient@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655]"
                    />
                    {errors.patientEmail && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.patientEmail.message}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Residential Address *
                    </label>
                    <textarea
                      rows={2}
                      {...register('patientAddress')}
                      placeholder="Street address, city, pin code"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none"
                    />
                    {errors.patientAddress && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.patientAddress.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="px-6 py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Doctor & Slot</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: APPOINTMENT DETAILS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#006655] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#006655]" />
                Step 2: Department, Doctor & Slot
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Doctors are dynamically loaded based on the selected speciality.
              </p>
            </div>

            <div className="space-y-5">
              {/* Select Speciality */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Medical Speciality *
                </label>
                <select
                  {...register('specialityId')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                >
                  <option value="">-- Choose Department --</option>
                  {specialities.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
                {errors.specialityId && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.specialityId.message}
                  </p>
                )}
              </div>

              {/* Select Doctor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Doctor *
                </label>
                {doctors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {doctors.map((doc) => (
                      <label
                        key={doc.id}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                          selectedDoctorId === doc.id
                            ? 'border-teal-600 bg-[#E0F2ED]/70 ring-2 ring-[#006655]/30'
                            : 'border-slate-200 hover:border-teal-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          value={doc.id}
                          {...register('doctorId')}
                          className="sr-only"
                        />
                        {doc.photo_url ? (
                          <img
                            src={doc.photo_url}
                            alt={doc.full_name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#E5DEC9] shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#E0F2ED] text-[#004C3D] flex items-center justify-center font-bold shrink-0">
                            {doc.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-[#006655] text-sm">{doc.full_name}</div>
                          <div className="text-xs text-slate-500">{doc.qualification}</div>
                          <div className="text-xs font-bold text-[#004C3D] mt-0.5">
                            Fee: {formatCurrency(doc.consultation_fee)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
                    No active doctors currently available in this speciality. Please choose another department or contact reception.
                  </div>
                )}
                {errors.doctorId && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.doctorId.message}
                  </p>
                )}
              </div>

              {/* Select Appointment Type (Admin Dynamic Dropdown) */}
              {appointmentTypeOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Appointment Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {appointmentTypeOptions.map((typeOpt) => {
                      const isSelected = selectedAppointmentType === typeOpt.name;
                      return (
                        <button
                          type="button"
                          key={typeOpt.id}
                          onClick={() => setSelectedAppointmentType(typeOpt.name)}
                          className={`p-2.5 rounded-xl border text-left transition text-xs font-semibold cursor-pointer ${
                            isSelected
                              ? 'bg-[#006655] text-white border-[#006655] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                          }`}
                        >
                          <span className="block font-bold">{typeOpt.name}</span>
                          {typeOpt.description && (
                            <span
                              className={`text-[10px] block mt-0.5 truncate ${
                                isSelected ? 'text-[#93D3C3]' : 'text-slate-500'
                              }`}
                            >
                              {typeOpt.description}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Consultation Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('appointmentDate')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                  />
                  {errors.appointmentDate && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.appointmentDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Time Slot *
                  </label>
                  <select
                    {...register('appointmentTime')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} (OPD Slot)
                      </option>
                    ))}
                  </select>
                  {errors.appointmentTime && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.appointmentTime.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Visit Reason Quick Selection (Admin Dynamic Dropdown) */}
              {visitReasonOptions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Reason for Visit (Admin-Managed Options)
                    </label>
                    <span className="text-[10px] text-slate-500">Select to populate symptoms</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {visitReasonOptions.map((reasonOpt) => (
                      <button
                        type="button"
                        key={reasonOpt.id}
                        onClick={() => {
                          const currentVal = watch('patientProblem');
                          if (!currentVal) {
                            setValue('patientProblem', reasonOpt.name, { shouldValidate: true });
                          } else if (!currentVal.includes(reasonOpt.name)) {
                            setValue('patientProblem', `${currentVal}, ${reasonOpt.name}`, { shouldValidate: true });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#E0F2ED] hover:text-[#004C3D] text-slate-700 text-[11px] font-semibold border border-slate-200 transition active:scale-95 cursor-pointer"
                      >
                        + {reasonOpt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Patient Problem / Symptoms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Health Concern / Symptoms *
                </label>
                <textarea
                  rows={3}
                  {...register('patientProblem')}
                  placeholder="Briefly describe your symptoms, duration, and health concerns..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none"
                />
                {errors.patientProblem && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.patientProblem.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={doctors.length === 0}
                className="px-6 py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <span>Review & Terms</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TERMS & CONDITIONS & PAYMENT ORDER PREPARATION */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#006655] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006655]" />
                Step 3: Terms & Payment Authorization
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review the consultation summary and accept hospital terms to proceed to payment.
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3 text-xs">
              <div className="font-bold text-[#006655] text-sm">Consultation Summary</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Patient Name:</span>
                  <strong className="text-slate-800">{watch('patientName')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Mobile:</span>
                  <strong className="text-slate-800">{watch('patientMobile')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Doctor:</span>
                  <strong className="text-slate-800">{currentDoctor?.full_name || 'Selected Doctor'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Slot Time:</span>
                  <strong className="text-slate-800">
                    {watch('appointmentDate')} at {watch('appointmentTime')}
                  </strong>
                </div>
              </div>

              {/* Consultation Fee Notice */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Doctor Consultation Fee:</span>
                <span className="text-base font-black text-[#004C3D]">
                  {currentDoctor ? formatCurrency(currentDoctor.consultation_fee) : '₹0'}
                </span>
              </div>
            </div>

            {/* Scrollable Terms & Conditions Section (Section 18) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Hospital Terms & Conditions (Version {watch('termsVersion') || 'v1.0'})
              </label>
              <div className="max-h-40 overflow-y-auto p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-600 space-y-2 leading-relaxed">
                <p className="font-semibold text-slate-800">1. Appointment Arrival & Verification</p>
                <p>
                  Patients are requested to arrive at Rhythm Medicity reception 15 minutes prior to their scheduled consultation slot. Please present your digital or printed A5 appointment slip with the generated sequential appointment number.
                </p>
                <p className="font-semibold text-slate-800">2. Consultation Fees & Server-side Calculation</p>
                <p>
                  Consultation fees are resolved server-side from official doctor records. All payments are verified cryptographically through the hospital payment gateway before confirming the appointment.
                </p>
                <p className="font-semibold text-slate-800">3. Rescheduling & Cancellations</p>
                <p>
                  Cancellations must be processed at least 2 hours before the scheduled appointment time. In case of unexpected physician emergency or on-leave status, patients will be promptly notified with an alternative slot.
                </p>
                <p className="font-semibold text-slate-800">4. Medical Privacy & Clinical Notes</p>
                <p>
                  Your clinical notes and reason for visit are strictly protected under patient confidentiality protocols and accessible only to authorized medical personnel.
                </p>
              </div>

              {/* Required Terms Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E5DEC9] bg-[#E0F2ED]/40 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="mt-0.5 w-4 h-4 text-[#006655] rounded border-slate-300 focus:ring-[#006655]"
                />
                <span className="text-xs text-slate-800 font-medium leading-tight">
                  I have read, understood, and agree to the Hospital Terms & Conditions. I authorize Rhythm Medicity to proceed with the consultation reservation.
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.termsAccepted.message}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="submit"
                disabled={!termsAccepted || submittingOrder}
                className="px-8 py-3.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-[#006655]/20 transition flex items-center gap-2"
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Payment Order...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Proceed to Secure Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
