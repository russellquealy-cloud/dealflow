-- Notifications tables and policies
-- Created: 2025-02-10

-- Ensure helper function exists to maintain updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_interest boolean NOT NULL DEFAULT true,
  lead_message boolean NOT NULL DEFAULT true,
  listing_performance boolean NOT NULL DEFAULT true,
  repair_estimate_ready boolean NOT NULL DEFAULT true,
  property_verification boolean NOT NULL DEFAULT true,
  market_trend boolean NOT NULL DEFAULT true,
  subscription_renewal boolean NOT NULL DEFAULT true,
  feedback_rating boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT notification_preferences_user_unique UNIQUE(user_id)
);

CREATE TRIGGER notification_preferences_handle_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notification preferences select own rows"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Notification preferences update own rows"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Notification preferences insert own rows"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (
    type IN (
      'buyer_interest',
      'lead_message',
      'listing_performance',
      'repair_estimate_ready',
      'property_verification',
      'market_trend',
      'subscription_renewal',
      'feedback_rating'
    )
  ),
  title text NOT NULL,
  body text NOT NULL,
  listing_id uuid NULL REFERENCES listings(id) ON DELETE SET NULL,
  metadata jsonb NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications select own rows"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Notifications update own rows"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


