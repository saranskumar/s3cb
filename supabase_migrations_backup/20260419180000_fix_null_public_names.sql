-- Ensure all users have a public_name to prevent fallback to real names on the leaderboard
UPDATE public.profiles
SET public_name = 'Student_' || substr(id::text, 1, 8),
    show_on_leaderboard = true
WHERE public_name IS NULL;
