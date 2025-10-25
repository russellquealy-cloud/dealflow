-- Get your email's UUID
-- Replace 'your-email@example.com' with your actual email address

SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  p.role,
  p.membership_tier,
  p.verified,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';
