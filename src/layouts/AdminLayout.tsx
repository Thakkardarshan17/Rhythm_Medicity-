import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Stethoscope,
  BriefcaseMedical,
  Calendar,
  Users,
  Image as ImageIcon,
  CreditCard,
  Settings,
  FileText,
  BarChart3,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Activity,
  Radio,
  Palette,
  ListFilter,
  Bot,
  Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, loading, logout } = useAuth();
  const { hospitalSettings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authorization Guard: Require authenticated user with admin role
  if (!loading && (!user || !isAdmin)) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  const navSections = [
    {
      title: 'Clinical Operations',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Doctors', path: '/admin/doctors', icon: UserCheck },
        { name: 'Specialities', path: '/admin/specialities', icon: Stethoscope },
        { name: 'Services', path: '/admin/services', icon: BriefcaseMedical },
        { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
        { name: 'Patients', path: '/admin/patients', icon: Users },
      ],
    },
    {
      title: 'Website & UI Management',
      items: [
        { name: 'Navigation Menus', path: '/admin/navigation', icon: Menu, badge: 'NAV' },
        { name: 'Page Management', path: '/admin/pages', icon: FileText, badge: 'CMS' },
        { name: 'AI Voice Assistant (Dillo)', path: '/admin/ai-assistant', icon: Bot, badge: 'AI' },
        { name: 'Hospital Statistics', path: '/admin/statistics', icon: Activity, badge: 'LIVE' },
        { name: 'Appearance / UI', path: '/admin/appearance', icon: Palette, badge: 'THEME' },
        { name: 'Search Management', path: '/admin/search', icon: Search, badge: 'SMART' },
        { name: 'Hero Banners', path: '/admin/banners', icon: ImageIcon },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Hospital Settings', path: '/admin/settings', icon: Settings },
        { name: 'Dropdown Management', path: '/admin/dropdowns', icon: ListFilter, badge: 'MASTER' },
        { name: 'Letter Settings', path: '/admin/appointment-letter', icon: FileText },
        { name: 'Payments', path: '/admin/payments', icon: CreditCard },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck, badge: 'AUDIT' },
        { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
        { name: 'Admin Profile', path: '/admin/profile', icon: ShieldCheck },
      ],
    },
  ];

  const allNavItems = navSections.flatMap((s) => s.items);

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 bg-[#003329] text-[#93D3C3] flex-col shrink-0 shadow-xl border-r border-[#004C3D] z-30">
        {/* Brand & Live status */}
        <div className="p-4 border-b border-[#004C3D] space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 border border-[#C4A760]/40">
              <img src="/emblem.png" alt="RHYTHM MEDICITY" className="w-full h-full object-contain" />
            </div>
            <div className="overflow-hidden">
              <span className="font-extrabold text-white text-sm tracking-tight block truncate">
                {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}
              </span>
              <span className="text-[10px] font-bold text-[#C4A760] tracking-wider uppercase block">
                ADMIN CONSOLE
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-[#004C3D]/70 border border-[#006655]/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#93D3C3]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Realtime
            </span>
            <span className="text-[9px] text-[#C4A760] font-mono font-bold">ONLINE</span>
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-extrabold text-[#C4A760] uppercase tracking-wider">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                      active
                        ? 'bg-gradient-to-r from-[#C4A760] to-[#B0934C] text-white shadow-md shadow-[#C4A760]/30 font-bold translate-x-1'
                        : 'text-[#93D3C3]/80 hover:text-white hover:bg-[#004C3D]/80 hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span>{item.name}</span>
                    </div>
                    {(item as any).badge && !active && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#004C3D] text-[#C4A760] border border-[#006655]">
                        {(item as any).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#004C3D] space-y-1 shrink-0 bg-[#002820]">
          <Link
            to="/"
            target="_blank"
            className="btn-premium flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#93D3C3]/80 hover:text-white hover:bg-[#004C3D]/60 transition"
          >
            <span>Public Website</span>
            <ExternalLink className="w-3.5 h-3.5 icon-hover-bounce" />
          </Link>

          <button
            onClick={handleLogout}
            className="btn-premium w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-[#003329] text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 border border-[#C4A760]/40">
            <img src="/emblem.png" alt="RHYTHM MEDICITY" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-sm block">RHYTHM MEDICITY</span>
            <span className="text-[9px] text-[#C4A760] font-bold uppercase">Admin Console</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-[#93D3C3] hover:bg-[#004C3D] transition-transform active:scale-95"
          aria-label="Toggle Navigation Drawer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#003329]/98 backdrop-blur-md text-[#93D3C3] px-4 py-4 space-y-2 border-b border-[#004C3D] animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active ? 'bg-[#C4A760] text-white shadow-sm font-bold' : 'text-[#93D3C3]/70 hover:bg-[#004C3D]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#004C3D] flex justify-between items-center text-xs">
            <Link to="/" target="_blank" className="text-[#C4A760] flex items-center gap-1">
              <span>View Site</span> <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button onClick={handleLogout} className="text-rose-400 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

