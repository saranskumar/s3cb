-- ==============================================
-- TOPIC & SUBJECT REFINEMENTS
-- Migration: 20260417110000
-- ==============================================

-- 1. Subject enhancements
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS exam_date DATE;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'balanced';

-- 2. Topic enhancements
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo';
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS is_weak BOOLEAN DEFAULT false;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. Topic Template enhancements
ALTER TABLE public.topic_templates ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE public.topic_templates ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. Sync name/title if missing in existing topics
UPDATE public.topics SET title = name WHERE title IS NULL;

-- 5. RPC to import topics for a subject
CREATE OR REPLACE FUNCTION public.import_subject_topics(
  p_user_id UUID,
  p_plan_id UUID,
  p_subject_id TEXT,
  p_template_subject_id TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.topics (
    id, 
    user_id, 
    plan_id, 
    subject_id, 
    name, 
    title, 
    template_topic_id,
    priority,
    sort_order
  )
  SELECT 
    t.id || '-' || p_plan_id || '-' || p_user_id,
    p_user_id,
    p_plan_id,
    p_subject_id,
    t.name,
    COALESCE(t.title, t.name),
    t.id,
    COALESCE(t.priority, 'Normal'),
    COALESCE(t.sort_order, 0)
  FROM public.topic_templates t
  WHERE t.subject_template_id = p_template_subject_id
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
