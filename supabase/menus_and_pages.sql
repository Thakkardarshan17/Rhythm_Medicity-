-- ============================================================
-- RHYTHM MEDICITY - DYNAMIC MENUS & PAGES SCHEMA & POLICIES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PAGES TABLE
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

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);

-- 2. MENUS TABLE
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

-- Index for fast menu tree rendering
CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON public.menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_display_order ON public.menus(display_order);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON public.menus(is_active);

-- 3. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pages_updated_at ON public.pages;
CREATE TRIGGER trigger_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trigger_menus_updated_at ON public.menus;
CREATE TRIGGER trigger_menus_updated_at
  BEFORE UPDATE ON public.menus
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Pages Policies
DROP POLICY IF EXISTS "Public can view published pages" ON public.pages;
CREATE POLICY "Public can view published pages"
  ON public.pages FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage all pages" ON public.pages;
CREATE POLICY "Admins can manage all pages"
  ON public.pages FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

-- Menus Policies
DROP POLICY IF EXISTS "Public can view active menus" ON public.menus;
CREATE POLICY "Public can view active menus"
  ON public.menus FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all menus" ON public.menus;
CREATE POLICY "Admins can manage all menus"
  ON public.menus FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );
