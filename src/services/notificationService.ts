import { supabase, isSupabaseConfigured } from '../lib/supabase';

/* ═══════════════════════════════════════════════════════════════
 *  ADMIN NOTIFICATION SERVICE
 *
 *  Manages admin notifications for:
 *  - New appointment bookings
 *  - Payment confirmations
 *  - Patient registrations
 *  - Appointment cancellations
 *  - System alerts
 *
 *  Stores in Supabase (if configured) or localStorage fallback.
 * ═══════════════════════════════════════════════════════════════ */

export type NotificationType = 'appointment' | 'payment' | 'patient' | 'cancellation' | 'system';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

const LOCAL_KEY = 'rhythm_admin_notifications';
const MAX_NOTIFICATIONS = 50;

// ── Notification Icons (for display mapping) ──
export const NOTIFICATION_CONFIG: Record<NotificationType, { emoji: string; color: string; bgColor: string }> = {
  appointment: { emoji: '📅', color: '#006655', bgColor: '#E0F2ED' },
  payment: { emoji: '💰', color: '#16a34a', bgColor: '#dcfce7' },
  patient: { emoji: '👤', color: '#7c3aed', bgColor: '#f3e8ff' },
  cancellation: { emoji: '❌', color: '#dc2626', bgColor: '#fef2f2' },
  system: { emoji: '🔔', color: '#2563eb', bgColor: '#dbeafe' },
};

// ── Local Storage Helpers ──
function getLocalNotifications(): AdminNotification[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch { return []; }
}

function saveLocalNotifications(list: AdminNotification[]): void {
  try {
    // Keep only the latest MAX_NOTIFICATIONS
    const trimmed = list.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(trimmed));
  } catch {}
}

export class NotificationService {
  /**
   * Get all admin notifications (newest first)
   */
  static async getAll(): Promise<AdminNotification[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(MAX_NOTIFICATIONS);

        if (!error && data && data.length > 0) {
          return data as AdminNotification[];
        }
      } catch {}
    }

    // Fallback to local storage
    return getLocalNotifications();
  }

  /**
   * Get count of unread notifications
   */
  static async getUnreadCount(): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        const { count, error } = await supabase
          .from('admin_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);

        if (!error && count !== null) return count;
      } catch {}
    }

    return getLocalNotifications().filter((n) => !n.is_read).length;
  }

  /**
   * Add a new admin notification
   */
  static async add(
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, any>
  ): Promise<AdminNotification> {
    const notification: AdminNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      title,
      message,
      is_read: false,
      link,
      metadata,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('admin_notifications')
          .insert({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            is_read: false,
            link: notification.link,
            metadata: notification.metadata,
          })
          .select()
          .single();

        if (!error && data) return data as AdminNotification;
      } catch {}
    }

    // Fallback: save locally
    const existing = getLocalNotifications();
    existing.unshift(notification);
    saveLocalNotifications(existing);
    return notification;
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('admin_notifications')
          .update({ is_read: true })
          .eq('id', id);
      } catch {}
    }

    const local = getLocalNotifications();
    const idx = local.findIndex((n) => n.id === id);
    if (idx >= 0) {
      local[idx].is_read = true;
      saveLocalNotifications(local);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('admin_notifications')
          .update({ is_read: true })
          .eq('is_read', false);
      } catch {}
    }

    const local = getLocalNotifications().map((n) => ({ ...n, is_read: true }));
    saveLocalNotifications(local);
  }

  /**
   * Delete a notification
   */
  static async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('admin_notifications').delete().eq('id', id);
      } catch {}
    }

    const local = getLocalNotifications().filter((n) => n.id !== id);
    saveLocalNotifications(local);
  }

  /**
   * Clear all notifications
   */
  static async clearAll(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('admin_notifications').delete().neq('id', '');
      } catch {}
    }
    saveLocalNotifications([]);
  }

  // ── Convenience methods for triggering specific notifications ──

  static async notifyNewAppointment(
    patientName: string,
    doctorName: string,
    date: string,
    time: string,
    appointmentNumber: string
  ): Promise<void> {
    await this.add(
      'appointment',
      '🆕 New Appointment Booked',
      `${patientName} booked an appointment with ${doctorName} on ${date} at ${time}.`,
      '/admin/appointments',
      { appointmentNumber, patientName, doctorName }
    );
  }

  static async notifyPaymentReceived(
    patientName: string,
    amount: number,
    appointmentNumber: string
  ): Promise<void> {
    await this.add(
      'payment',
      '💳 Payment Received',
      `₹${amount} received from ${patientName} for appointment ${appointmentNumber}.`,
      '/admin/payments',
      { appointmentNumber, amount }
    );
  }

  static async notifyNewPatient(patientName: string, mobile: string): Promise<void> {
    await this.add(
      'patient',
      '👤 New Patient Registered',
      `${patientName} (${mobile}) has registered on the patient portal.`,
      '/admin/patients',
      { patientName, mobile }
    );
  }

  static async notifyAppointmentCancelled(
    patientName: string,
    doctorName: string,
    appointmentNumber: string
  ): Promise<void> {
    await this.add(
      'cancellation',
      '⚠️ Appointment Cancelled',
      `${patientName}'s appointment with ${doctorName} (${appointmentNumber}) has been cancelled.`,
      '/admin/appointments',
      { appointmentNumber }
    );
  }
}
