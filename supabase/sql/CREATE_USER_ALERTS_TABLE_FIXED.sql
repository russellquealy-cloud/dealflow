-- Create user_alerts table for role-based alert preferences
-- FIXED: Uses segment column from profiles (not role)
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

-- Seed default alerts for existing users (run after table creation)
-- FIXED: Uses segment column (with fallback to role)
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
BEGIN
  -- For each user, insert default alerts based on their role
  -- Use segment column (preferred), fallback to role if segment doesn't exist
  FOR user_record IN 
    SELECT 
      p.id as user_id, 
      COALESCE(p.segment, p.role, 'investor') as user_role
    FROM profiles p
    WHERE COALESCE(p.segment, p.role, 'investor') IN ('investor', 'wholesaler')
  LOOP
    IF user_record.user_role = 'investor' THEN
      FOREACH alert IN ARRAY investor_alerts
      LOOP
        INSERT INTO user_alerts (user_id, role, alert_type, is_enabled)
        VALUES (user_record.user_id, 'investor', alert, true)
        ON CONFLICT (user_id, role, alert_type) DO NOTHING;
      END LOOP;
    ELSIF user_record.user_role = 'wholesaler' THEN
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

