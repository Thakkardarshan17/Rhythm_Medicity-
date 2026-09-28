import React, { useState, useEffect } from 'react';
import { ShieldCheck, History, User, Mail, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuditService } from '../../services/auditService';
import { AdminAuditLog } from '../../types/database';
import { formatDate } from '../../utils/formatters';

export const AdminProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await AuditService.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-[#006655] tracking-tight">
          Admin Profile & Operational Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View authorized administrator credentials and immutable system activity logs.
        </p>
      </div>

      {/* Admin Account Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E0F2ED] text-[#004C3D] flex items-center justify-center font-bold text-2xl border border-[#E0F2ED]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#006655]">
              {profile?.full_name || 'System Administrator'}
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email || 'admin@rhythmmedicity.internal'}</span>
            </div>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2ED] text-[#004C3D] uppercase">
              ROLE: AUTHORIZED ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Administrative Audit Logs (Prompt Section 64) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6 sm:p-8">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <History className="w-5 h-5 text-[#006655]" />
          <div>
            <h3 className="text-base font-bold text-[#006655]">System Activity Audit Log</h3>
            <p className="text-xs text-slate-400">Chronological trail of administrative actions.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#006655] mx-auto" />
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 uppercase px-2 py-0.5 rounded bg-slate-100 text-[10px]">
                      {log.action}
                    </span>
                    <span className="font-semibold text-[#004C3D]">{log.entity_type}</span>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
                <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No audit events recorded yet. Actions such as adding doctors, editing specialities, or saving settings will be logged here.
          </div>
        )}
      </div>
    </div>
  );
};
