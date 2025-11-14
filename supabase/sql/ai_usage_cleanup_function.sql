-- AI Usage Cleanup Function
-- This function can be called monthly to clean up old AI usage records
-- Can be scheduled via Supabase Cron or Vercel Cron

CREATE OR REPLACE FUNCTION public.ai_usage_cleanup()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.ai_usage
  WHERE month_start < (current_date - interval '365 days');
$$;

-- Grant execute permission to authenticated users (or service role)
-- In practice, this should only be called by scheduled jobs
GRANT EXECUTE ON FUNCTION public.ai_usage_cleanup() TO authenticated;

