-- EMERGENCY: Restore Russell's admin access
-- Run this IMMEDIATELY in Supabase SQL Editor

UPDATE profiles 
SET 
  role = 'admin',
  membership_tier = 'enterprise',
  verified = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'russell.quealy@gmail.com'
);

-- Verify the restore worked
SELECT 
  u.email,
  p.role,
  p.membership_tier,
  '✅ ADMIN ACCESS RESTORED' as status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'russell.quealy@gmail.com';
