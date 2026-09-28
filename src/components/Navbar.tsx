import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Menu as MenuIcon,
  X,
  Calendar,
  User,
  PhoneCall,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Mic,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { SmartSearchModal } from './SmartSearchModal';
import { SmartGlobalSearch } from './search/SmartGlobalSearch';
import { MenuService } from '../services/menuService';
import { Menu } from '../types/database';
import { DynamicIcon } from './DynamicIcon';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { hospitalSettings, websiteUISettings } = useSettings();
  const { user, patientProfile } = useAuth();

  // Dynamic menus loaded from MenuService / Database
  const [menus, setMenus] = useState<Menu[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Desktop active dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navContainerRef = useRef<HTMLElement>(null);

  // Mobile accordion state
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});

  const hospitalName =
    websiteUISettings.hospital_name || hospitalSettings.hospital_name || 'RHYTHM MEDICITY';
  const logoUrl =
    websiteUISettings.logo_url || hospitalSettings.logo_url || '/logo.png';
  const logoHeight = Number(
    websiteUISettings.logo_height || hospitalSettings.logo_height || 48
  );

  // Load public menus
  useEffect(() => {
    let isMounted = true;
    const loadMenus = async () => {
      try {
        const publicMenus = await MenuService.getPublicMenus();
        if (isMounted) {
          setMenus(publicMenus);
        }
      } catch (err) {
        console.error('Error fetching public navigation menus:', err);
      }
    };

    loadMenus();

    const handleMenuUpdate = () => {
      loadMenus();
    };

    window.addEventListener('rhythm_menus_changed', handleMenuUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('rhythm_menus_changed', handleMenuUpdate);
    };
  }, []);

  // Header scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global shortcut (Ctrl+K / Cmd+K) to open Smart Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    const handleCustomOpen = () => setSearchModalOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('rhythm_open_smart_search', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('rhythm_open_smart_search', handleCustomOpen);
    };
  }, []);

  // Close menus on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Outside click to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (menuKey: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(menuKey);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const toggleMobileSection = (key: string) => {
    setMobileExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const normalizePath = (slug: string) => {
    if (!slug) return '/';
    return slug.startsWith('/') ? slug : `/${slug}`;
  };

  const isActive = (slug: string) => {
    const target = normalizePath(slug);
    if (target === '/') return location.pathname === '/';
    return location.pathname.startsWith(target);
  };

  const isAnyChildActive = (parent: Menu) => {
    if (!parent.children || parent.children.length === 0) return false;
    return parent.children.some((child) => isActive(child.slug));
  };

  const emergencyPhone =
    hospitalSettings.emergency_number || hospitalSettings.phone || '+91 7201030048';

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-lg shadow-md border-b border-slate-200/90'
            : 'bg-[#FBF8F1]/95 backdrop-blur-md border-b border-[#E5DEC9]'
        }`}
      >
        <div
          className="w-full max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center justify-between gap-2 lg:gap-2.5 xl:gap-3.5 2xl:gap-5 transition-all duration-200"
          style={{ minHeight: `${Math.min(Math.max(68, logoHeight + 14), 84)}px` }}
        >
          {/* LEFT: Hospital Logo */}
          <div className="flex items-center shrink-0">
            <Link
              to="/"
              className="flex items-center group py-1"
              aria-label={`${hospitalName} Home`}
            >
              <img
                src={logoUrl}
                alt={hospitalName}
                style={{
                  height: `${Math.min(logoHeight, 58)}px`,
                }}
                className="w-auto max-h-[46px] sm:max-h-[52px] xl:max-h-[62px] object-contain shrink-0 group-hover:scale-[1.02] transition-all duration-300"
              />
            </Link>
          </div>

          {/* CENTER: Dynamic Database-Driven Navigation Menu with Dropdowns (Desktop) */}
          <nav
            ref={navContainerRef}
            className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 2xl:space-x-1.5 shrink-0"
          >
            {menus.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const targetPath = normalizePath(item.slug);

              if (hasChildren) {
                const isOpen = activeDropdown === item.id;
                const isSelected = isActive(item.slug) || isAnyChildActive(item) || isOpen;

                return (
                  <div
                    key={item.id}
                    className="relative inline-flex items-center shrink-0"
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(isOpen ? null : item.id)}
                      className={`inline-flex items-center flex-row flex-nowrap gap-1 px-2 xl:px-2.5 2xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[13px] 2xl:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? 'text-[#006655] bg-[#E0F2ED]/90 shadow-2xs font-black'
                          : 'text-[#004C3D] hover:text-[#006655] hover:bg-[#E0F2ED]/40 nav-link-animated'
                      }`}
                    >
                      {item.icon && (
                        <DynamicIcon
                          name={item.icon}
                          className="hidden 2xl:inline-block w-3.5 h-3.5 text-[#006655] shrink-0"
                        />
                      )}
                      <span className="whitespace-nowrap">{item.title}</span>
                      <ChevronDown
                        className={`w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#006655]' : 'text-slate-400'
                        }`}
                      />
                    </button>

                    {/* Smooth Animated Dropdown Flyout Card */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-1.5 min-w-[270px] max-w-[340px] bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-[#E5DEC9] p-2.5 z-50 overflow-hidden"
                        >
                          <div className="space-y-1">
                            {item.children!.map((child) => {
                              const isChildExt = child.menu_type === 'external';
                              const childPath = normalizePath(child.slug);
                              const isChildCurrent = location.pathname === childPath;

                              if (isChildExt) {
                                return (
                                  <a
                                    key={child.id}
                                    href={child.external_url || child.slug}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveDropdown(null)}
                                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#E0F2ED]/60 text-[#004C3D] hover:text-[#006655] transition group"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-[#E0F2ED] text-[#006655] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                                        <DynamicIcon name={child.icon} className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="text-xs font-bold">{child.title}</span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#006655]" />
                                  </a>
                                );
                              }

                              return (
                                <Link
                                  key={child.id}
                                  to={childPath}
                                  onClick={() => setActiveDropdown(null)}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition group ${
                                    isChildCurrent
                                      ? 'bg-[#E0F2ED] text-[#006655] font-black'
                                      : 'hover:bg-[#E0F2ED]/60 text-[#004C3D] hover:text-[#006655]'
                                  }`}
                                >
                                  <div className="w-7 h-7 rounded-lg bg-[#E0F2ED] text-[#006655] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                                    <DynamicIcon name={child.icon} className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <span className="text-xs font-bold block truncate">
                                      {child.title}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // Top level menu without children
              if (item.menu_type === 'external') {
                return (
                  <a
                    key={item.id}
                    href={item.external_url || item.slug}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 xl:px-2.5 2xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[13px] 2xl:text-sm font-bold text-[#004C3D] hover:text-[#006655] hover:bg-[#E0F2ED]/40 transition-all whitespace-nowrap shrink-0"
                  >
                    {item.icon && (
                      <DynamicIcon name={item.icon} className="hidden 2xl:inline-block w-3.5 h-3.5 text-[#006655]" />
                    )}
                    <span>{item.title}</span>
                  </a>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={targetPath}
                  className={`inline-flex items-center gap-1 px-2 xl:px-2.5 2xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[13px] 2xl:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                    isActive(item.slug)
                      ? 'text-[#006655] bg-[#E0F2ED]/90 shadow-2xs font-black'
                      : 'text-[#004C3D] hover:text-[#006655] hover:bg-[#E0F2ED]/40 nav-link-animated'
                  }`}
                >
                  {item.icon && (
                    <DynamicIcon name={item.icon} className="hidden 2xl:inline-block w-3.5 h-3.5 text-[#006655]" />
                  )}
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1.5 xl:gap-2 2xl:gap-3 shrink-0">
            {/* Desktop Smart Global Search Trigger that opens SmartSearchModal */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="hidden lg:flex items-center justify-between gap-2 px-3 py-2 bg-white/95 hover:bg-white text-[#004C3D] rounded-xl border border-[#E5DEC9] hover:border-[#006655]/50 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer w-28 xl:w-40 2xl:w-52 group text-left shrink-0"
              title="Search doctors, departments, services... (Ctrl+K)"
              aria-label="Open Search"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Search className="w-3.5 h-3.5 text-[#006655] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-[#4F7B72]/80 font-semibold truncate">
                  Search...
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-[#006655]/70 group-hover:text-[#006655]">
                <Mic className="w-3.5 h-3.5" />
                <kbd className="hidden 2xl:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                  ⌘K
                </kbd>
              </div>
            </button>

            {/* Mobile / Tablet Compact Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[#004C3D] hover:text-[#006655] bg-white hover:bg-[#E0F2ED]/40 rounded-xl border border-[#E5DEC9] hover:border-[#006655]/40 text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs group"
              aria-label="Open Search"
              title="Search or speak to search"
            >
              <Search className="w-3.5 h-3.5 text-[#006655] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs text-[#4F7B72] font-medium">Search</span>
              <Mic className="w-3 h-3 text-[#006655] ml-0.5" />
            </button>

            {/* Book Appointment CTA */}
            <Link
              to="/appointment"
              className="hidden sm:inline-flex items-center gap-1.5 xl:gap-2 btn-gold btn-shimmer text-white font-extrabold text-xs 2xl:text-sm px-2.5 py-2 xl:px-3.5 xl:py-2.5 rounded-xl shadow-md transition-all whitespace-nowrap shrink-0 border border-[#B0934C]"
            >
              <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 text-white" />
              <span className="whitespace-nowrap">Book Appointment</span>
            </Link>

            {/* Patient Account / Login Action (Section 1: Default Logged Out State) */}
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 xl:gap-2 bg-white hover:bg-[#E0F2ED] text-[#004C3D] text-xs 2xl:text-sm font-bold px-2.5 py-2 xl:px-3 rounded-xl transition whitespace-nowrap shrink-0 border border-[#E5DEC9] shadow-2xs hover:shadow-xs group"
                title="My Account / Profile"
              >
                <div className="w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-[#E0F2ED] text-[#006655] font-bold text-[11px] xl:text-xs flex items-center justify-center shrink-0 border border-[#006655]/20 overflow-hidden">
                  {patientProfile?.photo_url ? (
                    <img
                      src={patientProfile.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : patientProfile?.full_name ? (
                    patientProfile.full_name.charAt(0).toUpperCase()
                  ) : user.name ? (
                    user.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="hidden md:inline whitespace-nowrap max-w-[100px] xl:max-w-[130px] truncate">
                  {patientProfile?.full_name ? `${patientProfile.full_name.split(' ')[0]} (My Account)` : 'My Account / Profile'}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 xl:gap-2 bg-white hover:bg-[#E0F2ED] text-[#004C3D] hover:text-[#006655] text-xs 2xl:text-sm font-bold px-2.5 py-2 xl:px-3.5 rounded-xl border border-[#E5DEC9] hover:border-[#006655]/40 transition whitespace-nowrap shrink-0 shadow-2xs"
                title="Login / Sign Up"
              >
                <User className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#006655] shrink-0" />
                <span className="whitespace-nowrap">Login / Sign Up</span>
              </Link>
            )}

            {/* Mobile / Tablet Animated Hamburger Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative p-2.5 rounded-xl text-[#004C3D] bg-white border border-[#E5DEC9] hover:bg-[#E0F2ED] hover:border-[#006655]/40 transition-all duration-200 shrink-0 shadow-2xs focus:outline-none cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.div
                    key="close-icon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6 text-[#006655]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu-icon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MenuIcon className="w-6 h-6 text-[#006655]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Animated Mobile Navigation Drawer with Accordion-Style Menus */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 top-20 bg-black/40 backdrop-blur-xs z-30"
                aria-hidden="true"
              />

              {/* Animated Mobile Menu Body */}
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden relative z-40 bg-[#FBF8F1] border-b border-[#E5DEC9] shadow-2xl overflow-hidden"
              >
                <div className="max-h-[calc(100vh-6rem)] overflow-y-auto px-4 pt-3 pb-6 space-y-3">
                  {/* Quick Smart Search Trigger in Mobile Menu */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setSearchModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white text-[#004C3D] rounded-2xl border border-[#E5DEC9] shadow-2xs hover:border-[#006655]/50 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-[#006655]" />
                        <span className="text-xs text-[#4F7B72]/80 font-medium">Search doctors, departments, services...</span>
                      </div>
                      <Mic className="w-4 h-4 text-[#006655]" />
                    </button>
                  </div>

                  {/* Nav Links with Dynamic Collapsible Dropdown Accordions */}
                  <div className="space-y-1 bg-white/80 rounded-2xl p-2 border border-[#E5DEC9]">
                    {menus.map((item) => {
                      const hasChildren = item.children && item.children.length > 0;
                      const targetPath = normalizePath(item.slug);

                      if (hasChildren) {
                        const isExpanded = mobileExpanded[item.id] || false;
                        return (
                          <div key={item.id}>
                            <button
                              onClick={() => toggleMobileSection(item.id)}
                              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-[#004C3D] hover:bg-[#E0F2ED] transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {item.icon && (
                                  <DynamicIcon
                                    name={item.icon}
                                    className="w-4 h-4 text-[#006655]"
                                  />
                                )}
                                <span>{item.title}</span>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-[#006655]' : ''
                                }`}
                              />
                            </button>

                            {isExpanded && (
                              <div className="pl-4 pr-2 py-1.5 space-y-1 bg-slate-50/70 rounded-xl mt-1 text-xs">
                                {item.children!.map((child) => {
                                  const childPath = normalizePath(child.slug);
                                  const isChildExt = child.menu_type === 'external';

                                  if (isChildExt) {
                                    return (
                                      <a
                                        key={child.id}
                                        href={child.external_url || child.slug}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between py-1.5 px-2 font-semibold text-[#006655] hover:underline"
                                      >
                                        <div className="flex items-center gap-2">
                                          <DynamicIcon
                                            name={child.icon}
                                            className="w-3.5 h-3.5"
                                          />
                                          <span>{child.title}</span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                      </a>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={child.id}
                                      to={childPath}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="flex items-center gap-2 py-1.5 px-2 font-semibold text-[#004C3D] hover:text-[#006655]"
                                    >
                                      <DynamicIcon
                                        name={child.icon}
                                        className="w-3.5 h-3.5 text-[#006655]"
                                      />
                                      <span>{child.title}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Item without children
                      if (item.menu_type === 'external') {
                        return (
                          <a
                            key={item.id}
                            href={item.external_url || item.slug}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-[#004C3D] hover:bg-[#E0F2ED] transition"
                          >
                            <div className="flex items-center gap-2">
                              {item.icon && (
                                <DynamicIcon
                                  name={item.icon}
                                  className="w-4 h-4 text-[#006655]"
                                />
                              )}
                              <span>{item.title}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                          </a>
                        );
                      }

                      const isCurrent = location.pathname === targetPath;
                      return (
                        <Link
                          key={item.id}
                          to={targetPath}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-[#006655] text-white shadow-md'
                              : 'text-[#004C3D] hover:bg-[#E0F2ED]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {item.icon && (
                              <DynamicIcon
                                name={item.icon}
                                className={`w-4 h-4 ${
                                  isCurrent ? 'text-white' : 'text-[#006655]'
                                }`}
                              />
                            )}
                            <span>{item.title}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </Link>
                      );
                    })}
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="space-y-2 pt-1">
                    <Link
                      to="/appointment"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 bg-[#006655] hover:bg-[#004C3D] text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-[#006655]/25 transition text-xs sm:text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Doctor Appointment</span>
                    </Link>

                    {user ? (
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-white text-[#004C3D] font-bold rounded-2xl border border-[#E5DEC9] shadow-xs text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#E0F2ED] text-[#006655] font-bold text-xs flex items-center justify-center shrink-0 border border-[#006655]/20">
                            {patientProfile?.photo_url ? (
                              <img
                                src={patientProfile.photo_url}
                                alt=""
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              patientProfile?.full_name?.charAt(0) || user.name?.charAt(0) || 'P'
                            )}
                          </div>
                          <div>
                            <span className="block text-[#006655] font-extrabold text-xs">
                              {patientProfile?.full_name || user.name || 'Patient Profile'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              View Appointments &amp; Reports
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-[#E0F2ED] text-[#004C3D] font-bold rounded-2xl border border-[#E5DEC9] text-xs shadow-xs transition"
                      >
                        <User className="w-4 h-4 text-[#006655]" />
                        <span>Patient Login / Sign Up</span>
                      </Link>
                    )}
                  </div>

                  {/* 24x7 Emergency Contact Strip */}
                  <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between text-xs text-slate-600 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <span className="font-semibold text-rose-700 text-[11px]">24/7 Helpline:</span>
                    </div>
                    <a
                      href={`tel:${emergencyPhone}`}
                      className="font-extrabold text-[#006655] text-xs hover:underline"
                    >
                      {emergencyPhone}
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Smart Search Modal */}
      <SmartSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};
