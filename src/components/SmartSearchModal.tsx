import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, User, Stethoscope, BriefcaseMedical, ArrowRight, Loader2,
  Mic, MicOff, AlertCircle, CheckCircle2, Globe,
  Calendar, Phone, Building2, HelpCircle, LayoutGrid, Bot,
} from 'lucide-react';
import { Doctor, Speciality, HospitalService } from '../types/database';
import { DoctorService } from '../services/doctorService';
import { SpecialityService } from '../services/specialityService';
import { ServiceService } from '../services/serviceService';
import { SearchService } from '../services/searchService';

// ─── Types ───────────────────────────────────────────────────────────────────

type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'result'
  | 'error_permission'
  | 'error_not_supported'
  | 'error_no_speech';

type Lang = { code: string; label: string; short: string };

/** What category to "show all" of — triggered by generic voice phrases */
type ShowAllCategory = 'doctors' | 'specialities' | 'services' | 'all' | null;

// ─── Constants ───────────────────────────────────────────────────────────────

const LANGUAGES: Lang[] = [
  { code: 'en-IN', label: 'English', short: 'EN' },
  { code: 'hi-IN', label: 'Hindi', short: 'HI' },
  { code: 'gu-IN', label: 'Gujarati', short: 'ગુ' },
];

/**
 * NAVIGATE-ONLY intents — phrases that mean "take me somewhere"
 * NOT "show me results here". These navigate away immediately.
 */
const NAVIGATE_INTENTS: { keywords: string[]; path: string }[] = [
  {
    keywords: [
      'book appointment', 'fix appointment', 'appointment book karo',
      'appointment chahiye', 'book karvo', 'appointment book karvo',
      'mulakat', 'mulaqat', 'schedule appointment', 'book a doctor',
      'doctor book', 'doctor bukking', 'doctor book karo',
    ],
    path: '/appointment',
  },
  {
    keywords: [
      'contact', 'phone number', 'call hospital', 'helpline number',
      'emergency number', 'sampark karo', 'number batao',
      'contact number', 'hospital ka number',
    ],
    path: '/contact',
  },
  {
    keywords: [
      'about hospital', 'about rhythm', 'rhythm medicity history',
      'hospital ke bare mein', 'hospital vise', 'hospital badle',
      'hospital ki jankari',
    ],
    path: '/about',
  },
];

/**
 * SHOW-ALL intents — phrases like "doctor", "doctors", "sabhi doctor"
 * These load ALL records and show them INSIDE the modal.
 */
const SHOW_ALL_INTENTS: { keywords: string[]; category: ShowAllCategory }[] = [
  {
    category: 'doctors',
    keywords: [
      'doctor', 'doctors', 'daktar', 'daktars', 'all doctors', 'sabhi doctor',
      'show doctor', 'show doctors', 'doctor dikhao', 'doctor batao',
      'doctor batavo', 'doctorno list', 'doctor list', 'find doctor',
      'specialist', 'specialists', 'physician', 'physicians',
      'sabhi daktar', 'tamam daktar', 'tamara doctor',
    ],
  },
  {
    category: 'specialities',
    keywords: [
      'speciality', 'specialities', 'specialty', 'specialties',
      'department', 'departments', 'vibhag', 'sabhi vibhag',
      'department dikhao', 'speciality batao', 'vibhag batavo',
      'all department', 'tamam vibhag',
    ],
  },
  {
    category: 'services',
    keywords: [
      'service', 'services', 'seva', 'sevaao', 'facilities',
      'sabhi service', 'service dikhao', 'service batao',
      'tamam seva', 'all services', 'hospital services',
    ],
  },
  {
    category: 'all',
    keywords: [
      'all', 'everything', 'show all', 'sabhi', 'sab kuch',
      'tamam', 'list', 'show everything',
    ],
  },
];

type VoiceIntent =
  | { type: 'navigate'; path: string }
  | { type: 'show_all'; category: ShowAllCategory }
  | { type: 'search'; query: string };

/**
 * Analyse a voice transcript and decide what to do:
 * 1. navigate  – go to a page
 * 2. show_all  – load and show all records of a category
 * 3. search    – filter records by the spoken text
 */
function analyseVoiceTranscript(transcript: string): VoiceIntent {
  const lower = transcript.toLowerCase().trim();

  // 1. Navigate intents (highest priority)
  for (const { keywords, path } of NAVIGATE_INTENTS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { type: 'navigate', path };
    }
  }

  // 2. Show-all intents
  for (const { keywords, category } of SHOW_ALL_INTENTS) {
    if (keywords.some((kw) => lower === kw || lower.includes(kw))) {
      return { type: 'show_all', category };
    }
  }

  // 3. Fallback: use the spoken text as a search query
  return { type: 'search', query: transcript.trim() };
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

const SoundWave: React.FC<{ active: boolean }> = ({ active }) => {
  const heights = [3, 7, 5, 10, 6, 9, 4, 8, 5, 7, 3];
  return (
    <div className="flex items-center gap-[3px] h-8" aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`block w-[3px] rounded-full ${active ? 'bg-[#006655]' : 'bg-slate-300'}`}
          style={{
            height: active ? `${h}px` : '3px',
            animation: active ? `voiceBar 0.65s ease-in-out ${i * 55}ms infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [services, setServices] = useState<HospitalService[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Voice
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [selectedLang, setSelectedLang] = useState<Lang>(LANGUAGES[0]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [showAllCategory, setShowAllCategory] = useState<ShowAllCategory>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const h = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(-1);
      setVoiceState('idle');
      setRecognizedText('');
      setShowAllCategory(null);
      setDoctors([]);
      setSpecialities([]);
      setServices([]);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      stopListening();
    }
  }, [isOpen]);

  useEffect(() => () => { stopListening(); }, []);

  // ── Debounced text search ──────────────────────────────────────────────────

  const [hasAiSuggestion, setHasAiSuggestion] = useState(false);

  useEffect(() => {
    // Skip if we're in show-all mode (handled separately)
    if (showAllCategory !== null) return;

    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      setDoctors([]);
      setSpecialities([]);
      setServices([]);
      setHasAiSuggestion(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const searchRes = await SearchService.search(cleanQuery);
        setHasAiSuggestion(searchRes.hasAiSuggestion);

        const [allDocs, allSpecs, allServs] = await Promise.all([
          DoctorService.getActiveDoctors(),
          SpecialityService.getActiveSpecialities(),
          ServiceService.getActiveServices(),
        ]);

        const docIdSet = new Set(searchRes.groupedResults.doctor.map((r) => r.metadata?.doctorId).filter(Boolean));
        const specIdSet = new Set(searchRes.groupedResults.department.map((r) => r.metadata?.specialityId).filter(Boolean));

        let filteredDocs = allDocs.filter((d) => docIdSet.has(d.id));
        if (filteredDocs.length === 0) {
          filteredDocs = allDocs.filter((d) => {
            const n = d.full_name?.toLowerCase() || '';
            const qual = d.qualification?.toLowerCase() || '';
            const spec = d.speciality?.name?.toLowerCase() || '';
            const bio = d.bio?.toLowerCase() || '';
            return n.includes(cleanQuery) || qual.includes(cleanQuery) || spec.includes(cleanQuery) || bio.includes(cleanQuery);
          });
        }

        let filteredSpecs = allSpecs.filter((s) => specIdSet.has(s.id));
        if (filteredSpecs.length === 0) {
          filteredSpecs = allSpecs.filter((s) => {
            return (s.name?.toLowerCase() || '').includes(cleanQuery) || (s.description?.toLowerCase() || '').includes(cleanQuery);
          });
        }

        const servTitles = new Set(searchRes.groupedResults.service.map((s) => s.title.toLowerCase()));
        let filteredServs = allServs.filter((sv) => servTitles.has(sv.name.toLowerCase()));
        if (filteredServs.length === 0) {
          filteredServs = allServs.filter((sv) => {
            return (sv.name?.toLowerCase() || '').includes(cleanQuery) || (sv.description?.toLowerCase() || '').includes(cleanQuery);
          });
        }

        startTransition(() => {
          setDoctors(filteredDocs.slice(0, 10));
          setSpecialities(filteredSpecs.slice(0, 8));
          setServices(filteredServs.slice(0, 8));
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [query, showAllCategory]);

  // ── Show-All loader: fires when showAllCategory changes ───────────────────

  useEffect(() => {
    if (showAllCategory === null) return;

    setLoading(true);
    const fetchAll = async () => {
      try {
        const needDocs = showAllCategory === 'doctors' || showAllCategory === 'all';
        const needSpecs = showAllCategory === 'specialities' || showAllCategory === 'all';
        const needServs = showAllCategory === 'services' || showAllCategory === 'all';

        const [allDocs, allSpecs, allServs] = await Promise.all([
          needDocs ? DoctorService.getActiveDoctors() : Promise.resolve([] as Doctor[]),
          needSpecs ? SpecialityService.getActiveSpecialities() : Promise.resolve([] as Speciality[]),
          needServs ? ServiceService.getActiveServices() : Promise.resolve([] as HospitalService[]),
        ]);

        startTransition(() => {
          setDoctors(needDocs ? allDocs.slice(0, 20) : []);
          setSpecialities(needSpecs ? allSpecs.slice(0, 15) : []);
          setServices(needServs ? allServs.slice(0, 15) : []);
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    };
    fetchAll();
  }, [showAllCategory]);

  // ── Voice ─────────────────────────────────────────────────────────────────

  const isBrowserSupported = useCallback(
    () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    [],
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (voiceTimeoutRef.current) { clearTimeout(voiceTimeoutRef.current); voiceTimeoutRef.current = null; }
  }, []);

  const startVoiceSearch = useCallback(() => {
    if (!isBrowserSupported()) { setVoiceState('error_not_supported'); return; }
    if (voiceState === 'listening') { stopListening(); setVoiceState('idle'); return; }

    setRecognizedText('');
    setShowAllCategory(null);

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = selectedLang.code;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setVoiceState('listening');

    recognition.onresult = (event: any) => {
      setVoiceState('processing');
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else interimTranscript += t;
      }

      const currentText = finalTranscript || interimTranscript;
      setRecognizedText(currentText);

      if (finalTranscript) {
        setVoiceState('result');
        const intent = analyseVoiceTranscript(finalTranscript);

        if (intent.type === 'navigate') {
          // Navigate-only: go to page after short delay
          voiceTimeoutRef.current = setTimeout(() => {
            navigate(intent.path);
            onClose();
          }, 1200);
        } else if (intent.type === 'show_all') {
          // Show ALL records of this category inside the modal
          setQuery('');           // clear text input
          setShowAllCategory(intent.category);
        } else {
          // Specific search: put transcript in input and search normally
          setQuery(finalTranscript.trim());
          setShowAllCategory(null);
        }
      }
    };

    recognition.onerror = (event: any) => {
      stopListening();
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setVoiceState('error_permission');
      } else if (event.error === 'no-speech') {
        setVoiceState('error_no_speech');
        voiceTimeoutRef.current = setTimeout(() => setVoiceState('idle'), 3000);
      } else {
        setVoiceState('idle');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognition.start();

    // Auto-stop after 8 s
    voiceTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) { stopListening(); setVoiceState('idle'); }
    }, 8000);
  }, [voiceState, selectedLang, stopListening, isBrowserSupported, navigate, onClose]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  const allResults = [
    ...doctors.map((d) => ({ type: 'doctor', id: d.id, path: `/doctors/${d.slug || d.id}` })),
    ...specialities.map((s) => ({ type: 'speciality', id: s.id, path: `/specialities` })),
    ...services.map((sv) => ({ type: 'service', id: sv.id, path: `/services` })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (voiceState === 'listening') { stopListening(); setVoiceState('idle'); }
      else onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((p) => (p < allResults.length - 1 ? p + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((p) => (p > 0 ? p - 1 : allResults.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && allResults[selectedIndex]) {
      e.preventDefault();
      navigate(allResults[selectedIndex].path);
      onClose();
    }
  };

  const highlightMatch = (text: string) => {
    const q = query.trim();
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase()
            ? <span key={i} className="bg-[#E0F2ED] text-[#004C3D] font-semibold px-0.5 rounded">{part}</span>
            : part
        )}
      </>
    );
  };

  // ── Voice UI config ───────────────────────────────────────────────────────

  const voiceUiMap: Record<VoiceState, { icon: React.ReactNode; btnClass: string; tip: string }> = {
    idle: {
      icon: <Mic className="w-5 h-5" />,
      btnClass: 'text-slate-500 hover:text-[#006655] hover:bg-[#E0F2ED]/60',
      tip: 'Speak to Search',
    },
    listening: {
      icon: <Mic className="w-5 h-5 text-white" />,
      btnClass: 'bg-[#006655] text-white shadow-lg shadow-[#006655]/30 scale-110',
      tip: 'Stop listening',
    },
    processing: {
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      btnClass: 'text-[#006655] bg-[#E0F2ED]',
      tip: 'Processing…',
    },
    result: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      btnClass: 'text-emerald-600 bg-emerald-50',
      tip: 'Recognized',
    },
    error_permission: {
      icon: <MicOff className="w-5 h-5 text-rose-500" />,
      btnClass: 'text-rose-500 bg-rose-50',
      tip: 'Microphone blocked',
    },
    error_not_supported: {
      icon: <MicOff className="w-5 h-5 text-slate-400" />,
      btnClass: 'text-slate-400 bg-slate-100 cursor-not-allowed',
      tip: 'Not supported',
    },
    error_no_speech: {
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      btnClass: 'text-amber-500 bg-amber-50',
      tip: 'No speech detected',
    },
  };

  const currentVoiceUi = voiceUiMap[voiceState];
  const hasAnyResults = doctors.length > 0 || specialities.length > 0 || services.length > 0;
  const isShowingAll = showAllCategory !== null;

  // Category banner label
  const categoryLabel: Record<NonNullable<ShowAllCategory>, string> = {
    doctors: 'All Doctors',
    specialities: 'All Departments & Specialities',
    services: 'All Hospital Services',
    all: 'All Hospital Records',
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes voiceBar {
          from { height: 3px; }
          to   { height: 18px; }
        }
        @keyframes micPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,102,85,0.35); }
          50%      { box-shadow: 0 0 0 12px rgba(0,102,85,0); }
        }
        .mic-pulse { animation: micPulse 1.2s ease-out infinite; }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-[#001f18]/65 backdrop-blur-md transition-all duration-200"
        onClick={() => { stopListening(); onClose(); }}
      >
        <div
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-label="Smart Search"
          aria-modal="true"
        >

          {/* ── Search Input Bar ─────────────────────────────────────── */}
          <div className="flex items-center px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 gap-1.5 sm:gap-3">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#006655] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowAllCategory(null);
                if (voiceState === 'result') setVoiceState('idle');
              }}
              placeholder="Search doctors, services..."
              className="w-full text-slate-800 placeholder-slate-400 bg-transparent text-sm sm:text-lg focus:outline-none font-medium min-w-0"
              aria-label="Search"
              autoComplete="off"
            />
            {loading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#006655] animate-spin shrink-0" />}
            {(query || isShowingAll) && !loading && (
              <button
                onClick={() => {
                  setQuery('');
                  setShowAllCategory(null);
                  setDoctors([]); setSpecialities([]); setServices([]);
                  setVoiceState('idle');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition cursor-pointer shrink-0"
                aria-label="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Mic button */}
            <button
              onClick={startVoiceSearch}
              disabled={voiceState === 'error_not_supported'}
              className={`p-1.5 sm:p-2 rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${currentVoiceUi.btnClass} ${
                voiceState === 'listening' && !prefersReducedMotion ? 'mic-pulse' : ''
              }`}
              aria-label="Speak to Search"
              title={currentVoiceUi.tip}
            >
              {currentVoiceUi.icon}
            </button>

            {/* Language picker */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowLangPicker((p) => !p)}
                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer shadow-2xs"
                title="Voice language"
              >
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                <span>{selectedLang.short}</span>
              </button>
              {showLangPicker && (
                <div className="absolute right-0 top-full mt-2 bg-white/98 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl z-50 py-1.5 min-w-[145px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setSelectedLang(lang); setShowLangPicker(false); }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold transition text-left cursor-pointer ${
                        selectedLang.code === lang.code ? 'text-[#006655] bg-[#E0F2ED]/70' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {selectedLang.code === lang.code
                        ? <CheckCircle2 className="w-4 h-4 text-[#006655]" />
                        : <span className="w-4 h-4" />}
                      <span className="font-bold">{lang.short}</span>
                      <span className="text-xs text-slate-400 font-normal">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button on Mobile / ESC on Desktop */}
            <button
              onClick={() => { stopListening(); onClose(); }}
              className="hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition shrink-0 cursor-pointer"
            >
              ESC
            </button>
            <button
              onClick={() => { stopListening(); onClose(); }}
              className="sm:hidden p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-lg transition shrink-0 cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Voice Status Banner ───────────────────────────────────── */}
          {voiceState !== 'idle' && (
            <div className={`px-4 py-2.5 flex items-center gap-3 text-sm border-b transition-all ${
              voiceState === 'listening'    ? 'bg-[#E0F2ED] border-[#006655]/20' :
              voiceState === 'processing'  ? 'bg-blue-50 border-blue-100' :
              voiceState === 'result'      ? 'bg-emerald-50 border-emerald-100' :
              voiceState === 'error_permission'  ? 'bg-rose-50 border-rose-100' :
              voiceState === 'error_no_speech'   ? 'bg-amber-50 border-amber-100' :
              'bg-slate-50 border-slate-100'
            }`}>
              {voiceState === 'listening' && (
                <>
                  <SoundWave active={!prefersReducedMotion} />
                  <span className="text-[#006655] font-semibold text-xs">
                    Listening… Speak now
                  </span>
                  <span className="ml-auto text-[10px] text-[#006655]/60 font-medium">
                    {selectedLang.label}
                  </span>
                </>
              )}
              {voiceState === 'processing' && (
                <>
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                  <span className="text-blue-700 font-semibold text-xs">Identifying your request…</span>
                  {recognizedText && (
                    <span className="ml-auto text-xs text-blue-500 italic truncate max-w-[180px]">
                      "{recognizedText}"
                    </span>
                  )}
                </>
              )}
              {voiceState === 'result' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-emerald-700 font-semibold text-xs">Got it!</span>
                  {recognizedText && (
                    <span className="ml-1 text-xs text-emerald-600 italic">
                      "{recognizedText}"
                    </span>
                  )}
                </>
              )}
              {voiceState === 'error_permission' && (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-rose-700 text-xs font-medium">
                    Microphone blocked. Allow microphone access in browser settings.
                  </span>
                </>
              )}
              {voiceState === 'error_not_supported' && (
                <>
                  <MicOff className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600 text-xs">
                    Voice search not supported in this browser.
                  </span>
                </>
              )}
              {voiceState === 'error_no_speech' && (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-amber-700 text-xs font-medium">
                    Nothing heard. Please try again.
                  </span>
                </>
              )}
            </div>
          )}

          {/* ── "Showing all X" Banner ────────────────────────────────── */}
          {isShowingAll && !loading && hasAnyResults && (
            <div className="px-4 py-2 bg-[#F7F4EC] border-b border-[#E5DEC9] flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5 text-[#B0934C] shrink-0" />
              <span className="text-xs font-semibold text-[#B0934C]">
                Showing: {categoryLabel[showAllCategory!]}
              </span>
              <button
                onClick={() => {
                  setShowAllCategory(null);
                  setDoctors([]); setSpecialities([]); setServices([]);
                  inputRef.current?.focus();
                }}
                className="ml-auto text-[10px] text-slate-500 hover:text-[#006655] font-semibold transition"
              >
                Clear ✕
              </button>
            </div>
          )}

          {/* ── Results ───────────────────────────────────────────────── */}
          <div className="max-h-[62vh] overflow-y-auto p-4 space-y-5">

            {/* Empty / idle state */}
            {!query.trim() && !isShowingAll && voiceState === 'idle' && (
              <div className="py-8 sm:py-10 text-center text-slate-400 text-sm">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                <p className="text-slate-600 font-medium">
                  Type or <span className="text-[#006655] font-bold">speak</span> to search hospital records.
                </p>
                <p className="text-xs mt-1 text-slate-400">
                  Try: "doctors", "cardiology", "Dr. Sharma", "book appointment"
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                  {[
                    { label: '"Show all doctors"', onClick: () => setShowAllCategory('doctors') },
                    { label: '"Book appointment"', onClick: () => { navigate('/appointment'); onClose(); } },
                    { label: '"Cardiology"', onClick: () => setQuery('cardiology') },
                    { label: '"All services"', onClick: () => setShowAllCategory('services') },
                  ].map(({ label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="px-3 py-1.5 rounded-full bg-[#E0F2ED]/70 hover:bg-[#E0F2ED] text-[#006655] font-semibold transition cursor-pointer shadow-2xs"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dillo AI Clinical Guidance Banner (Section 19) */}
            {hasAiSuggestion && (
              <div className="p-3.5 bg-gradient-to-r from-[#E0F2ED] via-emerald-50 to-[#FBF8F1] rounded-2xl border border-[#006655]/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#006655] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#004C3D] block">
                      Looking for medical advice for symptoms?
                    </span>
                    <span className="text-[11px] text-[#4F7B72]">
                      Dillo AI Assistant can recommend relevant specialists.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(
                      new CustomEvent('rhythm_open_dillo_with_query', {
                        detail: { query },
                      })
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white text-xs font-extrabold shrink-0 shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask Dillo</span>
                </button>
              </div>
            )}

            {/* True No results Found State (Section 17 & 18) */}
            {!loading && query.trim() && !hasAnyResults && (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="font-black text-slate-800 text-sm">No Results Found</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sorry, we couldn't find anything matching your search. Try searching for a doctor, department, service, or hospital information.
                  </p>
                </div>

                {/* Helpful alternatives */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => { onClose(); navigate('/doctors'); }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#006655] hover:bg-[#E0F2ED] transition shadow-2xs"
                  >
                    Find a Doctor
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/specialities'); }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#006655] hover:bg-[#E0F2ED] transition shadow-2xs"
                  >
                    Departments
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/services'); }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#006655] hover:bg-[#E0F2ED] transition shadow-2xs"
                  >
                    Services
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/contact'); }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#006655] hover:bg-[#E0F2ED] transition shadow-2xs"
                  >
                    Contact Hospital
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(
                        new CustomEvent('rhythm_open_dillo_with_query', {
                          detail: { query },
                        })
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#006655] text-white text-xs font-bold hover:bg-[#004C3D] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask Dillo AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Doctors ────────────────────────────────────────────── */}
            {!loading && doctors.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#006655]" />
                    Doctors
                  </span>
                  <span className="text-[10px] font-normal text-slate-300">
                    {doctors.length} result{doctors.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1">
                  {doctors.map((doc, idx) => (
                    <button
                      key={doc.id}
                      onClick={() => { navigate(`/doctors/${doc.slug || doc.id}`); onClose(); }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors text-left group ${
                        selectedIndex === idx ? 'bg-[#E0F2ED]/80' : 'hover:bg-[#E0F2ED]/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {doc.photo_url ? (
                          <img
                            src={doc.photo_url}
                            alt={doc.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-[#E5DEC9] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#E0F2ED] text-[#006655] flex items-center justify-center font-bold text-sm shrink-0 border border-[#006655]/10">
                            {doc.full_name?.charAt(0) ?? 'D'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 text-sm truncate">
                            {highlightMatch(doc.full_name)}
                          </div>
                          <div className="text-xs text-[#006655] truncate">
                            {doc.speciality?.name || doc.qualification || '—'}
                          </div>
                          {(doc as any).department && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {(doc as any).department}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#006655] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
                {isShowingAll && doctors.length >= 20 && (
                  <button
                    onClick={() => { navigate('/doctors'); onClose(); }}
                    className="mt-2 w-full text-center text-xs text-[#006655] hover:underline font-semibold py-1.5"
                  >
                    View all doctors →
                  </button>
                )}
              </div>
            )}

            {/* ── Specialities ──────────────────────────────────────── */}
            {!loading && specialities.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#006655]" />
                    Departments & Specialities
                  </span>
                  <span className="text-[10px] font-normal text-slate-300">
                    {specialities.length} result{specialities.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {specialities.map((spec, idx) => (
                    <button
                      key={spec.id}
                      onClick={() => { navigate('/specialities'); onClose(); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-colors text-left group ${
                        selectedIndex === doctors.length + idx ? 'bg-[#E0F2ED]/80' : 'hover:bg-[#E0F2ED]/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 text-sm truncate">
                          {highlightMatch(spec.name)}
                        </div>
                        {spec.description && (
                          <div className="text-[11px] text-slate-400 truncate">{spec.description}</div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#006655] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Services ──────────────────────────────────────────── */}
            {!loading && services.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BriefcaseMedical className="w-3.5 h-3.5 text-[#006655]" />
                    Hospital Services
                  </span>
                  <span className="text-[10px] font-normal text-slate-300">
                    {services.length} result{services.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {services.map((serv, idx) => (
                    <button
                      key={serv.id}
                      onClick={() => { navigate('/services'); onClose(); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-colors text-left group ${
                        selectedIndex === doctors.length + specialities.length + idx ? 'bg-[#E0F2ED]/80' : 'hover:bg-[#E0F2ED]/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 text-sm truncate">
                          {highlightMatch(serv.name)}
                        </div>
                        {serv.description && (
                          <div className="text-[11px] text-slate-400 truncate">{serv.description}</div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#006655] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5" />
              <span>Voice: {selectedLang.label}</span>
              <span className="text-slate-300">·</span>
              <span>EN / HI / ગુ</span>
            </div>
            <span className="hidden sm:inline">↑ ↓ navigate · Enter select</span>
          </div>

        </div>
      </div>
    </>
  );
};
