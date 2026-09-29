import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Clock,
  CreditCard,
  UserCheck,
  ChevronDown,
  Globe,
  Square,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Activity,
  FileText,
  Keyboard,
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { DilloChatMessage, Doctor, DilloQuickAction, DilloActionPayload } from '../../types/database';
import { DilloService, DILLO_INTRODUCTIONS } from '../../services/dilloService';
import { DilloVoiceWave } from './DilloVoiceWave';

interface DilloModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVoiceStart?: boolean;
}

export const DilloModal: React.FC<DilloModalProps> = ({
  isOpen,
  onClose,
  initialVoiceStart = false,
}) => {
  const navigate = useNavigate();
  const { dilloSettings, hospitalSettings, hospitalStats } = useSettings();
  const { user } = useAuth();

  const DILLO_SESSION_INTRO_KEY = 'rhythm_dillo_session_intro_spoken';
  const DILLO_USER_LANG_KEY = 'rhythm_dillo_user_language';

  // Helper to determine initial language
  const resolveInitialLanguage = useCallback((): string => {
    const saved = localStorage.getItem(DILLO_USER_LANG_KEY);
    if (saved && ['gu-IN', 'hi-IN', 'en-IN'].includes(saved)) {
      return saved;
    }
    const navLang = (navigator.language || '').toLowerCase();
    if (navLang.startsWith('gu')) return 'gu-IN';
    if (navLang.startsWith('hi')) return 'hi-IN';
    return dilloSettings.default_language || 'gu-IN';
  }, [dilloSettings.default_language]);

  const [messages, setMessages] = useState<DilloChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentLang, setCurrentLang] = useState<string>(resolveInitialLanguage);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [lastAssistantSpeech, setLastAssistantSpeech] = useState<string>('');
  const [lastSuggestedSpeciality, setLastSuggestedSpeciality] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<DilloActionPayload | null>(null);
  const [showTextInput, setShowTextInput] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const assistantName = dilloSettings.assistant_name || 'Dillo';
  const activeLanguages = (dilloSettings.supported_languages || []).filter((l) => l.active);

  // Initialize messages with welcome message and speak it on first opening in session
  useEffect(() => {
    if (isOpen) {
      const initialLang = resolveInitialLanguage();
      if (currentLang !== initialLang && !localStorage.getItem(DILLO_USER_LANG_KEY)) {
        setCurrentLang(initialLang);
      }

      const hasPlayedInSession = sessionStorage.getItem(DILLO_SESSION_INTRO_KEY) === 'true';

      if (messages.length === 0) {
        const introText = DilloService.getIntroduction(initialLang, assistantName);
        setMessages([
          {
            id: 'welcome-msg',
            sender: 'assistant',
            text: introText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            language: initialLang,
            quickReplies: ['🎙️ Speak', '👨‍⚕️ Find Doctor', '📅 Book Appointment', '🏥 Departments', '🚨 Emergency'],
          },
        ]);

        // Auto-speak introduction ONLY once per session on first open
        if (
          !hasPlayedInSession &&
          dilloSettings.auto_introduction !== false &&
          dilloSettings.voice_enabled !== false &&
          !isMuted
        ) {
          sessionStorage.setItem(DILLO_SESSION_INTRO_KEY, 'true');
          setTimeout(() => {
            speakText(introText, initialLang);
          }, 500);
        }
      }
    }
  }, [isOpen]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, voiceState, interimTranscript]);

  // Clean up speech synthesis & recognition on unmount or close
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  useEffect(() => {
    if (isOpen && initialVoiceStart) {
      // Give intro a moment then start listening
      setTimeout(() => startListening(), 800);
    }
    if (!isOpen) {
      stopSpeaking();
      stopListening();
    }
  }, [isOpen, initialVoiceStart]);

  // Speech-to-Text (STT) Setup
  const startListening = () => {
    stopSpeaking();
    setSpeechError(null);
    setInterimTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      // Use current language for recognition — auto-detected language will
      // guide the response, but initial recognition needs a primary hint
      recognition.lang = currentLang;

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setInterimTranscript('');
          handleSend(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access or type below.');
        } else if (event.error === 'no-speech') {
          // User was quiet, return to idle
        } else {
          setSpeechError(`Voice input error (${event.error}). Please type your message.`);
        }
        setVoiceState('idle');
      };

      recognition.onend = () => {
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not initialize microphone. Please type your message.');
      setVoiceState('idle');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setVoiceState('idle');
    setInterimTranscript('');
  };

  // Text-to-Speech (TTS)
  const speakText = (text: string, langCode: string) => {
    if (isMuted || dilloSettings.voice_enabled === false) return;

    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      setIsSpeechPaused(false);

      // Clean markdown or bold formatting for speech
      const cleanSpeech = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/🚨|👨‍⚕️|📅|🏥|💰|🕐|📍|📄|📞|🫀|🦴|🧠|👶|👩‍⚕️|🫁|🔬|👁️|👂|🦷|💊|🧬|1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|🤖|✨|⭐/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      if (!cleanSpeech) return;

      const targetLang = langCode || currentLang || 'gu-IN';
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.lang = targetLang;
      utterance.rate = dilloSettings.voice_speed || 1.0;
      utterance.pitch = dilloSettings.voice_pitch || 1.0;
      utterance.volume = dilloSettings.voice_volume ?? 1.0;

      // Match voices if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        let matchedVoice: SpeechSynthesisVoice | undefined;

        // 1. Check if admin configured custom voice name
        if (targetLang === 'gu-IN' && dilloSettings.gujarati_voice_name) {
          matchedVoice = voices.find((v) => v.name === dilloSettings.gujarati_voice_name);
        } else if (targetLang === 'hi-IN' && dilloSettings.hindi_voice_name) {
          matchedVoice = voices.find((v) => v.name === dilloSettings.hindi_voice_name);
        } else if (targetLang === 'en-IN' && dilloSettings.english_voice_name) {
          matchedVoice = voices.find((v) => v.name === dilloSettings.english_voice_name);
        }

        // 2. Strict language & locale matching
        if (!matchedVoice) {
          const langPrefix = targetLang.split('-')[0].toLowerCase();
          const genderPref = dilloSettings.voice_gender || 'female';

          if (langPrefix === 'gu') {
            // Gujarati specific voice (gu-IN)
            matchedVoice =
              voices.find((v) => v.lang.toLowerCase() === 'gu-in') ||
              voices.find((v) => v.lang.toLowerCase().startsWith('gu')) ||
              voices.find((v) => v.name.toLowerCase().includes('gujarati'));
          } else if (langPrefix === 'hi') {
            // Hindi specific voice (hi-IN)
            matchedVoice =
              voices.find(
                (v) =>
                  v.lang.toLowerCase() === 'hi-in' &&
                  (genderPref === 'female' ? v.name.toLowerCase().includes('female') : true)
              ) ||
              voices.find((v) => v.lang.toLowerCase() === 'hi-in') ||
              voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
              voices.find((v) => v.name.toLowerCase().includes('hindi'));
          } else {
            // English specific voice (prefer Indian English en-IN)
            matchedVoice =
              voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
              voices.find(
                (v) =>
                  v.lang.toLowerCase().startsWith('en') &&
                  (v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('indian'))
              ) ||
              voices.find((v) => v.lang.toLowerCase().startsWith('en'));
          }
        }

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      utterance.onstart = () => {
        setVoiceState('speaking');
        setIsSpeechPaused(false);
      };

      utterance.onend = () => {
        setVoiceState('idle');
        setIsSpeechPaused(false);
        // Automatic return to listening if continuous voice mode is enabled
        if (dilloSettings.auto_listen_after_speak) {
          setTimeout(() => {
            startListening();
          }, 350);
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setVoiceState('idle');
        setIsSpeechPaused(false);
        setSpeechError(
          targetLang === 'gu-IN'
            ? 'વૉઇસ રિસ્પોન્સ હાલમાં ઉપલબ્ધ નથી. તમે ટેક્સ્ટ ચેટ દ્વારા વાતચીત ચાલુ રાખી શકો છો.'
            : targetLang === 'hi-IN'
            ? 'वॉइस रिस्पॉन्स वर्तमान में उपलब्ध नहीं है। आप टेक्स्ट चैट द्वारा बातचीत जारी रख सकते हैं।'
            : 'Voice response is currently unavailable. You can continue using text chat.'
        );
      };

      currentUtteranceRef.current = utterance;
      setLastAssistantSpeech(cleanSpeech);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Failed to speak response:', e);
      setVoiceState('idle');
      setIsSpeechPaused(false);
    }
  };

  const pauseSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeechPaused(false);
    if (voiceState === 'speaking') {
      setVoiceState('idle');
    }
  };

  const replayLastSpeech = () => {
    if (lastAssistantSpeech) {
      speakText(lastAssistantSpeech, currentLang);
    }
  };

  // Message Handler
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setInputText('');
    stopSpeaking();
    stopListening();
    setSpeechError(null);

    // 1. Add user message
    const userMsg: DilloChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: currentLang,
    };

    setMessages((prev) => [...prev, userMsg]);
    setVoiceState('processing');

    try {
      // 2. Process message through DilloService
      const result = await DilloService.processMessage(
        query,
        currentLang,
        dilloSettings,
        hospitalSettings,
        user?.id,
        lastSuggestedSpeciality,
        hospitalStats,
        pendingAction
      );

      // Adapt current language if new language detected
      if (result.detectedLanguage && result.detectedLanguage !== currentLang) {
        setCurrentLang(result.detectedLanguage);
        localStorage.setItem(DILLO_USER_LANG_KEY, result.detectedLanguage);
      }

      // Track last suggested speciality for YES flow
      if (result.suggestedSpeciality) {
        setLastSuggestedSpeciality(result.suggestedSpeciality);
      }

      // Action Execution & Confirmation Handling
      if (result.actionPayload) {
        if (result.actionPayload.confirmed) {
          setPendingAction(null);
          const target = result.actionPayload.target;
          if (target.startsWith('tel:')) {
            setTimeout(() => {
              window.location.href = target;
            }, 1200);
          } else if (target.startsWith('http')) {
            setTimeout(() => {
              window.open(target, '_blank');
            }, 800);
          } else if (target.startsWith('/')) {
            setTimeout(() => {
              onClose();
              navigate(target);
            }, 800);
          }
        } else if (result.actionPayload.requiresConfirmation) {
          setPendingAction(result.actionPayload);
        } else {
          setPendingAction(null);
        }
      } else if (pendingAction) {
        setPendingAction(null);
      }

      // 3. Add assistant response
      const assistantMsg: DilloChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: result.responseMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: result.detectedLanguage,
        intent: result.intent,
        isEmergency: result.isEmergency,
        suggestedSpeciality: result.suggestedSpeciality,
        suggestedDoctors: result.suggestedDoctors,
        quickReplies: result.quickReplies,
        emergencyContact: result.emergencyContact,
        actionPayload: result.actionPayload,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // 4. Speak response aloud (ALWAYS speak — Voice + Text per requirement)
      if (dilloSettings.voice_enabled && !isMuted) {
        speakText(result.speechText || result.responseMessage, result.detectedLanguage);
      } else {
        setVoiceState('idle');
      }
    } catch (err) {
      console.error('Error processing Dillo message:', err);
      const fallbackMsg: DilloChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I'm having a brief connection issue. Please feel free to ask again or reach out to our hospital helpline directly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: currentLang,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setVoiceState('idle');
    }
  };

  const handleQuickAction = (action: DilloQuickAction) => {
    switch (action.actionType) {
      case 'voice':
        startListening();
        break;
      case 'find_doctor':
        handleSend('I want to find a specialist doctor.');
        break;
      case 'book_appointment':
        handleSend('How do I book an appointment?');
        break;
      case 'departments':
        handleSend('What medical departments and specialities are available?');
        break;
      case 'fees':
        handleSend('What are the doctor consultation fees?');
        break;
      case 'timings':
        handleSend('What are the hospital and OPD timings?');
        break;
      case 'location':
        handleSend('Where is Rhythm Medicity located?');
        break;
      case 'my_appointments':
        handleSend('Show my appointments and booking status.');
        break;
      case 'emergency':
        handleSend('Emergency helpline and urgent assistance.');
        break;
      case 'custom':
        if (action.actionPayload && action.actionPayload.trim()) {
          handleSend(action.actionPayload.trim());
        } else {
          // "Type" action — focus the text input
          setShowTextInput(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
        break;
      default:
        if (action.actionPayload) {
          handleSend(action.actionPayload);
        }
    }
  };

  const handleQuickReply = (reply: string) => {
    // If reply is Speak, start mic
    if (reply === '🎙️ Speak') {
      startListening();
      return;
    }
    handleSend(reply);
  };

  const clearChat = () => {
    stopSpeaking();
    stopListening();
    setLastSuggestedSpeciality(null);
    sessionStorage.removeItem(DILLO_SESSION_INTRO_KEY);

    const introText = DilloService.getIntroduction(currentLang, assistantName);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: introText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: currentLang,
        quickReplies: ['🎙️ Speak', '👨‍⚕️ Find Doctor', '📅 Book Appointment', '🏥 Departments', '🚨 Emergency'],
      },
    ]);
    setVoiceState('idle');

    // Speak the intro again
    if (dilloSettings.voice_enabled && !isMuted) {
      setTimeout(() => {
        speakText(introText, currentLang);
      }, 400);
    }
  };

  if (!isOpen) return null;

  // Voice state label translations
  const getVoiceStateLabel = () => {
    if (isSpeechPaused) {
      return currentLang === 'hi-IN' ? '⏸️ वॉइस रोक दी गई है (Paused)' :
             currentLang === 'gu-IN' ? '⏸️ વૉઇસ થોભાવેલ છે (Paused)' :
             '⏸️ Voice Paused';
    }
    if (voiceState === 'listening') {
      return currentLang === 'hi-IN' ? '🎙️ सुन रहा हूँ... स्पष्ट बोलें' :
             currentLang === 'gu-IN' ? '🎙️ સાંભળી રહ્યો છું... સ્પષ્ટ બોલો' :
             '🎙️ Listening... Speak clearly';
    }
    if (voiceState === 'processing') {
      return currentLang === 'hi-IN' ? 'आपकी बात समझ रहा हूँ...' :
             currentLang === 'gu-IN' ? 'તમારી વાત સમજી રહ્યો છું...' :
             'Understanding your request...';
    }
    if (voiceState === 'speaking') {
      return currentLang === 'hi-IN' ? `🔊 ${assistantName} जवाब दे रहा है...` :
             currentLang === 'gu-IN' ? `🔊 ${assistantName} જવાબ આપી રહ્યો છે...` :
             `🔊 ${assistantName} is responding...`;
    }
    return '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${assistantName} Healthcare Voice Assistant`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6 bg-black/40 backdrop-blur-xs pointer-events-auto"
    >
      {/* Main Container */}
      <div className="w-full sm:max-w-[440px] h-[90dvh] sm:h-[650px] max-h-[92dvh] bg-[#F7F4EC] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#006655]/20 animate-in fade-in slide-in-from-bottom-6 duration-300">
        
        {/* ──────── 1. ASSISTANT HEADER ──────── */}
        <div className="bg-gradient-to-r from-[#003329] via-[#004C3D] to-[#006655] text-white p-4 flex items-center justify-between shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C4A760] to-[#997E3B] text-white flex items-center justify-center font-black text-lg shadow-sm border border-white/20">
                {dilloSettings.assistant_avatar ? (
                  <img
                    src={dilloSettings.assistant_avatar}
                    alt={assistantName}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span>{assistantName.charAt(0)}</span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#003329] rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">{assistantName}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C4A760]/20 text-[#C4A760] border border-[#C4A760]/30 uppercase tracking-wider">
                  AI Navigator
                </span>
              </div>
              <p className="text-[11px] text-[#93D3C3] leading-none mt-0.5">
                {dilloSettings.short_description || 'Rhythm Medicity Reception Assistant'}
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-1.5">
            {/* Language Selector Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition border border-white/10"
                title="Select Conversation Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#C4A760]" />
                <span className="text-[11px] font-bold">
                  {activeLanguages.find((l) => l.code === currentLang)?.nativeName || 'Language'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              <select
                value={currentLang}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setCurrentLang(newLang);
                  localStorage.setItem(DILLO_USER_LANG_KEY, newLang);
                  stopSpeaking();
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Select Language"
              >
                {activeLanguages.map((l) => (
                  <option key={l.code} value={l.code} className="text-slate-900">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Mute Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isMuted) stopSpeaking();
                setIsMuted(!isMuted);
              }}
              className={`p-2 rounded-xl text-white transition ${
                isMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
              aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-[#C4A760]" />}
            </button>

            {/* Clear Chat */}
            <button
              type="button"
              onClick={clearChat}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Clear chat history"
              aria-label="Clear chat history"
            >
              <RotateCcw className="w-4 h-4 text-white/80" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition ml-1"
              aria-label="Close Dillo assistant"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* ──────── 2. VOICE STATE BANNER ──────── */}
        {voiceState !== 'idle' && (
          <div className="bg-[#004C3D] text-white px-4 py-3 flex items-center justify-between text-xs border-b border-[#006655] shadow-inner transition-all">
            <div className="flex items-center gap-2.5">
              <DilloVoiceWave state={voiceState} size="md" />
              <span className="font-semibold text-[#93D3C3] text-[13px]">
                {getVoiceStateLabel()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {voiceState === 'listening' && (
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 text-[11px] font-bold transition flex items-center gap-1"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Stop</span>
                </button>
              )}

              {voiceState === 'speaking' && (
                <>
                  {isSpeechPaused ? (
                    <button
                      type="button"
                      onClick={resumeSpeaking}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-100 text-[11px] font-bold transition flex items-center gap-1"
                      title="Resume voice response"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pauseSpeaking}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-[11px] font-bold transition flex items-center gap-1"
                      title="Pause voice response"
                    >
                      <Pause className="w-2.5 h-2.5 fill-current" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop Voice</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Interim Speech Transcription Live Float */}
        {interimTranscript && (
          <div className="bg-[#E0F2ED] text-[#004C3D] px-4 py-2.5 text-sm italic flex items-center gap-2 border-b border-[#006655]/10">
            <Mic className="w-4 h-4 text-[#006655] animate-pulse shrink-0" />
            <span className="truncate font-medium">"{interimTranscript}"</span>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="bg-amber-50 text-amber-800 px-4 py-2 text-xs flex items-center justify-between border-b border-amber-200">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{speechError}</span>
            </span>
            <button
              onClick={() => setSpeechError(null)}
              className="text-amber-900 font-bold ml-2 text-xs hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ──────── 3. MESSAGES STREAM ──────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-gradient-to-b from-[#F7F4EC] to-[#EFECE1]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2 max-w-[92%] sm:max-w-[88%] ${
                  isUser ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {/* Sender Pill & Time */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
                  {!isUser && (
                    <span className="font-bold text-[#006655] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#C4A760]" />
                      {assistantName}
                    </span>
                  )}
                  <span>{msg.timestamp}</span>
                </div>

                {/* Bubble Container */}
                <div
                  className={`p-3.5 rounded-2xl shadow-xs leading-relaxed text-sm ${
                    isUser
                      ? 'bg-[#006655] text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Emergency Urgent Banner Card */}
                {msg.isEmergency && (
                  <div className="w-full bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 space-y-3 shadow-md">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0">
                        <AlertCircle className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="font-black text-rose-900 text-sm">
                          {currentLang === 'hi-IN' ? 'रिदम मेडिसिटी इमरजेंसी ट्रायज' :
                           currentLang === 'gu-IN' ? 'રિધમ મેડિસિટી ઇમરજન્સી ટ્રાયેજ' :
                           'Rhythm Medicity Emergency Triage'}
                        </h4>
                        <p className="text-xs text-rose-700 mt-0.5">
                          {currentLang === 'hi-IN' ? '24x7 एम्बुलेंस और क्रिटिकल केयर तुरंत उपलब्ध है।' :
                           currentLang === 'gu-IN' ? '24x7 એમ્બ્યુલન્સ અને ક્રિટિકલ કેર તરત ઉપલબ્ધ છે.' :
                           '24x7 Ambulance & Critical Care are immediately on standby.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${msg.emergencyContact || hospitalSettings.emergency_number || '108'}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>
                          {currentLang === 'hi-IN' ? 'इमरजेंसी कॉल' :
                           currentLang === 'gu-IN' ? 'ઇમરજન્સી કૉલ' :
                           'Call Emergency'}
                        </span>
                      </a>
                      <a
                        href="https://maps.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-rose-300 text-rose-800 font-bold text-xs hover:bg-rose-100/50 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        <span>
                          {currentLang === 'hi-IN' ? 'हॉस्पिटल मैप' :
                           currentLang === 'gu-IN' ? 'હોસ્પિટલ મેપ' :
                           'Hospital Map'}
                        </span>
                      </a>
                    </div>
                  </div>
                )}

                {/* ──── DOCTOR RECOMMENDATION CARDS (Dynamic from real database) ──── */}
                {msg.suggestedDoctors && msg.suggestedDoctors.length > 0 && (
                  <div className="w-full space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-[#006655] uppercase tracking-wider block">
                      {currentLang === 'hi-IN' ? 'रिदम मेडिसिटी उपलब्ध विशेषज्ञ:' :
                       currentLang === 'gu-IN' ? 'રિધમ મેડિસિટી ઉપલબ્ધ નિષ્ણાતો:' :
                       'Rhythm Medicity Available Specialists:'}
                    </span>
                    <div className="space-y-2">
                      {msg.suggestedDoctors.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-white rounded-xl p-3 border border-slate-200 hover:border-[#006655]/40 shadow-xs flex items-center justify-between gap-3 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-[#006655]/10">
                              {doc.photo_url ? (
                                <img
                                  src={doc.photo_url}
                                  alt={doc.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{doc.full_name?.charAt(0) || 'D'}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-slate-900 truncate">{doc.full_name}</h5>
                              <p className="text-[11px] text-[#006655] font-medium truncate">
                                {typeof doc.speciality === 'object' && doc.speciality !== null
                                  ? (doc.speciality as any).name || 'Specialist'
                                  : (doc.speciality as any) || 'Specialist'}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span>{doc.experience_years} yrs exp</span>
                                <span>•</span>
                                <span className="font-bold text-emerald-700">₹{doc.consultation_fee}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate(`/book-appointment?doctorId=${doc.id}`);
                            }}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#006655] hover:bg-[#004C3D] text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1"
                          >
                            <span>
                              {currentLang === 'hi-IN' ? 'बुक करें' :
                               currentLang === 'gu-IN' ? 'બુક કરો' :
                               'Book'}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ──── VOICE ACTION CONFIRMATION & INTERACTIVE ACTION CARDS ──── */}
                {msg.actionPayload && (
                  <div className="w-full pt-1">
                    {/* 1. Ambulance Action Card */}
                    {msg.actionPayload.action === 'call_ambulance' && (
                      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-4 shadow-lg border border-red-500 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl animate-pulse">🚑</span>
                            <div>
                              <h4 className="font-extrabold text-sm tracking-wide">
                                {currentLang === 'hi-IN' ? 'रिदम मेडिसिटी 24x7 एम्बुलेंस' :
                                 currentLang === 'gu-IN' ? 'રિધમ મેડિસિટી 24x7 એમ્બ્યુલન્સ' :
                                 'Rhythm Medicity 24x7 Ambulance'}
                              </h4>
                              <p className="text-xs text-red-100 font-mono font-bold mt-0.5">
                                {msg.actionPayload.label || hospitalSettings.ambulance_number || '108'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                            ACLS 24x7
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={msg.actionPayload.target}
                            onClick={() => setPendingAction(null)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs shadow-md transition"
                          >
                            <Phone className="w-4 h-4 text-red-600" />
                            <span>
                              {currentLang === 'hi-IN' ? '🚑 एम्बुलेंस को कॉल करें' :
                               currentLang === 'gu-IN' ? '🚑 એમ્બ્યુલન્સને કૉલ કરો' :
                               '🚑 Call Ambulance'}
                            </span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setPendingAction(null);
                              handleSend('cancel');
                            }}
                            className="py-2.5 px-3 rounded-xl bg-red-800/60 hover:bg-red-800/80 text-white text-xs font-semibold transition"
                          >
                            {currentLang === 'hi-IN' ? 'रद्द करें' :
                             currentLang === 'gu-IN' ? 'રદ કરો' :
                             'Cancel'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2. Emergency Call Card */}
                    {msg.actionPayload.action === 'call_emergency' && (
                      <div className="bg-gradient-to-r from-rose-700 to-red-800 text-white rounded-2xl p-4 shadow-lg border border-rose-500 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl animate-pulse">🚨</span>
                            <div>
                              <h4 className="font-extrabold text-sm tracking-wide">
                                {currentLang === 'hi-IN' ? 'आपातकालीन चिकित्सा हेल्पलाइन' :
                                 currentLang === 'gu-IN' ? 'તાત્કાલિક સારવાર હેલ્પલાઇન' :
                                 'Emergency Medical Helpline'}
                              </h4>
                              <p className="text-xs text-rose-100 font-mono font-bold mt-0.5">
                                {msg.actionPayload.label || hospitalSettings.emergency_number}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={msg.actionPayload.target}
                            onClick={() => setPendingAction(null)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-rose-800 hover:bg-rose-50 font-black text-xs shadow-md transition"
                          >
                            <Phone className="w-4 h-4 text-rose-700" />
                            <span>
                              {currentLang === 'hi-IN' ? '🚨 इमरजेंसी कॉल करें' :
                               currentLang === 'gu-IN' ? '🚨 ઇમરજન્સી કૉલ કરો' :
                               '🚨 Call Emergency'}
                            </span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setPendingAction(null);
                              handleSend('cancel');
                            }}
                            className="py-2.5 px-3 rounded-xl bg-rose-900/60 hover:bg-rose-900/80 text-white text-xs font-semibold transition"
                          >
                            {currentLang === 'hi-IN' ? 'रद्द करें' :
                             currentLang === 'gu-IN' ? 'રદ કરો' :
                             'Cancel'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. Hospital Reception Call Card */}
                    {msg.actionPayload.action === 'call_hospital' && (
                      <div className="bg-[#004C3D] text-white rounded-2xl p-4 shadow-md border border-[#006655] space-y-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white/10 text-white">
                            <Phone className="w-4 h-4 text-[#C4A760]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-white">
                              {currentLang === 'hi-IN' ? 'हॉस्पिटल रिसेप्शन हेल्पलाइन' :
                               currentLang === 'gu-IN' ? 'હોસ્પિટલ રિસેપ્શન હેલ્પલાઇન' :
                               'Hospital Reception Desk'}
                            </h4>
                            <p className="text-xs text-emerald-200 font-mono font-bold mt-0.5">
                              {msg.actionPayload.label || hospitalSettings.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={msg.actionPayload.target}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#C4A760] text-slate-900 hover:bg-[#d4b975] font-black text-xs shadow-xs transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>
                              {currentLang === 'hi-IN' ? '📞 रिसेप्शन पर कॉल करें' :
                               currentLang === 'gu-IN' ? '📞 રિસેપ્શન પર કૉલ કરો' :
                               '📞 Call Hospital'}
                            </span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* 4. WhatsApp Chat Card */}
                    {msg.actionPayload.action === 'whatsapp_hospital' && (
                      <div className="bg-emerald-700 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl">💬</span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs truncate">
                              {currentLang === 'hi-IN' ? 'व्हाट्सएप चैट सहायता' :
                               currentLang === 'gu-IN' ? 'વોટ્સએપ ચેટ સહાયતા' :
                               'WhatsApp Hospital Desk'}
                            </h4>
                            <p className="text-[11px] text-emerald-100 font-mono truncate">
                              {msg.actionPayload.label}
                            </p>
                          </div>
                        </div>
                        <a
                          href={msg.actionPayload.target}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                        >
                          <span>Chat</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* 5. Hospital Location / Google Maps Card */}
                    {msg.actionPayload.action === 'hospital_location' && (
                      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                            <MapPin className="w-4 h-4 text-[#C4A760]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {currentLang === 'hi-IN' ? 'गूगल मैप्स दिशा-निर्देश' :
                               currentLang === 'gu-IN' ? 'ગૂગલ મેપ્સ ડિરેક્શન્સ' :
                               'Hospital Directions & GPS'}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              {hospitalSettings.address}
                            </p>
                          </div>
                        </div>
                        <a
                          href={msg.actionPayload.target}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                        >
                          <span>Directions</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Reply Suggestions */}
                {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickReply(reply)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-[#006655] hover:text-white border border-slate-200 text-[#006655] text-xs font-semibold shadow-2xs transition"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ──────── 4. QUICK ACTION BUTTONS BAR ──────── */}
        <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(dilloSettings.quick_actions || [])
            .filter((a) => a.active)
            .sort((a, b) => a.display_order - b.display_order)
            .map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleQuickAction(action)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#E0F2ED] text-slate-700 hover:text-[#006655] border border-slate-200/80 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>{action.label}</span>
              </button>
            ))}
        </div>

        {/* ──────── 5. BOTTOM INPUT BAR WITH VOICE BUTTON ──────── */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          {/* Main Microphone Button */}
          {dilloSettings.voice_enabled && (
            <button
              type="button"
              disabled={voiceState === 'speaking' || voiceState === 'processing'}
              onClick={voiceState === 'listening' ? stopListening : startListening}
              className={`p-3 rounded-2xl font-bold transition-all flex items-center justify-center shrink-0 ${
                voiceState === 'speaking'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                  : voiceState === 'listening'
                  ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-gradient-to-r from-[#006655] to-[#004C3D] text-[#C4A760] hover:scale-105 shadow-md active:scale-95'
              }`}
              title={
                voiceState === 'speaking'
                  ? `${assistantName} is speaking... Please listen`
                  : voiceState === 'listening'
                  ? 'Stop Listening'
                  : `Speak with ${assistantName}`
              }
              aria-label={
                voiceState === 'speaking'
                  ? `${assistantName} is speaking`
                  : voiceState === 'listening'
                  ? 'Stop Listening'
                  : `Speak with ${assistantName}`
              }
            >
              {voiceState === 'speaking' ? (
                <Volume2 className="w-5 h-5 animate-pulse text-[#006655]" />
              ) : voiceState === 'listening' ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Text Input Fallback */}
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={
                currentLang === 'hi-IN' ? `${assistantName} से पूछें...` :
                currentLang === 'gu-IN' ? `${assistantName} ને પૂછો...` :
                `Ask ${assistantName} in ${activeLanguages.find((l) => l.code === currentLang)?.name || 'any language'}...`
              }
              className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white text-slate-800 placeholder-slate-400"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="absolute right-1.5 p-1.5 rounded-lg bg-[#006655] hover:bg-[#004C3D] disabled:opacity-30 text-white transition"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Replay last speech */}
          {lastAssistantSpeech && !isMuted && voiceState !== 'speaking' && (
            <button
              type="button"
              onClick={replayLastSpeech}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-[#E0F2ED] text-[#006655] transition shrink-0"
              title={
                currentLang === 'gu-IN' ? 'ફરીથી સાંભળો (Replay Voice)' :
                currentLang === 'hi-IN' ? 'फिर से सुनें (Replay Voice)' :
                'Replay Voice Response'
              }
              aria-label="Replay last response"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ──────── 6. TRUST & SAFETY DISCLAIMER ──────── */}
        <div className="bg-slate-50 py-1 px-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400">
            {currentLang === 'hi-IN' ? `${assistantName} एक AI नेविगेशन असिस्टेंट है, डॉक्टर नहीं। इमरजेंसी में 108 डायल करें।` :
             currentLang === 'gu-IN' ? `${assistantName} એક AI નેવિગેશન સહાયક છે, ડોક્ટર નથી. ઇમરજન્સીમાં 108 ડાયલ કરો.` :
             `${assistantName} is an AI navigation assistant, not a doctor. In an emergency, dial 108 or our 24x7 casualty.`}
          </p>
        </div>
      </div>
    </div>
  );
};
