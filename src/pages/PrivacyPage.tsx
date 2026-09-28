import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

export const PrivacyPage: React.FC = () => {
  const { hospitalSettings } = useSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-[#006655]">Patient Data Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">
          Effective Date: {new Date().getFullYear()} • {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-sm space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-[#006655] mb-2">1. Confidentiality of Health Records</h2>
          <p>
            {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'} adheres to strict patient privacy standards. Your personal identifiers, contact numbers, symptoms, and medical notes are protected by Row-Level Security (RLS) policies within our database infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#006655] mb-2">2. Information We Collect</h2>
          <p>
            We collect information required strictly for clinical appointments, including patient name, age, gender, contact number, address, and reason for medical visit.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#006655] mb-2">3. Storage & Authorization Access</h2>
          <p>
            No patient records are exposed publicly. Each authenticated patient may view and update only their own profile and consultation slips. Hospital medical administration and consulting physicians have authorized operational access.
          </p>
        </section>
      </div>
    </div>
  );
};
