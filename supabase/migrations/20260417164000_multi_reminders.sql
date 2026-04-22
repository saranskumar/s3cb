-- ==============================================
-- MULTI-REMINDERS & EVENING NUDGE
-- Migration: 20260417164000
-- ==============================================

-- 1. Add fields to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS reminder_times TEXT[] DEFAULT '{"09:00"}',
ADD COLUMN IF NOT EXISTS nudge_8pm_enabled BOOLEAN DEFAULT true;

-- 2. Migrate existing single reminder_time to the new array if needed
-- (Assuming we want to preserve user's existing setting)
UPDATE public.notification_preferences 
SET reminder_times = ARRAY[reminder_time] 
WHERE reminder_time IS NOT NULL AND (reminder_times IS NULL OR cardinality(reminder_times) = 0);
