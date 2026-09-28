import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Upload,
  X,
  Loader2,
  ArrowRight,
  Sliders,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { BannerService, DEFAULT_BANNER_CAROUSEL_SETTINGS } from '../../services/bannerService';
import { AuditService } from '../../services/auditService';
import { Banner, BannerCarouselSettings, EntityStatus } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export const AdminBanners: React.FC = () => {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Carousel & Animation Control Settings State
  const [carouselSettings, setCarouselSettings] = useState<BannerCarouselSettings>(
    DEFAULT_BANNER_CAROUSEL_SETTINGS
  );
  const [savingSettings, setSavingSettings] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<Partial<Banner>>({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: 'Book Appointment',
    cta_link: '/appointment',
    display_order: 0,
    status: 'active',
  });

  const loadData = async () => {
    try {
      const [bannersData, settingsData] = await Promise.all([
        BannerService.getAllBannersAdmin(),
        BannerService.getBannerSettings(),
      ]);
      setBanners(bannersData);
      setCarouselSettings(settingsData);
    } catch (err) {
      console.error('Error fetching admin banners & settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCarouselSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await BannerService.updateBannerSettings(carouselSettings);
      setCarouselSettings(updated);
      await AuditService.logAction('UPDATE', 'BANNER_CAROUSEL_SETTINGS', 'carousel_settings', {
        auto_scroll_interval: carouselSettings.auto_scroll_interval,
        transition_animation: carouselSettings.transition_animation,
        transition_speed: carouselSettings.transition_speed,
      });
      showToast('Banner scroll timing & animation controls updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update carousel settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      cta_text: 'Book Appointment',
      cta_link: '/appointment',
      display_order: banners.length,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      cta_text: banner.cta_text || '',
      cta_link: banner.cta_link || '',
      display_order: banner.display_order,
      status: banner.status,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await BannerService.uploadBannerImage(file);
      setFormData((prev) => ({ ...prev, image_url: url }));
      showToast('Banner image uploaded successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload banner image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.image_url) {
      showToast('Banner title and image are required.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingBanner) {
        await BannerService.updateBanner(editingBanner.id, formData);
        await AuditService.logAction('UPDATE', 'BANNER', editingBanner.id, { title: formData.title });
        showToast('Hero banner updated successfully.', 'success');
      } else {
        const created = await BannerService.createBanner(formData);
        await AuditService.logAction('CREATE', 'BANNER', created.id, { title: formData.title });
        showToast('Hero banner added to homepage carousel.', 'success');
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await BannerService.deleteBanner(deleteTarget.id);
      await AuditService.logAction('DELETE', 'BANNER', deleteTarget.id, { title: deleteTarget.title });
      showToast('Hero banner deleted.', 'info');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete banner', 'error');
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const newStatus: EntityStatus = banner.status === 'active' ? 'inactive' : 'active';
      await BannerService.updateBanner(banner.id, { status: newStatus });
      showToast(`Banner marked as ${newStatus}.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#006655] tracking-tight">
            Homepage Hero Carousel Banners
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage public website hero slides, scroll timing intervals, and animation transition styles.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Banner</span>
        </button>
      </div>

      {/* 1. CAROUSEL SCROLL TIME & ANIMATION CONTROLS PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#003329] to-[#004C3D] p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C4A760] shrink-0 border border-white/15">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Banner Scroll Timing & Animation Controls</span>
                <span className="text-[10px] bg-[#C4A760] text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  LIVE CONTROL
                </span>
              </h2>
              <p className="text-xs text-[#93D3C3] font-light mt-0.5">
                Configure auto-scroll speed, slide duration, transition effects, and interaction behavior.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveCarouselSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C4A760] hover:bg-[#B0934C] text-slate-950 font-bold text-xs shadow-md transition shrink-0"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Save Carousel Settings</span>
          </button>
        </div>

        <form onSubmit={handleSaveCarouselSettings} className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* 1. Auto-Scroll Interval */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#006655]" />
              <span>Scroll Time (Slide Interval)</span>
            </label>
            <select
              value={carouselSettings.auto_scroll_interval}
              onChange={(e) =>
                setCarouselSettings({
                  ...carouselSettings,
                  auto_scroll_interval: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#006655] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
            >
              <option value={2}>2 Seconds (Ultra Fast)</option>
              <option value={3}>3 Seconds (Fast)</option>
              <option value={4}>4 Seconds (Dynamic)</option>
              <option value={5}>5 Seconds (Recommended Standard)</option>
              <option value={6}>6 Seconds (Relaxed)</option>
              <option value={8}>8 Seconds (Extended Read)</option>
              <option value={10}>10 Seconds (Slow / Showcase)</option>
            </select>
            <p className="text-[11px] text-slate-400">Time each banner remains on screen before sliding.</p>
          </div>

          {/* 2. Transition Animation Style */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#006655]" />
              <span>Animation Effect</span>
            </label>
            <select
              value={carouselSettings.transition_animation}
              onChange={(e) =>
                setCarouselSettings({
                  ...carouselSettings,
                  transition_animation: e.target.value as any,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#006655] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
            >
              <option value="fade">Smooth Cross-Fade</option>
              <option value="slide">Horizontal Slide Reveal</option>
              <option value="zoom">Subtle Zoom & Scale</option>
              <option value="smooth">Cinematic Soft Blend</option>
            </select>
            <p className="text-[11px] text-slate-400">Visual transition when switching between slides.</p>
          </div>

          {/* 3. Transition Speed / Duration */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#006655]" />
              <span>Transition Speed</span>
            </label>
            <select
              value={carouselSettings.transition_speed}
              onChange={(e) =>
                setCarouselSettings({
                  ...carouselSettings,
                  transition_speed: e.target.value as any,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#006655] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
            >
              <option value="fast">Fast (400ms Animation)</option>
              <option value="normal">Balanced (700ms Animation)</option>
              <option value="slow">Slow & Luxurious (1200ms)</option>
            </select>
            <p className="text-[11px] text-slate-400">Duration of the transition animation effect.</p>
          </div>

          {/* 4. Auto-Play & Hover Controls */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-[#006655]" />
              <span>Playback Controls</span>
            </label>
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={carouselSettings.auto_play}
                  onChange={(e) =>
                    setCarouselSettings({
                      ...carouselSettings,
                      auto_play: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-[#006655] focus:ring-[#006655] w-4 h-4"
                />
                <span className="font-medium text-slate-700 text-xs">Enable Auto-Play</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={carouselSettings.pause_on_hover}
                  onChange={(e) =>
                    setCarouselSettings({
                      ...carouselSettings,
                      pause_on_hover: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-[#006655] focus:ring-[#006655] w-4 h-4"
                />
                <span className="font-medium text-slate-700 text-xs">Pause on Mouse Hover</span>
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Grid of Banners */}
      {loading ? (
        <TableSkeleton rows={3} />
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="relative h-44 bg-[#003329]">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/60 text-white">
                    Order: {b.display_order}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(b)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'active'
                        ? 'bg-[#E0F2ED]0 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {b.status.toUpperCase()}
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-2 flex-1">
                <h3 className="font-bold text-[#006655] text-base">{b.title}</h3>
                {b.subtitle && <p className="text-xs text-slate-500 line-clamp-2">{b.subtitle}</p>}
                {b.cta_text && (
                  <div className="pt-2 text-xs font-semibold text-[#006655] flex items-center gap-1">
                    <span>CTA: {b.cta_text}</span>
                    <span className="text-slate-400">({b.cta_link || '/appointment'})</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(b)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-[#006655] hover:bg-slate-200 transition"
                  title="Edit Banner"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(b)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">No Hero Banners Uploaded</p>
          <p className="text-slate-400 mt-1">
            The homepage carousel currently displays an elegant empty-state healthcare graphic until you upload slides.
          </p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003329]/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#006655]">
                {editingBanner ? 'Edit Banner Slide' : 'Add New Hero Banner Slide'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase">Banner Image *</label>
                {formData.image_url ? (
                  <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-200">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#006655]" />
                  <span>{uploadingImage ? 'Uploading...' : 'Choose Banner Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. World-Class Cardiology & Heart Care"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Supporting message for patients..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.cta_text || ''}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Book Appointment"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order || 0}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.image_url}
                  className="px-5 py-2 rounded-xl bg-[#006655] text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Hero Banner?"
        message={`Are you sure you want to remove "${deleteTarget?.title}" from the homepage carousel?`}
        confirmText="Delete Banner"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
