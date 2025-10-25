-- Create comprehensive admin profile system
-- Run this in your Supabase SQL Editor after the main subscription schema

-- Update profiles table with comprehensive fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'investor' CHECK (role IN ('wholesaler', 'investor', 'admin')),
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'basic', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS listings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_uses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS total_listings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_listing_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_time_to_offer INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS lead_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS offers_made INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_offer_value DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS saved_properties INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contacted_wholesalers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_reports_used INTEGER DEFAULT 0;

-- Create admin analytics table
CREATE TABLE IF NOT EXISTS admin_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin dashboard metrics table
CREATE TABLE IF NOT EXISTS admin_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  active_users_investor INTEGER DEFAULT 0,
  active_users_wholesaler INTEGER DEFAULT 0,
  active_users_admin INTEGER DEFAULT 0,
  revenue_monthly DECIMAL(12,2) DEFAULT 0.00,
  revenue_yearly DECIMAL(12,2) DEFAULT 0.00,
  listings_posted INTEGER DEFAULT 0,
  listings_featured INTEGER DEFAULT 0,
  ai_analyses_run INTEGER DEFAULT 0,
  contacts_made INTEGER DEFAULT 0,
  google_maps_api_calls INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Create user activity logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'listing_created', 'listing_updated', 'listing_deleted', 'contact_made', 'ai_analysis', 'subscription_changed', 'payment_made')),
  activity_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('featured_listing_price', '{"weekly": 10, "currency": "USD"}', 'Featured listing pricing'),
('ai_analysis_cost', '{"per_analysis": 5, "currency": "USD"}', 'AI analysis pricing'),
('google_maps_daily_limit', '{"calls": 10000}', 'Daily Google Maps API limit'),
('storage_limit_free', '{"mb": 100}', 'Free tier storage limit'),
('storage_limit_basic', '{"mb": 1000}', 'Basic tier storage limit'),
('storage_limit_pro', '{"mb": 5000}', 'Pro tier storage limit'),
('storage_limit_enterprise', '{"mb": 50000}', 'Enterprise tier storage limit')
ON CONFLICT (setting_key) DO NOTHING;

-- Create admin-only RLS policies
ALTER TABLE admin_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admin can access all analytics data
CREATE POLICY "Admins can view all analytics" ON admin_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all metrics" ON admin_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can only see their own activity logs
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
  FOR SELECT USING (user_id = auth.uid());

-- Create function to update user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  activity_type TEXT,
  activity_data JSONB DEFAULT NULL,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activity_logs (user_id, activity_type, activity_data, ip_address, user_agent)
  VALUES (auth.uid(), activity_type, activity_data, ip_address, user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update admin metrics
CREATE OR REPLACE FUNCTION update_admin_metrics()
RETURNS VOID AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  investor_count INTEGER;
  wholesaler_count INTEGER;
  admin_count INTEGER;
  revenue_monthly DECIMAL(12,2);
  listings_today INTEGER;
  featured_today INTEGER;
  ai_analyses_today INTEGER;
  contacts_today INTEGER;
BEGIN
  -- Count active users by role
  SELECT COUNT(*) INTO investor_count
  FROM profiles 
  WHERE role = 'investor' AND last_login >= CURRENT_DATE - INTERVAL '30 days';
  
  SELECT COUNT(*) INTO wholesaler_count
  FROM profiles 
  WHERE role = 'wholesaler' AND last_login >= CURRENT_DATE - INTERVAL '30 days';
  
  SELECT COUNT(*) INTO admin_count
  FROM profiles 
  WHERE role = 'admin' AND last_login >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculate monthly revenue (placeholder - integrate with Stripe)
  SELECT COALESCE(SUM(price_monthly), 0) INTO revenue_monthly
  FROM subscription_plans sp
  JOIN subscriptions s ON s.stripe_price_id = sp.stripe_price_id_monthly
  WHERE s.status = 'active';
  
  -- Count today's activity
  SELECT COUNT(*) INTO listings_today
  FROM listings 
  WHERE created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO featured_today
  FROM listings 
  WHERE featured = true AND created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO ai_analyses_today
  FROM ai_analysis_logs 
  WHERE created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO contacts_today
  FROM contact_logs 
  WHERE created_at >= CURRENT_DATE;
  
  -- Insert or update metrics for today
  INSERT INTO admin_metrics (
    date, active_users_investor, active_users_wholesaler, active_users_admin,
    revenue_monthly, listings_posted, listings_featured, ai_analyses_run, contacts_made
  ) VALUES (
    today_date, investor_count, wholesaler_count, admin_count,
    revenue_monthly, listings_today, featured_today, ai_analyses_today, contacts_today
  )
  ON CONFLICT (date) DO UPDATE SET
    active_users_investor = EXCLUDED.active_users_investor,
    active_users_wholesaler = EXCLUDED.active_users_wholesaler,
    active_users_admin = EXCLUDED.active_users_admin,
    revenue_monthly = EXCLUDED.revenue_monthly,
    listings_posted = EXCLUDED.listings_posted,
    listings_featured = EXCLUDED.listings_featured,
    ai_analyses_run = EXCLUDED.ai_analyses_run,
    contacts_made = EXCLUDED.contacts_made;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update profile to admin
  UPDATE profiles 
  SET role = 'admin', membership_tier = 'enterprise', verified = true
  WHERE id = target_user_id;
  
  -- Log the promotion
  INSERT INTO user_activity_logs (user_id, activity_type, activity_data)
  VALUES (target_user_id, 'subscription_changed', '{"promoted_to": "admin"}');
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin dashboard view
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'investor') as total_investors,
  (SELECT COUNT(*) FROM profiles WHERE role = 'wholesaler') as total_wholesalers,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM listings WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as listings_last_30_days,
  (SELECT COUNT(*) FROM listings WHERE featured = true) as featured_listings,
  (SELECT COUNT(*) FROM contact_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as contacts_last_30_days,
  (SELECT COUNT(*) FROM ai_analysis_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as ai_analyses_last_30_days,
  (SELECT COALESCE(SUM(price_monthly), 0) FROM subscription_plans sp 
   JOIN subscriptions s ON s.stripe_price_id = sp.stripe_price_id_monthly 
   WHERE s.status = 'active') as monthly_revenue;

-- Grant admin access to the dashboard view
GRANT SELECT ON admin_dashboard TO authenticated;

-- Create RLS policy for admin dashboard
CREATE POLICY "Admins can view dashboard" ON admin_dashboard
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert your admin account (replace with your actual email)
-- You'll need to run this after creating your user account
-- SELECT promote_to_admin('your-email@example.com');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier ON profiles(membership_tier);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_date ON admin_metrics(date);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
