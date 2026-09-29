import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Calendar,
  UserCheck,
  Stethoscope,
  BriefcaseMedical,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  Activity,
  Bed,
  HeartPulse,
  Building2,
  Phone,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { BannerService, DEFAULT_BANNER_CAROUSEL_SETTINGS } from '../services/bannerService';
import { SpecialityService } from '../services/specialityService';
import { DoctorService } from '../services/doctorService';
import { Banner, Speciality, Doctor, BannerCarouselSettings } from '../types/database';
import { useSettings } from '../contexts/SettingsContext';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ScrollReveal } from '../components/ScrollReveal';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export const Home: React.FC = () => {
  const { hospitalSettings, hospitalStats, websiteUISettings } = useSettings();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerSettings, setBannerSettings] = useState<BannerCarouselSettings>(
    DEFAULT_BANNER_CAROUSEL_SETTINGS
  );
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Parallax Scroll Tracking for Hero
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroTextY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const heroDecorY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  // Viewport scroll trigger for Hospital Capacity & Medical Excellence Section (triggers when 30-50% visible)
  const statsSectionRef = useRef<HTMLElement>(null);
  const [statsSectionVisible, setStatsSectionVisible] = useState(false);

  useEffect(() => {
    const el = statsSectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsSectionVisible(true);
          observer.disconnect(); // Animate only once upon entering viewport
        }
      },
      {
        threshold: 0.35, // Trigger when approximately 35% (30-50%) of the statistics section becomes visible
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const loadHomeData = async () => {
    try {
      const [bannersData, settingsData, specsData, docsData] = await Promise.all([
        BannerService.getActiveBanners(),
        BannerService.getBannerSettings(),
        SpecialityService.getActiveSpecialities(),
        DoctorService.getActiveDoctors(),
      ]);
      setBanners(bannersData);
      setBannerSettings(settingsData);
      setSpecialities(specsData);
      setDoctors(docsData);
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  // Real-time synchronization: reflect admin modifications automatically without page reload
  useRealtimeSync({ table: 'banners', onUpdate: loadHomeData });
  useRealtimeSync({ table: 'doctors', onUpdate: loadHomeData });
  useRealtimeSync({ table: 'specialities', onUpdate: loadHomeData });

  // Admin-Controlled Hero Carousel Auto-Timer with dynamic interval & pause on hover
  useEffect(() => {
    if (banners.length <= 1) return;
    if (!bannerSettings.auto_play) return;
    if (bannerSettings.pause_on_hover && isHovered) return;

    const intervalMs = Math.max(2, bannerSettings.auto_scroll_interval || 5) * 1000;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [banners.length, bannerSettings.auto_scroll_interval, bannerSettings.auto_play, bannerSettings.pause_on_hover, isHovered]);

  // Determine transition duration & animation style class
  const getSpeedClass = () => {
    switch (bannerSettings.transition_speed) {
      case 'fast':
        return 'duration-400';
      case 'slow':
        return 'duration-1000';
      case 'normal':
      default:
        return 'duration-700';
    }
  };

  const getSlideAnimationClass = (index: number, isCurrent: boolean) => {
    const speed = getSpeedClass();
    const animType = bannerSettings.transition_animation || 'fade';

    if (animType === 'slide') {
      return `transition-all ${speed} ease-out ${
        isCurrent
          ? 'opacity-100 translate-x-0 z-10'
          : index > currentSlide
          ? 'opacity-0 translate-x-full z-0 pointer-events-none'
          : 'opacity-0 -translate-x-full z-0 pointer-events-none'
      }`;
    }

    if (animType === 'zoom') {
      return `transition-all ${speed} cubic-bezier(0.25, 1, 0.5, 1) ${
        isCurrent ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-108 z-0 pointer-events-none'
      }`;
    }

    if (animType === 'smooth') {
      return `transition-all ${speed} ease-in-out ${
        isCurrent
          ? 'opacity-100 blur-0 scale-100 z-10'
          : 'opacity-0 blur-xs scale-[1.03] z-0 pointer-events-none'
      }`;
    }

    // Default Cross-Fade
    return `transition-opacity ${speed} ease-in-out ${
      isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
    }`;
  };

  const quickActions = [
    {
      title: 'Book Appointment',
      desc: 'Consult specialist doctors with instant verified booking',
      icon: Calendar,
      link: '/appointment',
      featured: true,
      color: 'bg-[#FBF8F1] text-[#004C3D] border-2 border-[#C4A760] shadow-md shadow-[#C4A760]/10',
    },
    {
      title: 'Find Doctor',
      desc: 'Browse our experienced medical practitioners',
      icon: UserCheck,
      link: '/doctors',
      featured: false,
      color: 'bg-[#FBF8F1] text-[#004C3D] border border-[#E5DEC9]',
    },
    {
      title: 'Specialities',
      desc: 'Comprehensive clinical departments & expertise',
      icon: Stethoscope,
      link: '/specialities',
      featured: false,
      color: 'bg-[#FBF8F1] text-[#004C3D] border border-[#E5DEC9]',
    },
    {
      title: 'Services',
      desc: 'Advanced diagnostics, inpatient & intensive care',
      icon: BriefcaseMedical,
      link: '/services',
      featured: false,
      color: 'bg-[#FBF8F1] text-[#004C3D] border border-[#E5DEC9]',
    },
    {
      title: 'Contact Hospital',
      desc: '24/7 Emergency assistance, location & helpline',
      icon: PhoneCall,
      link: '/contact',
      featured: false,
      color: 'bg-[#FBF8F1] text-[#004C3D] border border-[#E5DEC9]',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 overflow-x-hidden">
      {/* 1. HERO SECTION & PARALLAX CAROUSEL */}
      <section
        ref={heroRef}
        className={`relative overflow-hidden ${
          banners.length > 0
            ? 'w-full bg-transparent'
            : 'bg-gradient-to-b from-[#003329] via-[#004C3D] to-[#003329] text-white'
        }`}
      >
        {banners.length === 0 && (
          <>
            {/* Decorative Parallax Grid and Gradient Spheres for default hero */}
            <motion.div
              style={{ y: heroBgY }}
              className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#C4A760_1.5px,transparent_1.5px)] [background-size:28px_28px]"
            />
            <motion.div
              style={{ y: heroDecorY }}
              className="absolute -top-32 -right-32 w-96 h-96 bg-[#006655]/40 rounded-full blur-3xl pointer-events-none animate-float-gentle"
            />
            <motion.div
              style={{ y: heroDecorY }}
              className="absolute bottom-0 -left-20 w-80 h-80 bg-[#C4A760]/15 rounded-full blur-3xl pointer-events-none"
            />
          </>
        )}

        {banners.length > 0 ? (
          // Admin-Managed Carousel - 100% Full View, Edge-to-Edge, Zero Green Bars
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative w-full overflow-hidden select-none bg-transparent"
          >
            {banners.map((banner, index) => {
              const isCurrent = index === currentSlide;
              const animClass = getSlideAnimationClass(index, isCurrent);

              return (
                <div
                  key={banner.id}
                  className={`${
                    isCurrent
                      ? 'relative block z-10'
                      : 'absolute inset-0 opacity-0 pointer-events-none z-0'
                  } ${animClass} w-full`}
                >
                  {banner.cta_link ? (
                    <Link to={banner.cta_link} className="block w-full cursor-pointer">
                      <img
                        src={banner.image_url}
                        alt={banner.title || 'Hospital Banner'}
                        className="w-full h-auto block select-none"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                    </Link>
                  ) : (
                    <div className="relative w-full">
                      <img
                        src={banner.image_url}
                        alt={banner.title || 'Hospital Banner'}
                        className="w-full h-auto block select-none"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />

                      {/* Optional sleek floating CTA button if cta_text is configured */}
                      {banner.cta_text && (
                        <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 z-20 pointer-events-auto">
                          <Link
                            to={banner.cta_link || '/appointment'}
                            className="btn-shimmer btn-gold px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl inline-flex items-center gap-2 border border-white/20 backdrop-blur-xs"
                          >
                            <span>{banner.cta_text}</span>
                            <ArrowRight className="w-4 h-4 icon-hover-arrow" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Slider Navigation Arrows */}
            {banners.length > 1 && bannerSettings.show_navigation_arrows !== false && (
              <>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Slider Dots */}
            {banners.length > 1 && bannerSettings.show_pagination_dots !== false && (
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-6 sm:w-8 bg-[#C4A760]' : 'w-2 sm:w-2.5 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Elegant Default Visual with Parallax Layers
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10">
            {websiteUISettings.hero_image_url && (
              <motion.div
                style={{ y: heroBgY }}
                className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-25"
              >
                <img
                  src={websiteUISettings.hero_image_url}
                  alt="Hero Background"
                  className="w-full h-full object-cover scale-105"
                />
              </motion.div>
            )}
            <motion.div
              style={{ y: heroTextY, opacity: heroOpacity }}
              className="max-w-3xl space-y-6 relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#006655]/50 text-[#C4A760] border border-[#C4A760]/40 text-xs font-bold tracking-wider uppercase shadow-sm backdrop-blur-md">
                <Activity className="w-4 h-4 animate-pulse text-[#C4A760]" />
                <span>{hospitalSettings.tagline || 'ONE STOP SOLUTION FOR COMPLETE CARE'}</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                {websiteUISettings.hero_heading || (
                  <>
                    Compassionate Healthcare,{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E0F2ED] via-white to-[#C4A760]">
                      Advanced Technology.
                    </span>
                  </>
                )}
              </h1>
              <p className="text-base sm:text-lg text-[#E0F2ED] font-light leading-relaxed">
                {websiteUISettings.hero_description ||
                  `Welcome to ${hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}. Schedule verified appointments with our medical specialists and experience professional, streamlined healthcare.`}
              </p>
              <div className="pt-3 flex flex-wrap gap-3 sm:gap-4">
                <Link
                  to="/appointment"
                  className="btn-shimmer btn-gold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-white font-bold text-sm sm:text-base shadow-lg inline-flex items-center gap-2 shrink-0"
                >
                  <Calendar className="w-5 h-5 shrink-0 text-white" />
                  <span className="whitespace-nowrap">
                    {websiteUISettings.appointment_button_text || 'Book Appointment'}
                  </span>
                </Link>
                <Link
                  to="/doctors"
                  className="btn-premium px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FBF8F1] font-semibold text-sm sm:text-base backdrop-blur-md border border-[#C4A760]/50 inline-flex items-center gap-2 shrink-0"
                >
                  <UserCheck className="w-5 h-5 shrink-0 text-[#C4A760]" />
                  <span className="whitespace-nowrap">
                    {websiteUISettings.cta_text || 'View Doctors'}
                  </span>
                </Link>
                {(websiteUISettings.emergency_number || hospitalSettings.emergency_number) && (
                  <a
                    href={`tel:${websiteUISettings.emergency_number || hospitalSettings.emergency_number}`}
                    className="btn-premium px-5 py-3 sm:py-3.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-sm sm:text-base backdrop-blur-md border border-rose-400/40 inline-flex items-center gap-2 shrink-0 shadow-md"
                  >
                    <Phone className="w-4 h-4 shrink-0 text-white icon-hover-bounce" />
                    <span>Emergency: {websiteUISettings.emergency_number || hospitalSettings.emergency_number}</span>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* 2. QUICK ACTIONS SECTION WITH STAGGERED REVEAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-14 relative z-30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action, idx) => {
            const IconComponent = action.icon;
            return (
              <ScrollReveal key={action.title} animation="fade-up" delay={idx * 0.08}>
                <Link
                  to={action.link}
                  className={`card-lift p-5 rounded-2xl group flex flex-col justify-between h-full ${action.color}`}
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                        idx === 0
                          ? 'bg-[#C4A760] text-white shadow-sm'
                          : 'bg-[#F6F0DC] text-[#C4A760] border border-[#EADFB9]'
                      }`}
                    >
                      <IconComponent className="w-6 h-6 shrink-0" />
                    </div>
                    <h3 className="font-black text-base sm:text-lg tracking-tight mb-1.5 text-[#006655]">
                      {action.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[#004C3D]">
                      {action.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs font-bold text-[#C4A760] border-t border-[#E5DEC9] group-hover:text-[#B0934C]">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* 3. MEDICAL SPECIALITIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <ScrollReveal animation="fade-down">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#C4A760] uppercase tracking-widest block">
                Specialized Healthcare
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#006655] tracking-tight mt-1">
                Clinical Specialities
              </h2>
            </div>
            <Link
              to="/specialities"
              className="text-sm font-semibold text-[#C4A760] hover:text-[#B0934C] flex items-center gap-1 group nav-link-animated"
            >
              <span>View All Specialities</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : specialities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialities.slice(0, 8).map((spec, idx) => (
              <ScrollReveal key={spec.id} animation="fade-up" delay={(idx % 4) * 0.08}>
                <div className="card-lift bg-[#FBF8F1] rounded-2xl border border-[#E5DEC9] p-6 shadow-xs group flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-[#006655] group-hover:text-[#004C3D] transition-colors">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-[#4F7B72] mt-2 line-clamp-3 leading-relaxed">
                      {spec.description || 'Dedicated specialist care and advanced treatment.'}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#E5DEC9] flex items-center justify-between">
                    <Link
                      to={`/doctors?speciality=${spec.id}`}
                      className="text-xs font-bold text-[#006655] hover:underline flex items-center gap-1"
                    >
                      View Doctors <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/appointment?speciality=${spec.id}`}
                      className="btn-shimmer text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C4A760] hover:bg-[#B0934C] text-white transition-all shadow-xs"
                    >
                      Book
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
            description="Medical specialities will appear here once configured by the hospital administration."
            actionText="Go to Specialities"
            actionHref="/specialities"
          />
        )}
      </section>

      {/* 3.5 HOSPITAL STATISTICS & CAPACITY WITH SMOOTH COUNT-UP ANIMATION */}
      {websiteUISettings.show_hospital_statistics !== false && (
        <section
          ref={statsSectionRef}
          id="hospital-capacity-excellence"
          className="bg-gradient-to-b from-[#003329] via-[#004C3D] to-[#003329] text-white py-16 sm:py-20 relative overflow-hidden"
        >
          {/* Subtle background ornamentation */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#C4A760_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
            <ScrollReveal animation="fade-down">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006655] text-[#C4A760] text-xs font-bold uppercase tracking-wider border border-[#C4A760]/30 shadow-xs">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  Live Infrastructure Metrics
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Hospital Capacity & Medical Excellence
                </h2>
                <p className="text-sm sm:text-base text-[#93D3C3] leading-relaxed">
                  Equipped with cutting-edge critical care units, advanced modular theatres, and round-the-clock emergency infrastructure.
                </p>
              </div>
            </ScrollReveal>

            {/* Key 4 Highlights matching user prompt: 0 -> 250+ Beds, 0 -> 35 ICU Beds, 0 -> 48+ Doctors, 0 -> 12 Departments */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <ScrollReveal animation="fade-up" delay={0}>
                <div className="card-lift bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:border-[#C4A760]/60 text-center group h-full">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#C4A760]/20 text-[#C4A760] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Bed className="w-6 h-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    <AnimatedCounter
                      end={hospitalStats.total_beds || 250}
                      suffix="+"
                      duration={1.8}
                      trigger={statsSectionVisible}
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#C4A760] uppercase tracking-wider mt-1">
                    Total Beds
                  </div>
                  <p className="text-[11px] text-[#93D3C3]/80 mt-1">
                    Including General, Private & Daycare
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={0.1}>
                <div className="card-lift bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:border-[#C4A760]/60 text-center group h-full">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    <AnimatedCounter
                      end={hospitalStats.total_icu_beds || 35}
                      duration={1.8}
                      trigger={statsSectionVisible}
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-rose-300 uppercase tracking-wider mt-1">
                    ICU Beds
                  </div>
                  <p className="text-[11px] text-[#93D3C3]/80 mt-1">
                    Ventilator & hemodynamic monitoring
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={0.2}>
                <div className="card-lift bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:border-[#C4A760]/60 text-center group h-full">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    <AnimatedCounter
                      end={hospitalStats.total_doctors || 48}
                      suffix="+"
                      duration={1.8}
                      trigger={statsSectionVisible}
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-300 uppercase tracking-wider mt-1">
                    Senior Doctors
                  </div>
                  <p className="text-[11px] text-[#93D3C3]/80 mt-1">
                    Specialists & certified surgeons
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={0.3}>
                <div className="card-lift bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:border-[#C4A760]/60 text-center group h-full">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    <AnimatedCounter
                      end={hospitalStats.total_departments || 12}
                      duration={1.8}
                      trigger={statsSectionVisible}
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mt-1">
                    Departments
                  </div>
                  <p className="text-[11px] text-[#93D3C3]/80 mt-1">
                    Super-speciality clinical domains
                  </p>
                </div>
              </ScrollReveal>
            </div>

            {/* Detailed Secondary Metrics Grid */}
            <ScrollReveal animation="blur-clear" delay={0.2}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pt-4 border-t border-white/10">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
                  <span className="text-[11px] text-[#93D3C3] block font-medium">Operation Theatres</span>
                  <span className="text-xl font-extrabold text-white mt-0.5 block">
                    <AnimatedCounter
                      end={hospitalStats.total_operation_theatres || 8}
                      duration={1.6}
                      trigger={statsSectionVisible}
                    />
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
                  <span className="text-[11px] text-[#93D3C3] block font-medium">Ambulances (24/7)</span>
                  <span className="text-xl font-extrabold text-white mt-0.5 block">
                    <AnimatedCounter
                      end={hospitalStats.total_ambulances || 5}
                      duration={1.6}
                      trigger={statsSectionVisible}
                    />
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
                  <span className="text-[11px] text-[#93D3C3] block font-medium">Diagnostic Labs</span>
                  <span className="text-xl font-extrabold text-white mt-0.5 block">
                    <AnimatedCounter
                      end={hospitalStats.total_labs || 4}
                      duration={1.6}
                      trigger={statsSectionVisible}
                    />
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
                  <span className="text-[11px] text-[#93D3C3] block font-medium">Dedicated Nurses</span>
                  <span className="text-xl font-extrabold text-white mt-0.5 block">
                    <AnimatedCounter
                      end={hospitalStats.total_nurses || 120}
                      suffix="+"
                      duration={1.6}
                      trigger={statsSectionVisible}
                    />
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
                  <span className="text-[11px] text-[#93D3C3] block font-medium">Emergency Beds</span>
                  <span className="text-xl font-extrabold text-white mt-0.5 block">
                    <AnimatedCounter
                      end={hospitalStats.emergency_beds || 18}
                      duration={1.6}
                      trigger={statsSectionVisible}
                    />
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
                  <span className="text-[11px] text-[#93D3C3] block font-medium">Available Beds</span>
                  <span className="text-xl font-extrabold text-[#C4A760] mt-0.5 block">
                    <AnimatedCounter
                      end={hospitalStats.available_beds || 42}
                      duration={1.6}
                      trigger={statsSectionVisible}
                    />
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* 4. EXPERIENCED DOCTORS DIRECTORY PREVIEW WITH STAGGER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <ScrollReveal animation="fade-down">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#C4A760] uppercase tracking-widest block">
                Qualified Medical Staff
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#006655] tracking-tight mt-1">
                Our Senior Doctors
              </h2>
            </div>
            <Link
              to="/doctors"
              className="text-sm font-semibold text-[#C4A760] hover:text-[#B0934C] flex items-center gap-1 group nav-link-animated"
            >
              <span>All Doctors</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.slice(0, 6).map((doc, idx) => (
              <ScrollReveal key={doc.id} animation="fade-up" delay={(idx % 3) * 0.1}>
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
                          {doc.speciality?.name || 'Specialist'}
                        </span>
                        <h3 className="font-bold text-base text-[#006655] leading-snug truncate group-hover:text-[#004C3D]">
                          {doc.full_name}
                        </h3>
                        <p className="text-xs text-[#4F7B72] font-medium truncate">{doc.qualification}</p>
                        <div className="flex items-center gap-1 text-xs text-[#82A39B]">
                          <Award className="w-3.5 h-3.5 text-[#C4A760]" />
                          <span>{doc.experience_years} Years Experience</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E5DEC9] flex items-center justify-between text-xs">
                      <span className="text-[#4F7B72]">Consultation Fee</span>
                      <span className="font-extrabold text-[#006655] text-sm">
                        {formatCurrency(doc.consultation_fee)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#F4EEDF] p-4 border-t border-[#E5DEC9] flex items-center gap-2">
                    <Link
                      to={`/doctors/${doc.slug || doc.id}`}
                      className="btn-premium flex-1 text-center py-2 text-xs font-semibold text-[#004C3D] bg-white border border-[#E5DEC9] hover:bg-[#E0F2ED] rounded-xl transition"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/appointment?doctor=${doc.id}`}
                      className="btn-shimmer flex-1 text-center py-2 text-xs font-semibold text-white bg-[#C4A760] hover:bg-[#B0934C] rounded-xl shadow-xs transition"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UserCheck}
            title="No Doctors Available Yet"
            description="Doctors will be listed here as soon as they are added in the Admin Portal."
            actionText="Browse Specialities"
            actionHref="/specialities"
          />
        )}
      </section>

      {/* 5. COMMITMENT & PATIENT SAFETY BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="scale-in">
          <div className="bg-gradient-to-r from-[#003329] to-[#006655] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#C4A760_1.5px,transparent_1.5px)] opacity-10 pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C4A760] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Patient First Healthcare
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Transparent, Atomic & Verified Appointment Booking
              </h2>
              <p className="text-sm sm:text-base text-[#E0F2ED] leading-relaxed">
                Every confirmed consultation at {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'} is verified with an atomic sequential appointment number and printable A5 document slip.
              </p>
              <div className="pt-2">
                <Link
                  to="/appointment"
                  className="btn-shimmer btn-gold inline-flex items-center gap-2 px-7 py-3.5 text-white font-bold text-sm rounded-xl shadow-md"
                >
                  <span>Schedule a Consultation Now</span>
                  <ArrowRight className="w-4 h-4 icon-hover-arrow" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};

