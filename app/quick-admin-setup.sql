-- Quick Admin Setup Script
-- Run this in your Supabase SQL Editor to set up admin access immediately

-- 1. Add missing columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'investor' CHECK (role IN ('wholesaler', 'investor', 'admin')),
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'investor_free',
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Promote your account to admin immediately
UPDATE profiles 
SET 
  role = 'admin', 
  membership_tier = 'enterprise', 
  verified = true,
  full_name = 'Russell Quealy (Admin)'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'russell.quealy@gmail.com'
);

-- 3. If no profile exists, create one
INSERT INTO profiles (id, role, membership_tier, verified, full_name)
SELECT 
  u.id,
  'admin',
  'enterprise',
  true,
  'Russell Quealy (Admin)'
FROM auth.users u
WHERE u.email = 'russell.quealy@gmail.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- 4. Verify the setup worked
SELECT 
  u.id as user_id,
  u.email,
  p.role,
  p.membership_tier,
  p.verified,
  p.full_name,
  '✅ ADMIN SETUP COMPLETE' as status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'russell.quealy@gmail.com';
