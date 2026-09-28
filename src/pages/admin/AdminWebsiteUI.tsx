import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Palette,
  Layout,
  Globe,
  Upload,
  Save,
  Loader2,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Share2,
  CheckCircle2,
  Sliders,
  Type,
  Eye,
  Settings,
  Activity,
  FileText,
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { SettingsService, DEFAULT_WEBSITE_UI_SETTINGS } from '../../services/settingsService';
import { AuditService } from '../../services/auditService';
import { WebsiteUISettings } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';

type TabType = 'branding' | 'theme' | 'homepage' | 'footer';

export const AdminWebsiteUI: React.FC = () => {
  const { websiteUISettings, updateUISettingsInMemory, refreshSettings } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('branding');
  const [formData, setFormData] = useState<WebsiteUISettings>(websiteUISettings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    setFormData(websiteUISettings);
  }, [websiteUISettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await SettingsService.updateWebsiteUISettings(formData);
      updateUISettingsInMemory(updated);
      await AuditService.logAction('UPDATE_WEBSITE_UI', 'WEBSITE_UI', 'global', {
        title: formData.website_title,
        primary_color: formData.primary_color,
      });
      await refreshSettings();
      showToast('Website appearance settings saved and applied in real-time!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save UI settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_WEBSITE_UI_SETTINGS);
    showToast('Reset to default hospital theme settings. Click Save to apply.', 'info');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    if (type === 'favicon') setUploadingFavicon(true);
    if (type === 'hero') setUploadingHero(true);

    try {
      const url = await SettingsService.uploadAsset(file, type);
      if (type === 'logo') setFormData((prev) => ({ ...prev, logo_url: url }));
      if (type === 'favicon') setFormData((prev) => ({ ...prev, favicon_url: url }));
      if (type === 'hero') setFormData((prev) => ({ ...prev, hero_image_url: url }));
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'favicon') setUploadingFavicon(false);
      if (type === 'hero') setUploadingHero(false);
    }
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#006655] text-white shadow-sm"
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
            Website UI & Appearance Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize branding, color palette, homepage typography, hero banners, and footer coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Theme</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Appearance</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto text-xs font-bold">
        {[
          { id: 'branding', label: '1. Brand & Identity', icon: Globe },
          { id: 'theme', label: '2. Theme Colors & Styling', icon: Palette },
          { id: 'homepage', label: '3. Homepage & Hero Settings', icon: Layout },
          { id: 'footer', label: '4. Footer & Social Coordinates', icon: Share2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 ${
                active
                  ? 'bg-[#006655] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
        {/* TAB 1: BRANDING */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#006655]">Hospital Brand & Identity</h2>
              <p className="text-xs text-slate-500">Configure public title, official logo, and browser icon.</p>
            </div>

            {/* Logo & Favicon Upload Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              {/* Logo */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Primary Website Logo
                </label>
                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="w-20 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1.5"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-500">
                      NO LOGO
                    </div>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer text-xs shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-[#006655]" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} className="sr-only" />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  Recommended: Transparent PNG or SVG. Displays in header (aligned left) and footer.
                </p>
              </div>

              {/* Favicon */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Browser Tab Favicon
                </label>
                <div className="flex items-center gap-4">
                  {formData.favicon_url ? (
                    <img
                      src={formData.favicon_url}
                      alt="Favicon"
                      className="w-12 h-12 object-contain rounded-xl border border-slate-200 bg-white p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-500">
                      ICON
                    </div>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer text-xs shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-[#006655]" />
                    <span>{uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'favicon')} className="sr-only" />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  Square 1:1 ratio PNG or SVG icon shown in browser address tabs and bookmarks.
                </p>
              </div>
            </div>

            {/* Logo Size Adjust & Header Left Alignment Control */}
            <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl border-2 border-[#006655]/20 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#006655]">
                      Website Header Logo Size & Alignment Control
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adjust the logo size directly from admin. The official website navbar aligns the logo to the left.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#E0F2ED] border border-[#006655]/20 text-[#006655] text-xs font-black self-start sm:self-auto">
                  <span>Current Size:</span>
                  <span className="text-sm font-black text-[#C4A760]">
                    {formData.logo_height || 48} px
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Controls (Range slider + Number input + Presets) */}
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Logo Display Height (px)</span>
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
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                      <span>28px (Small)</span>
                      <span>48px (Default)</span>
                      <span>72px (Large)</span>
                      <span>110px (Extra Large)</span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                      Quick Size Presets:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Compact', size: 36 },
                        { label: 'Standard', size: 48 },
                        { label: 'Medium', size: 56 },
                        { label: 'Large', size: 68 },
                        { label: 'Extra Large', size: 85 },
                      ].map((preset) => {
                        const isSelected = (formData.logo_height || 48) === preset.size;
                        return (
                          <button
                            key={preset.size}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, logo_height: preset.size })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-[#006655] text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {preset.label} ({preset.size}px)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Live Real-time Navbar Preview Box */}
                <div className="lg:col-span-6 bg-[#FBF8F1] p-4 rounded-2xl border border-[#E5DEC9] shadow-inner space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#006655] pb-1 border-b border-[#E5DEC9]">
                    <span>Header Navbar Live Preview (Logo Left-Aligned)</span>
                    <span className="text-[#C4A760] font-black">{formData.logo_height || 48} px</span>
                  </div>

                  {/* Header mock with logo strictly on the left */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3 overflow-hidden shadow-2xs">
                    {/* LEFT LOGO */}
                    <div className="flex items-center shrink-0">
                      <img
                        src={formData.logo_url || '/logo.png'}
                        alt="Logo Preview"
                        style={{ height: `${formData.logo_height || 48}px`, maxHeight: '110px' }}
                        className="w-auto object-contain transition-all duration-200"
                      />
                    </div>

                    {/* FAKE NAV ITEMS */}
                    <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                      <span>Home</span>
                      <span>Doctors</span>
                      <span>Services</span>
                      <span>Contact</span>
                    </div>

                    {/* FAKE CTA */}
                    <div className="shrink-0 px-2.5 py-1 rounded-lg bg-[#C4A760] text-white text-[10px] font-bold shadow-2xs">
                      Book
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic text-center">
                    Changes apply immediately to the website header after clicking "Save Appearance".
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Hospital Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.hospital_name || ''}
                  onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                  placeholder="RHYTHM MEDICITY"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Browser Title Tag (SEO) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.website_title || ''}
                  onChange={(e) => setFormData({ ...formData, website_title: e.target.value })}
                  placeholder="RHYTHM MEDICITY - Complete Multi-Speciality Hospital"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Website Meta Description (SEO)
                </label>
                <textarea
                  rows={2}
                  value={formData.website_description || ''}
                  onChange={(e) => setFormData({ ...formData, website_description: e.target.value })}
                  placeholder="Official portal for scheduling specialist OPD consultations, emergency admissions, and diagnostic reports."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THEME COLORS */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#006655]">Visual Theme & Color Palette</h2>
                <p className="text-xs text-slate-500">Changes reflect dynamically across website buttons, banners, and headers.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {/* Primary Color */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block font-bold text-slate-700 uppercase">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primary_color || '#006655'}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.primary_color || '#006655'}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Used for titles, badges, and key icons.</p>
              </div>

              {/* Secondary Color */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block font-bold text-slate-700 uppercase">Secondary Dark Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondary_color || '#003329'}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color || '#003329'}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Used for hero section background and sidebars.</p>
              </div>

              {/* Accent Color */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block font-bold text-slate-700 uppercase">Accent Gold Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.accent_color || '#C4A760'}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.accent_color || '#C4A760'}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Used for highlights, ratings, and subheadings.</p>
              </div>

              {/* Button Color */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block font-bold text-slate-700 uppercase">Primary Button Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.button_color || '#006655'}
                    onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.button_color || '#006655'}
                    onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Used for Call-To-Action appointment booking buttons.</p>
              </div>

              {/* Header Color */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block font-bold text-slate-700 uppercase">Navbar Header Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.header_color || '#003329'}
                    onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.header_color || '#003329'}
                    onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Background of public top navigation bar.</p>
              </div>

              {/* Footer Color */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block font-bold text-slate-700 uppercase">Website Footer Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.footer_color || '#002920'}
                    onChange={(e) => setFormData({ ...formData, footer_color: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.footer_color || '#002920'}
                    onChange={(e) => setFormData({ ...formData, footer_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Background of public website footer container.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HOMEPAGE SETTINGS */}
        {activeTab === 'homepage' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#006655]">Homepage & Hero Configurations</h2>
              <p className="text-xs text-slate-500">Configure hero messaging, action buttons, and featured sections.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Hero Section Main Heading *
                </label>
                <input
                  type="text"
                  required
                  value={formData.hero_heading || ''}
                  onChange={(e) => setFormData({ ...formData, hero_heading: e.target.value })}
                  placeholder="Excellence in Clinical Care & Advanced Diagnostics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Hero Section Subtitle / Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.hero_description || ''}
                  onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                  placeholder="Empowering patient health with world-class specialists..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Appointment Button Label
                </label>
                <input
                  type="text"
                  value={formData.appointment_button_text || 'Book Appointment'}
                  onChange={(e) => setFormData({ ...formData, appointment_button_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Secondary CTA Button Label
                </label>
                <input
                  type="text"
                  value={formData.cta_text || 'Explore Specialities'}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Emergency Phone Number (Header & Hero)
                </label>
                <input
                  type="text"
                  value={formData.emergency_number || '108'}
                  onChange={(e) => setFormData({ ...formData, emergency_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Display Hospital Statistics Section
                </label>
                <select
                  value={formData.show_hospital_statistics ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, show_hospital_statistics: e.target.value === 'true' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white text-sm"
                >
                  <option value="true">Enabled (Show on Homepage & About)</option>
                  <option value="false">Disabled (Hide)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  About Hospital Summary Content
                </label>
                <textarea
                  rows={3}
                  value={formData.about_hospital_content || ''}
                  onChange={(e) => setFormData({ ...formData, about_hospital_content: e.target.value })}
                  placeholder="Rhythm Medicity is an accredited multi-speciality tertiary healthcare destination..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FOOTER SETTINGS */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#006655]">Footer & Social Coordinates</h2>
              <p className="text-xs text-slate-500">Configure contact coordinates, copyright notice, and social channels.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Footer Hospital Name
                </label>
                <input
                  type="text"
                  value={formData.footer_hospital_name || ''}
                  onChange={(e) => setFormData({ ...formData, footer_hospital_name: e.target.value })}
                  placeholder="RHYTHM MEDICITY"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Official Phone Number
                </label>
                <input
                  type="text"
                  value={formData.footer_phone || ''}
                  onChange={(e) => setFormData({ ...formData, footer_phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={formData.footer_email || ''}
                  onChange={(e) => setFormData({ ...formData, footer_email: e.target.value })}
                  placeholder="care@rhythmmedicity.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  WhatsApp Support
                </label>
                <input
                  type="text"
                  value={formData.footer_whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, footer_whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Hospital Address
                </label>
                <input
                  type="text"
                  value={formData.footer_address || ''}
                  onChange={(e) => setFormData({ ...formData, footer_address: e.target.value })}
                  placeholder="Central Medical Zone, Healthcare Boulevard, City"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              {/* Social Channels */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 uppercase block mb-3">Social Media URLs</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Facebook URL</span>
                    <input
                      type="url"
                      value={formData.social_facebook || ''}
                      onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Twitter / X URL</span>
                    <input
                      type="url"
                      value={formData.social_twitter || ''}
                      onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                      placeholder="https://twitter.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Instagram URL</span>
                    <input
                      type="url"
                      value={formData.social_instagram || ''}
                      onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">YouTube URL</span>
                    <input
                      type="url"
                      value={formData.social_youtube || ''}
                      onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Copyright Notice Text
                </label>
                <input
                  type="text"
                  value={formData.copyright_text || ''}
                  onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                  placeholder="© 2026 RHYTHM MEDICITY. All Rights Reserved."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save & Apply Appearance Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
