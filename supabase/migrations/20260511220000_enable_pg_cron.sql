CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_namespace
    WHERE nspname = 'cron'
  ) THEN
    GRANT USAGE ON SCHEMA cron TO postgres;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
  END IF;
END $$;
