-- Fix notification_preferences schema to match revamp plan
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tz_offset INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_times JSONB DEFAULT '["09:00", "20:00"]'::jsonb,
  ADD COLUMN IF NOT EXISTS active_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nudge_8pm_enabled BOOLEAN DEFAULT true;

-- Migration: Copy old morning/evening times into the new array if they exist
-- We do this for existing users to maintain their schedule
UPDATE public.notification_preferences
SET reminder_times = jsonb_build_array(
  TO_CHAR(morning_time, 'HH24:MI'), 
  TO_CHAR(evening_time, 'HH24:MI')
)
WHERE reminder_times IS NULL OR reminder_times = '["09:00", "20:00"]'::jsonb;
