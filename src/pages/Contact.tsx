import React, { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';

export const Contact: React.FC = () => {
  const { hospitalSettings } = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      showToast('Please fill in required fields (Name, Phone, Message).', 'warning');
      return;
    }

    setSubmitted(true);
    showToast('Your message has been received by hospital reception.', 'success');
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[#003329] via-[#006655] to-[#003329] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold text-[#C4A760] uppercase tracking-widest block">
            Get in Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Contact & Hospital Location
          </h1>
          <p className="text-sm text-[#E0F2ED] max-w-xl mx-auto">
            Reach out for general inquiries, emergency guidance, or clinical assistance.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Contact Info from Real Database Settings */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-[#C4A760] uppercase tracking-wider block">
                Hospital Address & Helpdesk
              </span>
              <h2 className="text-2xl font-bold text-[#006655] mt-1">
                {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}
              </h2>
              <p className="text-xs font-semibold text-[#C4A760] uppercase tracking-wider mt-0.5">
                {hospitalSettings.tagline || 'ONE STOP SOLUTION FOR COMPLETE CARE'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Address */}
              <div className="bg-[#FBF8F1] p-5 rounded-2xl border border-[#E5DEC9] shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#006655] text-sm">Hospital Address</h3>
                {hospitalSettings.address ? (
                  <p className="text-xs text-[#004C3D] leading-relaxed whitespace-pre-line">
                    {hospitalSettings.address}
                  </p>
                ) : (
                  <p className="text-xs text-[#82A39B] italic">Address can be configured in Admin Settings.</p>
                )}
              </div>

              {/* Phone */}
              <div className="bg-[#FBF8F1] p-5 rounded-2xl border border-[#E5DEC9] shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#006655] text-sm">Phone Reception</h3>
                {hospitalSettings.phone ? (
                  <a
                    href={`tel:${hospitalSettings.phone}`}
                    className="text-xs font-medium text-[#C4A760] hover:underline block"
                  >
                    {hospitalSettings.phone}
                  </a>
                ) : (
                  <p className="text-xs text-[#82A39B] italic">Phone number not configured yet.</p>
                )}
              </div>

              {/* Email */}
              <div className="bg-[#FBF8F1] p-5 rounded-2xl border border-[#E5DEC9] shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#006655] text-sm">Official Email</h3>
                {hospitalSettings.email ? (
                  <a
                    href={`mailto:${hospitalSettings.email}`}
                    className="text-xs font-medium text-[#C4A760] hover:underline block"
                  >
                    {hospitalSettings.email}
                  </a>
                ) : (
                  <p className="text-xs text-[#82A39B] italic">Email not configured yet.</p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="bg-[#FBF8F1] p-5 rounded-2xl border border-[#E5DEC9] shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#006655] text-sm">WhatsApp Support</h3>
                {hospitalSettings.whatsapp_number ? (
                  <a
                    href={`https://wa.me/${hospitalSettings.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#C4A760] hover:underline block"
                  >
                    Chat on WhatsApp
                  </a>
                ) : (
                  <p className="text-xs text-[#82A39B] italic">WhatsApp not configured yet.</p>
                )}
              </div>
            </div>

            {/* Emergency Notice */}
            {hospitalSettings.emergency_number && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                <div className="text-xs">
                  <span className="font-bold">24x7 Emergency Room & Ambulance:</span>{' '}
                  <a href={`tel:${hospitalSettings.emergency_number}`} className="font-extrabold underline ml-1">
                    {hospitalSettings.emergency_number}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right: Hospital Inquiry Form */}
          <div className="bg-[#FBF8F1] p-8 rounded-3xl border border-[#E5DEC9] shadow-sm space-y-5">
            <h3 className="text-xl font-bold text-[#006655]">Send an Inquiry to Reception</h3>
            <p className="text-xs text-[#4F7B72]">
              For appointment scheduling, please use the dedicated appointment booking system. For general inquiries, submit the form below.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-[#E0F2ED] border border-[#006655]/20 text-[#006655] text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#006655] mx-auto" />
                <h4 className="font-bold text-base">Inquiry Submitted</h4>
                <p className="text-xs text-[#004C3D]">
                  Our hospital front desk has logged your query and will contact you shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', phone: '', message: '' });
                  }}
                  className="mt-3 text-xs font-semibold text-[#006655] underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-[#004C3D] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#004C3D] mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#004C3D] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655]"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#004C3D] mb-1">
                    Message / Question *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655] resize-none"
                    placeholder="How can our clinical team help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#C4A760] hover:bg-[#B0934C] text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
