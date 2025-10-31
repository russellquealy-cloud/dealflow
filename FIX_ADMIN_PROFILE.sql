-- Quick fix for admin profile constraint issue
-- Run this FIRST, then run SETUP_PROFILES_AND_TESTING.sql

-- 1. Drop the constraint temporarily
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_segment_check;

-- 2. Fix the specific admin user
UPDATE profiles 
SET segment = 'investor'
WHERE id = 'bf2050bb-b192-4a32-9f62-f57abad82ea7';

-- 3. Fix ALL admin users
UPDATE profiles 
SET segment = 'investor'
WHERE role = 'admin' AND (segment IS NULL OR segment != 'investor');

-- 4. Re-add the constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_segment_check 
CHECK (segment IS NULL OR segment IN ('wholesaler', 'investor'));

-- 5. Verify the fix
SELECT id, role, segment, tier, membership_tier 
FROM profiles 
WHERE id = 'bf2050bb-b192-4a32-9f62-f57abad82ea7';

-- 6. Check for any triggers that might interfere
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

