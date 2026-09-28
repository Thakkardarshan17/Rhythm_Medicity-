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
  {
    id: 's1b2c3d4-0003-4000-8000-000000000003',
    name: 'Advanced Pathology & Diagnostics',
    slug: 'pathology-diagnostics',
    description: 'Fully automated biochemistry, hematology, microbiology, hormone assays, and rapid laboratory reporting.',
    icon: 'FlaskConical',
    image_url: null,
    status: 'active',
    display_order: 3,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 's1b2c3d4-0004-4000-8000-000000000004',
    name: 'Digital Radiology & CT Imaging',
    slug: 'radiology-imaging',
    description: 'High-resolution Multi-slice CT scan, digital X-Ray, high-definition ultrasonography, and color Doppler.',
    icon: 'Scan',
    image_url: null,
    status: 'active',
    display_order: 4,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 's1b2c3d4-0005-4000-8000-000000000005',
    name: 'In-House 24x7 Pharmacy',
    slug: 'pharmacy',
    description: 'Genuine prescription medications, life-saving critical drugs, surgical disposables, and cold-chain storage.',
    icon: 'Pill',
    image_url: null,
    status: 'active',
    display_order: 5,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 's1b2c3d4-0006-4000-8000-000000000006',
    name: 'Hemodialysis Unit',
    slug: 'dialysis-unit',
    description: 'State-of-the-art dialysis stations with advanced RO water purification for acute and maintenance renal care.',
    icon: 'Droplets',
    image_url: null,
    status: 'active',
    display_order: 6,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

function getLocalServices(): HospitalService[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      saveLocalServices(DEFAULT_SERVICES);
      return DEFAULT_SERVICES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}

function saveLocalServices(list: HospitalService[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function mergeWithLocal(remoteList: HospitalService[]): HospitalService[] {
  const localList = getLocalServices();
  const map = new Map<string, HospitalService>();

  for (const item of remoteList) {
    map.set(item.id, item);
  }

  for (const item of localList) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

export class ServiceService {
  static async getActiveServices(): Promise<HospitalService[]> {
    let remote: HospitalService[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });

        if (!error && data) {
          remote = data;
        }
      } catch (err) {
        console.warn('Error fetching active services from Supabase:', err);
      }
    }

    const merged = mergeWithLocal(remote).filter((s) => s.status === 'active');
    return merged.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  static async getAllServicesAdmin(): Promise<HospitalService[]> {
    let remote: HospitalService[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data) {
          remote = data;
        }
      } catch (err) {
        console.warn('Error fetching admin services from Supabase:', err);
      }
    }

    const merged = mergeWithLocal(remote);
    return merged.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
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
        const payload = { ...newRecord };
        const { data, error } = await supabase
          .from('services')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          const locals = getLocalServices();
          saveLocalServices([data, ...locals.filter((s) => s.id !== data.id)]);
          return data;
        }
        console.warn('Supabase service create error, saving locally:', error);
      } catch (err) {
        console.warn('Supabase service create threw, saving locally:', err);
      }
    }

    const locals = getLocalServices();
    saveLocalServices([newRecord, ...locals.filter((s) => s.id !== newRecord.id)]);
    return newRecord;
  }

  static async updateService(id: string, serviceData: Partial<HospitalService>): Promise<HospitalService> {
    let updatedRecord: HospitalService | null = null;

    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('services')
          .update({
            ...serviceData,
            display_order:
              serviceData.display_order !== undefined ? Number(serviceData.display_order) : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          updatedRecord = data;
        } else {
          console.warn('Supabase service update error, saving locally:', error);
        }
      } catch (err) {
        console.warn('Supabase service update threw, saving locally:', err);
      }
    }

    const locals = getLocalServices();
    const existing = locals.find((s) => s.id === id);
    const merged: HospitalService = {
      id,
      name: serviceData.name ?? existing?.name ?? '',
      slug: serviceData.slug ?? existing?.slug ?? '',
      description: serviceData.description !== undefined ? serviceData.description : (existing?.description || null),
      icon: serviceData.icon !== undefined ? serviceData.icon : (existing?.icon || null),
      image_url: serviceData.image_url !== undefined ? serviceData.image_url : (existing?.image_url || null),
      status: serviceData.status ?? existing?.status ?? 'active',
      display_order: serviceData.display_order !== undefined ? Number(serviceData.display_order) : (existing?.display_order || 0),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(updatedRecord || {}),
    };

    saveLocalServices([merged, ...locals.filter((s) => s.id !== id)]);
    return updatedRecord || merged;
  }

  static async deleteService(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        await supabase.from('services').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase service delete error:', err);
      }
    }

    const locals = getLocalServices();
    saveLocalServices(locals.filter((s) => s.id !== id));
  }

  static async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `service_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `services/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }
}
