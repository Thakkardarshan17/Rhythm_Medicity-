import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Stethoscope, Award, Calendar, User, ArrowRight, X } from 'lucide-react';
import { DoctorService } from '../services/doctorService';
import { SpecialityService } from '../services/specialityService';
import { Doctor, Speciality } from '../types/database';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { ScrollReveal } from '../components/ScrollReveal';

export const Doctors: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const specialityParam = searchParams.get('speciality') || '';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState(specialityParam);

  useEffect(() => {
    setSelectedSpeciality(specialityParam);
  }, [specialityParam]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docs, specs] = await Promise.all([
          DoctorService.getActiveDoctors(selectedSpeciality || undefined),
          SpecialityService.getActiveSpecialities(),
        ]);
        setDoctors(docs);
        setSpecialities(specs);
      } catch (err) {
        console.error('Error fetching doctors directory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSpeciality]);

  const handleSpecialityChange = (specId: string) => {
    setSelectedSpeciality(specId);
    if (specId) {
      setSearchParams({ speciality: specId });
    } else {
      setSearchParams({});
    }
  };

  const cleanQ = searchQuery.toLowerCase().trim();
  const filteredDoctors = doctors.filter((doc) => {
    if (!cleanQ) return true;
    const name = doc.full_name?.toLowerCase() || '';
    const qual = doc.qualification?.toLowerCase() || '';
    const spec = doc.speciality?.name?.toLowerCase() || '';
    const dept = ((doc as any).department?.toLowerCase() || '');
    const phone = doc.phone || '';
    const bio = doc.bio?.toLowerCase() || '';
    const room = doc.clinic_room?.toLowerCase() || '';

    return (
      name.includes(cleanQ) ||
      qual.includes(cleanQ) ||
      spec.includes(cleanQ) ||
      dept.includes(cleanQ) ||
      phone.includes(cleanQ) ||
      bio.includes(cleanQ) ||
      room.includes(cleanQ)
    );
  });

  return (
    <div className="space-y-10 pb-20">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[#003329] via-[#006655] to-[#003329] text-white py-14">
        <ScrollReveal animation="fade-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-xs font-bold text-[#C4A760] uppercase tracking-widest block">
              Medical Faculty
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Consult Our Medical Doctors
            </h1>
            <p className="text-sm text-[#E0F2ED] max-w-xl mx-auto">
              Certified consultants and physicians across all active clinical departments.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="bg-[#FBF8F1] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#006655] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor name, department, or degree..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-sm text-[#004C3D] placeholder-[#82A39B] focus:outline-none focus:ring-2 focus:ring-[#006655] focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Specialities Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => handleSpecialityChange('')}
                className={`btn-premium px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  !selectedSpeciality
                    ? 'bg-[#006655] text-white shadow-xs'
                    : 'bg-white text-[#004C3D] border border-[#E5DEC9] hover:bg-[#E0F2ED]'
                }`}
              >
                All Departments
              </button>
              {specialities.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => handleSpecialityChange(spec.id)}
                  className={`btn-premium px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedSpeciality === spec.id
                      ? 'bg-[#006655] text-white shadow-xs'
                      : 'bg-white text-[#004C3D] border border-[#E5DEC9] hover:bg-[#E0F2ED]'
                  }`}
                >
                  {spec.name}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Doctors Grid */}
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
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc, idx) => (
              <ScrollReveal key={doc.id} animation="fade-up" delay={(idx % 3) * 0.08}>
                <div className="card-lift bg-[#FBF8F1] rounded-2xl border border-[#E5DEC9] overflow-hidden shadow-xs flex flex-col justify-between h-full group">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative overflow-hidden rounded-2xl shrink-0">
                        {doc.photo_url ? (
                          <img
                            src={doc.photo_url}
                            alt={doc.full_name}
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-[#E0F2ED] img-zoom"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center font-bold text-2xl">
                            {doc.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0F2ED] text-[#006655] uppercase">
                          {doc.speciality?.name || 'Medical Specialist'}
                        </span>
                        <h3 className="font-bold text-lg text-[#006655] group-hover:text-[#004C3D] transition-colors truncate">
                          {doc.full_name}
                        </h3>
                        <p className="text-xs text-[#4F7B72] font-medium truncate">{doc.qualification}</p>
                        <div className="flex items-center gap-1.5 text-xs text-[#82A39B]">
                          <Award className="w-3.5 h-3.5 text-[#C4A760]" />
                          <span>{doc.experience_years} Years Experience</span>
                        </div>
                      </div>
                    </div>

                    {/* Consultation Timings & Fee */}
                    <div className="mt-5 pt-4 border-t border-[#E5DEC9] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#4F7B72]">OPD Consultation Fee:</span>
                        <span className="font-extrabold text-[#006655] text-base">
                          {formatCurrency(doc.consultation_fee)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#4F7B72]">Availability:</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F2ED] text-[#006655]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006655] animate-pulse" />
                          Available for Booking
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="bg-[#F4EEDF] p-4 border-t border-[#E5DEC9] flex items-center gap-2">
                    <Link
                      to={`/doctors/${doc.slug || doc.id}`}
                      className="btn-premium flex-1 text-center py-2.5 text-xs font-semibold text-[#004C3D] bg-white border border-[#E5DEC9] hover:bg-[#E0F2ED] rounded-xl transition"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/appointment?doctor=${doc.id}&speciality=${doc.speciality_id || ''}`}
                      className="btn-shimmer flex-1 text-center py-2.5 text-xs font-bold text-white bg-[#C4A760] hover:bg-[#B0934C] rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book</span>
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={User}
            title="No Doctors Available"
            description={
              searchQuery
                ? 'No doctors matched your current search filters.'
                : 'No doctors have been registered in this department yet.'
            }
            actionText={searchQuery ? 'Clear Search' : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        )}
      </section>
    </div>
  );
};

