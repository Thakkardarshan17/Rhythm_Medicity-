import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Stethoscope, Users, Award, Clock, ArrowRight, Bed, Building2, Truck, Scissors, Activity } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const About: React.FC = () => {
  const { hospitalSettings, hospitalStats } = useSettings();

  const values = [
    {
      icon: HeartPulse,
      title: 'Compassionate Care',
      desc: 'Treating every patient with dignity, warmth, and individualized medical attention.',
    },
    {
      icon: ShieldCheck,
      title: 'Clinical Safety & Hygiene',
      desc: 'Adhering to strict sterilization protocols, patient safety standards, and ethical medical practices.',
    },
    {
      icon: Stethoscope,
      title: 'Evidence-Based Medicine',
      desc: 'Applying proven clinical guidelines, diagnostics, and modern treatment regimens.',
    },
    {
      icon: Users,
      title: 'Multidisciplinary Collaboration',
      desc: 'Our physicians, nurses, and specialists collaborate to ensure comprehensive patient recovery.',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#003329] via-[#006655] to-[#003329] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold text-[#C4A760] uppercase tracking-widest block">
            About Our Institution
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}
          </h1>
          <p className="text-base sm:text-lg text-[#E0F2ED] max-w-2xl mx-auto font-light">
            {hospitalSettings.tagline || 'ONE STOP SOLUTION FOR COMPLETE CARE'}
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold text-[#C4A760] uppercase tracking-wider block">
              Our Clinical Philosophy
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#006655] tracking-tight leading-snug">
              Delivering Accessible, Reliable, and High-Standard Medical Services
            </h2>
            <p className="text-[#004C3D] text-sm sm:text-base leading-relaxed">
              At {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}, we believe that quality healthcare begins with listening to the patient. From preventative health screenings to advanced clinical diagnostics and inpatient care, our infrastructure is built to support prompt and accurate medical intervention.
            </p>
            <p className="text-[#4F7B72] text-sm leading-relaxed">
              Our digital appointment booking architecture eliminates unnecessary queues, provides verified consultation slips with atomic numbering, and connects patients directly with certified practitioners.
            </p>
            <div className="pt-2">
              <Link
                to="/appointment"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C4A760] hover:bg-[#B0934C] text-white font-semibold text-sm shadow-md transition"
              >
                <span>Book a Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#E0F2ED] to-[#FBF8F1] p-8 rounded-3xl border border-[#E5DEC9] space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#006655] mb-2">Our Vision</h3>
              <p className="text-sm text-[#004C3D] leading-relaxed">
                To serve as a trusted regional healthcare center recognized for clinical excellence, patient satisfaction, and continuous technological enhancement in outpatient and hospital care.
              </p>
            </div>
            <div className="border-t border-[#E5DEC9] pt-4">
              <h3 className="text-lg font-bold text-[#006655] mb-2">Our Mission</h3>
              <p className="text-sm text-[#004C3D] leading-relaxed">
                To provide compassionate, comprehensive, and evidence-guided healthcare delivered by skilled medical professionals equipped with advanced diagnostics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#C4A760] uppercase tracking-wider block">
            Guiding Principles
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#006655] tracking-tight">
            Our Core Healthcare Values
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="bg-[#FBF8F1] p-6 rounded-2xl border border-[#E5DEC9] shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#006655]">{v.title}</h3>
                <p className="text-xs text-[#4F7B72] leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hospital Capacity & Infrastructure Stats (Dynamic) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#003329] text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#C4A760] uppercase tracking-wider block">
              Clinical Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hospital Capacity & Resources
            </h2>
            <p className="text-xs sm:text-sm text-[#93D3C3]">
              Real-time resource capacity managed and verified across departments.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/10 p-5 rounded-2xl border border-white/15 text-center">
              <Bed className="w-6 h-6 text-[#C4A760] mx-auto mb-2" />
              <div className="text-3xl font-black text-white">
                <AnimatedCounter end={hospitalStats.total_beds || 250} suffix="+" duration={1.8} />
              </div>
              <div className="text-xs font-bold text-[#C4A760] mt-1 uppercase">Total Beds</div>
            </div>

            <div className="bg-white/10 p-5 rounded-2xl border border-white/15 text-center">
              <HeartPulse className="w-6 h-6 text-rose-300 mx-auto mb-2" />
              <div className="text-3xl font-black text-white">
                <AnimatedCounter end={hospitalStats.total_icu_beds || 35} duration={1.8} />
              </div>
              <div className="text-xs font-bold text-rose-300 mt-1 uppercase">ICU Beds</div>
            </div>

            <div className="bg-white/10 p-5 rounded-2xl border border-white/15 text-center">
              <Users className="w-6 h-6 text-emerald-300 mx-auto mb-2" />
              <div className="text-3xl font-black text-white">
                <AnimatedCounter end={hospitalStats.total_doctors || 48} suffix="+" duration={1.8} />
              </div>
              <div className="text-xs font-bold text-emerald-300 mt-1 uppercase">Doctors</div>
            </div>

            <div className="bg-white/10 p-5 rounded-2xl border border-white/15 text-center">
              <Building2 className="w-6 h-6 text-sky-300 mx-auto mb-2" />
              <div className="text-3xl font-black text-white">
                <AnimatedCounter end={hospitalStats.total_departments || 12} duration={1.8} />
              </div>
              <div className="text-xs font-bold text-sky-300 mt-1 uppercase">Departments</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
