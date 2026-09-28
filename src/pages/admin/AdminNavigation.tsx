import React, { useState, useEffect } from 'react';
import {
  Menu as MenuIcon,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import { MenuService, buildMenuTree } from '../../services/menuService';
import { PageService } from '../../services/pageService';
import { Menu, MenuType, Page } from '../../types/database';
import { DynamicIcon } from '../../components/DynamicIcon';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';

const POPULAR_ICONS = [
  'Home',
  'Building2',
  'Users',
  'BriefcaseMedical',
  'HeartPulse',
  'Activity',
  'Bone',
  'Scan',
  'FlaskConical',
  'ShieldCheck',
  'Award',
  'FileText',
  'PhoneCall',
  'Sparkles',
  'Layers',
  'Target',
  'History',
  'Stethoscope',
  'Calendar',
  'Pill',
  'Ambulance',
];

export const AdminNavigation: React.FC = () => {
  const { showToast } = useToast();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Expanded menu nodes in tree
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Data
  const [formData, setFormData] = useState<Partial<Menu>>({
    title: '',
    slug: '',
    parent_id: null,
    page_id: null,
    menu_type: 'internal',
    icon: 'FileText',
    external_url: '',
    display_order: 1,
    is_active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [allMenus, allPages] = await Promise.all([
        MenuService.getAllMenusAdmin(),
        PageService.getAllPagesAdmin(),
      ]);
      setMenus(allMenus);
      setPages(allPages);

      // Auto-expand all parents
      const expanded: Record<string, boolean> = {};
      allMenus.forEach((m) => {
        if (!m.parent_id) expanded[m.id] = true;
      });
      setExpandedNodes(expanded);
    } catch (err) {
      console.error('Failed to load navigation data:', err);
      showToast('Failed to load navigation menus', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openAddModal = (parentId: string | null = null) => {
    setEditingMenu(null);
    const siblings = menus.filter((m) => m.parent_id === parentId);
    setFormData({
      title: '',
      slug: parentId ? '/services/new-service' : '/',
      parent_id: parentId,
      page_id: null,
      menu_type: parentId ? 'internal' : 'dropdown_parent',
      icon: parentId ? 'FileText' : 'Building2',
      external_url: '',
      display_order: siblings.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      title: menu.title,
      slug: menu.slug,
      parent_id: menu.parent_id,
      page_id: menu.page_id,
      menu_type: menu.menu_type,
      icon: menu.icon || 'FileText',
      external_url: menu.external_url || '',
      display_order: menu.display_order,
      is_active: menu.is_active,
    });
    setModalOpen(true);
  };

  const handlePageSelect = (pageId: string) => {
    const selectedPage = pages.find((p) => p.id === pageId);
    if (selectedPage) {
      setFormData((prev) => ({
        ...prev,
        page_id: pageId,
        title: prev.title || selectedPage.navigation_title || selectedPage.title,
        slug: `/${selectedPage.slug}`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        page_id: null,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      showToast('Menu Title is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingMenu) {
        await MenuService.updateMenu(editingMenu.id, formData);
        showToast('Navigation menu updated successfully', 'success');
      } else {
        await MenuService.createMenu(formData);
        showToast('Navigation menu created successfully', 'success');
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save menu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await MenuService.deleteMenu(deleteTarget.id);
      showToast('Menu item removed', 'success');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete menu', 'error');
    }
  };

  const handleToggleActive = async (menu: Menu) => {
    try {
      await MenuService.toggleMenuStatus(menu.id, !menu.is_active);
      showToast(
        menu.is_active ? `Menu "${menu.title}" is now hidden` : `Menu "${menu.title}" is now visible`,
        'success'
      );
      await loadData();
    } catch (err: any) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleMove = async (menu: Menu, direction: 'up' | 'down') => {
    const siblings = menus
      .filter((m) => m.parent_id === menu.parent_id)
      .sort((a, b) => a.display_order - b.display_order);

    const index = siblings.findIndex((s) => s.id === menu.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const currentItem = siblings[index];
    const neighborItem = siblings[targetIndex];

    const currentOrder = currentItem.display_order;
    const neighborOrder = neighborItem.display_order;

    await MenuService.reorderMenus([
      { id: currentItem.id, display_order: neighborOrder },
      { id: neighborItem.id, display_order: currentOrder },
    ]);

    await loadData();
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset navigation to the default Rhythm Medicity menu tree?')) {
      await MenuService.resetToDefaults();
      showToast('Navigation reset to default hospital structure', 'success');
      await loadData();
    }
  };

  // Build tree
  const tree = buildMenuTree(menus);

  // Available parent options (prevent selecting oneself or one's children)
  const availableParents = menus.filter((m) => !editingMenu || m.id !== editingMenu.id);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-[#003329] text-white p-6 rounded-3xl shadow-xl border border-[#004C3D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#C4A760] uppercase tracking-wider">
              Website CMS
            </span>
            <span className="text-[10px] font-mono font-bold bg-[#004C3D] text-[#93D3C3] px-2 py-0.5 rounded-full border border-[#006655]">
              Realtime Dynamic
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Dynamic Navigation &amp; Dropdown Menus
          </h1>
          <p className="text-xs sm:text-sm text-[#93D3C3] max-w-2xl mt-1">
            Control the public website navigation bar in real-time. Add dropdown parents, sub-menus, icons, and link to custom dynamic pages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="btn-premium px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#93D3C3] hover:text-white bg-[#004C3D]/60 hover:bg-[#004C3D] border border-[#006655] transition inline-flex items-center gap-1.5"
            title="Reset to default hospital structure"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => openAddModal(null)}
            className="btn-gold btn-shimmer px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md inline-flex items-center gap-2 border border-[#B0934C]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Root Menu</span>
          </button>
        </div>
      </div>

      {/* Main Hierarchy Card */}
      <div className="bg-white rounded-3xl border border-[#E5DEC9] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MenuIcon className="w-5 h-5 text-[#006655]" />
            <h2 className="font-extrabold text-[#004C3D] text-lg">
              Navigation Hierarchy Tree
            </h2>
            <span className="text-xs font-bold bg-[#E0F2ED] text-[#006655] px-2 py-0.5 rounded-full font-mono">
              {menus.length} items
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Click <strong className="text-[#006655]">+ Sub Menu</strong> to nest dropdown items under parents.
          </div>
        </div>

        {/* Tree Rendering */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading navigation tree...
          </div>
        ) : tree.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No navigation menus found. Click "Add Root Menu" to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {tree.map((root, rootIdx) => {
              const isExpanded = expandedNodes[root.id] ?? true;
              const hasChildren = root.children && root.children.length > 0;

              return (
                <div
                  key={root.id}
                  className="rounded-2xl border border-[#E5DEC9] bg-[#FBF8F1]/80 p-3 transition hover:border-[#006655]/40"
                >
                  {/* Root Row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {hasChildren ? (
                        <button
                          onClick={() => toggleExpand(root.id)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#E5DEC9] flex items-center justify-center text-slate-500 hover:text-[#006655] transition cursor-pointer"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>
                      ) : (
                        <div className="w-6 h-6" />
                      )}

                      <div className="w-8 h-8 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center shrink-0 border border-[#006655]/10 shadow-2xs">
                        <DynamicIcon name={root.icon} className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#004C3D] text-sm">
                            {root.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-[#E5DEC9]">
                            {root.slug}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              root.menu_type === 'dropdown_parent'
                                ? 'bg-purple-100 text-purple-700'
                                : root.menu_type === 'external'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-[#E0F2ED] text-[#006655]'
                            }`}
                          >
                            {root.menu_type}
                          </span>
                        </div>
                        {hasChildren && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {root.children!.length} sub-menu {root.children!.length === 1 ? 'item' : 'items'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Move Up / Down */}
                      <button
                        onClick={() => handleMove(root, 'up')}
                        disabled={rootIdx === 0}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#006655] hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(root, 'down')}
                        disabled={rootIdx === tree.length - 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#006655] hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Add Sub menu */}
                      <button
                        onClick={() => openAddModal(root.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E0F2ED] text-[#006655] hover:bg-[#006655] hover:text-white transition inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Sub Menu</span>
                      </button>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(root)}
                        className={`p-1.5 rounded-lg transition ${
                          root.is_active
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={root.is_active ? 'Visible on Navbar' : 'Hidden from Navbar'}
                      >
                        {root.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(root)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#006655] hover:bg-white transition"
                        title="Edit Menu"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(root)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                        title="Delete Menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-menu Children */}
                  {hasChildren && isExpanded && (
                    <div className="mt-3 pl-8 sm:pl-10 space-y-1.5 border-l-2 border-[#C4A760]/40 ml-4">
                      {root.children!.map((child, childIdx) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-[#E5DEC9] hover:border-[#006655]/40 transition group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-[#E0F2ED] text-[#006655] flex items-center justify-center shrink-0 text-xs">
                              <DynamicIcon name={child.icon} className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-[#004C3D]">
                                {child.title}
                              </span>
                              <span className="ml-2 font-mono text-[10px] text-slate-400">
                                {child.slug}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMove(child, 'up')}
                              disabled={childIdx === 0}
                              className="p-1 rounded text-slate-400 hover:text-[#006655] disabled:opacity-20 transition"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMove(child, 'down')}
                              disabled={childIdx === root.children!.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-[#006655] disabled:opacity-20 transition"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleToggleActive(child)}
                              className={`p-1 rounded transition ${
                                child.is_active ? 'text-emerald-700' : 'text-slate-300'
                              }`}
                              title={child.is_active ? 'Visible' : 'Hidden'}
                            >
                              {child.is_active ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => openEditModal(child)}
                              className="p-1 rounded text-slate-500 hover:text-[#006655] transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(child)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Menu Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5DEC9] space-y-4 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MenuIcon className="w-5 h-5 text-[#006655]" />
                <h3 className="font-extrabold text-lg text-[#004C3D]">
                  {editingMenu ? 'Edit Navigation Menu' : 'Add Navigation Menu'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#004C3D] mb-1">
                  Menu Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Services, Cardiology, Patient Care"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
                />
              </div>

              {/* Parent Menu */}
              <div>
                <label className="block text-xs font-bold text-[#004C3D] mb-1">
                  Parent Menu (Hierarchy)
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parent_id: e.target.value ? e.target.value : null,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none bg-white"
                >
                  <option value="">-- None (Top Level Root Menu) --</option>
                  {availableParents
                    .filter((m) => !m.parent_id)
                    .map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Menu Type */}
              <div className="grid grid-cols-3 gap-2">
                {(['internal', 'dropdown_parent', 'external'] as MenuType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, menu_type: type })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition ${
                      formData.menu_type === type
                        ? 'bg-[#006655] text-white border-[#006655]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type === 'internal'
                      ? 'Internal Page'
                      : type === 'dropdown_parent'
                      ? 'Dropdown Parent'
                      : 'External Link'}
                  </button>
                ))}
              </div>

              {/* Link Target Selection (if internal) */}
              {formData.menu_type === 'internal' && (
                <div>
                  <label className="block text-xs font-bold text-[#004C3D] mb-1">
                    Connect to Existing Page (Optional Auto-Fill)
                  </label>
                  <select
                    value={formData.page_id || ''}
                    onChange={(e) => handlePageSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none bg-white"
                  >
                    <option value="">-- Choose Page or type custom slug --</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (/{p.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* URL or Slug */}
              {formData.menu_type === 'external' ? (
                <div>
                  <label className="block text-xs font-bold text-[#004C3D] mb-1">
                    External URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.external_url || ''}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#004C3D] mb-1">
                    Route Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="/services/cardiology"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-[#004C3D] mb-1">
                  Menu Icon
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-[#E5DEC9] max-h-32 overflow-y-auto bg-slate-50/50">
                  {POPULAR_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconName })}
                      className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                        formData.icon === iconName
                          ? 'bg-[#006655] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-[#E0F2ED]'
                      }`}
                      title={iconName}
                    >
                      <DynamicIcon name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Order & Active */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-[#004C3D] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order ?? 1}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active_toggle"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#006655] rounded accent-[#006655]"
                  />
                  <label
                    htmlFor="is_active_toggle"
                    className="text-xs font-bold text-[#004C3D] cursor-pointer"
                  >
                    Active on Website
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gold btn-shimmer px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md inline-flex items-center gap-1.5 border border-[#B0934C]"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Navigation Menu"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? If this menu has child items, they will also be removed.`}
        confirmText="Yes, Delete Menu"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
