import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Stethoscope,
  Award,
  Clock,
  Calendar,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Building2,
  IndianRupee,
  FileBadge,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Doctor } from '../types/database';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/formatters';

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  doctor,
  isOpen,
  onClose,
}) => {
  const { websiteUISettings, hospitalSettings } = useSettings();

  if (!isOpen || !doctor) return null;

  const primaryColor = websiteUISettings.primary_color || '#006655';
  const secondaryColor = websiteUISettings.secondary_color || '#003329';
  const accentColor = websiteUISettings.accent_color || '#C4A760';

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const availableDays = doctor.available_days && doctor.available_days.length > 0
    ? doctor.available_days
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const contactPhone = (doctor as any).phone || hospitalSettings.phone;
  const whatsappNum = (doctor as any).whatsapp_number || hospitalSettings.whatsapp_number;
  const departmentName = (doctor as any).department || doctor.speciality?.name || 'Clinical Care';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Dynamic Themed Hero Header */}
        <div
          className="relative p-6 sm:p-8 text-white shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
          }}
        >
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C4A760_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition backdrop-blur-xs"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
            {/* Doctor Photo */}
            <div className="relative shrink-0">
              {doctor.photo_url ? (
                <img
                  src={doctor.photo_url}
                  alt={doctor.full_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-3 border-white/80 shadow-lg bg-white"
                />
              ) : (
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center font-black text-3xl border-3 border-white/80 shadow-lg"
                  style={{ backgroundColor: '#E0F2ED', color: primaryColor }}
                >
                  {doctor.full_name.charAt(0)}
                </div>
              )}
              {(doctor.status === 'active' || (doctor.status as any) === 'ACTIVE') && (
                <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white border-2 border-white shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  AVAILABLE
                </span>
              )}
            </div>

            {/* Doctor Info */}
            <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FBF8F1' }}
                >
                  {doctor.speciality?.name || 'Senior Consultant'}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'rgba(196, 167, 96, 0.25)',
                    color: accentColor,
                    borderColor: 'rgba(196, 167, 96, 0.4)',
                  }}
                >
                  Dept: {departmentName}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {doctor.full_name}
              </h2>

              <p className="text-xs sm:text-sm font-medium text-white/90">
                {doctor.qualification}
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  {doctor.experience_years} Years Clinical Practice
                </span>
                {doctor.registration_number && (
                  <span className="flex items-center gap-1">
                    <FileBadge className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    Reg: {doctor.registration_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6 flex-1 bg-slate-50/50">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Consultation Fee
              </span>
              <span
                className="text-lg font-black block mt-0.5"
                style={{ color: primaryColor }}
              >
                {formatCurrency(doctor.consultation_fee)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                OPD Chamber
              </span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5 truncate">
                {doctor.clinic_room || 'Room 102, OPD Floor 1'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Slot Duration
              </span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {doctor.consultation_duration || 15} Mins
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Timing Window
              </span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {doctor.available_time_start || '09:00'} - {doctor.available_time_end || '17:00'}
              </span>
            </div>
          </div>

          {/* Schedule & Availability Days */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                Weekly Schedule & Available Days
              </span>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
                {doctor.available_time_start || '09:00 AM'} - {doctor.available_time_end || '05:00 PM'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {allDays.map((day) => {
                const isAvail = availableDays.includes(day);
                return (
                  <span
                    key={day}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      isAvail
                        ? 'text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 opacity-60'
                    }`}
                    style={
                      isAvail
                        ? { backgroundColor: primaryColor }
                        : {}
                    }
                  >
                    {isAvail && <CheckCircle2 className="w-3 h-3 text-white" />}
                    {day.slice(0, 3)}
                  </span>
                );
              })}
            </div>
          </div>

          {/* About Doctor / Description */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4" style={{ color: primaryColor }} />
              About Doctor & Medical Background
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {doctor.bio ||
                `${doctor.full_name} is an experienced medical practitioner at ${hospitalSettings.hospital_name || 'RHYTHM MEDICITY'} specializing in ${doctor.speciality?.name || 'General Medicine'} and dedicated to personalized clinical care.`}
            </p>
          </div>

          {/* Direct Communication Channels */}
          {(contactPhone || whatsappNum) && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Doctor / Department Direct Contact
              </span>
              <div className="flex flex-wrap gap-3">
                {whatsappNum && (
                  <a
                    href={`https://wa.me/${whatsappNum.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp: {whatsappNum}</span>
                  </a>
                )}
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
                  >
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>Call: {contactPhone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Consultation Fee: </span>
            <strong className="text-slate-800 text-sm">{formatCurrency(doctor.consultation_fee)}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              Close
            </button>
            <Link
              to={`/appointment?doctor=${doctor.id}&speciality=${doctor.speciality_id || ''}`}
              onClick={onClose}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition hover:scale-102"
              style={{
                backgroundColor: accentColor,
              }}
            >
              <Calendar className="w-4 h-4 text-white" />
              <span>Book Appointment</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailModal;
