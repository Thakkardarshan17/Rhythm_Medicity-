import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isValidUUID, generateUUID } from '../utils/uuid';
import { PatientProfile } from '../types/database';
import { AppointmentService } from './appointmentService';
import { AuditService } from './auditService';
import { uploadImageWithFallback } from '../utils/imageUpload';

export interface RegisteredPatientAccount {
  id: string;
  auth_user_id: string;
  full_name: string;
  photo_url?: string | null;
  email: string;
  mobile: string;
  dob?: string | null;
  age: number;
  gender: string;
  address: string;
  login_count: number;
  last_login_at: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
  total_appointments: number;
  total_spent: number;
}

const LOCAL_PATIENT_REGISTRY_KEY = 'rhythm_patient_registry';

function getLocalRegistry(): RegisteredPatientAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_PATIENT_REGISTRY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any previous dummy / mock records
      return parsed.filter((acc: any) => !acc.id?.startsWith('pat-acc-00'));
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalRegistry(list: RegisteredPatientAccount[]): void {
  try {
    const cleanList = list.filter((acc: any) => !acc.id?.startsWith('pat-acc-00'));
    localStorage.setItem(LOCAL_PATIENT_REGISTRY_KEY, JSON.stringify(cleanList));
  } catch (_) {}
}

export class PatientAccountService {
  /**
   * Get all registered patient portal accounts with 100% real database & registration records
   */
  static async getAllRegisteredAccounts(): Promise<RegisteredPatientAccount[]> {
    let remoteProfiles: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('patient_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          remoteProfiles = data;
        }
      } catch (err) {
        console.warn('Error fetching patient profiles from Supabase:', err);
      }
    }

    const localList = getLocalRegistry();
    const map = new Map<string, RegisteredPatientAccount>();

    // 1. Add real local registered users
    for (const item of localList) {
      const key = item.email?.toLowerCase() || item.mobile || item.auth_user_id || item.id;
      map.set(key, item);
    }

    // 2. Merge real remote Supabase profiles
    for (const p of remoteProfiles) {
      const key = p.email?.toLowerCase() || p.mobile || p.auth_user_id || p.id;
      const existing = map.get(key);
      map.set(key, {
        id: p.id || existing?.id || generateUUID(),
        auth_user_id: p.auth_user_id || p.id,
        full_name: p.full_name || existing?.full_name || 'Patient User',
        photo_url: p.photo_url || existing?.photo_url || null,
        email: p.email || existing?.email || '',
        mobile: p.mobile || existing?.mobile || '',
        dob: p.dob || existing?.dob || null,
        age: Number(p.age || existing?.age || 0),
        gender: p.gender || existing?.gender || 'Male',
        address: p.address || existing?.address || '',
        login_count: Number(p.login_count || existing?.login_count || 1),
        last_login_at: p.last_login_at || existing?.last_login_at || p.created_at || new Date().toISOString(),
        created_at: p.created_at || existing?.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
        status: (p.status || existing?.status || 'active') as 'active' | 'inactive',
        total_appointments: existing?.total_appointments || 0,
        total_spent: existing?.total_spent || 0,
      });
    }

    // 3. Compute live appointments and actual revenue for each real registered user
    try {
      const allAppointments = await AppointmentService.getAllAppointmentsAdmin();
      const accounts = Array.from(map.values());

      return accounts.map((acc) => {
        const userApts = allAppointments.filter(
          (apt) =>
            (apt.patient_user_id && apt.patient_user_id === acc.auth_user_id) ||
            (apt.patient_mobile && acc.mobile && apt.patient_mobile.replace(/\D/g, '') === acc.mobile.replace(/\D/g, '')) ||
            (apt.patient_name && apt.patient_name.toLowerCase() === acc.full_name.toLowerCase())
        );

        const totalSpent = userApts
          .filter((a) => a.payment_status === 'PAID')
          .reduce((sum, a) => sum + Number(a.consultation_fee || 0), 0);

        return {
          ...acc,
          total_appointments: userApts.length,
          total_spent: totalSpent,
        };
      }).sort((a, b) => new Date(b.created_at || b.last_login_at).getTime() - new Date(a.created_at || a.last_login_at).getTime());
    } catch {
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at || b.last_login_at).getTime() - new Date(a.created_at || a.last_login_at).getTime()
      );
    }
  }

  /**
   * Track real patient login activity: increments login count and records latest login timestamp
   */
  static async recordPatientLogin(identifier: string, userId?: string, userName?: string): Promise<void> {
    const cleanId = identifier.trim().toLowerCase();
    const now = new Date().toISOString();
    const registry = getLocalRegistry();

    let matched = registry.find(
      (p) => p.email?.toLowerCase() === cleanId || p.mobile === identifier || p.auth_user_id === userId
    );

    if (matched) {
      matched.login_count = (matched.login_count || 0) + 1;
      matched.last_login_at = now;
      matched.updated_at = now;
      if (userName && (!matched.full_name || matched.full_name === 'Patient User')) {
        matched.full_name = userName;
      }
      saveLocalRegistry(registry);
    } else {
      const isEmail = identifier.includes('@');
      const newAcc: RegisteredPatientAccount = {
        id: `pat_${Date.now()}`,
        auth_user_id: userId || `auth_${Date.now()}`,
        full_name: userName || (isEmail ? identifier.split('@')[0] : `Patient ${identifier.slice(-4)}`),
        photo_url: null,
        email: isEmail ? identifier : '',
        mobile: !isEmail ? identifier : '',
        dob: null,
        age: 0,
        gender: 'Male',
        address: '',
        login_count: 1,
        last_login_at: now,
        created_at: now,
        updated_at: now,
        status: 'active',
        total_appointments: 0,
        total_spent: 0,
      };
      registry.unshift(newAcc);
      saveLocalRegistry(registry);
      matched = newAcc;
    }

    // Update Supabase database if connected
    if (isSupabaseConfigured() && userId && isValidUUID(userId)) {
      try {
        await supabase
          .from('patient_profiles')
          .update({
            login_count: matched.login_count,
            last_login_at: now,
            updated_at: now,
          })
          .eq('auth_user_id', userId);
      } catch (_) {}
    }

    // Log real action to Administrative Audit Trail
    await AuditService.logAction(
      'PATIENT_LOGIN',
      'patient_account',
      matched.id,
      {
        name: matched.full_name,
        identifier,
        login_count: matched.login_count,
        timestamp: now,
      }
    );
  }

  /**
   * Track real patient account registration
   */
  static async recordPatientRegistration(data: {
    id?: string;
    auth_user_id?: string;
    fullName: string;
    photo_url?: string | null;
    email: string;
    mobile: string;
    dob?: string | null;
    age?: number;
    gender: string;
    address?: string;
  }): Promise<RegisteredPatientAccount> {
    const now = new Date().toISOString();
    const registry = getLocalRegistry();

    const newAcc: RegisteredPatientAccount = {
      id: data.id || `pat_${Date.now()}`,
      auth_user_id: data.auth_user_id || data.id || `auth_${Date.now()}`,
      full_name: data.fullName.trim(),
      photo_url: data.photo_url || null,
      email: data.email.trim(),
      mobile: data.mobile.trim(),
      dob: data.dob || null,
      age: data.age || 0,
      gender: data.gender || 'Male',
      address: data.address || '',
      login_count: 1,
      last_login_at: now,
      created_at: now,
      updated_at: now,
      status: 'active',
      total_appointments: 0,
      total_spent: 0,
    };

    const filtered = registry.filter(
      (p) => p.email?.toLowerCase() !== newAcc.email.toLowerCase() && p.mobile !== newAcc.mobile
    );
    saveLocalRegistry([newAcc, ...filtered]);

    // Log real registration to Administrative Audit Trail
    await AuditService.logAction(
      'PATIENT_REGISTER',
      'patient_account',
      newAcc.id,
      {
        name: newAcc.full_name,
        email: newAcc.email,
        mobile: newAcc.mobile,
        gender: newAcc.gender,
        dob: newAcc.dob,
        registered_at: now,
      }
    );

    return newAcc;
  }

  /**
   * Update Patient Profile Picture (Photo)
   */
  static async updatePatientPhoto(authUserId: string, photoUrl: string): Promise<void> {
    const registry = getLocalRegistry();
    const matched = registry.find((p) => p.auth_user_id === authUserId || p.id === authUserId);
    if (matched) {
      matched.photo_url = photoUrl;
      matched.updated_at = new Date().toISOString();
      saveLocalRegistry(registry);
    }

    try {
      const localProfileRaw = localStorage.getItem('rhythm_patient_profile');
      if (localProfileRaw) {
        const localProfile = JSON.parse(localProfileRaw);
        if (localProfile.auth_user_id === authUserId || localProfile.id === authUserId) {
          localProfile.photo_url = photoUrl;
          localStorage.setItem('rhythm_patient_profile', JSON.stringify(localProfile));
        }
      }
    } catch (_) {}

    if (isSupabaseConfigured() && isValidUUID(authUserId)) {
      try {
        await supabase
          .from('patient_profiles')
          .update({
            photo_url: photoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('auth_user_id', authUserId);

        await supabase
          .from('profiles')
          .update({
            photo_url: photoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUserId);
      } catch (_) {}
    }

    await AuditService.logAction(
      'UPDATE_PATIENT_PHOTO',
      'patient_account',
      authUserId,
      { timestamp: new Date().toISOString() }
    );
  }

  /**
   * Upload Patient Profile Picture to Storage
   */
  static async uploadPatientPhoto(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `patients/${fileName}`;

    return uploadImageWithFallback('hospital-public-assets', filePath, file);
  }

  /**
   * Admin: Update Patient Account Status (active / inactive)
   */
  static async updatePatientStatus(
    authUserId: string,
    status: 'active' | 'inactive',
    adminNotes?: string
  ): Promise<boolean> {
    const registry = getLocalRegistry();
    const matched = registry.find(
      (p) => p.auth_user_id === authUserId || p.id === authUserId
    );

    if (matched) {
      matched.status = status;
      matched.updated_at = new Date().toISOString();
      saveLocalRegistry(registry);
    } else {
      registry.push({
        id: authUserId,
        auth_user_id: authUserId,
        full_name: 'Patient User',
        email: '',
        mobile: '',
        age: 0,
        gender: 'Male',
        address: '',
        login_count: 1,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status,
        total_appointments: 0,
        total_spent: 0,
      });
      saveLocalRegistry(registry);
    }

    // Update active profile session if it matches
    try {
      const localProfileRaw = localStorage.getItem('rhythm_patient_profile');
      if (localProfileRaw) {
        const localProfile = JSON.parse(localProfileRaw);
        if (localProfile.auth_user_id === authUserId || localProfile.id === authUserId) {
          localProfile.status = status;
          localStorage.setItem('rhythm_patient_profile', JSON.stringify(localProfile));
        }
      }
    } catch (_) {}

    // Update remote Supabase database
    if (isSupabaseConfigured() && isValidUUID(authUserId)) {
      try {
        await supabase
          .from('patient_profiles')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('auth_user_id', authUserId);
      } catch (err) {
        console.warn('Could not update status in patient_profiles table:', err);
      }

      try {
        await supabase
          .from('profiles')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUserId);
      } catch (_) {}
    }

    // Log to Audit Trail
    await AuditService.logAction(
      status === 'active' ? 'PATIENT_ACCOUNT_ACTIVATED' : 'PATIENT_ACCOUNT_DEACTIVATED',
      'patient_account',
      authUserId,
      {
        target_name: matched?.full_name || 'Patient User',
        target_email: matched?.email,
        target_mobile: matched?.mobile,
        status,
        adminNotes: adminNotes || undefined,
        timestamp: new Date().toISOString(),
      }
    );

    return true;
  }

  /**
   * Permanently delete patient account (User self-deletion or Admin deletion)
   */
  static async deletePatientAccount(
    authUserId: string,
    email?: string,
    deletedBy: 'user' | 'admin' = 'user'
  ): Promise<boolean> {
    const registry = getLocalRegistry();
    const target = registry.find(
      (p) =>
        p.auth_user_id === authUserId ||
        p.id === authUserId ||
        (email && p.email?.toLowerCase() === email.toLowerCase())
    );

    // 1. Remove from local registry
    const filtered = registry.filter(
      (p) =>
        p.auth_user_id !== authUserId &&
        p.id !== authUserId &&
        (!email || p.email?.toLowerCase() !== email.toLowerCase())
    );
    saveLocalRegistry(filtered);

    // 2. Remove from Supabase database
    if (isSupabaseConfigured() && isValidUUID(authUserId)) {
      try {
        await supabase.from('patient_profiles').delete().eq('auth_user_id', authUserId);
      } catch (err) {
        console.warn('Error deleting patient profile from Supabase:', err);
      }

      try {
        await supabase.from('profiles').delete().eq('id', authUserId);
      } catch (_) {}
    }

    // 3. Clear local session if target matches active patient session
    try {
      const activePat = localStorage.getItem('rhythm_patient_session');
      if (activePat) {
        const parsed = JSON.parse(activePat);
        if (parsed.id === authUserId || (email && parsed.email?.toLowerCase() === email.toLowerCase())) {
          localStorage.removeItem('rhythm_patient_session');
          localStorage.removeItem('rhythm_patient_profile');
        }
      }
    } catch (_) {}

    // 4. Log to Administrative Audit Trail
    await AuditService.logAction(
      deletedBy === 'admin' ? 'PATIENT_ACCOUNT_DELETED_BY_ADMIN' : 'PATIENT_ACCOUNT_DELETED',
      'patient_account',
      authUserId,
      {
        name: target?.full_name || 'Patient User',
        email: target?.email || email,
        mobile: target?.mobile,
        deletedBy,
        deleted_at: new Date().toISOString(),
      }
    );

    return true;
  }
}
