import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, ArrowRight, Calendar } from 'lucide-react';
import { SpecialityService } from '../services/specialityService';
import { Speciality } from '../types/database';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ScrollReveal } from '../components/ScrollReveal';

export const Specialities: React.FC = () => {
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialities = async () => {
      try {
        const data = await SpecialityService.getActiveSpecialities();
        setSpecialities(data);
      } catch (err) {
        console.error('Error fetching specialities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialities();
  }, []);

  return (
    <div className="space-y-10 pb-20">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[#003329] via-[#006655] to-[#003329] text-white py-14">
        <ScrollReveal animation="fade-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-xs font-bold text-[#C4A760] uppercase tracking-widest block">
              Clinical Excellence
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Medical Specialities & Departments
            </h1>
            <p className="text-sm text-[#E0F2ED] max-w-xl mx-auto">
              Comprehensive outpatient and inpatient care structured across specialized medical disciplines.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Specialities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : specialities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialities.map((spec, idx) => (
              <ScrollReveal key={spec.id} animation="fade-up" delay={(idx % 3) * 0.08}>
                <div className="card-lift bg-[#FBF8F1] rounded-2xl border border-[#E5DEC9] p-6 shadow-xs flex flex-col justify-between h-full group">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-xs">
                      {spec.image_url ? (
                        <img
                          src={spec.image_url}
                          alt={spec.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Stethoscope className="w-7 h-7" />
                      )}
                    </div>

                    <h3 className="font-bold text-xl text-[#006655] group-hover:text-[#004C3D] transition-colors">
                      {spec.name}
                    </h3>

                    <p className="text-sm text-[#4F7B72] mt-2.5 leading-relaxed">
                      {spec.description || 'Specialized diagnostic consultations and clinical treatments.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#E5DEC9] flex items-center justify-between">
                    <Link
                      to={`/doctors?speciality=${spec.id}`}
                      className="text-xs font-bold text-[#006655] hover:text-[#004C3D] flex items-center gap-1 group/btn"
                    >
                      <span>View Doctors</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to={`/appointment?speciality=${spec.id}`}
                      className="btn-shimmer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C4A760] hover:bg-[#B0934C] text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book OPD</span>
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Stethoscope}
            title="No Specialities Configured"
            description="Clinical specialities will appear here once added through the hospital administration portal."
          />
        )}
      </section>
    </div>
  );
};

