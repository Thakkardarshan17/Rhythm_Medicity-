import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Save, Loader2, Sliders, Eye, Upload, Image as ImageIcon, Sparkles, Settings, Activity, Palette } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { SettingsService } from '../../services/settingsService';
import { AuditService } from '../../services/auditService';
import { uploadImageWithFallback } from '../../utils/imageUpload';
import { AppointmentLetterSettings, Appointment } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';
import { AppointmentLetterView } from '../../components/AppointmentLetterView';

export const AdminLetterSettings: React.FC = () => {
  const { letterSettings, hospitalSettings, refreshSettings } = useSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<AppointmentLetterSettings>(letterSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    setFormData(letterSettings);
  }, [letterSettings]);

  const handleCustomLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `watermark/watermark_${Date.now()}.${ext}`;
      const url = await uploadImageWithFallback('hospital-public-assets', path, file);
      setFormData((prev) => ({
        ...prev,
        watermark_logo_url: url,
        watermark_type: 'custom',
      }));
      showToast('Custom watermark logo uploaded successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload watermark logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await SettingsService.updateAppointmentLetterSettings(formData);
      await AuditService.logAction('UPDATE_LETTER_SETTINGS', 'LETTER_SETTINGS', formData.id);
      await refreshSettings();
      showToast('Appointment letter document template updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save letter settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Mock sample appointment to render the live A5 preview accurately
  const sampleAppointment: Appointment = {
    id: 'sample-preview',
    appointment_number: '000001',
    patient_user_id: null,
    patient_name: 'Patient Name (Sample)',
    patient_age: 38,
    patient_gender: 'Female',
    patient_address: '12-A Health Park Road, Central City',
    patient_mobile: '9876543210',
    speciality_id: 'sample-spec',
    doctor_id: 'sample-doc',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:30',
    patient_problem: 'Routine cardiovascular checkup and blood pressure assessment.',
    diagnosis: 'Normal sinus rhythm. Lifestyle modifications recommended.',
    consultation_fee: 500,
    currency: 'INR',
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
    terms_version: 'v1.0',
    payment_status: 'PAID',
    appointment_status: 'CONFIRMED',
    payment_transaction_id: 'sample-tx',
    booking_source: 'WEB',
    doctor_name_snapshot: 'Dr. Senior Medical Specialist, MD',
    speciality_name_snapshot: 'Cardiology',
    consultation_fee_snapshot: 500,
    hospital_name_snapshot: hospitalSettings.hospital_name || 'RHYTHM MEDICITY',
    hospital_address_snapshot: hospitalSettings.address || 'Central Medical Zone, Hospital Road',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

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
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#006655] hover:bg-white transition"
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#006655] text-white shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Letter & Watermark</span>
        </Link>
      </div>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-[#006655] tracking-tight">
          Appointment Letter & Document Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure the official A5 printable consultation slip template, watermark logo, opacity, and legal notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Controls */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-[#006655]" />
            <h2 className="font-bold text-[#006655] text-sm">Template Properties</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Document Banner Title *
              </label>
              <input
                type="text"
                required
                value={formData.letter_title || ''}
                onChange={(e) => setFormData({ ...formData, letter_title: e.target.value })}
                placeholder="CONFIRMED APPOINTMENT SLIP"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm font-semibold"
              />
            </div>

            {/* Watermark Logo Selector */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 uppercase">
                Watermark Background Logo
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      watermark_logo_url: '/emblem.png',
                      watermark_type: 'emblem',
                    }))
                  }
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 min-h-[76px] ${
                    formData.watermark_type === 'emblem' || (!formData.watermark_type && formData.watermark_logo_url === '/emblem.png') || !formData.watermark_type
                      ? 'border-[#006655] bg-[#006655]/10 text-[#006655] font-bold ring-2 ring-[#006655]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <img src="/emblem.png" alt="Emblem" className="h-7 w-auto object-contain" />
                  <span className="text-[10px]">Emblem (Centered Crest)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      watermark_logo_url: hospitalSettings.logo_url || '/logo.png',
                      watermark_type: 'logo',
                    }))
                  }
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 min-h-[76px] ${
                    formData.watermark_type === 'logo'
                      ? 'border-[#006655] bg-[#006655]/10 text-[#006655] font-bold ring-2 ring-[#006655]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <img
                    src={hospitalSettings.logo_url || '/logo.png'}
                    alt="Logo"
                    className="h-7 w-auto object-contain max-w-[80px]"
                  />
                  <span className="text-[10px]">Hospital Logo</span>
                </button>

                <label
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 min-h-[76px] cursor-pointer ${
                    formData.watermark_type === 'custom'
                      ? 'border-[#006655] bg-[#006655]/10 text-[#006655] font-bold ring-2 ring-[#006655]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomLogoUpload}
                    className="hidden"
                  />
                  {uploadingLogo ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#006655]" />
                  ) : formData.watermark_type === 'custom' && formData.watermark_logo_url ? (
                    <img
                      src={formData.watermark_logo_url}
                      alt="Custom"
                      className="h-7 w-auto object-contain max-w-[80px]"
                    />
                  ) : (
                    <Upload className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-[10px]">
                    {uploadingLogo ? 'Uploading...' : 'Custom Upload'}
                  </span>
                </label>
              </div>
            </div>

            {/* Opacity Slider with Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase">
                  Watermark Opacity ({Math.round((formData.watermark_opacity ?? 0.08) * 100)}%)
                </label>
                <span className="text-xs font-mono font-bold text-[#006655] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {Math.round((formData.watermark_opacity ?? 0.08) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.40"
                step="0.01"
                value={formData.watermark_opacity ?? 0.08}
                onChange={(e) =>
                  setFormData({ ...formData, watermark_opacity: parseFloat(e.target.value) })
                }
                className="w-full accent-[#006655] cursor-pointer"
              />

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { label: 'Off (0%)', val: 0 },
                  { label: '5% Subtle', val: 0.05 },
                  { label: '8% Default', val: 0.08 },
                  { label: '14% Medium', val: 0.14 },
                  { label: '22% Bold', val: 0.22 },
                  { label: '30% Strong', val: 0.30 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, watermark_opacity: preset.val })}
                    className={`px-2 py-1 rounded-lg text-[10px] transition ${
                      Math.abs((formData.watermark_opacity ?? 0.08) - preset.val) < 0.01
                        ? 'bg-[#006655] text-white font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Adjusts the background logo watermark transparency on printed appointment letters and PDFs.
              </span>
            </div>

            {/* Stamp Display & Size Adjuster */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase text-xs flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_stamp}
                    onChange={(e) => setFormData({ ...formData, show_stamp: e.target.checked })}
                    className="w-4 h-4 rounded text-[#006655] accent-[#006655]"
                  />
                  <span>Show Official Hospital Stamp</span>
                </label>
                <span className="text-xs font-mono font-bold text-[#006655] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formData.stamp_size || 70}px
                </span>
              </div>

              {formData.show_stamp && (
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Stamp Size / Scale</span>
                    <span>{formData.stamp_size || 70} pixels</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="130"
                    step="5"
                    value={formData.stamp_size || 70}
                    onChange={(e) =>
                      setFormData({ ...formData, stamp_size: parseInt(e.target.value) })
                    }
                    className="w-full accent-[#006655] cursor-pointer"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[
                      { label: 'Small (50px)', size: 50 },
                      { label: 'Medium (70px)', size: 70 },
                      { label: 'Standard (85px)', size: 85 },
                      { label: 'Large (100px)', size: 100 },
                      { label: 'Extra Large (120px)', size: 120 },
                    ].map((preset) => (
                      <button
                        key={preset.size}
                        type="button"
                        onClick={() => setFormData({ ...formData, stamp_size: preset.size })}
                        className={`px-2 py-1 rounded-lg text-[10px] transition ${
                          (formData.stamp_size || 70) === preset.size
                            ? 'bg-[#006655] text-white font-bold shadow-2xs'
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Adjusts the dimensions of the official hospital stamp on print and PDF receipts.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Authorization Line Text
              </label>
              <input
                type="text"
                value={formData.authorization_text || ''}
                onChange={(e) => setFormData({ ...formData, authorization_text: e.target.value })}
                placeholder="Authorized Medical Representative"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Patient Notice / Footer Instructions
              </label>
              <textarea
                rows={3}
                value={formData.footer_text || ''}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                placeholder="Please arrive 15 minutes before your scheduled appointment time..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Template Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Pane: Live A5 Preview with Real-time Opacity Binding */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#006655]" />
              <span>Live A5 Slip Preview</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">
              Updates in real-time as you adjust controls
            </span>
          </div>

          <div className="bg-slate-200/80 p-4 rounded-3xl border border-slate-300 overflow-x-auto flex justify-center">
            <AppointmentLetterView
              appointment={sampleAppointment}
              overrideSettings={formData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

