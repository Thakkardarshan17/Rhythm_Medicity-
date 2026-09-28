-- ============================================================
-- RHYTHM MEDICITY - DROPDOWN & MASTER DATA MANAGEMENT SCHEMA
-- ============================================================

-- 1. Create Dropdown Categories Table
CREATE TABLE IF NOT EXISTS public.dropdown_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  "group" TEXT NOT NULL DEFAULT 'Custom Categories',
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dropdown_categories_key ON public.dropdown_categories(category_key);
CREATE INDEX IF NOT EXISTS idx_dropdown_categories_group ON public.dropdown_categories("group");
CREATE INDEX IF NOT EXISTS idx_dropdown_categories_order ON public.dropdown_categories(display_order);

-- 2. Create Dropdown Options Table
CREATE TABLE IF NOT EXISTS public.dropdown_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key TEXT NOT NULL REFERENCES public.dropdown_categories(category_key) ON DELETE CASCADE ON UPDATE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_default BOOLEAN DEFAULT false,
  extra_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dropdown_options_cat_key ON public.dropdown_options(category_key);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_status ON public.dropdown_options(status);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_order ON public.dropdown_options(display_order);

-- 3. Row Level Security Policies
ALTER TABLE public.dropdown_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;

-- Helper check for admin (if not already defined)
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

-- Everyone (public, patients, doctors) can read active categories and active options
CREATE POLICY "Public can read dropdown categories" ON public.dropdown_categories FOR SELECT USING (true);
CREATE POLICY "Public can read dropdown options" ON public.dropdown_options FOR SELECT USING (true);

-- Only Admins can insert, update, delete dropdown categories and options
CREATE POLICY "Admins can manage dropdown categories" ON public.dropdown_categories FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage dropdown options" ON public.dropdown_options FOR ALL USING (is_admin());

-- 4. Enable Supabase Realtime Publication for instant UI sync
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dropdown_categories;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dropdown_options;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
