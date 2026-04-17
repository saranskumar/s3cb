-- ==============================================
-- S4 FOCUSED REFACTOR
-- Migration: 20260417120000
-- ==============================================

-- 1. Ensure subject_templates has exam_date column
ALTER TABLE public.subject_templates ADD COLUMN IF NOT EXISTS exam_date DATE;
ALTER TABLE public.subject_templates ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Set exam dates on subject templates
UPDATE public.subject_templates SET exam_date = '2026-04-27', sort_order = 1 WHERE id = 'maths';
UPDATE public.subject_templates SET exam_date = '2026-04-29', sort_order = 2 WHERE id = 'ai';
UPDATE public.subject_templates SET exam_date = '2026-05-04', sort_order = 3 WHERE id = 'os';
UPDATE public.subject_templates SET exam_date = '2026-05-07', sort_order = 4 WHERE id = 'dbms';
UPDATE public.subject_templates SET exam_date = '2026-05-11', sort_order = 5 WHERE id = 'adsa';
UPDATE public.subject_templates SET exam_date = '2026-05-14', sort_order = 6 WHERE id = 'economics';

-- 3. Ensure module_templates has sort_order
ALTER TABLE public.module_templates ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
UPDATE public.module_templates SET sort_order = module_no WHERE sort_order = 0;

-- 4. Ensure topic_templates references module correctly
ALTER TABLE public.topic_templates ADD COLUMN IF NOT EXISTS title TEXT;
UPDATE public.topic_templates SET title = name WHERE title IS NULL;

-- 5. Ensure plans table exists (from previous migration) and add missing columns
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_s4 BOOLEAN DEFAULT false;

-- 6. Ensure subjects has all needed columns
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS template_subject_id TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 7. Ensure modules table has plan_id and template references  
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS template_module_id TEXT;

-- 8. Ensure topics has all needed columns
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS template_topic_id TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS assigned_date DATE;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS completed_date DATE;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS notes TEXT;
UPDATE public.topics SET title = name WHERE title IS NULL;

-- 9. Ensure study_plan has plan_id and module_id
ALTER TABLE public.study_plan ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
ALTER TABLE public.study_plan ADD COLUMN IF NOT EXISTS module_id TEXT;
ALTER TABLE public.study_plan ADD COLUMN IF NOT EXISTS notes TEXT;

-- 10. Profiles: ensure active_plan_id column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- 11. UPDATED apply_s4_seed: now creates a plan, sets exam dates, and uses plan_id
-- Must drop first since return type changed from VOID to UUID
DROP FUNCTION IF EXISTS public.apply_s4_seed(UUID);
CREATE OR REPLACE FUNCTION public.apply_s4_seed(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Create the S4 plan for this user
  INSERT INTO public.plans (user_id, title, description, is_s4)
  VALUES (target_user_id, 'S4 Exam Prep', 'Semester 4 university exam preparation', true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_plan_id;

  -- If already exists (conflict), get the existing plan id
  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id FROM public.plans
    WHERE user_id = target_user_id AND is_s4 = true
    LIMIT 1;
  END IF;

  -- Insert Subjects (with exam dates and plan_id)
  INSERT INTO public.subjects (id, user_id, plan_id, name, code, exam_date, internal_scored, internal_total, external_total, target_total, priority, focus, template_subject_id, sort_order)
  SELECT
    st.id || '-' || target_user_id,
    target_user_id,
    v_plan_id,
    st.name,
    st.code,
    st.exam_date,
    st.internal_scored,
    st.internal_total,
    st.external_total,
    st.target_total,
    st.priority,
    st.focus,
    st.id,
    COALESCE(st.sort_order, 0)
  FROM public.subject_templates st
  ON CONFLICT DO NOTHING;

  -- Insert Modules (with plan_id)
  INSERT INTO public.modules (id, user_id, plan_id, subject_id, title, module_no, template_module_id)
  SELECT
    mt.id || '-' || target_user_id,
    target_user_id,
    v_plan_id,
    mt.subject_id || '-' || target_user_id,
    mt.title,
    mt.module_no,
    mt.id
  FROM public.module_templates mt
  ON CONFLICT DO NOTHING;

  -- Insert Topics (with plan_id and title)
  INSERT INTO public.topics (id, user_id, plan_id, subject_id, module_id, name, title, priority, sort_order, template_topic_id)
  SELECT
    tt.id || '-' || target_user_id,
    target_user_id,
    v_plan_id,
    tt.subject_id || '-' || target_user_id,
    tt.module_id || '-' || target_user_id,
    tt.name,
    COALESCE(tt.title, tt.name),
    tt.priority,
    tt.sort_order,
    tt.id
  FROM public.topic_templates tt
  ON CONFLICT DO NOTHING;

  -- Update profile: mark onboarded, set active plan
  UPDATE public.profiles
  SET is_onboarded = true, active_plan_id = v_plan_id
  WHERE id = target_user_id;

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 12. complete_custom_onboarding: creates blank plan, marks onboarded
-- Must drop first since return type changed from VOID to UUID
DROP FUNCTION IF EXISTS public.complete_custom_onboarding(UUID);
CREATE OR REPLACE FUNCTION public.complete_custom_onboarding(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO public.plans (user_id, title, description, is_s4)
  VALUES (target_user_id, 'My Study Plan', 'Custom study plan', false)
  RETURNING id INTO v_plan_id;

  UPDATE public.profiles
  SET is_onboarded = true, active_plan_id = v_plan_id
  WHERE id = target_user_id;

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 13. RLS: ensure plans table has proper policies
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own plans" ON public.plans;
CREATE POLICY "Users manage own plans" ON public.plans FOR ALL USING (auth.uid() = user_id);
