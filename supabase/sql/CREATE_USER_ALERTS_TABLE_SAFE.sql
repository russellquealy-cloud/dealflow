-- Create user_alerts table for role-based alert preferences
-- SAFE VERSION: Checks for column existence before using
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
-- SAFE: Only uses segment column (doesn't check for role column)
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
  user_record RECORD;
  has_segment_column BOOLEAN;
  has_role_column BOOLEAN;
  user_role TEXT;
BEGIN
  -- Check which columns exist in profiles table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'segment'
  ) INTO has_segment_column;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) INTO has_role_column;

  -- For each user, insert default alerts based on their role
  FOR user_record IN 
    SELECT p.id as user_id
    FROM profiles p
  LOOP
    -- Determine user role based on available columns
    IF has_segment_column THEN
      SELECT segment INTO user_role FROM profiles WHERE id = user_record.user_id;
    ELSIF has_role_column THEN
      SELECT role INTO user_role FROM profiles WHERE id = user_record.user_id;
    ELSE
      user_role := 'investor'; -- Default fallback
    END IF;
    
    -- Default to investor if role is null or invalid
    IF user_role IS NULL OR user_role NOT IN ('investor', 'wholesaler') THEN
      user_role := 'investor';
    END IF;

    -- Insert alerts based on role
    IF user_role = 'investor' THEN
      FOREACH alert IN ARRAY investor_alerts
      LOOP
        INSERT INTO user_alerts (user_id, role, alert_type, is_enabled)
        VALUES (user_record.user_id, 'investor', alert, true)
        ON CONFLICT (user_id, role, alert_type) DO NOTHING;
      END LOOP;
    ELSIF user_role = 'wholesaler' THEN
      FOREACH alert IN ARRAY wholesaler_alerts
      LOOP
        INSERT INTO user_alerts (user_id, role, alert_type, is_enabled)
        VALUES (user_record.user_id, 'wholesaler', alert, true)
        ON CONFLICT (user_id, role, alert_type) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

SELECT '✅ user_alerts table created and seeded with default alerts' as status;

