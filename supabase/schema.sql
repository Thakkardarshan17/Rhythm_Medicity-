-- ============================================================
-- RHYTHM MEDICITY - COMPLETE PRODUCTION DATABASE SCHEMA
-- PostgreSQL / Supabase
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. SEQUENTIAL ATOMIC APPOINTMENT NUMBER
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS appointment_number_seq START WITH 1 INCREMENT BY 1;

-- Function to generate 6-digit zero-padded appointment number (e.g. 000001)
CREATE OR REPLACE FUNCTION generate_next_appointment_number()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(nextval('appointment_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. USER ROLES & PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  address TEXT,
  mobile TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 3. SPECIALITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.specialities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_specialities_status ON public.specialities(status);
CREATE INDEX IF NOT EXISTS idx_specialities_display_order ON public.specialities(display_order);

-- ============================================================
-- 4. DOCTORS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  speciality_id UUID REFERENCES public.specialities(id) ON DELETE SET NULL,
  qualification TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  bio TEXT,
  phone TEXT,
  email TEXT,
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'on_leave', 'unavailable')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  registration_number TEXT,
  languages TEXT[] DEFAULT '{}',
  clinic_room TEXT,
  consultation_duration INTEGER NOT NULL DEFAULT 15,
  available_days TEXT[] DEFAULT '{"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"}',
  available_time_start TEXT NOT NULL DEFAULT '09:00',
  available_time_end TEXT NOT NULL DEFAULT '17:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_doctors_speciality_id ON public.doctors(speciality_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON public.doctors(status);
CREATE INDEX IF NOT EXISTS idx_doctors_availability ON public.doctors(availability_status);

-- ============================================================
-- 5. SERVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON public.services(display_order);

-- ============================================================
-- 6. BANNERS (HOMEPAGE HERO CAROUSEL)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_banners_status ON public.banners(status);
CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners(display_order);

-- ============================================================
-- 7. APPOINTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number TEXT UNIQUE NOT NULL,
  patient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL CHECK (patient_gender IN ('Male', 'Female', 'Other')),
  patient_address TEXT NOT NULL,
  patient_mobile TEXT NOT NULL,
  
  speciality_id UUID REFERENCES public.specialities(id) ON DELETE RESTRICT,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE RESTRICT,
  
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  
  patient_problem TEXT NOT NULL,
  diagnosis TEXT, -- clinical note added by doctor/admin after consultation
  
  consultation_fee NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  
  terms_accepted BOOLEAN NOT NULL DEFAULT true,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  terms_version TEXT NOT NULL DEFAULT 'v1.0',
  
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  appointment_status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (appointment_status IN ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  
  payment_transaction_id TEXT,
  booking_source TEXT NOT NULL DEFAULT 'WEB',
  
  -- Preserved snapshot values for immutable historical integrity
  doctor_name_snapshot TEXT NOT NULL,
  speciality_name_snapshot TEXT NOT NULL,
  consultation_fee_snapshot NUMERIC(10, 2) NOT NULL,
  hospital_name_snapshot TEXT NOT NULL DEFAULT 'RHYTHM MEDICITY',
  hospital_address_snapshot TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_user ON public.appointments(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_status ON public.appointments(appointment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_speciality ON public.appointments(speciality_id);

-- ============================================================
-- 8. PAYMENT TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'razorpay', 'cashfree', 'phonepe', 'simulation'
  order_id TEXT NOT NULL UNIQUE,
  payment_id TEXT,
  signature TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  raw_response JSONB DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_appointment ON public.payment_transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- ============================================================
-- 9. HOSPITAL SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hospital_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name TEXT NOT NULL DEFAULT 'RHYTHM MEDICITY',
  tagline TEXT NOT NULL DEFAULT 'ONE STOP SOLUTION FOR COMPLETE CARE',
  address TEXT,
  phone TEXT,
  email TEXT,
  whatsapp_number TEXT,
  emergency_number TEXT,
  logo_url TEXT,
  stamp_url TEXT,
  website_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 10. APPOINTMENT LETTER SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.appointment_letter_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_title TEXT NOT NULL DEFAULT 'CONFIRMED APPOINTMENT SLIP',
  watermark_opacity NUMERIC(3, 2) NOT NULL DEFAULT 0.08,
  watermark_logo_url TEXT DEFAULT '/logo.png',
  watermark_type TEXT NOT NULL DEFAULT 'logo',
  show_stamp BOOLEAN NOT NULL DEFAULT true,
  authorization_text TEXT NOT NULL DEFAULT 'Authorized Medical Representative',
  footer_text TEXT NOT NULL DEFAULT 'Please arrive 15 minutes before your scheduled appointment time. Bring any previous medical records or test reports.',
  contact_information TEXT,
  terms_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- ============================================================
-- 12. ADMIN AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_admin_user ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.admin_audit_logs(entity_type, entity_id);

-- ============================================================
-- 13. ATOMIC BOOKING FUNCTION (SERVER-SIDE / RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION create_confirmed_appointment(
  p_patient_user_id UUID,
  p_patient_name TEXT,
  p_patient_age INTEGER,
  p_patient_gender TEXT,
  p_patient_address TEXT,
  p_patient_mobile TEXT,
  p_speciality_id UUID,
  p_doctor_id UUID,
  p_appointment_date DATE,
  p_appointment_time TEXT,
  p_patient_problem TEXT,
  p_provider TEXT,
  p_order_id TEXT,
  p_payment_id TEXT,
  p_signature TEXT,
  p_terms_version TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_doctor RECORD;
  v_speciality RECORD;
  v_hospital RECORD;
  v_appointment_number TEXT;
  v_appointment_id UUID;
  v_existing_tx RECORD;
BEGIN
  -- 1. Check idempotency: order_id must not already be confirmed
  SELECT * INTO v_existing_tx FROM public.payment_transactions WHERE order_id = p_order_id;
  IF FOUND AND v_existing_tx.status = 'PAID' THEN
    SELECT * INTO v_appointment_id FROM public.appointments WHERE id = v_existing_tx.appointment_id;
    RETURN jsonb_build_object('success', true, 'appointment_id', v_existing_tx.appointment_id, 'is_duplicate', true);
  END IF;

  -- 2. Verify doctor exists and is active, resolve server-side fee
  SELECT * INTO v_doctor FROM public.doctors WHERE id = p_doctor_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Doctor not found or inactive';
  END IF;

  -- 3. Verify speciality
  SELECT * INTO v_speciality FROM public.specialities WHERE id = p_speciality_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Speciality not found or inactive';
  END IF;

  -- 4. Verify doctor belongs to speciality
  IF v_doctor.speciality_id != p_speciality_id THEN
    RAISE EXCEPTION 'Doctor does not belong to selected speciality';
  END IF;

  -- 5. Fetch hospital details for snapshot
  SELECT * INTO v_hospital FROM public.hospital_settings LIMIT 1;

  -- 6. Slot conflict check
  IF EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE doctor_id = p_doctor_id 
      AND appointment_date = p_appointment_date 
      AND appointment_time = p_appointment_time 
      AND appointment_status IN ('CONFIRMED', 'PENDING_PAYMENT')
  ) THEN
    RAISE EXCEPTION 'Appointment slot % on % is already reserved', p_appointment_time, p_appointment_date;
  END IF;

  -- 7. Atomically generate sequential appointment number (000001, etc.)
  v_appointment_number := generate_next_appointment_number();

  -- 8. Insert confirmed appointment with immutable snapshot fields
  INSERT INTO public.appointments (
    appointment_number,
    patient_user_id,
    patient_name,
    patient_age,
    patient_gender,
    patient_address,
    patient_mobile,
    speciality_id,
    doctor_id,
    appointment_date,
    appointment_time,
    patient_problem,
    consultation_fee,
    currency,
    terms_accepted,
    terms_accepted_at,
    terms_version,
    payment_status,
    appointment_status,
    payment_transaction_id,
    booking_source,
    doctor_name_snapshot,
    speciality_name_snapshot,
    consultation_fee_snapshot,
    hospital_name_snapshot,
    hospital_address_snapshot
  ) VALUES (
    v_appointment_number,
    p_patient_user_id,
    p_patient_name,
    p_patient_age,
    p_patient_gender,
    p_patient_address,
    p_patient_mobile,
    p_speciality_id,
    p_doctor_id,
    p_appointment_date,
    p_appointment_time,
    p_patient_problem,
    v_doctor.consultation_fee,
    'INR',
    true,
    now(),
    COALESCE(p_terms_version, 'v1.0'),
    'PAID',
    'CONFIRMED',
    p_payment_id,
    'WEB',
    v_doctor.full_name,
    v_speciality.name,
    v_doctor.consultation_fee,
    COALESCE(v_hospital.hospital_name, 'RHYTHM MEDICITY'),
    COALESCE(v_hospital.address, '')
  ) RETURNING id INTO v_appointment_id;

  -- 9. Insert payment transaction
  INSERT INTO public.payment_transactions (
    appointment_id,
    provider,
    order_id,
    payment_id,
    signature,
    amount,
    currency,
    status,
    verified_at,
    raw_response
  ) VALUES (
    v_appointment_id,
    p_provider,
    p_order_id,
    p_payment_id,
    p_signature,
    v_doctor.consultation_fee,
    'INR',
    'PAID',
    now(),
    jsonb_build_object(
      'order_id', p_order_id,
      'payment_id', p_payment_id,
      'provider', p_provider,
      'verified', true
    )
  );

  -- 10. Create notification if user is authenticated
  IF p_patient_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      link
    ) VALUES (
      p_patient_user_id,
      'Appointment Confirmed',
      'Your appointment #' || v_appointment_number || ' with ' || v_doctor.full_name || ' on ' || p_appointment_date::TEXT || ' at ' || p_appointment_time || ' has been confirmed.',
      'success',
      '/user/appointments/' || v_appointment_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'appointment_number', v_appointment_number,
    'amount', v_doctor.consultation_fee
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_letter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- PROFILES ---
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (is_admin());

-- --- USER ROLES ---
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (is_admin());
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- --- PATIENT PROFILES ---
CREATE POLICY "Patients can read own profile" ON public.patient_profiles FOR SELECT USING (auth.uid() = auth_user_id OR is_admin());
CREATE POLICY "Patients can insert own profile" ON public.patient_profiles FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Patients can update own profile" ON public.patient_profiles FOR UPDATE USING (auth.uid() = auth_user_id OR is_admin());
CREATE POLICY "Admins can view all patient profiles" ON public.patient_profiles FOR ALL USING (is_admin());

-- --- SPECIALITIES ---
CREATE POLICY "Public can read active specialities" ON public.specialities FOR SELECT USING (status = 'active' OR is_admin());
CREATE POLICY "Admins can manage specialities" ON public.specialities FOR ALL USING (is_admin());

-- --- DOCTORS ---
CREATE POLICY "Public can read active doctors" ON public.doctors FOR SELECT USING (status = 'active' OR is_admin());
CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL USING (is_admin());

-- --- SERVICES ---
CREATE POLICY "Public can read active services" ON public.services FOR SELECT USING (status = 'active' OR is_admin());
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (is_admin());

-- --- BANNERS ---
CREATE POLICY "Public can read active banners" ON public.banners FOR SELECT USING (status = 'active' OR is_admin());
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (is_admin());

-- --- APPOINTMENTS ---
CREATE POLICY "Patients can read own appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_user_id OR is_admin());
CREATE POLICY "Public can view single appointment by ID for confirmation" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (is_admin());

-- --- PAYMENT TRANSACTIONS ---
CREATE POLICY "Patients can read own transactions" ON public.payment_transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.appointments a 
    WHERE a.id = appointment_id AND (a.patient_user_id = auth.uid() OR is_admin())
  )
);
CREATE POLICY "Admins can manage transactions" ON public.payment_transactions FOR ALL USING (is_admin());

-- --- HOSPITAL SETTINGS ---
CREATE POLICY "Public can read hospital settings" ON public.hospital_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update hospital settings" ON public.hospital_settings FOR ALL USING (is_admin());

-- --- APPOINTMENT LETTER SETTINGS ---
CREATE POLICY "Public can read letter settings" ON public.appointment_letter_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage letter settings" ON public.appointment_letter_settings FOR ALL USING (is_admin());

-- --- NOTIFICATIONS ---
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (is_admin());

-- --- ADMIN AUDIT LOGS ---
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- 15. STORAGE BUCKETS SETUP
-- ============================================================
-- Storage buckets for photos, assets, logos, banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hospital-public-assets', 'hospital-public-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('hospital-private-assets', 'hospital-private-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies for hospital-public-assets
DO $$ 
BEGIN
  -- Allow public viewing
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for hospital-public-assets') THEN
    CREATE POLICY "Public Access for hospital-public-assets" ON storage.objects FOR SELECT USING (bucket_id = 'hospital-public-assets');
  END IF;

  -- Allow public uploads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Upload for hospital-public-assets') THEN
    CREATE POLICY "Public Upload for hospital-public-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hospital-public-assets');
  END IF;

  -- Allow updates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Update for hospital-public-assets') THEN
    CREATE POLICY "Public Update for hospital-public-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'hospital-public-assets');
  END IF;
END $$;

-- ============================================================
-- 16. DYNAMIC MENUS & CMS PAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  navigation_title TEXT,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
  featured_image TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);

CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT,
  parent_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  menu_type TEXT NOT NULL DEFAULT 'internal' CHECK (menu_type IN ('internal', 'external', 'dropdown_parent')),
  icon TEXT,
  external_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON public.menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_display_order ON public.menus(display_order);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON public.menus(is_active);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Pages RLS
DROP POLICY IF EXISTS "Public can view published pages" ON public.pages;
CREATE POLICY "Public can view published pages" ON public.pages FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage all pages" ON public.pages;
CREATE POLICY "Admins can manage all pages" ON public.pages FOR ALL USING (
  auth.role() = 'authenticated' AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

-- Menus RLS
DROP POLICY IF EXISTS "Public can view active menus" ON public.menus;
CREATE POLICY "Public can view active menus" ON public.menus FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all menus" ON public.menus;
CREATE POLICY "Admins can manage all menus" ON public.menus FOR ALL USING (
  auth.role() = 'authenticated' AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

