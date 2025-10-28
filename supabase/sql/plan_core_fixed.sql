-- Fixed Core pricing and plan management schema
-- File: supabase/sql/plan_core_fixed.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table with enhanced plan management (only add missing columns)
DO $$ 
BEGIN
    -- Add columns only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'segment') THEN
        ALTER TABLE profiles ADD COLUMN segment TEXT CHECK (segment IN ('investor', 'wholesaler'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tier') THEN
        ALTER TABLE profiles ADD COLUMN tier TEXT CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')) DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
        ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'active_price_id') THEN
        ALTER TABLE profiles ADD COLUMN active_price_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_period_end') THEN
        ALTER TABLE profiles ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;
END $$;

-- Organizations for Enterprise/team features
CREATE TABLE IF NOT EXISTS orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('basic', 'pro', 'enterprise')) DEFAULT 'basic',
  seats INTEGER DEFAULT 1,
  branding JSONB DEFAULT '{}',
  custom_domain TEXT,
  support_level TEXT CHECK (support_level IN ('standard', 'priority', 'dedicated')) DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members for team management
CREATE TABLE IF NOT EXISTS org_members (
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- Usage counters for plan limits
CREATE TABLE IF NOT EXISTS usage_counters (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  metric TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, period_start, metric)
);

-- Watchlists for saved properties
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Alerts for property notifications
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('price', 'location', 'property_type', 'custom')) NOT NULL,
  criteria JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages for investor chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL,
  from_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM exports audit trail
CREATE TABLE IF NOT EXISTS crm_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rows INTEGER DEFAULT 0,
  format TEXT CHECK (format IN ('csv', 'json', 'pdf')) NOT NULL
);

-- Add verified badge to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_exports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Orgs policies
DROP POLICY IF EXISTS "Users can view orgs they belong to" ON orgs;
DROP POLICY IF EXISTS "Owners can manage their orgs" ON orgs;

CREATE POLICY "Users can view orgs they belong to" ON orgs
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (SELECT user_id FROM org_members WHERE org_id = orgs.id)
  );

CREATE POLICY "Owners can manage their orgs" ON orgs
  FOR ALL USING (auth.uid() = owner_id);

-- Org members policies
DROP POLICY IF EXISTS "Users can view org members of their orgs" ON org_members;
DROP POLICY IF EXISTS "Org owners can manage members" ON org_members;

CREATE POLICY "Users can view org members of their orgs" ON org_members
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT owner_id FROM orgs WHERE id = org_id)
  );

CREATE POLICY "Org owners can manage members" ON org_members
  FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM orgs WHERE id = org_id)
  );

-- Usage counters policies
DROP POLICY IF EXISTS "Users can view their own usage" ON usage_counters;
DROP POLICY IF EXISTS "Users can update their own usage" ON usage_counters;

CREATE POLICY "Users can view their own usage" ON usage_counters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON usage_counters
  FOR ALL USING (auth.uid() = user_id);

-- Watchlists policies
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON watchlists;

CREATE POLICY "Users can manage their own watchlists" ON watchlists
  FOR ALL USING (auth.uid() = user_id);

-- Alerts policies
DROP POLICY IF EXISTS "Users can manage their own alerts" ON alerts;

CREATE POLICY "Users can manage their own alerts" ON alerts
  FOR ALL USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;

CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = from_id);

CREATE POLICY "Users can update messages they received" ON messages
  FOR UPDATE USING (auth.uid() = to_id);

-- CRM exports policies
DROP POLICY IF EXISTS "Users can view their own exports" ON crm_exports;
DROP POLICY IF EXISTS "Users can create their own exports" ON crm_exports;

CREATE POLICY "Users can view their own exports" ON crm_exports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports" ON crm_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RPC function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_metric TEXT,
  p_delta INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  new_count INTEGER;
BEGIN
  -- Get current month start
  INSERT INTO usage_counters (user_id, period_start, metric, count)
  VALUES (p_user_id, DATE_TRUNC('month', NOW())::DATE, p_metric, p_delta)
  ON CONFLICT (user_id, period_start, metric)
  DO UPDATE SET count = usage_counters.count + p_delta;
  
  -- Return new count
  SELECT count INTO new_count
  FROM usage_counters
  WHERE user_id = p_user_id 
    AND period_start = DATE_TRUNC('month', NOW())::DATE 
    AND metric = p_metric;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_usage TO authenticated;

-- Indexes for performance
-- Note: email column doesn't exist in profiles table, skipping that index
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON orgs(slug);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_user_period ON usage_counters(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_to ON messages(from_id, to_id);
CREATE INDEX IF NOT EXISTS idx_crm_exports_user_id ON crm_exports(user_id);
