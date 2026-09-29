import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadImageWithFallback } from '../utils/imageUpload';
import { isValidUUID, generateUUID } from '../utils/uuid';
import { HospitalService } from '../types/database';

const LOCAL_STORAGE_KEY = 'rhythm_local_services';

export const DEFAULT_SERVICES: HospitalService[] = [
  {
    id: 's1b2c3d4-0001-4000-8000-000000000001',
    name: '24x7 Emergency & Trauma Care',
    slug: 'emergency-trauma',
    description: 'Round-the-clock emergency medical services, rapid triage, trauma resuscitation and critical care response.',
    icon: 'Ambulance',
    image_url: null,
    status: 'active',
    display_order: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 's1b2c3d4-0002-4000-8000-000000000002',
    name: 'Intensive Care Unit (ICU / ICCU)',
    slug: 'intensive-care-unit',
    description: 'Advanced hemodynamic monitoring, multi-organ support, invasive ventilators, and critical care specialists.',
    icon: 'Activity',
    image_url: null,
    status: 'active',
    display_order: 2,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

function getCachedServices(): HospitalService[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedServices(list: HospitalService[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function notifyServicesChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent('rhythm_services_changed'));
  } catch (_) {}
}

export class ServiceService {
  static async getActiveServices(): Promise<HospitalService[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });

        if (!error && data) {
          saveCachedServices(data);
          return data;
        }
      } catch (err) {
        console.warn('Error fetching active services from Supabase:', err);
      }
    }

    const cached = getCachedServices();
    const fallback = cached.length > 0 ? cached : DEFAULT_SERVICES;
    return fallback
      .filter((s) => s.status === 'active')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  static async getAllServicesAdmin(): Promise<HospitalService[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data) {
          saveCachedServices(data);
          return data;
        }
        if (error) {
          console.warn('Error fetching admin services from Supabase:', error);
        }
      } catch (err) {
        console.warn('Error fetching admin services from Supabase:', err);
      }
    }

    const cached = getCachedServices();
    const fallback = cached.length > 0 ? cached : DEFAULT_SERVICES;
    return fallback.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  static async createService(serviceData: Partial<HospitalService>): Promise<HospitalService> {
    const slug =
      serviceData.slug ||
      serviceData.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

    const newRecord: HospitalService = {
      id: isValidUUID(serviceData.id) ? serviceData.id! : generateUUID(),
      name: serviceData.name || '',
      slug,
      description: serviceData.description || null,
      icon: serviceData.icon || null,
      image_url: serviceData.image_url || null,
      status: serviceData.status || 'active',
      display_order: Number(serviceData.display_order || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .insert(newRecord)
          .select()
          .single();

        if (error) {
          throw new Error(error.message || 'Database insert failed');
        }

        if (data) {
          const cached = getCachedServices();
          saveCachedServices([data, ...cached.filter((s) => s.id !== data.id)]);
          notifyServicesChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase service create error:', err);
        throw err;
      }
    }

    const cached = getCachedServices();
    saveCachedServices([newRecord, ...cached.filter((s) => s.id !== newRecord.id)]);
    notifyServicesChanged();
    return newRecord;
  }

  static async updateService(
    id: string,
    serviceData: Partial<HospitalService>
  ): Promise<HospitalService> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('services')
          .update({
            ...serviceData,
            display_order:
              serviceData.display_order !== undefined
                ? Number(serviceData.display_order)
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
          const cached = getCachedServices();
          saveCachedServices([data, ...cached.filter((s) => s.id !== id)]);
          notifyServicesChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase service update error:', err);
        throw err;
      }
    }

    const cached = getCachedServices();
    const existing = cached.find((s) => s.id === id);
    const merged: HospitalService = {
      id,
      name: serviceData.name ?? existing?.name ?? '',
      slug: serviceData.slug ?? existing?.slug ?? '',
      description:
        serviceData.description !== undefined
          ? serviceData.description
          : existing?.description || null,
      icon: serviceData.icon !== undefined ? serviceData.icon : existing?.icon || null,
      image_url:
        serviceData.image_url !== undefined
          ? serviceData.image_url
          : existing?.image_url || null,
      status: serviceData.status ?? existing?.status ?? 'active',
      display_order:
        serviceData.display_order !== undefined
          ? Number(serviceData.display_order)
          : existing?.display_order || 0,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveCachedServices([merged, ...cached.filter((s) => s.id !== id)]);
    notifyServicesChanged();
    return merged;
  }

  static async deleteService(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) {
          throw new Error(error.message || 'Database delete failed');
        }
      } catch (err: any) {
        console.error('Supabase service delete error:', err);
        throw err;
      }
    }

    const cached = getCachedServices();
    saveCachedServices(cached.filter((s) => s.id !== id));
    notifyServicesChanged();
  }

  static async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `service_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `services/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }
}
