-- Fix existing data and promote account
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what membership_tier values currently exist
SELECT DISTINCT membership_tier, COUNT(*) as count
FROM profiles 
GROUP BY membership_tier
ORDER BY count DESC;

-- 2. Update any invalid membership_tier values to valid ones
UPDATE profiles 
SET membership_tier = CASE 
  WHEN membership_tier = 'free' THEN 'investor_free'
  WHEN membership_tier = 'basic' THEN 'investor_basic'
  WHEN membership_tier = 'pro' THEN 'investor_pro'
  WHEN membership_tier IS NULL THEN 'investor_free'
  WHEN membership_tier = '' THEN 'investor_free'
  ELSE COALESCE(membership_tier, 'investor_free')
END
WHERE membership_tier NOT IN ('investor_free', 'wholesaler_free', 'investor_basic', 'investor_pro', 'investor_elite', 'wholesaler_basic', 'wholesaler_pro', 'enterprise');

-- 3. Drop the existing constraints if they exist
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;

-- 4. Add the correct role constraint that includes 'admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('wholesaler', 'investor', 'admin'));

-- 5. Add correct membership_tier constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_membership_tier_check 
CHECK (membership_tier IN ('investor_free', 'wholesaler_free', 'investor_basic', 'investor_pro', 'investor_elite', 'wholesaler_basic', 'wholesaler_pro', 'enterprise'));

-- 6. Now promote your account to admin
UPDATE profiles 
SET 
  role = 'admin', 
  membership_tier = 'enterprise', 
  verified = true,
  full_name = 'Russell Quealy (Admin)'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'russell.quealy@gmail.com'
);

-- 7. Verify the promotion worked
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

-- 8. Show all profiles to verify data is clean
SELECT 
  id,
  full_name,
  role,
  membership_tier,
  verified
FROM profiles
ORDER BY role DESC, membership_tier;

-- 9. Show the updated constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND (conname LIKE '%role%' OR conname LIKE '%membership%');
