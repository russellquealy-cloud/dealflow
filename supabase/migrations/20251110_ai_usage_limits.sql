-- AI plan limits and usage tracking

CREATE TABLE IF NOT EXISTS public.ai_plan_limits (
  plan text PRIMARY KEY,
  monthly_requests integer NOT NULL
);

INSERT INTO public.ai_plan_limits (plan, monthly_requests)
VALUES
  ('free', 20),
  ('basic', 200),
  ('pro', 1000),
  ('enterprise', 100000)
ON CONFLICT (plan) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  month_start date NOT NULL,
  requests integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month_start)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage owner read" ON public.ai_usage;

CREATE POLICY "ai_usage owner read"
ON public.ai_usage
FOR SELECT
USING (auth.uid() = user_id);


