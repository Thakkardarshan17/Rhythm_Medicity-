import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Bed,
  HeartPulse,
  UserCheck,
  Building2,
  Stethoscope,
  Truck,
  Scissors,
  FlaskConical,
  Pill,
  AlertCircle,
  Save,
  Loader2,
  RotateCcw,
  Sparkles,
  Palette,
  Settings,
  FileText,
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { SettingsService, DEFAULT_HOSPITAL_STATS } from '../../services/settingsService';
import { AuditService } from '../../services/auditService';
import { HospitalStats } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';

export const AdminHospitalStats: React.FC = () => {
  const { hospitalStats, updateStatsInMemory } = useSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<HospitalStats>(hospitalStats);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(hospitalStats);
  }, [hospitalStats]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await SettingsService.updateHospitalStats(formData);
      updateStatsInMemory(updated);
      await AuditService.logAction('UPDATE_HOSPITAL_STATS', 'HOSPITAL_STATS', 'global', {
        total_beds: formData.total_beds,
        total_doctors: formData.total_doctors,
      });
      showToast('Hospital statistics updated successfully. Live website updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save statistics', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_HOSPITAL_STATS);
    showToast('Reset to default hospital figures. Click Save to apply.', 'info');
  };

  const statFields = [
    { key: 'total_beds', label: 'Total Beds', icon: Bed, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Overall hospital licensed bed strength' },
    { key: 'total_icu_beds', label: 'Total ICU Beds', icon: HeartPulse, color: 'text-rose-700 bg-rose-50 border-rose-200', desc: 'Critical care, SICU, CCU, & NICU beds' },
    { key: 'total_general_beds', label: 'Total General Beds', icon: Bed, color: 'text-blue-700 bg-blue-50 border-blue-200', desc: 'General & semi-private ward beds' },
    { key: 'total_private_rooms', label: 'Total Private Rooms', icon: Building2, color: 'text-purple-700 bg-purple-50 border-purple-200', desc: 'Single & Deluxe executive patient rooms' },
    { key: 'total_doctors', label: 'Total Doctors', icon: UserCheck, color: 'text-teal-700 bg-teal-50 border-teal-200', desc: 'Senior consultants, surgeons & physicians' },
    { key: 'total_departments', label: 'Total Departments', icon: Building2, color: 'text-amber-700 bg-amber-50 border-amber-200', desc: 'Clinical specialities & super-specialities' },
    { key: 'total_nurses', label: 'Total Nurses', icon: Stethoscope, color: 'text-cyan-700 bg-cyan-50 border-cyan-200', desc: 'Registered staff nurses & care coordinators' },
    { key: 'total_ambulances', label: 'Total Ambulances', icon: Truck, color: 'text-red-700 bg-red-50 border-red-200', desc: 'Advanced cardiac life support (ACLS) fleet' },
    { key: 'total_operation_theatres', label: 'Total Operation Theatres', icon: Scissors, color: 'text-indigo-700 bg-indigo-50 border-indigo-200', desc: 'Modular laminar airflow sterile OT suites' },
    { key: 'total_labs', label: 'Total Diagnostic Labs', icon: FlaskConical, color: 'text-violet-700 bg-violet-50 border-violet-200', desc: 'Pathology, Biochemistry & Radiology centers' },
    { key: 'total_pharmacy_counters', label: 'Total Pharmacy Counters', icon: Pill, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: '24x7 in-house dispensing pharmacy bays' },
    { key: 'emergency_beds', label: 'Emergency Beds', icon: AlertCircle, color: 'text-rose-700 bg-rose-50 border-rose-200', desc: 'Triage, trauma & immediate resuscitation beds' },
    { key: 'available_beds', label: 'Available Beds', icon: Bed, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Vacant beds ready for immediate admission' },
    { key: 'occupied_beds', label: 'Occupied Beds', icon: Bed, color: 'text-orange-700 bg-orange-50 border-orange-200', desc: 'Currently admitted inpatient beds' },
  ];

  const occupancyRate = formData.total_beds > 0
    ? Math.min(100, Math.round(((formData.occupied_beds || 0) / formData.total_beds) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        <Link
          to="/admin/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#006655] hover:bg-white transition"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General Settings</span>
        </Link>
        <Link
          to="/admin/statistics"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#006655] text-white shadow-sm"
        >
          <Activity className="w-3.5 h-3.5 text-[#C4A760]" />
          <span>Hospital Statistics (Live Beds & Doctors)</span>
        </Link>
        <Link
          to="/admin/appearance"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#006655] hover:bg-white transition"
        >
          <Palette className="w-3.5 h-3.5 text-[#C4A760]" />
          <span>Appearance & UI Themes</span>
        </Link>
        <Link
          to="/admin/appointment-letter"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#006655] hover:bg-white transition"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Letter & Watermark</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#006655] tracking-tight">
            Hospital Statistics & Live Counter Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic hospital capacity figures displayed across the website homepage, about page, and patient portals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Live Figures</span>
          </button>
        </div>
      </div>

      {/* Live Website Preview Banner */}
      <div className="bg-gradient-to-r from-[#003329] via-[#004C3D] to-[#006655] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C4A760] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Live Website Preview Counter
            </span>
            <span className="text-[11px] text-emerald-200 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-400/30">
              Bed Occupancy Rate: <strong className="text-white">{occupancyRate}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-black text-white">{formData.total_beds}+</div>
              <div className="text-xs text-emerald-100 font-medium mt-1">Total Beds</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#C4A760]">{formData.total_icu_beds}</div>
              <div className="text-xs text-emerald-100 font-medium mt-1">ICU Beds</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-black text-white">{formData.total_doctors}+</div>
              <div className="text-xs text-emerald-100 font-medium mt-1">Specialist Doctors</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#93D3C3]">{formData.total_departments}</div>
              <div className="text-xs text-emerald-100 font-medium mt-1">Departments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-bold text-[#006655]">
            <Activity className="w-4 h-4" />
            <span>Hospital Bed, Staff & Facility Metrics</span>
          </div>
          <span className="text-xs text-slate-400">Values update on the website in real-time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {statFields.map((field) => {
            const Icon = field.icon;
            const val = formData[field.key as keyof HospitalStats] as number;
            return (
              <div
                key={field.key}
                className="p-4 rounded-2xl border border-slate-200 hover:border-[#006655]/40 hover:shadow-xs transition bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${field.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <label className="text-xs font-bold text-slate-800">
                      {field.label}
                    </label>
                  </div>
                </div>

                <input
                  type="number"
                  min={0}
                  required
                  value={val !== undefined ? val : 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.key]: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] font-mono font-bold text-base text-[#006655]"
                />

                <p className="text-[11px] text-slate-400 leading-tight">
                  {field.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save & Publish Live Figures</span>
          </button>
        </div>
      </form>
    </div>
  );
};
