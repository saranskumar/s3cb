-- Unschedule the old job and schedule the new one with correct auth
SELECT cron.unschedule('send-reminders-job');

SELECT cron.schedule(
  'send-reminders-job',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ancoplzndtykldfujwgw.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuY29wbHpuZHR5a2xkZnVqd2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjQ4NTIsImV4cCI6MjA5MTg0MDg1Mn0.ySqd5zkDG8xLPxxNGSLdpGR36xafCnd5aWKX1jQuJg0"}'::jsonb
  );
  $$
);
