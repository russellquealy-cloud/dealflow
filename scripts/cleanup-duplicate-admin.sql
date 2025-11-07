-- Cleanup Duplicate Admin Account
-- This script identifies and optionally removes the system/test admin account
-- while keeping the real admin account (Russell Quealy)

-- First, check which admin account has actual user data
SELECT 
  id,
  full_name,
  email,
  phone,
  company_name,
  role,
  segment,
  tier,
  created_at,
  updated_at,
  CASE 
    WHEN full_name IS NOT NULL OR phone IS NOT NULL OR company_name IS NOT NULL 
    THEN 'Real Account' 
    ELSE 'System/Test Account' 
  END as account_type
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- Option 1: Delete the system/test admin account (2157d77d-83b9-4214-b698-3b12ebf18792)
-- Only run this if you're sure it's not needed
-- DELETE FROM profiles WHERE id = '2157d77d-83b9-4214-b698-3b12ebf18792';

-- Option 2: Convert it to a regular investor account instead of deleting
-- UPDATE profiles 
-- SET role = 'investor',
--     segment = 'investor',
--     tier = 'free',
--     type = 'investor',
--     updated_at = NOW()
-- WHERE id = '2157d77d-83b9-4214-b698-3b12ebf18792';

-- Option 3: Keep both but mark the system one clearly
-- UPDATE profiles 
-- SET full_name = 'System Admin (Auto-created)',
--     updated_at = NOW()
-- WHERE id = '2157d77d-83b9-4214-b698-3b12ebf18792';

