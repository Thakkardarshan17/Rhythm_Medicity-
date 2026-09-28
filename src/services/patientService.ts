import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PatientProfile } from '../types/database';

export interface AdminPatientListItem extends PatientProfile {
  appointment_count?: number;
  last_appointment_date?: string;
}

export class PatientService {
  static async getPatientProfile(authUserId: string): Promise<PatientProfile | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching patient profile:', error);
      return null;
    }
    let result: PatientProfile | null = data;

    // Merge any locally saved fields (photo_url, dob, status) that might be missing from Supabase schema
    try {
      const localRaw = localStorage.getItem('rhythm_patient_profile');
      if (localRaw) {
        const local = JSON.parse(localRaw);
        if (local && (local.auth_user_id === authUserId || local.id === authUserId)) {
          result = {
            ...local,
            ...(result || {}),
            photo_url: result?.photo_url || local.photo_url || null,
            dob: result?.dob || local.dob || null,
            status: result?.status || local.status || 'active',
          };
        }
      }
    } catch (_) {}

    return result;
  }

  static async createOrUpdateProfile(profileData: Partial<PatientProfile>): Promise<PatientProfile> {
    if (!profileData.auth_user_id) {
      throw new Error('User ID is required.');
    }

    // Always update local session profile cache so changes like photo & dob are immediately available
    try {
      const localRaw = localStorage.getItem('rhythm_patient_profile');
      const prev = localRaw ? JSON.parse(localRaw) : {};
      const merged = {
        ...prev,
        ...profileData,
        age: profileData.age !== undefined && profileData.age !== null ? Number(profileData.age) : prev.age,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('rhythm_patient_profile', JSON.stringify(merged));
    } catch (_) {}

    if (!isSupabaseConfigured()) {
      const localRaw = localStorage.getItem('rhythm_patient_profile');
      return localRaw ? JSON.parse(localRaw) : (profileData as PatientProfile);
    }

    const existing = await this.getPatientProfile(profileData.auth_user_id);
    let payload: Record<string, any> = {
      ...profileData,
      age: profileData.age !== undefined && profileData.age !== null ? Number(profileData.age) : undefined,
      updated_at: new Date().toISOString(),
    };

    // Auto-retry loop that removes any columns missing in the remote Supabase schema cache
    let lastError: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        if (existing && existing.id) {
          const { data, error } = await supabase
            .from('patient_profiles')
            .update(payload)
            .eq('auth_user_id', profileData.auth_user_id)
            .select()
            .single();

          if (error) throw error;
          
          // Re-attach any client fields (photo_url, dob) stripped for schema compatibility
          return {
            ...profileData,
            ...(data || {}),
            photo_url: profileData.photo_url || data?.photo_url,
            dob: profileData.dob || data?.dob,
          } as PatientProfile;
        } else {
          const { data, error } = await supabase
            .from('patient_profiles')
            .insert(payload)
            .select()
            .single();

          if (error) throw error;

          return {
            ...profileData,
            ...(data || {}),
            photo_url: profileData.photo_url || data?.photo_url,
            dob: profileData.dob || data?.dob,
          } as PatientProfile;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || '').toLowerCase();
        
        // Match schema cache error: "Could not find the 'xyz' column of 'patient_profiles' in the schema cache"
        const match = errMsg.match(/could not find the '([^']+)' column/i) || errMsg.match(/column "?([^"\s]+)"? of relation/i);
        if (match && match[1]) {
          const missingCol = match[1];
          // Delete from payload and retry
          delete payload[missingCol];
          continue;
        }

        // If unknown error, break out
        break;
      }
    }

    // If Supabase update failed despite retries, gracefully fallback to local cache
    console.warn('Supabase patient_profiles sync warning:', lastError?.message);
    const localRaw = localStorage.getItem('rhythm_patient_profile');
    if (localRaw) {
      return JSON.parse(localRaw);
    }
    return profileData as PatientProfile;
  }

  static async getAllPatientsAdmin(search?: string): Promise<AdminPatientListItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('patient_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching patients for admin:', error);
      throw error;
    }

    // Also fetch appointment stats for each patient
    const patients = data || [];
    const enrichedPatients: AdminPatientListItem[] = await Promise.all(
      patients.map(async (p) => {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_user_id', p.auth_user_id);

        const { data: lastApt } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('patient_user_id', p.auth_user_id)
          .order('appointment_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...p,
          appointment_count: count || 0,
          last_appointment_date: lastApt?.appointment_date || undefined,
        };
      })
    );

    return enrichedPatients;
  }
}
