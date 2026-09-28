import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseMedical, ArrowRight, ShieldCheck, Calendar } from 'lucide-react';
import { ServiceService } from '../services/serviceService';
import { HospitalService } from '../types/database';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ScrollReveal } from '../components/ScrollReveal';

export const Services: React.FC = () => {
  const [services, setServices] = useState<HospitalService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await ServiceService.getActiveServices();
        setServices(data);
      } catch (err) {
        console.error('Error fetching hospital services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-10 pb-20">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[#003329] via-[#006655] to-[#003329] text-white py-14">
        <ScrollReveal animation="fade-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-xs font-bold text-[#C4A760] uppercase tracking-widest block">
              Healthcare Infrastructure
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Hospital Facilities & Medical Services
            </h1>
            <p className="text-sm text-[#E0F2ED] max-w-xl mx-auto">
              Diagnostics, intensive care, day-care procedures, and 24x7 patient support services.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((serv, idx) => (
              <ScrollReveal key={serv.id} animation="fade-up" delay={(idx % 3) * 0.08}>
                <div className="card-lift bg-[#FBF8F1] rounded-2xl border border-[#E5DEC9] p-6 shadow-xs flex flex-col justify-between h-full group">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-xs">
                      {serv.image_url ? (
                        <img src={serv.image_url} alt={serv.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <BriefcaseMedical className="w-7 h-7" />
                      )}
                    </div>

                    <h3 className="font-bold text-xl text-[#006655] group-hover:text-[#004C3D] transition-colors">
                      {serv.name}
                    </h3>

                    <p className="text-sm text-[#4F7B72] mt-2.5 leading-relaxed">
                      {serv.description || 'Modern diagnostic equipment and specialized nursing care.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#E5DEC9] flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-[#82A39B] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#006655]" /> Clinical Quality
                    </span>
                    <Link
                      to="/appointment"
                      className="btn-shimmer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C4A760] hover:bg-[#B0934C] text-white text-xs font-semibold shadow-xs transition"
                    >
                      <span>Consult</span>
                      <ArrowRight className="w-3.5 h-3.5 icon-hover-arrow" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BriefcaseMedical}
            title="No Services Configured"
            description="Hospital services will be listed here once created in the admin portal."
          />
        )}
      </section>
    </div>
  );
};

