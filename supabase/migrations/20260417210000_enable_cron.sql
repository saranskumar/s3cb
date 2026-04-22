-- ==============================================
-- SCHEDULED REMINDERS CRON SETUP
-- Migration: 20260417210000
-- ==============================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Skip unschedule for first run to avoid XX000 errors

-- 3. Schedule the new job to run every 15 minutes
-- It hits the production Edge Function endpoint securely.
SELECT cron.schedule(
  'invoke-send-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
      url:='https://ancoplzndtykldfujwgw.supabase.co/functions/v1/send-reminders',
      headers:='{"Content-Type": "application/json", "x-cron-secret": "5f9d2a6a-8b1e-432d-9486-1200b3a97184"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  $$
);
