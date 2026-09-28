import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Loader2,
  FileText,
  Hospital,
  AlertTriangle,
} from 'lucide-react';
import { AppointmentService } from '../services/appointmentService';
import { Appointment } from '../types/database';
import { AppointmentLetterView } from '../components/AppointmentLetterView';
import { useSettings } from '../contexts/SettingsContext';
import { formatDate, formatTime } from '../utils/formatters';

export const AppointmentVerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hospitalSettings } = useSettings();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await AppointmentService.getAppointmentById(id);
        setAppointment(data);
      } catch (err) {
        console.error('Error fetching verified appointment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#006655]" />
        <p className="text-sm font-semibold text-slate-600">
          Verifying Official Appointment Document with Rhythm Medicity Secure Vault...
        </p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Invalid or Unverified Document</h2>
        <p className="text-xs text-slate-500">
          The requested appointment verification record could not be found or has expired. Please verify your reference number.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-md transition"
        >
          Return to Hospital Website
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Verification Badge */}
      <div className="no-print bg-gradient-to-r from-[#003329] to-[#004C3D] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                AUTHENTIC HOSPITAL DOCUMENT VERIFIED
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                VALID
              </span>
            </div>
            <p className="text-xs text-[#93D3C3] font-light mt-0.5">
              Appointment #{appointment.appointment_number} is registered in the official clinical records of {hospitalSettings.hospital_name || 'Rhythm Medicity'}.
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#C4A760] hover:text-white font-bold transition whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Hospital Home</span>
        </Link>
      </div>

      {/* Render Document */}
      <AppointmentLetterView appointment={appointment} />
    </div>
  );
};
