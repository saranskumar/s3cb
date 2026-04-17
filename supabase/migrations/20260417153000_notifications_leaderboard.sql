-- ==============================================
-- PUSH NOTIFICATIONS & LEADERBOARD
-- Migration: 20260417153000
-- ==============================================

-- 1. Extend Profiles for Leaderboard & Notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0;

-- 2. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push_subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- 3. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT false,
  reminder_time TEXT DEFAULT '09:00', -- Stored in 24h format HH:MM (user's local time)
  tz_offset INTEGER DEFAULT 0, -- Store the user timezone offset in minutes so cron knows when to trigger
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '08:00',
  tone TEXT DEFAULT 'motivating', -- motivating, strict, minimal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notification_preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own notification_preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

-- 4. Public Leaderboard View
-- This strictly prevents sensitive private data from being exposed while allowing leaderboard queries.
DROP VIEW IF EXISTS public.public_leaderboard;
CREATE VIEW public.public_leaderboard AS
SELECT 
  id as user_id, 
  display_name, 
  current_streak, 
  best_streak, 
  completed_tasks
FROM public.profiles
WHERE show_on_leaderboard = true
AND display_name IS NOT NULL;

-- 5. RLS for Public Leaderboard
-- Allow any authenticated user to SELECT from the view. 
GRANT SELECT ON public.public_leaderboard TO authenticated;
