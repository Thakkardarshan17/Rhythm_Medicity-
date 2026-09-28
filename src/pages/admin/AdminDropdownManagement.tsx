import React, { useState, useEffect, useMemo } from 'react';
import {
  ListFilter,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  GripVertical,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Layers,
  Stethoscope,
  Users,
  Calendar,
  CreditCard,
  Building2,
  FolderPlus,
  Eye,
  Info,
  ChevronRight,
  AlertTriangle,
  Loader2,
  X,
  HelpCircle,
  Filter,
} from 'lucide-react';
import {
  DropdownCategory,
  DropdownOption,
  DropdownCategoryGroup,
  DropdownReferenceCheckResult,
} from '../../types/dropdown';
import { DropdownService } from '../../services/dropdownService';
import { useDropdowns } from '../../contexts/DropdownContext';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeleton';

const CATEGORY_GROUPS: { name: DropdownCategoryGroup; icon: any; color: string; bg: string }[] = [
  { name: 'Doctor Related', icon: Stethoscope, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { name: 'Patient Related', icon: Users, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { name: 'Appointment Related', icon: Calendar, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  { name: 'Payment Related', icon: CreditCard, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  { name: 'Hospital Related', icon: Building2, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { name: 'Custom Categories', icon: FolderPlus, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
];

export const AdminDropdownManagement: React.FC = () => {
  const { showToast } = useToast();
  const { categories, options, refreshDropdowns, loading: contextLoading } = useDropdowns();

  // Active Category & Group State
  const [selectedGroup, setSelectedGroup] = useState<DropdownCategoryGroup | 'ALL'>('ALL');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('doctor_specialization');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchOption, setSearchOption] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Modals state
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DropdownCategory | null>(null);

  // Deletion / Reference check state
  const [deleteTargetOption, setDeleteTargetOption] = useState<DropdownOption | null>(null);
  const [referenceModalData, setReferenceModalData] = useState<{
    option: DropdownOption;
    refCheck: DropdownReferenceCheckResult;
  } | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

  // Processing state
  const [actionLoading, setActionLoading] = useState(false);
  const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null);

  // Option Form State
  const [optionFormData, setOptionFormData] = useState({
    name: '',
    code: '',
    description: '',
    display_order: 1,
    status: 'active' as 'active' | 'inactive',
  });

  // Category Form State
  const [categoryFormData, setCategoryFormData] = useState({
    category_key: '',
    name: '',
    group: 'Custom Categories' as DropdownCategoryGroup,
    description: '',
  });

  // Current Selected Category
  const currentCategory = useMemo(() => {
    return categories.find((c) => c.category_key === selectedCategoryKey) || categories[0];
  }, [categories, selectedCategoryKey]);

  // Set default category if key not found
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.category_key === selectedCategoryKey)) {
      setSelectedCategoryKey(categories[0].category_key);
    }
  }, [categories, selectedCategoryKey]);

  // Filtered categories for sidebar/selector
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchGroup = selectedGroup === 'ALL' || c.group === selectedGroup;
      const matchSearch =
        searchCategory === '' ||
        c.name.toLowerCase().includes(searchCategory.toLowerCase()) ||
        c.category_key.toLowerCase().includes(searchCategory.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [categories, selectedGroup, searchCategory]);

  // Options for current selected category
  const categoryOptions = useMemo(() => {
    if (!currentCategory) return [];
    return options
      .filter((o) => o.category_key === currentCategory.category_key)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [options, currentCategory]);

  // Filtered Options for current view
  const filteredOptions = useMemo(() => {
    return categoryOptions.filter((o) => {
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchSearch =
        searchOption === '' ||
        o.name.toLowerCase().includes(searchOption.toLowerCase()) ||
        o.code.toLowerCase().includes(searchOption.toLowerCase()) ||
        (o.description && o.description.toLowerCase().includes(searchOption.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [categoryOptions, statusFilter, searchOption]);

  // Statistics for current category
  const stats = useMemo(() => {
    const total = categoryOptions.length;
    const active = categoryOptions.filter((o) => o.status === 'active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [categoryOptions]);

  // Open Add Option Modal
  const openAddOptionModal = () => {
    const nextOrder = categoryOptions.length + 1;
    setEditingOption(null);
    setOptionFormData({
      name: '',
      code: '',
      description: '',
      display_order: nextOrder,
      status: 'active',
    });
    setOptionModalOpen(true);
  };

  // Open Edit Option Modal
  const openEditOptionModal = (opt: DropdownOption) => {
    setEditingOption(opt);
    setOptionFormData({
      name: opt.name,
      code: opt.code,
      description: opt.description || '',
      display_order: opt.display_order || 1,
      status: opt.status,
    });
    setOptionModalOpen(true);
  };

  // Save Option (Add / Edit)
  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionFormData.name.trim()) {
      showToast('Option name is required.', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      if (editingOption) {
        // Edit
        const res = await DropdownService.updateOption(editingOption.id, {
          name: optionFormData.name.trim(),
          code: optionFormData.code.trim() || undefined,
          description: optionFormData.description.trim() || undefined,
          display_order: Number(optionFormData.display_order),
          status: optionFormData.status,
        });

        if (res.success) {
          showToast(`✓ Option '${optionFormData.name}' updated successfully.`, 'success');
          setOptionModalOpen(false);
          await refreshDropdowns();
        } else {
          showToast(res.error || 'Failed to update option.', 'error');
        }
      } else {
        // Add
        const res = await DropdownService.createOption({
          category_key: currentCategory.category_key,
          name: optionFormData.name.trim(),
          code: optionFormData.code.trim() || undefined,
          description: optionFormData.description.trim() || undefined,
          display_order: Number(optionFormData.display_order),
          status: optionFormData.status,
        });

        if (res.success) {
          showToast(`✓ Option '${optionFormData.name}' added to ${currentCategory.name}.`, 'success');
          setOptionModalOpen(false);
          await refreshDropdowns();
        } else {
          showToast(res.error || 'Failed to add option.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Active / Inactive
  const handleToggleStatus = async (opt: DropdownOption) => {
    setActionLoading(true);
    try {
      const res = await DropdownService.toggleOptionStatus(opt.id);
      if (res.success) {
        const statusLabel = res.data?.status === 'active' ? 'Activated' : 'Deactivated';
        showToast(`✓ ${statusLabel} '${opt.name}'.`, 'info');
        await refreshDropdowns();
      } else {
        showToast(res.error || 'Failed to toggle status.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Toggle failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Move Option Up / Down (Reordering)
  const handleMoveOption = async (opt: DropdownOption, direction: 'up' | 'down') => {
    const currentIndex = categoryOptions.findIndex((o) => o.id === opt.id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categoryOptions.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newOrderedList = [...categoryOptions];
    const [movedItem] = newOrderedList.splice(currentIndex, 1);
    newOrderedList.splice(targetIndex, 0, movedItem);

    const orderedIds = newOrderedList.map((o) => o.id);

    try {
      const res = await DropdownService.reorderOptions(currentCategory.category_key, orderedIds);
      if (res.success) {
        showToast(`✓ Reordered '${opt.name}'.`, 'info');
        await refreshDropdowns();
      }
    } catch (err: any) {
      showToast(err.message || 'Reorder failed.', 'error');
    }
  };

  // Drag and Drop reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedOptionId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedOptionId || draggedOptionId === targetId) return;

    const dragIndex = categoryOptions.findIndex((o) => o.id === draggedOptionId);
    const dropIndex = categoryOptions.findIndex((o) => o.id === targetId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newOrderedList = [...categoryOptions];
    const [movedItem] = newOrderedList.splice(dragIndex, 1);
    newOrderedList.splice(dropIndex, 0, movedItem);

    const orderedIds = newOrderedList.map((o) => o.id);
    setDraggedOptionId(null);

    try {
      const res = await DropdownService.reorderOptions(currentCategory.category_key, orderedIds);
      if (res.success) {
        showToast(`✓ Updated display order.`, 'success');
        await refreshDropdowns();
      }
    } catch (err: any) {
      showToast(err.message || 'Reordering failed.', 'error');
    }
  };

  // Safe Deletion Handler
  const handleDeleteOptionClick = async (opt: DropdownOption) => {
    setActionLoading(true);
    try {
      const refCheck = await DropdownService.checkOptionReferences(
        opt.category_key,
        opt.name,
        opt.code
      );

      if (refCheck.isReferenced) {
        // Show safe reference warning modal
        setReferenceModalData({ option: opt, refCheck });
      } else {
        // Direct confirmation dialog for safe deletion
        setDeleteTargetOption(opt);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to check option usage.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetOption) return;
    setActionLoading(true);
    try {
      const res = await DropdownService.deleteOption(deleteTargetOption.id, false);
      if (res.success) {
        showToast(`✓ Deleted option '${deleteTargetOption.name}'.`, 'success');
        setDeleteTargetOption(null);
        await refreshDropdowns();
      } else {
        showToast(res.error || 'Failed to delete option.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Delete failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click Deactivate from Reference Modal
  const handleDeactivateReferencedOption = async () => {
    if (!referenceModalData) return;
    setActionLoading(true);
    try {
      const res = await DropdownService.updateOption(referenceModalData.option.id, {
        status: 'inactive',
      });
      if (res.success) {
        showToast(
          `✓ Deactivated '${referenceModalData.option.name}'. Historical records preserved!`,
          'success'
        );
        setReferenceModalData(null);
        await refreshDropdowns();
      }
    } catch (err: any) {
      showToast(err.message || 'Deactivate failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Custom Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      showToast('Category name is required.', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const res = await DropdownService.createCategory({
        category_key: categoryFormData.category_key.trim() || categoryFormData.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: categoryFormData.name.trim(),
        group: categoryFormData.group,
        description: categoryFormData.description.trim() || undefined,
      });

      if (res.success && res.data) {
        showToast(`✓ Category '${categoryFormData.name}' created!`, 'success');
        setCategoryModalOpen(false);
        setSelectedCategoryKey(res.data.category_key);
        await refreshDropdowns();
      } else {
        showToast(res.error || 'Failed to create category.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Category creation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Restore defaults
  const handleRestoreDefaults = async () => {
    setActionLoading(true);
    try {
      await DropdownService.restoreDefaults(currentCategory.category_key);
      showToast(`✓ Restored default options for '${currentCategory.name}'.`, 'success');
      setRestoreModalOpen(false);
      await refreshDropdowns();
    } catch (err: any) {
      showToast(err.message || 'Restore failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Hero Header ── */}
      <div className="bg-gradient-to-r from-[#003329] via-[#004C3D] to-[#002820] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#C4A760]/30 relative overflow-hidden">
        {/* Background glow emblem */}
        <div className="absolute right-4 -bottom-10 opacity-10 pointer-events-none w-64 h-64">
          <img src="/emblem.png" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C4A760]/20 border border-[#C4A760]/40 text-[#C4A760] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Master Data & Dropdown Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Dropdown Management
            </h1>
            <p className="text-sm text-[#93D3C3] leading-relaxed">
              Centralized administrative control over all selectable options, codes, order, and
              lifecycles across Patient Booking, Doctor Portals, and Hospital Operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setCategoryFormData({
                  category_key: '',
                  name: '',
                  group: 'Custom Categories',
                  description: '',
                });
                setCategoryModalOpen(true);
              }}
              className="btn-premium px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 border border-white/20 backdrop-blur-sm transition active:scale-95"
            >
              <FolderPlus className="w-4 h-4 text-[#C4A760]" />
              <span>+ New Category</span>
            </button>

            <button
              onClick={openAddOptionModal}
              className="btn-premium px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C4A760] to-[#B0934C] hover:from-[#d6b972] hover:to-[#C4A760] text-white font-bold text-xs shadow-lg shadow-[#C4A760]/20 flex items-center gap-2 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Option</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Category Selector (Left/Top) + Option Management (Right/Bottom) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Category Navigation (4 cols) ── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#003329] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C4A760]" />
                <span>Dropdown Categories</span>
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {categories.length} total
              </span>
            </div>

            {/* Group Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              <button
                onClick={() => setSelectedGroup('ALL')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                  selectedGroup === 'ALL'
                    ? 'bg-[#003329] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {CATEGORY_GROUPS.map((g) => {
                const active = selectedGroup === g.name;
                const count = categories.filter((c) => c.group === g.name).length;
                if (count === 0 && g.name === 'Custom Categories') return null;
                return (
                  <button
                    key={g.name}
                    onClick={() => setSelectedGroup(g.name)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition flex items-center gap-1 ${
                      active
                        ? 'bg-[#003329] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{g.name.replace(' Related', '')}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Category Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
              />
              {searchCategory && (
                <button
                  onClick={() => setSearchCategory('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Scrollable List */}
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isSelected = cat.category_key === selectedCategoryKey;
                const optCount = options.filter((o) => o.category_key === cat.category_key).length;
                const activeOptCount = options.filter(
                  (o) => o.category_key === cat.category_key && o.status === 'active'
                ).length;

                return (
                  <button
                    key={cat.category_key}
                    onClick={() => {
                      setSelectedCategoryKey(cat.category_key);
                      setSearchOption('');
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#003329] text-white shadow-md font-semibold translate-x-1'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800 border border-slate-200/50'
                    }`}
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{cat.name}</span>
                        {!cat.is_system && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                              isSelected
                                ? 'bg-[#C4A760] text-slate-900 font-bold'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? 'text-[#93D3C3]' : 'text-slate-500'
                        }`}
                      >
                        {cat.group} • {cat.category_key}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isSelected
                            ? 'bg-[#004C3D] text-[#C4A760] border border-[#006655]'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {activeOptCount}/{optCount}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected
                            ? 'text-[#C4A760] translate-x-0.5'
                            : 'text-slate-400 group-hover:translate-x-0.5'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No matching dropdown category found.
                </div>
              )}
            </div>
          </div>

          {/* ── Live Form Preview Box ── */}
          {currentCategory && (
            <div className="bg-gradient-to-br from-[#FAF8F5] to-[#F3EFE6] rounded-2xl p-4 border border-[#C4A760]/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-[#003329] font-bold">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#C4A760]" />
                  Live Form Rendering Preview
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Realtime Sync
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  {currentCategory.name} <span className="text-rose-500">*</span>
                </label>
                <select className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003329]">
                  <option value="">-- Select {currentCategory.name} --</option>
                  {categoryOptions
                    .filter((o) => o.status === 'active')
                    .map((opt) => (
                      <option key={opt.id} value={opt.code || opt.name}>
                        {opt.name} ({opt.code})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-500 italic">
                  Showing {stats.active} active options in real-time dropdown.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Option Management Table & Controls (8 cols) ── */}
        <div className="lg:col-span-8 space-y-4">
          {currentCategory && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 space-y-5">
              {/* Category Title & Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#003329]">
                      {currentCategory.name}
                    </h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#003329]/10 text-[#003329]">
                      {currentCategory.category_key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {currentCategory.description || 'Manage selectable values and sequence for this master field.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-600">
                      Total: <strong className="text-slate-900">{stats.total}</strong>
                    </span>
                    <span className="text-emerald-700">
                      Active: <strong>{stats.active}</strong>
                    </span>
                    {stats.inactive > 0 && (
                      <span className="text-amber-700">
                        Inactive: <strong>{stats.inactive}</strong>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setRestoreModalOpen(true)}
                    title="Restore default factory options for this category"
                    className="p-2 rounded-xl text-slate-500 hover:text-[#003329] hover:bg-slate-100 border border-slate-200 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search in ${currentCategory.name}...`}
                    value={searchOption}
                    onChange={(e) => setSearchOption(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                  />
                  {searchOption && (
                    <button
                      onClick={() => setSearchOption('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
                      statusFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
                      statusFilter === 'active'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Active ({stats.active})
                  </button>
                  <button
                    onClick={() => setStatusFilter('inactive')}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
                      statusFilter === 'inactive'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Inactive ({stats.inactive})
                  </button>
                </div>

                <button
                  onClick={openAddOptionModal}
                  className="btn-premium px-4 py-2 rounded-xl bg-[#003329] hover:bg-[#004C3D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 text-[#C4A760]" />
                  <span>Add Option</span>
                </button>
              </div>

              {/* ── Table (Desktop / Tablet) + Touch Cards (Mobile) ── */}
              {contextLoading ? (
                <TableSkeleton rows={6} />
              ) : (
                <>
                  {/* Desktop / Tablet Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#003329] text-[#93D3C3] font-bold uppercase text-[11px] tracking-wider border-b border-[#004C3D]">
                          <th className="py-3 px-3 w-12 text-center">Order</th>
                          <th className="py-3 px-4">Option Name</th>
                          <th className="py-3 px-3">Code</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                        {filteredOptions.map((opt, index) => {
                          const isActive = opt.status === 'active';
                          return (
                            <tr
                              key={opt.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, opt.id)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, opt.id)}
                              className={`hover:bg-amber-50/40 transition-colors group ${
                                !isActive ? 'bg-slate-50/60 opacity-75' : ''
                              } ${draggedOptionId === opt.id ? 'opacity-40 bg-amber-100' : ''}`}
                            >
                              {/* Order & Drag Handle */}
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-slate-400">
                                  <GripVertical className="w-4 h-4 cursor-grab text-slate-400 group-hover:text-[#003329]" />
                                  <span className="font-mono font-bold text-[11px] text-slate-700">
                                    {opt.display_order}
                                  </span>
                                </div>
                              </td>

                              {/* Option Name */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {opt.name}
                                  </span>
                                </div>
                              </td>

                              {/* Code */}
                              <td className="py-3 px-3">
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                                  {opt.code}
                                </span>
                              </td>

                              {/* Description */}
                              <td className="py-3 px-4 text-slate-500 max-w-[220px] truncate text-[11px]">
                                {opt.description || '—'}
                              </td>

                              {/* Status Badge & Toggle */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleToggleStatus(opt)}
                                  title={`Click to ${isActive ? 'Deactivate' : 'Activate'}`}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                                    isActive
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                >
                                  {isActive ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Active</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 text-slate-500" />
                                      <span>Inactive</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Up / Down Reorder */}
                                  <button
                                    onClick={() => handleMoveOption(opt, 'up')}
                                    disabled={index === 0}
                                    title="Move Up"
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                  >
                                    <MoveUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveOption(opt, 'down')}
                                    disabled={index === categoryOptions.length - 1}
                                    title="Move Down"
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                  >
                                    <MoveDown className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit */}
                                  <button
                                    onClick={() => openEditOptionModal(opt)}
                                    title="Edit Option"
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-[#003329] hover:bg-slate-100 transition"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete / Deactivate */}
                                  <button
                                    onClick={() => handleDeleteOptionClick(opt)}
                                    title="Delete or Deactivate Option"
                                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredOptions.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              <p className="text-xs font-semibold">No dropdown options found.</p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Click "+ Add Option" above to create the first option for this category.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Touch Cards View (Under 768px) */}
                  <div className="md:hidden space-y-3">
                    {filteredOptions.map((opt, index) => {
                      const isActive = opt.status === 'active';
                      return (
                        <div
                          key={opt.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isActive
                              ? 'bg-white border-slate-200 shadow-sm'
                              : 'bg-slate-50 border-slate-200/80 opacity-75'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  #{opt.display_order}
                                </span>
                                <h3 className="text-xs font-bold text-slate-900">{opt.name}</h3>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {opt.code}
                                </span>
                                {opt.description && (
                                  <span className="truncate max-w-[180px]">{opt.description}</span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleStatus(opt)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition shrink-0 ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveOption(opt, 'up')}
                                disabled={index === 0}
                                className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold disabled:opacity-30"
                              >
                                ↑ Up
                              </button>
                              <button
                                onClick={() => handleMoveOption(opt, 'down')}
                                disabled={index === categoryOptions.length - 1}
                                className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold disabled:opacity-30"
                              >
                                ↓ Down
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditOptionModal(opt)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteOptionClick(opt)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredOptions.length === 0 && (
                      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs font-semibold">No dropdown options found.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Option Modal ── */}
      {optionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#003329] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-[#C4A760]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {editingOption ? 'Edit Dropdown Option' : 'Add Dropdown Option'}
                  </h3>
                  <p className="text-[11px] text-[#93D3C3]">
                    Category: <span className="font-bold text-white">{currentCategory.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOptionModalOpen(false)}
                className="p-1.5 rounded-lg text-[#93D3C3] hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveOption} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Option Name / Display Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology & Interventional Cardiology"
                  value={optionFormData.name}
                  onChange={(e) => setOptionFormData({ ...optionFormData, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Short Code / Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CARD"
                    value={optionFormData.code}
                    onChange={(e) =>
                      setOptionFormData({ ...optionFormData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                  />
                  <p className="text-[10px] text-slate-500">Auto-generated if left blank</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={optionFormData.display_order}
                    onChange={(e) =>
                      setOptionFormData({
                        ...optionFormData,
                        display_order: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Description / Clinical Subtext
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of this option..."
                  value={optionFormData.description}
                  onChange={(e) =>
                    setOptionFormData({ ...optionFormData, description: e.target.value })
                  }
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Status</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={optionFormData.status === 'active'}
                      onChange={() => setOptionFormData({ ...optionFormData, status: 'active' })}
                      className="text-[#003329] focus:ring-[#003329]"
                    />
                    <span>Active (Available in new forms)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={optionFormData.status === 'inactive'}
                      onChange={() => setOptionFormData({ ...optionFormData, status: 'inactive' })}
                      className="text-[#003329] focus:ring-[#003329]"
                    />
                    <span>Inactive (Historical only)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOptionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-premium px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003329] to-[#004C3D] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C4A760]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#C4A760]" />
                  )}
                  <span>{editingOption ? 'Save Changes' : 'Save Option'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Category Modal ── */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#003329] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-[#C4A760]">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Create Dropdown Category</h3>
                  <p className="text-[11px] text-[#93D3C3]">Define a new master data field group</p>
                </div>
              </div>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-[#93D3C3] hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ambulance Type, Insurance Provider"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value,
                      category_key: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    })
                  }
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Category Key (Slug)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ambulance_type"
                    value={categoryFormData.category_key}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, category_key: e.target.value })
                    }
                    className="w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Category Group</label>
                  <select
                    value={categoryFormData.group}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        group: e.target.value as DropdownCategoryGroup,
                      })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                  >
                    {CATEGORY_GROUPS.map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Description</label>
                <textarea
                  rows={2}
                  placeholder="Purpose of this category..."
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003329]/20 focus:border-[#003329]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-premium px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003329] to-[#004C3D] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C4A760]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#C4A760]" />
                  )}
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Safe Deactivation / Reference Warning Modal ── */}
      {referenceModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-amber-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-500 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Cannot Hard-Delete Option</h3>
                  <p className="text-[11px] text-amber-100">Historical records safety protection</p>
                </div>
              </div>
              <button
                onClick={() => setReferenceModalData(null)}
                className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
                <p className="font-bold text-amber-950">
                  Option: <span className="underline">{referenceModalData.option.name}</span>
                </p>
                <p className="leading-relaxed">
                  This option is actively referenced in{' '}
                  <strong>{referenceModalData.refCheck.totalReferences}</strong> existing database
                  record(s). Deleting it physically would break patient history, doctors, or confirmed
                  appointments.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700">Referenced Records Breakdown:</h4>
                <ul className="text-[11px] text-slate-600 space-y-1 pl-1">
                  {referenceModalData.refCheck.details.map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{d.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Recommended Action: Deactivate
                </p>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  Deactivating this option will hide it from future forms while preserving existing
                  historical records.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReferenceModalData(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeactivateReferencedOption}
                  disabled={actionLoading}
                  className="btn-premium px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Deactivate Instead</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Unreferenced Delete Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetOption)}
        title="Delete Dropdown Option?"
        message={`Are you sure you want to permanently delete '${deleteTargetOption?.name}'? This option has no active references and will be removed.`}
        confirmText="Delete Option"
        cancelText="Keep"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetOption(null)}
      />

      {/* ── Restore Defaults Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={restoreModalOpen}
        title={`Restore Defaults for ${currentCategory.name}?`}
        message={`This will reset options for '${currentCategory.name}' to the standard factory presets. Any customized order or additions in this category will be restored.`}
        confirmText="Restore Standard Defaults"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={handleRestoreDefaults}
        onCancel={() => setRestoreModalOpen(false)}
      />
    </div>
  );
};
