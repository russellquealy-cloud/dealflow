-- Create subscription system tables
-- Run this in your Supabase SQL Editor

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription usage tracking table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  contacts_used INTEGER DEFAULT 0,
  ai_analyses_used INTEGER DEFAULT 0,
  listings_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Create contact logs table for tracking contact actions
CREATE TABLE IF NOT EXISTS contact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('call', 'email', 'text')),
  contact_data JSONB, -- Store phone/email used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI analysis logs table
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('arv', 'repairs', 'mao', 'comps')),
  input_data JSONB,
  output_data JSONB,
  cost_cents INTEGER DEFAULT 0, -- Track AI costs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON subscriptions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON subscriptions 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for subscription usage
CREATE POLICY "Users can view their own usage" ON subscription_usage 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON subscription_usage 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON subscription_usage 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for contact logs
CREATE POLICY "Users can view their own contact logs" ON contact_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact logs" ON contact_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for AI analysis logs
CREATE POLICY "Users can view their own AI analysis logs" ON ai_analysis_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI analysis logs" ON ai_analysis_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscription_usage_user_id_month_idx ON subscription_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS contact_logs_user_id_idx ON contact_logs(user_id);
CREATE INDEX IF NOT EXISTS contact_logs_listing_id_idx ON contact_logs(listing_id);
CREATE INDEX IF NOT EXISTS ai_analysis_logs_user_id_idx ON ai_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_analysis_logs_listing_id_idx ON ai_analysis_logs(listing_id);

-- Create function to get user's current subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  tier TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN s.status = 'active' AND s.stripe_price_id = 'price_pro_monthly' THEN 'pro'
      WHEN s.status = 'active' AND s.stripe_price_id = 'price_enterprise_monthly' THEN 'enterprise'
      ELSE 'free'
    END
  INTO tier
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status = 'active'
    AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can perform action
CREATE OR REPLACE FUNCTION can_user_perform_action(
  user_uuid UUID,
  action_type TEXT,
  action_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  tier TEXT;
  current_usage INTEGER;
  tier_limits JSONB;
BEGIN
  -- Get user's subscription tier
  tier := get_user_subscription_tier(user_uuid);
  
  -- Get current month usage
  SELECT 
    CASE action_type
      WHEN 'contacts' THEN contacts_used
      WHEN 'ai_analyses' THEN ai_analyses_used
      WHEN 'listings' THEN listings_created
      ELSE 0
    END
  INTO current_usage
  FROM subscription_usage
  WHERE user_id = user_uuid
    AND month_year = TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Define tier limits
  tier_limits := CASE tier
    WHEN 'free' THEN '{"contacts": 5, "ai_analyses": 0, "listings": 0}'::JSONB
    WHEN 'pro' THEN '{"contacts": -1, "ai_analyses": 50, "listings": -1}'::JSONB
    WHEN 'enterprise' THEN '{"contacts": -1, "ai_analyses": -1, "listings": -1}'::JSONB
    ELSE '{"contacts": 5, "ai_analyses": 0, "listings": 0}'::JSONB
  END;
  
  -- Check if user can perform action
  IF tier_limits->>action_type = '-1' THEN
    RETURN TRUE; -- Unlimited
  END IF;
  
  RETURN (current_usage + action_count) <= (tier_limits->>action_type)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_subscription_usage(
  user_uuid UUID,
  action_type TEXT,
  action_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  INSERT INTO subscription_usage (user_id, month_year, contacts_used, ai_analyses_used, listings_created)
  VALUES (
    user_uuid,
    current_month,
    CASE WHEN action_type = 'contacts' THEN action_count ELSE 0 END,
    CASE WHEN action_type = 'ai_analyses' THEN action_count ELSE 0 END,
    CASE WHEN action_type = 'listings' THEN action_count ELSE 0 END
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    contacts_used = subscription_usage.contacts_used + CASE WHEN action_type = 'contacts' THEN action_count ELSE 0 END,
    ai_analyses_used = subscription_usage.ai_analyses_used + CASE WHEN action_type = 'ai_analyses' THEN action_count ELSE 0 END,
    listings_created = subscription_usage.listings_created + CASE WHEN action_type = 'listings' THEN action_count ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
