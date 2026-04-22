-- Schedule the send-reminders function to run every minute
SELECT cron.schedule(
  'send-reminders-job',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ancoplzndtykldfujwgw.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claim.role', true)
    )
  );
  $$
);
