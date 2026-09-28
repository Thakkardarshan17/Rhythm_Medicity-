import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sanitizeUUID, isValidUUID, generateUUID } from '../utils/uuid';
import { AdminAuditLog } from '../types/database';

const LOCAL_AUDIT_LOGS_KEY = 'rhythm_admin_audit_logs';

// In-memory cache to debounce exact duplicate logs triggered in rapid succession (< 2 seconds)
const recentLogsMap = new Map<string, number>();

function getLocalLogs(): AdminAuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(logs: AdminAuditLog[]): void {
  try {
    localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
  } catch (_) {}
}

/**
 * Creates a unique deduplication fingerprint for an audit log entry
 */
function getFingerprint(log: AdminAuditLog): string {
  const actor = log.metadata?.actor || '';
  const timeKey = Math.floor(new Date(log.created_at || '').getTime() / 4000); // 4-second bucket
  return `${log.action}_${log.entity_type}_${log.entity_id || ''}_${actor}_${timeKey}`;
}

export class AuditService {
  static async logAction(
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const now = Date.now();
    const debounceKey = `${action}_${entityType}_${entityId || ''}_${JSON.stringify(metadata || {})}`;
    
    // Check if identical action was logged within the last 2 seconds
    const lastLogged = recentLogsMap.get(debounceKey);
    if (lastLogged && now - lastLogged < 2000) {
      return; // Skip duplicate trigger
    }
    recentLogsMap.set(debounceKey, now);

    // Clean old entries from in-memory debouncer
    if (recentLogsMap.size > 200) {
      recentLogsMap.clear();
    }

    const logId = generateUUID();
    const timestamp = new Date().toISOString();
    let adminUserId: string | null = null;
    let actorEmail = 'admin@rhythmmedicity.internal';

    // Get current user if available
    try {
      const savedAdmin = localStorage.getItem('rhythm_admin_session');
      if (savedAdmin) {
        const parsed = JSON.parse(savedAdmin);
        adminUserId = parsed.id || null;
        actorEmail = parsed.email || actorEmail;
      }
    } catch (_) {}

    const logEntry: AdminAuditLog = {
      id: logId,
      admin_user_id: isValidUUID(adminUserId) ? adminUserId : null,
      action,
      entity_type: entityType,
      entity_id: sanitizeUUID(entityId),
      metadata: {
        actor: actorEmail,
        ...(metadata || {}),
      },
      created_at: timestamp,
    };

    // Save to local storage
    const currentLogs = getLocalLogs();
    saveLocalLogs([logEntry, ...currentLogs.filter((l) => l.id !== logId)]);

    // Save to Supabase if configured with the SAME logId
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('admin_audit_logs').insert({
          id: logId,
          admin_user_id: isValidUUID(user?.id) ? user!.id : (isValidUUID(adminUserId) ? adminUserId : null),
          action,
          entity_type: entityType,
          entity_id: sanitizeUUID(entityId),
          metadata: {
            actor: user?.email || actorEmail,
            ...(metadata || {}),
          },
          created_at: timestamp,
        });
      } catch (err) {
        console.warn('Failed to record audit log to Supabase:', err);
      }
    }
  }

  static async getAuditLogs(): Promise<AdminAuditLog[]> {
    let remoteLogs: AdminAuditLog[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(250);

        if (!error && data) {
          remoteLogs = data;
        }
      } catch (err) {
        console.warn('Error fetching audit logs from Supabase:', err);
      }
    }

    const localLogs = getLocalLogs();
    
    // Combine and deduplicate strictly by:
    // 1. Primary Key ID
    // 2. Event fingerprint (same action, entity, actor, and approximate timestamp)
    const seenIds = new Set<string>();
    const seenFingerprints = new Set<string>();
    const uniqueLogs: AdminAuditLog[] = [];

    // Prioritize remote records if available, otherwise local records
    const combined = [...remoteLogs, ...localLogs];

    for (const log of combined) {
      if (!log || !log.id) continue;

      if (seenIds.has(log.id)) {
        continue;
      }

      const fp = getFingerprint(log);
      if (seenFingerprints.has(fp)) {
        continue;
      }

      seenIds.add(log.id);
      seenFingerprints.add(fp);
      uniqueLogs.push(log);
    }

    // Save back deduplicated list to local storage to keep it clean
    saveLocalLogs(uniqueLogs);

    return uniqueLogs.sort(
      (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  }

  static async clearAuditLogs(): Promise<void> {
    saveLocalLogs([]);
    recentLogsMap.clear();
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('admin_audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (_) {}
    }
  }
}


