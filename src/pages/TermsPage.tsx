import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

export const TermsPage: React.FC = () => {
  const { hospitalSettings } = useSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-[#006655]">Hospital Terms & Conditions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Effective Date: {new Date().getFullYear()} • {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'}
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-sm space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-[#006655] mb-2">1. Consultation Services</h2>
          <p>
            Consultation bookings made through the {hospitalSettings.hospital_name || 'RHYTHM MEDICITY'} platform are reserved with qualified medical specialists. Patients are requested to report to the reception desk 15 minutes before the allocated consultation time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#006655] mb-2">2. Financial Integrity & Doctor Fees</h2>
          <p>
            Doctor consultation fees are resolved strictly from the hospital database at the time of order creation. All successful transactions generate an atomic, non-duplicated appointment number and a permanent financial snapshot that remains unchanged over time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#006655] mb-2">3. Cancellations & Rescheduling</h2>
          <p>
            Appointments may be cancelled or rescheduled prior to consultation time through the User Portal or by contacting hospital administration. In the event of unforeseen clinical emergency or physician unavailability, our team will coordinate with the patient for the earliest available alternate slot.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#006655] mb-2">4. Medical Records & Diagnostic Notes</h2>
          <p>
            Reason for visit documented during appointment booking is used solely for initial clinical intake. Official diagnosis notes are documented exclusively by the consulting doctor or authorized medical personnel during the appointment.
          </p>
        </section>
      </div>
    </div>
  );
};
