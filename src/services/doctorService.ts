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
  {
    id: 'd1e2f3a4-0003-4000-8000-000000000003',
    full_name: 'Dr. Amit Verma',
    slug: 'dr-amit-verma',
    photo_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    speciality_id: 'a1b2c3d4-0003-4000-8000-000000000003',
    qualification: 'MBBS, MD (Pediatrics), DCH, FIAP',
    experience_years: 12,
    consultation_fee: 600,
    bio: 'Compassionate pediatrician focusing on newborn and infant care, pediatric developmental milestones, vaccination schedules, and acute childhood illnesses.',
    phone: '+91 98250 34567',
    email: 'dr.amit@rhythmmedicity.com',
    availability_status: 'available',
    status: 'active',
    registration_number: 'G-18920',
    languages: ['English', 'Hindi', 'Gujarati'],
    clinic_room: 'OPD Chamber 108 (Pediatrics Wing)',
    consultation_duration: 15,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_time_start: '09:30',
    available_time_end: '17:00',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'd1e2f3a4-0004-4000-8000-000000000004',
    full_name: 'Dr. Sneha Mehta',
    slug: 'dr-sneha-mehta',
    photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    speciality_id: 'a1b2c3d4-0004-4000-8000-000000000004',
    qualification: 'MBBS, MD, DM (Neurology), Gold Medalist',
    experience_years: 15,
    consultation_fee: 900,
    bio: 'Distinguished Neurologist offering clinical treatment for stroke rehabilitation, chronic migraine, epilepsy syndromes, Parkinsonism, and peripheral nerve disorders.',
    phone: '+91 98250 45678',
    email: 'dr.sneha@rhythmmedicity.com',
    availability_status: 'available',
    status: 'active',
    registration_number: 'G-17382',
    languages: ['English', 'Hindi', 'Gujarati'],
    clinic_room: 'OPD Chamber 201 (Second Floor)',
    consultation_duration: 20,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_time_start: '11:00',
    available_time_end: '18:00',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'd1e2f3a4-0005-4000-8000-000000000005',
    full_name: 'Dr. Vikram Singh',
    slug: 'dr-vikram-singh',
    photo_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
    speciality_id: 'a1b2c3d4-0005-4000-8000-000000000005',
    qualification: 'MBBS, MD (Internal Medicine), FACP',
    experience_years: 18,
    consultation_fee: 500,
    bio: 'Lead Consultant Physician specialized in comprehensive adult care, diabetic management, hypertension, infectious disease treatment, and geriatric wellness.',
    phone: '+91 98250 56789',
    email: 'dr.vikram@rhythmmedicity.com',
    availability_status: 'available',
    status: 'active',
    registration_number: 'G-12490',
    languages: ['English', 'Hindi', 'Gujarati'],
    clinic_room: 'OPD Chamber 101 (Ground Floor)',
    consultation_duration: 15,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_time_start: '09:00',
    available_time_end: '17:00',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'd1e2f3a4-0006-4000-8000-000000000006',
    full_name: 'Dr. Ananya Desai',
    slug: 'dr-ananya-desai',
    photo_url: 'https://images.unsplash.com/photo-1594824813583-0570b240f925?auto=format&fit=crop&q=80&w=400',
    speciality_id: 'a1b2c3d4-0007-4000-8000-000000000007',
    qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    experience_years: 10,
    consultation_fee: 700,
    bio: 'Expert Dermatologist and Cosmetologist providing modern clinical dermatology, acne therapies, allergic skin conditions, hair restoration, and aesthetic solutions.',
    phone: '+91 98250 67890',
    email: 'dr.ananya@rhythmmedicity.com',
    availability_status: 'available',
    status: 'active',
    registration_number: 'G-23841',
    languages: ['English', 'Hindi', 'Gujarati'],
    clinic_room: 'OPD Chamber 204 (Second Floor)',
    consultation_duration: 15,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_time_start: '10:00',
    available_time_end: '15:00',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

function getLocalDoctors(): Doctor[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      saveLocalDoctors(DEFAULT_DOCTORS);
      return DEFAULT_DOCTORS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DOCTORS;
  } catch {
    return DEFAULT_DOCTORS;
  }
}

function saveLocalDoctors(list: Doctor[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
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

function mergeWithLocal(remoteList: Doctor[]): Doctor[] {
  const localList = getLocalDoctors();
  const map = new Map<string, Doctor>();

  for (const item of remoteList) {
    map.set(item.id, item);
  }

  for (const item of localList) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

export class DoctorService {
  static async getActiveDoctors(specialityId?: string): Promise<Doctor[]> {
    let remote: Doctor[] = [];
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
          remote = data;
        }
      } catch (err) {
        console.warn('Error fetching active doctors from Supabase:', err);
      }
    }

    let merged = mergeWithLocal(remote).filter((d) => d.status?.toLowerCase() === 'active');
    if (specialityId) {
      merged = merged.filter((d) => d.speciality_id === specialityId);
    }
    const withSpecialities = await attachSpecialities(merged);
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

    // 1. Check local storage
    const allLocal = getLocalDoctors();
    const local = allLocal.find(
      (d) => d.id === identifier || (d.slug && d.slug.toLowerCase() === clean)
    );
    if (local) {
      const withSpec = await attachSpecialities([local]);
      return withSpec[0] || local;
    }

    // 2. Check defaults
    const defaultDoc = DEFAULT_DOCTORS.find(
      (d) => d.id === identifier || (d.slug && d.slug.toLowerCase() === clean)
    );
    if (defaultDoc) {
      const withSpec = await attachSpecialities([defaultDoc]);
      return withSpec[0] || defaultDoc;
    }

    // 3. Check Supabase
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      // Check by UUID if valid UUID format
      if (isValidUUID(identifier)) {
        const { data, error } = await supabase
          .from('doctors')
          .select('*, speciality:specialities(*)')
          .eq('id', identifier)
          .maybeSingle();

        if (!error && data) return data;
      }

      // Check by slug
      const { data, error } = await supabase
        .from('doctors')
        .select('*, speciality:specialities(*)')
        .eq('slug', clean)
        .maybeSingle();

      if (!error && data) return data;
      return null;
    } catch {
      return null;
    }
  }

  static async getAllDoctorsAdmin(): Promise<Doctor[]> {
    let remote: Doctor[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*, speciality:specialities(*)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          remote = data;
        }
      } catch (err) {
        console.warn('Error fetching admin doctors from Supabase:', err);
      }
    }

    const merged = mergeWithLocal(remote);
    const withSpecialities = await attachSpecialities(merged);
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

        if (!error && data) {
          const locals = getLocalDoctors();
          saveLocalDoctors([data, ...locals.filter((d) => d.id !== data.id)]);
          await AuditService.logAction('CREATE_DOCTOR', 'doctor', data.id, { name: data.full_name, speciality: data.speciality_id });
          return data;
        }
        console.warn('Supabase doctor create failed, saving locally:', error);
      } catch (err) {
        console.warn('Supabase doctor create threw, saving locally:', err);
      }
    }

    const locals = getLocalDoctors();
    saveLocalDoctors([newRecord, ...locals.filter((d) => d.id !== newRecord.id)]);
    const withSpec = await attachSpecialities([newRecord]);
    await AuditService.logAction('CREATE_DOCTOR', 'doctor', newRecord.id, { name: newRecord.full_name, speciality: newRecord.speciality_id });
    return withSpec[0] || newRecord;
  }

  static async updateDoctor(id: string, doctorData: Partial<Doctor>): Promise<Doctor> {
    let updatedRecord: Doctor | null = null;

    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const updatePayload: any = {
          ...doctorData,
          consultation_fee: doctorData.consultation_fee !== undefined ? Number(doctorData.consultation_fee) : undefined,
          experience_years: doctorData.experience_years !== undefined ? Number(doctorData.experience_years) : undefined,
          consultation_duration: doctorData.consultation_duration !== undefined ? Number(doctorData.consultation_duration) : undefined,
          updated_at: new Date().toISOString(),
        };

        if ('speciality_id' in doctorData) {
          updatePayload.speciality_id = sanitizeUUID(doctorData.speciality_id);
        }

        const { data, error } = await supabase
          .from('doctors')
          .update(updatePayload)
          .eq('id', id)
          .select('*, speciality:specialities(*)')
          .single();

        if (!error && data) {
          updatedRecord = data;
        } else {
          console.warn('Supabase doctor update error, saving locally:', error);
        }
      } catch (err) {
        console.warn('Supabase doctor update threw, saving locally:', err);
      }
    }

    const locals = getLocalDoctors();
    const existing = locals.find((d) => d.id === id);
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
      ...(updatedRecord || {}),
    };

    saveLocalDoctors([merged, ...locals.filter((d) => d.id !== id)]);
    const withSpec = await attachSpecialities([updatedRecord || merged]);
    await AuditService.logAction('UPDATE_DOCTOR', 'doctor', id, { name: merged.full_name, changes: Object.keys(doctorData) });
    return withSpec[0] || (updatedRecord || merged);
  }

  static async deleteDoctor(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        await supabase.from('doctors').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete doctor error:', err);
      }
    }

    const locals = getLocalDoctors();
    const docToDelete = locals.find((d) => d.id === id);
    saveLocalDoctors(locals.filter((d) => d.id !== id));
    await AuditService.logAction('DELETE_DOCTOR', 'doctor', id, { name: docToDelete?.full_name });
  }


  static async uploadPhoto(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `doctor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `doctors/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }
}
