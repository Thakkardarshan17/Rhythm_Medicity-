import { DoctorService } from './doctorService';
import { SpecialityService } from './specialityService';
import { ServiceService } from './serviceService';
import { SettingsService } from './settingsService';
import { PageService } from './pageService';
import { Doctor, Speciality, HospitalService, HospitalSettings } from '../types/database';

export type SearchCategory = 'doctor' | 'department' | 'service' | 'page' | 'faq' | 'hospital_info';

export interface SearchResultItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon?: string;
  badge?: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchConfig {
  search_enabled: boolean;
  enable_doctors: boolean;
  enable_departments: boolean;
  enable_services: boolean;
  enable_pages: boolean;
  enable_faqs: boolean;
  enable_hospital_info: boolean;
  custom_synonyms: Record<string, string[]>;
}

const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  search_enabled: true,
  enable_doctors: true,
  enable_departments: true,
  enable_services: true,
  enable_pages: true,
  enable_faqs: true,
  enable_hospital_info: true,
  custom_synonyms: {
    cardiology: ['heart', 'heart doctor', 'cardiac', 'cardiologist', 'chest pain', 'હાર્ટ', 'હૃદય', 'દિલ', 'दिल', 'दिल का डॉक्टर'],
    dermatology: ['skin', 'skin doctor', 'dermatologist', 'hair', 'derma', 'ત્વચા', 'ચામડી', 'त्वचा', 'चर्म रोग'],
    orthopedics: ['bone', 'bones', 'orthopedic', 'fracture', 'joint', 'knee', 'હાડકા', 'જોઇન્ટ', 'हड्डी', 'जोड़'],
    neurology: ['brain', 'nerve', 'neurologist', 'spine', 'મગજ', 'ચેતા', 'मस्तिष्क', 'दिमाग', 'नसों'],
    pediatrics: ['child', 'children', 'kids', 'baby', 'pediatrician', 'બાળકો', 'બાળક', 'बच्चे', 'बच्चा', 'शिशु'],
    gynecology: ['women', 'pregnancy', 'maternity', 'gynecologist', 'lady doctor', 'ગાયનેક', 'સ્ત્રી રોગ', 'महिला', 'प्रसूति'],
    nephrology: ['kidney', 'renal', 'dialysis', 'nephrologist', 'કિડની', 'ગુરદા', 'किडनी', 'गुर्दा'],
    oncology: ['cancer', 'tumor', 'oncologist', 'કેન્સર', 'કેન્સરના ડોક્ટર', 'कैंसर', 'कैंसर विशेषज्ञ'],
    gastroenterology: ['stomach', 'digestive', 'liver', 'gastro', 'પેટ', 'પાચન', 'पेट', 'पाचन'],
    ophthalmology: ['eye', 'eyes', 'vision', 'cataract', 'ophthalmologist', 'આંખ', 'આંખના ડોક્ટર', 'आँख', 'आँखों के डॉक्टर'],
    ent: ['ear', 'nose', 'throat', 'ent doctor', 'કાન', 'નાક', 'ગળું', 'कान', 'नाक', 'गला'],
    pulmonology: ['lung', 'lungs', 'chest', 'asthma', 'breathing', 'ફેફસાં', 'શ્વાસ', 'फेफड़े', 'अस्थमा'],
    timings: ['time', 'timings', 'hours', 'samay', 'open', 'schedule', 'opening hours', 'ક્યારે ખુલે છે', 'સમય', 'समय', 'कब खुलता है'],
    emergency: ['emergency', 'urgent', '108', 'ambulance', 'helpline', 'casualty', 'ઇમરજન્સી', 'એમ્બ્યુલન્સ', 'इमरजेंसी', 'एम्बुलेंस'],
    appointment: ['book appointment', 'consultation', 'doctor appointment', 'અપોઇન્ટમેન્ટ', 'મુલાકાત', 'अपॉइंटमेंट', 'दिखाना'],
  },
};

const SEARCH_CONFIG_KEY = 'rhythm_search_configuration_v1';

// Static FAQs indexed for immediate search assistance
const HOSPITAL_FAQS = [
  {
    id: 'faq-1',
    question: 'What are the OPD consultation timings at Rhythm Medicity?',
    answer: 'General OPD operates Monday to Saturday from 09:00 AM to 08:00 PM. Emergency services operate 24/7.',
    keywords: ['opd timings', 'hospital time', 'hours', 'samay', 'when open', 'સમય'],
    url: '/about',
  },
  {
    id: 'faq-2',
    question: 'How do I book an OPD appointment?',
    answer: 'Click "Book Appointment" in the header, log in to your patient account, select your specialist, choose date & time, and verify.',
    keywords: ['book appointment', 'appointment booking', 'schedule', 'kivave book karvu', 'अपॉइंटमेंट कैसे बुक करें'],
    url: '/appointment',
  },
  {
    id: 'faq-3',
    question: 'Is 24x7 emergency and ambulance service available?',
    answer: 'Yes, Rhythm Medicity has a 24x7 Level-1 Trauma Centre, Advanced ICU, and fully equipped Cardiac Ambulances. Call 108 or our direct helpline.',
    keywords: ['emergency', 'ambulance', 'icu', 'trauma', '108', 'helpline', 'એમ્બ્યુલન્સ', 'इमरजेंसी'],
    url: '/contact',
  },
  {
    id: 'faq-4',
    question: 'What health insurance and cashless TPA facilities are accepted?',
    answer: 'We accept PMJAY Ayushman Bharat, all leading Private Health Insurance TPAs, and corporate corporate cashless health covers.',
    keywords: ['tpa', 'cashless', 'insurance', 'pmjay', 'ayushman', 'મેડીક્લેમ', 'बीमा'],
    url: '/services',
  },
  {
    id: 'faq-5',
    question: 'Where is Rhythm Medicity located?',
    answer: 'Rhythm Medicity is located Opp. Civil Hospital Road, Anand, Gujarat - 388001 with 24/7 valet parking.',
    keywords: ['address', 'location', 'direction', 'where', 'anand', 'map', 'ક્યાં આવેલું છે', 'पता'],
    url: '/contact',
  },
];

export class SearchService {
  /**
   * Load Admin Search Settings
   */
  static getConfig(): SearchConfig {
    try {
      const saved = localStorage.getItem(SEARCH_CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_SEARCH_CONFIG, ...JSON.parse(saved) };
      }
    } catch (_) {}
    return DEFAULT_SEARCH_CONFIG;
  }

  /**
   * Update Admin Search Settings
   */
  static updateConfig(config: Partial<SearchConfig>): SearchConfig {
    const updated = { ...this.getConfig(), ...config };
    localStorage.setItem(SEARCH_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Check if a query is a clinical symptom or conversational question
   * suited for Dillo AI Assistant assistance
   */
  static isConversationalOrSymptomQuery(query: string): boolean {
    const lower = query.toLowerCase();
    const symptomKeywords = [
      'pain', 'chest pain', 'headache', 'fever', 'cough', 'cold', 'vomit', 'dizziness',
      'dard', 'bukhar', 'khansi', 'chhati me dard', 'chakkar', 'takhleef', 'bimari',
      'દુખાવો', 'તાવ', 'ખાંસી', 'તકલીફ', 'બીમારી', 'છાતીમાં દુખાવો',
      'kaunsa doctor', 'who should i consult', 'which doctor', 'chahiye', 'chahiye doctor',
      'joie chhe', 'joia chhe', 'kone batavvu', 'kaise dikhaye', 'kaun dekhaga',
    ];
    return symptomKeywords.some((k) => lower.includes(k));
  }

  /**
   * Smart Multilingual & Natural Language Global Search
   */
  static async search(query: string): Promise<{
    results: SearchResultItem[];
    groupedResults: Record<SearchCategory, SearchResultItem[]>;
    totalMatches: number;
    hasAiSuggestion: boolean;
    aiPromptSuggestion?: string;
    isTrueNoResult: boolean;
  }> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return {
        results: [],
        groupedResults: {
          doctor: [],
          department: [],
          service: [],
          page: [],
          faq: [],
          hospital_info: [],
        },
        totalMatches: 0,
        hasAiSuggestion: false,
        isTrueNoResult: false,
      };
    }

    const config = this.getConfig();
    if (!config.search_enabled) {
      return {
        results: [],
        groupedResults: { doctor: [], department: [], service: [], page: [], faq: [], hospital_info: [] },
        totalMatches: 0,
        hasAiSuggestion: false,
        isTrueNoResult: true,
      };
    }

    // Expand search query with natural language synonyms (English, Hindi, Gujarati)
    const expandedTerms = new Set<string>([cleanQuery]);
    // Split into individual words
    const queryWords = cleanQuery.split(/\s+/).filter((w) => w.length > 2);
    queryWords.forEach((w) => expandedTerms.add(w));

    // Check custom & system synonyms
    for (const [key, synonyms] of Object.entries(config.custom_synonyms)) {
      const matchesKey =
        cleanQuery.includes(key) ||
        synonyms.some((syn) => cleanQuery.includes(syn.toLowerCase()) || syn.toLowerCase().includes(cleanQuery));
      if (matchesKey) {
        expandedTerms.add(key);
        synonyms.forEach((s) => expandedTerms.add(s.toLowerCase()));
      }
    }

    const termArray = Array.from(expandedTerms);

    // Fetch live website data from existing services
    const [doctors, specialities, services, hospitalSettings, dynamicPages] = await Promise.all([
      config.enable_doctors ? DoctorService.getActiveDoctors().catch(() => []) : [],
      config.enable_departments ? SpecialityService.getActiveSpecialities().catch(() => []) : [],
      config.enable_services ? ServiceService.getActiveServices().catch(() => []) : [],
      config.enable_hospital_info ? SettingsService.getHospitalSettings().catch(() => null) : null,
      config.enable_pages ? PageService.getPublishedPages().catch(() => []) : [],
    ]);

    const results: SearchResultItem[] = [];

    // Helper scorer function
    const calculateScore = (
      text: string,
      exactWeight: number = 100,
      partialWeight: number = 50
    ): number => {
      const lowerText = (text || '').toLowerCase();
      if (!lowerText) return 0;
      if (lowerText === cleanQuery) return exactWeight * 2;
      if (lowerText.startsWith(cleanQuery)) return exactWeight * 1.5;
      if (lowerText.includes(cleanQuery)) return exactWeight;

      // Check expanded synonym matches
      for (const term of termArray) {
        if (term.length > 2 && lowerText.includes(term)) {
          return partialWeight;
        }
      }
      return 0;
    };

    // 1. DOCTORS (Priority 2, or 1 on exact match)
    if (config.enable_doctors && doctors.length > 0) {
      doctors.forEach((doc: Doctor) => {
        const specName = doc.speciality?.name || '';
        const nameScore = calculateScore(doc.full_name, 100, 60);
        const specScore = calculateScore(specName, 90, 55);
        const qualScore = calculateScore(doc.qualification || '', 70, 40);
        const bioScore = calculateScore(doc.bio || '', 60, 30);
        const bestScore = Math.max(nameScore, specScore, qualScore, bioScore);

        if (bestScore > 0) {
          results.push({
            id: `doc-${doc.id}`,
            category: 'doctor',
            title: doc.full_name,
            subtitle: specName || 'Specialist Doctor',
            description: `${doc.qualification || ''} • ${doc.experience_years || 10}+ Years Experience`,
            url: doc.slug ? `/doctors/${doc.slug}` : `/doctors`,
            icon: doc.photo_url || undefined,
            badge: doc.availability_status === 'available' ? 'Available Today' : undefined,
            score: bestScore,
            metadata: { doctorId: doc.id, specialityId: doc.speciality_id },
          });
        }
      });
    }

    // 2. DEPARTMENTS / SPECIALITIES (Priority 3)
    if (config.enable_departments && specialities.length > 0) {
      specialities.forEach((spec: Speciality) => {
        const nameScore = calculateScore(spec.name, 95, 60);
        const descScore = calculateScore(spec.description || '', 65, 35);
        const bestScore = Math.max(nameScore, descScore);

        if (bestScore > 0) {
          results.push({
            id: `spec-${spec.id}`,
            category: 'department',
            title: `${spec.name} Department`,
            subtitle: 'Clinical Speciality',
            description: spec.description || 'Comprehensive diagnosis, advanced care and inpatient facilities.',
            url: `/specialities`,
            icon: spec.icon || 'Stethoscope',
            score: bestScore - 5, // slightly below direct doctor match
            metadata: { specialityId: spec.id },
          });
        }
      });
    }

    // 3. SERVICES (Priority 4)
    if (config.enable_services && services.length > 0) {
      services.forEach((srv: HospitalService) => {
        const nameScore = calculateScore(srv.name, 85, 50);
        const descScore = calculateScore(srv.description || '', 55, 30);
        const bestScore = Math.max(nameScore, descScore);

        if (bestScore > 0) {
          results.push({
            id: `srv-${srv.id}`,
            category: 'service',
            title: srv.name,
            subtitle: 'Hospital Healthcare Service',
            description: srv.description || 'Specialized clinical testing, treatment and patient care.',
            url: `/services`,
            icon: srv.icon || 'BriefcaseMedical',
            score: bestScore - 10,
          });
        }
      });
    }

    // 4. HOSPITAL INFORMATION (Timings, Ambulance, Emergency, About)
    if (config.enable_hospital_info && hospitalSettings) {
      // Check Hospital Timings ("hospital ka time kya hai", "timing", "hours")
      const timingScore = calculateScore('hospital timings opd hours time samay kab khulta hai', 85, 50);
      if (timingScore > 0) {
        results.push({
          id: 'info-timings',
          category: 'hospital_info',
          title: 'Hospital OPD & Consultation Timings',
          subtitle: 'Daily 09:00 AM - 08:00 PM • 24/7 Emergency',
          description: hospitalSettings.opd_timings || 'General OPD: 09:00 AM - 08:00 PM (Mon-Sat). Emergency department open 24/7 all 365 days.',
          url: '/about',
          icon: 'Clock',
          score: timingScore,
        });
      }

      // Check Ambulance & Emergency ("ambulance", "emergency", "108")
      const emergencyScore = calculateScore('ambulance emergency 108 helpline call hospital casualty', 88, 55);
      if (emergencyScore > 0) {
        const phone = hospitalSettings.emergency_number || hospitalSettings.ambulance_number || '108 / +91 7201030048';
        results.push({
          id: 'info-ambulance',
          category: 'hospital_info',
          title: '24x7 Ambulance & Emergency Helpline',
          subtitle: `Helpline: ${phone}`,
          description: 'Advanced Cardiac Life Support (ACLS) ambulances with ventilators and paramedical crew available round the clock.',
          url: '/contact',
          icon: 'PhoneCall',
          badge: '24/7 EMERGENCY',
          score: emergencyScore,
        });
      }

      // Check Appointment Booking Intent
      const apptIntentScore = calculateScore('book appointment appointment doctor consultation booking online slip', 80, 50);
      if (apptIntentScore > 0) {
        results.push({
          id: 'info-booking',
          category: 'page',
          title: 'Book Doctor OPD Appointment',
          subtitle: 'Schedule Online Consultation',
          description: 'Choose your specialist doctor, select date and time slot, and get instant verified appointment confirmation.',
          url: '/appointment',
          icon: 'Calendar',
          score: apptIntentScore,
        });
      }
    }

    // 5. FAQS (Priority 5)
    if (config.enable_faqs) {
      HOSPITAL_FAQS.forEach((faq) => {
        const qScore = calculateScore(faq.question, 75, 45);
        const aScore = calculateScore(faq.answer, 50, 25);
        const kwScore = faq.keywords.some((kw) => calculateScore(kw, 80, 50) > 0) ? 60 : 0;
        const bestScore = Math.max(qScore, aScore, kwScore);

        if (bestScore > 0) {
          results.push({
            id: faq.id,
            category: 'faq',
            title: faq.question,
            subtitle: 'Frequently Asked Question',
            description: faq.answer,
            url: faq.url,
            icon: 'HelpCircle',
            score: bestScore - 15,
          });
        }
      });
    }

    // 6. WEBSITE PAGES (Standard & Dynamic CMS)
    if (config.enable_pages) {
      const staticPages = [
        { title: 'Home Page', subtitle: 'Rhythm Medicity Portal', desc: 'Comprehensive multi-speciality tertiary care hospital in Anand, Gujarat.', url: '/' },
        { title: 'About Us', subtitle: 'Hospital Heritage & Leadership', desc: 'Our clinical mission, world-class infrastructure and healthcare accreditations.', url: '/about' },
        { title: 'Find Doctors', subtitle: 'Doctor Directory & Profiles', desc: 'Search and connect with experienced medical specialists and surgeons.', url: '/doctors' },
        { title: 'Clinical Specialities', subtitle: 'Centre of Excellence', desc: 'Comprehensive medical departments: Cardiology, Orthopedics, Neurology & more.', url: '/specialities' },
        { title: 'Hospital Services', subtitle: 'Facilities & Diagnostics', desc: 'ICU, Emergency, 24x7 Pharmacy, Diagnostic Pathology and Cashless Insurance.', url: '/services' },
        { title: 'Contact & Directions', subtitle: 'Reach Rhythm Medicity', desc: 'Hospital phone numbers, address, email support and Google Maps location.', url: '/contact' },
      ];

      staticPages.forEach((p) => {
        const score = calculateScore(`${p.title} ${p.desc}`, 65, 30);
        if (score > 0) {
          results.push({
            id: `page-${p.url}`,
            category: 'page',
            title: p.title,
            subtitle: p.subtitle,
            description: p.desc,
            url: p.url,
            icon: 'FileText',
            score: score - 20,
          });
        }
      });

      if (dynamicPages.length > 0) {
        dynamicPages.forEach((dp: any) => {
          const score = calculateScore(`${dp.title} ${dp.meta_description || ''}`, 60, 30);
          if (score > 0) {
            results.push({
              id: `dyn-${dp.id}`,
              category: 'page',
              title: dp.title,
              subtitle: 'Published Hospital Page',
              description: dp.meta_description || 'Official Rhythm Medicity hospital information.',
              url: `/${dp.slug}`,
              icon: 'FileText',
              score: score - 25,
            });
          }
        });
      }
    }

    // Sort by Priority: Highest score first
    results.sort((a, b) => b.score - a.score);

    // Group results by category
    const groupedResults: Record<SearchCategory, SearchResultItem[]> = {
      doctor: [],
      department: [],
      service: [],
      page: [],
      faq: [],
      hospital_info: [],
    };

    results.forEach((item) => {
      groupedResults[item.category].push(item);
    });

    // Check for conversational / symptom intent for Dillo AI Assistant
    const isSymptom = this.isConversationalOrSymptomQuery(query);

    return {
      results,
      groupedResults,
      totalMatches: results.length,
      hasAiSuggestion: isSymptom,
      aiPromptSuggestion: isSymptom ? query : undefined,
      isTrueNoResult: results.length === 0,
    };
  }
}
