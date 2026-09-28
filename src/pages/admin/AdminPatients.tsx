import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  UserCheck,
  Building2,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  RotateCcw,
  Eye,
  X,
  Stethoscope,
  Hash,
  ShieldCheck,
  FileText,
  Printer,
  LogIn,
  Activity,
  UserPlus,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Trash2,
  Ban,
  Power,
  ShieldAlert,
} from 'lucide-react';
import { AppointmentService } from '../../services/appointmentService';
import { DoctorService } from '../../services/doctorService';
import { SpecialityService } from '../../services/specialityService';
import {
  PatientAccountService,
  RegisteredPatientAccount,
} from '../../services/patientAccountService';
import { Appointment, Doctor, Speciality } from '../../types/database';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { TableSkeleton } from '../../components/LoadingSkeleton';

// Comprehensive Patient OPD Record structure
export interface PatientRecord {
  id: string;
  patientId: string;
  patientName: string;
  mobile: string;
  email: string;
  dob: string;
  age: number;
  gender: string;
  address: string;
  doctorName: string;
  doctorId?: string;
  department: string;
  departmentId?: string;
  appointmentDate: string;
  appointmentTime: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  appointmentStatus: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PENDING_PAYMENT';
  registrationDate: string;
  patientProblem?: string;
  consultationFee?: number;
}

export const AdminPatients: React.FC = () => {
  // Tab State: 'accounts' (Portal Signups & Login records) vs 'consultations' (OPD Records)
  const [activeTab, setActiveTab] = useState<'accounts' | 'consultations'>('accounts');

  // Accounts State
  const [patientAccounts, setPatientAccounts] = useState<RegisteredPatientAccount[]>([]);
  const [searchAccountQuery, setSearchAccountQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<RegisteredPatientAccount | null>(null);
  const [accountStatusFilter, setAccountStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [accountToDelete, setAccountToDelete] = useState<RegisteredPatientAccount | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // OPD Consultations State
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States for OPD
  const [searchName, setSearchName] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [searchPatientId, setSearchPatientId] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('ALL');

  // Detail Modal State for OPD
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  // Load all live data from database & storage services
  const loadData = async () => {
    setLoading(true);
    try {
      const [accounts, apts, docs, specs] = await Promise.all([
        PatientAccountService.getAllRegisteredAccounts().catch(() => [] as RegisteredPatientAccount[]),
        AppointmentService.getAllAppointmentsAdmin().catch(() => [] as Appointment[]),
        DoctorService.getAllDoctorsAdmin().catch(() => [] as Doctor[]),
        SpecialityService.getAllSpecialitiesAdmin().catch(() => [] as Speciality[]),
      ]);

      setPatientAccounts(accounts);
      setDoctorsList(docs);
      setDepartmentsList(specs);

      if (apts && apts.length > 0) {
        const mappedFromDb: PatientRecord[] = apts.map((apt, index) => {
          const birthYear = new Date().getFullYear() - (apt.patient_age || 30);
          const approxDob = `${birthYear}-01-01`;

          return {
            id: apt.id,
            patientId: apt.appointment_number || `RHY-PAT-${String(index + 1).padStart(4, '0')}`,
            patientName: apt.patient_name || 'Patient',
            mobile: apt.patient_mobile || '--',
            email: (apt as any).patient_email || (apt as any).email || 'patient@hospital.org',
            dob: approxDob,
            age: apt.patient_age || 0,
            gender: apt.patient_gender || 'OTHER',
            address: apt.patient_address || '',
            doctorName: apt.doctor?.full_name || apt.doctor_name_snapshot || 'Doctor',
            doctorId: apt.doctor_id,
            department:
              apt.speciality?.name ||
              apt.speciality_name_snapshot ||
              apt.doctor?.speciality?.name ||
              'General Medicine',
            departmentId: apt.speciality_id,
            appointmentDate: apt.appointment_date,
            appointmentTime: apt.appointment_time,
            paymentStatus: (apt.payment_status?.toUpperCase() as any) || 'PENDING',
            appointmentStatus: (apt.appointment_status?.toUpperCase() as any) || 'CONFIRMED',
            registrationDate: apt.created_at ? apt.created_at.split('T')[0] : apt.appointment_date,
            patientProblem: apt.patient_problem,
            consultationFee: apt.consultation_fee || apt.consultation_fee_snapshot || 500,
          };
        });

        setPatients(mappedFromDb);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error('Error fetching patient records:', err);
      setPatientAccounts([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Accounts List
  const filteredAccounts = useMemo(() => {
    const q = searchAccountQuery.toLowerCase().trim();
    return patientAccounts.filter((acc) => {
      // Status filter
      if (accountStatusFilter !== 'ALL' && acc.status !== accountStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        acc.full_name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.mobile.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        acc.address.toLowerCase().includes(q)
      );
    });
  }, [patientAccounts, searchAccountQuery, accountStatusFilter]);

  // Aggregate Stats
  const totalAccountsCount = patientAccounts.length;
  const activeAccountsCount = patientAccounts.filter((a) => a.status === 'active').length;
  const inactiveAccountsCount = patientAccounts.filter((a) => a.status === 'inactive').length;
  const totalLoginsCount = patientAccounts.reduce((sum, a) => sum + (a.login_count || 1), 0);
  const totalOpdBookings = patients.length;
  const activeThisMonth = patientAccounts.filter((a) => {
    const d = new Date(a.last_login_at);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return d.getTime() > thirtyDaysAgo;
  }).length;

  // Toggle patient account status between 'active' and 'inactive'
  const handleToggleStatus = async (account: RegisteredPatientAccount) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    setActionLoadingId(account.auth_user_id);
    try {
      await PatientAccountService.updatePatientStatus(account.auth_user_id, newStatus);
      setPatientAccounts((prev) =>
        prev.map((acc) =>
          acc.auth_user_id === account.auth_user_id ? { ...acc, status: newStatus } : acc
        )
      );
      if (selectedAccount && selectedAccount.auth_user_id === account.auth_user_id) {
        setSelectedAccount((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(
        `Account for ${account.full_name} is now ${newStatus === 'active' ? 'ACTIVE' : 'DEACTIVATED'}.`,
        newStatus === 'active' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update account status.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Permanently delete a patient account
  const handleConfirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    setDeleteLoading(true);
    try {
      await PatientAccountService.deletePatientAccount(
        accountToDelete.auth_user_id,
        accountToDelete.email,
        'admin'
      );
      setPatientAccounts((prev) =>
        prev.filter((acc) => acc.auth_user_id !== accountToDelete.auth_user_id)
      );
      if (selectedAccount && selectedAccount.auth_user_id === accountToDelete.auth_user_id) {
        setSelectedAccount(null);
      }
      showToast(`Account for ${accountToDelete.full_name} has been permanently deleted.`, 'success');
      setAccountToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered OPD Patients List
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (searchName.trim()) {
        const query = searchName.toLowerCase().trim();
        if (!patient.patientName.toLowerCase().includes(query)) return false;
      }
      if (searchMobile.trim()) {
        const query = searchMobile.replace(/\D/g, '');
        const patMob = patient.mobile.replace(/\D/g, '');
        if (!patMob.includes(query)) return false;
      }
      if (searchPatientId.trim()) {
        const query = searchPatientId.toLowerCase().trim();
        if (!patient.patientId.toLowerCase().includes(query)) return false;
      }
      if (dateFilter) {
        if (patient.appointmentDate !== dateFilter && patient.registrationDate !== dateFilter) {
          return false;
        }
      }
      if (doctorFilter && doctorFilter !== 'ALL') {
        const matchName = patient.doctorName.toLowerCase().includes(doctorFilter.toLowerCase());
        const matchId = patient.doctorId === doctorFilter;
        if (!matchName && !matchId) return false;
      }
      if (departmentFilter && departmentFilter !== 'ALL') {
        const matchDept = patient.department.toLowerCase().includes(departmentFilter.toLowerCase());
        const matchId = patient.departmentId === departmentFilter;
        if (!matchDept && !matchId) return false;
      }
      if (paymentStatusFilter !== 'ALL') {
        if (patient.paymentStatus !== paymentStatusFilter) return false;
      }
      if (appointmentStatusFilter !== 'ALL') {
        if (patient.appointmentStatus !== appointmentStatusFilter) return false;
      }
      return true;
    });
  }, [
    patients,
    searchName,
    searchMobile,
    searchPatientId,
    dateFilter,
    doctorFilter,
    departmentFilter,
    paymentStatusFilter,
    appointmentStatusFilter,
  ]);

  const handleResetFilters = () => {
    setSearchName('');
    setSearchMobile('');
    setSearchPatientId('');
    setDateFilter('');
    setDoctorFilter('ALL');
    setDepartmentFilter('ALL');
    setPaymentStatusFilter('ALL');
    setAppointmentStatusFilter('ALL');
  };

  // Export Registered Accounts to CSV
  const handleExportAccountsCSV = () => {
    const headers = [
      'Account ID',
      'Patient Name',
      'Mobile Number',
      'Email Address',
      'DOB',
      'Age',
      'Gender',
      'Address',
      'Total Logins',
      'Last Login Timestamp',
      'Registered At',
      'Total Appointments',
      'Total Spent (INR)',
    ];

    const rows = filteredAccounts.map((a) => [
      `"${a.id}"`,
      `"${a.full_name}"`,
      `"${a.mobile}"`,
      `"${a.email}"`,
      `"${a.dob || '--'}"`,
      a.age,
      `"${a.gender}"`,
      `"${(a.address || '').replace(/"/g, '""')}"`,
      a.login_count,
      `"${a.last_login_at}"`,
      `"${a.created_at}"`,
      a.total_appointments,
      a.total_spent,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rhythm_registered_patient_accounts_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export OPD list to CSV
  const handleExportOpdCSV = () => {
    const headers = [
      'Patient ID',
      'Patient Name',
      'Mobile',
      'Email',
      'Date of Birth',
      'Age',
      'Gender',
      'Address',
      'Doctor',
      'Department',
      'Appointment Date',
      'Appointment Time',
      'Payment Status',
      'Appointment Status',
      'Registration Date',
    ];

    const rows = filteredPatients.map((p) => [
      `"${p.patientId}"`,
      `"${p.patientName}"`,
      `"${p.mobile}"`,
      `"${p.email}"`,
      `"${p.dob}"`,
      p.age,
      `"${p.gender}"`,
      `"${p.address.replace(/"/g, '""')}"`,
      `"${p.doctorName}"`,
      `"${p.department}"`,
      `"${p.appointmentDate}"`,
      `"${p.appointmentTime}"`,
      `"${p.paymentStatus}"`,
      `"${p.appointmentStatus}"`,
      `"${p.registrationDate}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patients_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#006655]" />
            <span>Patient Registry & Portal Users</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track registered patient accounts, user login activity, and comprehensive clinical OPD records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            title="Refresh Records"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={activeTab === 'accounts' ? handleExportAccountsCSV : handleExportOpdCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#006655] hover:bg-[#004C3D] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Registered Accounts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Registered Accounts
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalAccountsCount}</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Portal Signups
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total User Logins */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Logins Recorded
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalLoginsCount}</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                All Sessions
              </span>
            </div>
          </div>
        </div>

        {/* 3. Active Users (Last 30 Days) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Portal Users
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{activeThisMonth}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Recent 30 Days
              </span>
            </div>
          </div>
        </div>

        {/* 4. Total OPD Consultations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total OPD Consultations
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalOpdBookings}</span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                Bookings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'accounts'
              ? 'bg-white text-[#006655] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 text-[#006655]" />
          <span>Registered Patient Accounts ({patientAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('consultations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'consultations'
              ? 'bg-white text-[#006655] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-[#006655]" />
          <span>OPD Consultations & Slips ({patients.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REGISTERED PATIENT ACCOUNTS (PORTAL USERS & LOGIN TRACKING)        */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchAccountQuery}
                  onChange={(e) => setSearchAccountQuery(e.target.value)}
                  placeholder="Search by Name, Mobile, Email, or Address..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006655]/20 focus:border-[#006655]"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                <select
                  value={accountStatusFilter}
                  onChange={(e) => setAccountStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006655]/20 cursor-pointer"
                >
                  <option value="ALL">All Accounts ({patientAccounts.length})</option>
                  <option value="active">Active Only ({activeAccountsCount})</option>
                  <option value="inactive">Deactivated Only ({inactiveAccountsCount})</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Showing <span className="font-bold text-[#006655]">{filteredAccounts.length}</span> patient accounts
            </div>
          </div>

          {/* Patient Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">No registered patient accounts found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No accounts matched your search criteria. Try searching with a different name or mobile number.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Patient User</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Age / Gender</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Total Logins</th>
                      <th className="py-3 px-4">Last Active</th>
                      <th className="py-3 px-4">Account Created</th>
                      <th className="py-3 px-4 text-center">Bookings</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccounts.map((account) => {
                      const initial = account.full_name?.charAt(0) || 'P';
                      return (
                        <tr key={account.id} className="hover:bg-slate-50/60 transition">
                          {/* 1. Patient Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#E0F2ED] text-[#006655] font-black text-xs flex items-center justify-center shrink-0 border border-[#006655]/20 overflow-hidden shadow-2xs">
                                {account.photo_url ? (
                                  <img src={account.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  initial
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">
                                  {account.full_name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {account.auth_user_id.slice(0, 10)}...
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Contact Info */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-slate-700 font-mono font-medium text-[11px]">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{account.mobile || '--'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 text-[10.5px]">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{account.email || '--'}</span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Age & Gender */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-700 font-medium">
                              <span>{account.age} Yrs</span> • <span className="text-slate-500">{account.gender}</span>
                            </div>
                            {account.dob && (
                              <span className="text-[9.5px] text-slate-400 block font-mono">
                                DOB: {formatDate(account.dob)}
                              </span>
                            )}
                          </td>

                          {/* 4. Account Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {account.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-[10.5px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-bold text-[10.5px]">
                                <Ban className="w-3 h-3 text-rose-600" />
                                <span>Deactive</span>
                              </span>
                            )}
                          </td>

                          {/* 5. Total Logins Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-mono font-black text-xs">
                              <LogIn className="w-3 h-3 text-amber-600" />
                              <span>{account.login_count} {account.login_count === 1 ? 'Login' : 'Logins'}</span>
                            </span>
                          </td>

                          {/* 6. Last Active */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-700 font-semibold text-[11px]">
                              {formatDate(account.last_login_at)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {formatTime(account.last_login_at)}
                            </div>
                          </td>

                          {/* 7. Account Created */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-600 text-[11px]">
                              {formatDate(account.created_at)}
                            </div>
                          </td>

                          {/* 8. Bookings & Spent */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-[#006655] block">
                              {account.total_appointments} OPDs
                            </span>
                            {account.total_spent > 0 && (
                              <span className="text-[10px] font-mono text-slate-500 block">
                                {formatCurrency(account.total_spent)}
                              </span>
                            )}
                          </td>

                          {/* 9. Actions: View Profile, Active/Deactive Toggle, Delete Account */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Profile */}
                              <button
                                onClick={() => setSelectedAccount(account)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#E0F2ED] text-slate-700 hover:text-[#006655] transition shadow-2xs"
                                title="View Profile Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Active / Deactive */}
                              <button
                                onClick={() => handleToggleStatus(account)}
                                disabled={actionLoadingId === account.auth_user_id}
                                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 border shadow-2xs ${
                                  account.status === 'active'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                                title={
                                  account.status === 'active'
                                    ? 'Deactivate account (blocks login)'
                                    : 'Activate account (enables login)'
                                }
                              >
                                {actionLoadingId === account.auth_user_id ? (
                                  <RotateCcw className="w-3 h-3 animate-spin" />
                                ) : account.status === 'active' ? (
                                  <>
                                    <Ban className="w-3 h-3 text-amber-600" />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>

                              {/* Delete Account Permanently */}
                              <button
                                onClick={() => setAccountToDelete(account)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition shadow-2xs"
                                title="Permanently Delete Patient Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPD CONSULTATIONS & APPOINTMENT RECORDS                           */}
      {/* ========================================================================= */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          {/* OPD Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search Name */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#006655] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Patient Name..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006655]/20 focus:border-[#006655]"
                />
              </div>

              {/* Search Mobile */}
              <div className="relative">
                <Phone className="w-4 h-4 text-[#006655] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value)}
                  placeholder="Mobile Number..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006655]/20 focus:border-[#006655]"
                />
              </div>

              {/* Search Appointment ID */}
              <div className="relative">
                <Hash className="w-4 h-4 text-[#006655] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchPatientId}
                  onChange={(e) => setSearchPatientId(e.target.value)}
                  placeholder="Appointment ID (RM-...)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006655]/20 focus:border-[#006655]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {/* Doctor Filter */}
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#006655]/20"
              >
                <option value="ALL">All Doctors</option>
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#006655]/20"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#006655]/20"
              />

              {/* Payment Status Filter */}
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#006655]/20"
              >
                <option value="ALL">All Payments</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>

              {/* Reset Filters */}
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* OPD Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">No OPD consultation records found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No appointments match the current filter selection.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Appointment ID</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Doctor & Department</th>
                      <th className="py-3 px-4">Date & Slot</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#006655]">
                          #{patient.patientId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{patient.patientName}</span>
                          <span className="text-[10px] text-slate-500">{patient.mobile}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{patient.doctorName}</span>
                          <span className="text-[10px] text-slate-500">{patient.department}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 block">
                            {formatDate(patient.appointmentDate)}
                          </span>
                          <span className="text-[10px] text-slate-500">{formatTime(patient.appointmentTime)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              patient.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {patient.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0F2ED] text-[#006655]">
                            {patient.appointmentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#E0F2ED] text-slate-700 hover:text-[#006655] font-bold text-xs transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTERED PATIENT ACCOUNT & LOGIN HISTORY MODAL                 */}
      {/* ========================================================================= */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#E0F2ED] text-[#006655] font-black text-xl flex items-center justify-center border border-[#006655]/20 overflow-hidden shadow-xs shrink-0">
                  {selectedAccount.photo_url ? (
                    <img src={selectedAccount.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedAccount.full_name?.charAt(0) || 'P'
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {selectedAccount.full_name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Patient Auth ID: {selectedAccount.auth_user_id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Login Frequency & Activity Highlight Card */}
            <div className="bg-gradient-to-br from-[#006655] to-[#004C3D] text-white rounded-2xl p-4 shadow-md grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-emerald-200 block font-bold">
                  Total Logins
                </span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {selectedAccount.login_count}
                </span>
              </div>
              <div className="border-x border-emerald-700/50">
                <span className="text-[9px] uppercase tracking-wider text-emerald-200 block font-bold">
                  Bookings
                </span>
                <span className="text-2xl font-black text-white font-mono">
                  {selectedAccount.total_appointments}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-emerald-200 block font-bold">
                  Total Paid
                </span>
                <span className="text-lg font-black text-white">
                  {formatCurrency(selectedAccount.total_spent)}
                </span>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
              {/* Account Status with Quick Toggle */}
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-semibold">Account Status:</span>
                <div className="flex items-center gap-2">
                  {selectedAccount.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                      <Ban className="w-3 h-3 text-rose-600" />
                      <span>Deactivated</span>
                    </span>
                  )}

                  <button
                    onClick={() => handleToggleStatus(selectedAccount)}
                    disabled={actionLoadingId === selectedAccount.auth_user_id}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border shadow-2xs ${
                      selectedAccount.status === 'active'
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {actionLoadingId === selectedAccount.auth_user_id ? (
                      <RotateCcw className="w-3 h-3 animate-spin" />
                    ) : selectedAccount.status === 'active' ? (
                      <>
                        <Ban className="w-3 h-3 text-amber-600" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-semibold">Mobile Number:</span>
                <span className="font-mono font-bold text-slate-800">{selectedAccount.mobile || '--'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-semibold">Email Address:</span>
                <span className="font-bold text-slate-800">{selectedAccount.email || '--'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-semibold">Age / Gender:</span>
                <span className="font-bold text-slate-800">
                  {selectedAccount.age} Yrs / {selectedAccount.gender}
                </span>
              </div>
              {selectedAccount.dob && (
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Date of Birth:</span>
                  <span className="font-mono text-slate-800">{formatDate(selectedAccount.dob)}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-semibold">Account Created:</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedAccount.created_at)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-semibold">Last Login Activity:</span>
                <span className="font-bold text-[#006655]">
                  {formatDate(selectedAccount.last_login_at)} at {formatTime(selectedAccount.last_login_at)}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-slate-500 font-semibold">Residential Address:</span>
                <span className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                  {selectedAccount.address || 'No residential address documented yet.'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const target = selectedAccount;
                  setSelectedAccount(null);
                  setAccountToDelete(target);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-rose-200 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>

              <button
                onClick={() => setSelectedAccount(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: OPD CONSULTATION SLIP MODAL                                     */}
      {/* ========================================================================= */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#006655] uppercase tracking-wider block">
                  Consultation Record
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Appointment #{selectedPatient.patientId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <strong className="text-slate-800">{selectedPatient.patientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="font-mono text-slate-800">{selectedPatient.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <strong className="text-[#006655]">{selectedPatient.doctorName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700">{selectedPatient.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="font-bold text-slate-800">
                  {formatDate(selectedPatient.appointmentDate)} at {formatTime(selectedPatient.appointmentTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee:</span>
                <span className="font-bold text-[#006655]">
                  {formatCurrency(selectedPatient.consultationFee || 500)} ({selectedPatient.paymentStatus})
                </span>
              </div>
              {selectedPatient.patientProblem && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Health Concern / Symptoms:</span>
                  <p className="italic text-slate-700 bg-white p-2 rounded border border-slate-200">
                    "{selectedPatient.patientProblem}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 3: ADMIN CONFIRM PATIENT ACCOUNT DELETION                           */}
      {/* ========================================================================= */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Delete Patient Account</h3>
                  <span className="text-xs text-rose-600 font-semibold">Hospital Administration Action</span>
                </div>
              </div>
              <button
                onClick={() => setAccountToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Patient Name:</span>
                <strong className="text-slate-800">{accountToDelete.full_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Mobile:</span>
                <span className="font-mono text-slate-800">{accountToDelete.mobile || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Email:</span>
                <span className="text-slate-800">{accountToDelete.email || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Current Status:</span>
                <span className="uppercase font-bold text-xs">{accountToDelete.status}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>{accountToDelete.full_name}</strong>'s registered portal account? This will permanently delete their portal credentials and account registry data.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                {deleteLoading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{deleteLoading ? 'Deleting...' : 'Yes, Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
              toastMsg.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-700'
                : toastMsg.type === 'error'
                ? 'bg-rose-800 text-white border-rose-700'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Activity className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
