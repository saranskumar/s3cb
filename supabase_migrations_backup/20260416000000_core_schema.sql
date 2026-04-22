-- 1. Profiles (with Leaderboard features)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  active_plan_id UUID,
  is_onboarded BOOLEAN DEFAULT false,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  show_on_leaderboard BOOLEAN DEFAULT false
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Plan Templates
CREATE TABLE IF NOT EXISTS public.plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  is_s4 BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plan templates are readable by everyone" ON public.plan_templates FOR SELECT USING (true);


-- 3. Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_s4 BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plans" ON public.plans FOR ALL USING (auth.uid() = user_id);


-- 4. Subject Templates
CREATE TABLE public.subject_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  exam_date DATE,
  priority TEXT DEFAULT 'medium',
  focus TEXT,
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.subject_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are readable by everyone" ON public.subject_templates FOR SELECT USING (true);


-- 5. Plan Template Slots
CREATE TABLE IF NOT EXISTS public.plan_template_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_template_id UUID REFERENCES public.plan_templates(id) ON DELETE CASCADE NOT NULL,
  subject_template_id TEXT REFERENCES public.subject_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  exam_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.plan_template_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plan template slots are readable by everyone" ON public.plan_template_slots FOR SELECT USING (true);


-- 6. Subjects
CREATE TABLE public.subjects (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  template_subject_id TEXT REFERENCES public.subject_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  exam_date DATE,
  priority TEXT DEFAULT 'medium',
  focus TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subjects" ON public.subjects FOR ALL USING (auth.uid() = user_id);


-- 7. Exam Slots 
CREATE TABLE IF NOT EXISTS public.exam_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  template_slot_id UUID REFERENCES public.plan_template_slots(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  exam_date DATE,
  subject_id TEXT,
  subject_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.exam_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exam slots" ON public.exam_slots FOR ALL USING (auth.uid() = user_id);


-- 8. Module Templates
CREATE TABLE public.module_templates (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES public.subject_templates(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  module_no INTEGER,
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.module_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are readable by everyone" ON public.module_templates FOR SELECT USING (true);


-- 9. Modules
CREATE TABLE public.modules (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  template_module_id TEXT REFERENCES public.module_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  module_no INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id),
  FOREIGN KEY (subject_id, user_id) REFERENCES public.subjects(id, user_id) ON DELETE CASCADE
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own modules" ON public.modules FOR ALL USING (auth.uid() = user_id);


-- 10. Topic Templates
CREATE TABLE public.topic_templates (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES public.subject_templates(id) ON DELETE CASCADE NOT NULL,
  module_id TEXT REFERENCES public.module_templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.topic_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are readable by everyone" ON public.topic_templates FOR SELECT USING (true);


-- 11. Topics
CREATE TABLE public.topics (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  template_topic_id TEXT REFERENCES public.topic_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'todo',
  is_weak BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id),
  FOREIGN KEY (subject_id, user_id) REFERENCES public.subjects(id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (module_id, user_id) REFERENCES public.modules(id, user_id) ON DELETE CASCADE
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own topics" ON public.topics FOR ALL USING (auth.uid() = user_id);


-- 12. Study Plan (Task planner)
CREATE TABLE public.study_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  subject_id TEXT,
  module_id TEXT,
  topic_id TEXT,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  planned_minutes INTEGER DEFAULT 60,
  actual_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  task_type TEXT DEFAULT 'main',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  FOREIGN KEY (subject_id, user_id) REFERENCES public.subjects(id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (module_id, user_id) REFERENCES public.modules(id, user_id) ON DELETE SET NULL,
  FOREIGN KEY (topic_id, user_id) REFERENCES public.topics(id, user_id) ON DELETE SET NULL
);
ALTER TABLE public.study_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study plan" ON public.study_plan FOR ALL USING (auth.uid() = user_id);


-- 13. Study Sessions
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  subject_id TEXT,
  topic_id TEXT,
  plan_task_id UUID REFERENCES public.study_plan(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  focus_rating INTEGER,
  notes TEXT,
  FOREIGN KEY (subject_id, user_id) REFERENCES public.subjects(id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id, user_id) REFERENCES public.topics(id, user_id) ON DELETE SET NULL
);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);


-- 14. Notification Preferences & Subscriptions 
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  morning_reminder_time TIME DEFAULT '07:00:00',
  evening_reminder_time TIME DEFAULT '20:00:00',
  morning_enabled BOOLEAN DEFAULT true,
  evening_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reminder settings" ON public.reminder_settings FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL,
    auth_keys JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    UNIQUE(user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    morning_reminder BOOLEAN DEFAULT true,
    morning_time TIME DEFAULT '07:00:00',
    evening_alert BOOLEAN DEFAULT true,
    evening_time TIME DEFAULT '20:00:00',
    streak_reminders BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);


-- 15. RPC Functions

-- Complete Custom Onboarding
CREATE OR REPLACE FUNCTION public.complete_custom_onboarding(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO public.plans (user_id, title, description, is_s4)
  VALUES (target_user_id, 'My First Plan', 'Custom study plan', false)
  RETURNING id INTO v_plan_id;

  UPDATE public.profiles SET is_onboarded = true, active_plan_id = v_plan_id WHERE id = target_user_id;

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Apply S4 Seed (Populate S4 Plan fully)
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
    SELECT id INTO v_plan_id FROM public.plans WHERE user_id = target_user_id AND is_s4 = true LIMIT 1;
  END IF;

  -- b) For each S4 slot, create exam_slot + subject + modules + topics
  FOR slot IN
    SELECT pts.*, st.name AS sub_name, st.code, st.priority, st.focus
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
      priority, focus, template_subject_id, sort_order
    ) VALUES (
      v_subject_id, target_user_id, v_plan_id,
      slot.sub_name, slot.code, slot.exam_date,
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
      mt.id || '-' || target_user_id, target_user_id, v_plan_id, v_subject_id, mt.title, mt.module_no, mt.id
    FROM public.module_templates mt WHERE mt.subject_id = slot.subject_template_id
    ON CONFLICT DO NOTHING;

    -- Insert topics
    INSERT INTO public.topics (id, user_id, plan_id, subject_id, module_id, name, title, priority, sort_order, template_topic_id)
    SELECT 
      tt.id || '-' || target_user_id, target_user_id, v_plan_id, v_subject_id, tt.module_id || '-' || target_user_id, tt.name, tt.name, tt.priority, tt.sort_order, tt.id
    FROM public.topic_templates tt WHERE tt.subject_id = slot.subject_template_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  UPDATE public.profiles SET is_onboarded = true, active_plan_id = v_plan_id WHERE id = target_user_id;

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Attach Custom Subject to Slot
CREATE OR REPLACE FUNCTION public.attach_subject_to_slot(
  p_user_id UUID,
  p_plan_id UUID,
  p_slot_id UUID,
  p_subject_template_id TEXT
) RETURNS TEXT AS $$
DECLARE
  v_subject_id TEXT;
  v_exam_date DATE;
BEGIN
  -- Grab slot date
  IF p_slot_id != '00000000-0000-0000-0000-000000000000' THEN
     SELECT exam_date INTO v_exam_date FROM public.exam_slots WHERE id = p_slot_id;
  END IF;

  v_subject_id := p_subject_template_id || '-' || p_user_id || '-' || substr(md5(random()::text), 1, 4);

  -- Insert subject
  INSERT INTO public.subjects (
    id, user_id, plan_id, template_subject_id, name, code,
    priority, focus, exam_date, sort_order
  )
  SELECT
    v_subject_id, p_user_id, p_plan_id, p_subject_template_id, name, code,
    priority, focus, v_exam_date, sort_order
  FROM public.subject_templates
  WHERE id = p_subject_template_id;

  -- Update slot
  IF p_slot_id != '00000000-0000-0000-0000-000000000000' THEN
      UPDATE public.exam_slots SET subject_id = v_subject_id, subject_name = (SELECT name FROM public.subject_templates WHERE id = p_subject_template_id) WHERE id = p_slot_id;
  END IF;

  -- Insert modules
  INSERT INTO public.modules (id, user_id, plan_id, subject_id, template_module_id, title, module_no)
  SELECT mt.id || '-' || v_subject_id, p_user_id, p_plan_id, v_subject_id, mt.id, mt.title, mt.module_no
  FROM public.module_templates mt WHERE mt.subject_id = p_subject_template_id;

  -- Insert topics
  INSERT INTO public.topics (id, user_id, plan_id, subject_id, module_id, template_topic_id, name, title, priority, sort_order)
  SELECT tt.id || '-' || v_subject_id, p_user_id, p_plan_id, v_subject_id, tt.module_id || '-' || v_subject_id, tt.id, tt.name, tt.name, tt.priority, tt.sort_order
  FROM public.topic_templates tt WHERE tt.subject_id = p_subject_template_id;

  RETURN v_subject_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
