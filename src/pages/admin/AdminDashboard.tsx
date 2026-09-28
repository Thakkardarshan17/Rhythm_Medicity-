import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Stethoscope,
  BriefcaseMedical,
  Calendar,
  Users,
  CreditCard,
  IndianRupee,
  Clock,
  ArrowRight,
  FileText,
  Plus,
  Loader2,
  Activity,
  Palette,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { ReportService, DashboardMetrics } from '../../services/reportService';
import { AppointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/database';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { DashboardCardSkeleton, TableSkeleton } from '../../components/LoadingSkeleton';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import { ScrollReveal } from '../../components/ScrollReveal';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [metricsData, aptsData] = await Promise.all([
        ReportService.getDashboardMetrics(),
        AppointmentService.getAllAppointmentsAdmin({}),
      ]);
      setMetrics(metricsData);
      setRecentAppointments(aptsData.slice(0, 6));
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime subscription for live dashboard updates
    if (isSupabaseConfigured()) {
      const aptChannel = supabase
        .channel('admin_dashboard_appointments')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(aptChannel);
      };
    }
  }, []);

  const metricCards = [
    { title: 'Total Doctors', rawValue: metrics?.totalDoctors || 0, icon: UserCheck, color: 'text-[#006655] bg-[#E0F2ED]', link: '/admin/doctors' },
    { title: 'Total Specialities', rawValue: metrics?.totalSpecialities || 0, icon: Stethoscope, color: 'text-indigo-600 bg-indigo-50', link: '/admin/specialities' },
    { title: 'Total Services', rawValue: metrics?.totalServices || 0, icon: BriefcaseMedical, color: 'text-blue-600 bg-blue-50', link: '/admin/services' },
    { title: 'Total Appointments', rawValue: metrics?.totalAppointments || 0, icon: Calendar, color: 'text-[#006655] bg-[#E0F2ED]', link: '/admin/appointments' },
    { title: "Today's Appointments", rawValue: metrics?.todayAppointments || 0, icon: Clock, color: 'text-amber-600 bg-amber-50', link: '/admin/appointments' },
    { title: 'Total Patients', rawValue: metrics?.totalPatients || 0, icon: Users, color: 'text-purple-600 bg-purple-50', link: '/admin/patients' },
    { title: 'Paid Consultations', rawValue: metrics?.paidAppointments || 0, icon: CreditCard, color: 'text-cyan-600 bg-cyan-50', link: '/admin/payments' },
    { title: 'Total Revenue', rawValue: metrics?.totalRevenue || 0, isCurrency: true, icon: IndianRupee, color: 'text-[#006655] bg-emerald-100', link: '/admin/reports' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <ScrollReveal animation="fade-down">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#006655] tracking-tight">
              Hospital Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Realtime live overview of medical faculty, active appointments, and outpatient records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/statistics"
              className="btn-shimmer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-xs"
            >
              <Activity className="w-4 h-4 text-[#C4A760]" />
              <span>Hospital Statistics</span>
            </Link>
            <Link
              to="/admin/appearance"
              className="btn-premium inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#C4A760] text-[#004C3D] hover:bg-[#FBF8F1] font-bold text-xs shadow-xs"
            >
              <Palette className="w-4 h-4 text-[#C4A760]" />
              <span>Website UI / Theme</span>
            </Link>
            <Link
              to="/admin/doctors"
              className="btn-premium inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Doctor</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* Website Management Quick Links Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScrollReveal animation="fade-right" delay={0.05}>
          <Link
            to="/admin/statistics"
            className="card-lift p-5 rounded-2xl bg-gradient-to-r from-[#003329] to-[#004C3D] text-white shadow-md group flex items-center justify-between h-full"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 text-[#C4A760] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#C4A760] uppercase tracking-wider block">
                  LIVE COUNTERS
                </span>
                <h3 className="font-bold text-base text-white">Hospital Statistics</h3>
                <p className="text-xs text-[#93D3C3]/80">Manage Total Beds, ICU Beds & Doctors</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#C4A760] group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={0.05}>
          <Link
            to="/admin/ai-assistant"
            className="card-lift p-5 rounded-2xl bg-gradient-to-r from-[#004C3D] via-[#006655] to-[#004C3D] text-white shadow-md group flex items-center justify-between h-full"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-[#C4A760] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#C4A760] uppercase tracking-wider block">
                  AI VOICE RECEPTIONIST
                </span>
                <h3 className="font-bold text-base text-white">Dillo AI Assistant</h3>
                <p className="text-xs text-[#93D3C3]/80">Voice STT/TTS, Multilingual & Symptoms</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#C4A760] group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </ScrollReveal>

        <ScrollReveal animation="fade-left" delay={0.05}>
          <Link
            to="/admin/appearance"
            className="card-lift p-5 rounded-2xl bg-gradient-to-r from-[#C4A760] to-[#B0934C] text-white shadow-md group flex items-center justify-between h-full"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider block">
                  THEME & BRANDING
                </span>
                <h3 className="font-bold text-base text-white">Website Appearance</h3>
                <p className="text-xs text-white/80">Customize colors, logo & banners</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </ScrollReveal>
      </div>

      {/* Metrics Cards Grid with Stagger & Count-Up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <DashboardCardSkeleton key={i} />)
          : metricCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <ScrollReveal key={card.title} animation="fade-up" delay={idx * 0.05}>
                  <Link
                    to={card.link}
                    className="card-lift bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between group h-full"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        {card.title}
                      </span>
                      <span className="text-2xl font-black text-[#006655] mt-1 block">
                        {card.isCurrency ? (
                          <AnimatedCounter end={card.rawValue} prefix="₹" duration={1.5} />
                        ) : (
                          <AnimatedCounter end={card.rawValue} duration={1.2} />
                        )}
                      </span>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${card.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
      </div>

      {/* Live Recent Appointments Table with Glass/Card styling */}
      <ScrollReveal animation="fade-up" delay={0.2}>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#006655]">Recent Appointments</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live outpatient appointments booked via web portal.</p>
            </div>
            <Link
              to="/admin/appointments"
              className="text-xs font-bold text-[#006655] hover:underline flex items-center gap-1 nav-link-animated"
            >
              Manage All Appointments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <TableSkeleton rows={5} />
          ) : recentAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                  <tr>
                    <th className="px-6 py-3.5">Appointment No</th>
                    <th className="px-6 py-3.5">Patient Details</th>
                    <th className="px-6 py-3.5">Doctor & Speciality</th>
                    <th className="px-6 py-3.5">Consultation Slot</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#004C3D]">
                        #{apt.appointment_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#006655]">{apt.patient_name}</div>
                        <div className="text-[11px] text-slate-400">{apt.patient_mobile}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{apt.doctor_name_snapshot}</div>
                        <div className="text-[11px] text-[#006655]">{apt.speciality_name_snapshot}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{formatDate(apt.appointment_date)}</div>
                        <div className="text-[11px] text-slate-500">{formatTime(apt.appointment_time)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#006655]">
                          {formatCurrency(apt.consultation_fee)}
                        </span>
                        <span className="block text-[10px] text-[#006655] font-semibold">
                          {apt.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.appointment_status === 'CONFIRMED'
                              ? 'bg-[#E0F2ED] text-[#004C3D] border border-[#006655]/20'
                              : apt.appointment_status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : apt.appointment_status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {apt.appointment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/appointment/${apt.id}`}
                          target="_blank"
                          className="btn-premium inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E0F2ED] hover:bg-[#E0F2ED] text-[#004C3D] font-semibold text-[11px] border border-[#006655]/20"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>A5 Letter</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No Appointments Recorded</p>
              <p className="text-slate-400 mt-1">Confirmed appointments will appear here automatically via live sync.</p>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
};

