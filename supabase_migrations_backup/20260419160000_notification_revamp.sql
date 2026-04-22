-- Add public_name (leaderboard alias) to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_name text;

-- Add last_messages (anti-repetition tracking) to notification_preferences
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS last_messages jsonb DEFAULT '[]'::jsonb;
