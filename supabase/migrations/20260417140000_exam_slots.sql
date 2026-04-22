-- ===============================================
-- EXAM SLOTS
-- Migration: 20260417140000
-- ===============================================

-- 1. Plan template slots (the S4 timetable, public/readable)
CREATE TABLE IF NOT EXISTS public.plan_template_slots (
  id TEXT PRIMARY KEY,
  plan_template_id UUID REFERENCES public.plan_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,               -- e.g. "Slot 1"
  exam_date DATE,
  subject_template_id TEXT REFERENCES public.subject_templates(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.plan_template_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Template slots readable by all" ON public.plan_template_slots;
CREATE POLICY "Template slots readable by all" ON public.plan_template_slots FOR SELECT USING (true);

-- 2. User-owned exam slots (private, editable)
CREATE TABLE IF NOT EXISTS public.exam_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,               -- e.g. "Slot 1"
  exam_date DATE,
  subject_id TEXT,                   -- loose ref to subjects.id (composite PK so no FK)
  subject_name TEXT,                 -- denormalised for quick display
  sort_order INTEGER DEFAULT 0,
  template_slot_id TEXT REFERENCES public.plan_template_slots(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.exam_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own exam slots" ON public.exam_slots;
CREATE POLICY "Users manage own exam slots" ON public.exam_slots FOR ALL USING (auth.uid() = user_id);

-- 3. Seed the S4 plan_template_slots
-- First, get the S4 plan template id (seeded earlier)
DO $$
DECLARE
  v_s4_template_id UUID;
BEGIN
  SELECT id INTO v_s4_template_id FROM public.plan_templates WHERE title = 'S4 Exam Prep' LIMIT 1;
  IF v_s4_template_id IS NOT NULL THEN
    INSERT INTO public.plan_template_slots (id, plan_template_id, label, exam_date, subject_template_id, sort_order) VALUES
      ('s4-slot-maths',     v_s4_template_id, 'Mathematics',        '2026-04-27', 'maths',     1),
      ('s4-slot-ai',        v_s4_template_id, 'Artificial Intelligence', '2026-04-29', 'ai',    2),
      ('s4-slot-os',        v_s4_template_id, 'Operating Systems',  '2026-05-04', 'os',        3),
      ('s4-slot-dbms',      v_s4_template_id, 'DBMS',               '2026-05-07', 'dbms',      4),
      ('s4-slot-adsa',      v_s4_template_id, 'ADSA',               '2026-05-11', 'adsa',      5),
      ('s4-slot-economics', v_s4_template_id, 'Economics',          '2026-05-14', 'economics', 6)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 4. Updated apply_s4_seed: creates plan + exam slots + auto-attaches S4 subjects
DROP FUNCTION IF EXISTS public.apply_s4_seed(UUID);
CREATE OR REPLACE FUNCTION public.apply_s4_seed(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
  v_subject_id TEXT;
  slot RECORD;
BEGIN
  -- a) Create the S4 plan
  INSERT INTO public.plans (user_id, title, description, is_s4)
  VALUES (target_user_id, 'S4 Exam Prep', 'Semester 4 university exam preparation', true)
  RETURNING id INTO v_plan_id;

  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id FROM public.plans
    WHERE user_id = target_user_id AND is_s4 = true LIMIT 1;
  END IF;

  -- b) For each S4 slot, create exam_slot + subject + modules + topics
  FOR slot IN
    SELECT pts.*, st.name AS sub_name, st.code, st.internal_scored,
           st.internal_total, st.external_total, st.target_total, st.priority, st.focus
    FROM public.plan_template_slots pts
    JOIN public.subject_templates st ON st.id = pts.subject_template_id
    WHERE pts.plan_template_id = (SELECT id FROM public.plan_templates WHERE title = 'S4 Exam Prep' LIMIT 1)
    ORDER BY pts.sort_order
  LOOP
    -- Derive deterministic subject id
    v_subject_id := slot.subject_template_id || '-' || target_user_id;

    -- Insert subject
    INSERT INTO public.subjects (
      id, user_id, plan_id, name, code, exam_date,
      internal_scored, internal_total, external_total, target_total,
      priority, focus, template_subject_id, sort_order
    ) VALUES (
      v_subject_id, target_user_id, v_plan_id,
      slot.sub_name, slot.code, slot.exam_date,
      slot.internal_scored, slot.internal_total, slot.external_total, slot.target_total,
      slot.priority, slot.focus, slot.subject_template_id, slot.sort_order
    ) ON CONFLICT DO NOTHING;

    -- Insert exam slot
    INSERT INTO public.exam_slots (
      user_id, plan_id, label, exam_date, subject_id, subject_name, sort_order, template_slot_id
    ) VALUES (
      target_user_id, v_plan_id,
      slot.label, slot.exam_date, v_subject_id, slot.sub_name, slot.sort_order, slot.id
    ) ON CONFLICT DO NOTHING;

    -- Insert modules for this subject
    INSERT INTO public.modules (id, user_id, plan_id, subject_id, title, module_no, template_module_id)
    SELECT
      mt.id || '-' || target_user_id,
      target_user_id, v_plan_id,
      v_subject_id, mt.title, mt.module_no, mt.id
    FROM public.module_templates mt
    WHERE mt.subject_id = slot.subject_template_id
    ON CONFLICT DO NOTHING;

    -- Insert topics for this subject
    INSERT INTO public.topics (id, user_id, plan_id, subject_id, module_id, name, title, priority, sort_order, template_topic_id)
    SELECT
      tt.id || '-' || target_user_id,
      target_user_id, v_plan_id,
      v_subject_id,
      tt.module_id || '-' || target_user_id,
      tt.name, COALESCE(tt.title, tt.name),
      tt.priority, tt.sort_order, tt.id
    FROM public.topic_templates tt
    WHERE tt.subject_id = slot.subject_template_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- c) Mark profile as onboarded
  UPDATE public.profiles
  SET is_onboarded = true, active_plan_id = v_plan_id
  WHERE id = target_user_id;

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: attach an existing subject template to a plan slot (for PlanSetupView swapping)
CREATE OR REPLACE FUNCTION public.attach_subject_to_slot(
  p_user_id UUID,
  p_plan_id UUID,
  p_slot_id UUID,
  p_subject_template_id TEXT
) RETURNS TEXT AS $$
DECLARE
  v_subject_id TEXT;
  v_tmpl public.subject_templates%ROWTYPE;
BEGIN
  SELECT * INTO v_tmpl FROM public.subject_templates WHERE id = p_subject_template_id;
  v_subject_id := p_subject_template_id || '-' || p_user_id;

  -- Upsert subject
  INSERT INTO public.subjects (id, user_id, plan_id, name, code, exam_date, internal_scored, internal_total, external_total, target_total, priority, focus, template_subject_id)
  VALUES (v_subject_id, p_user_id, p_plan_id, v_tmpl.name, v_tmpl.code, v_tmpl.exam_date, v_tmpl.internal_scored, v_tmpl.internal_total, v_tmpl.external_total, v_tmpl.target_total, v_tmpl.priority, v_tmpl.focus, p_subject_template_id)
  ON CONFLICT DO NOTHING;

  -- Copy modules
  INSERT INTO public.modules (id, user_id, plan_id, subject_id, title, module_no, template_module_id)
  SELECT mt.id || '-' || p_user_id, p_user_id, p_plan_id, v_subject_id, mt.title, mt.module_no, mt.id
  FROM public.module_templates mt WHERE mt.subject_id = p_subject_template_id
  ON CONFLICT DO NOTHING;

  -- Copy topics
  INSERT INTO public.topics (id, user_id, plan_id, subject_id, module_id, name, title, priority, sort_order, template_topic_id)
  SELECT tt.id || '-' || p_user_id, p_user_id, p_plan_id, v_subject_id, tt.module_id || '-' || p_user_id, tt.name, COALESCE(tt.title, tt.name), tt.priority, tt.sort_order, tt.id
  FROM public.topic_templates tt WHERE tt.subject_id = p_subject_template_id
  ON CONFLICT DO NOTHING;

  -- Update slot
  UPDATE public.exam_slots
  SET subject_id = v_subject_id, subject_name = v_tmpl.name
  WHERE id = p_slot_id AND user_id = p_user_id;

  RETURN v_subject_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
