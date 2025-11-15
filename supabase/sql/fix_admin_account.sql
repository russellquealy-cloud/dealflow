-- Fix admin account for admin@offaxisdeals.com
-- This script ensures the account has admin role set correctly

-- First, find the user by email
DO $$
DECLARE
  user_id_val UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id_val
  FROM auth.users
  WHERE email = 'admin@offaxisdeals.com'
  LIMIT 1;

  IF user_id_val IS NULL THEN
    RAISE NOTICE 'User with email admin@offaxisdeals.com not found in auth.users';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user ID: %', user_id_val;

  -- Update the profile to ensure role='admin'
  -- Note: segment should be 'investor' or 'wholesaler' due to constraint, but role='admin' identifies admin
  UPDATE profiles
  SET 
    role = 'admin',
    segment = COALESCE(segment, 'investor'), -- Set to valid value if null
    updated_at = NOW()
  WHERE id = user_id_val;

  IF FOUND THEN
    RAISE NOTICE '✅ Updated profile for admin@offaxisdeals.com - role set to admin';
  ELSE
    RAISE NOTICE '⚠️ Profile not found for user ID: %', user_id_val;
    -- Create profile if it doesn't exist
    INSERT INTO profiles (id, role, segment, tier, created_at, updated_at)
    VALUES (user_id_val, 'admin', 'investor', 'free', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'admin',
      segment = 'investor',
      updated_at = NOW();
    RAISE NOTICE '✅ Created profile for admin@offaxisdeals.com';
  END IF;
END $$;

-- Verify the update
SELECT 
  u.email,
  p.id,
  p.role,
  p.segment,
  p.tier,
  CASE 
    WHEN p.role = 'admin' OR p.segment = 'admin' THEN '✅ Admin Access'
    ELSE '❌ Not Admin'
  END as admin_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@offaxisdeals.com';

