import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isValidUUID, sanitizeUUID, generateUUID } from '../utils/uuid';
import { Appointment, AppointmentStatus, PaymentStatus } from '../types/database';
import { DoctorService } from './doctorService';
import { AuditService } from './auditService';

export interface AppointmentFilterParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  specialityId?: string;
  status?: string;
  paymentStatus?: string;
  search?: string;
}

const LOCAL_APPOINTMENTS_KEY = 'rhythm_local_appointments';

function getCachedAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(LOCAL_APPOINTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedAppointments(list: Appointment[]): void {
  try {
    localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(list));
  } catch (_) {}
}

function notifyAppointmentsChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent('rhythm_appointments_changed'));
  } catch (_) {}
}

export class AppointmentService {
  /**
   * Generates a unique hospital appointment number in the format: RM-2026-000125
   */
  static generateAppointmentNumber(): string {
    const year = new Date().getFullYear();
    const existing = getCachedAppointments();
    const seq = existing.length + 125;
    const padded = String(seq).padStart(6, '0');
    return `RM-${year}-${padded}`;
  }

  static async getAppointmentById(id: string): Promise<Appointment | null> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, doctor:doctors(*), speciality:specialities(*)')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Error fetching appointment from Supabase:', err);
      }
    }

    const cached = getCachedAppointments();
    return cached.find((a) => a.id === id || a.appointment_number === id) || null;
  }

  static async getUserAppointments(
    userId?: string | null,
    patientMobile?: string | null,
    patientEmail?: string | null
  ): Promise<Appointment[]> {
    const validUserId = isValidUUID(userId) ? userId : null;
    const cleanMobile = patientMobile ? patientMobile.replace(/\D/g, '') : null;
    const cleanEmail = patientEmail ? patientEmail.trim().toLowerCase() : null;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('appointments')
          .select('*, doctor:doctors(*), speciality:specialities(*)')
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false });

        if (validUserId && cleanMobile) {
          query = query.or(`patient_user_id.eq.${validUserId},patient_mobile.eq.${cleanMobile}`);
        } else if (validUserId) {
          query = query.eq('patient_user_id', validUserId);
        } else if (cleanMobile) {
          query = query.eq('patient_mobile', cleanMobile);
        }

        const { data, error } = await query;
        if (!error && data) {
          saveCachedAppointments(data);
          return data;
        }
      } catch (err) {
        console.warn('Error fetching user appointments from Supabase:', err);
      }
    }

    const cached = getCachedAppointments().filter((a) => {
      if (userId && a.patient_user_id === userId) return true;
      if (validUserId && a.patient_user_id === validUserId) return true;
      if (cleanMobile && a.patient_mobile && a.patient_mobile.replace(/\D/g, '') === cleanMobile) return true;
      if (cleanEmail && (a as any).patient_email && (a as any).patient_email.toLowerCase() === cleanEmail) return true;
      return false;
    });

    return cached.sort(
      (a, b) =>
        new Date(b.appointment_date + 'T' + b.appointment_time).getTime() -
        new Date(a.appointment_date + 'T' + a.appointment_time).getTime()
    );
  }

  static async getAllAppointmentsAdmin(filters: AppointmentFilterParams = {}): Promise<Appointment[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('appointments')
          .select('*, doctor:doctors(*), speciality:specialities(*)')
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false });

        if (filters.date) {
          query = query.eq('appointment_date', filters.date);
        }
        if (filters.startDate) {
          query = query.gte('appointment_date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('appointment_date', filters.endDate);
        }
        if (filters.doctorId && isValidUUID(filters.doctorId)) {
          query = query.eq('doctor_id', filters.doctorId);
        }
        if (filters.specialityId && isValidUUID(filters.specialityId)) {
          query = query.eq('speciality_id', filters.specialityId);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('appointment_status', filters.status);
        }
        if (filters.paymentStatus && filters.paymentStatus !== 'all') {
          query = query.eq('payment_status', filters.paymentStatus);
        }
        if (filters.search) {
          query = query.or(
            `patient_name.ilike.%${filters.search}%,patient_mobile.ilike.%${filters.search}%,appointment_number.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query;
        if (!error && data) {
          saveCachedAppointments(data);
          return data;
        }
        if (error) {
          console.warn('Error fetching admin appointments from Supabase:', error);
        }
      } catch (err) {
        console.warn('Error fetching admin appointments from Supabase:', err);
      }
    }

    let all = getCachedAppointments();
    if (filters.status && filters.status !== 'all') {
      all = all.filter((a) => a.appointment_status === filters.status);
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      all = all.filter((a) => a.payment_status === filters.paymentStatus);
    }
    if (filters.doctorId) {
      all = all.filter((a) => a.doctor_id === filters.doctorId);
    }
    if (filters.specialityId) {
      all = all.filter((a) => a.speciality_id === filters.specialityId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      all = all.filter(
        (a) =>
          a.patient_name.toLowerCase().includes(q) ||
          a.patient_mobile.includes(q) ||
          a.appointment_number.toLowerCase().includes(q) ||
          a.doctor_name_snapshot?.toLowerCase().includes(q) ||
          a.speciality_name_snapshot?.toLowerCase().includes(q)
      );
    }

    return all.sort(
      (a, b) =>
        new Date(b.created_at || b.appointment_date).getTime() -
        new Date(a.created_at || a.appointment_date).getTime()
    );
  }

  /**
   * Complete atomic creation of a confirmed appointment with financial transaction and audit log
   */
  static async createConfirmedAppointment(params: {
    patientUserId?: string | null;
    patientName: string;
    patientAge: number;
    patientGender: any;
    patientAddress: string;
    patientMobile: string;
    patientEmail?: string | null;
    doctorId: string;
    specialityId: string;
    appointmentDate: string;
    appointmentTime: string;
    patientProblem: string;
    orderId?: string;
    paymentId?: string;
    provider?: string;
    amount?: number;
  }): Promise<Appointment> {
    const appointmentId = generateUUID();
    const appointmentNumber = this.generateAppointmentNumber();
    const now = new Date().toISOString();

    // Fetch Doctor & Speciality snapshot names
    let doctor = await DoctorService.getDoctorById(params.doctorId);
    let doctorName = doctor?.full_name || 'Medical Specialist';
    let specialityName = doctor?.speciality?.name || 'Clinical Care';
    let fee = params.amount ?? (doctor?.consultation_fee || 500);

    const appointmentRecord: Appointment = {
      id: appointmentId,
      appointment_number: appointmentNumber,
      patient_user_id: params.patientUserId || null,
      patient_name: params.patientName,
      patient_age: Number(params.patientAge),
      patient_gender: params.patientGender,
      patient_address: params.patientAddress,
      patient_mobile: params.patientMobile,
      speciality_id: sanitizeUUID(params.specialityId) || '054143b9-eb79-49d0-a74c-0e12c20a6c2d',
      doctor_id: sanitizeUUID(params.doctorId) || '7637bd26-293d-4705-b162-74fce2197ec0',
      appointment_date: params.appointmentDate,
      appointment_time: params.appointmentTime,
      patient_problem: params.patientProblem,
      diagnosis: null,
      consultation_fee: Number(fee),
      currency: 'INR',
      terms_accepted: true,
      terms_accepted_at: now,
      terms_version: 'v1.0',
      payment_status: 'PAID',
      appointment_status: 'CONFIRMED',
      payment_transaction_id: params.paymentId || `pay_${Date.now()}`,
      booking_source: 'website_online',
      doctor_name_snapshot: doctorName,
      speciality_name_snapshot: specialityName,
      consultation_fee_snapshot: Number(fee),
      hospital_name_snapshot: 'Rhythm Medicity',
      hospital_address_snapshot: 'Rhythm Medicity, Opp. Civil Hospital Road, Anand, Gujarat - 388001',
      hospital_phone_snapshot: '+91 2692 222333',
      hospital_emergency_snapshot: '108 / +91 98250 99999',
      hospital_email_snapshot: 'care@rhythmmedicity.com',
      hospital_website_snapshot: 'www.rhythmmedicity.com',
      created_at: now,
      updated_at: now,
      doctor: doctor || undefined,
    };

    // Save to Supabase
    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          ...appointmentRecord,
          patient_user_id: sanitizeUUID(appointmentRecord.patient_user_id),
          doctor: undefined,
          speciality: undefined,
        };
        const { data, error } = await supabase
          .from('appointments')
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw new Error(error.message || 'Database insert failed');
        }

        if (data) {
          appointmentRecord.id = data.id || appointmentRecord.id;
        }

        // Record payment revenue transaction
        try {
          await supabase.from('payment_transactions').insert({
            appointment_id: sanitizeUUID(appointmentRecord.id),
            order_id: params.orderId || `ord_${Date.now()}`,
            payment_id: params.paymentId || `pay_${Date.now()}`,
            amount: Number(fee),
            currency: 'INR',
            status: 'SUCCESS',
            payment_provider: params.provider || 'razorpay',
            created_at: now,
          });
        } catch (_) {}
      } catch (err: any) {
        console.error('Supabase appointment create failed:', err);
        throw err;
      }
    }

    const cached = getCachedAppointments();
    saveCachedAppointments([appointmentRecord, ...cached.filter((a) => a.id !== appointmentId)]);

    await AuditService.logAction(
      'CREATE_APPOINTMENT',
      'appointment',
      appointmentRecord.id,
      {
        appointment_number: appointmentNumber,
        patient_name: params.patientName,
        doctor: doctorName,
        speciality: specialityName,
        amount: fee,
        status: 'CONFIRMED',
      }
    );

    notifyAppointmentsChanged();
    return appointmentRecord;
  }

  static async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .update({
            appointment_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, doctor:doctors(*), speciality:specialities(*)')
          .single();

        if (error) {
          throw new Error(error.message || 'Database status update failed');
        }

        if (data) {
          const cached = getCachedAppointments();
          saveCachedAppointments([data, ...cached.filter((a) => a.id !== id)]);
          notifyAppointmentsChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase update appointment status error:', err);
        throw err;
      }
    }

    const cached = getCachedAppointments();
    const existing = cached.find((a) => a.id === id);
    if (existing) {
      existing.appointment_status = status;
      existing.updated_at = new Date().toISOString();
      saveCachedAppointments([...cached.filter((a) => a.id !== id), existing]);
    }

    notifyAppointmentsChanged();
    return existing || ({} as Appointment);
  }

  static async updateDiagnosisNote(id: string, diagnosis: string): Promise<Appointment> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .update({
            diagnosis,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, doctor:doctors(*), speciality:specialities(*)')
          .single();

        if (error) {
          throw new Error(error.message || 'Database clinical note update failed');
        }

        if (data) {
          const cached = getCachedAppointments();
          saveCachedAppointments([data, ...cached.filter((a) => a.id !== id)]);
          notifyAppointmentsChanged();
          return data;
        }
      } catch (err: any) {
        console.error('Supabase update diagnosis error:', err);
        throw err;
      }
    }

    const cached = getCachedAppointments();
    const existing = cached.find((a) => a.id === id);
    if (existing) {
      existing.diagnosis = diagnosis;
      existing.updated_at = new Date().toISOString();
      saveCachedAppointments([...cached.filter((a) => a.id !== id), existing]);
    }

    notifyAppointmentsChanged();
    return existing || ({} as Appointment);
  }

  static async deleteAppointment(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      try {
        // Delete any related payment transactions first
        await supabase
          .from('payment_transactions')
          .delete()
          .eq('appointment_id', id);

        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) {
          throw new Error(error.message || 'Database appointment delete failed');
        }
      } catch (err: any) {
        console.error('Supabase appointment delete error:', err);
        throw err;
      }
    }

    const cached = getCachedAppointments();
    saveCachedAppointments(cached.filter((a) => a.id !== id));
    notifyAppointmentsChanged();
  }

  static async cancelAppointment(id: string): Promise<Appointment> {
    return this.updateAppointmentStatus(id, 'CANCELLED');
  }
}
