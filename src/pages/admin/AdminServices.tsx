import React, { useState, useEffect } from 'react';
import { BriefcaseMedical, Plus, Edit2, Trash2, X, Loader2, Search } from 'lucide-react';
import { ServiceService } from '../../services/serviceService';
import { AuditService } from '../../services/auditService';
import { HospitalService, EntityStatus } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export const AdminServices: React.FC = () => {
  const { showToast } = useToast();
  const [services, setServices] = useState<HospitalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<HospitalService | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HospitalService | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<HospitalService>>({
    name: '',
    slug: '',
    description: '',
    display_order: 0,
    status: 'active',
  });

  const loadData = async () => {
    try {
      const data = await ServiceService.getAllServicesAdmin();
      setServices(data);
    } catch (err) {
      console.error('Error fetching admin services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      display_order: services.length,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (serv: HospitalService) => {
    setEditingService(serv);
    setFormData({
      name: serv.name,
      slug: serv.slug,
      description: serv.description || '',
      display_order: serv.display_order,
      status: serv.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('Service name is required.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        await ServiceService.updateService(editingService.id, formData);
        await AuditService.logAction('UPDATE', 'SERVICE', editingService.id, {
          name: formData.name,
        });
        showToast('Service updated successfully.', 'success');
      } else {
        const created = await ServiceService.createService(formData);
        await AuditService.logAction('CREATE', 'SERVICE', created.id, {
          name: formData.name,
        });
        showToast('Service added successfully.', 'success');
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save service', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await ServiceService.deleteService(deleteTarget.id);
      await AuditService.logAction('DELETE', 'SERVICE', deleteTarget.id, {
        name: deleteTarget.name,
      });
      showToast('Service removed.', 'info');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete service', 'error');
    }
  };

  const handleToggleStatus = async (serv: HospitalService) => {
    try {
      const newStatus: EntityStatus = serv.status === 'active' ? 'inactive' : 'active';
      await ServiceService.updateService(serv.id, { status: newStatus });
      showToast(`Service marked as ${newStatus}.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#006655] tracking-tight">
            Hospital Services & Facilities
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage clinical facilities, diagnostics, intensive care, and day procedures.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospital services..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655]"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Services: {services.length}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-3.5">Service Name</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Display Order</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((serv) => (
                  <tr key={serv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-[#006655] text-sm">
                      {serv.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {serv.description || 'No description added.'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      {serv.display_order}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(serv)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          serv.status === 'active'
                            ? 'bg-[#E0F2ED] text-[#006655] border border-[#006655]/20'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {serv.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(serv)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#006655] hover:bg-slate-100 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(serv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <BriefcaseMedical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Services Configured</p>
            <p className="text-slate-400 mt-1">Click "Add Service" to register hospital clinical facilities.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003329]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#006655]">
                {editingService ? 'Edit Hospital Service' : 'Add New Hospital Service'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 24x7 Emergency, Intensive Care"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of medical equipment or department..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#006655] text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingService ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Hospital Service?"
        message={`Are you sure you want to delete ${deleteTarget?.name}?`}
        confirmText="Delete Service"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
