-- Update Cron to 1-minute intervals for exact precision
SELECT cron.unschedule('invoke-send-reminders');

SELECT cron.schedule(
  'invoke-send-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
      url:='https://ancoplzndtykldfujwgw.supabase.co/functions/v1/send-reminders',
      headers:='{"Content-Type": "application/json", "x-cron-secret": "5f9d2a6a-8b1e-432d-9486-1200b3a97184"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  $$
);
