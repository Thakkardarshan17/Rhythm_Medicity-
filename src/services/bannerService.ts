import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadImageWithFallback } from '../utils/imageUpload';
import { isValidUUID, generateUUID } from '../utils/uuid';
import { Banner, BannerCarouselSettings } from '../types/database';

const LOCAL_STORAGE_KEY = 'rhythm_local_banners';
const SETTINGS_LOCAL_STORAGE_KEY = 'rhythm_banner_carousel_settings';

export const DEFAULT_BANNER_CAROUSEL_SETTINGS: BannerCarouselSettings = {
  auto_scroll_interval: 5,
  auto_play: true,
  transition_animation: 'fade',
  transition_speed: 'normal',
  pause_on_hover: true,
  show_navigation_arrows: true,
  show_pagination_dots: false,
  updated_at: new Date().toISOString(),
};

function getCachedBanners(): Banner[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedBanners(list: Banner[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function notifyBannersChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent('rhythm_banners_changed'));
  } catch (_) {}
}

export class BannerService {
  /**
   * Get Carousel Auto-Scroll & Animation Settings
   */
  static async getBannerSettings(): Promise<BannerCarouselSettings> {
    try {
      const saved = localStorage.getItem(SETTINGS_LOCAL_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_BANNER_CAROUSEL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (_) {}

    return DEFAULT_BANNER_CAROUSEL_SETTINGS;
  }

  /**
   * Update Carousel Auto-Scroll & Animation Settings
   */
  static async updateBannerSettings(
    newSettings: Partial<BannerCarouselSettings>
  ): Promise<BannerCarouselSettings> {
    const current = await this.getBannerSettings();
    const updated: BannerCarouselSettings = {
      ...current,
      ...newSettings,
      updated_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SETTINGS_LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    notifyBannersChanged();
    return updated;
  }

  /**
   * Get only active banners for the public patient website
   */
  static async getActiveBanners(): Promise<Banner[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data) {
          saveCachedBanners(data);
          return data;
        }
      } catch (err) {
        console.warn('Error fetching active banners from Supabase:', err);
      }
    }

    const cached = getCachedBanners();
    return cached
      .filter((b) => b.status === 'active')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  /**
   * Get all banners for Admin management console
   */
  static async getAllBannersAdmin(): Promise<Banner[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data) {
          saveCachedBanners(data);
          return data;
        }
        if (error) {
          console.warn('Error fetching admin banners from Supabase:', error);
        }
      } catch (err) {
        console.warn('Error fetching admin banners from Supabase:', err);
      }
    }

    const cached = getCachedBanners();
    return cached.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  /**
   * Create new Banner
   */
  static async createBanner(bannerData: Partial<Banner>): Promise<Banner> {
    const newRecord: Banner = {
      id: isValidUUID(bannerData.id) ? bannerData.id! : generateUUID(),
      title: bannerData.title || '',
      subtitle: bannerData.subtitle || null,
      image_url: bannerData.image_url || '',
      cta_text: bannerData.cta_text || null,
      cta_link: bannerData.cta_link || null,
      status: bannerData.status || 'active',
      display_order: Number(bannerData.display_order || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('banners')
          .insert(newRecord)
          .select()
          .single();

        if (error) {
          throw new Error(error.message || 'Database insert failed');
        }

        if (data) {
          const cached = getCachedBanners();
          saveCachedBanners([data, ...cached.filter((b) => b.id !== data.id)]);
          notifyBannersChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase banner create failed:', err);
        throw err;
      }
    }

    const cached = getCachedBanners();
    saveCachedBanners([newRecord, ...cached.filter((b) => b.id !== newRecord.id)]);
    notifyBannersChanged();
    return newRecord;
  }

  /**
   * Update existing Banner
   */
  static async updateBanner(id: string, bannerData: Partial<Banner>): Promise<Banner> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('banners')
          .update({
            ...bannerData,
            display_order:
              bannerData.display_order !== undefined
                ? Number(bannerData.display_order)
                : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message || 'Database update failed');
        }

        if (data) {
          const cached = getCachedBanners();
          saveCachedBanners([data, ...cached.filter((b) => b.id !== id)]);
          notifyBannersChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase banner update error:', err);
        throw err;
      }
    }

    const cached = getCachedBanners();
    const existing = cached.find((b) => b.id === id);
    const merged: Banner = {
      id,
      title: bannerData.title ?? existing?.title ?? '',
      subtitle: bannerData.subtitle !== undefined ? bannerData.subtitle : existing?.subtitle || null,
      image_url: bannerData.image_url ?? existing?.image_url ?? '',
      cta_link: bannerData.cta_link !== undefined ? bannerData.cta_link : existing?.cta_link || null,
      cta_text: bannerData.cta_text !== undefined ? bannerData.cta_text : existing?.cta_text || null,
      status: bannerData.status ?? existing?.status ?? 'active',
      display_order:
        bannerData.display_order !== undefined
          ? Number(bannerData.display_order)
          : existing?.display_order || 0,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveCachedBanners([merged, ...cached.filter((b) => b.id !== id)]);
    notifyBannersChanged();
    return merged;
  }

  /**
   * Delete Banner
   */
  static async deleteBanner(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) {
          throw new Error(error.message || 'Database delete failed');
        }
      } catch (err: any) {
        console.error('Supabase banner delete error:', err);
        throw err;
      }
    }

    const cached = getCachedBanners();
    saveCachedBanners(cached.filter((b) => b.id !== id));
    notifyBannersChanged();
  }

  /**
   * Upload Banner Image
   */
  static async uploadBannerImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }
}
