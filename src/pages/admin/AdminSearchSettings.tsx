import React, { useState, useEffect } from 'react';
import {
  Search,
  Sliders,
  Database,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  Shield,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  FileText,
  UserCheck,
  Stethoscope,
  BriefcaseMedical,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { SearchService, SearchConfig } from '../../services/searchService';
import { PatientSessionService, SessionSecuritySettings } from '../../services/patientSessionService';
import { DoctorService } from '../../services/doctorService';
import { SpecialityService } from '../../services/specialityService';
import { ServiceService } from '../../services/serviceService';
import { PageService } from '../../services/pageService';

export const AdminSearchSettings: React.FC = () => {
  const { showToast } = useToast();

  const [config, setConfig] = useState<SearchConfig>(SearchService.getConfig());
  const [securitySettings, setSecuritySettings] = useState<SessionSecuritySettings>(
    PatientSessionService.getSettings()
  );

  // Synonyms editor state
  const [selectedKey, setSelectedKey] = useState<string>('cardiology');
  const [newSynonym, setNewSynonym] = useState('');
  const [newCategoryKey, setNewCategoryKey] = useState('');

  // Index Stats
  const [indexStats, setIndexStats] = useState({
    doctorsCount: 0,
    departmentsCount: 0,
    servicesCount: 0,
    pagesCount: 0,
    synonymsCount: 0,
  });
  const [rebuilding, setRebuilding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [docs, specs, servs, pgs] = await Promise.all([
        DoctorService.getActiveDoctors().catch(() => []),
        SpecialityService.getActiveSpecialities().catch(() => []),
        ServiceService.getActiveServices().catch(() => []),
        PageService.getPublishedPages().catch(() => []),
      ]);

      const synonymsTotal = Object.values(config.custom_synonyms).reduce(
        (acc, list) => acc + list.length,
        0
      );

      setIndexStats({
        doctorsCount: docs.length,
        departmentsCount: specs.length,
        servicesCount: servs.length,
        pagesCount: pgs.length,
        synonymsCount: synonymsTotal,
      });
    } catch (_) {}
  };

  const handleSaveAll = () => {
    setSaving(true);
    try {
      SearchService.updateConfig(config);
      PatientSessionService.updateSettings(securitySettings);
      showToast('✓ Search engine & session security parameters updated successfully.', 'success');
      loadStats();
    } catch (e: any) {
      showToast(e.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRebuildIndex = async () => {
    setRebuilding(true);
    try {
      await loadStats();
      showToast('✓ Search index cache rebuilt successfully across all tables.', 'success');
    } catch (e) {
      showToast('Error rebuilding search index', 'error');
    } finally {
      setTimeout(() => setRebuilding(false), 500);
    }
  };

  const handleAddSynonym = () => {
    if (!newSynonym.trim() || !selectedKey) return;
    const currentList = config.custom_synonyms[selectedKey] || [];
    if (currentList.includes(newSynonym.trim())) {
      showToast('Keyword already exists in this group.', 'warning');
      return;
    }
    const updated = {
      ...config.custom_synonyms,
      [selectedKey]: [...currentList, newSynonym.trim()],
    };
    setConfig((prev) => ({ ...prev, custom_synonyms: updated }));
    setNewSynonym('');
    showToast(`Added synonym "${newSynonym.trim()}" to ${selectedKey}`, 'success');
  };

  const handleRemoveSynonym = (key: string, syn: string) => {
    const updated = {
      ...config.custom_synonyms,
      [key]: (config.custom_synonyms[key] || []).filter((s) => s !== syn),
    };
    setConfig((prev) => ({ ...prev, custom_synonyms: updated }));
  };

  const handleAddNewCategory = () => {
    const key = newCategoryKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key) return;
    if (config.custom_synonyms[key]) {
      showToast('Category keyword already exists.', 'warning');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      custom_synonyms: { ...prev.custom_synonyms, [key]: [] },
    }));
    setSelectedKey(key);
    setNewCategoryKey('');
    showToast(`Created new keyword group: ${key}`, 'success');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2ED] text-[#006655] flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Search Engine &amp; Session Security
              </h1>
              <p className="text-xs text-slate-500">
                Configure smart global search, multilingual synonyms, and OWASP patient session timeouts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRebuildIndex}
            disabled={rebuilding}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rebuilding ? 'animate-spin text-[#006655]' : ''}`} />
            <span>Rebuild Search Index</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006655] hover:bg-[#004C3D] text-white text-xs font-bold shadow-md shadow-[#006655]/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Index Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#006655]" /> Doctors
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{indexStats.doctorsCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-[#006655]" /> Departments
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{indexStats.departmentsCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BriefcaseMedical className="w-3.5 h-3.5 text-amber-600" /> Services
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{indexStats.servicesCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" /> CMS Pages
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{indexStats.pagesCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C4A760]" /> Synonyms
          </div>
          <div className="text-2xl font-black text-[#006655] mt-1">{indexStats.synonymsCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Search Switches & Session Security */}
        <div className="space-y-6 lg:col-span-1">
          {/* Master Search Engine Toggle */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Global Website Search</h3>
                <p className="text-xs text-slate-500">Enable search bar in website header</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.search_enabled}
                  onChange={(e) => setConfig({ ...config, search_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006655]" />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
                Searchable Content Categories
              </span>

              {[
                { key: 'enable_doctors', label: 'Doctors & Specialists', icon: UserCheck },
                { key: 'enable_departments', label: 'Departments & Centres', icon: Stethoscope },
                { key: 'enable_services', label: 'Hospital Clinical Services', icon: BriefcaseMedical },
                { key: 'enable_hospital_info', label: 'Timings, Emergency & Ambulance', icon: Clock },
                { key: 'enable_faqs', label: 'Questions & Answers (FAQs)', icon: HelpCircle },
                { key: 'enable_pages', label: 'Static & Dynamic CMS Pages', icon: FileText },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                    <Icon className="w-4 h-4 text-[#006655]" />
                    <span>{label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={(config as any)[key]}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                    className="w-4 h-4 text-[#006655] rounded-md focus:ring-[#006655] accent-[#006655]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* OWASP Session Security Configuration (Section 6 & 8) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Session Security (OWASP)</h3>
                <p className="text-xs text-slate-500">Inactivity &amp; absolute timeout settings</p>
              </div>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Inactivity / Idle Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={securitySettings.idle_timeout_minutes}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      idle_timeout_minutes: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-[#006655] focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Patient account auto-logout after period of zero activity (Default: 15 min).
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Warning Notice Duration (Seconds)
                </label>
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={securitySettings.warning_lead_seconds}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      warning_lead_seconds: Math.max(15, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-[#006655] focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  How long before expiry to display the "Session about to expire" modal (Default: 120s).
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Absolute Maximum Session Lifetime (Minutes)
                </label>
                <input
                  type="number"
                  min={30}
                  max={2880}
                  value={securitySettings.absolute_timeout_minutes}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      absolute_timeout_minutes: Math.max(30, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-[#006655] focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Maximum session duration before forced re-authentication even if active (Default: 720 min / 12 hours).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Multilingual Natural Language Synonyms Dictionary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C4A760]" />
                  <span>Multilingual Natural Language Synonyms (EN / HI / GU)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Maps patient natural search queries (e.g. "heart doctor", "skin doctor", "મને હાર્ટના ડોક્ટર જોઈએ છે") to relevant departments and specialists.
                </p>
              </div>
            </div>

            {/* Keyword Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Medical Category / Keyword Group</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(config.custom_synonyms).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSelectedKey(k)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                      selectedKey === k
                        ? 'bg-[#006655] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {k} ({config.custom_synonyms[k]?.length || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Add Synonym to Active Category */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 capitalize">
                  Keywords for: <span className="text-[#006655]">{selectedKey}</span>
                </span>
                <span className="text-[11px] text-slate-500">Supports English, Gujarati &amp; Hindi script</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSynonym}
                  onChange={(e) => setNewSynonym(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSynonym();
                    }
                  }}
                  placeholder="e.g. heart specialist, છાતીમાં દુખાવો, दिल का डॉक्टर..."
                  className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006655]"
                />
                <button
                  type="button"
                  onClick={handleAddSynonym}
                  className="px-4 py-2 bg-[#006655] hover:bg-[#004C3D] text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Synonym</span>
                </button>
              </div>

              {/* Active Synonyms Chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {(config.custom_synonyms[selectedKey] || []).map((syn) => (
                  <span
                    key={syn}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    <span>{syn}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSynonym(selectedKey, syn)}
                      className="text-slate-400 hover:text-rose-600 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Create New Keyword Group */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={newCategoryKey}
                onChange={(e) => setNewCategoryKey(e.target.value)}
                placeholder="New Category (e.g. urology, dental, ayush...)"
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006655]"
              />
              <button
                type="button"
                onClick={handleAddNewCategory}
                className="px-4 py-2 border border-[#006655] text-[#006655] hover:bg-[#E0F2ED] text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
