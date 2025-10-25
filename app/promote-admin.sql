-- Run this SQL in Supabase SQL Editor to promote your account to admin
-- Replace 'your-email@example.com' with your actual email address

-- First, find your user ID
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then promote to admin (replace the UUID with your actual user ID)
-- UPDATE profiles 
-- SET role = 'admin', membership_tier = 'enterprise', verified = true
-- WHERE id = 'your-user-id-here';

-- Or use the function (replace email with your actual email)
-- SELECT promote_to_admin('your-email@example.com');

-- Verify the promotion worked
-- SELECT id, full_name, email, role, membership_tier, verified 
-- FROM profiles 
-- WHERE role = 'admin';
