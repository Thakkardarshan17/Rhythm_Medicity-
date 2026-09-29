import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

// Providers
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { DropdownProvider } from './contexts/DropdownContext';

// Components
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';

// Layouts
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Doctors } from './pages/Doctors';
import { DoctorProfile } from './pages/DoctorProfile';
import { Specialities } from './pages/Specialities';
import { Services } from './pages/Services';
import { Contact } from './pages/Contact';
import { AppointmentBooking } from './pages/AppointmentBooking';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { AppointmentDetailsPage } from './pages/AppointmentDetailsPage';
import { Login } from './pages/Login';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

// User Portal Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { UserAppointments } from './pages/user/UserAppointments';
import { UserProfile } from './pages/user/UserProfile';

// Admin Portal Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDoctors } from './pages/admin/AdminDoctors';
import { AdminSpecialities } from './pages/admin/AdminSpecialities';
import { AdminServices } from './pages/admin/AdminServices';
import { AdminAppointments } from './pages/admin/AdminAppointments';
import { AdminPatients } from './pages/admin/AdminPatients';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminHospitalSettings } from './pages/admin/AdminHospitalSettings';
import { AdminLetterSettings } from './pages/admin/AdminLetterSettings';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminHospitalStats } from './pages/admin/AdminHospitalStats';
import { AdminWebsiteUI } from './pages/admin/AdminWebsiteUI';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminDropdownManagement } from './pages/admin/AdminDropdownManagement';
import { AdminNavigation } from './pages/admin/AdminNavigation';
import { AdminPages } from './pages/admin/AdminPages';
import { AdminPageEditor } from './pages/admin/AdminPageEditor';
import { AdminDillo } from './pages/admin/AdminDillo';
import { AdminSearchSettings } from './pages/admin/AdminSearchSettings';

import { DynamicPage } from './pages/DynamicPage';
import { AppointmentVerificationPage } from './pages/AppointmentVerificationPage';
import { DilloFloatingButton } from './components/dillo/DilloFloatingButton';

// Public Layout Wrapper with Navbar, Footer & Dillo Floating Assistant
const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50 text-[#006655] selection:bg-[#E0F2ED] selection:text-[#004C3D] overflow-x-hidden w-full max-w-full">
    <Navbar />
    <main className="flex-1 overflow-x-hidden w-full max-w-full">
      <Outlet />
    </main>
    <Footer />
    {/* Multilingual AI Voice Assistant Widget */}
    <DilloFloatingButton />
  </div>
);

export const App: React.FC = () => {
  // Splash Screen on initial application load (Prompt Section 5)
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('rhythm_splash_shown');
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('rhythm_splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <AuthProvider>
      <SettingsProvider>
        <DropdownProvider>
          <ToastProvider>
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <ScrollToTop />
              <Routes>
                {/* Admin Portal Authentication */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Admin Operational Console Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="navigation" element={<AdminNavigation />} />
                  <Route path="pages" element={<AdminPages />} />
                  <Route path="pages/new" element={<AdminPageEditor />} />
                  <Route path="pages/edit/:id" element={<AdminPageEditor />} />
                  <Route path="doctors" element={<AdminDoctors />} />
                  <Route path="specialities" element={<AdminSpecialities />} />
                  <Route path="services" element={<AdminServices />} />
                  <Route path="appointments" element={<AdminAppointments />} />
                  <Route path="patients" element={<AdminPatients />} />
                  <Route path="dropdowns" element={<AdminDropdownManagement />} />
                  <Route path="statistics" element={<AdminHospitalStats />} />
                  <Route path="appearance" element={<AdminWebsiteUI />} />
                  <Route path="search" element={<AdminSearchSettings />} />
                  <Route path="website/search" element={<AdminSearchSettings />} />
                  <Route path="ai-assistant" element={<AdminDillo />} />
                  <Route path="dillo" element={<AdminDillo />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                  <Route path="settings" element={<AdminHospitalSettings />} />
                  <Route path="appointment-letter" element={<AdminLetterSettings />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="profile" element={<AdminProfile />} />
                </Route>

                {/* User / Patient Portal Routes (/dashboard and /user) */}
                <Route path="/dashboard" element={<UserLayout />}>
                  <Route index element={<UserDashboard />} />
                  <Route path="appointments" element={<UserAppointments />} />
                  <Route path="appointments/:id" element={<AppointmentDetailsPage />} />
                  <Route path="profile" element={<UserProfile />} />
                </Route>
                <Route path="/user" element={<UserLayout />}>
                  <Route index element={<UserDashboard />} />
                  <Route path="appointments" element={<UserAppointments />} />
                  <Route path="appointments/:id" element={<AppointmentDetailsPage />} />
                  <Route path="profile" element={<UserProfile />} />
                </Route>

                {/* Public Hospital Website Routes & Dynamic CMS Pages */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/doctors" element={<Doctors />} />
                  <Route path="/doctors/:slug" element={<DoctorProfile />} />
                  <Route path="/doctor/:slug" element={<DoctorProfile />} />
                  <Route path="/specialities" element={<Specialities />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/appointment" element={<AppointmentBooking />} />
                  <Route path="/book-appointment" element={<AppointmentBooking />} />
                  <Route path="/book-appointment/:id" element={<AppointmentBooking />} />
                  <Route path="/appointment/success" element={<PaymentSuccessPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  <Route path="/appointment/:id" element={<AppointmentDetailsPage />} />
                  <Route path="/appointments/view/:id" element={<AppointmentVerificationPage />} />
                  <Route path="/appointment/verify/:id" element={<AppointmentVerificationPage />} />
                  <Route path="/appointment/verify" element={<AppointmentVerificationPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />

                  {/* Catch-all for Dynamic CMS Pages & Public 404 */}
                  <Route path="*" element={<DynamicPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </DropdownProvider>
      </SettingsProvider>
    </AuthProvider>
  );

};

export default App;
