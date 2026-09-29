import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface RealtimeSubscriptionOptions {
  table: 'doctors' | 'specialities' | 'services' | 'banners' | 'appointments';
  customEventName?: string;
  onUpdate: () => void;
}

/**
 * Universal hook for live real-time synchronization between Admin and Public pages.
 * Listens to:
 * 1. Supabase Postgres Realtime channel (broadcast from database across all browser tabs/clients)
 * 2. Window CustomEvents (instantaneous same-browser instant sync without network roundtrip)
 */
export function useRealtimeSync({ table, customEventName, onUpdate }: RealtimeSubscriptionOptions) {
  useEffect(() => {
    // 1. Listen to instant local window custom events
    const eventName = customEventName || `rhythm_${table}_changed`;
    const handleLocalEvent = () => {
      onUpdate();
    };

    window.addEventListener(eventName, handleLocalEvent);

    // 2. Listen to Supabase Realtime Postgres Changes if configured
    let channel: any = null;
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel(`public:${table}:${Math.random().toString(36).substring(2, 7)}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener(eventName, handleLocalEvent);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, customEventName, onUpdate]);
}
