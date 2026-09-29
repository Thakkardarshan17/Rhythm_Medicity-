import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Edit2, Trash2, X, Loader2, Search } from 'lucide-react';
import { SpecialityService } from '../../services/specialityService';
import { AuditService } from '../../services/auditService';
import { Speciality, EntityStatus } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export const AdminSpecialities: React.FC = () => {
  const { showToast } = useToast();
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpeciality, setEditingSpeciality] = useState<Speciality | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Speciality | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Speciality>>({
    name: '',
    slug: '',
    description: '',
    display_order: 0,
    status: 'active',
  });

  const loadData = async () => {
    try {
      const data = await SpecialityService.getAllSpecialitiesAdmin();
      setSpecialities(data);
    } catch (err) {
      console.error('Error fetching admin specialities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('rhythm_specialities_changed', handleSync);
    return () => {
      window.removeEventListener('rhythm_specialities_changed', handleSync);
    };
  }, []);

  const openAddModal = () => {
    setEditingSpeciality(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      display_order: specialities.length,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (spec: Speciality) => {
    setEditingSpeciality(spec);
    setFormData({
      name: spec.name,
      slug: spec.slug,
      description: spec.description || '',
      display_order: spec.display_order,
      status: spec.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('Speciality name is required.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingSpeciality) {
        await SpecialityService.updateSpeciality(editingSpeciality.id, formData);
        await AuditService.logAction('UPDATE', 'SPECIALITY', editingSpeciality.id, {
          name: formData.name,
        });
        showToast('Speciality updated successfully.', 'success');
      } else {
        const created = await SpecialityService.createSpeciality(formData);
        await AuditService.logAction('CREATE', 'SPECIALITY', created.id, {
          name: formData.name,
        });
        showToast('Speciality created successfully.', 'success');
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save speciality', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await SpecialityService.deleteSpeciality(deleteTarget.id);
      await AuditService.logAction('DELETE', 'SPECIALITY', deleteTarget.id, {
        name: deleteTarget.name,
      });
      showToast('Speciality removed permanently from database.', 'info');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete speciality', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (spec: Speciality) => {
    try {
      const newStatus: EntityStatus = spec.status === 'active' ? 'inactive' : 'active';
      await SpecialityService.updateSpeciality(spec.id, { status: newStatus });
      showToast(`Speciality marked as ${newStatus}.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const filtered = specialities.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#006655] tracking-tight">
            Speciality Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure clinical departments, medical disciplines, and public display priority.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Speciality</span>
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
            placeholder="Search specialities..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006655]"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Specialities: {specialities.length}
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
                  <th className="px-6 py-3.5">Department Name</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Display Order</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((spec) => (
                  <tr key={spec.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-[#006655] text-sm">
                      {spec.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {spec.description || 'No description added.'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      {spec.display_order}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(spec)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          spec.status === 'active'
                            ? 'bg-[#E0F2ED] text-[#006655] border border-[#006655]/20'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {spec.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(spec)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#006655] hover:bg-slate-100 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(spec)}
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
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Specialities Configured</p>
            <p className="text-slate-400 mt-1">Click "Add Speciality" to configure departments.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003329]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#006655]">
                {editingSpeciality ? 'Edit Speciality' : 'Add New Medical Speciality'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Speciality Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cardiology, Neurology"
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
                  placeholder="Brief clinical overview..."
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
                  <span>{editingSpeciality ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Speciality?"
        message={`Are you sure you want to delete ${deleteTarget?.name}? Doctors attached to this speciality may be affected.`}
        confirmText="Delete Speciality"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
