-- Create table to track processed Stripe webhook events for idempotency
-- This prevents duplicate processing of the same webhook event

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id 
  ON stripe_webhook_events(stripe_event_id);

-- Enable RLS (optional, but recommended)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read (webhooks are server-side only)
CREATE POLICY "Service role can manage webhook events"
  ON stripe_webhook_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to read (for debugging/admin)
CREATE POLICY "Authenticated users can read webhook events"
  ON stripe_webhook_events
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency';

