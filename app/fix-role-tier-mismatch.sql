-- Fix role and membership tier mismatch
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what we're working with
SELECT 
  role,
  membership_tier,
  COUNT(*) as count
FROM profiles 
GROUP BY role, membership_tier
ORDER BY role, membership_tier;

-- 2. Drop the existing constraints first (so we can update data)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;

-- 3. Update membership_tier to match the role appropriately
UPDATE profiles 
SET membership_tier = CASE 
  -- For investors
  WHEN role = 'investor' AND membership_tier = 'free' THEN 'investor_free'
  WHEN role = 'investor' AND membership_tier = 'basic' THEN 'investor_basic'
  WHEN role = 'investor' AND membership_tier = 'pro' THEN 'investor_pro'
  WHEN role = 'investor' AND (membership_tier IS NULL OR membership_tier = '' OR membership_tier NOT IN ('investor_free', 'investor_basic', 'investor_pro', 'investor_elite', 'enterprise')) THEN 'investor_free'
  
  -- For wholesalers
  WHEN role = 'wholesaler' AND membership_tier = 'free' THEN 'wholesaler_free'
  WHEN role = 'wholesaler' AND membership_tier = 'basic' THEN 'wholesaler_basic'
  WHEN role = 'wholesaler' AND membership_tier = 'pro' THEN 'wholesaler_pro'
  WHEN role = 'wholesaler' AND (membership_tier IS NULL OR membership_tier = '' OR membership_tier NOT IN ('wholesaler_free', 'wholesaler_basic', 'wholesaler_pro', 'enterprise')) THEN 'wholesaler_free'
  
  -- For admin (will be set later)
  WHEN role = 'admin' THEN 'enterprise'
  
  -- Default fallback based on role
  WHEN role = 'investor' THEN 'investor_free'
  WHEN role = 'wholesaler' THEN 'wholesaler_free'
  
  -- Ultimate fallback
  ELSE 'investor_free'
END;

-- 4. Now add the correct constraints
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('wholesaler', 'investor', 'admin'));

ALTER TABLE profiles ADD CONSTRAINT profiles_membership_tier_check 
CHECK (membership_tier IN ('investor_free', 'wholesaler_free', 'investor_basic', 'investor_pro', 'investor_elite', 'wholesaler_basic', 'wholesaler_pro', 'enterprise'));

-- 5. Now promote your account to admin
UPDATE profiles 
SET 
  role = 'admin', 
  membership_tier = 'enterprise', 
  verified = true,
  full_name = 'Russell Quealy (Admin)'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'russell.quealy@gmail.com'
);

-- 6. Verify the promotion worked
SELECT 
  u.id as user_id,
  u.email,
  p.role,
  p.membership_tier,
  p.verified,
  p.full_name,
  '✅ ADMIN PROMOTION SUCCESSFUL' as status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'russell.quealy@gmail.com';

-- 7. Show all profiles to verify data is clean
SELECT 
  id,
  full_name,
  role,
  membership_tier,
  verified,
  CASE 
    WHEN role = 'investor' AND membership_tier LIKE 'investor_%' THEN '✅ Match'
    WHEN role = 'wholesaler' AND membership_tier LIKE 'wholesaler_%' THEN '✅ Match'
    WHEN role = 'admin' AND membership_tier = 'enterprise' THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as role_tier_match
FROM profiles
ORDER BY role DESC, membership_tier;

-- 8. Show final role/tier distribution
SELECT 
  role,
  membership_tier,
  COUNT(*) as count
FROM profiles 
GROUP BY role, membership_tier
ORDER BY role, membership_tier;
