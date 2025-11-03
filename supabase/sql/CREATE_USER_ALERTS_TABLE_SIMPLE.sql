-- Create user_alerts table for role-based alert preferences
-- SIMPLE VERSION: Only seeds if segment column exists
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('investor', 'wholesaler')),
  alert_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role, alert_type)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_role ON user_alerts(user_id, role);

-- Enable RLS
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view/edit their own alerts
DROP POLICY IF EXISTS "Users can manage their own alerts" ON user_alerts;
CREATE POLICY "Users can manage their own alerts" ON user_alerts
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_alerts_updated_at ON user_alerts;
CREATE TRIGGER trigger_update_user_alerts_updated_at
  BEFORE UPDATE ON user_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_alerts_updated_at();

-- Seed default alerts for existing users
-- NOTE: If your profiles table uses 'type' or 'role' instead of 'segment',
-- change all instances of 'segment' below to match your column name
DO $$
DECLARE
  investor_alerts TEXT[] := ARRAY[
    'New Off-Market Property',
    'Price Drop',
    'ROI Opportunity',
    'Sold/Under Contract',
    'Wholesaler Verified',
    'Area Market Shift',
    'Subscription Renewal',
    'Message/Offer Response'
  ];
  wholesaler_alerts TEXT[] := ARRAY[
    'Buyer Interest',
    'Lead Message',
    'Listing Performance',
    'Repair Estimate Ready',
    'Property Verification',
    'Market Trend',
    'Subscription Renewal',
    'Feedback/Rating'
  ];
  user_rec RECORD;
  user_role_val TEXT;
BEGIN
  -- Check if segment column exists before proceeding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'segment'
  ) THEN
    RAISE NOTICE 'Column "segment" not found in profiles table. Please update the column name in this script.';
    RETURN;
  END IF;

  -- For each user with segment = 'investor' or 'wholesaler'
  FOR user_rec IN 
    SELECT p.id, p.segment
    FROM profiles p
    WHERE p.segment = 'investor' OR p.segment = 'wholesaler'
  LOOP
    user_role_val := user_rec.segment;
    
    IF user_role_val = 'investor' THEN
      FOREACH alert IN ARRAY investor_alerts
      LOOP
        INSERT INTO user_alerts (user_id, role, alert_type, is_enabled)
        VALUES (user_rec.id, 'investor', alert, true)
        ON CONFLICT (user_id, role, alert_type) DO NOTHING;
      END LOOP;
    ELSIF user_role_val = 'wholesaler' THEN
      FOREACH alert IN ARRAY wholesaler_alerts
      LOOP
        INSERT INTO user_alerts (user_id, role, alert_type, is_enabled)
        VALUES (user_rec.id, 'wholesaler', alert, true)
        ON CONFLICT (user_id, role, alert_type) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

SELECT '✅ user_alerts table created and seeded with default alerts' as status;

