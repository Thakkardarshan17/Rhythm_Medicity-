import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, FileText, Lock, LogIn, ShieldAlert } from 'lucide-react';
import { AppointmentService } from '../services/appointmentService';
import { Appointment } from '../types/database';
import { AppointmentLetterView } from '../components/AppointmentLetterView';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';

export const AppointmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, patientProfile, isAdmin } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;
      try {
        const data = await AppointmentService.getAppointmentById(id);
        setAppointment(data);
      } catch (err) {
        console.error('Error fetching appointment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  // Section 10: Require authenticated session
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-[#E5DEC9] shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-[#004C3D]">
            Your session has expired. Please log in again to continue.
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Official appointment letters and patient records require an active authenticated session.
          </p>
        </div>
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#006655] hover:bg-[#004C3D] text-white font-extrabold text-sm shadow-md transition cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Login Again</span>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#006655] mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Generating Official Appointment Letter...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <EmptyState
          icon={FileText}
          title="Appointment Record Not Found"
          description="The requested appointment does not exist or could not be verified."
          actionText="Book an Appointment"
          actionHref="/appointment"
        />
      </div>
    );
  }

  // Section 11: Patient Data Security - Must verify ownership
  const isOwner =
    isAdmin ||
    appointment.patient_user_id === user.id ||
    ((appointment as any).patient_email && user.email && (appointment as any).patient_email.toLowerCase() === user.email.toLowerCase()) ||
    (appointment.patient_mobile && patientProfile?.mobile && appointment.patient_mobile === patientProfile.mobile);

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 shadow-md text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-rose-900">Access Denied</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          You are not authorized to view this patient's appointment letter. Under hospital privacy policy, medical records are restricted to the verified account owner.
        </p>
        <Link
          to="/dashboard/appointments"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#006655] text-white text-xs font-bold hover:bg-[#004C3D] transition shadow-xs"
        >
          View My Appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="no-print flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006655] hover:text-[#004C3D]"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Website
        </Link>
        <Link
          to="/user"
          className="text-xs font-bold text-slate-600 hover:text-[#006655]"
        >
          Go to Patient Portal →
        </Link>
      </div>

      {/* Render Official A5 Appointment Slip */}
      <AppointmentLetterView appointment={appointment} />
    </div>
  );
};
