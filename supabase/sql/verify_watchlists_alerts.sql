-- Verify and create watchlists and alerts tables if they don't exist
-- Run this script to ensure tables are set up correctly

-- Check if watchlists table exists and create if not
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Check if alerts table exists and create if not
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('price', 'location', 'property_type', 'custom')) NOT NULL,
  criteria JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON watchlists;
DROP POLICY IF EXISTS "Users can manage their own alerts" ON alerts;

-- Create RLS policies for watchlists
CREATE POLICY "Users can manage their own watchlists" ON watchlists
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for alerts
CREATE POLICY "Users can manage their own alerts" ON alerts
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_property_id ON watchlists(property_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(active) WHERE active = true;

-- Verify tables were created
SELECT 
  'watchlists' as table_name,
  COUNT(*) as row_count
FROM watchlists
UNION ALL
SELECT 
  'alerts' as table_name,
  COUNT(*) as row_count
FROM alerts;

