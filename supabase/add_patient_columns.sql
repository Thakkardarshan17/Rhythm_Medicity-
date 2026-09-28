-- =========================================================================
-- RHYTHM MEDICITY: ADD MISSING COLUMNS TO PATIENT_PROFILES & PROFILES
-- Fixes: Schema cache error for 'dob', 'photo_url', 'status', 'login_count'
-- =========================================================================

-- 1. Add columns to patient_profiles table
ALTER TABLE IF EXISTS patient_profiles 
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add columns to profiles table
ALTER TABLE IF EXISTS profiles 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ensure RLS policies permit authenticated users to read/update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'patient_profiles' AND policyname = 'patient_profiles_manage_own'
  ) THEN
    CREATE POLICY patient_profiles_manage_own ON patient_profiles
      FOR ALL USING (auth.uid() = auth_user_id)
      WITH CHECK (auth.uid() = auth_user_id);
  END IF;
END $$;

-- 4. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
