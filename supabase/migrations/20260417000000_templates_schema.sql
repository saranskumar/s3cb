-- ==============================================
-- DATABASE SCHEMA UPDATE: Seeded Templates & Onboarding
-- ==============================================

-- 1. Add Onboarding Flag to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT false;

-- 2. Template Tables (Globally readable, separated from user data)

CREATE TABLE public.subject_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  internal_scored NUMERIC DEFAULT 0,
  internal_total NUMERIC DEFAULT 40,
  external_total NUMERIC DEFAULT 60,
  target_total NUMERIC DEFAULT 70,
  priority TEXT DEFAULT 'medium',
  focus TEXT
);
ALTER TABLE public.subject_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are readable by everyone" ON public.subject_templates FOR SELECT USING (true);


CREATE TABLE public.module_templates (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subject_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  module_no INTEGER
);
ALTER TABLE public.module_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are readable by everyone" ON public.module_templates FOR SELECT USING (true);


CREATE TABLE public.topic_templates (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subject_templates(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.module_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.topic_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are readable by everyone" ON public.topic_templates FOR SELECT USING (true);

-- 3. Procedure: Duplicate Templates to User's Scope
-- This safely clones all templates using a composite ID approach (template_id-user_id) 
-- to ensure they remain unique but retain relational hierarchy.

CREATE OR REPLACE FUNCTION public.apply_s4_seed(target_user_id UUID) 
RETURNS VOID AS $$
BEGIN
  -- Insert Subjects
  INSERT INTO public.subjects (id, user_id, name, code, internal_scored, internal_total, external_total, target_total, priority, focus)
  SELECT 
    id || '-' || target_user_id, 
    target_user_id, 
    name, 
    code, 
    internal_scored, 
    internal_total, 
    external_total, 
    target_total, 
    priority, 
    focus
  FROM public.subject_templates
  ON CONFLICT DO NOTHING;

  -- Insert Modules
  INSERT INTO public.modules (id, user_id, subject_id, title, module_no)
  SELECT 
    id || '-' || target_user_id, 
    target_user_id, 
    subject_id || '-' || target_user_id, 
    title, 
    module_no
  FROM public.module_templates
  ON CONFLICT DO NOTHING;

  -- Insert Topics
  INSERT INTO public.topics (id, user_id, subject_id, module_id, name, priority, sort_order)
  SELECT 
    id || '-' || target_user_id, 
    target_user_id, 
    subject_id || '-' || target_user_id, 
    module_id || '-' || target_user_id, 
    name, 
    priority, 
    sort_order
  FROM public.topic_templates
  ON CONFLICT DO NOTHING;

  -- Mark profile as onboarded
  UPDATE public.profiles SET is_onboarded = true WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Procedure: Handle Custom Onboarding Finish
CREATE OR REPLACE FUNCTION public.complete_custom_onboarding(target_user_id UUID) 
RETURNS VOID AS $$
BEGIN
  -- Mark profile as onboarded without copying any templates
  UPDATE public.profiles SET is_onboarded = true WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
