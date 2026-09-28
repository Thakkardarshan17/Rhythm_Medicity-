import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Eye,
  ExternalLink,
  CheckCircle2,
  Clock,
  EyeOff,
  Sparkles,
  Layers,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { PageService } from '../../services/pageService';
import { Page, PageStatus } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export const AdminPages: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PageStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await PageService.getAllPagesAdmin();
      setPages(data);
    } catch (err) {
      console.error('Error fetching admin pages:', err);
      showToast('Failed to load pages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleDuplicate = async (page: Page) => {
    try {
      const duplicated = await PageService.duplicatePage(page.id);
      showToast(`Duplicated page: ${duplicated.title}`, 'success');
      await loadPages();
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate page', 'error');
    }
  };

  const handleTogglePublish = async (page: Page) => {
    try {
      if (page.status === 'published') {
        await PageService.unpublishPage(page.id);
        showToast(`Page "${page.title}" changed to Draft`, 'success');
      } else {
        await PageService.publishPage(page.id);
        showToast(`Page "${page.title}" is now Published live!`, 'success');
      }
      await loadPages();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await PageService.deletePage(deleteTarget.id);
      showToast('Page deleted successfully', 'success');
      setDeleteTarget(null);
      await loadPages();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete page', 'error');
    }
  };

  // Filtered pages
  const filteredPages = pages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.navigation_title && p.navigation_title.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const publishedCount = pages.filter((p) => p.status === 'published').length;
  const draftCount = pages.filter((p) => p.status === 'draft').length;
  const hiddenCount = pages.filter((p) => p.status === 'hidden').length;

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
              Dynamic Pages
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Dynamic Hospital Page Management
          </h1>
          <p className="text-xs sm:text-sm text-[#93D3C3] max-w-2xl mt-1">
            Build, publish, and edit custom hospital pages with rich clinical blocks, FAQs, hero sections, and SEO controls without touching code.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/pages/new"
            className="btn-gold btn-shimmer px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md inline-flex items-center gap-2 border border-[#B0934C]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Page</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Pages
          </span>
          <span className="text-2xl font-black text-[#004C3D] block mt-1">
            {pages.length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Published Live
          </span>
          <span className="text-2xl font-black text-emerald-700 block mt-1">
            {publishedCount}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Drafts
          </span>
          <span className="text-2xl font-black text-amber-700 block mt-1">
            {draftCount}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Hidden
          </span>
          <span className="text-2xl font-black text-slate-600 block mt-1">
            {hiddenCount}
          </span>
        </div>
      </div>

      {/* Table & Filter Card */}
      <div className="bg-white rounded-3xl border border-[#E5DEC9] p-6 shadow-xs space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, navigation title, or slug..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['all', 'published', 'draft', 'hidden'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#006655] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Pages Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading pages...
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p>No matching pages found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-[#004C3D] tracking-wider">
                  <th className="py-3 px-4">Page Title &amp; Slug</th>
                  <th className="py-3 px-4">Navigation Title</th>
                  <th className="py-3 px-4">Sections</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPages.map((page) => {
                  const blockCount = page.content?.blocks?.length || 0;
                  const isPublished = page.status === 'published';

                  return (
                    <tr key={page.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#004C3D] text-sm">
                          {page.title}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>/{page.slug}</span>
                          <a
                            href={`/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#006655] hover:underline inline-flex items-center gap-0.5 ml-1"
                            title="Open on live site"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {page.navigation_title || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                          {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePublish(page)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                            isPublished
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : page.status === 'draft'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Click to toggle publish status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPublished ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                          <span>{page.status}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {new Date(page.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Live Preview */}
                          <Link
                            to={`/${page.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#006655] hover:bg-slate-100 transition"
                            title="Preview Page"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit Page */}
                          <Link
                            to={`/admin/pages/edit/${page.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#006655] hover:bg-slate-100 transition"
                            title="Edit Content"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Duplicate Page */}
                          <button
                            onClick={() => handleDuplicate(page)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#006655] hover:bg-slate-100 transition"
                            title="Duplicate Page"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete Page */}
                          <button
                            onClick={() => setDeleteTarget(page)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                            title="Delete Page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Dynamic Page"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? Visitors navigating to /${deleteTarget?.slug} will see a 404 page.`}
        confirmText="Yes, Delete Page"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
