-- ==============================================
-- DATABASE SCHEMA FOR S4 EXAM COMMAND CENTER
-- ==============================================

-- 1. Profiles Table (Automatically synced to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{"scoreGoal": 70, "safeBufferMin": 3, "safeBufferMax": 8, "dailyStudyGoalMinutes": 300}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can edit own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Subjects Table
CREATE TABLE public.subjects (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  exam_date DATE,
  internal_scored NUMERIC DEFAULT 0,
  internal_total NUMERIC DEFAULT 40,
  external_total NUMERIC DEFAULT 60,
  target_total NUMERIC DEFAULT 70,
  safe_external_min NUMERIC,
  safe_external_max NUMERIC,
  priority TEXT DEFAULT 'medium',
  focus TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id)
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subjects" ON public.subjects FOR ALL USING (auth.uid() = user_id);


-- 3. Syllabus: Modules
CREATE TABLE public.modules (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  module_no INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id),
  FOREIGN KEY(subject_id, user_id) REFERENCES public.subjects(id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own modules" ON public.modules FOR ALL USING (auth.uid() = user_id);


-- 4. Syllabus: Topics
CREATE TABLE public.topics (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'todo', -- todo, done, revise_1, revise_2, mastered
  priority TEXT DEFAULT 'medium',
  confidence INTEGER DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  is_weak BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  last_revised_date DATE,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id),
  FOREIGN KEY(subject_id, user_id) REFERENCES public.subjects(id, user_id) ON DELETE CASCADE,
  FOREIGN KEY(module_id, user_id) REFERENCES public.modules(id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own topics" ON public.topics FOR ALL USING (auth.uid() = user_id);


-- 5. Study Plan (Tasks)
CREATE TABLE public.study_plan (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject_id TEXT,
  topic_id TEXT,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT DEFAULT 'revision',
  planned_minutes INTEGER DEFAULT 60,
  actual_minutes INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending', -- pending, completed, skipped, partial
  is_output_block BOOLEAN DEFAULT false,
  time_slot TEXT,
  phase INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id)
);

ALTER TABLE public.study_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study plan" ON public.study_plan FOR ALL USING (auth.uid() = user_id);


-- 6. Study Sessions (Study Logging)
CREATE TABLE public.study_sessions (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject_id TEXT NOT NULL,
  topic_id TEXT,
  task_id TEXT,
  minutes INTEGER NOT NULL,
  session_type TEXT DEFAULT 'revision',
  date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id)
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);


-- 7. Mocks
CREATE TABLE public.mocks (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  subject_id TEXT NOT NULL,
  date DATE NOT NULL,
  score NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  time_taken_minutes INTEGER,
  weak_areas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  PRIMARY KEY(id, user_id),
  FOREIGN KEY(subject_id, user_id) REFERENCES public.subjects(id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.mocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mocks" ON public.mocks FOR ALL USING (auth.uid() = user_id);


-- ==============================================
-- DATABASE VIEWS & ANALYTICS HELPER
-- ==============================================

-- Secure view to easily fetch calculated progress and readiness logic at the subject level
CREATE OR REPLACE VIEW public.vw_subject_analytics AS
SELECT 
  s.id as subject_id,
  s.user_id,
  s.name,
  s.exam_date,
  GREATEST(0, s.target_total - s.internal_scored) as required_external,
  (
    SELECT count(*) FROM public.topics t 
    WHERE t.subject_id = s.id AND t.user_id = s.user_id
  ) as total_topics,
  (
    SELECT count(*) FROM public.topics t 
    WHERE t.subject_id = s.id AND t.user_id = s.user_id AND t.status IN ('done', 'revise_1', 'revise_2', 'mastered')
  ) as completed_topics,
  (
    SELECT COALESCE(sum(ss.minutes), 0) FROM public.study_sessions ss 
    WHERE ss.subject_id = s.id AND ss.user_id = s.user_id
  ) as total_minutes_studied
FROM public.subjects s; 
