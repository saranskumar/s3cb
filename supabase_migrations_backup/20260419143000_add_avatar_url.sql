-- Add avatar_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the leaderboard view
DROP VIEW IF EXISTS public.public_leaderboard;
CREATE VIEW public.public_leaderboard AS
SELECT 
  id as user_id,
  display_name,
  avatar_url,
  current_streak,
  best_streak,
  completed_tasks,
  (current_streak * 10 + completed_tasks * 2) as rank_score
FROM public.profiles
WHERE show_on_leaderboard = true AND display_name IS NOT NULL;
