-- Fix admin constraint and promote account
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname LIKE '%role%';

-- 2. Drop the existing role constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3. Add the correct role constraint that includes 'admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('wholesaler', 'investor', 'admin'));

-- 4. Also fix the membership_tier constraint if needed
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;

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

-- 8. Show the updated constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND (conname LIKE '%role%' OR conname LIKE '%membership%');
