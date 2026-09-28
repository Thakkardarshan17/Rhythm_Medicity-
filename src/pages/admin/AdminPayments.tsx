import React, { useState, useEffect } from 'react';
import { CreditCard, Search, ShieldCheck, CheckCircle2, Clock, XCircle, Filter } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PaymentTransaction } from '../../types/database';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { useDropdownOptions } from '../../contexts/DropdownContext';

interface PaymentWithAppointment extends PaymentTransaction {
  appointment?: {
    appointment_number: string;
    patient_name: string;
    doctor_name_snapshot: string;
  };
}

export const AdminPayments: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentWithAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { options: paymentStatusOptions } = useDropdownOptions('payment_status');

  const loadPayments = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*, appointment:appointments(appointment_number, patient_name, doctor_name_snapshot)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.order_id.toLowerCase().includes(q) ||
      (t.payment_id && t.payment_id.toLowerCase().includes(q)) ||
      (t.appointment?.patient_name && t.appointment.patient_name.toLowerCase().includes(q)) ||
      (t.appointment?.appointment_number && t.appointment.appointment_number.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#006655] tracking-tight">
            Payment Transactions Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of verified payment orders, transaction references, and gateway logs.
          </p>
        </div>
      </div>

      {/* Search & Status Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, Payment ID, Patient..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655]"
          />
        </div>

        {/* Dynamic Status Filter (Admin Controlled Dropdown) */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006655]"
          >
            <option value="ALL">All Payment Statuses</option>
            {paymentStatusOptions.map((opt) => (
              <option key={opt.id} value={opt.code || opt.name}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Transactions: {filtered.length}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-3.5">Appointment No</th>
                  <th className="px-6 py-3.5">Patient & Doctor</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Gateway Provider</th>
                  <th className="px-6 py-3.5">Order / Payment ID</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-[#004C3D]">
                      #{tx.appointment?.appointment_number || '--'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#006655]">{tx.appointment?.patient_name || 'Patient'}</div>
                      <div className="text-[11px] text-slate-400">{tx.appointment?.doctor_name_snapshot || 'Doctor'}</div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[#006655]">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="uppercase font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {tx.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="font-mono text-[11px] text-slate-800">{tx.order_id}</div>
                      {tx.payment_id && (
                        <div className="font-mono text-[10px] text-slate-400">Ref: {tx.payment_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'PAID'
                            ? 'bg-[#E0F2ED] text-[#006655] border border-[#006655]/20'
                            : tx.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {tx.status === 'PAID' && <CheckCircle2 className="w-3 h-3 text-[#006655]" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                      {tx.verified_at ? formatDate(tx.verified_at) : formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Payment Records</p>
            <p className="text-slate-400 mt-1">Payment transactions will appear here as appointments are booked and verified.</p>
          </div>
        )}
      </div>
    </div>
  );
};
