-- SQL script to fix profile inconsistencies
-- Run this in Supabase SQL Editor

-- Fix 1: Admin users - keep role=admin but set segment to 'investor' (since segment constraint doesn't allow 'admin')
-- Admin users are identified by role='admin', not by segment
UPDATE profiles 
SET segment = 'investor',  -- Set to valid value for constraint, but role='admin' takes precedence
    role = 'admin',
    type = 'admin',
    updated_at = NOW()
WHERE role = 'admin';

-- Fix 2: Ensure segment matches role (for non-admin users)
UPDATE profiles 
SET segment = role,
    updated_at = NOW()
WHERE role IS NOT NULL 
  AND role != 'admin'
  AND (segment IS NULL OR segment != role);

-- Fix 3: If segment exists but role doesn't, copy segment to role
UPDATE profiles 
SET role = segment,
    updated_at = NOW()
WHERE segment IS NOT NULL 
  AND (role IS NULL OR (role != segment AND segment != 'admin'));

-- Fix 4: Set missing tier (default to free)
UPDATE profiles 
SET tier = COALESCE(
  LOWER(subscription_tier),
  LOWER(membership_tier),
  'free'
),
updated_at = NOW()
WHERE tier IS NULL;

-- Fix 5: Ensure type matches segment (for backward compatibility)
UPDATE profiles 
SET type = segment,
    updated_at = NOW()
WHERE segment IS NOT NULL 
  AND (type IS NULL OR type != segment);

-- Specific fixes for known accounts from CSV

-- Fix free wholesaler account (d2a0b594-5bad-4280-9582-e5bfaedd388d)
UPDATE profiles 
SET segment = 'wholesaler',
    role = 'wholesaler',
    tier = 'free',
    type = 'wholesaler',
    updated_at = NOW()
WHERE id = 'd2a0b594-5bad-4280-9582-e5bfaedd388d';

-- Fix admin account (2157d77d-83b9-4214-b698-3b12ebf18792)
-- Admin users: role='admin' but segment must be 'investor' or 'wholesaler' due to constraint
UPDATE profiles 
SET segment = 'investor',  -- Valid value for constraint
    role = 'admin',        -- This identifies them as admin
    tier = 'enterprise',
    type = 'admin',
    updated_at = NOW()
WHERE id = '2157d77d-83b9-4214-b698-3b12ebf18792';

-- Fix Russell Quealy admin account (bf2050bb-b192-4a32-9f62-f57abad82ea7)
-- Admin users: role='admin' but segment must be 'investor' or 'wholesaler' due to constraint
UPDATE profiles 
SET segment = 'investor',  -- Valid value for constraint
    role = 'admin',        -- This identifies them as admin
    tier = 'enterprise',
    type = 'admin',
    updated_at = NOW()
WHERE id = 'bf2050bb-b192-4a32-9f62-f57abad82ea7';

-- Verify the fixes
SELECT 
  id,
  role,
  segment,
  tier,
  type,
  CASE 
    WHEN role = 'admin' AND segment = 'admin' THEN '✅'
    WHEN segment IS NOT NULL AND segment = role AND tier IS NOT NULL THEN '✅'
    ELSE '⚠️'
  END as status
FROM profiles
ORDER BY id;

