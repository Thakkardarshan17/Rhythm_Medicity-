import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  FileText,
  PlusCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Stethoscope,
  MapPin,
  Navigation,
  Phone,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { AppointmentService } from '../../services/appointmentService';
import { DoctorService } from '../../services/doctorService';
import { Appointment, Doctor } from '../../types/database';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { EmptyState } from '../../components/EmptyState';
import { DoctorDetailModal } from '../../components/DoctorDetailModal';

export const UserDashboard: React.FC = () => {
  const { user, profile, patientProfile } = useAuth();
  const { hospitalSettings } = useSettings();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  const hospitalName = hospitalSettings.hospital_name || 'RHYTHM MEDICITY';
  const hospitalAddress =
    hospitalSettings.address ||
    '79, Gotri Rd, Karmjyot Society, Gotri, Vadodara, Gujarat 390007';
  const hospitalPhone =
    hospitalSettings.phone || hospitalSettings.emergency_number || '+91 7201030048';
  const mapsSearchQuery = encodeURIComponent(`${hospitalName} ${hospitalAddress}`);
  const googleMapsDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;

  const handleViewDoctor = async (apt: Appointment) => {
    if (apt.doctor) {
      setSelectedDoctor(apt.doctor);
      setIsDoctorModalOpen(true);
      return;
    }
    if (apt.doctor_id) {
      try {
        const doc = await DoctorService.getDoctorById(apt.doctor_id);
        if (doc) {
          setSelectedDoctor(doc);
          setIsDoctorModalOpen(true);
          return;
        }
      } catch (err) {
        console.error('Error fetching doctor details:', err);
      }
    }
    setSelectedDoctor({
      id: apt.doctor_id,
      full_name: apt.doctor_name_snapshot,
      qualification: 'Senior Specialist / Consultant',
      experience_years: 10,
      consultation_fee: apt.consultation_fee,
      status: 'active',
      available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      available_time_start: '09:00',
      available_time_end: '17:00',
      speciality: { name: apt.speciality_name_snapshot } as any,
    } as unknown as Doctor);
    setIsDoctorModalOpen(true);
  };

  useEffect(() => {
    const fetchUserAppointments = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await AppointmentService.getUserAppointments(
          user.id,
          patientProfile?.mobile || undefined,
          patientProfile?.email || user.email || undefined
        );
        setAppointments(data);
      } catch (err) {
        console.error('Error fetching user appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAppointments();
  }, [user?.id, patientProfile?.mobile, patientProfile?.email]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#006655] mx-auto" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingApt = appointments.find(
    (a) => a.appointment_date >= todayStr && a.appointment_status !== 'CANCELLED'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#003329] to-[#004C3D] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-xs font-bold text-[#C4A760] uppercase tracking-widest block">
            Patient Portal
          </span>
          <h1 className="text-2xl font-black mt-1">
            Welcome, {profile?.full_name || 'Patient'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Access your consultation slips, appointment status, and health schedule.
          </p>
        </div>
        <Link
          to="/appointment"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-md transition border border-white/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book Appointment</span>
        </Link>
      </div>

      {/* Real Live Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Appointments
          </span>
          <span className="text-3xl font-black text-[#006655] mt-1 block">
            {appointments.length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Upcoming Consultations
          </span>
          <span className="text-3xl font-black text-[#006655] mt-1 block">
            {appointments.filter((a) => a.appointment_date >= todayStr && a.appointment_status !== 'CANCELLED').length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Completed Visits
          </span>
          <span className="text-3xl font-black text-[#006655] mt-1 block">
            {appointments.filter((a) => a.appointment_status === 'COMPLETED').length}
          </span>
        </div>
      </div>

      {/* Upcoming / Recent Appointment Cards */}
      {upcomingApt && (
        <div className="bg-white rounded-3xl border border-[#E5DEC9] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-bold text-[#006655] text-base">Next Upcoming Consultation</h2>
            </div>
            <span className="font-mono text-xs font-bold text-[#004C3D] bg-[#E0F2ED] px-2 py-0.5 rounded">
              #{upcomingApt.appointment_number}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Doctor & Speciality</span>
              <button
                type="button"
                onClick={() => handleViewDoctor(upcomingApt)}
                className="text-left font-bold text-slate-800 text-sm hover:text-[#006655] hover:underline block"
              >
                {upcomingApt.doctor_name_snapshot}
              </button>
              <span className="text-[#006655] font-medium">{upcomingApt.speciality_name_snapshot}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Date & Time</span>
              <strong className="text-slate-800 text-sm block">{formatDate(upcomingApt.appointment_date)}</strong>
              <span className="text-slate-500">{formatTime(upcomingApt.appointment_time)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Status & Payment</span>
              <strong className="text-[#006655] text-sm block">{upcomingApt.appointment_status}</strong>
              <span className="text-slate-500">{formatCurrency(upcomingApt.consultation_fee)} (PAID)</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleViewDoctor(upcomingApt)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E0F2ED] hover:bg-[#ccebe2] text-[#006655] font-bold text-xs transition border border-[#006655]/20 shadow-2xs"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#006655]" />
              <span>Doctor Details</span>
            </button>

            <Link
              to={`/appointment/${upcomingApt.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-semibold text-xs shadow-xs transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View & Print Official Slip</span>
            </Link>
          </div>
        </div>
      )}

      {/* If No Appointments at all */}
      {appointments.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="No Appointments Yet"
          description="You haven't scheduled any doctor consultations yet. Book your first appointment in just a few steps."
          actionText="BOOK APPOINTMENT"
          actionHref="/appointment"
        />
      )}

      {/* Recent Appointments Preview */}
      {appointments.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-[#006655] text-base">Recent Consultations</h3>
            <Link
              to="/user/appointments"
              className="text-xs font-semibold text-[#006655] hover:underline flex items-center gap-1"
            >
              View All ({appointments.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 4).map((apt) => (
              <div key={apt.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <button
                    type="button"
                    onClick={() => handleViewDoctor(apt)}
                    className="text-left font-bold text-slate-800 hover:text-[#006655] hover:underline block"
                  >
                    #{apt.appointment_number} • {apt.doctor_name_snapshot}
                  </button>
                  <div className="text-slate-500 mt-0.5">
                    {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                      apt.appointment_status === 'CONFIRMED'
                        ? 'bg-[#E0F2ED] text-[#006655]'
                        : apt.appointment_status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {apt.appointment_status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleViewDoctor(apt)}
                    className="p-1.5 rounded-lg text-[#006655] hover:bg-[#E0F2ED]"
                    title="View Doctor Details"
                  >
                    <Stethoscope className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/appointment/${apt.id}`}
                    className="p-1.5 rounded-lg text-[#006655] hover:bg-[#E0F2ED]"
                    title="View Slip"
                  >
                    <FileText className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital Location & Interactive Map Card (Patient Portal) */}
      <div className="bg-white rounded-3xl border border-[#E5DEC9] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#006655]" />
            </div>
            <div>
              <h3 className="font-bold text-[#006655] text-base">Hospital Location &amp; Directions</h3>
              <p className="text-xs text-slate-500">Find your way to the OPD &amp; consultation chambers easily</p>
            </div>
          </div>
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-xs transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Hospital Location Details */}
          <div className="lg:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FBF8F1] border border-[#E5DEC9] space-y-1.5">
              <span className="font-bold text-[#006655] uppercase text-[10px] tracking-wider block">
                Hospital Address
              </span>
              <p className="text-slate-800 font-semibold leading-relaxed">
                {hospitalAddress}
              </p>
              <div className="pt-1 flex items-center gap-2 text-slate-500 text-[11px]">
                <span>Landmark: Gotri Main Road, Near Karmjyot Society</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">OPD Timings</span>
                <strong className="text-slate-800 block text-xs mt-0.5">Mon - Sat</strong>
                <span className="text-slate-500 text-[11px]">09:00 AM - 08:00 PM</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-500 uppercase block">Emergency 24x7</span>
                <strong className="text-rose-900 block text-xs mt-0.5">{hospitalPhone}</strong>
                <span className="text-rose-600 text-[11px]">Ambulance &amp; Casualty</span>
              </div>
            </div>
          </div>

          {/* Embedded Google Maps View */}
          <div className="lg:col-span-7 h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
            <iframe
              title="Hospital Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3691.0772702738257!2d73.14371427599026!3d22.31294864245904!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395fc8488e0b4e2d%3A0xb3a826456fef30e5!2sGotri%20Rd%2C%20Vadodara%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Full View Doctor Detail Modal with UI Colors */}
      <DoctorDetailModal
        doctor={selectedDoctor}
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
      />
    </div>
  );
};
