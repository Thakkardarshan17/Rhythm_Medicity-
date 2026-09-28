import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DashboardMetrics {
  totalDoctors: number;
  totalSpecialities: number;
  totalServices: number;
  totalAppointments: number;
  todayAppointments: number;
  totalPatients: number;
  paidAppointments: number;
  totalRevenue: number;
}

export interface DoctorReportItem {
  doctorId: string;
  doctorName: string;
  specialityName: string;
  totalAppointments: number;
  paidAppointments: number;
  revenue: number;
}

export interface SpecialityReportItem {
  specialityId: string;
  specialityName: string;
  totalAppointments: number;
  revenue: number;
}

export class ReportService {
  /**
   * Fetches real live metrics for admin dashboard
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (!isSupabaseConfigured()) {
      return {
        totalDoctors: 0,
        totalSpecialities: 0,
        totalServices: 0,
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        paidAppointments: 0,
        totalRevenue: 0,
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Parallel count queries
    const [
      doctorsRes,
      specialitiesRes,
      servicesRes,
      appointmentsRes,
      todayAptRes,
      patientsRes,
      paidAptRes,
    ] = await Promise.all([
      supabase.from('doctors').select('*', { count: 'exact', head: true }),
      supabase.from('specialities').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', todayStr),
      supabase.from('patient_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('payment_status', 'PAID'),
    ]);

    // Calculate revenue from paid appointments
    const { data: paidAppointments } = await supabase
      .from('appointments')
      .select('consultation_fee')
      .eq('payment_status', 'PAID');

    const totalRevenue = (paidAppointments || []).reduce(
      (sum, item) => sum + Number(item.consultation_fee || 0),
      0
    );

    return {
      totalDoctors: doctorsRes.count || 0,
      totalSpecialities: specialitiesRes.count || 0,
      totalServices: servicesRes.count || 0,
      totalAppointments: appointmentsRes.count || 0,
      todayAppointments: todayAptRes.count || 0,
      totalPatients: patientsRes.count || 0,
      paidAppointments: paidAptRes.count || 0,
      totalRevenue,
    };
  }

  /**
   * Generates live reports by doctor
   */
  static async getDoctorReports(): Promise<DoctorReportItem[]> {
    if (!isSupabaseConfigured()) return [];

    const { data: appointments } = await supabase
      .from('appointments')
      .select('doctor_id, doctor_name_snapshot, speciality_name_snapshot, consultation_fee, payment_status');

    if (!appointments || appointments.length === 0) return [];

    const doctorMap = new Map<string, DoctorReportItem>();

    appointments.forEach((apt) => {
      const docId = apt.doctor_id || 'unknown';
      if (!doctorMap.has(docId)) {
        doctorMap.set(docId, {
          doctorId: docId,
          doctorName: apt.doctor_name_snapshot || 'Doctor',
          specialityName: apt.speciality_name_snapshot || 'General',
          totalAppointments: 0,
          paidAppointments: 0,
          revenue: 0,
        });
      }

      const item = doctorMap.get(docId)!;
      item.totalAppointments += 1;
      if (apt.payment_status === 'PAID') {
        item.paidAppointments += 1;
        item.revenue += Number(apt.consultation_fee || 0);
      }
    });

    return Array.from(doctorMap.values());
  }

  /**
   * Generates live reports by speciality
   */
  static async getSpecialityReports(): Promise<SpecialityReportItem[]> {
    if (!isSupabaseConfigured()) return [];

    const { data: appointments } = await supabase
      .from('appointments')
      .select('speciality_id, speciality_name_snapshot, consultation_fee, payment_status');

    if (!appointments || appointments.length === 0) return [];

    const specMap = new Map<string, SpecialityReportItem>();

    appointments.forEach((apt) => {
      const specId = apt.speciality_id || 'unknown';
      if (!specMap.has(specId)) {
        specMap.set(specId, {
          specialityId: specId,
          specialityName: apt.speciality_name_snapshot || 'Speciality',
          totalAppointments: 0,
          revenue: 0,
        });
      }

      const item = specMap.get(specId)!;
      item.totalAppointments += 1;
      if (apt.payment_status === 'PAID') {
        item.revenue += Number(apt.consultation_fee || 0);
      }
    });

    return Array.from(specMap.values());
  }
}
