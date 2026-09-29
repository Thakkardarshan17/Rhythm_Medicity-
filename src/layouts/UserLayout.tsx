import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  ArrowLeft,
  Activity,
  PlusCircle,
  Lock,
  LogIn,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export const UserLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { hospitalSettings } = useSettings();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Appointments', path: '/dashboard/appointments', icon: Calendar },
    { name: 'Patient Profile', path: '/dashboard/profile', icon: User },
  ];

  const isActive = (path: string) => {
    const normCurrent = location.pathname.replace(/^\/user/, '/dashboard');
    if (path === '/dashboard') return normCurrent === '/dashboard';
    return normCurrent.startsWith(path);
  };

  // OWASP Section 10: Session expired on protected patient pages
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F4EC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5DEC9] shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#004C3D]">
              Your session has expired. Please log in again to continue.
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              For your data security and medical privacy, patient portal records require an active authenticated session.
            </p>
          </div>
          <Link
            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#006655] hover:bg-[#004C3D] text-white font-extrabold text-sm shadow-md transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Again</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] flex flex-col overflow-x-hidden w-full max-w-full">
      {/* Top Navbar for User Portal */}
      <header className="bg-[#FBF8F1] border-b border-[#E5DEC9] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="text-[#82A39B] hover:text-[#006655] transition p-1.5 rounded-lg hover:bg-[#E0F2ED]"
              title="Back to Hospital Website"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link to="/user" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 border border-[#C4A760]/40 shadow-xs">
                <img src="/emblem.png" alt="RHYTHM MEDICITY" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-xs sm:text-base text-[#006655] truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
                {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E0F2ED] text-[#006655]">
                Patient Portal
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/appointment"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white text-xs font-semibold shadow-xs transition shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Book</span>
              <span className="hidden sm:inline">Appointment</span>
            </Link>

            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-[#006655]">
                {profile?.full_name || user?.email || 'Patient'}
              </div>
              <div className="text-[10px] text-[#82A39B] font-mono">{user?.email}</div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-[#82A39B] hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="md:hidden flex items-center gap-1.5 px-4 py-2 overflow-x-auto border-t border-[#E5DEC9]/60 no-scrollbar bg-white/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-[#006655] text-white shadow-xs'
                    : 'text-[#004C3D] bg-[#FBF8F1] hover:bg-[#E0F2ED] border border-[#E5DEC9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area with Navigation Tabs */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Desktop Navigation Sidebar */}
        <aside className="hidden md:block w-60 shrink-0 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                  active
                    ? 'bg-[#006655] text-white shadow-md shadow-[#006655]/20'
                    : 'bg-[#FBF8F1] text-[#004C3D] hover:bg-[#E0F2ED] hover:text-[#006655] border border-[#E5DEC9]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-[#E5DEC9]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition border border-rose-100 bg-[#FBF8F1]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
