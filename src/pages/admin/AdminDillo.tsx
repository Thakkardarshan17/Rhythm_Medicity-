import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Settings,
  Languages,
  Zap,
  HelpCircle,
  Stethoscope,
  Play,
  Square,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Mic,
  MessageSquare,
  ShieldCheck,
  Eye,
  Sliders,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Check,
  BookOpen,
  Search,
  Filter,
  Edit3,
  Layers,
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { AuditService } from '../../services/auditService';
import { DoctorService } from '../../services/doctorService';
import {
  DilloSettings,
  DilloSupportedLanguage,
  DilloQuickAction,
  DilloFAQ,
  DilloSpecialityMapping,
  DilloKnowledgeItem,
  Doctor,
} from '../../types/database';
import {
  DEFAULT_DILLO_SETTINGS,
  DEFAULT_DILLO_LANGUAGES,
  DEFAULT_DILLO_QUICK_ACTIONS,
  DEFAULT_DILLO_FAQS,
  DEFAULT_DILLO_KNOWLEDGE_BASE,
  DEFAULT_DILLO_SPECIALITY_MAPPINGS,
} from '../../services/dilloService';

export const AdminDillo: React.FC = () => {
  const { dilloSettings, updateDilloSettingsInMemory } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'languages' | 'actions' | 'specialities' | 'knowledge' | 'faqs' | 'test'>('profile');
  const [formData, setFormData] = useState<DilloSettings>(() => ({
    ...DEFAULT_DILLO_SETTINGS,
    ...(dilloSettings || {}),
    supported_languages: dilloSettings?.supported_languages || DEFAULT_DILLO_LANGUAGES,
    quick_actions: dilloSettings?.quick_actions || DEFAULT_DILLO_QUICK_ACTIONS,
    faqs: dilloSettings?.faqs || DEFAULT_DILLO_FAQS,
    knowledge_base: dilloSettings?.knowledge_base || DEFAULT_DILLO_KNOWLEDGE_BASE,
    speciality_mappings: dilloSettings?.speciality_mappings || DEFAULT_DILLO_SPECIALITY_MAPPINGS,
  }));
  const [saving, setSaving] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Knowledge base filters & modal state
  const [kbSearchTerm, setKbSearchTerm] = useState('');
  const [kbCategoryFilter, setKbCategoryFilter] = useState('All');
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(null);
  const [knowledgeForm, setKnowledgeForm] = useState<DilloKnowledgeItem>({
    id: '',
    title: '',
    question: '',
    answer: '',
    answer_en: '',
    answer_hi: '',
    answer_gu: '',
    category: 'General',
    keywords: [],
    priority: 'medium',
    active: true,
  });
  const [newKbKeyword, setNewKbKeyword] = useState('');

  // Doctor assignment state for speciality mappings
  const [mappingDoctorSelect, setMappingDoctorSelect] = useState<{ [id: string]: string }>({});

  // Sync formData whenever dilloSettings changes or initializes in context
  useEffect(() => {
    if (dilloSettings) {
      setFormData((prev) => ({
        ...DEFAULT_DILLO_SETTINGS,
        ...prev,
        ...dilloSettings,
        supported_languages: dilloSettings.supported_languages || prev.supported_languages || DEFAULT_DILLO_LANGUAGES,
        quick_actions: dilloSettings.quick_actions || prev.quick_actions || DEFAULT_DILLO_QUICK_ACTIONS,
        faqs: dilloSettings.faqs || prev.faqs || DEFAULT_DILLO_FAQS,
        knowledge_base: dilloSettings.knowledge_base || prev.knowledge_base || DEFAULT_DILLO_KNOWLEDGE_BASE,
        speciality_mappings: dilloSettings.speciality_mappings || prev.speciality_mappings || DEFAULT_DILLO_SPECIALITY_MAPPINGS,
      }));
    }
  }, [dilloSettings]);

  // Load doctors for mapping selection
  useEffect(() => {
    DoctorService.getActiveDoctors().then(setDoctors).catch(console.error);
  }, []);

  // Load browser TTS voices
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
        }
      }
    };
    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePreviewVoice = (langCode: 'gu-IN' | 'hi-IN' | 'en-IN') => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis is not supported in this browser.', 'error');
      return;
    }
    window.speechSynthesis.cancel();

    if (previewingVoice === langCode) {
      setPreviewingVoice(null);
      return;
    }

    let textToSpeak = '';
    if (langCode === 'gu-IN') {
      textToSpeak = 'નમસ્તે! હું Dillo છું, Rhythm Medicity નો AI Assistant. તમે તમારી તકલીફ મને જણાવી શકો છો. હું તમારી કેવી રીતે મદદ કરી શકું?';
    } else if (langCode === 'hi-IN') {
      textToSpeak = 'नमस्ते! मैं Dillo हूँ, Rhythm Medicity का AI Assistant। आप अपनी समस्या मुझे बता सकते हैं। मैं आपकी कैसे मदद करूँ?';
    } else {
      textToSpeak = "Hello! I'm Dillo, the Rhythm Medicity AI Assistant. How can I help you today?";
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = formData.voice_speed || 1.0;
    utterance.pitch = formData.voice_pitch || 1.0;
    utterance.volume = formData.voice_volume ?? 1.0;

    const customVoiceName =
      langCode === 'gu-IN'
        ? formData.gujarati_voice_name
        : langCode === 'hi-IN'
        ? formData.hindi_voice_name
        : formData.english_voice_name;

    if (customVoiceName) {
      const matched = availableVoices.find((v) => v.name === customVoiceName);
      if (matched) utterance.voice = matched;
    } else {
      const langPrefix = langCode.split('-')[0].toLowerCase();
      const matched = availableVoices.find(
        (v) =>
          v.lang.toLowerCase() === langCode.toLowerCase() ||
          v.lang.toLowerCase().startsWith(langPrefix) ||
          (langPrefix === 'gu' && v.name.toLowerCase().includes('gujarati')) ||
          (langPrefix === 'hi' && v.name.toLowerCase().includes('hindi'))
      );
      if (matched) utterance.voice = matched;
    }

    utterance.onstart = () => setPreviewingVoice(langCode);
    utterance.onend = () => setPreviewingVoice(null);
    utterance.onerror = () => setPreviewingVoice(null);

    window.speechSynthesis.speak(utterance);
  };

  // New item states
  const [newKeywordInput, setNewKeywordInput] = useState<{ [id: string]: string }>({});
  const [newFaqCategory, setNewFaqCategory] = useState('General');

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      updateDilloSettingsInMemory(formData);
      try {
        await AuditService.logAction('UPDATE_AI_ASSISTANT_SETTINGS', 'AI_ASSISTANT', undefined, {
          assistant_name: formData.assistant_name,
          ai_enabled: formData.ai_enabled,
          voice_enabled: formData.voice_enabled,
        });
      } catch (logErr) {
        console.warn('Audit log error (ignored):', logErr);
      }
      showToast('AI Assistant (Dillo) settings saved successfully! Live website updated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_DILLO_SETTINGS);
    updateDilloSettingsInMemory(DEFAULT_DILLO_SETTINGS);
    showToast('Reset to default Dillo configuration and saved to live website.', 'info');
  };

  // Language management
  const toggleLanguage = (code: string) => {
    const existing = formData.supported_languages || DEFAULT_DILLO_LANGUAGES;
    const updated = existing.map((l) =>
      l.code === code ? { ...l, active: !l.active } : l
    );
    const newSettings = { ...formData, supported_languages: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('Language settings updated!', 'success');
  };

  // Quick action management
  const toggleQuickAction = (id: string) => {
    const existing = formData.quick_actions || [];
    const updated = existing.map((qa) =>
      qa.id === id ? { ...qa, active: !qa.active } : qa
    );
    const newSettings = { ...formData, quick_actions: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('Quick Action status updated and saved!', 'success');
  };

  const deleteQuickAction = (id: string) => {
    const existing = formData.quick_actions || [];
    const updated = existing.filter((qa) => qa.id !== id);
    const newSettings = { ...formData, quick_actions: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('Quick Action deleted!', 'info');
  };

  const updateQuickAction = (id: string, updates: Partial<DilloQuickAction>) => {
    const existing = formData.quick_actions || [];
    const updated = existing.map((qa) => (qa.id === id ? { ...qa, ...updates } : qa));
    const newSettings = { ...formData, quick_actions: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
  };

  const moveQuickAction = (index: number, direction: 'up' | 'down') => {
    const existing = [...(formData.quick_actions || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= existing.length) return;
    const temp = existing[index];
    existing[index] = existing[targetIndex];
    existing[targetIndex] = temp;
    const reordered = existing.map((item, idx) => ({ ...item, display_order: idx + 1 }));
    const newSettings = { ...formData, quick_actions: reordered };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('Quick Actions reordered and saved!', 'success');
  };

  const addQuickAction = () => {
    const existing = formData.quick_actions || [];
    const newAction: DilloQuickAction = {
      id: `qa-${Date.now()}`,
      label: 'New Quick Action',
      icon: 'HelpCircle',
      actionType: 'custom',
      actionPayload: 'Tell me more about your hospital services.',
      active: true,
      display_order: existing.length + 1,
    };
    const updated = [...existing, newAction];
    const newSettings = { ...formData, quick_actions: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('New Quick Action added and saved to live assistant!', 'success');
  };

  // Speciality mapping management
  const addSpecialityKeyword = (id: string) => {
    const kw = (newKeywordInput[id] || '').trim().toLowerCase();
    if (!kw) return;

    const existing = formData.speciality_mappings || [];
    const updated = existing.map((sm) => {
      if (sm.id === id && !(sm.keywords || []).includes(kw)) {
        return { ...sm, keywords: [...(sm.keywords || []), kw] };
      }
      return sm;
    });

    const newSettings = { ...formData, speciality_mappings: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    setNewKeywordInput({ ...newKeywordInput, [id]: '' });
    showToast('Keyword added and saved!', 'success');
  };

  const removeSpecialityKeyword = (mappingId: string, kwToRemove: string) => {
    const existing = formData.speciality_mappings || [];
    const updated = existing.map((sm) => {
      if (sm.id === mappingId) {
        return { ...sm, keywords: (sm.keywords || []).filter((k) => k !== kwToRemove) };
      }
      return sm;
    });
    const newSettings = { ...formData, speciality_mappings: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
  };

  const addSpecialityMapping = () => {
    const existing = formData.speciality_mappings || [];
    const newMapping: DilloSpecialityMapping = {
      id: `sm-${Date.now()}`,
      speciality_name: 'New Speciality',
      keywords: ['symptom1', 'symptom2'],
      active: true,
    };
    const newSettings = {
      ...formData,
      speciality_mappings: [...existing, newMapping],
    };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('New Speciality mapping added and saved!', 'success');
  };

  // FAQ management
  const toggleFaq = (id: string) => {
    const existing = formData.faqs || [];
    const updated = existing.map((f) => (f.id === id ? { ...f, active: !f.active } : f));
    const newSettings = { ...formData, faqs: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('FAQ status updated and saved!', 'success');
  };

  const deleteFaq = (id: string) => {
    const existing = formData.faqs || [];
    const updated = existing.filter((f) => f.id !== id);
    const newSettings = { ...formData, faqs: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('FAQ deleted and saved!', 'info');
  };

  const addFaq = () => {
    const existing = formData.faqs || [];
    const newFaq: DilloFAQ = {
      id: `faq-${Date.now()}`,
      question: 'New patient question?',
      answer: 'Answer provided by hospital administration.',
      keywords: ['keyword1', 'keyword2'],
      category: newFaqCategory || 'General',
      active: true,
    };
    const newSettings = { ...formData, faqs: [...existing, newFaq] };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('New FAQ added and saved!', 'success');
  };

  // ─────────────────────────────────────────────
  // KNOWLEDGE BASE MANAGEMENT
  // ─────────────────────────────────────────────
  const openAddKnowledgeModal = () => {
    setEditingKnowledgeId(null);
    setKnowledgeForm({
      id: `kb-${Date.now()}`,
      title: '',
      question: '',
      answer: '',
      answer_en: '',
      answer_hi: '',
      answer_gu: '',
      category: 'Hospital Services',
      keywords: [],
      priority: 'medium',
      active: true,
      display_order: (formData.knowledge_base || []).length + 1,
    });
    setNewKbKeyword('');
    setIsKnowledgeModalOpen(true);
  };

  const openEditKnowledgeModal = (item: DilloKnowledgeItem) => {
    setEditingKnowledgeId(item.id);
    setKnowledgeForm({ ...item });
    setNewKbKeyword('');
    setIsKnowledgeModalOpen(true);
  };

  const saveKnowledgeItem = () => {
    if (!knowledgeForm.title.trim() || !knowledgeForm.question.trim()) {
      showToast('Please provide both Title and Question.', 'error');
      return;
    }

    const defaultAns =
      knowledgeForm.answer.trim() ||
      knowledgeForm.answer_en?.trim() ||
      knowledgeForm.answer_hi?.trim() ||
      knowledgeForm.answer_gu?.trim() ||
      'Official hospital information.';

    const itemToSave: DilloKnowledgeItem = {
      ...knowledgeForm,
      answer: defaultAns,
    };

    const existing = formData.knowledge_base || [];
    let updated: DilloKnowledgeItem[];
    if (editingKnowledgeId) {
      updated = existing.map((k) => (k.id === editingKnowledgeId ? itemToSave : k));
      showToast('Knowledge Base item updated and saved to AI Assistant!', 'success');
    } else {
      updated = [itemToSave, ...existing];
      showToast('New Knowledge Base item added to live AI Assistant!', 'success');
    }

    const newSettings = { ...formData, knowledge_base: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    setIsKnowledgeModalOpen(false);
  };

  const toggleKnowledgeItem = (id: string) => {
    const existing = formData.knowledge_base || [];
    const updated = existing.map((k) => (k.id === id ? { ...k, active: !k.active } : k));
    const newSettings = { ...formData, knowledge_base: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('Knowledge item status updated and saved!', 'success');
  };

  const deleteKnowledgeItem = (id: string) => {
    const existing = formData.knowledge_base || [];
    const updated = existing.filter((k) => k.id !== id);
    const newSettings = { ...formData, knowledge_base: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('Knowledge item deleted and removed from AI Assistant!', 'info');
  };

  const moveKnowledgeItem = (index: number, direction: 'up' | 'down') => {
    const existing = [...(formData.knowledge_base || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= existing.length) return;
    const temp = existing[index];
    existing[index] = existing[targetIndex];
    existing[targetIndex] = temp;
    const reordered = existing.map((item, idx) => ({ ...item, display_order: idx + 1 }));
    const newSettings = { ...formData, knowledge_base: reordered };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('Knowledge base priority reordered!', 'success');
  };

  const addKnowledgeKeyword = () => {
    const kw = newKbKeyword.trim().toLowerCase();
    if (!kw) return;
    if (!(knowledgeForm.keywords || []).includes(kw)) {
      setKnowledgeForm({
        ...knowledgeForm,
        keywords: [...(knowledgeForm.keywords || []), kw],
      });
    }
    setNewKbKeyword('');
  };

  const removeKnowledgeKeyword = (kwToRemove: string) => {
    setKnowledgeForm({
      ...knowledgeForm,
      keywords: (knowledgeForm.keywords || []).filter((kw) => kw !== kwToRemove),
    });
  };

  // ─────────────────────────────────────────────
  // DOCTOR ASSIGNMENT TO SPECIALITY MAPPINGS
  // ─────────────────────────────────────────────
  const assignDoctorToMapping = (mappingId: string, doctorId: string) => {
    if (!doctorId) return;
    const existing = formData.speciality_mappings || [];
    const updated = existing.map((m) => {
      if (m.id === mappingId) {
        const docIds = m.suggested_doctor_ids || [];
        if (!docIds.includes(doctorId)) {
          return { ...m, suggested_doctor_ids: [...docIds, doctorId] };
        }
      }
      return m;
    });
    const newSettings = { ...formData, speciality_mappings: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    setMappingDoctorSelect({ ...mappingDoctorSelect, [mappingId]: '' });
    showToast('Doctor assigned to AI recommendations!', 'success');
  };

  const removeDoctorFromMapping = (mappingId: string, doctorId: string) => {
    const existing = formData.speciality_mappings || [];
    const updated = existing.map((m) => {
      if (m.id === mappingId) {
        return {
          ...m,
          suggested_doctor_ids: (m.suggested_doctor_ids || []).filter((id) => id !== doctorId),
        };
      }
      return m;
    });
    const newSettings = { ...formData, speciality_mappings: updated };
    setFormData(newSettings);
    updateDilloSettingsInMemory(newSettings);
    showToast('Doctor unassigned from AI recommendations!', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#006655] to-[#004C3D] text-[#C4A760] flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#006655] tracking-tight">
                AI Voice Assistant & Navigation Console
              </h1>
              <p className="text-xs text-slate-500">
                Configure Assistant Profile ({formData.assistant_name}), multilingual voice settings, AI Knowledge Base, and Doctor mappings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#C4A760]" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'profile'
              ? 'bg-[#006655] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#006655] hover:bg-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Assistant Profile & Voice</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('languages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'languages'
              ? 'bg-[#006655] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#006655] hover:bg-white'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-[#C4A760]" />
          <span>Voice & Language Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('specialities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'specialities'
              ? 'bg-[#006655] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#006655] hover:bg-white'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Speciality & Doctor Mapping</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'knowledge'
              ? 'bg-[#006655] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#006655] hover:bg-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#C4A760]" />
          <span>Knowledge Base ({(formData.knowledge_base || []).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'actions'
              ? 'bg-[#006655] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#006655] hover:bg-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Quick Actions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'faqs'
              ? 'bg-[#006655] text-white shadow-sm'
              : 'text-slate-700 hover:text-[#006655] hover:bg-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Hospital FAQs ({formData.faqs.length})</span>
        </button>
      </div>

      {/* Tab 1: Assistant Profile & Settings */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Global Activation & Voice Toggles */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#C4A760]" />
                <span>Core Assistant Controls</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={formData.ai_enabled}
                    onChange={(e) => setFormData({ ...formData, ai_enabled: e.target.checked })}
                    className="w-4 h-4 text-[#006655] rounded-sm focus:ring-[#006655]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">AI Assistant Active</span>
                    <span className="text-[10px] text-slate-500">Show floating widget on site</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={formData.voice_enabled}
                    onChange={(e) => setFormData({ ...formData, voice_enabled: e.target.checked })}
                    className="w-4 h-4 text-[#006655] rounded-sm focus:ring-[#006655]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Voice Input & Output</span>
                    <span className="text-[10px] text-slate-500">Microphone & Speech aloud</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={formData.text_chat_enabled}
                    onChange={(e) => setFormData({ ...formData, text_chat_enabled: e.target.checked })}
                    className="w-4 h-4 text-[#006655] rounded-sm focus:ring-[#006655]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Text Chat Support</span>
                    <span className="text-[10px] text-slate-500">Keyboard typing enabled</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Assistant Identity */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C4A760]" />
                <span>Assistant Identity & Branding</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assistant Name * (Prompt Default: Dillo)
                  </label>
                  <input
                    type="text"
                    value={formData.assistant_name}
                    onChange={(e) => setFormData({ ...formData, assistant_name: e.target.value })}
                    placeholder="Dillo"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Changing this name automatically updates the assistant throughout the entire patient website.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assistant Title / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.assistant_title}
                    onChange={(e) => setFormData({ ...formData, assistant_title: e.target.value })}
                    placeholder="Rhythm Medicity Healthcare Assistant"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.assistant_avatar}
                    onChange={(e) => setFormData({ ...formData, assistant_avatar: e.target.value })}
                    placeholder="https://... or leave empty for icon"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default Language
                  </label>
                  <select
                    value={formData.default_language}
                    onChange={(e) => setFormData({ ...formData, default_language: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
                  >
                    {formData.supported_languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Welcome Message (First message sent to patient)
                </label>
                <textarea
                  rows={2}
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Notice & Safety Disclaimer
                </label>
                <textarea
                  rows={2}
                  value={formData.emergency_message}
                  onChange={(e) => setFormData({ ...formData, emergency_message: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
                />
              </div>
            </div>

            {/* Voice Acoustics Tuning */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#C4A760]" />
                <span>Voice Acoustics & Speed</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Speech Rate / Speed</span>
                    <span className="text-[#006655]">{formData.voice_speed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.1"
                    value={formData.voice_speed}
                    onChange={(e) => setFormData({ ...formData, voice_speed: parseFloat(e.target.value) })}
                    className="w-full accent-[#006655]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Slower (0.7x)</span>
                    <span>Normal (1.0x)</span>
                    <span>Faster (1.4x)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Speech Pitch</span>
                    <span className="text-[#006655]">{formData.voice_pitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={formData.voice_pitch}
                    onChange={(e) => setFormData({ ...formData, voice_pitch: parseFloat(e.target.value) })}
                    className="w-full accent-[#006655]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Deeper</span>
                    <span>Natural</span>
                    <span>Higher</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Voice Gender Preference</label>
                  <select
                    value={formData.voice_gender}
                    onChange={(e) => setFormData({ ...formData, voice_gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  >
                    <option value="female">Female Voice (Friendly Receptionist)</option>
                    <option value="male">Male Voice</option>
                    <option value="neutral">Browser Standard Voice</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Card Preview */}
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-b from-[#003329] via-[#004C3D] to-[#003329] text-white rounded-3xl shadow-xl space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4A760] block">
                Live Floating Button Preview
              </span>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4A760] to-[#997E3B] text-white flex items-center justify-center font-black text-sm shadow-sm">
                    {formData.assistant_avatar ? (
                      <img src={formData.assistant_avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{formData.assistant_name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{formData.assistant_name}</h4>
                    <p className="text-[11px] text-[#93D3C3]">{formData.short_description || 'Reception Assistant'}</p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white/10 text-[#C4A760]">
                  <Mic className="w-4 h-4 animate-pulse" />
                </div>
              </div>

              <div className="text-xs text-[#93D3C3] space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <strong className={formData.ai_enabled ? 'text-emerald-400' : 'text-rose-400'}>
                    {formData.ai_enabled ? 'Active on Website' : 'Disabled'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Voice System:</span>
                  <strong className="text-white">{formData.voice_enabled ? 'Enabled' : 'Disabled'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Supported Languages:</span>
                  <strong className="text-white">{formData.supported_languages.filter((l) => l.active).length} Languages</strong>
                </div>
              </div>
            </div>

            {/* Quick Safety Guideline Notice */}
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Healthcare Navigation Protocol</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {formData.assistant_name} is configured with strict safety bounds. It identifies clinical specialities and recommends verified hospital doctors, but will <strong>never</strong> provide medical diagnoses.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Multilingual Voice & Speech Configuration */}
      {activeTab === 'languages' && (
        <div className="space-y-6">
          {/* 1. Voice System Automation & Behavior Controls */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#C4A760]" />
              <span>Voice Automation & Behavior Toggles</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.auto_introduction !== false}
                  onChange={(e) => setFormData({ ...formData, auto_introduction: e.target.checked })}
                  className="mt-1 rounded accent-[#006655] w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Auto Introduction</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Automatically speak introduction when patient opens Dillo
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.voice_response_enabled !== false}
                  onChange={(e) => setFormData({ ...formData, voice_response_enabled: e.target.checked })}
                  className="mt-1 rounded accent-[#006655] w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Voice Response (TTS)</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Speak responses aloud via natural Text-to-Speech
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.auto_language_detection !== false}
                  onChange={(e) => setFormData({ ...formData, auto_language_detection: e.target.checked })}
                  className="mt-1 rounded accent-[#006655] w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Auto Language Detect</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Detect Gujarati, Hindi, or English automatically
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={formData.auto_listen_after_speak === true}
                  onChange={(e) => setFormData({ ...formData, auto_listen_after_speak: e.target.checked })}
                  className="mt-1 rounded accent-[#006655] w-4 h-4"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Continuous Voice Mode</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Auto-listen after Dillo speaks (hands-free flow)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Voice Acoustics Tuning (Speed, Pitch, Volume, Gender) */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#C4A760]" />
              <span>Voice Acoustics & Audio Tuning</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Speech Speed</span>
                  <span className="text-[#006655] font-mono">{formData.voice_speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={formData.voice_speed}
                  onChange={(e) => setFormData({ ...formData, voice_speed: parseFloat(e.target.value) })}
                  className="w-full accent-[#006655]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Slower (0.7x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Faster (1.4x)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Voice Volume</span>
                  <span className="text-[#006655] font-mono">{Math.round((formData.voice_volume ?? 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={formData.voice_volume ?? 1.0}
                  onChange={(e) => setFormData({ ...formData, voice_volume: parseFloat(e.target.value) })}
                  className="w-full accent-[#006655]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Mute (10%)</span>
                  <span>Balanced (50%)</span>
                  <span>Max (100%)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Speech Pitch</span>
                  <span className="text-[#006655] font-mono">{formData.voice_pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={formData.voice_pitch}
                  onChange={(e) => setFormData({ ...formData, voice_pitch: parseFloat(e.target.value) })}
                  className="w-full accent-[#006655]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Deeper</span>
                  <span>Natural</span>
                  <span>Higher</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Voice Gender Tone</label>
                <select
                  value={formData.voice_gender}
                  onChange={(e) => setFormData({ ...formData, voice_gender: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                >
                  <option value="female">Female Voice (Warm & Friendly)</option>
                  <option value="male">Male Voice</option>
                  <option value="neutral">Browser Standard</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Applies when multiple voices are available in browser</p>
              </div>
            </div>
          </div>

          {/* 3. Dedicated Language Voice Synthesis & Live Previews */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#C4A760]" />
                <span>Text-to-Speech Engine & Voice Preview by Language</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure dedicated natural TTS voices for Gujarati, Hindi, and English. You can preview pronunciation before saving.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* GUJARATI VOICE CARD */}
              <div className="p-5 rounded-2xl border-2 border-[#006655]/30 bg-gradient-to-b from-[#F7F4EC] to-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇮🇳</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#006655]">ગુજરાતી (Gujarati)</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                        Locale: gu-IN
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gujarati TTS Voice
                  </label>
                  <select
                    value={formData.gujarati_voice_name || ''}
                    onChange={(e) => setFormData({ ...formData, gujarati_voice_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  >
                    <option value="">Auto-Detect System Gujarati Voice (gu-IN)</option>
                    {availableVoices
                      .filter((v) => v.lang.toLowerCase().includes('gu') || v.name.toLowerCase().includes('gujarati'))
                      .map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    {availableVoices.length > 0 && (
                      <optgroup label="All System Voices">
                        {availableVoices.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 leading-relaxed font-medium">
                  "નમસ્તે! હું Dillo છું, Rhythm Medicity નો AI Assistant. તમે તમારી તકલીફ મને જણાવી શકો છો. હું તમારી કેવી રીતે મદદ કરી શકું?"
                </div>

                <button
                  type="button"
                  onClick={() => handlePreviewVoice('gu-IN')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs ${
                    previewingVoice === 'gu-IN'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-[#006655] hover:bg-[#004C3D] text-white'
                  }`}
                >
                  {previewingVoice === 'gu-IN' ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Gujarati Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>▶️ Preview Gujarati Voice (gu-IN)</span>
                    </>
                  )}
                </button>
              </div>

              {/* HINDI VOICE CARD */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-[#F7F4EC] to-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇮🇳</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#006655]">हिन्दी (Hindi)</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                        Locale: hi-IN
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hindi TTS Voice
                  </label>
                  <select
                    value={formData.hindi_voice_name || ''}
                    onChange={(e) => setFormData({ ...formData, hindi_voice_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  >
                    <option value="">Auto-Detect System Hindi Voice (hi-IN)</option>
                    {availableVoices
                      .filter((v) => v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi'))
                      .map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    {availableVoices.length > 0 && (
                      <optgroup label="All System Voices">
                        {availableVoices.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 leading-relaxed font-medium">
                  "नमस्ते! मैं Dillo हूँ, Rhythm Medicity का AI Assistant। आप अपनी समस्या मुझे बता सकते हैं। मैं आपकी कैसे मदद करूँ?"
                </div>

                <button
                  type="button"
                  onClick={() => handlePreviewVoice('hi-IN')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs ${
                    previewingVoice === 'hi-IN'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-[#006655] hover:bg-[#004C3D] text-white'
                  }`}
                >
                  {previewingVoice === 'hi-IN' ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Hindi Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>▶️ Preview Hindi Voice (hi-IN)</span>
                    </>
                  )}
                </button>
              </div>

              {/* ENGLISH VOICE CARD */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-[#F7F4EC] to-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇮🇳</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#006655]">English (India)</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                        Locale: en-IN
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    English TTS Voice
                  </label>
                  <select
                    value={formData.english_voice_name || ''}
                    onChange={(e) => setFormData({ ...formData, english_voice_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  >
                    <option value="">Auto-Detect Indian English Voice (en-IN)</option>
                    {availableVoices
                      .filter((v) => v.lang.toLowerCase().startsWith('en'))
                      .map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 leading-relaxed font-medium">
                  "Hello! I'm Dillo, the Rhythm Medicity AI Assistant. You can tell me about your concern. How can I help you today?"
                </div>

                <button
                  type="button"
                  onClick={() => handlePreviewVoice('en-IN')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs ${
                    previewingVoice === 'en-IN'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-[#006655] hover:bg-[#004C3D] text-white'
                  }`}
                >
                  {previewingVoice === 'en-IN' ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop English Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>▶️ Preview English Voice (en-IN)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 4. Supported Languages Checklist */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#C4A760]" />
                <span>Active Patient Conversation Languages</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or disable languages available in the patient dropdown.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {formData.supported_languages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    lang.active
                      ? 'border-[#006655] bg-[#E0F2ED]/40'
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{lang.nativeName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border text-slate-500 font-mono">
                        {lang.code}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{lang.name}</span>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      lang.active ? 'bg-[#006655] text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {lang.active ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Speciality & Symptom Engine */}
      {activeTab === 'specialities' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#C4A760]" />
                <span>Speciality & Symptom Mapping Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                When a patient describes symptoms (e.g. "chest pain" or "chhati ma dukhavo"), {formData.assistant_name} maps them to the correct hospital department without code changes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addSpecialityMapping}
                className="px-3.5 py-2 rounded-xl bg-[#006655] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#004C3D] transition shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Department Mapping</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                className="px-3.5 py-2 rounded-xl bg-[#C4A760] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-[#b0944e] transition shadow-xs active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Mappings</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.speciality_mappings || []).map((mapping) => (
              <div
                key={mapping.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#006655]/40 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={mapping.speciality_name}
                    onChange={(e) => {
                      const updated = (formData.speciality_mappings || []).map((m) =>
                        m.id === mapping.id ? { ...m, speciality_name: e.target.value } : m
                      );
                      const newSettings = { ...formData, speciality_mappings: updated };
                      setFormData(newSettings);
                      updateDilloSettingsInMemory(newSettings);
                    }}
                    className="font-bold text-sm text-[#006655] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#006655] focus:outline-none flex-1"
                  />

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.speciality_mappings || []).map((m) =>
                          m.id === mapping.id ? { ...m, active: !m.active } : m
                        );
                        const newSettings = { ...formData, speciality_mappings: updated };
                        setFormData(newSettings);
                        updateDilloSettingsInMemory(newSettings);
                        showToast('Speciality status updated!', 'success');
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                        mapping.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {mapping.active ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.speciality_mappings || []).filter((m) => m.id !== mapping.id);
                        const newSettings = { ...formData, speciality_mappings: updated };
                        setFormData(newSettings);
                        updateDilloSettingsInMemory(newSettings);
                        showToast('Speciality mapping deleted!', 'info');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      title="Delete Mapping"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Keyword Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(mapping.keywords || []).map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => removeSpecialityKeyword(mapping.id, kw)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new keyword input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add symptom/keyword..."
                    value={newKeywordInput[mapping.id] || ''}
                    onChange={(e) =>
                      setNewKeywordInput({ ...newKeywordInput, [mapping.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSpecialityKeyword(mapping.id);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006655]"
                  />
                  <button
                    type="button"
                    onClick={() => addSpecialityKeyword(mapping.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-[#006655] hover:text-white text-xs font-bold transition"
                  >
                    Add
                  </button>
                </div>

                {/* Suggested Doctors Selector (Admin-Controlled AI Recommendation) */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#006655] uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-[#C4A760]" />
                      <span>Suggested Doctors for Dillo</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {(mapping.suggested_doctor_ids || []).length} selected
                    </span>
                  </div>

                  {/* List of assigned doctors */}
                  {(mapping.suggested_doctor_ids || []).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {(mapping.suggested_doctor_ids || []).map((docId) => {
                        const doc = doctors.find((d) => d.id === docId);
                        if (!doc) return null;
                        return (
                          <div
                            key={docId}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                                {doc.photo_url ? (
                                  <img src={doc.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  doc.full_name?.charAt(0) || 'D'
                                )}
                              </div>
                              <span className="font-bold truncate">{doc.full_name}</span>
                              <span className="text-[10px] text-emerald-700 truncate">
                                ({doc.qualifications || 'Specialist'})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDoctorFromMapping(mapping.id, docId)}
                              className="text-emerald-700 hover:text-rose-600 font-bold px-1 text-sm"
                              title="Remove doctor from recommendation"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown to add doctor from active database */}
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={mappingDoctorSelect[mapping.id] || ''}
                      onChange={(e) =>
                        setMappingDoctorSelect({ ...mappingDoctorSelect, [mapping.id]: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006655]"
                    >
                      <option value="">+ Assign Doctor from Directory...</option>
                      {doctors
                        .filter((d) => d.show_in_dillo !== false && !(mapping.suggested_doctor_ids || []).includes(d.id))
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.full_name} ({typeof d.speciality === 'object' && d.speciality ? (d.speciality as any).name : d.speciality || 'Specialist'})
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      disabled={!mappingDoctorSelect[mapping.id]}
                      onClick={() => assignDoctorToMapping(mapping.id, mappingDoctorSelect[mapping.id])}
                      className="px-3 py-1.5 rounded-lg bg-[#006655] hover:bg-[#004C3D] disabled:opacity-40 text-white text-xs font-bold transition shadow-2xs"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Multilingual AI Knowledge Base */}
      {activeTab === 'knowledge' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C4A760]" />
                <span>Multilingual AI Knowledge Base ({formData.knowledge_base?.length || 0})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin can manually add hospital information that may not exist in normal tables. Dillo uses approved English, Hindi, and Gujarati answers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddKnowledgeModal}
                className="px-4 py-2 rounded-xl bg-[#006655] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#004C3D] shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Knowledge</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-xl bg-[#C4A760] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-[#b0944e] shadow-sm transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Knowledge</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search knowledge by question, keyword, or answer..."
                value={kbSearchTerm}
                onChange={(e) => setKbSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={kbCategoryFilter}
                onChange={(e) => setKbCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
              >
                <option value="All">All Categories</option>
                <option value="Insurance & Mediclaim">Insurance & Mediclaim</option>
                <option value="Facilities & Infrastructure">Facilities & Infrastructure</option>
                <option value="Emergency Services">Emergency Services</option>
                <option value="Hospital Guidelines">Hospital Guidelines</option>
                <option value="Diagnostics & Lab">Diagnostics & Lab</option>
                <option value="Billing & Admission">Billing & Admission</option>
                <option value="Hospital Services">Hospital Services</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Knowledge Cards Grid */}
          <div className="space-y-4">
            {(() => {
              const filtered = (formData.knowledge_base || []).filter((item) => {
                if (kbCategoryFilter !== 'All' && item.category !== kbCategoryFilter) return false;
                if (!kbSearchTerm.trim()) return true;
                const term = kbSearchTerm.toLowerCase();
                return (
                  item.title.toLowerCase().includes(term) ||
                  item.question.toLowerCase().includes(term) ||
                  item.answer.toLowerCase().includes(term) ||
                  (item.answer_en || '').toLowerCase().includes(term) ||
                  (item.answer_hi || '').toLowerCase().includes(term) ||
                  (item.answer_gu || '').toLowerCase().includes(term) ||
                  (item.keywords || []).some((kw) => kw.toLowerCase().includes(term))
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-slate-600">No knowledge items match your search.</p>
                    <button
                      type="button"
                      onClick={openAddKnowledgeModal}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006655] text-white text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Knowledge Item</span>
                    </button>
                  </div>
                );
              }

              return filtered.map((item, index) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#006655]/40 transition space-y-3.5 shadow-2xs"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Priority Controls */}
                      <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveKnowledgeItem(index, 'up')}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition"
                          title="Move Up in priority"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-700">#{index + 1}</span>
                        <button
                          type="button"
                          disabled={index === filtered.length - 1}
                          onClick={() => moveKnowledgeItem(index, 'down')}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition"
                          title="Move Down in priority"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-extrabold text-sm text-[#006655]">{item.title}</h4>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2ED] text-[#006655] border border-[#006655]/20">
                        {item.category}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.priority === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : item.priority === 'low'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.priority || 'medium'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleKnowledgeItem(item.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {item.active ? 'Active' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditKnowledgeModal(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#006655] hover:bg-slate-100 transition"
                        title="Edit Knowledge"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteKnowledgeItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                        title="Delete Knowledge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="text-xs font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[#006655] font-black mr-1.5">Q:</span>
                    {item.question}
                  </div>

                  {/* Multilingual Answers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* English */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        🇬🇧 English Answer
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {item.answer_en || item.answer}
                      </p>
                    </div>

                    {/* Hindi */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        🇮🇳 Hindi Answer
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {item.answer_hi || <span className="italic text-slate-400">English fallback used</span>}
                      </p>
                    </div>

                    {/* Gujarati */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                        🇮🇳 Gujarati Answer
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {item.answer_gu || <span className="italic text-slate-400">English fallback used</span>}
                      </p>
                    </div>
                  </div>

                  {/* Keywords Tag Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Keywords:</span>
                    {(item.keywords || []).map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: ADD / EDIT KNOWLEDGE BASE ITEM
         ───────────────────────────────────────────── */}
      {isKnowledgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#C4A760]" />
                <h3 className="text-base font-extrabold text-[#006655]">
                  {editingKnowledgeId ? 'Edit AI Knowledge Item' : 'Add AI Knowledge Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsKnowledgeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Knowledge Title *</label>
                  <input
                    type="text"
                    value={knowledgeForm.title}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
                    placeholder="e.g. Cashless Mediclaim & TPAs"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={knowledgeForm.priority || 'medium'}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  >
                    <option value="high">High (Checked First)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={knowledgeForm.category}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, category: e.target.value })}
                  placeholder="e.g. Insurance & Mediclaim"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Question *</label>
                <input
                  type="text"
                  value={knowledgeForm.question}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, question: e.target.value })}
                  placeholder="e.g. Does Rhythm Medicity provide cashless insurance services?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                />
              </div>

              {/* Multilingual Answers */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    🇬🇧 English Answer (Approved Official Hospital Response) *
                  </label>
                  <textarea
                    rows={2}
                    value={knowledgeForm.answer_en || knowledgeForm.answer}
                    onChange={(e) =>
                      setKnowledgeForm({
                        ...knowledgeForm,
                        answer_en: e.target.value,
                        answer: e.target.value,
                      })
                    }
                    placeholder="Enter the official hospital answer in English..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">
                    🇮🇳 Hindi Approved Answer (Optional, fallback to English)
                  </label>
                  <textarea
                    rows={2}
                    value={knowledgeForm.answer_hi || ''}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, answer_hi: e.target.value })}
                    placeholder="हाँ, रिदम मेडिसिटी में कैशलेस इलाज की सुविधा उपलब्ध है..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-800 mb-1">
                    🇮🇳 Gujarati Approved Answer (Optional, fallback to English)
                  </label>
                  <textarea
                    rows={2}
                    value={knowledgeForm.answer_gu || ''}
                    onChange={(e) => setKnowledgeForm({ ...knowledgeForm, answer_gu: e.target.value })}
                    placeholder="હા, રિધમ મેડિસિટીમાં કેશલેસ સારવારની સુવિધા ઉપલબ્ધ છે..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006655]"
                  />
                </div>
              </div>

              {/* Keywords Tag Manager */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Search Keywords</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Type keyword and press Enter..."
                    value={newKbKeyword}
                    onChange={(e) => setNewKbKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKnowledgeKeyword();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006655]"
                  />
                  <button
                    type="button"
                    onClick={addKnowledgeKeyword}
                    className="px-3 py-1.5 rounded-lg bg-[#006655] text-white font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(knowledgeForm.keywords || []).map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => removeKnowledgeKeyword(kw)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="kbActiveCheck"
                  checked={knowledgeForm.active !== false}
                  onChange={(e) => setKnowledgeForm({ ...knowledgeForm, active: e.target.checked })}
                  className="rounded accent-[#006655] w-4 h-4"
                />
                <label htmlFor="kbActiveCheck" className="font-bold text-slate-800">
                  Active (Immediately available to Dillo AI Assistant)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setIsKnowledgeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveKnowledgeItem}
                className="px-5 py-2 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white font-bold shadow-md"
              >
                Save Knowledge Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Quick Action Buttons */}
      {activeTab === 'actions' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#C4A760]" />
                <span>Chat Quick Action Chips</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage one-click suggestion buttons displayed at the bottom of the Dillo conversation panel. Changes are saved automatically.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addQuickAction}
                className="px-4 py-2 rounded-xl bg-[#006655] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#004C3D] shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Quick Action</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-xl bg-[#C4A760] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-[#b0944e] shadow-sm transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save All Actions</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(formData.quick_actions || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-xs text-slate-500">No quick action chips configured yet.</p>
                <button
                  type="button"
                  onClick={addQuickAction}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006655] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Quick Action</span>
                </button>
              </div>
            ) : (
              (formData.quick_actions || []).map((qa, index) => (
                <div
                  key={qa.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#006655]/40 transition space-y-3 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Order Controls */}
                      <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveQuickAction(index, 'up')}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-700">#{index + 1}</span>
                        <button
                          type="button"
                          disabled={index === (formData.quick_actions || []).length - 1}
                          onClick={() => moveQuickAction(index, 'down')}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Chip Preview Badge */}
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E0F2ED] text-[#006655] border border-[#006655]/20 flex items-center gap-1">
                        <span>{qa.label || 'Unnamed Action'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQuickAction(qa.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          qa.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {qa.active ? 'Active' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteQuickAction(qa.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        title="Delete Action"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Form fields: Label, Action Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Chip Label (Text / Emoji)
                      </label>
                      <input
                        type="text"
                        value={qa.label}
                        onChange={(e) => updateQuickAction(qa.id, { label: e.target.value })}
                        placeholder="e.g. 👨‍⚕️ Find Doctor"
                        className="w-full font-bold text-xs text-slate-800 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006655] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Action Type
                      </label>
                      <select
                        value={qa.actionType}
                        onChange={(e) =>
                          updateQuickAction(qa.id, {
                            actionType: e.target.value as any,
                          })
                        }
                        className="w-full text-xs font-bold text-slate-800 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006655] focus:bg-white focus:outline-none"
                      >
                        <option value="custom">💬 Custom Question / Prompt</option>
                        <option value="voice">🎙️ Voice Talk (Start Mic)</option>
                        <option value="find_doctor">👨‍⚕️ Find Doctor</option>
                        <option value="book_appointment">📅 Book Appointment</option>
                        <option value="departments">🏥 Medical Departments</option>
                        <option value="fees">💰 Consultation Fees</option>
                        <option value="timings">⏰ OPD & Visiting Timings</option>
                        <option value="location">📍 Hospital Location / Map</option>
                        <option value="my_appointments">📋 My Appointments</option>
                        <option value="emergency">🚨 24x7 Emergency</option>
                      </select>
                    </div>
                  </div>

                  {/* If custom, show prompt/query payload input */}
                  {qa.actionType === 'custom' && (
                    <div className="pt-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Patient Query / Prompt (Sent to Dillo when clicked)
                      </label>
                      <input
                        type="text"
                        value={qa.actionPayload || ''}
                        onChange={(e) => updateQuickAction(qa.id, { actionPayload: e.target.value })}
                        placeholder="e.g. Tell me about ambulance service and casualty admission."
                        className="w-full text-xs text-slate-700 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006655] focus:bg-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: FAQ Knowledge Management */}
      {activeTab === 'faqs' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#006655] uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#C4A760]" />
                <span>Hospital Knowledge Base & FAQs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {formData.assistant_name} consults these verified questions first when answering inquiries about visiting hours, fees, and services.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addFaq}
                className="px-3.5 py-2 rounded-xl bg-[#006655] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#004C3D] transition shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                className="px-3.5 py-2 rounded-xl bg-[#C4A760] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-[#b0944e] transition shadow-xs active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save FAQs</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(formData.faqs || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-xs text-slate-500">No FAQ knowledge base items added yet.</p>
                <button
                  type="button"
                  onClick={addFaq}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006655] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First FAQ</span>
                </button>
              </div>
            ) : (
              (formData.faqs || []).map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#006655]/40 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = (formData.faqs || []).map((f) =>
                          f.id === faq.id ? { ...f, question: e.target.value } : f
                        );
                        const newSettings = { ...formData, faqs: updated };
                        setFormData(newSettings);
                        updateDilloSettingsInMemory(newSettings);
                      }}
                      placeholder="Question..."
                      className="font-bold text-sm text-slate-900 flex-1 bg-transparent border-b border-transparent focus:border-[#006655] focus:outline-none"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          faq.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {faq.active ? 'Active' : 'Disabled'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFaq(faq.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = (formData.faqs || []).map((f) =>
                        f.id === faq.id ? { ...f, answer: e.target.value } : f
                      );
                      const newSettings = { ...formData, faqs: updated };
                      setFormData(newSettings);
                      updateDilloSettingsInMemory(newSettings);
                    }}
                    placeholder="Official answer..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006655]"
                  />

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Keywords:</span>
                    <span>{(faq.keywords || []).join(', ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
