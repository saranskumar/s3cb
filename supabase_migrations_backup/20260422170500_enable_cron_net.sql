-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Note: In Supabase, if pg_cron throws a permissions error when pushing, 
-- it must be enabled via the Dashboard -> Database -> Extensions.
