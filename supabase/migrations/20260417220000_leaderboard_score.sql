-- Update Public Leaderboard to compute a ranked score based on Streak & Topics Covered(completed_tasks)
DROP VIEW IF EXISTS public.public_leaderboard;

CREATE VIEW public.public_leaderboard AS
SELECT 
  id as user_id, 
  display_name, 
  current_streak, 
  best_streak, 
  completed_tasks,
  -- Score logic: Streak brings highly active users up, but Topics Covered heavily anchors them
  (current_streak * 15 + completed_tasks * 2) as rank_score
FROM public.profiles
WHERE show_on_leaderboard = true
AND display_name IS NOT NULL;

GRANT SELECT ON public.public_leaderboard TO authenticated;
