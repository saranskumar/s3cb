-- ==============================================
-- ADD DELETE CASCADES
-- Migration: 20260417130000
-- ==============================================

-- Profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Subjects
ALTER TABLE public.subjects
DROP CONSTRAINT IF EXISTS subjects_user_id_fkey,
ADD CONSTRAINT subjects_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Modules
ALTER TABLE public.modules
DROP CONSTRAINT IF EXISTS modules_user_id_fkey,
ADD CONSTRAINT modules_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Topics
ALTER TABLE public.topics
DROP CONSTRAINT IF EXISTS topics_user_id_fkey,
ADD CONSTRAINT topics_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Study Plan
ALTER TABLE public.study_plan
DROP CONSTRAINT IF EXISTS study_plan_user_id_fkey,
ADD CONSTRAINT study_plan_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Study Sessions
ALTER TABLE public.study_sessions
DROP CONSTRAINT IF EXISTS study_sessions_user_id_fkey,
ADD CONSTRAINT study_sessions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Mocks
ALTER TABLE public.mocks
DROP CONSTRAINT IF EXISTS mocks_user_id_fkey,
ADD CONSTRAINT mocks_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Plans
ALTER TABLE public.plans
DROP CONSTRAINT IF EXISTS plans_user_id_fkey,
ADD CONSTRAINT plans_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Reminder Settings
ALTER TABLE public.reminder_settings
DROP CONSTRAINT IF EXISTS reminder_settings_user_id_fkey,
ADD CONSTRAINT reminder_settings_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
