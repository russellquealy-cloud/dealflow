-- Complete Profile Setup and Testing Script
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what we currently have
SELECT 'Current profiles structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check current data (join with auth.users for email if needed)
SELECT 'Current profiles data:' as info;
SELECT 
    p.id, 
    u.email,
    p.role, 
    p.segment, 
    p.tier, 
    p.membership_tier, 
    p.created_at 
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
LIMIT 10;

-- 3. Standardize the profile structure
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'investor';
    END IF;
    
    -- Add segment column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'segment') THEN
        ALTER TABLE profiles ADD COLUMN segment TEXT DEFAULT 'investor';
    END IF;
    
    -- Add tier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tier') THEN
        ALTER TABLE profiles ADD COLUMN tier TEXT DEFAULT 'free';
    END IF;
    
    -- Add membership_tier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'membership_tier') THEN
        ALTER TABLE profiles ADD COLUMN membership_tier TEXT DEFAULT 'free';
    END IF;
    
    -- Add verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
        ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Add stripe_customer_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;
    
    -- Add active_price_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'active_price_id') THEN
        ALTER TABLE profiles ADD COLUMN active_price_id TEXT;
    END IF;
    
    -- Add current_period_end if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_period_end') THEN
        ALTER TABLE profiles ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;
END $$;

-- 4. Sync role and segment columns (they should be the same)
UPDATE profiles 
SET segment = role 
WHERE segment IS NULL OR segment = '';

UPDATE profiles 
SET role = segment 
WHERE role IS NULL OR role = '';

-- 5. Set default values for new users
UPDATE profiles 
SET role = 'investor', segment = 'investor', tier = 'free', membership_tier = 'free'
WHERE role IS NULL OR segment IS NULL OR tier IS NULL OR membership_tier IS NULL;

-- 6. DROP constraints FIRST (before fixing data)
-- This allows us to fix invalid data without constraint violations
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_segment_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;

-- 7. Clean up existing data (now constraints are dropped, we can fix anything)
-- Fix ANY admin users to have proper segment (regardless of current segment value)
UPDATE profiles 
SET segment = 'investor'
WHERE role = 'admin';

-- Ensure segment matches role for non-admin users
UPDATE profiles 
SET segment = role
WHERE role IN ('investor', 'wholesaler') AND (segment IS NULL OR segment != role);

-- Set default values for NULL fields
UPDATE profiles 
SET segment = COALESCE(segment, role, 'investor'),
    tier = COALESCE(tier, 'free'),
    membership_tier = COALESCE(membership_tier, 'free')
WHERE segment IS NULL OR tier IS NULL OR membership_tier IS NULL;

-- Final safety check: Force all admin users to have segment='investor'
UPDATE profiles 
SET segment = 'investor'
WHERE role = 'admin';

-- 8. Add constraints back (after all data is fixed)
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('wholesaler', 'investor', 'admin'));

ALTER TABLE profiles ADD CONSTRAINT profiles_segment_check 
CHECK (segment IS NULL OR segment IN ('wholesaler', 'investor'));

ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check 
CHECK (tier IN ('free', 'basic', 'pro', 'enterprise'));

ALTER TABLE profiles ADD CONSTRAINT profiles_membership_tier_check 
CHECK (membership_tier IN ('free', 'basic', 'pro', 'enterprise'));

-- 9. Update profiles for existing auth users
-- NOTE: Profiles must be linked to existing auth.users by id
-- Users must be created in Supabase Auth first (see TESTING_GUIDE.md)
-- This will update profiles for users that already exist

SELECT 'Updating profiles for existing auth users...' as info;

-- CRITICAL: Fix ALL admin users to have proper segment before any updates
-- This ensures no constraint violations occur
-- First, fix the specific problematic admin user by ID (from error message)
UPDATE profiles 
SET segment = 'investor'
WHERE id = 'bf2050bb-b192-4a32-9f62-f57abad82ea7' AND role = 'admin';

-- Then fix ALL other admin users
UPDATE profiles 
SET segment = 'investor'
WHERE role = 'admin' AND (segment IS NULL OR segment != 'investor');

-- Also ensure all users have valid segments
UPDATE profiles 
SET segment = role
WHERE role IN ('investor', 'wholesaler') AND (segment IS NULL OR segment != role);

-- DIRECT UPDATE: Fix ALL admin users first (simple UPDATE, no DO block)
-- This must happen BEFORE any INSERT operations
UPDATE profiles 
SET 
    role = 'admin',
    segment = 'investor',
    tier = COALESCE(tier, 'enterprise'),
    membership_tier = COALESCE(membership_tier, 'enterprise'),
    verified = COALESCE(verified, true)
WHERE role = 'admin';

-- Function to update or create profile for a user by email
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Try to update by email if specified (only if profile doesn't exist)
    SELECT id INTO user_id FROM auth.users WHERE email = 'admin@offaxisdeals.com' LIMIT 1;
    IF user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
        INSERT INTO profiles (id, role, segment, tier, membership_tier, verified, created_at)
        VALUES (user_id, 'admin', 'investor', 'enterprise', 'enterprise', true, NOW());
    ELSIF user_id IS NOT NULL THEN
        -- Profile exists, just ensure it's correct
        UPDATE profiles 
        SET 
            role = 'admin',
            segment = 'investor',
            tier = 'enterprise',
            membership_tier = 'enterprise',
            verified = true
        WHERE id = user_id;
    END IF;
    
    -- Update investor.free@test.com
    SELECT id INTO user_id FROM auth.users WHERE email = 'investor.free@test.com' LIMIT 1;
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, role, segment, tier, membership_tier, verified, created_at)
        VALUES (user_id, 'investor', 'investor', 'free', 'free', false, NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'investor', segment = 'investor', tier = 'free', membership_tier = 'free', verified = false;
    END IF;
    
    -- Update investor.basic@test.com
    SELECT id INTO user_id FROM auth.users WHERE email = 'investor.basic@test.com' LIMIT 1;
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, role, segment, tier, membership_tier, verified, created_at)
        VALUES (user_id, 'investor', 'investor', 'basic', 'basic', true, NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'investor', segment = 'investor', tier = 'basic', membership_tier = 'basic', verified = true;
    END IF;
    
    -- Update investor.pro@test.com
    SELECT id INTO user_id FROM auth.users WHERE email = 'investor.pro@test.com' LIMIT 1;
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, role, segment, tier, membership_tier, verified, created_at)
        VALUES (user_id, 'investor', 'investor', 'pro', 'pro', true, NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'investor', segment = 'investor', tier = 'pro', membership_tier = 'pro', verified = true;
    END IF;
    
    -- Update wholesaler.free@test.com
    SELECT id INTO user_id FROM auth.users WHERE email = 'wholesaler.free@test.com' LIMIT 1;
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, role, segment, tier, membership_tier, verified, created_at)
        VALUES (user_id, 'wholesaler', 'wholesaler', 'free', 'free', false, NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'wholesaler', segment = 'wholesaler', tier = 'free', membership_tier = 'free', verified = false;
    END IF;
    
    -- Update wholesaler.basic@test.com
    SELECT id INTO user_id FROM auth.users WHERE email = 'wholesaler.basic@test.com' LIMIT 1;
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, role, segment, tier, membership_tier, verified, created_at)
        VALUES (user_id, 'wholesaler', 'wholesaler', 'basic', 'basic', true, NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'wholesaler', segment = 'wholesaler', tier = 'basic', membership_tier = 'basic', verified = true;
    END IF;
    
    -- Update wholesaler.pro@test.com
    SELECT id INTO user_id FROM auth.users WHERE email = 'wholesaler.pro@test.com' LIMIT 1;
    IF user_id IS NOT NULL THEN
        INSERT INTO profiles (id, role, segment, tier, membership_tier, verified, created_at)
        VALUES (user_id, 'wholesaler', 'wholesaler', 'pro', 'pro', true, NOW())
        ON CONFLICT (id) DO UPDATE SET role = 'wholesaler', segment = 'wholesaler', tier = 'pro', membership_tier = 'pro', verified = true;
    END IF;
END $$;

-- Final safety check: Ensure ALL admin users have correct segment
-- This catches any edge cases that might have been missed
UPDATE profiles 
SET segment = 'investor'
WHERE role = 'admin' AND (segment IS NULL OR segment != 'investor');

-- Verify no invalid admin profiles exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE role = 'admin' AND segment NOT IN ('investor', NULL)
    ) THEN
        RAISE EXCEPTION 'Found admin profile with invalid segment! Fix manually.';
    END IF;
END $$;

-- 10. Create the missing tables for features
CREATE TABLE IF NOT EXISTS user_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    alert_type TEXT DEFAULT 'property',
    criteria JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    watchlist_type TEXT DEFAULT 'property',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES user_watchlists(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(watchlist_id, listing_id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_email TEXT,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_email TEXT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'general' CHECK (type IN ('bug', 'feature_request', 'improvement', 'general')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'in_progress', 'completed', 'rejected')),
    priority TEXT DEFAULT 'medium',
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Enable RLS on new tables
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for new tables
-- User alerts policies
CREATE POLICY "Users can view their own alerts" ON user_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts" ON user_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON user_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON user_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- User watchlists policies
CREATE POLICY "Users can view their own watchlists" ON user_watchlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlists" ON user_watchlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists" ON user_watchlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists" ON user_watchlists
    FOR DELETE USING (auth.uid() = user_id);

-- Watchlist items policies
CREATE POLICY "Users can view their own watchlist items" ON watchlist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_watchlists 
            WHERE id = watchlist_items.watchlist_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own watchlist items" ON watchlist_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_watchlists 
            WHERE id = watchlist_items.watchlist_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own watchlist items" ON watchlist_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_watchlists 
            WHERE id = watchlist_items.watchlist_id 
            AND user_id = auth.uid()
        )
    );

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- User feedback policies
CREATE POLICY "Users can view their own feedback" ON user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON user_feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- 11. Final verification
SELECT 'Final profiles structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

SELECT 'Test profiles created:' as info;
SELECT 
    u.email,
    p.role, 
    p.segment, 
    p.tier, 
    p.membership_tier, 
    p.verified 
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.email LIKE '%@test.com' OR u.email = 'admin@offaxisdeals.com'
ORDER BY p.role, p.tier;

SELECT 'Setup complete! You can now test with these accounts:' as info;
SELECT 
    u.email,
    p.role,
    p.tier,
    CASE 
        WHEN p.role = 'admin' THEN 'Full access to admin dashboard'
        WHEN p.role = 'investor' AND p.tier = 'free' THEN 'Limited investor access'
        WHEN p.role = 'investor' AND p.tier = 'basic' THEN 'Basic investor features'
        WHEN p.role = 'investor' AND p.tier = 'pro' THEN 'Full investor features'
        WHEN p.role = 'wholesaler' AND p.tier = 'free' THEN 'Limited wholesaler access'
        WHEN p.role = 'wholesaler' AND p.tier = 'basic' THEN 'Basic wholesaler features'
        WHEN p.role = 'wholesaler' AND p.tier = 'pro' THEN 'Full wholesaler features'
    END as access_level
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.email LIKE '%@test.com' OR u.email = 'admin@offaxisdeals.com'
ORDER BY p.role, p.tier;
