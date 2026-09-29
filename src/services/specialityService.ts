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
];

function getCachedSpecialities(): Speciality[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedSpecialities(list: Speciality[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function notifySpecialitiesChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent('rhythm_specialities_changed'));
  } catch (_) {}
}

export class SpecialityService {
  static async getActiveSpecialities(): Promise<Speciality[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('specialities')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });

        if (!error && data) {
          saveCachedSpecialities(data);
          return data;
        }
      } catch (err) {
        console.warn('Error fetching active specialities from Supabase:', err);
      }
    }

    const cached = getCachedSpecialities();
    const fallback = cached.length > 0 ? cached : DEFAULT_SPECIALITIES;
    return fallback
      .filter((s) => s.status === 'active')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  static async getSpecialityById(id: string): Promise<Speciality | null> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('specialities')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Speciality lookup by ID error:', err);
      }
    }

    const cached = getCachedSpecialities();
    const found = cached.find((s) => s.id === id);
    if (found) return found;

    return DEFAULT_SPECIALITIES.find((s) => s.id === id) || null;
  }

  static async getSpecialityBySlug(slug: string): Promise<Speciality | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('specialities')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Speciality lookup by slug error:', err);
      }
    }

    const cached = getCachedSpecialities();
    const found = cached.find((s) => s.slug === slug);
    if (found) return found;

    return DEFAULT_SPECIALITIES.find((s) => s.slug === slug) || null;
  }

  static async getAllSpecialitiesAdmin(): Promise<Speciality[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('specialities')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data) {
          saveCachedSpecialities(data);
          return data;
        }
        if (error) {
          console.warn('Error fetching admin specialities from Supabase:', error);
        }
      } catch (err) {
        console.warn('Error fetching admin specialities from Supabase:', err);
      }
    }

    const cached = getCachedSpecialities();
    const fallback = cached.length > 0 ? cached : DEFAULT_SPECIALITIES;
    return fallback.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
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
        const { data, error } = await supabase
          .from('specialities')
          .insert(newRecord)
          .select()
          .single();

        if (error) {
          throw new Error(error.message || 'Database insert failed');
        }

        if (data) {
          const cached = getCachedSpecialities();
          saveCachedSpecialities([data, ...cached.filter((s) => s.id !== data.id)]);
          notifySpecialitiesChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase speciality create error:', err);
        throw err;
      }
    }

    const cached = getCachedSpecialities();
    saveCachedSpecialities([newRecord, ...cached.filter((s) => s.id !== newRecord.id)]);
    notifySpecialitiesChanged();
    return newRecord;
  }

  static async updateSpeciality(
    id: string,
    specialityData: Partial<Speciality>
  ): Promise<Speciality> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('specialities')
          .update({
            ...specialityData,
            display_order:
              specialityData.display_order !== undefined
                ? Number(specialityData.display_order)
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
          const cached = getCachedSpecialities();
          saveCachedSpecialities([data, ...cached.filter((s) => s.id !== id)]);
          notifySpecialitiesChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase speciality update error:', err);
        throw err;
      }
    }

    const cached = getCachedSpecialities();
    const existing = cached.find((s) => s.id === id);
    const merged: Speciality = {
      id,
      name: specialityData.name ?? existing?.name ?? '',
      slug: specialityData.slug ?? existing?.slug ?? '',
      description:
        specialityData.description !== undefined
          ? specialityData.description
          : existing?.description || null,
      icon: specialityData.icon !== undefined ? specialityData.icon : existing?.icon || null,
      image_url:
        specialityData.image_url !== undefined
          ? specialityData.image_url
          : existing?.image_url || null,
      status: specialityData.status ?? existing?.status ?? 'active',
      display_order:
        specialityData.display_order !== undefined
          ? Number(specialityData.display_order)
          : existing?.display_order || 0,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveCachedSpecialities([merged, ...cached.filter((s) => s.id !== id)]);
    notifySpecialitiesChanged();
    return merged;
  }

  static async deleteSpeciality(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        // Set speciality_id to NULL on any linked doctors first
        await supabase
          .from('doctors')
          .update({ speciality_id: null })
          .eq('speciality_id', id);

        const { error } = await supabase.from('specialities').delete().eq('id', id);
        if (error) {
          throw new Error(error.message || 'Database delete failed');
        }
      } catch (err: any) {
        console.error('Supabase speciality delete error:', err);
        throw err;
      }
    }

    const cached = getCachedSpecialities();
    saveCachedSpecialities(cached.filter((s) => s.id !== id));
    notifySpecialitiesChanged();
  }

  static async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `speciality_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `specialities/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }
}
