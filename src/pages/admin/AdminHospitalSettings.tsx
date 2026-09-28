import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Save, Upload, Loader2, Activity, ShieldCheck, MapPin, Phone, Mail, Palette, FileText, ListFilter } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { SettingsService } from '../../services/settingsService';
import { AuditService } from '../../services/auditService';
import { HospitalSettings } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';

export const AdminHospitalSettings: React.FC = () => {
  const { hospitalSettings, refreshSettings } = useSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<HospitalSettings>(hospitalSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);

  useEffect(() => {
    setFormData(hospitalSettings);
  }, [hospitalSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const url = await SettingsService.uploadAsset(file, 'logo');
      setFormData((prev) => ({ ...prev, logo_url: url }));
      showToast('Hospital logo uploaded.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Logo upload failed', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStamp(true);
    try {
      const url = await SettingsService.uploadAsset(file, 'stamp');
      setFormData((prev) => ({ ...prev, stamp_url: url }));
      showToast('Hospital official stamp uploaded.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Stamp upload failed', 'error');
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await SettingsService.updateHospitalSettings(formData);
      await AuditService.logAction('UPDATE_SETTINGS', 'HOSPITAL_SETTINGS', formData.id, {
        name: formData.hospital_name,
      });
      await refreshSettings();
      showToast('Hospital configuration updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        <Link
          to="/admin/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#006655] text-white shadow-sm"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General Settings</span>
        </Link>
        <Link
          to="/admin/dropdowns"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#006655] hover:bg-white transition"
        >
          <ListFilter className="w-3.5 h-3.5 text-[#C4A760]" />
          <span>Dropdown Management</span>
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#006655] hover:bg-white transition"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Letter & Watermark</span>
        </Link>
      </div>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-[#006655] tracking-tight">
          Hospital Operational Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure hospital brand identity, public contact coordinates, official stamp, and emergency details.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
        {/* Branding Logos & Stamps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
          {/* Logo */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Hospital Primary Logo
            </label>
            <div className="flex items-center gap-4">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#E0F2ED] text-[#004C3D] flex items-center justify-center font-bold text-xs">
                  NO LOGO
                </div>
              )}
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer text-xs shadow-xs">
                <Upload className="w-3.5 h-3.5 text-[#006655]" />
                <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" />
              </label>
            </div>
            <p className="text-[10px] text-slate-400">
              Appears on website navbar (aligned left), footer, splash screen, and A5 appointment slips.
            </p>

            {/* Logo Size Control */}
            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Website Logo Size:</span>
                <span className="text-[#006655] font-black">{formData.logo_height || 48} px</span>
              </div>
              <input
                type="range"
                min={28}
                max={110}
                step={2}
                value={formData.logo_height || 48}
                onChange={(e) =>
                  setFormData({ ...formData, logo_height: Number(e.target.value) })
                }
                className="w-full accent-[#006655] cursor-pointer"
              />
            </div>
          </div>

          {/* Stamp */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Official Hospital Stamp
            </label>
            <div className="flex items-center gap-4">
              {formData.stamp_url ? (
                <img
                  src={formData.stamp_url}
                  alt="Stamp"
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-[10px] text-center p-1">
                  NO STAMP
                </div>
              )}
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer text-xs shadow-xs">
                <Upload className="w-3.5 h-3.5 text-[#006655]" />
                <span>{uploadingStamp ? 'Uploading...' : 'Upload Stamp'}</span>
                <input type="file" accept="image/*" onChange={handleStampUpload} className="sr-only" />
              </label>
            </div>
            <p className="text-[10px] text-slate-400">
              Appears on generated appointment confirmation letters above the authorized signature line.
            </p>
          </div>
        </div>

        {/* Identity Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Hospital Legal Name *
            </label>
            <input
              type="text"
              required
              value={formData.hospital_name || ''}
              onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Hospital Tagline *
            </label>
            <input
              type="text"
              required
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Hospital Campus Address
            </label>
            <textarea
              rows={2}
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 100 Hospital Boulevard, Medical District"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Reception Phone Number
            </label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="care@rhythmmedicity.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              WhatsApp Support Number
            </label>
            <input
              type="text"
              value={formData.whatsapp_number || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              24x7 Emergency Hotline
            </label>
            <input
              type="text"
              value={formData.emergency_number || ''}
              onChange={(e) => setFormData({ ...formData, emergency_number: e.target.value })}
              placeholder="108 or +91 98765 00000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              🚑 24x7 Ambulance Helpline (Used by Dillo Voice)
            </label>
            <input
              type="text"
              value={formData.ambulance_number || ''}
              onChange={(e) => setFormData({ ...formData, ambulance_number: e.target.value })}
              placeholder="+91 98250 10808"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              📍 Google Maps Navigation URL
            </label>
            <input
              type="text"
              value={formData.google_maps_url || ''}
              onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
              placeholder="https://maps.google.com/?q=..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">
              ⏰ Hospital & OPD Timings
            </label>
            <input
              type="text"
              value={formData.opd_timings || ''}
              onChange={(e) => setFormData({ ...formData, opd_timings: e.target.value })}
              placeholder="Monday to Saturday: 9:00 AM - 8:00 PM (Emergency & ICU 24x7)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Hospital Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
