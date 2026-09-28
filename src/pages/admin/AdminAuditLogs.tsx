import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Download,
  Calendar,
  User,
  Clock,
  FileCode,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AuditService } from '../../services/auditService';
import { AdminAuditLog } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, formatTime } from '../../utils/formatters';

export const AdminAuditLogs: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await AuditService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all administrative audit logs? This action cannot be undone.')) {
      return;
    }
    try {
      await AuditService.clearAuditLogs();
      setLogs([]);
      showToast('Audit logs cleared successfully.', 'info');
    } catch (err) {
      showToast('Failed to clear logs', 'error');
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      showToast('No logs available to export', 'warning');
      return;
    }
    const headers = ['ID', 'Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Metadata'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.created_at,
      l.metadata?.actor || 'Administrator',
      l.action,
      l.entity_type,
      l.entity_id || 'N/A',
      JSON.stringify(l.metadata || {}).replace(/"/g, '""'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rhythm_medicity_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit logs to CSV', 'success');
  };

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    const actionMatch = selectedAction === 'ALL' || log.action.toLowerCase().includes(selectedAction.toLowerCase());
    const entityMatch = selectedEntityType === 'ALL' || log.entity_type.toLowerCase() === selectedEntityType.toLowerCase();

    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.entity_type.toLowerCase().includes(q) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(q)) ||
      (log.metadata?.actor && log.metadata.actor.toLowerCase().includes(q)) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(q);

    return actionMatch && entityMatch && matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('cancel')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (act.includes('create') || act.includes('insert') || act.includes('confirm')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (act.includes('update') || act.includes('edit')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (act.includes('status')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#006655]/10 text-[#006655] flex items-center justify-center font-bold shadow-inner">
            <ShieldAlert className="w-6 h-6 text-[#006655]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Administrative Audit Logs
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive real-time tracking of administrative actions, data modifications, and patient booking events.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, ID, or changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006655]/20 focus:border-[#006655] transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Entity Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entity:</span>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#006655]"
            >
              <option value="ALL">All Entities</option>
              <option value="doctor">Doctors</option>
              <option value="speciality">Specialities</option>
              <option value="service">Services</option>
              <option value="appointment">Appointments</option>
              <option value="payment">Payments</option>
              <option value="hospital_settings">Hospital Settings</option>
              <option value="letter_settings">Letter Settings</option>
              <option value="banner">Banners</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#006655]"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create / Add</option>
              <option value="UPDATE">Update / Edit</option>
              <option value="DELETE">Delete</option>
              <option value="STATUS">Status Change</option>
              <option value="PAYMENT">Payment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#006655] mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading audit history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No Audit Logs Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No administrative logs matched the specified search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Entity ID</th>
                  <th className="py-3.5 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      <div className="font-semibold text-slate-800">{formatDate(log.created_at)}</div>
                      <div className="text-[10px] text-slate-400">{formatTime(log.created_at)}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black border uppercase tracking-wider ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] capitalize">
                        {log.entity_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.metadata?.actor || 'Administrator'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                      {log.entity_id ? (
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {log.entity_id.length > 18 ? `${log.entity_id.substring(0, 14)}...` : log.entity_id}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#006655] hover:text-white text-slate-700 text-xs font-bold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-[#C4A760]" />
                </div>
                <div>
                  <h3 className="text-base font-black">Audit Log Details</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Action</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedLog.action}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Entity</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block capitalize">{selectedLog.entity_type}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Actor</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
                    {selectedLog.metadata?.actor || 'Administrator'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 sm:col-span-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Timestamp</span>
                  <span className="font-mono text-slate-700 mt-0.5 block">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Metadata & Payload Changes
                </h4>
                <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                  <pre>{JSON.stringify(selectedLog.metadata || {}, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
