// ============================================================
// RHYTHM MEDICITY - WHATSAPP INTEGRATION & FALLBACK SERVICE
// ============================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { Appointment } from '../types/database';
import { formatDate, formatTime } from '../utils/formatters';

export interface WhatsAppSendResult {
  status: 'Preparing' | 'Sent' | 'Failed' | 'Fallback';
  message: string;
  directUrl?: string;
}

export class WhatsAppService {
  /**
   * Generates official hospital notification WhatsApp message
   * Formatted strictly as requested:
   * 🏥 RHYTHM MEDICITY
   * NEW APPOINTMENT BOOKING
   * Appointment ID: RM-2026-000125
   * Patient Name: Darshan Thakkar
   * Mobile: +91 XXXXX XXXXX
   * Doctor: Dr. ABC Patel
   * Department: Cardiology
   * Date: 28 September 2026
   * Time: 10:30 AM
   * Payment: Paid
   * Amount: ₹500
   * Please review this appointment request in the Hospital Admin Dashboard.
   */
  static generateHospitalBookingMessage(
    appointment: Appointment,
    hospitalName: string = 'RHYTHM MEDICITY'
  ): string {
    const formattedDate = formatDate(appointment.appointment_date);
    const formattedSlotTime = formatTime(appointment.appointment_time);
    const fee = appointment.consultation_fee_snapshot || appointment.consultation_fee || 500;
    const payment = appointment.payment_status === 'PAID' ? 'Paid' : 'Pending';

    return `🏥 *${hospitalName.toUpperCase()}*

*NEW APPOINTMENT BOOKING*

*Appointment ID:* ${appointment.appointment_number}

*Patient Name:* ${appointment.patient_name}
*Mobile:* ${appointment.patient_mobile}
*Doctor:* ${appointment.doctor_name_snapshot}
*Department:* ${appointment.speciality_name_snapshot}
*Date:* ${formattedDate}
*Time:* ${formattedSlotTime}
*Payment:* ${payment}
*Amount:* ₹${fee}

Please review this appointment request in the Hospital Admin Dashboard.`;
  }

  /**
   * Generates a pre-formatted WhatsApp message for patient confirmation
   */
  static generatePatientConfirmationMessage(
    appointment: Appointment,
    hospitalName: string = 'RHYTHM MEDICITY'
  ): string {
    const formattedDate = formatDate(appointment.appointment_date);
    const formattedSlotTime = formatTime(appointment.appointment_time);
    const fee = appointment.consultation_fee_snapshot || appointment.consultation_fee || 500;

    return `🏥 *${hospitalName.toUpperCase()}*
*APPOINTMENT CONFIRMED*

Dear *${appointment.patient_name}*,
Your appointment has been successfully confirmed.

📋 *Appointment ID:* ${appointment.appointment_number}
🩺 *Doctor:* ${appointment.doctor_name_snapshot}
🏥 *Department:* ${appointment.speciality_name_snapshot}
📅 *Date:* ${formattedDate}
⏰ *Time:* ${formattedSlotTime}
💵 *Amount Paid:* ₹${fee}
✅ *Status:* Confirmed & Paid

View / Download your Appointment Letter:
${window.location.origin}/appointment/${appointment.id}

_Please arrive 15 minutes before your scheduled appointment time._
*${hospitalName} - One Stop Solution For Complete Care*`;
  }

  /**
   * Generates direct WhatsApp click-to-chat URL
   */
  static getDirectChatUrl(mobile: string, text: string): string {
    const cleanMobile = mobile.replace(/\D/g, '');
    const phone = cleanMobile.startsWith('91') && cleanMobile.length > 10 ? cleanMobile : `91${cleanMobile.slice(-10)}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Get direct WhatsApp URL for sending notification to Hospital
   */
  static getHospitalWhatsAppUrl(
    hospitalWhatsappNumber: string,
    appointment: Appointment,
    hospitalName?: string
  ): string {
    const text = this.generateHospitalBookingMessage(appointment, hospitalName);
    return this.getDirectChatUrl(hospitalWhatsappNumber, text);
  }

  /**
   * Send confirmation via Edge Function (Meta Cloud API/Twilio)
   * Falls back gracefully to direct link if API credentials are not active.
   */
  static async sendAppointmentConfirmation(
    appointment: Appointment,
    hospitalName?: string
  ): Promise<WhatsAppSendResult> {
    const fallbackText = this.generatePatientConfirmationMessage(appointment, hospitalName);
    const directUrl = this.getDirectChatUrl(appointment.patient_mobile, fallbackText);

    if (!isSupabaseConfigured()) {
      return {
        status: 'Fallback',
        message: 'Direct WhatsApp link prepared.',
        directUrl,
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { appointmentId: appointment.id },
      });

      if (error) {
        return {
          status: 'Fallback',
          message: 'WhatsApp automated API not configured. You can send it directly.',
          directUrl,
        };
      }

      if (data?.status === 'Sent') {
        return {
          status: 'Sent',
          message: 'WhatsApp confirmation delivered to patient successfully.',
        };
      }

      return {
        status: 'Fallback',
        message: 'WhatsApp message ready to send via link.',
        directUrl,
      };
    } catch {
      return {
        status: 'Fallback',
        message: 'Direct WhatsApp link ready.',
        directUrl,
      };
    }
  }
}

