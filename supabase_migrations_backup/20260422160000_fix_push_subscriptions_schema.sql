-- Fix push_subscriptions table to match code expectations
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS p256dh TEXT,
  ADD COLUMN IF NOT EXISTS auth TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Drop old auth_keys column if it exists (no longer used)
ALTER TABLE public.push_subscriptions
  DROP COLUMN IF EXISTS auth_keys;
