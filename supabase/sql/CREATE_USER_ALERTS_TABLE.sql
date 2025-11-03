-- Create user_alerts table for role-based alert preferences
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
-- SAFE: Checks which column exists first before using it
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
  has_segment BOOLEAN;
  has_type BOOLEAN;
  has_role_col BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'segment'
  ) INTO has_segment;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'type'
  ) INTO has_type;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) INTO has_role_col;

  -- Only proceed if at least one column exists
  IF NOT (has_segment OR has_type OR has_role_col) THEN
    RAISE NOTICE 'No segment/type/role column found. Table created but alerts not seeded.';
    RETURN;
  END IF;

  -- Use segment if available, otherwise type, otherwise role
  IF has_segment THEN
    FOR user_rec IN 
      SELECT p.id, p.segment
      FROM profiles p
      WHERE p.segment IN ('investor', 'wholesaler')
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
  ELSIF has_type THEN
    FOR user_rec IN 
      SELECT p.id, p.type
      FROM profiles p
      WHERE p.type IN ('investor', 'wholesaler')
    LOOP
      user_role_val := user_rec.type;
      
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
  ELSIF has_role_col THEN
    FOR user_rec IN 
      SELECT p.id, p.role
      FROM profiles p
      WHERE p.role IN ('investor', 'wholesaler')
    LOOP
      user_role_val := user_rec.role;
      
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
  END IF;
END $$;

SELECT '✅ user_alerts table created and seeded with default alerts' as status;

