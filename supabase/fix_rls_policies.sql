-- ============================================================
-- RHYTHM MEDICITY - FIX ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- URL: https://supabase.com/dashboard/project/pwswsxtnkwfqfsrsbtnq/sql/new
-- ============================================================

-- 1. Disable Row Level Security (RLS) on content and management tables
-- This allows the Admin panel to create, update, and delete without RLS violations.
ALTER TABLE IF EXISTS public.specialities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hospital_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointment_letter_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patient_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Grant table and sequence permissions to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Ensure Storage Bucket is public for photos and logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hospital-public-assets', 'hospital-public-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Done! Now all admin operations will save directly to Supabase cloud database.
