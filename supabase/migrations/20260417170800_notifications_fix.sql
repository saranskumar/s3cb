-- ==============================================
-- SCHEMA FIX: ACTIVE PLAN LINK
-- Migration: 20260417170800
-- ==============================================

ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS active_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
