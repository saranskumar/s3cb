-- Add has_master_schedule column to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS has_master_schedule BOOLEAN DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS master_schedule_seeded_at TIMESTAMP WITH TIME ZONE;
