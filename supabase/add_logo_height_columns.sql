-- =========================================================================
-- RHYTHM MEDICITY: ADD LOGO_HEIGHT COLUMN TO SETTINGS TABLES
-- Allows controlling official website navbar logo display size from Admin
-- =========================================================================

-- 1. Add logo_height to website_ui_settings
ALTER TABLE IF EXISTS website_ui_settings 
  ADD COLUMN IF NOT EXISTS logo_height INTEGER DEFAULT 48;

-- 2. Add logo_height to hospital_settings
ALTER TABLE IF EXISTS hospital_settings 
  ADD COLUMN IF NOT EXISTS logo_height INTEGER DEFAULT 48;

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
