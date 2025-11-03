-- Create user_alerts table for role-based alert preferences
-- WORKS VERSION: Drops existing table first to avoid column conflicts
-- Run this in Supabase SQL Editor

-- Drop existing table and policies if they exist (start fresh)
DROP TABLE IF EXISTS user_alerts CASCADE;

CREATE TABLE user_alerts (
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

-- Seed default alerts using dynamic SQL (avoids parse-time column validation)
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
  user_id_val UUID;
  user_role_val TEXT;
  alert TEXT;
  column_to_use TEXT;
BEGIN
  -- Detect which column exists and use it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'segment'
  ) THEN
    column_to_use := 'segment';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'type'
  ) THEN
    column_to_use := 'type';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    column_to_use := 'role';
  ELSE
    RAISE NOTICE 'No segment/type/role column found. Skipping alert seeding.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using column: %', column_to_use;

  -- Use dynamic SQL with EXECUTE to avoid parse-time column validation
  FOR user_id_val, user_role_val IN 
    EXECUTE format('SELECT id, %I FROM profiles WHERE %I IN (''investor'', ''wholesaler'')', column_to_use, column_to_use)
  LOOP
    IF user_role_val = 'investor' THEN
      FOREACH alert IN ARRAY investor_alerts
      LOOP
        INSERT INTO user_alerts (user_id, role, alert_type, is_enabled)
        VALUES (user_id_val, 'investor', alert, true)
        ON CONFLICT (user_id, role, alert_type) DO NOTHING;
      END LOOP;
    ELSIF user_role_val = 'wholesaler' THEN
      FOREACH alert IN ARRAY wholesaler_alerts
      LOOP
        INSERT INTO user_alerts (user_id, role, alert_type, is_enabled)
        VALUES (user_id_val, 'wholesaler', alert, true)
        ON CONFLICT (user_id, role, alert_type) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Alerts seeded successfully';
END $$;

SELECT '✅ user_alerts table created and seeded with default alerts' as status;

