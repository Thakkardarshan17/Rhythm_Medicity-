import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadImageWithFallback } from '../utils/imageUpload';
import { isValidUUID, generateUUID } from '../utils/uuid';
import { Speciality } from '../types/database';

const LOCAL_STORAGE_KEY = 'rhythm_local_specialities';

export const DEFAULT_SPECIALITIES: Speciality[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    name: 'Cardiology',
    slug: 'cardiology',
    description: 'Comprehensive cardiac evaluations, 2D Echocardiography, TMT, and preventive heart care.',
    icon: 'Heart',
    image_url: null,
    status: 'active',
    display_order: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    name: 'Orthopedics & Joint Care',
    slug: 'orthopedics',
    description: 'Advanced joint replacement, sports injury care, fracture management, and arthroscopy.',
    icon: 'Bone',
    image_url: null,
    status: 'active',
    display_order: 2,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    name: 'Pediatrics & Child Health',
    slug: 'pediatrics',
    description: 'Dedicated neonatal, infant, and adolescent medical care and immunization services.',
    icon: 'Baby',
    image_url: null,
    status: 'active',
    display_order: 3,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    name: 'Neurology & Brain Spine',
    slug: 'neurology',
    description: 'Specialized clinical assessment for stroke, epilepsy, headache, and nervous disorders.',
    icon: 'Brain',
    image_url: null,
    status: 'active',
    display_order: 4,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0005-4000-8000-000000000005',
    name: 'General Medicine',
    slug: 'general-medicine',
    description: 'Primary medical care, diabetes, hypertension, infectious diseases, and health checkups.',
    icon: 'Stethoscope',
    image_url: null,
    status: 'active',
    display_order: 5,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0006-4000-8000-000000000006',
    name: 'Gynecology & Obstetrics',
    slug: 'gynecology',
    description: 'Complete maternity, high-risk pregnancy care, and advanced laparoscopic surgery.',
    icon: 'Activity',
    image_url: null,
    status: 'active',
    display_order: 6,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0007-4000-8000-000000000007',
    name: 'Dermatology & Cosmetology',
    slug: 'dermatology',
    description: 'Evidence-based clinical dermatology, hair disorders, and modern laser skin care.',
    icon: 'Sparkles',
    image_url: null,
    status: 'active',
    display_order: 7,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0008-4000-8000-000000000008',
    name: 'ENT (Ear, Nose & Throat)',
    slug: 'ent',
    description: 'Comprehensive audiology, microscopic ear surgeries, and sinus interventions.',
    icon: 'Ear',
    image_url: null,
    status: 'active',
    display_order: 8,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

function getLocalSpecialities(): Speciality[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      saveLocalSpecialities(DEFAULT_SPECIALITIES);
      return DEFAULT_SPECIALITIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SPECIALITIES;
  } catch {
    return DEFAULT_SPECIALITIES;
  }
}

function saveLocalSpecialities(list: Speciality[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function mergeWithLocal(remoteList: Speciality[]): Speciality[] {
  const localList = getLocalSpecialities();
  const map = new Map<string, Speciality>();

  // Add remote items first
  for (const item of remoteList) {
    map.set(item.id, item);
  }

  // Merge/override with local items
  for (const item of localList) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

export class SpecialityService {
  static async getActiveSpecialities(): Promise<Speciality[]> {
    let remote: Speciality[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('specialities')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });

        if (!error && data) {
          remote = data;
        }
      } catch (err) {
        console.warn('Error fetching active specialities from Supabase:', err);
      }
    }

    const merged = mergeWithLocal(remote).filter((s) => s.status === 'active');
    return merged.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  static async getSpecialityById(id: string): Promise<Speciality | null> {
    const local = getLocalSpecialities().find((s) => s.id === id);
    if (local) return local;

    if (!isSupabaseConfigured() || !isValidUUID(id)) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('specialities')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  static async getSpecialityBySlug(slug: string): Promise<Speciality | null> {
    const local = getLocalSpecialities().find((s) => s.slug === slug);
    if (local) return local;

    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('specialities')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  static async getAllSpecialitiesAdmin(): Promise<Speciality[]> {
    let remote: Speciality[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('specialities')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data) {
          remote = data;
        }
      } catch (err) {
        console.warn('Error fetching admin specialities from Supabase:', err);
      }
    }

    const merged = mergeWithLocal(remote);
    return merged.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  static async createSpeciality(specialityData: Partial<Speciality>): Promise<Speciality> {
    const slug =
      specialityData.slug ||
      specialityData.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

    const newRecord: Speciality = {
      id: isValidUUID(specialityData.id) ? specialityData.id! : generateUUID(),
      name: specialityData.name || '',
      slug,
      description: specialityData.description || null,
      icon: specialityData.icon || null,
      image_url: specialityData.image_url || null,
      status: specialityData.status || 'active',
      display_order: Number(specialityData.display_order || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const payload = { ...newRecord };
        const { data, error } = await supabase
          .from('specialities')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          // Keep local cache synced
          const locals = getLocalSpecialities();
          saveLocalSpecialities([data, ...locals.filter((s) => s.id !== data.id)]);
          return data;
        }
        console.warn('Supabase RLS or insert error, saving locally:', error);
      } catch (err) {
        console.warn('Supabase request threw error, saving locally:', err);
      }
    }

    // Local resilience fallback
    const locals = getLocalSpecialities();
    saveLocalSpecialities([newRecord, ...locals.filter((s) => s.id !== newRecord.id)]);
    return newRecord;
  }

  static async updateSpeciality(id: string, specialityData: Partial<Speciality>): Promise<Speciality> {
    let updatedRecord: Speciality | null = null;

    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('specialities')
          .update({
            ...specialityData,
            display_order:
              specialityData.display_order !== undefined ? Number(specialityData.display_order) : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          updatedRecord = data;
        } else {
          console.warn('Supabase update returned error, applying local fallback:', error);
        }
      } catch (err) {
        console.warn('Supabase update failed, applying local fallback:', err);
      }
    }

    const locals = getLocalSpecialities();
    const existing = locals.find((s) => s.id === id);
    const merged: Speciality = {
      id,
      name: specialityData.name ?? existing?.name ?? '',
      slug: specialityData.slug ?? existing?.slug ?? '',
      description: specialityData.description !== undefined ? specialityData.description : (existing?.description || null),
      icon: specialityData.icon !== undefined ? specialityData.icon : (existing?.icon || null),
      image_url: specialityData.image_url !== undefined ? specialityData.image_url : (existing?.image_url || null),
      status: specialityData.status ?? existing?.status ?? 'active',
      display_order: specialityData.display_order !== undefined ? Number(specialityData.display_order) : (existing?.display_order || 0),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(updatedRecord || {}),
    };

    saveLocalSpecialities([merged, ...locals.filter((s) => s.id !== id)]);
    return updatedRecord || merged;
  }

  static async deleteSpeciality(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        await supabase.from('specialities').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    const locals = getLocalSpecialities();
    saveLocalSpecialities(locals.filter((s) => s.id !== id));
  }

  static async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `speciality_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `specialities/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }
}
