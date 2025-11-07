-- Fix Wholesaler Free Account Profile
-- Run this to ensure the free wholesaler account can post deals

-- First, find the user ID for wholesaler.free@test.com
SELECT id, email 
FROM auth.users 
WHERE email = 'wholesaler.free@test.com';

-- Then update the profile to ensure segment and role are set correctly
UPDATE profiles 
SET 
  segment = 'wholesaler',
  role = 'wholesaler',
  tier = 'free',
  type = 'wholesaler',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'wholesaler.free@test.com'
);

-- Verify the update
SELECT 
  p.id,
  au.email,
  p.segment,
  p.role,
  p.tier,
  p.type
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'wholesaler.free@test.com';

