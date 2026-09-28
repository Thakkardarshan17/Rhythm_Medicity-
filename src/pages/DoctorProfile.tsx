import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Award,
  Clock,
  MapPin,
  CheckCircle2,
  FileBadge,
  Globe,
  ArrowLeft,
  Activity,
  Phone,
  MessageCircle,
  Building2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { DoctorService } from '../services/doctorService';
import { Doctor } from '../types/database';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';

export const DoctorProfile: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const identifier = slug || id;
  const { websiteUISettings, hospitalSettings } = useSettings();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const primaryColor = websiteUISettings.primary_color || '#006655';
  const secondaryColor = websiteUISettings.secondary_color || '#003329';
  const accentColor = websiteUISettings.accent_color || '#C4A760';

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDoc = async () => {
      if (!identifier) return;
      try {
        const data = await DoctorService.getDoctorBySlugOrId(identifier);
        setDoctor(data);
      } catch (err) {
        console.error('Error fetching doctor profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [identifier]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 w-36 bg-slate-200 rounded-lg" />
        <div className="h-72 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <EmptyState
          title="Doctor Profile Not Found"
          description="The requested medical practitioner profile does not exist or has been deactivated."
          actionText="← Back to Doctors"
          actionHref="/doctors"
        />
      </div>
    );
  }

  const departmentName = (doctor as any).department || doctor.speciality?.name || 'Specialist';
  const contactPhone = (doctor as any).phone || hospitalSettings.phone;
  const whatsappNum = (doctor as any).whatsapp_number || hospitalSettings.whatsapp_number;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation breadcrumb / Back button */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-white hover:bg-[#E0F2ED] text-[#004C3D] border border-[#E5DEC9] transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#006655]" />
          <span>← Back to Doctors</span>
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden bg-white">
        {/* Themed Hero Header with Full High-Contrast Readability */}
        <div
          className="relative px-6 py-8 sm:px-10 sm:py-10 text-white overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
          }}
        >
          {/* Subtle medical geometric pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C4A760_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
            {/* Left: Avatar + Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left flex-1 min-w-0">
              {/* Profile Image */}
              <div className="relative shrink-0">
                {doctor.photo_url ? (
                  <img
                    src={doctor.photo_url}
                    alt={doctor.full_name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-4 border-white/90 shadow-2xl bg-white"
                  />
                ) : (
                  <div
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center font-black text-4xl border-4 border-white/90 shadow-2xl bg-white/10 text-white backdrop-blur-md"
                  >
                    {doctor.full_name.charAt(0)}
                  </div>
                )}
                {(doctor.status === 'active' || (doctor.status as any) === 'ACTIVE') && (
                  <span className="absolute -bottom-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white border-2 border-white shadow-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    ACTIVE
                  </span>
                )}
              </div>

              {/* Text Info */}
              <div className="space-y-3 flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/30">
                    {doctor.speciality?.name || 'Specialist'}
                  </span>
                  {(doctor as any).department && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md"
                      style={{
                        backgroundColor: 'rgba(196, 167, 96, 0.25)',
                        color: '#FFE29A',
                        borderColor: 'rgba(196, 167, 96, 0.5)',
                      }}
                    >
                      Dept: {(doctor as any).department}
                    </span>
                  )}
                </div>

                {/* Doctor Name */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-xs">
                  {doctor.full_name}
                </h1>

                {/* Qualification */}
                <p className="text-sm sm:text-base font-semibold text-emerald-100/90 leading-snug">
                  {doctor.qualification}
                </p>

                {/* Experience & Registration */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-white/80 pt-1">
                  <span className="flex items-center gap-1.5 font-medium bg-black/20 px-3 py-1 rounded-lg border border-white/10">
                    <Award className="w-4 h-4 text-[#FFD770]" />
                    <span>{doctor.experience_years} Years Experience</span>
                  </span>
                  {doctor.registration_number && (
                    <span className="flex items-center gap-1.5 font-medium bg-black/20 px-3 py-1 rounded-lg border border-white/10">
                      <FileBadge className="w-4 h-4 text-[#FFD770]" />
                      <span>Reg: {doctor.registration_number}</span>
                    </span>
                  )}
                  {doctor.clinic_room && (
                    <span className="flex items-center gap-1.5 font-medium bg-black/20 px-3 py-1 rounded-lg border border-white/10">
                      <MapPin className="w-4 h-4 text-[#FFD770]" />
                      <span>{doctor.clinic_room}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Consultation Fee & Actions Card */}
            <div className="w-full lg:w-72 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex flex-col justify-between gap-4 shadow-lg">
              <div className="text-center lg:text-left">
                <span className="text-xs uppercase tracking-wider font-semibold text-white/70 block">
                  Consultation Fee
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white mt-0.5">
                  {formatCurrency(doctor.consultation_fee)}
                </div>
                <span className="text-[11px] text-emerald-100/70 block mt-0.5">
                  Per OPD consultation session
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/15">
                <Link
                  to={`/appointment?doctor=${doctor.id}&speciality=${doctor.speciality_id || ''}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#C4A760] hover:bg-[#B3954E] text-[#003329] font-black text-sm shadow-md transition transform active:scale-95"
                >
                  <Calendar className="w-4 h-4 shrink-0 text-[#003329]" />
                  <span>Book Appointment</span>
                </Link>

                {whatsappNum && (
                  <a
                    href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold text-xs border border-emerald-400/40 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details Content Section */}
        <div className="p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Biography, Days, Languages */}
            <div className="lg:col-span-2 space-y-8">
              {/* About the Doctor */}
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 mb-3 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  About the Doctor
                </h2>
                <div className="text-sm sm:text-base text-slate-700 leading-relaxed bg-slate-50/90 p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  {doctor.bio || 'Comprehensive clinical consultation, specialized diagnostic reviews, patient counseling, and therapeutic management provided.'}
                </div>
              </div>

              {/* Weekly Consultation Days */}
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                  Weekly Consultation Days
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isAvailable = doctor.available_days && doctor.available_days.length > 0
                      ? doctor.available_days.includes(day)
                      : day !== 'Sunday';
                    return (
                      <div
                        key={day}
                        className={`p-3 rounded-xl text-center text-xs font-bold border transition ${
                          isAvailable
                            ? 'border-emerald-300 text-emerald-900 bg-emerald-50/90 shadow-xs ring-1 ring-emerald-200/50'
                            : 'border-slate-200 text-slate-400 bg-slate-100/60 line-through'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Languages Spoken */}
              {doctor.languages && doctor.languages.length > 0 && (
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: accentColor }} /> Languages Spoken
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 shadow-xs"
                        style={{ backgroundColor: '#E0F2ED', color: primaryColor }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: OPD Schedule & Hospital Chamber Box */}
            <div className="bg-slate-50/90 p-6 rounded-3xl border border-slate-200/90 space-y-6 shadow-sm">
              <h3
                className="font-black text-xs uppercase tracking-wider pb-3 border-b border-slate-200 flex items-center justify-between"
                style={{ color: primaryColor }}
              >
                <span>OPD Schedule & Room</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/60">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accentColor }} />
                  <div>
                    <span className="font-bold text-slate-800 block">Consultation Hours</span>
                    <span className="text-slate-600 font-semibold">
                      {doctor.available_time_start || '09:00'} - {doctor.available_time_end || '17:00'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/60">
                  <Activity className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accentColor }} />
                  <div>
                    <span className="font-bold text-slate-800 block">Slot Duration</span>
                    <span className="text-slate-600 font-semibold">{doctor.consultation_duration || 15} minutes</span>
                  </div>
                </div>

                {doctor.clinic_room && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/60">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accentColor }} />
                    <div>
                      <span className="font-bold text-slate-800 block">OPD Chamber / Room</span>
                      <span className="text-slate-600 font-semibold">{doctor.clinic_room}</span>
                    </div>
                  </div>
                )}

                {contactPhone && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200/60">
                    <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accentColor }} />
                    <div>
                      <span className="font-bold text-slate-800 block">Contact Desk</span>
                      <a
                        href={`tel:${contactPhone}`}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link
                  to={`/appointment?doctor=${doctor.id}&speciality=${doctor.speciality_id || ''}`}
                  className="w-full block text-center py-3.5 text-white rounded-xl font-black text-xs shadow-md transition transform active:scale-95 hover:brightness-110"
                  style={{ backgroundColor: primaryColor }}
                >
                  Book Instant Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

