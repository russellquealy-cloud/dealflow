-- Get your email's UUID and promote to admin
-- Run this in your Supabase SQL Editor

-- Step 1: Find your user ID by email (replace with your actual email)
-- This will show you your UUID and current profile info
SELECT 
  u.id as user_id,
  u.email,
  p.role,
  p.membership_tier,
  p.verified,
  p.full_name,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';

-- Step 2: Promote your account to admin (replace email with your actual email)
-- This will update your profile to admin status
UPDATE profiles 
SET 
  role = 'admin', 
  membership_tier = 'enterprise', 
  verified = true,
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- Step 3: Log the promotion activity
INSERT INTO user_activity_logs (user_id, activity_type, activity_data)
SELECT 
  u.id,
  'subscription_changed',
  '{"promoted_to": "admin", "by": "system"}'::jsonb
FROM auth.users u
WHERE u.email = 'your-email@example.com';

-- Step 4: Verify the promotion worked
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
WHERE u.email = 'your-email@example.com';

-- Step 5: Show admin dashboard access
SELECT 
  'You now have access to:' as info,
  '🔒 Admin Dashboard (/admin)' as feature_1,
  '📊 Analytics & Metrics' as feature_2,
  '👥 User Management' as feature_3,
  '⚙️ System Settings' as feature_4;
