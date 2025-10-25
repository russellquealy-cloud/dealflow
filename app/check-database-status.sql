-- Check database status and admin setup
-- Run this in your Supabase SQL Editor to diagnose issues

-- 1. Check if profiles table has the new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY column_name;

-- 2. Check if subscription_plans table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'subscription_plans'
) as subscription_plans_exists;

-- 3. Check your current profile
SELECT 
  u.id as user_id,
  u.email,
  p.role,
  p.membership_tier,
  p.verified,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'russell.quealy@gmail.com';

-- 4. Check if admin tables exist
SELECT 
  'admin_analytics' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_analytics') as exists
UNION ALL
SELECT 
  'user_activity_logs' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_activity_logs') as exists
UNION ALL
SELECT 
  'subscription_plans' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans') as exists;

-- 5. Count subscription plans (should be 8)
SELECT COUNT(*) as plan_count FROM subscription_plans;
