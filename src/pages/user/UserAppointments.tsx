import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Loader2, ArrowRight, Stethoscope } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppointmentService } from '../../services/appointmentService';
import { DoctorService } from '../../services/doctorService';
import { Appointment, Doctor } from '../../types/database';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { EmptyState } from '../../components/EmptyState';
import { DoctorDetailModal } from '../../components/DoctorDetailModal';

export const UserAppointments: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING_PAYMENT' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

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
    const fetchAppointments = async () => {
      if (!user?.id) return;
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

    fetchAppointments();
  }, [user?.id, patientProfile?.mobile, patientProfile?.email]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#006655] mx-auto" />
      </div>
    );
  }

  const confirmedCount = appointments.filter((a) => a.appointment_status === 'CONFIRMED').length;
  const pendingCount = appointments.filter((a) => a.appointment_status === 'PENDING_PAYMENT').length;
  const completedCount = appointments.filter((a) => a.appointment_status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => a.appointment_status === 'CANCELLED').length;

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'ALL') return true;
    return apt.appointment_status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-[#006655]">My Appointments & Status</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of your outpatient doctor appointments and official consultation slips.
          </p>
        </div>
        <Link
          to="/appointment"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-xs transition self-start sm:self-auto"
        >
          Book Consultation
        </Link>
      </div>

      {/* Appointment Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'ALL'
              ? 'bg-[#E0F2ED] border-[#006655] ring-2 ring-[#006655]/30'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Booked
          </span>
          <span className="text-2xl font-black text-[#006655] mt-1 block">
            {appointments.length}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('CONFIRMED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'CONFIRMED'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Confirmed
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {confirmedCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('PENDING_PAYMENT')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'PENDING_PAYMENT'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Pending
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">
            {pendingCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'COMPLETED'
              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/30'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Completed
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {completedCount}
          </span>
        </div>
      </div>

      {filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-[#004C3D] bg-[#E0F2ED] px-2 py-0.5 rounded">
                    #{apt.appointment_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      apt.appointment_status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-[#004C3D]'
                        : apt.appointment_status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : apt.appointment_status === 'CANCELLED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {apt.appointment_status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Booked on {formatDate(apt.created_at)}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Doctor</span>
                  <button
                    type="button"
                    onClick={() => handleViewDoctor(apt)}
                    className="text-left group font-bold text-[#006655] hover:text-[#004C3D] hover:underline flex items-center gap-1 block"
                  >
                    <span>{apt.doctor_name_snapshot}</span>
                  </button>
                  <span className="text-[#006655] text-[11px] font-medium">{apt.speciality_name_snapshot}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Consultation Date & Time</span>
                  <strong className="text-[#006655] block">{formatDate(apt.appointment_date)}</strong>
                  <span className="text-slate-600">{formatTime(apt.appointment_time)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Patient</span>
                  <strong className="text-[#006655] block">{apt.patient_name}</strong>
                  <span className="text-slate-500">{apt.patient_age} Yrs / {apt.patient_gender}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Consultation Fee</span>
                  <strong className="text-[#006655] text-sm block">
                    {formatCurrency(apt.consultation_fee)}
                  </strong>
                  <span className="text-[#006655] font-semibold text-[11px]">
                    {apt.payment_status}
                  </span>
                </div>
              </div>

              {/* Action Buttons (Section 25) */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleViewDoctor(apt)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E0F2ED] hover:bg-[#ccebe2] text-[#006655] font-bold text-xs transition border border-[#006655]/20 shadow-2xs"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-[#006655]" />
                  <span>DOCTOR DETAILS</span>
                </button>

                <Link
                  to={`/appointment/${apt.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-xs transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>VIEW LETTER (A5 SLIP)</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No Appointments Found"
          description="You do not have any appointment records in your account history."
          actionText="Book New Consultation"
          actionHref="/appointment"
        />
      )}

      {/* Full View Doctor Detail Modal with UI Colors */}
      <DoctorDetailModal
        doctor={selectedDoctor}
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
      />
    </div>
  );
};
