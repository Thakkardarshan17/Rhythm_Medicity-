import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  FileText,
  Home,
  Activity,
  Download,
  Printer,
  MessageCircle,
  Share2,
  Loader2,
  Building2,
  PhoneForwarded,
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import { WhatsAppService } from '../lib/whatsapp';
import { generateAppointmentPdf, printAppointmentLetter } from '../utils/pdfGenerator';
import { AppointmentService } from '../services/appointmentService';
import { Appointment } from '../types/database';

export const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hospitalSettings } = useSettings();
  const { showToast } = useToast();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [hospitalNotified, setHospitalNotified] = useState(false);

  const state = location.state as {
    appointmentId: string;
    appointmentNumber: string;
    amount: number;
    paymentId: string;
    doctorName: string;
    specialityName: string;
    date: string;
    time: string;
    patientName: string;
  } | null;

  useEffect(() => {
    // Trigger celebratory confetti
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#006655', '#C4A760', '#10b981', '#004C3D', '#3b82f6'],
    });

    if (state?.appointmentId) {
      AppointmentService.getAppointmentById(state.appointmentId).then((data) => {
        if (data) setAppointment(data);
      });
    }
  }, [state?.appointmentId]);

  if (!state) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No Payment Confirmation Found</h2>
        <p className="text-xs text-slate-500">
          Please check your appointments in the User Portal or start a new booking.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#006655] text-white font-semibold text-xs shadow-md"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const {
    appointmentId,
    appointmentNumber,
    amount,
    paymentId,
    doctorName,
    specialityName,
    date,
    time,
    patientName,
  } = state;

  const handleNotifyHospitalWhatsApp = () => {
    const hospitalWhatsAppNum = hospitalSettings.whatsapp_number || '+91 98250 12345';
    const mockAppt: any = appointment || {
      id: appointmentId,
      appointment_number: appointmentNumber,
      patient_name: patientName,
      patient_mobile: '+91 Patient Mobile',
      doctor_name_snapshot: doctorName,
      speciality_name_snapshot: specialityName,
      appointment_date: date,
      appointment_time: time,
      consultation_fee: amount,
      payment_status: 'PAID',
    };

    const url = WhatsAppService.getHospitalWhatsAppUrl(
      hospitalWhatsAppNum,
      mockAppt,
      hospitalSettings.hospital_name
    );

    try {
      window.open(url, '_blank');
      setHospitalNotified(true);
      showToast('Opening Hospital WhatsApp booking request notification...', 'success');
    } catch {
      showToast('Appointment confirmed successfully. WhatsApp notification could not be opened.', 'info');
    }
  };

  const handlePatientWhatsApp = async () => {
    if (!appointment) {
      showToast('Preparing WhatsApp message...', 'info');
      return;
    }
    const res = await WhatsAppService.sendAppointmentConfirmation(appointment, hospitalSettings.hospital_name);
    if (res.directUrl) {
      window.open(res.directUrl, '_blank');
    }
    showToast(res.message, 'success');
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const docElementId = `appointment-letter-${appointmentId}`;
      await generateAppointmentPdf(docElementId, appointmentNumber);
      showToast('Appointment Letter PDF (A5) downloaded successfully.', 'success');
    } catch {
      // Fallback: navigate to letter page
      navigate(`/appointment/${appointmentId}`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    printAppointmentLetter(`appointment-letter-${appointmentId}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Animated Success Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-3xl border border-emerald-100 shadow-2xl p-6 sm:p-10 text-center space-y-6 relative overflow-hidden"
      >
        {/* Soft pulse glow background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#E0F2ED] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#E0F2ED] rounded-full blur-3xl pointer-events-none" />

        {/* Animated Circle and Checkmark */}
        <div className="relative inline-flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 14 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#004C3D] to-[#006655] flex items-center justify-center text-white shadow-xl shadow-emerald-700/30"
          >
            <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
          </motion.div>
          {/* Subtle ECG pulse badge */}
          <div className="absolute -bottom-3 px-3.5 py-1 bg-white border border-[#006655]/30 rounded-full shadow-xs flex items-center gap-1.5 text-[11px] font-black text-[#004C3D] uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-[#006655] animate-pulse" />
            <span>Appointment Confirmed</span>
          </div>
        </div>

        {/* Titles */}
        <div className="space-y-1.5 pt-3">
          <h1 className="text-2xl sm:text-3xl font-black text-[#003329] tracking-tight">
            ✓ PAYMENT SUCCESSFUL
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-md mx-auto">
            Your consultation booking at {hospitalSettings.hospital_name || 'Rhythm Medicity'} has been authorized and confirmed in the medical database.
          </p>
        </div>

        {/* Appointment Information Card */}
        <div className="bg-slate-50/90 rounded-3xl p-6 border border-slate-200/90 text-left space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200/90 gap-2">
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">
                Official Appointment ID
              </span>
              <span className="font-mono font-black text-[#004C3D] text-2xl tracking-wider">
                {appointmentNumber}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">
                Payment Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PAID ({formatCurrency(amount)})</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block font-semibold">Patient Name</span>
              <strong className="text-slate-800 text-sm font-black">{patientName}</strong>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block font-semibold">Assigned Doctor</span>
              <strong className="text-slate-800 text-sm font-black">{doctorName}</strong>
              <span className="text-[11px] text-slate-500 block">Dept: {specialityName}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block font-semibold">Scheduled Date</span>
              <strong className="text-slate-800 font-bold">{formatDate(date)}</strong>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block font-semibold">Scheduled Time Window</span>
              <strong className="text-slate-800 font-bold">{formatTime(time)}</strong>
            </div>

            <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block font-semibold">Payment Transaction ID</span>
                <span className="font-mono text-slate-700 text-xs font-bold">{paymentId}</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Hospital WhatsApp Notification Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PhoneForwarded className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                Hospital WhatsApp Notification
              </span>
              <span className="text-[11px] text-emerald-800/80">
                Send appointment summary to hospital desk ({hospitalSettings.whatsapp_number || '+91 98250 12345'})
              </span>
            </div>
          </div>

          <button
            onClick={handleNotifyHospitalWhatsApp}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{hospitalNotified ? 'Sent / Re-Send' : 'Send to Hospital'}</span>
          </button>
        </div>

        {/* Actions Grid */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to={`/appointment/${appointmentId}`}
              className="px-6 py-3.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-black text-xs shadow-md shadow-[#006655]/20 transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>VIEW APPOINTMENT LETTER</span>
            </Link>

            <Link
              to={`/appointment/${appointmentId}`}
              className="px-6 py-3.5 rounded-xl bg-[#C4A760] hover:bg-[#B3954E] text-[#003329] font-black text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-[#003329]" />
              <span>DOWNLOAD PDF (A5)</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handlePatientWhatsApp}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Send on WhatsApp</span>
            </button>

            <Link
              to="/user"
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>Patient Dashboard</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

