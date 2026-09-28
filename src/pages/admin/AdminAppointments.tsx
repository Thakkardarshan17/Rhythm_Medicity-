import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  FileText,
  Edit3,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  X,
  User,
} from 'lucide-react';
import { AppointmentService, AppointmentFilterParams } from '../../services/appointmentService';
import { DoctorService } from '../../services/doctorService';
import { SpecialityService } from '../../services/specialityService';
import { AuditService } from '../../services/auditService';
import { Appointment, Doctor, Speciality, AppointmentStatus } from '../../types/database';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { AppointmentLetterView } from '../../components/AppointmentLetterView';
import { useDropdownOptions } from '../../contexts/DropdownContext';

export const AdminAppointments: React.FC = () => {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic dropdowns
  const { options: appointmentStatusOptions } = useDropdownOptions('appointment_status');
  const { options: paymentStatusOptions } = useDropdownOptions('payment_status');

  // Filters
  const [filters, setFilters] = useState<AppointmentFilterParams>({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    doctorId: '',
    specialityId: '',
    date: '',
  });

  // Letter Preview Modal state
  const [selectedLetterApt, setSelectedLetterApt] = useState<Appointment | null>(null);

  // Diagnosis Modal state (Section 80)
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [diagnosisText, setDiagnosisText] = useState('');
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const loadData = async () => {
    try {
      const [aptsData, docsData, specsData] = await Promise.all([
        AppointmentService.getAllAppointmentsAdmin(filters),
        DoctorService.getAllDoctorsAdmin(),
        SpecialityService.getAllSpecialitiesAdmin(),
      ]);
      setAppointments(aptsData);
      setDoctors(docsData);
      setSpecialities(specsData);
    } catch (err) {
      console.error('Error fetching admin appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleStatusChange = async (aptId: string, newStatus: AppointmentStatus) => {
    try {
      await AppointmentService.updateAppointmentStatus(aptId, newStatus);
      await AuditService.logAction('STATUS_CHANGE', 'APPOINTMENT', aptId, { status: newStatus });
      showToast(`Appointment status updated to ${newStatus}.`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const openDiagnosisModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setDiagnosisText(apt.diagnosis || '');
    setDiagnosisModalOpen(true);
  };

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setSavingDiagnosis(true);
    try {
      await AppointmentService.updateDiagnosisNote(selectedAppointment.id, diagnosisText.trim());
      await AuditService.logAction('DIAGNOSIS_UPDATED', 'APPOINTMENT', selectedAppointment.id, {
        note: diagnosisText.substring(0, 50),
      });
      showToast('Clinical diagnosis / medical note saved.', 'success');
      setDiagnosisModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save diagnosis', 'error');
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelTarget) return;
    try {
      await AppointmentService.cancelAppointment(cancelTarget.id);
      await AuditService.logAction('CANCELLED', 'APPOINTMENT', cancelTarget.id);
      showToast(`Appointment #${cancelTarget.appointment_number} marked cancelled.`, 'info');
      setCancelTarget(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel appointment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#006655] tracking-tight">
            Appointment Records & Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter consultations, enter physician clinical notes, view printable A5 slips, and manage statuses.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#006655] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search patient, mobile, slip #..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
            >
              <option value="all">All Appointment Statuses</option>
              {appointmentStatusOptions.map((opt) => (
                <option key={opt.id} value={opt.code || opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={filters.paymentStatus || 'all'}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
            >
              <option value="all">All Payment Statuses</option>
              {paymentStatusOptions.map((opt) => (
                <option key={opt.id} value={opt.code || opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <select
              value={filters.doctorId || ''}
              onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={filters.date || ''}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.status !== 'all' || filters.paymentStatus !== 'all' || filters.doctorId || filters.date) && (
          <div className="flex justify-end">
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  status: 'all',
                  paymentStatus: 'all',
                  doctorId: '',
                  specialityId: '',
                  date: '',
                })
              }
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Appointments Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="px-5 py-3.5">Slip #</th>
                  <th className="px-5 py-3.5">Patient Information</th>
                  <th className="px-5 py-3.5">Doctor & Speciality</th>
                  <th className="px-5 py-3.5">Date & Slot</th>
                  <th className="px-5 py-3.5">Fee / Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Diagnosis</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-mono font-bold text-[#004C3D]">
                      #{apt.appointment_number}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#006655]">{apt.patient_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {apt.patient_age}Y / {apt.patient_gender} • {apt.patient_mobile}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{apt.doctor_name_snapshot}</div>
                      <div className="text-[11px] text-[#006655]">{apt.speciality_name_snapshot}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#006655]">{formatDate(apt.appointment_date)}</div>
                      <div className="text-[11px] text-slate-500">{formatTime(apt.appointment_time)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#006655]">{formatCurrency(apt.consultation_fee)}</div>
                      <span className="text-[10px] font-semibold text-[#006655]">{apt.payment_status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={apt.appointment_status}
                        onChange={(e) => handleStatusChange(apt.id, e.target.value as AppointmentStatus)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          apt.appointment_status === 'CONFIRMED'
                            ? 'bg-[#E0F2ED] text-[#004C3D] border-[#006655]/20'
                            : apt.appointment_status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : apt.appointment_status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {appointmentStatusOptions.map((opt) => (
                          <option key={opt.id} value={opt.code || opt.name}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      {apt.diagnosis ? (
                        <div className="truncate font-mono text-[10px] text-slate-700" title={apt.diagnosis}>
                          {apt.diagnosis}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Pending visit</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-1">
                      {/* Clinical note edit button */}
                      <button
                        onClick={() => openDiagnosisModal(apt)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#006655] hover:bg-slate-100 transition"
                        title="Add/Edit Clinical Diagnosis"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* View / Download / Print A5 Letter */}
                      <button
                        type="button"
                        onClick={() => setSelectedLetterApt(apt)}
                        className="inline-block p-1.5 rounded-lg text-[#006655] hover:bg-[#E0F2ED] transition font-bold"
                        title="View Official A5 Appointment Letter (Download, Print, Share)"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Cancel Appointment Action */}
                      {apt.appointment_status !== 'CANCELLED' && (
                        <button
                          onClick={() => setCancelTarget(apt)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Cancel Appointment"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Appointments Matched Criteria</p>
            <p className="text-slate-400 mt-1">Try adjusting the filter criteria or date range.</p>
          </div>
        )}
      </div>

      {/* Interactive Official A5 Appointment Letter Modal for Admin */}
      {selectedLetterApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003329]/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#006655] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#006655]" />
                  <span>Official A5 Appointment Letter Preview</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Slip #{selectedLetterApt.appointment_number} • Patient: {selectedLetterApt.patient_name}
                </span>
              </div>
              <button
                onClick={() => setSelectedLetterApt(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AppointmentLetterView
              appointment={selectedLetterApt}
              onClose={() => setSelectedLetterApt(null)}
            />
          </div>
        </div>
      )}

      {/* Diagnosis / Clinical Note Modal (Prompt Section 80) */}
      {diagnosisModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003329]/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#006655]">
                  Update Clinical Diagnosis / Note
                </h3>
                <span className="text-[11px] text-[#006655] font-mono">
                  Slip #{selectedAppointment.appointment_number} • {selectedAppointment.patient_name}
                </span>
              </div>
              <button
                onClick={() => setDiagnosisModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase block text-[10px]">
                Patient Initial Concern:
              </span>
              <p className="text-slate-800 italic">"{selectedAppointment.patient_problem}"</p>
            </div>

            <form onSubmit={handleSaveDiagnosis} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Physician Diagnosis & Clinical Observation *
                </label>
                <textarea
                  rows={4}
                  required
                  value={diagnosisText}
                  onChange={(e) => setDiagnosisText(e.target.value)}
                  placeholder="Enter medical findings, diagnostic impression, treatment regimen or prescription notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none text-sm font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  This clinical diagnosis will dynamically appear on regenerated appointment slips while preserving the original booking date and financial snapshot.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDiagnosisModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDiagnosis}
                  className="px-5 py-2 rounded-xl bg-[#006655] text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  {savingDiagnosis && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Clinical Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Cancel Patient Appointment?"
        message={`Are you sure you want to cancel appointment #${cancelTarget?.appointment_number} for ${cancelTarget?.patient_name}? Historical payment records and sequence number will be preserved.`}
        confirmText="Cancel Appointment"
        isDestructive={true}
        onConfirm={handleCancelAppointment}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
};
