import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  PhoneCall,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Home,
  AlertCircle,
  FileQuestion,
  Lock,
  ExternalLink,
  MapPin,
  Clock,
  Mail,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageService } from '../services/pageService';
import { Page, PageBlock } from '../types/database';
import { DynamicIcon } from '../components/DynamicIcon';
import { sanitizeHtml } from '../utils/sanitize';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface DynamicPageProps {
  previewPage?: Page; // When in live admin preview mode
}

export const DynamicPage: React.FC<DynamicPageProps> = ({ previewPage }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { isAdmin } = useAuth();
  const { hospitalSettings, websiteUISettings } = useSettings();

  const [page, setPage] = useState<Page | null>(previewPage || null);
  const [loading, setLoading] = useState<boolean>(!previewPage);
  const [errorState, setErrorState] = useState<'not_found' | 'unpublished' | 'error' | null>(null);

  // FAQ Accordion open states
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});

  // Resolve slug from location or params
  const currentSlug = previewPage
    ? previewPage.slug
    : PageService.normalizeSlug(
        params['*'] || location.pathname.replace(/^\/+/, '')
      );

  useEffect(() => {
    if (previewPage) {
      setPage(previewPage);
      setLoading(false);
      setErrorState(null);
      return;
    }

    const fetchPage = async () => {
      setLoading(true);
      setErrorState(null);
      try {
        // Admins can see unpublished pages
        const found = await PageService.getPageBySlug(currentSlug, isAdmin);
        if (!found) {
          // Check if page exists but is unpublished
          const anyPage = await PageService.getPageBySlug(currentSlug, true);
          if (anyPage && anyPage.status !== 'published') {
            setErrorState('unpublished');
            setPage(anyPage);
          } else {
            setErrorState('not_found');
            setPage(null);
          }
        } else {
          setPage(found);
          setErrorState(null);
        }
      } catch (err) {
        console.error('Error fetching dynamic page:', err);
        setErrorState('error');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [currentSlug, previewPage, isAdmin]);

  // Dynamic SEO meta tags and Title
  useEffect(() => {
    if (page) {
      const siteName = websiteUISettings.website_title || hospitalSettings.hospital_name || 'Rhythm Medicity';
      const pageTitle = page.seo_title || page.title;
      document.title = `${pageTitle} | ${siteName}`;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        'content',
        page.seo_description || `${page.title} at ${siteName}. Tertiary healthcare excellence.`
      );
    } else {
      document.title = `Page Not Found | Rhythm Medicity`;
    }
  }, [page, hospitalSettings, websiteUISettings]);

  const toggleFaq = (key: string) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const emergencyPhone =
    hospitalSettings.emergency_number || hospitalSettings.phone || '+91 7201030048';
  const hospitalEmail = hospitalSettings.email || 'care@rhythmmedicity.com';
  const hospitalAddress = hospitalSettings.address || 'Rhythm Medicity Hospital Campus';

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E0F2ED] border border-[#006655]/20 flex items-center justify-center animate-pulse mb-4 text-[#006655]">
          <DynamicIcon name="HeartPulse" className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-bold text-[#004C3D]">Loading Rhythm Medicity content...</p>
      </div>
    );
  }

  // 2. UNPUBLISHED STATE (for non-admin users)
  if (errorState === 'unpublished' && !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-2">
          Page In Review
        </span>
        <h1 className="text-3xl font-extrabold text-[#004C3D] mb-3">
          Page Currently Unpublished
        </h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">
          This hospital webpage is currently undergoing editorial review and is not yet publicly visible.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#006655] hover:bg-[#004C3D] text-white font-bold px-6 py-3 rounded-xl transition shadow-md"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  // 3. 404 NOT FOUND STATE
  if (errorState === 'not_found' || !page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#E0F2ED] border border-[#006655]/20 text-[#006655] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <FileQuestion className="w-10 h-10" />
        </div>
        <span className="text-xs font-black text-[#C4A760] uppercase tracking-widest block mb-2">
          Error 404
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#004C3D] mb-3">
          Page Not Found
        </h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved by hospital administration.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#006655] hover:bg-[#004C3D] text-white font-bold px-6 py-3 rounded-xl transition shadow-md text-xs sm:text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#004C3D] font-bold px-6 py-3 rounded-xl border border-[#E5DEC9] transition text-xs sm:text-sm"
          >
            <PhoneCall className="w-4 h-4 text-[#006655]" />
            <span>Contact Helpdesk</span>
          </Link>
        </div>
      </div>
    );
  }

  // Render individual block
  const renderBlock = (block: PageBlock) => {
    switch (block.type) {
      // BLOCK: HERO
      case 'hero': {
        const bgClasses =
          block.background_style === 'sand'
            ? 'bg-[#FBF8F1] border-b border-[#E5DEC9] text-[#004C3D]'
            : block.background_style === 'white'
            ? 'bg-white border-b border-[#E5DEC9] text-[#004C3D]'
            : 'bg-gradient-to-r from-[#003329] via-[#006655] to-[#003329] text-white';

        const alignClass =
          block.alignment === 'left'
            ? 'text-left items-start'
            : block.alignment === 'right'
            ? 'text-right items-end'
            : 'text-center items-center';

        const isDark = block.background_style !== 'sand' && block.background_style !== 'white';

        return (
          <section key={block.id} className={`${bgClasses} py-14 lg:py-20 relative overflow-hidden`}>
            {/* Subtle background hospital motif */}
            <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
              <DynamicIcon name="HeartPulse" className="w-[500px] h-[500px]" />
            </div>

            <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col ${alignClass} space-y-4 relative z-10`}>
              {block.badge && (
                <span className={`text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full ${
                  isDark
                    ? 'bg-[#C4A760]/20 text-[#C4A760] border border-[#C4A760]/30'
                    : 'bg-[#E0F2ED] text-[#006655] border border-[#006655]/20'
                }`}>
                  {block.badge}
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-4xl">
                {block.title || page.title}
              </h1>

              {block.subtitle && (
                <p className={`text-sm sm:text-base max-w-2xl leading-relaxed ${
                  isDark ? 'text-[#E0F2ED]' : 'text-slate-600'
                }`}>
                  {block.subtitle}
                </p>
              )}

              {(block.data?.primary_button_text || block.data?.secondary_button_text) && (
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  {block.data.primary_button_text && (
                    <Link
                      to={block.data.primary_button_link || '/appointment'}
                      className="btn-gold btn-shimmer text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-lg border border-[#B0934C] transition inline-flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{block.data.primary_button_text}</span>
                    </Link>
                  )}
                  {block.data.secondary_button_text && (
                    <a
                      href={block.data.secondary_button_link || `tel:${emergencyPhone}`}
                      className={`font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl border transition inline-flex items-center gap-2 ${
                        isDark
                          ? 'border-white/30 text-white hover:bg-white/10'
                          : 'border-[#006655] text-[#006655] hover:bg-[#E0F2ED]'
                      }`}
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{block.data.secondary_button_text}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      }

      // BLOCK: RICH TEXT
      case 'rich_text': {
        return (
          <section key={block.id} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-3xl border border-[#E5DEC9] p-6 sm:p-10 shadow-xs">
              {block.badge && (
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C4A760] bg-[#F7F4EC] px-2.5 py-1 rounded-md inline-block mb-3">
                  {block.badge}
                </span>
              )}
              {block.title && (
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#004C3D] mb-6">
                  {block.title}
                </h2>
              )}
              {block.content && (
                <div
                  className="prose prose-emerald max-w-none text-slate-700 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
                />
              )}
            </div>
          </section>
        );
      }

      // BLOCK: CARDS GRID
      case 'cards_grid': {
        const cards: any[] = block.data?.cards || [];
        const cols = block.data?.columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

        return (
          <section key={block.id} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {(block.title || block.badge) && (
              <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                {block.badge && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#C4A760] bg-[#F7F4EC] px-2.5 py-1 rounded-md inline-block">
                    {block.badge}
                  </span>
                )}
                {block.title && (
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#004C3D]">
                    {block.title}
                  </h2>
                )}
                {block.subtitle && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {block.subtitle}
                  </p>
                )}
              </div>
            )}

            <div className={`grid ${cols} gap-6`}>
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className="card-lift bg-[#FBF8F1] rounded-2xl border border-[#E5DEC9] p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                      <DynamicIcon name={card.icon || 'ShieldCheck'} className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-[#004C3D] group-hover:text-[#006655] transition-colors mb-2">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  {card.link && (
                    <div className="mt-4 pt-3 border-t border-[#E5DEC9]">
                      <Link
                        to={card.link}
                        className="text-xs font-bold text-[#006655] hover:text-[#004C3D] inline-flex items-center gap-1 group-hover:underline"
                      >
                        <span>Learn More</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      // BLOCK: FAQ ACCORDION
      case 'faq_accordion': {
        const faqs: any[] = block.data?.items || [];

        return (
          <section key={block.id} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-3xl border border-[#E5DEC9] p-6 sm:p-8 shadow-xs">
              {(block.title || block.badge) && (
                <div className="mb-6 space-y-1">
                  {block.badge && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#C4A760] bg-[#F7F4EC] px-2.5 py-1 rounded-md inline-block">
                      {block.badge}
                    </span>
                  )}
                  {block.title && (
                    <h2 className="text-2xl font-extrabold text-[#004C3D]">
                      {block.title}
                    </h2>
                  )}
                  {block.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-500">
                      {block.subtitle}
                    </p>
                  )}
                </div>
              )}

              <div className="divide-y divide-slate-100 space-y-2">
                {faqs.map((faq, idx) => {
                  const faqKey = `${block.id}-${idx}`;
                  const isOpen = expandedFaqs[faqKey] ?? (idx === 0);
                  return (
                    <div key={idx} className="pt-3">
                      <button
                        onClick={() => toggleFaq(faqKey)}
                        className="w-full flex items-center justify-between text-left py-2 gap-4 group cursor-pointer focus:outline-none"
                      >
                        <span className="text-sm font-bold text-[#004C3D] group-hover:text-[#006655] transition-colors">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#006655]' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed py-2 pl-1 pr-4">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      // BLOCK: IMAGE GALLERY
      case 'image_gallery': {
        const images: any[] = block.data?.images || [];

        return (
          <section key={block.id} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {block.title && (
              <h2 className="text-2xl font-extrabold text-[#004C3D] mb-6 text-center">
                {block.title}
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border border-[#E5DEC9] bg-[#FBF8F1] aspect-4/3 shadow-xs"
                >
                  <img
                    src={img.url || img}
                    alt={img.caption || `Gallery ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white text-xs font-semibold">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      // BLOCK: VIDEO EMBED
      case 'video_embed': {
        const videoUrl: string = block.data?.video_url || '';
        // If it's a youtube watch URL, transform to embed
        let embedSrc = videoUrl;
        if (videoUrl.includes('youtube.com/watch?v=')) {
          embedSrc = videoUrl.replace('watch?v=', 'embed/');
        } else if (videoUrl.includes('youtu.be/')) {
          embedSrc = videoUrl.replace('youtu.be/', 'www.youtube.com/embed/');
        }

        return (
          <section key={block.id} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-3xl border border-[#E5DEC9] p-4 sm:p-6 shadow-xs">
              {block.title && (
                <h3 className="text-xl font-bold text-[#004C3D] mb-3">
                  {block.title}
                </h3>
              )}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/5">
                {embedSrc ? (
                  <iframe
                    src={embedSrc}
                    title={block.title || 'Video Player'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Play className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }

      // BLOCK: CONTACT BOX
      case 'contact_box': {
        return (
          <section key={block.id} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-[#003329] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#004C3D] relative overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-4">
                <span className="text-xs font-bold text-[#C4A760] uppercase tracking-wider">
                  24/7 Assistance
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  {block.title || 'Hospital Front Desk & Emergency Care'}
                </h2>
                <p className="text-sm text-[#E0F2ED] leading-relaxed">
                  {block.subtitle || 'Connect with our healthcare coordinators for admissions, ambulance dispatch, or doctor appointments.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-[#004C3D]/80 border border-[#006655]/60 flex items-start gap-3">
                    <PhoneCall className="w-5 h-5 text-[#C4A760] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-[#93D3C3] uppercase font-bold">Helpline</div>
                      <a href={`tel:${emergencyPhone}`} className="text-sm font-extrabold text-white hover:underline">
                        {emergencyPhone}
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#004C3D]/80 border border-[#006655]/60 flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#C4A760] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-[#93D3C3] uppercase font-bold">Inquiries</div>
                      <a href={`mailto:${hospitalEmail}`} className="text-xs font-semibold text-white hover:underline truncate block">
                        {hospitalEmail}
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#004C3D]/80 border border-[#006655]/60 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#C4A760] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-[#93D3C3] uppercase font-bold">Campus</div>
                      <div className="text-xs text-slate-200 line-clamp-2">
                        {hospitalAddress}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      // BLOCK: CTA BANNER
      case 'cta_banner': {
        return (
          <section key={block.id} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="rounded-3xl bg-gradient-to-r from-[#004C3D] via-[#006655] to-[#004C3D] text-white p-8 sm:p-12 text-center space-y-4 shadow-xl border border-[#006655]/60 relative overflow-hidden">
              <h2 className="text-2xl sm:text-3xl font-black">
                {block.title || 'Prioritize Your Health with Rhythm Medicity'}
              </h2>
              <p className="text-xs sm:text-sm text-[#E0F2ED] max-w-xl mx-auto leading-relaxed">
                {block.subtitle || 'Book your OPD consultation or health screening with our distinguished medical faculty today.'}
              </p>
              <div className="pt-3">
                <Link
                  to={block.data?.button_link || '/appointment'}
                  className="btn-gold btn-shimmer text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg border border-[#B0934C] transition inline-flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{block.data?.button_text || 'Book Appointment Now'}</span>
                </Link>
              </div>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Admin Live Preview Banner */}
      {previewPage && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-center text-xs flex items-center justify-center gap-2 sticky top-16 z-30 shadow-md">
          <Sparkles className="w-4 h-4" />
          <span>ADMIN LIVE PREVIEW MODE — Status: {page.status.toUpperCase()}</span>
        </div>
      )}

      {/* If page is draft but viewed by logged-in admin */}
      {!previewPage && isAdmin && page.status !== 'published' && (
        <div className="bg-amber-100 text-amber-900 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700" />
          <span>Notice: This page is currently in {page.status.toUpperCase()} mode. Visible only to Admins.</span>
        </div>
      )}

      {/* Render all page blocks */}
      {page.content && page.content.blocks && page.content.blocks.length > 0 ? (
        <div className="space-y-4">
          {page.content.blocks.map((block) => renderBlock(block))}
        </div>
      ) : (
        // Fallback simple view if page has no blocks yet
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl border border-[#E5DEC9] p-8 shadow-xs text-center space-y-4">
            <h1 className="text-3xl font-extrabold text-[#004C3D]">{page.title}</h1>
            <p className="text-slate-500 text-sm">This page has no content blocks yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};
