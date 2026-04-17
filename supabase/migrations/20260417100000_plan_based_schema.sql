-- ==============================================
-- PLAN-BASED STUDY PLANNER SCHEMA
-- Migration: 20260417100000
-- ==============================================

-- 1. Add plan support to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_plan_id TEXT;

-- 2. Plan Templates (public library)
CREATE TABLE IF NOT EXISTS public.plan_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Plan templates readable by all" ON public.plan_templates;
CREATE POLICY "Plan templates readable by all" ON public.plan_templates FOR SELECT USING (is_public = true);

-- 3. User Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_template_id UUID REFERENCES public.plan_templates(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own plans" ON public.plans;
CREATE POLICY "Users manage own plans" ON public.plans FOR ALL USING (auth.uid() = user_id);

-- 4. Add plan_id to subjects (safe, nullable so existing rows still work)
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS template_subject_id TEXT;

-- 5. Add plan_id and new fields to topics
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS title TEXT; -- friendly alias for 'name'
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS assigned_date DATE;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS template_topic_id TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Add plan_id and topic_id linkage to study_plan
ALTER TABLE public.study_plan ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE;
ALTER TABLE public.study_plan ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. Reminder Settings
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own reminders" ON public.reminder_settings;
CREATE POLICY "Users manage own reminders" ON public.reminder_settings FOR ALL USING (auth.uid() = user_id);

-- 8. Seed initial plan templates
INSERT INTO public.plan_templates (title, description, is_public) VALUES
  ('S4 Exam Prep', 'Semester 4 university exam preparation plan', true),
  ('CAT Prep', 'MBA entrance exam preparation plan', true),
  ('Placement Prep', 'Campus placement and interviews preparation', true),
  ('Semester Finals', 'End-of-semester final exams', true),
  ('Custom Plan', 'Build your own study plan from scratch', true)
ON CONFLICT DO NOTHING;

-- 9. Update subject_templates: add plan_template_id link
ALTER TABLE public.subject_templates ADD COLUMN IF NOT EXISTS plan_template_id UUID REFERENCES public.plan_templates(id);
ALTER TABLE public.subject_templates ADD COLUMN IF NOT EXISTS description TEXT;

-- 10. Update topic_templates: add title alias
ALTER TABLE public.topic_templates ADD COLUMN IF NOT EXISTS title TEXT;
-- Sync title from name where missing
UPDATE public.topic_templates SET title = name WHERE title IS NULL;

-- 11. Function: create plan from template
CREATE OR REPLACE FUNCTION public.create_plan_from_template(
  p_user_id UUID,
  p_template_id UUID,
  p_title TEXT
) RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO public.plans (user_id, title, source_template_id)
  VALUES (p_user_id, p_title, p_template_id)
  RETURNING id INTO v_plan_id;
  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function: copy subject template to user plan
CREATE OR REPLACE FUNCTION public.import_subject_to_plan(
  p_user_id UUID,
  p_plan_id UUID,
  p_template_id TEXT
) RETURNS TEXT AS $$
DECLARE
  v_subject_id TEXT;
  v_template public.subject_templates%ROWTYPE;
BEGIN
  SELECT * INTO v_template FROM public.subject_templates WHERE id = p_template_id;
  v_subject_id := p_template_id || '-' || p_plan_id || '-' || p_user_id;
  
  INSERT INTO public.subjects (id, user_id, plan_id, name, template_subject_id)
  VALUES (v_subject_id, p_user_id, p_plan_id, v_template.name, p_template_id)
  ON CONFLICT DO NOTHING;
  
  RETURN v_subject_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
