import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, MessageCircle, Heart, Navigation, ExternalLink } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const Footer: React.FC = () => {
  const { hospitalSettings, websiteUISettings } = useSettings();
  const currentYear = new Date().getFullYear();

  const hospitalName =
    websiteUISettings.footer_hospital_name || hospitalSettings.hospital_name || 'RHYTHM MEDICITY';
  const address =
    websiteUISettings.footer_address ||
    hospitalSettings.address ||
    '79, Gotri Rd, Karmjyot Society, Gotri, Vadodara, Gujarat 390007';
  const phone = websiteUISettings.footer_phone || hospitalSettings.phone || '+91 7201030048';
  const emergency =
    websiteUISettings.footer_emergency_number ||
    hospitalSettings.emergency_number ||
    '+91 7201030048';
  const whatsapp =
    websiteUISettings.footer_whatsapp ||
    hospitalSettings.whatsapp_number ||
    hospitalSettings.phone ||
    '7201030048';
  const email =
    websiteUISettings.footer_email || hospitalSettings.email || 'info@rhythmmedicity.com';
  const copyright =
    websiteUISettings.copyright_text || `© ${currentYear} ${hospitalName}. All rights reserved.`;

  const whatsappUrl = `https://wa.me/${whatsapp.replace(/\D/g, '') || '917201030048'}`;
  const facebookUrl = websiteUISettings.social_facebook || 'https://facebook.com/rhythmmedicity';
  const instagramUrl = websiteUISettings.social_instagram || 'https://instagram.com/rhythmmedicity';
  const youtubeUrl = websiteUISettings.social_youtube || 'https://youtube.com/@rhythmmedicity';
  const twitterUrl = websiteUISettings.social_twitter || 'https://twitter.com/rhythmmedicity';
  const linkedinUrl = websiteUISettings.social_linkedin || 'https://linkedin.com/company/rhythmmedicity';

  const mapQuery = encodeURIComponent(`${hospitalName}, ${address}`);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <footer className="bg-[#003329] text-[#93D3C3] border-t border-[#004C3D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-4">
            <Link to="/" className="inline-block bg-white/95 rounded-2xl p-2.5 shadow-md hover:opacity-95 transition">
              <img
                src={websiteUISettings.logo_url || hospitalSettings.logo_url || '/logo.png'}
                alt={hospitalName}
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </Link>
            <p className="text-[#C4A760] text-xs font-bold tracking-wider uppercase">
              {hospitalSettings.tagline || 'Where Life Finds Its Rhythm'}
            </p>
            <p className="text-sm text-[#93D3C3]/80 leading-relaxed">
              {websiteUISettings.website_description ||
                'Dedicated to delivering compassionate, patient-centered, world-class healthcare with state-of-the-art medical technology.'}
            </p>

            {/* Social Media Links with Official Brand SVGs and Hover Effects */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4A760] block mb-2.5">
                Connect With Us
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-sm"
                  title="WhatsApp"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#1877F2] text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-sm"
                  title="Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-sm"
                  title="Instagram"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#FF0000] text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-sm"
                  title="YouTube"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* Twitter / X */}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-black text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-sm"
                    title="X (Twitter)"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}

                {/* LinkedIn */}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#0A66C2] text-white flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-sm"
                    title="LinkedIn"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-[#C4A760] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#C4A760] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-[#C4A760] transition-colors">
                  Our Doctors
                </Link>
              </li>
              <li>
                <Link to="/specialities" className="hover:text-[#C4A760] transition-colors">
                  Medical Specialities
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#C4A760] transition-colors">
                  Hospital Services
                </Link>
              </li>
              <li>
                <Link to="/appointment" className="hover:text-[#C4A760] transition-colors">
                  Book Consultation
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Patient Care & Legal */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Patient Care & Policies
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/terms" className="hover:text-[#C4A760] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#C4A760] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#C4A760] transition-colors">
                  Emergency & Helpdesk
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#C4A760] transition-colors">
                  Patient Portal / My Account
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-[#C4A760] transition-colors flex items-center gap-1.5 opacity-90 hover:opacity-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4A760]"></span>
                  <span>Hospital Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Hospital Contact Information */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Hospital Contact
            </h3>
            {address ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-sm text-[#93D3C3]/80 hover:text-white transition group"
                title="View on Google Maps & Get Directions"
              >
                <MapPin className="w-4 h-4 text-[#C4A760] mt-1 shrink-0 group-hover:scale-110 transition-transform" />
                <span>
                  {address}
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#C4A760] font-medium mt-1 underline block">
                    <span>Get Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </span>
              </a>
            ) : (
              <p className="text-xs text-[#93D3C3]/50 italic">Address can be configured in Admin Settings.</p>
            )}

            {phone && (
              <div className="flex items-center gap-3 text-sm text-[#93D3C3]/80">
                <Phone className="w-4 h-4 text-[#C4A760] shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-white transition">
                  {phone}
                </a>
              </div>
            )}

            {emergency && (
              <div className="flex items-center gap-3 text-sm text-red-300 font-bold">
                <Phone className="w-4 h-4 text-red-400 shrink-0" />
                <a href={`tel:${emergency}`} className="hover:underline transition">
                  24/7 Emergency: {emergency}
                </a>
              </div>
            )}

            {email && (
              <div className="flex items-center gap-3 text-sm text-[#93D3C3]/80">
                <Mail className="w-4 h-4 text-[#C4A760] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition">
                  {email}
                </a>
              </div>
            )}

            {whatsapp && (
              <div className="flex items-center gap-3 text-sm text-[#93D3C3]/80">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  WhatsApp: {whatsapp}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Location & Interactive Google Map */}
        <div className="mt-12 pt-8 border-t border-[#004C3D]">
          <div className="bg-[#00261E] rounded-3xl border border-[#004C3D] p-5 sm:p-6 lg:p-7 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Map Information & Direct Actions */}
              <div className="lg:col-span-4 space-y-3.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004C3D] text-[#C4A760] text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-[#C4A760]" />
                  <span>Hospital Map & Location</span>
                </div>
                <div>
                  <h4 className="text-white text-lg font-bold tracking-tight">
                    Visit {hospitalName}
                  </h4>
                  <p className="text-xs text-[#C4A760] font-semibold mt-0.5">
                    {hospitalSettings.tagline || 'Multispeciality Hospital, Vadodara'}
                  </p>
                </div>
                <p className="text-xs text-[#93D3C3]/90 leading-relaxed">
                  {address}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C4A760] hover:bg-[#B0934C] text-[#003329] font-bold text-xs rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>
                  <a
                    href={mapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition duration-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#93D3C3]" />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </div>

              {/* Responsive Google Maps Embed iframe */}
              <div className="lg:col-span-8 w-full h-56 sm:h-64 md:h-72 rounded-2xl overflow-hidden border border-[#004C3D] relative shadow-inner bg-[#001D17]">
                <iframe
                  title={`${hospitalName} Google Maps Location`}
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-[#004C3D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#93D3C3]/60">
          <div>{copyright}</div>
          <div className="flex items-center gap-1">
            <span>Built with care for patients & healthcare professionals</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
