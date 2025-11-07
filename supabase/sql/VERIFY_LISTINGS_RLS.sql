-- Verify Listings RLS Policies and Test Access
-- Run this to check if listings are accessible

-- ========================================
-- 1. Check RLS is Enabled
-- ========================================
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'listings';

-- ========================================
-- 2. List All Policies on Listings
-- ========================================
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Read Access'
    WHEN cmd = 'ALL' THEN '✅ Write Access'
    ELSE cmd
  END as access_type,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'listings'
ORDER BY cmd, policyname;

-- ========================================
-- 3. Test Query (should return 12 listings)
-- ========================================
-- This simulates what the app is doing
SELECT COUNT(*) as total_listings_with_coords
FROM listings
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL;

-- ========================================
-- 4. Check if policy allows anonymous access
-- ========================================
-- The listings_read_all policy should allow:
-- USING (true) - which means anyone can read

SELECT 
  'Current policies allow:' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'listings' 
        AND cmd = 'SELECT' 
        AND qual = 'true'
    ) THEN '✅ Public read access'
    ELSE '❌ No public read access'
  END as read_access_status;

