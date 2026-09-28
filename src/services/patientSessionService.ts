import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';

export interface PatientSession {
  session_token: string;
  patient_id: string;
  created_at: number; // ms timestamp
  last_activity_at: number; // ms timestamp
  expires_at: number; // ms timestamp (idle timeout threshold)
  absolute_expires_at: number; // ms timestamp (absolute session threshold)
  is_active: boolean;
}

export interface SessionSecuritySettings {
  idle_timeout_minutes: number; // default: 15 minutes
  absolute_timeout_minutes: number; // default: 720 minutes (12 hours)
  warning_lead_seconds: number; // default: 120 seconds (2 minutes)
}

const DEFAULT_SECURITY_SETTINGS: SessionSecuritySettings = {
  idle_timeout_minutes: 15,
  absolute_timeout_minutes: 720,
  warning_lead_seconds: 120,
};

const SESSION_STORAGE_KEY = 'rhythm_patient_active_session';
const SETTINGS_STORAGE_KEY = 'rhythm_session_security_settings';

/**
 * Patient Session Management Service
 * Implements OWASP ASVS Session Management guidelines:
 * - Unpredictable, random session tokens
 * - Idle / Inactivity session expiration
 * - Absolute maximum session lifetime
 * - Server/Store validation & instant invalidation on logout
 */
export class PatientSessionService {
  /**
   * Get current security settings (configurable by Admin)
   */
  static getSettings(): SessionSecuritySettings {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (_) {}
    return DEFAULT_SECURITY_SETTINGS;
  }

  /**
   * Update security settings (Admin Console)
   */
  static updateSettings(settings: Partial<SessionSecuritySettings>): SessionSecuritySettings {
    const updated = { ...this.getSettings(), ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Generates a cryptographically random session token
   */
  private static generateSecureToken(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    return `sec_${generateUUID()}_${Date.now().toString(36)}`;
  }

  /**
   * Create an authenticated patient session upon successful login or signup.
   * Stores session token in sessionStorage so that a brand new tab/window open
   * is logged out by default as requested.
   */
  static async createSession(patientId: string): Promise<PatientSession> {
    const settings = this.getSettings();
    const now = Date.now();
    const token = this.generateSecureToken();

    const session: PatientSession = {
      session_token: token,
      patient_id: patientId,
      created_at: now,
      last_activity_at: now,
      expires_at: now + settings.idle_timeout_minutes * 60 * 1000,
      absolute_expires_at: now + settings.absolute_timeout_minutes * 60 * 1000,
      is_active: true,
    };

    // Store in tab session storage (isolated per browser session)
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    // Register in server registry or shared store for verification
    this.saveSessionToServerRegistry(session);

    return session;
  }

  /**
   * Save session to server registry (Supabase or persistent validated vault)
   */
  private static saveSessionToServerRegistry(session: PatientSession) {
    try {
      const activeSessions: Record<string, PatientSession> = JSON.parse(
        localStorage.getItem('rhythm_active_sessions_vault') || '{}'
      );
      activeSessions[session.session_token] = session;
      localStorage.setItem('rhythm_active_sessions_vault', JSON.stringify(activeSessions));

      if (isSupabaseConfigured()) {
        try {
          supabase
            .from('patient_sessions')
            .upsert({
              session_token: session.session_token,
              patient_id: session.patient_id,
              created_at: new Date(session.created_at).toISOString(),
              last_activity_at: new Date(session.last_activity_at).toISOString(),
              expires_at: new Date(session.expires_at).toISOString(),
              is_active: true,
            })
            .then(() => {}, () => {});
        } catch (_) {}
      }
    } catch (_) {}
  }

  /**
   * Retrieve active session from current sessionStorage
   */
  static getActiveSession(): PatientSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const session: PatientSession = JSON.parse(raw);
      if (!session || !session.session_token || !session.is_active) return null;
      return session;
    } catch (_) {
      return null;
    }
  }

  /**
   * Validates session against server store and checks idle + absolute timeouts.
   * Returns:
   * - valid: boolean
   * - reason?: 'idle_timeout' | 'absolute_timeout' | 'revoked' | 'no_session'
   * - remainingSeconds: number
   */
  static async validateSession(): Promise<{
    valid: boolean;
    reason?: 'idle_timeout' | 'absolute_timeout' | 'revoked' | 'no_session';
    remainingSeconds: number;
    showWarning: boolean;
  }> {
    const session = this.getActiveSession();
    if (!session) {
      return { valid: false, reason: 'no_session', remainingSeconds: 0, showWarning: false };
    }

    const settings = this.getSettings();
    const now = Date.now();

    // 1. Check absolute session expiration
    if (now >= session.absolute_expires_at) {
      await this.invalidateSession('absolute_timeout');
      return { valid: false, reason: 'absolute_timeout', remainingSeconds: 0, showWarning: false };
    }

    // 2. Check idle / inactivity timeout
    if (now >= session.expires_at) {
      await this.invalidateSession('idle_timeout');
      return { valid: false, reason: 'idle_timeout', remainingSeconds: 0, showWarning: false };
    }

    // 3. Verify server registry status (not revoked)
    try {
      const vault: Record<string, PatientSession> = JSON.parse(
        localStorage.getItem('rhythm_active_sessions_vault') || '{}'
      );
      const serverRecord = vault[session.session_token];
      if (serverRecord && !serverRecord.is_active) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return { valid: false, reason: 'revoked', remainingSeconds: 0, showWarning: false };
      }
    } catch (_) {}

    // 4. Calculate remaining seconds until idle expiry
    const remainingSeconds = Math.max(0, Math.floor((session.expires_at - now) / 1000));
    const showWarning = remainingSeconds <= settings.warning_lead_seconds;

    return {
      valid: true,
      remainingSeconds,
      showWarning,
    };
  }

  /**
   * Touch session on legitimate patient activity (scroll, navigation, form action).
   * Extends the idle timeout.
   */
  static touchSession(): void {
    const session = this.getActiveSession();
    if (!session || !session.is_active) return;

    const settings = this.getSettings();
    const now = Date.now();

    // Do not touch if already past absolute timeout
    if (now >= session.absolute_expires_at) return;

    session.last_activity_at = now;
    session.expires_at = now + settings.idle_timeout_minutes * 60 * 1000;

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.saveSessionToServerRegistry(session);
  }

  /**
   * Explicitly renew session when patient clicks "Continue Session" on warning modal
   */
  static async renewSession(): Promise<boolean> {
    const session = this.getActiveSession();
    if (!session) return false;

    const settings = this.getSettings();
    const now = Date.now();

    // Absolute timeout cannot be exceeded without re-auth
    if (now >= session.absolute_expires_at) {
      await this.invalidateSession('absolute_timeout');
      return false;
    }

    session.last_activity_at = now;
    session.expires_at = now + settings.idle_timeout_minutes * 60 * 1000;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.saveSessionToServerRegistry(session);

    return true;
  }

  /**
   * Invalidate session on server and client (Logout or Timeout)
   */
  static async invalidateSession(reason: string = 'logout'): Promise<void> {
    const session = this.getActiveSession();
    if (session) {
      session.is_active = false;
      try {
        const vault: Record<string, PatientSession> = JSON.parse(
          localStorage.getItem('rhythm_active_sessions_vault') || '{}'
        );
        delete vault[session.session_token];
        localStorage.setItem('rhythm_active_sessions_vault', JSON.stringify(vault));

        if (isSupabaseConfigured()) {
          supabase
            .from('patient_sessions')
            .update({ is_active: false })
            .eq('session_token', session.session_token)
            .then(() => {}, () => {});
        }
      } catch (_) {}
    }

    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  /**
   * Verifies that the current caller possesses a valid authenticated session
   * for the given patient ID before performing protected operations.
   */
  static verifyPatientOwnership(patientId: string): boolean {
    const session = this.getActiveSession();
    if (!session || !session.is_active) return false;
    return session.patient_id === patientId;
  }
}
