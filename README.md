# RHYTHM MEDICITY

> **ONE STOP SOLUTION FOR COMPLETE CARE**

A complete, production-ready, responsive hospital web application and appointment management platform.

---

## 🌟 Architecture & Highlights

- **Public Hospital Website**:
  - Animated Splash Screen with heartbeat pulse, ECG waveform, and hospital branding.
  - Interactive Header with responsive Drawer, Smart Debounced Search over live doctors, specialities, and services.
  - Homepage Hero Carousel with admin controls (upload, reorder, link, activate/deactivate).
  - Clean Medical Specialities & Doctor Directory with speciality filtering.
  - Comprehensive Doctor Profiles with OPD timings, consultation fees, and qualifications.
  - Hospital Services & Emergency Contact information driven dynamically from database settings.
  - Zero Dummy Data: starts operationally empty with elegant empty states.

- **Patient Consultation Booking Flow**:
  - **Step 1**: Patient Information (Name, Age, Gender, Address, Mobile).
  - **Step 2**: Appointment Details (Speciality, Doctor dynamically filtered, Date, Slot, Reason for visit).
  - **Step 3**: Terms & Conditions Acceptance Checkbox (strictly enforced before payment).
  - **Server-Side Fee Resolution**: Doctor consultation fee is resolved server-side from PostgreSQL.
  - **Cryptographic Payment Verification**: Verifies gateway signature before creating the appointment.
  - **Atomic Sequential Appointment Number**: Starts from `1` and formats as `000001`, `000002`... via PostgreSQL sequence (`appointment_number_seq`) without duplicates.
  - **Animated Payment Success**: Checkmark animation, pulse, and confetti.
  - **Official A5 Appointment Letter**:
    - A5 Portrait format.
    - Hospital Logo & Header.
    - Subtle background logo watermark with configurable opacity.
    - Patient and Doctor snapshot data (preserves historical accuracy).
    - Distinct Reason for Visit and Clinical Diagnosis Note.
    - Official Hospital Stamp with "Authorized Medical Representative".
    - Verification QR code.
    - Direct PDF Download, Browser Print, and WhatsApp sharing.

- **User / Patient Portal (`/user`)**:
  - Live statistics: Total Appointments, Upcoming Visits, Completed Visits.
  - My Appointments list with status badges and instant A5 slip view.
  - Patient Profile management.

- **Admin Operational Console (`/admin`)**:
  - Live dashboard with real-time counters and Supabase Realtime sync.
  - Doctor Management: Add, edit, delete, activate/deactivate, consultation fee, and photo upload to Supabase Storage.
  - Speciality Management: Add, edit, delete, display order.
  - Service Management: Clinical facilities and departments.
  - Appointment Management: Filter by date, doctor, speciality, status; update clinical notes / physician diagnosis; cancel appointments.
  - Patient Management: Registry with total consultation counts.
  - Hero Carousel Banners: Upload, reorder, preview, activate/deactivate.
  - Payment Transactions Log: Gateway order IDs, payment IDs, verification timestamps.
  - Hospital Settings: Name, tagline, address, phone, email, WhatsApp, emergency number, logo & stamp upload.
  - Appointment Letter Settings: Live A5 preview, watermark opacity slider, authorization text, footer instructions.
  - Reports: Consultations by doctor, by speciality, and revenue totals.
  - Operational Audit Logs: Administrative action trail.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Framer Motion, React Hook Form, Zod.
- **Document & PDF**: `jspdf`, `html2canvas`, `qrcode.react`, `canvas-confetti`.
- **Backend / Database**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage, Supabase Realtime, Edge Functions).
- **Security**: PostgreSQL Row Level Security (RLS) on all tables, server-side fee validation, and cryptographic payment verification.

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone <repository_url>
cd Rhythm_Medicity
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your Supabase public credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Supabase Database Setup
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the script provided in `supabase/schema.sql`.
   - Creates the `appointment_number_seq` starting at 1.
   - Creates tables: `profiles`, `user_roles`, `patient_profiles`, `specialities`, `doctors`, `services`, `banners`, `appointments`, `payment_transactions`, `hospital_settings`, `appointment_letter_settings`, `notifications`, `admin_audit_logs`.
   - Creates the atomic booking RPC function `create_confirmed_appointment`.
   - Enables Row Level Security (RLS) policies on every table.
3. In **Storage**, create two buckets:
   - `hospital-public-assets` (Public: Yes) - For doctor photos, banners, and logo.
   - `hospital-private-assets` (Public: No) - For official hospital stamps.

### 4. Admin Account Creation
In Supabase Dashboard -> **Authentication** -> **Users**:
1. Create a user (e.g. `admin@rhythmmedicity.com` with a secure password).
2. In SQL Editor, assign the `admin` role:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<USER_UUID>', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

UPDATE public.profiles
SET role = 'admin'
WHERE id = '<USER_UUID>';
```

### 5. Running the Application
```bash
# Start local development server
npm run dev

# Build for production deployment
npm run build

# Preview production bundle
npm run preview
```

---

## 🔒 Security Principles

1. **No Frontend Secrets**: Private payment secrets, WhatsApp tokens, and Supabase service role keys are strictly kept inside Supabase Edge Functions / server environment.
2. **Server-Side Fee Resolution**: The frontend never determines the payable consultation fee.
3. **Atomic Sequential Numbers**: Appointment numbers (`000001`, `000002`...) are generated exclusively by the PostgreSQL sequence in a transactional RPC call.
4. **Row-Level Security**: Patients can only access their own appointments and profiles. Admin roles are enforced at the database level.
5. **Snapshot Preservation**: Confirmed appointments retain an immutable snapshot of doctor name, speciality, hospital address, and fee paid at the moment of booking.
