-- Check Wholesaler Profiles (CORRECTED - email is in auth.users)
-- This query properly joins profiles with auth.users to get email

SELECT
  p.id,
  au.email,  -- Get email from auth.users table
  p.segment,
  p.role,
  p.tier,
  p.subscription_tier,
  p.membership_tier,
  p.type,
  p.created_at
FROM
  profiles AS p
JOIN
  auth.users AS au ON p.id = au.id
WHERE
  p.role = 'wholesaler' 
  OR p.segment = 'wholesaler'
  OR au.email LIKE '%wholesaler%'
ORDER BY au.email;

