-- Add ref_id and read_at columns to notifications table
-- This migration adds the columns requested in the notifications system fix
-- while maintaining backward compatibility with existing is_read boolean

-- Add ref_id column (nullable text to store messageId or listingId)
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS ref_id TEXT NULL;

-- Add read_at column (nullable timestamp)  
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL;

-- Create index on ref_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_ref_id ON public.notifications(ref_id) WHERE ref_id IS NOT NULL;

-- Create index on read_at for faster unread queries (unread = read_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at) WHERE read_at IS NULL;

-- Update the CHECK constraint to allow simpler types like 'message' and 'saved'
-- First, drop the existing constraint
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add a new, more flexible constraint that includes the new simple types
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'buyer_interest',
      'lead_message',
      'listing_performance',
      'repair_estimate_ready',
      'property_verification',
      'market_trend',
      'subscription_renewal',
      'feedback_rating',
      'message',
      'saved',
      'alert',
      'system'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policies exist for SELECT and UPDATE
-- (They should already exist, but recreate if missing)

DROP POLICY IF EXISTS "Notifications select own rows" ON public.notifications;
CREATE POLICY "Notifications select own rows"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notifications update own rows" ON public.notifications;
CREATE POLICY "Notifications update own rows"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: Service role bypasses RLS, so it can INSERT notifications without a policy
-- This is the intended behavior for server-side notification creation

-- Migration complete

