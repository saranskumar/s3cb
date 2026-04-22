-- Add has_master_schedule to plans
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS has_master_schedule BOOLEAN DEFAULT false;
