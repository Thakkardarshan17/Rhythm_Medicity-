import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  HospitalSettings,
  AppointmentLetterSettings,
  HospitalStats,
  WebsiteUISettings,
  DilloSettings,
} from '../types/database';
import {
  SettingsService,
  DEFAULT_HOSPITAL_SETTINGS,
  DEFAULT_LETTER_SETTINGS,
  DEFAULT_HOSPITAL_STATS,
  DEFAULT_WEBSITE_UI_SETTINGS,
} from '../services/settingsService';
import { DilloService, DEFAULT_DILLO_SETTINGS } from '../services/dilloService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SettingsContextType {
  hospitalSettings: HospitalSettings;
  letterSettings: AppointmentLetterSettings;
  hospitalStats: HospitalStats;
  websiteUISettings: WebsiteUISettings;
  dilloSettings: DilloSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateStatsInMemory: (newStats: HospitalStats) => void;
  updateUISettingsInMemory: (newUI: WebsiteUISettings) => void;
  updateDilloSettingsInMemory: (newDillo: DilloSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(DEFAULT_HOSPITAL_SETTINGS);
  const [letterSettings, setLetterSettings] = useState<AppointmentLetterSettings>(DEFAULT_LETTER_SETTINGS);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats>(DEFAULT_HOSPITAL_STATS);
  const [websiteUISettings, setWebsiteUISettings] = useState<WebsiteUISettings>(DEFAULT_WEBSITE_UI_SETTINGS);
  const [dilloSettings, setDilloSettings] = useState<DilloSettings>(DilloService.getSettings());
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const [hSettings, lSettings, stats, ui] = await Promise.all([
        SettingsService.getHospitalSettings(),
        SettingsService.getAppointmentLetterSettings(),
        SettingsService.getHospitalStats(),
        SettingsService.getWebsiteUISettings(),
      ]);
      setHospitalSettings(hSettings);
      setLetterSettings(lSettings);
      setHospitalStats(stats);
      setWebsiteUISettings(ui);
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Supabase Realtime subscriptions
    if (isSupabaseConfigured()) {
      const hospitalSub = supabase
        .channel('hospital_settings_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'hospital_settings' },
          (payload) => {
            if (payload.new) {
              setHospitalSettings(payload.new as HospitalSettings);
            }
          }
        )
        .subscribe();

      const letterSub = supabase
        .channel('letter_settings_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointment_letter_settings' },
          (payload) => {
            if (payload.new) {
              setLetterSettings(payload.new as AppointmentLetterSettings);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(hospitalSub);
        supabase.removeChannel(letterSub);
      };
    }
  }, []);

  // Sync Dynamic CSS variables and Document meta when websiteUISettings change
  useEffect(() => {
    if (websiteUISettings) {
      if (websiteUISettings.website_title) {
        document.title = websiteUISettings.website_title;
      }
      const root = document.documentElement;
      if (websiteUISettings.primary_color) {
        root.style.setProperty('--color-primary', websiteUISettings.primary_color);
      }
      if (websiteUISettings.secondary_color) {
        root.style.setProperty('--color-secondary', websiteUISettings.secondary_color);
      }
      if (websiteUISettings.accent_color) {
        root.style.setProperty('--color-accent', websiteUISettings.accent_color);
      }
      if (websiteUISettings.button_color) {
        root.style.setProperty('--color-button', websiteUISettings.button_color);
      }

      // Update favicon if provided
      if (websiteUISettings.favicon_url) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) {
          link.href = websiteUISettings.favicon_url;
        }
      }
    }
  }, [websiteUISettings]);

  const updateStatsInMemory = (newStats: HospitalStats) => {
    setHospitalStats(newStats);
  };

  const updateUISettingsInMemory = (newUI: WebsiteUISettings) => {
    setWebsiteUISettings(newUI);
  };

  const updateDilloSettingsInMemory = (newDillo: DilloSettings) => {
    setDilloSettings(newDillo);
    DilloService.saveSettings(newDillo);
  };

  return (
    <SettingsContext.Provider
      value={{
        hospitalSettings,
        letterSettings,
        hospitalStats,
        websiteUISettings,
        dilloSettings,
        loading,
        refreshSettings: fetchSettings,
        updateStatsInMemory,
        updateUISettingsInMemory,
        updateDilloSettingsInMemory,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
