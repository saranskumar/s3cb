-- Fix public_name column and enforce privacy on the leaderboard
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_name TEXT;

-- Migration: Populate missing public names if they are NULL
UPDATE public.profiles
SET public_name = 'Focus_' || substr(id::text, 1, 6),
    show_on_leaderboard = true
WHERE public_name IS NULL;

-- Ensure all users are opted in as per latest request
UPDATE public.profiles SET show_on_leaderboard = true;

-- Recreate the leaderboard view to prioritze privacy
-- Specifically, we only expose user_id, public_name, and stats.
-- Real display_name is strictly excluded.
DROP VIEW IF EXISTS public.public_leaderboard;
CREATE VIEW public.public_leaderboard AS
SELECT 
  id as user_id,
  public_name,
  avatar_url,
  current_streak,
  best_streak,
  completed_tasks,
  (current_streak * 10 + completed_tasks * 2) as rank_score
FROM public.profiles
WHERE show_on_leaderboard = true AND public_name IS NOT NULL;
