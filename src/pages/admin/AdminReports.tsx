import React, { useState, useEffect } from 'react';
import { BarChart3, IndianRupee, UserCheck, Stethoscope, Calendar, Loader2 } from 'lucide-react';
import { ReportService, DoctorReportItem, SpecialityReportItem, DashboardMetrics } from '../../services/reportService';
import { formatCurrency } from '../../utils/formatters';

export const AdminReports: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [doctorReports, setDoctorReports] = useState<DoctorReportItem[]>([]);
  const [specialityReports, setSpecialityReports] = useState<SpecialityReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [m, docs, specs] = await Promise.all([
          ReportService.getDashboardMetrics(),
          ReportService.getDoctorReports(),
          ReportService.getSpecialityReports(),
        ]);
        setMetrics(m);
        setDoctorReports(docs);
        setSpecialityReports(specs);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#006655] mx-auto" />
      </div>
    );
  }

  const hasAnyData = (metrics?.totalAppointments || 0) > 0;

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-[#006655] tracking-tight">
          Operational Analytics & Revenue Reports
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live financial breakdowns, doctor workload metrics, and departmental consultation distributions.
        </p>
      </div>

      {/* Summary Stat Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block">Total Paid Revenue</span>
          <span className="text-2xl font-black text-[#006655] mt-1 block">
            {metrics ? formatCurrency(metrics.totalRevenue) : '--'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block">Total Consultations</span>
          <span className="text-2xl font-black text-[#006655] mt-1 block">
            {metrics?.totalAppointments || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block">Paid Bookings</span>
          <span className="text-2xl font-black text-[#006655] mt-1 block">
            {metrics?.paidAppointments || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block">Unique Patients</span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">
            {metrics?.totalPatients || 0}
          </span>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">No data available for selected period.</p>
          <p className="text-slate-400 mt-1">
            Charts and breakdowns will automatically render once consultations are confirmed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Doctor Performance & Revenue */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-5 h-5 text-[#006655]" />
              <h2 className="font-bold text-[#006655] text-sm">Consultations by Doctor</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Doctor</th>
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5 text-center">Consultations</th>
                    <th className="px-4 py-2.5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorReports.map((d) => (
                    <tr key={d.doctorId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-[#006655]">{d.doctorName}</td>
                      <td className="px-4 py-3 text-slate-500">{d.specialityName}</td>
                      <td className="px-4 py-3 text-center font-bold text-[#004C3D]">{d.totalAppointments}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-[#006655]">
                        {formatCurrency(d.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departmental / Speciality Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Stethoscope className="w-5 h-5 text-[#006655]" />
              <h2 className="font-bold text-[#006655] text-sm">Consultations by Speciality</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5 text-center">Consultations</th>
                    <th className="px-4 py-2.5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {specialityReports.map((s) => (
                    <tr key={s.specialityId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-[#006655]">{s.specialityName}</td>
                      <td className="px-4 py-3 text-center font-bold text-[#004C3D]">{s.totalAppointments}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-[#006655]">
                        {formatCurrency(s.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
