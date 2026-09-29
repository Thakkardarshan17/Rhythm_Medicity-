import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadImageWithFallback } from '../utils/imageUpload';
import { isValidUUID, sanitizeUUID, generateUUID } from '../utils/uuid';
import { Doctor } from '../types/database';
import { SpecialityService } from './specialityService';
import { AuditService } from './auditService';

const LOCAL_STORAGE_KEY = 'rhythm_local_doctors';

export const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: 'd1e2f3a4-0001-4000-8000-000000000001',
    full_name: 'Dr. Rajesh Sharma',
    slug: 'dr-rajesh-sharma',
    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    speciality_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    qualification: 'MBBS, MD, DM (Cardiology), FACC',
    experience_years: 16,
    consultation_fee: 800,
    bio: 'Senior Interventional Cardiologist specializing in preventive cardiac screening, coronary interventions, angiography, 2D Echocardiography, and complex clinical cardiology.',
    phone: '+91 98250 12345',
    email: 'dr.sharma@rhythmmedicity.com',
    availability_status: 'available',
    status: 'active',
    registration_number: 'G-14285',
    languages: ['English', 'Hindi', 'Gujarati'],
    clinic_room: 'OPD Chamber 102 (First Floor)',
    consultation_duration: 15,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_time_start: '09:00',
    available_time_end: '14:00',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'd1e2f3a4-0002-4000-8000-000000000002',
    full_name: 'Dr. Priya Patel',
    slug: 'dr-priya-patel',
    photo_url: 'https://images.unsplash.com/photo-1594824813583-0570b240f925?auto=format&fit=crop&q=80&w=400',
    speciality_id: 'a1b2c3d4-0002-4000-8000-000000000002',
    qualification: 'MS (Orthopedics), Joint Replacement Fellow (Germany)',
    experience_years: 14,
    consultation_fee: 750,
    bio: 'Renowned Orthopedic Surgeon with extensive expertise in total knee and hip replacement, robotic arthroscopy, sports trauma, and complex fracture reconstructive procedures.',
    phone: '+91 98250 23456',
    email: 'dr.priya@rhythmmedicity.com',
    availability_status: 'available',
    status: 'active',
    registration_number: 'G-21049',
    languages: ['English', 'Hindi', 'Gujarati'],
    clinic_room: 'OPD Chamber 105 (First Floor)',
    consultation_duration: 20,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    available_time_start: '10:00',
    available_time_end: '16:00',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

function getCachedDoctors(): Doctor[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedDoctors(list: Doctor[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function notifyDoctorsChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent('rhythm_doctors_changed'));
  } catch (_) {}
}

async function attachSpecialities(doctors: Doctor[]): Promise<Doctor[]> {
  try {
    const specialities = await SpecialityService.getAllSpecialitiesAdmin();
    const specMap = new Map(specialities.map((s) => [s.id, s]));

    return doctors.map((doc) => {
      if (!doc.speciality && doc.speciality_id && specMap.has(doc.speciality_id)) {
        return {
          ...doc,
          speciality: specMap.get(doc.speciality_id),
        };
      }
      return doc;
    });
  } catch {
    return doctors;
  }
}

export class DoctorService {
  /**
   * Get all active doctors for public directory
   * Uses live Supabase as source of truth.
   */
  static async getActiveDoctors(specialityId?: string): Promise<Doctor[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('doctors')
          .select('*, speciality:specialities(*)')
          .eq('status', 'active')
          .order('experience_years', { ascending: false });

        if (specialityId && isValidUUID(specialityId)) {
          query = query.eq('speciality_id', specialityId);
        }

        const { data, error } = await query;
        if (!error && data) {
          saveCachedDoctors(data);
          return data;
        }
      } catch (err) {
        console.warn('Error fetching active doctors from Supabase:', err);
      }
    }

    // Fallback only if offline or Supabase fails
    const cached = getCachedDoctors();
    let fallback = cached.length > 0 ? cached : DEFAULT_DOCTORS;
    let filtered = fallback.filter((d) => d.status?.toLowerCase() === 'active');
    if (specialityId) {
      filtered = filtered.filter((d) => d.speciality_id === specialityId);
    }
    const withSpecialities = await attachSpecialities(filtered);
    return withSpecialities.sort((a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0));
  }

  static async getDoctorById(id: string): Promise<Doctor | null> {
    return this.getDoctorBySlugOrId(id);
  }

  static async getDoctorBySlug(slug: string): Promise<Doctor | null> {
    return this.getDoctorBySlugOrId(slug);
  }

  /**
   * Look up a doctor by either unique database ID or slug
   */
  static async getDoctorBySlugOrId(identifier: string): Promise<Doctor | null> {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();

    // 1. Check live database first
    if (isSupabaseConfigured()) {
      try {
        if (isValidUUID(identifier)) {
          const { data, error } = await supabase
            .from('doctors')
            .select('*, speciality:specialities(*)')
            .eq('id', identifier)
            .maybeSingle();

          if (!error && data) return data;
        }

        const { data, error } = await supabase
          .from('doctors')
          .select('*, speciality:specialities(*)')
          .eq('slug', clean)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Doctor lookup error in Supabase:', err);
      }
    }

    // 2. Check cached doctors
    const cached = getCachedDoctors();
    const local = cached.find(
      (d) => d.id === identifier || (d.slug && d.slug.toLowerCase() === clean)
    );
    if (local) {
      const withSpec = await attachSpecialities([local]);
      return withSpec[0] || local;
    }

    // 3. Fallback default
    const defaultDoc = DEFAULT_DOCTORS.find(
      (d) => d.id === identifier || (d.slug && d.slug.toLowerCase() === clean)
    );
    if (defaultDoc) {
      const withSpec = await attachSpecialities([defaultDoc]);
      return withSpec[0] || defaultDoc;
    }

    return null;
  }

  /**
   * Fetch all doctors for Admin console directly from Supabase
   */
  static async getAllDoctorsAdmin(): Promise<Doctor[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*, speciality:specialities(*)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          saveCachedDoctors(data);
          return data;
        }
        if (error) {
          console.warn('Error fetching admin doctors from Supabase:', error);
        }
      } catch (err) {
        console.warn('Error fetching admin doctors from Supabase:', err);
      }
    }

    const cached = getCachedDoctors();
    const fallback = cached.length > 0 ? cached : DEFAULT_DOCTORS;
    const withSpecialities = await attachSpecialities(fallback);
    return withSpecialities.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }

  static generateDoctorSlug(fullName: string): string {
    if (!fullName) return 'doctor';
    return fullName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static async createDoctor(doctorData: Partial<Doctor>): Promise<Doctor> {
    const slug =
      doctorData.slug ||
      this.generateDoctorSlug(doctorData.full_name || 'doctor');

    const newRecord: Doctor = {
      id: isValidUUID(doctorData.id) ? doctorData.id! : generateUUID(),
      full_name: doctorData.full_name || '',
      slug,
      photo_url: doctorData.photo_url || null,
      speciality_id: sanitizeUUID(doctorData.speciality_id),
      qualification: doctorData.qualification || '',
      experience_years: Number(doctorData.experience_years || 0),
      consultation_fee: Number(doctorData.consultation_fee || 0),
      bio: doctorData.bio || null,
      available_days: doctorData.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      available_time_start: doctorData.available_time_start || '09:00',
      available_time_end: doctorData.available_time_end || '17:00',
      consultation_duration: Number(doctorData.consultation_duration || 15),
      phone: doctorData.phone || null,
      email: doctorData.email || null,
      availability_status: doctorData.availability_status || 'available',
      registration_number: doctorData.registration_number || null,
      languages: doctorData.languages || ['English', 'Hindi', 'Gujarati'],
      clinic_room: doctorData.clinic_room || null,
      status: doctorData.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const insertPayload: any = {
          ...newRecord,
          speciality_id: sanitizeUUID(newRecord.speciality_id),
        };

        const { data, error } = await supabase
          .from('doctors')
          .insert(insertPayload)
          .select('*, speciality:specialities(*)')
          .single();

        if (error) {
          throw new Error(error.message || 'Database insert failed');
        }

        if (data) {
          const cached = getCachedDoctors();
          saveCachedDoctors([data, ...cached.filter((d) => d.id !== data.id)]);
          await AuditService.logAction('CREATE_DOCTOR', 'doctor', data.id, { name: data.full_name, speciality: data.speciality_id });
          notifyDoctorsChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase doctor create failed:', err);
        throw err;
      }
    }

    const cached = getCachedDoctors();
    saveCachedDoctors([newRecord, ...cached.filter((d) => d.id !== newRecord.id)]);
    const withSpec = await attachSpecialities([newRecord]);
    await AuditService.logAction('CREATE_DOCTOR', 'doctor', newRecord.id, { name: newRecord.full_name, speciality: newRecord.speciality_id });
    notifyDoctorsChanged();
    return withSpec[0] || newRecord;
  }

  static async updateDoctor(id: string, doctorData: Partial<Doctor>): Promise<Doctor> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const updatePayload: any = {
          ...doctorData,
          updated_at: new Date().toISOString(),
        };

        if (doctorData.consultation_fee !== undefined) {
          updatePayload.consultation_fee = Number(doctorData.consultation_fee);
        }
        if (doctorData.experience_years !== undefined) {
          updatePayload.experience_years = Number(doctorData.experience_years);
        }
        if (doctorData.consultation_duration !== undefined) {
          updatePayload.consultation_duration = Number(doctorData.consultation_duration);
        }
        if ('speciality_id' in doctorData) {
          updatePayload.speciality_id = sanitizeUUID(doctorData.speciality_id);
        }

        const { data, error } = await supabase
          .from('doctors')
          .update(updatePayload)
          .eq('id', id)
          .select('*, speciality:specialities(*)')
          .single();

        if (error) {
          throw new Error(error.message || 'Database update failed');
        }

        if (data) {
          const cached = getCachedDoctors();
          saveCachedDoctors([data, ...cached.filter((d) => d.id !== id)]);
          await AuditService.logAction('UPDATE_DOCTOR', 'doctor', id, { name: data.full_name, changes: Object.keys(doctorData) });
          notifyDoctorsChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase doctor update error:', err);
        throw err;
      }
    }

    const cached = getCachedDoctors();
    const existing = cached.find((d) => d.id === id);
    const merged: Doctor = {
      id,
      full_name: doctorData.full_name ?? existing?.full_name ?? '',
      slug: doctorData.slug ?? existing?.slug ?? '',
      photo_url: doctorData.photo_url !== undefined ? doctorData.photo_url : (existing?.photo_url || null),
      speciality_id: 'speciality_id' in doctorData ? sanitizeUUID(doctorData.speciality_id) : (existing?.speciality_id || null),
      qualification: doctorData.qualification ?? existing?.qualification ?? '',
      experience_years: doctorData.experience_years !== undefined ? Number(doctorData.experience_years) : (existing?.experience_years || 0),
      consultation_fee: doctorData.consultation_fee !== undefined ? Number(doctorData.consultation_fee) : (existing?.consultation_fee || 0),
      bio: doctorData.bio !== undefined ? doctorData.bio : (existing?.bio || null),
      available_days: doctorData.available_days ?? existing?.available_days ?? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      available_time_start: doctorData.available_time_start ?? existing?.available_time_start ?? '09:00',
      available_time_end: doctorData.available_time_end ?? existing?.available_time_end ?? '17:00',
      consultation_duration: doctorData.consultation_duration !== undefined ? Number(doctorData.consultation_duration) : (existing?.consultation_duration || 15),
      phone: doctorData.phone !== undefined ? doctorData.phone : (existing?.phone || null),
      email: doctorData.email !== undefined ? doctorData.email : (existing?.email || null),
      availability_status: doctorData.availability_status ?? existing?.availability_status ?? 'available',
      registration_number: doctorData.registration_number !== undefined ? doctorData.registration_number : (existing?.registration_number || null),
      languages: doctorData.languages ?? existing?.languages ?? ['English', 'Hindi', 'Gujarati'],
      clinic_room: doctorData.clinic_room !== undefined ? doctorData.clinic_room : (existing?.clinic_room || null),
      status: doctorData.status ?? existing?.status ?? 'active',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveCachedDoctors([merged, ...cached.filter((d) => d.id !== id)]);
    const withSpec = await attachSpecialities([merged]);
    await AuditService.logAction('UPDATE_DOCTOR', 'doctor', id, { name: merged.full_name, changes: Object.keys(doctorData) });
    notifyDoctorsChanged();
    return withSpec[0] || merged;
  }

  static async deleteDoctor(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        // If there are appointments referencing this doctor, remove or reassign them cleanly to satisfy foreign key constraints
        const { error: apptError } = await supabase
          .from('appointments')
          .delete()
          .eq('doctor_id', id);

        if (apptError) {
          console.warn('Could not cascade-delete appointments:', apptError);
        }

        const { error } = await supabase.from('doctors').delete().eq('id', id);
        if (error) {
          throw new Error(error.message || 'Database deletion failed');
        }
      } catch (err: any) {
        console.error('Supabase delete doctor error:', err);
        throw err;
      }
    }

    const cached = getCachedDoctors();
    const docToDelete = cached.find((d) => d.id === id);
    saveCachedDoctors(cached.filter((d) => d.id !== id));
    await AuditService.logAction('DELETE_DOCTOR', 'doctor', id, { name: docToDelete?.full_name });
    notifyDoctorsChanged();
  }

  static async uploadPhoto(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `doctor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `doctors/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }
}
