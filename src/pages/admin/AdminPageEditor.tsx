import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  ExternalLink,
  Globe,
  Settings,
  Image as ImageIcon,
  HelpCircle,
  FileText,
  Copy,
  ChevronDown,
  Smartphone,
  Monitor,
  X,
  Link as LinkIcon,
  Bold,
  Italic,
  List,
  Heading2,
  Video,
} from 'lucide-react';
import { PageService } from '../../services/pageService';
import { MenuService } from '../../services/menuService';
import { Page, PageBlock, PageBlockType, PageStatus, Menu } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';
import { generateUUID } from '../../utils/uuid';
import { DynamicPage } from '../DynamicPage';

export const AdminPageEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isNew = !id;

  const [page, setPage] = useState<Page>({
    id: generateUUID(),
    title: '',
    navigation_title: '',
    slug: '',
    featured_image: '',
    seo_title: '',
    seo_description: '',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      blocks: [],
    },
  });

  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedParentMenu, setSelectedParentMenu] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(!isNew);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'preview'>('content');
  const [showAddBlockMenu, setShowAddBlockMenu] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Load existing page & menus
  useEffect(() => {
    const init = async () => {
      try {
        const allMenus = await MenuService.getAllMenusAdmin();
        setMenus(allMenus);

        if (!isNew && id) {
          const found = await PageService.getPageById(id);
          if (found) {
            setPage(found);
            // Check if attached to any menu
            const attachedMenu = allMenus.find((m) => m.page_id === found.id);
            if (attachedMenu && attachedMenu.parent_id) {
              setSelectedParentMenu(attachedMenu.parent_id);
            }
          } else {
            showToast('Page not found', 'error');
            navigate('/admin/pages');
          }
        }
      } catch (err) {
        console.error('Failed to load page editor:', err);
        showToast('Error loading page', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isNew, navigate]);

  // Auto-generate slug when title changes on new page
  const handleTitleChange = (newTitle: string) => {
    setPage((prev) => {
      const parentMenu = menus.find((m) => m.id === selectedParentMenu);
      const prefix = parentMenu?.slug ? parentMenu.slug.replace(/^\/+/, '') : undefined;
      const updatedSlug = isNew && !prev.slug
        ? PageService.generateSlug(newTitle, prefix)
        : prev.slug;

      return {
        ...prev,
        title: newTitle,
        slug: updatedSlug,
        seo_title: prev.seo_title || newTitle,
      };
    });
  };

  const handleRegenerateSlug = () => {
    const parentMenu = menus.find((m) => m.id === selectedParentMenu);
    const prefix = parentMenu?.slug ? parentMenu.slug.replace(/^\/+/, '') : undefined;
    const generated = PageService.generateSlug(page.title || 'untitled-page', prefix);
    setPage((prev) => ({ ...prev, slug: generated }));
    showToast('Slug regenerated', 'info');
  };

  // Add block to content
  const addBlock = (type: PageBlockType) => {
    setShowAddBlockMenu(false);
    const newBlock: PageBlock = {
      id: generateUUID(),
      type,
      title: type === 'hero' ? page.title : 'Section Heading',
      subtitle: '',
      badge: '',
      background_style: type === 'hero' ? 'teal' : 'white',
      alignment: 'center',
      content:
        type === 'rich_text'
          ? '<p>Enter clinical information and details here. Support for bold, lists, and links.</p>'
          : '',
      data:
        type === 'cards_grid'
          ? {
              columns: 3,
              cards: [
                {
                  icon: 'ShieldCheck',
                  title: 'Specialized Care',
                  description: 'Comprehensive medical interventions delivered by board-certified physicians.',
                },
                {
                  icon: 'HeartPulse',
                  title: 'Advanced Technology',
                  description: 'Equipped with state-of-the-art diagnostic and therapeutic modalities.',
                },
                {
                  icon: 'Activity',
                  title: '24/7 Availability',
                  description: 'Round-the-clock emergency support, critical care, and nursing assistance.',
                },
              ],
            }
          : type === 'faq_accordion'
          ? {
              items: [
                {
                  question: 'What are the consultation timings?',
                  answer: 'OPD consultations are available Monday through Saturday from 9:00 AM to 8:00 PM.',
                },
                {
                  question: 'Do you offer cashless health insurance assistance?',
                  answer: 'Yes, our 24/7 TPA desk assists with cashless admissions across all empaneled insurers.',
                },
              ],
            }
          : type === 'hero'
          ? {
              primary_button_text: 'Book Appointment',
              primary_button_link: '/appointment',
              secondary_button_text: 'Call Helpline',
              secondary_button_link: 'tel:+917201030048',
            }
          : type === 'cta_banner'
          ? {
              button_text: 'Book Consultation Now',
              button_link: '/appointment',
            }
          : {},
    };

    setPage((prev) => ({
      ...prev,
      content: {
        blocks: [...prev.content.blocks, newBlock],
      },
    }));
    showToast(`Added ${type.replace('_', ' ')} block`, 'info');
  };

  // Move block up / down
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...page.content.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;

    setPage((prev) => ({
      ...prev,
      content: { blocks },
    }));
  };

  // Delete block
  const deleteBlock = (index: number) => {
    const blocks = page.content.blocks.filter((_, i) => i !== index);
    setPage((prev) => ({
      ...prev,
      content: { blocks },
    }));
  };

  // Update specific block
  const updateBlock = (index: number, updates: Partial<PageBlock>) => {
    const blocks = [...page.content.blocks];
    blocks[index] = { ...blocks[index], ...updates };
    setPage((prev) => ({
      ...prev,
      content: { blocks },
    }));
  };

  // Save Page (Draft or Published)
  const handleSave = async (status: PageStatus) => {
    if (!page.title.trim()) {
      showToast('Page Title is required', 'warning');
      setActiveTab('seo');
      return;
    }
    if (!page.slug.trim()) {
      showToast('Page Slug is required', 'warning');
      setActiveTab('seo');
      return;
    }

    setSaving(true);
    try {
      const pageToSave = {
        ...page,
        status,
        slug: PageService.normalizeSlug(page.slug),
      };

      let savedPage: Page;
      if (isNew) {
        savedPage = await PageService.createPage(pageToSave);
      } else {
        savedPage = await PageService.updatePage(page.id, pageToSave);
      }

      setPage(savedPage);

      // If user selected a parent menu, optionally create or link a menu item
      if (selectedParentMenu) {
        const existingMenus = await MenuService.getAllMenusAdmin();
        const alreadyLinked = existingMenus.find((m) => m.page_id === savedPage.id);

        if (!alreadyLinked) {
          await MenuService.createMenu({
            title: savedPage.navigation_title || savedPage.title,
            slug: `/${savedPage.slug}`,
            parent_id: selectedParentMenu,
            page_id: savedPage.id,
            menu_type: 'internal',
            icon: 'FileText',
            is_active: status === 'published',
          });
        }
      }

      showToast(
        status === 'published' ? 'Page published successfully!' : 'Draft saved successfully!',
        'success'
      );

      if (isNew) {
        navigate(`/admin/pages/edit/${savedPage.id}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save page', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading page editor...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Top Action Bar */}
      <div className="sticky top-4 z-30 bg-[#003329] text-white p-4 rounded-3xl shadow-xl border border-[#004C3D] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/pages"
            className="p-2 rounded-xl bg-[#004C3D] hover:bg-[#006655] text-[#93D3C3] hover:text-white transition"
            title="Back to Pages"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                {page.title || 'Untitled Page'}
              </h2>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  page.status === 'published'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {page.status}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#93D3C3] block">
              /{page.slug || 'no-slug'}
            </span>
          </div>
        </div>

        {/* Tab Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="bg-[#004C3D] p-1 rounded-xl flex items-center gap-1 border border-[#006655]/60 text-xs">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'content' ? 'bg-[#006655] text-white shadow-xs' : 'text-[#93D3C3] hover:text-white'
              }`}
            >
              Sections ({page.content.blocks.length})
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'seo' ? 'bg-[#006655] text-white shadow-xs' : 'text-[#93D3C3] hover:text-white'
              }`}
            >
              Settings &amp; SEO
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                activeTab === 'preview' ? 'bg-[#C4A760] text-slate-950 shadow-xs' : 'text-[#93D3C3] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#006655] bg-[#004C3D] hover:bg-[#006655] text-[#93D3C3] hover:text-white transition cursor-pointer"
          >
            Save Draft
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="btn-gold btn-shimmer px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md inline-flex items-center gap-1.5 border border-[#B0934C]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Publish Page'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONTENT BLOCKS EDITOR */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* Blocks List */}
          {page.content.blocks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E5DEC9] p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center mx-auto shadow-2xs">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#004C3D]">
                  No Content Sections Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Add hero banners, clinical cards, FAQs, and contact boxes to build this dynamic page.
                </p>
              </div>
              <button
                onClick={() => addBlock('hero')}
                className="btn-gold btn-shimmer px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md inline-flex items-center gap-2 border border-[#B0934C]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Hero Header Section</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {page.content.blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="bg-white rounded-3xl border border-[#E5DEC9] p-5 shadow-xs transition hover:border-[#006655]/40 space-y-4"
                >
                  {/* Block Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#E0F2ED] text-[#006655] font-mono text-xs font-extrabold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-extrabold text-[#004C3D] text-xs uppercase tracking-wider">
                        {block.type.replace('_', ' ')} Section
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Theme: {block.background_style || 'white'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveBlock(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#006655] disabled:opacity-20 transition"
                        title="Move Section Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveBlock(index, 'down')}
                        disabled={index === page.content.blocks.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#006655] disabled:opacity-20 transition"
                        title="Move Section Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBlock(index)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Block Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#004C3D] mb-1">
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => updateBlock(index, { title: e.target.value })}
                        placeholder="e.g. Centre of Clinical Excellence"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#004C3D] mb-1">
                        Badge / Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={block.badge || ''}
                        onChange={(e) => updateBlock(index, { badge: e.target.value })}
                        placeholder="e.g. 24x7 EMERGENCY RESPONSE"
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none uppercase"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#004C3D] mb-1">
                        Subtitle / Introductory Text
                      </label>
                      <input
                        type="text"
                        value={block.subtitle || ''}
                        onChange={(e) => updateBlock(index, { subtitle: e.target.value })}
                        placeholder="e.g. Evidence-based medical protocols delivered by distinguished specialists."
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
                      />
                    </div>

                    {/* Background theme selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#004C3D] mb-1">
                        Background Style
                      </label>
                      <select
                        value={block.background_style || 'white'}
                        onChange={(e) => updateBlock(index, { background_style: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none bg-white"
                      >
                        <option value="white">Clean White</option>
                        <option value="sand">Hospital Warm Sand (#FBF8F1)</option>
                        <option value="teal">Signature Deep Emerald Gradient</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#004C3D] mb-1">
                        Text Alignment
                      </label>
                      <select
                        value={block.alignment || 'center'}
                        onChange={(e) => updateBlock(index, { alignment: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none bg-white"
                      >
                        <option value="center">Center</option>
                        <option value="left">Left</option>
                      </select>
                    </div>
                  </div>

                  {/* Rich Text Specific Editor */}
                  {block.type === 'rich_text' && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-[#004C3D]">
                          Rich Editorial HTML Content
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Supports bold, italics, paragraphs, and list items.
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={block.content || ''}
                        onChange={(e) => updateBlock(index, { content: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#E5DEC9] text-xs font-mono focus:border-[#006655] focus:outline-none"
                        placeholder="<p>Enter descriptive hospital content here...</p>"
                      />
                    </div>
                  )}

                  {/* FAQ Accordion Editor */}
                  {block.type === 'faq_accordion' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#004C3D]">
                          Questions &amp; Answers
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const items = block.data?.items || [];
                            updateBlock(index, {
                              data: {
                                ...block.data,
                                items: [...items, { question: 'New Question', answer: 'Answer text here' }],
                              },
                            });
                          }}
                          className="text-[11px] font-bold text-[#006655] hover:underline"
                        >
                          + Add FAQ Item
                        </button>
                      </div>

                      {(block.data?.items || []).map((faq: any, fIdx: number) => (
                        <div key={fIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={faq.question || ''}
                              onChange={(e) => {
                                const newItems = [...block.data.items];
                                newItems[fIdx].question = e.target.value;
                                updateBlock(index, { data: { ...block.data, items: newItems } });
                              }}
                              placeholder="Question?"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = block.data.items.filter((_: any, i: number) => i !== fIdx);
                                updateBlock(index, { data: { ...block.data, items: newItems } });
                              }}
                              className="ml-2 text-rose-500 hover:text-rose-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={faq.answer || ''}
                            onChange={(e) => {
                              const newItems = [...block.data.items];
                              newItems[fIdx].answer = e.target.value;
                              updateBlock(index, { data: { ...block.data, items: newItems } });
                            }}
                            placeholder="Answer details..."
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cards Grid Editor */}
                  {block.type === 'cards_grid' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#004C3D]">
                          Feature Cards ({(block.data?.cards || []).length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const cards = block.data?.cards || [];
                            updateBlock(index, {
                              data: {
                                ...block.data,
                                cards: [
                                  ...cards,
                                  { icon: 'ShieldCheck', title: 'New Feature', description: 'Description text' },
                                ],
                              },
                            });
                          }}
                          className="text-[11px] font-bold text-[#006655] hover:underline"
                        >
                          + Add Card
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(block.data?.cards || []).map((card: any, cIdx: number) => (
                          <div key={cIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={card.title || ''}
                                onChange={(e) => {
                                  const newCards = [...block.data.cards];
                                  newCards[cIdx].title = e.target.value;
                                  updateBlock(index, { data: { ...block.data, cards: newCards } });
                                }}
                                placeholder="Card Title"
                                className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newCards = block.data.cards.filter((_: any, i: number) => i !== cIdx);
                                  updateBlock(index, { data: { ...block.data, cards: newCards } });
                                }}
                                className="ml-2 text-rose-500 hover:text-rose-700 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            <input
                              type="text"
                              value={card.description || ''}
                              onChange={(e) => {
                                const newCards = [...block.data.cards];
                                newCards[cIdx].description = e.target.value;
                                updateBlock(index, { data: { ...block.data, cards: newCards } });
                              }}
                              placeholder="Card description"
                              className="w-full px-2 py-1 rounded border border-slate-200 text-[11px] bg-white text-slate-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Embed */}
                  {block.type === 'video_embed' && (
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-bold text-[#004C3D] mb-1">
                        Video Embed URL (YouTube or Direct MP4)
                      </label>
                      <input
                        type="url"
                        value={block.data?.video_url || ''}
                        onChange={(e) =>
                          updateBlock(index, {
                            data: { ...block.data, video_url: e.target.value },
                          })
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-3 py-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Section Action Button & Dropdown */}
          <div className="relative pt-2">
            <button
              onClick={() => setShowAddBlockMenu(!showAddBlockMenu)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-[#E5DEC9] hover:border-[#006655] bg-white text-[#006655] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer hover:bg-[#E0F2ED]/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Content Section</span>
            </button>

            {showAddBlockMenu && (
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-white rounded-3xl shadow-2xl border border-[#E5DEC9] p-4 z-40 animate-in zoom-in-95 duration-150 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: 'hero', label: 'Hero Header', desc: 'Title, banner & CTA buttons', icon: 'Sparkles' },
                  { type: 'rich_text', label: 'Rich Editorial', desc: 'Formatted clinical text & lists', icon: 'FileText' },
                  { type: 'cards_grid', label: 'Feature Cards', desc: 'Columns with icons & descriptions', icon: 'Layers' },
                  { type: 'faq_accordion', label: 'FAQ Accordion', desc: 'Expandable patient questions', icon: 'HelpCircle' },
                  { type: 'contact_box', label: 'Contact Box', desc: '24/7 hotline, address, OPD hours', icon: 'PhoneCall' },
                  { type: 'video_embed', label: 'Video Embed', desc: 'YouTube or clinical video tour', icon: 'Play' },
                  { type: 'image_gallery', label: 'Image Gallery', desc: 'Grid of hospital facilities', icon: 'ImageIcon' },
                  { type: 'cta_banner', label: 'CTA Banner', desc: 'High-conversion booking banner', icon: 'Calendar' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addBlock(item.type as PageBlockType)}
                    className="flex flex-col items-start p-3 rounded-2xl hover:bg-[#E0F2ED]/60 text-left border border-transparent hover:border-[#006655]/20 transition cursor-pointer group"
                  >
                    <span className="font-extrabold text-xs text-[#004C3D] group-hover:text-[#006655]">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS & SEO */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-3xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-lg text-[#004C3D]">
              Page Details &amp; Metadata
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure URLs, navbar labels, hierarchy, and Google SEO search metadata.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#004C3D] mb-1">
                Page Title *
              </label>
              <input
                type="text"
                required
                value={page.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Advanced Cardiology Services"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
              />
            </div>

            {/* Navigation Title */}
            <div>
              <label className="block text-xs font-bold text-[#004C3D] mb-1">
                Navigation Title (Shorter label for menus)
              </label>
              <input
                type="text"
                value={page.navigation_title || ''}
                onChange={(e) => setPage({ ...page, navigation_title: e.target.value })}
                placeholder="e.g. Cardiology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
              />
            </div>

            {/* Parent Menu Assignment */}
            <div>
              <label className="block text-xs font-bold text-[#004C3D] mb-1">
                Assign to Parent Menu (Optional)
              </label>
              <select
                value={selectedParentMenu}
                onChange={(e) => setSelectedParentMenu(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none bg-white"
              >
                <option value="">-- None (Standalone Page) --</option>
                {menus
                  .filter((m) => !m.parent_id)
                  .map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#004C3D]">
                  SEO URL Slug *
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateSlug}
                  className="text-[10px] font-bold text-[#006655] hover:underline"
                >
                  Regenerate from Title
                </button>
              </div>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-[#E5DEC9] rounded-l-xl text-xs font-mono text-slate-500">
                  /
                </span>
                <input
                  type="text"
                  required
                  value={page.slug}
                  onChange={(e) => setPage({ ...page, slug: e.target.value })}
                  placeholder="services/cardiology"
                  className="w-full px-3 py-2.5 rounded-r-xl border border-[#E5DEC9] text-xs font-mono font-semibold focus:border-[#006655] focus:outline-none"
                />
              </div>
            </div>

            {/* Featured Image */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#004C3D] mb-1">
                Featured Hero Image URL
              </label>
              <input
                type="url"
                value={page.featured_image || ''}
                onChange={(e) => setPage({ ...page, featured_image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
              />
            </div>

            {/* SEO Title */}
            <div>
              <label className="block text-xs font-bold text-[#004C3D] mb-1">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={page.seo_title || ''}
                onChange={(e) => setPage({ ...page, seo_title: e.target.value })}
                placeholder="Cardiology Department | Rhythm Medicity Hospital"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-[#004C3D] mb-1">
                Publication Status
              </label>
              <select
                value={page.status}
                onChange={(e) => setPage({ ...page, status: e.target.value as PageStatus })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none bg-white font-bold"
              >
                <option value="draft">Draft (Private to Admins)</option>
                <option value="published">Published (Live on Website)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {/* SEO Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#004C3D] mb-1">
                SEO Meta Description
              </label>
              <textarea
                rows={3}
                value={page.seo_description || ''}
                onChange={(e) => setPage({ ...page, seo_description: e.target.value })}
                placeholder="Comprehensive cardiac surgery, emergency cath lab, and cardiology consultations at Rhythm Medicity."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold focus:border-[#006655] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-[#E5DEC9] flex items-center justify-between">
            <span className="text-xs font-bold text-[#004C3D]">
              Live Preview: Exactly how this page will render to public visitors
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  previewDevice === 'desktop' ? 'bg-[#006655] text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  previewDevice === 'mobile' ? 'bg-[#006655] text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          <div
            className={`mx-auto bg-slate-50 rounded-3xl border-4 border-slate-300 overflow-hidden shadow-2xl transition-all duration-300 ${
              previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-full'
            }`}
          >
            <DynamicPage previewPage={page} />
          </div>
        </div>
      )}
    </div>
  );
};
