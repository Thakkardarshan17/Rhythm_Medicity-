import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadImageWithFallback } from '../utils/imageUpload';
import { isValidUUID } from '../utils/uuid';
import { HospitalSettings, AppointmentLetterSettings, HospitalStats, WebsiteUISettings } from '../types/database';

export const DEFAULT_HOSPITAL_SETTINGS: HospitalSettings = {
  id: 'default',
  hospital_name: 'RHYTHM MEDICITY',
  tagline: 'ONE STOP SOLUTION FOR COMPLETE CARE',
  address: 'Rhythm Medicity Campus, Near S.G. Highway, Ahmedabad, Gujarat 380054',
  phone: '+91 79 2685 4321',
  email: 'care@rhythmmedicity.com',
  whatsapp_number: '+91 98250 12345',
  emergency_number: '+91 79 2685 9999',
  ambulance_number: '+91 98250 10808',
  google_maps_url: 'https://maps.google.com/?q=Rhythm+Medicity+Hospital',
  opd_timings: 'Monday to Saturday: 9:00 AM - 8:00 PM (Emergency & ICU 24x7)',
  emergency_department_info: '24x7 Level-1 Trauma & Emergency Center with Dedicated Cardiac Triage',
  logo_url: '/logo.png',
  logo_height: 48,
  stamp_url: null,
  website_url: 'https://rhythmmedicity.com',
  timezone: 'Asia/Kolkata',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEFAULT_LETTER_SETTINGS: AppointmentLetterSettings = {
  id: 'default',
  letter_title: 'CONFIRMED APPOINTMENT SLIP',
  watermark_opacity: 0.08,
  watermark_logo_url: '/emblem.png',
  watermark_type: 'emblem',
  show_stamp: true,
  stamp_size: 75,
  authorization_text: 'Authorized Medical Representative',
  footer_text: 'Please arrive 15 minutes before your scheduled appointment time. Bring any previous medical records or test reports.',
  contact_information: null,
  terms_text: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEFAULT_HOSPITAL_STATS: HospitalStats = {
  total_beds: 250,
  total_icu_beds: 35,
  total_general_beds: 180,
  total_private_rooms: 35,
  total_doctors: 48,
  total_departments: 12,
  total_nurses: 95,
  total_ambulances: 8,
  total_operation_theatres: 6,
  total_labs: 4,
  total_pharmacy_counters: 3,
  emergency_beds: 20,
  available_beds: 65,
  occupied_beds: 185,
  updated_at: new Date().toISOString(),
};

export const DEFAULT_WEBSITE_UI_SETTINGS: WebsiteUISettings = {
  hospital_name: 'RHYTHM MEDICITY',
  logo_url: '/logo.png',
  logo_height: 48,
  favicon_url: '/emblem.png',
  website_title: 'RHYTHM MEDICITY - Complete Multi-Speciality Hospital',
  website_description: 'Premier Multi-Speciality Hospital & Research Center providing comprehensive round-the-clock emergency, outpatient, and surgical care.',

  primary_color: '#006655',
  secondary_color: '#003329',
  accent_color: '#C4A760',
  button_color: '#006655',
  header_color: '#003329',
  footer_color: '#002920',

  hero_heading: 'Excellence in Clinical Care & Advanced Diagnostics',
  hero_description: 'Empowering patient health with world-class specialists, atomic instant verified appointment slips, and compassionate 24/7 emergency support.',
  hero_image_url: '/logo.png',
  emergency_number: '108 / +91 98765 00000',
  appointment_button_text: 'Book Consultation',
  cta_text: 'Explore Medical Departments',
  about_hospital_content: 'Rhythm Medicity is an accredited multi-speciality tertiary healthcare destination dedicated to delivering ethical, patient-centric, and evidence-guided treatments.',
  show_hospital_statistics: true,
  featured_departments_count: 8,
  featured_doctors_count: 6,

  footer_hospital_name: 'RHYTHM MEDICITY',
  footer_address: 'Central Medical Zone, Healthcare Boulevard, City - 380001',
  footer_phone: '+91 98765 43210',
  footer_emergency_number: '108 / +91 98765 00000',
  footer_whatsapp: '+91 98765 43210',
  footer_email: 'care@rhythmmedicity.com',
  social_facebook: 'https://facebook.com',
  social_twitter: 'https://twitter.com',
  social_instagram: 'https://instagram.com',
  social_linkedin: 'https://linkedin.com',
  social_youtube: 'https://youtube.com',
  copyright_text: '© 2026 RHYTHM MEDICITY. All Rights Reserved. Complete Healthcare Solution.',
  updated_at: new Date().toISOString(),
};

export class SettingsService {
  static async getHospitalSettings(): Promise<HospitalSettings> {
    const savedLocal = localStorage.getItem('rhythm_hospital_settings');
    const localFallback = savedLocal
      ? { ...DEFAULT_HOSPITAL_SETTINGS, ...JSON.parse(savedLocal) }
      : DEFAULT_HOSPITAL_SETTINGS;

    if (!isSupabaseConfigured()) {
      return localFallback;
    }

    try {
      const { data, error } = await supabase
        .from('hospital_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return localFallback;
      }
      return data;
    } catch {
      return localFallback;
    }
  }

  static async updateHospitalSettings(settings: Partial<HospitalSettings>): Promise<HospitalSettings> {
    const payload = { ...settings };
    if (!isValidUUID(payload.id)) {
      delete payload.id;
    }

    const localSaved: HospitalSettings = {
      ...DEFAULT_HOSPITAL_SETTINGS,
      ...settings,
      updated_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem('rhythm_hospital_settings', JSON.stringify(localSaved));
    } catch (_) {}

    if (!isSupabaseConfigured()) {
      return localSaved;
    }

    try {
      const existing = await this.getHospitalSettings();
      if (existing.id && isValidUUID(existing.id)) {
        let updatePayload: any = {
          ...payload,
          updated_at: new Date().toISOString(),
        };
        let { data, error } = await supabase
          .from('hospital_settings')
          .update(updatePayload)
          .eq('id', existing.id)
          .select()
          .single();

        if (error && error.message?.includes('logo_height')) {
          delete updatePayload.logo_height;
          const retry = await supabase
            .from('hospital_settings')
            .update(updatePayload)
            .eq('id', existing.id)
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }

        if (!error && data) {
          const merged = { ...localSaved, ...data, logo_height: localSaved.logo_height };
          localStorage.setItem('rhythm_hospital_settings', JSON.stringify(merged));
          return merged;
        }
      }

      let insertPayload: any = {
        ...payload,
        hospital_name: payload.hospital_name || 'RHYTHM MEDICITY',
        tagline: payload.tagline || 'ONE STOP SOLUTION FOR COMPLETE CARE',
      };
      let { data, error } = await supabase
        .from('hospital_settings')
        .insert(insertPayload)
        .select()
        .single();

      if (error && error.message?.includes('logo_height')) {
        delete insertPayload.logo_height;
        const retry = await supabase
          .from('hospital_settings')
          .insert(insertPayload)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const merged = { ...localSaved, ...data, logo_height: localSaved.logo_height };
        localStorage.setItem('rhythm_hospital_settings', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Supabase settings update failed, saved locally:', err);
    }

    return localSaved;
  }

  static async getAppointmentLetterSettings(): Promise<AppointmentLetterSettings> {
    const savedLocal = localStorage.getItem('rhythm_letter_settings');
    let localFallback: AppointmentLetterSettings = savedLocal
      ? { ...DEFAULT_LETTER_SETTINGS, ...JSON.parse(savedLocal) }
      : DEFAULT_LETTER_SETTINGS;

    if (localFallback.watermark_logo_url === '/logo.png') {
      localFallback.watermark_logo_url = '/emblem.png';
      localFallback.watermark_type = 'emblem';
    }

    if (!isSupabaseConfigured()) {
      return localFallback;
    }

    try {
      const { data, error } = await supabase
        .from('appointment_letter_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return localFallback;
      }
      if (data.watermark_logo_url === '/logo.png') {
        data.watermark_logo_url = '/emblem.png';
        data.watermark_type = 'emblem';
      }
      return data;
    } catch {
      return localFallback;
    }
  }

  static async updateAppointmentLetterSettings(
    settings: Partial<AppointmentLetterSettings>
  ): Promise<AppointmentLetterSettings> {
    const payload = { ...settings };
    if (!isValidUUID(payload.id)) {
      delete payload.id;
    }

    const localSaved: AppointmentLetterSettings = {
      ...DEFAULT_LETTER_SETTINGS,
      ...settings,
      updated_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem('rhythm_letter_settings', JSON.stringify(localSaved));
    } catch (_) {}

    if (!isSupabaseConfigured()) {
      return localSaved;
    }

    try {
      const existing = await this.getAppointmentLetterSettings();
      if (existing.id && isValidUUID(existing.id)) {
        const { data, error } = await supabase
          .from('appointment_letter_settings')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!error && data) {
          localStorage.setItem('rhythm_letter_settings', JSON.stringify(data));
          return data;
        }
      }

      const { data, error } = await supabase
        .from('appointment_letter_settings')
        .insert({
          ...payload,
        })
        .select()
        .single();

      if (!error && data) {
        localStorage.setItem('rhythm_letter_settings', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Supabase letter settings update failed, saved locally:', err);
    }

    return localSaved;
  }

  static async uploadAsset(file: File, prefix: 'logo' | 'stamp' | 'favicon' | 'hero'): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${prefix}_${Date.now()}.${fileExt}`;
    const filePath = `settings/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }

  // ==========================================
  // HOSPITAL STATISTICS MANAGEMENT
  // ==========================================
  static async getHospitalStats(): Promise<HospitalStats> {
    const saved = localStorage.getItem('rhythm_hospital_stats');
    const localFallback: HospitalStats = saved
      ? { ...DEFAULT_HOSPITAL_STATS, ...JSON.parse(saved) }
      : DEFAULT_HOSPITAL_STATS;

    if (!isSupabaseConfigured()) {
      return localFallback;
    }

    try {
      const { data, error } = await supabase
        .from('hospital_statistics')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return { ...DEFAULT_HOSPITAL_STATS, ...data };
      }
    } catch (err) {
      console.warn('Error reading hospital statistics from Supabase:', err);
    }
    return localFallback;
  }

  static async updateHospitalStats(stats: Partial<HospitalStats>): Promise<HospitalStats> {
    const localSaved: HospitalStats = {
      ...DEFAULT_HOSPITAL_STATS,
      ...stats,
      updated_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem('rhythm_hospital_stats', JSON.stringify(localSaved));
    } catch (_) {}

    if (isSupabaseConfigured()) {
      try {
        const existing = await this.getHospitalStats();
        if (existing.id && isValidUUID(existing.id)) {
          const { data, error } = await supabase
            .from('hospital_statistics')
            .update({
              ...stats,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (!error && data) {
            localStorage.setItem('rhythm_hospital_stats', JSON.stringify(data));
            return data;
          }
        } else {
          const { data, error } = await supabase
            .from('hospital_statistics')
            .insert({ ...localSaved })
            .select()
            .single();

          if (!error && data) {
            localStorage.setItem('rhythm_hospital_stats', JSON.stringify(data));
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase hospital stats save failed, using local:', err);
      }
    }

    return localSaved;
  }

  // ==========================================
  // WEBSITE UI / APPEARANCE MANAGEMENT
  // ==========================================
  static async getWebsiteUISettings(): Promise<WebsiteUISettings> {
    const saved = localStorage.getItem('rhythm_website_ui_settings');
    const localFallback: WebsiteUISettings = saved
      ? { ...DEFAULT_WEBSITE_UI_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_WEBSITE_UI_SETTINGS;

    if (!isSupabaseConfigured()) {
      return localFallback;
    }

    try {
      const { data, error } = await supabase
        .from('website_ui_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return { ...DEFAULT_WEBSITE_UI_SETTINGS, ...data };
      }
    } catch (err) {
      console.warn('Error reading website UI settings from Supabase:', err);
    }
    return localFallback;
  }

  static async updateWebsiteUISettings(settings: Partial<WebsiteUISettings>): Promise<WebsiteUISettings> {
    const localSaved: WebsiteUISettings = {
      ...DEFAULT_WEBSITE_UI_SETTINGS,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem('rhythm_website_ui_settings', JSON.stringify(localSaved));
    } catch (_) {}

    if (isSupabaseConfigured()) {
      try {
        const existing = await this.getWebsiteUISettings();
        if (existing.id && isValidUUID(existing.id)) {
          let updatePayload: any = {
            ...settings,
            updated_at: new Date().toISOString(),
          };
          let { data, error } = await supabase
            .from('website_ui_settings')
            .update(updatePayload)
            .eq('id', existing.id)
            .select()
            .single();

          if (error && error.message?.includes('logo_height')) {
            delete updatePayload.logo_height;
            const retry = await supabase
              .from('website_ui_settings')
              .update(updatePayload)
              .eq('id', existing.id)
              .select()
              .single();
            data = retry.data;
            error = retry.error;
          }

          if (!error && data) {
            const merged = { ...localSaved, ...data, logo_height: localSaved.logo_height };
            localStorage.setItem('rhythm_website_ui_settings', JSON.stringify(merged));
            return merged;
          }
        } else {
          let insertPayload: any = { ...localSaved };
          let { data, error } = await supabase
            .from('website_ui_settings')
            .insert(insertPayload)
            .select()
            .single();

          if (error && error.message?.includes('logo_height')) {
            delete insertPayload.logo_height;
            const retry = await supabase
              .from('website_ui_settings')
              .insert(insertPayload)
              .select()
              .single();
            data = retry.data;
            error = retry.error;
          }

          if (!error && data) {
            const merged = { ...localSaved, ...data, logo_height: localSaved.logo_height };
            localStorage.setItem('rhythm_website_ui_settings', JSON.stringify(merged));
            return merged;
          }
        }
      } catch (err) {
        console.warn('Supabase website UI settings save failed, using local:', err);
      }
    }

    return localSaved;
  }
}
