import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Mic,
  MicOff,
  X,
  User,
  Stethoscope,
  BriefcaseMedical,
  Clock,
  PhoneCall,
  HelpCircle,
  FileText,
  Bot,
  ArrowRight,
  ExternalLink,
  Calendar,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SearchService, SearchResultItem, SearchCategory } from '../../services/searchService';
import { DynamicIcon } from '../DynamicIcon';

interface SmartGlobalSearchProps {
  variant?: 'header' | 'mobile' | 'hero';
  onResultClick?: () => void;
  className?: string;
}

export const SmartGlobalSearch: React.FC<SmartGlobalSearchProps> = ({
  variant = 'header',
  onResultClick,
  className = '',
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [grouped, setGrouped] = useState<Record<SearchCategory, SearchResultItem[]>>({
    doctor: [],
    department: [],
    service: [],
    page: [],
    faq: [],
    hospital_info: [],
  });
  const [hasAiSuggestion, setHasAiSuggestion] = useState(false);
  const [isTrueNoResult, setIsTrueNoResult] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setGrouped({ doctor: [], department: [], service: [], page: [], faq: [], hospital_info: [] });
      setHasAiSuggestion(false);
      setIsTrueNoResult(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await SearchService.search(query);
        setResults(data.results);
        setGrouped(data.groupedResults);
        setHasAiSuggestion(data.hasAiSuggestion);
        setIsTrueNoResult(data.isTrueNoResult);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Voice Search via Web Speech API (English, Hindi, Gujarati)
  const toggleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Multilingual Indian locale (transcribes English, Hindi, Gujarati terms)

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          setIsOpen(true);
          inputRef.current?.focus();
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectResult(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelectResult(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    if (onResultClick) onResultClick();
    navigate(item.url);
  };

  // Open Dillo AI Assistant with the query
  const triggerDilloAi = (promptText?: string) => {
    setIsOpen(false);
    if (onResultClick) onResultClick();

    window.dispatchEvent(
      new CustomEvent('rhythm_open_dillo_with_query', {
        detail: { query: promptText || query },
      })
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Bar Input Container */}
      <div className="relative flex items-center">
        <div className="absolute left-2.5 sm:left-3 flex items-center pointer-events-none text-[#006655]">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-[#006655]" />
          ) : (
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#006655]" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            variant === 'mobile'
              ? 'Search doctor, department, timing...'
              : 'Search doctor, care...'
          }
          className="w-full pl-8 sm:pl-9 pr-14 py-1.5 sm:py-2 bg-white/95 rounded-xl sm:rounded-2xl border border-[#E5DEC9] text-xs sm:text-sm text-[#004C3D] placeholder-[#4F7B72]/70 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006655] focus:border-[#006655] transition-all shadow-2xs hover:border-[#006655]/50"
        />

        {/* Right side controls: Clear + Microphone */}
        <div className="absolute right-1.5 sm:right-2 flex items-center gap-0.5 sm:gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Clear search"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleVoiceSearch}
            className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-[#006655] hover:bg-[#E0F2ED]'
            }`}
            title={isListening ? 'Listening (Speak now)...' : 'Search by Voice (English / Hindi / Gujarati)'}
            aria-label="Voice Search"
          >
            {isListening ? (
              <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Modern Categorized Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div
          className={`absolute top-full mt-2 bg-white/98 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E5DEC9] z-50 overflow-hidden max-h-[82vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 ${
            variant === 'header'
              ? 'right-0 w-[320px] sm:w-[400px] max-w-[92vw]'
              : 'left-0 right-0 w-full'
          }`}
        >
          {/* Header indicator */}
          <div className="px-4 py-2.5 bg-[#FBF8F1] border-b border-[#E5DEC9] flex items-center justify-between text-[11px] font-bold text-[#006655]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C4A760]" />
              <span>Smart Search Results for "{query}"</span>
            </span>
            <span className="text-slate-400 font-normal">
              {results.length} match{results.length === 1 ? '' : 'es'}
            </span>
          </div>

          {/* AI Clinical Symptom Guidance Card (Section 19) */}
          {hasAiSuggestion && (
            <div className="p-3 bg-gradient-to-r from-[#E0F2ED] via-emerald-50 to-[#FBF8F1] border-b border-[#006655]/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#006655] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#004C3D] block">
                    Have symptom or health questions?
                  </span>
                  <span className="text-[11px] text-[#4F7B72]">
                    Dillo AI Assistant can recommend specialists for your symptoms.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDilloAi(query)}
                className="px-3 py-1.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white text-xs font-extrabold shrink-0 shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <span>Ask Dillo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* RESULTS CATEGORIES */}
          <div className="p-2 space-y-3">
            {/* 1. DOCTORS */}
            {grouped.doctor.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#006655] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Doctors</span>
                  <span className="text-slate-400">({grouped.doctor.length})</span>
                </div>
                <div className="space-y-1">
                  {grouped.doctor.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectResult(doc)}
                      className="p-2.5 rounded-2xl hover:bg-[#E0F2ED]/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#E0F2ED] overflow-hidden shrink-0 border border-[#006655]/20 flex items-center justify-center">
                          {doc.icon ? (
                            <img src={doc.icon} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-[#006655]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#004C3D] group-hover:text-[#006655] truncate">
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {doc.subtitle} • {doc.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.badge && (
                          <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                            {doc.badge}
                          </span>
                        )}
                        <Link
                          to={`/appointment?doctor=${doc.metadata?.doctorId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            if (onResultClick) onResultClick();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Book</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. DEPARTMENTS */}
            {grouped.department.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#006655] flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Departments &amp; Specialities</span>
                </div>
                <div className="space-y-1">
                  {grouped.department.slice(0, 3).map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => handleSelectResult(dept)}
                      className="p-2.5 rounded-2xl hover:bg-[#E0F2ED]/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#004C3D] group-hover:text-[#006655] truncate">
                            {dept.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{dept.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#006655] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. HOSPITAL SERVICES */}
            {grouped.service.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#006655] flex items-center gap-1.5">
                  <BriefcaseMedical className="w-3.5 h-3.5" />
                  <span>Clinical Services</span>
                </div>
                <div className="space-y-1">
                  {grouped.service.slice(0, 3).map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => handleSelectResult(srv)}
                      className="p-2.5 rounded-2xl hover:bg-[#E0F2ED]/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                          <BriefcaseMedical className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#004C3D] group-hover:text-[#006655] truncate">
                            {srv.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{srv.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#006655] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. HOSPITAL INFO & TIMINGS */}
            {grouped.hospital_info.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#006655] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hospital Information &amp; Timings</span>
                </div>
                <div className="space-y-1">
                  {grouped.hospital_info.map((info) => (
                    <div
                      key={info.id}
                      onClick={() => handleSelectResult(info)}
                      className="p-2.5 rounded-2xl hover:bg-[#E0F2ED]/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#004C3D] group-hover:text-[#006655] truncate">
                            {info.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{info.subtitle || info.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#006655] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. FAQS */}
            {grouped.faq.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#006655] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help &amp; FAQs</span>
                </div>
                <div className="space-y-1">
                  {grouped.faq.slice(0, 2).map((faq) => (
                    <div
                      key={faq.id}
                      onClick={() => handleSelectResult(faq)}
                      className="p-2.5 rounded-2xl hover:bg-[#E0F2ED]/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#006655] flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#004C3D] group-hover:text-[#006655] truncate">
                            {faq.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{faq.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#006655] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. WEBSITE PAGES */}
            {grouped.page.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#006655] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Website Pages</span>
                </div>
                <div className="space-y-1">
                  {grouped.page.slice(0, 2).map((pg) => (
                    <div
                      key={pg.id}
                      onClick={() => handleSelectResult(pg)}
                      className="p-2.5 rounded-2xl hover:bg-[#E0F2ED]/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#E0F2ED]/50 text-[#006655] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#004C3D] group-hover:text-[#006655] truncate">
                            {pg.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{pg.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#006655] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TRUE NO-RESULTS FOUND STATE (Section 17 & 18) */}
            {isTrueNoResult && !loading && (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-base font-black text-[#004C3D]">No Results Found</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sorry, we couldn't find anything matching your search. Try searching for a doctor, department, service, or hospital information.
                  </p>
                </div>

                {/* Helpful Alternatives (Section 18) */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    to="/doctors"
                    onClick={() => {
                      setIsOpen(false);
                      if (onResultClick) onResultClick();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#006655] hover:bg-[#E0F2ED] transition shadow-2xs"
                  >
                    Find a Doctor
                  </Link>
                  <Link
                    to="/specialities"
                    onClick={() => {
                      setIsOpen(false);
                      if (onResultClick) onResultClick();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#006655] hover:bg-[#E0F2ED] transition shadow-2xs"
                  >
                    Departments
                  </Link>
                  <Link
                    to="/services"
                    onClick={() => {
                      setIsOpen(false);
                      if (onResultClick) onResultClick();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#006655] hover:bg-[#E0F2ED] transition shadow-2xs"
                  >
                    Services
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => {
                      setIsOpen(false);
                      if (onResultClick) onResultClick();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#006655] hover:bg-[#E0F2ED] transition shadow-2xs"
                  >
                    Contact Hospital
                  </Link>
                  <button
                    type="button"
                    onClick={() => triggerDilloAi(query)}
                    className="px-3 py-1.5 rounded-xl bg-[#006655] text-white text-xs font-bold hover:bg-[#004C3D] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask Dillo AI</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Press ↑ ↓ to navigate, Enter to select, Esc to close</span>
            <span className="font-semibold text-[#006655]">Rhythm Medicity</span>
          </div>
        </div>
      )}
    </div>
  );
};
