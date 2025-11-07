-- Fix Listings RLS - Add Public Read Access
-- This script ensures all users can READ listings (view them)
-- while maintaining write restrictions for owners only

-- ========================================
-- 1. Check Current Policies
-- ========================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'listings'
ORDER BY policyname;

-- ========================================
-- 2. Create Public Read Policy for Listings
-- ========================================
-- Allow anyone (authenticated or anonymous) to read/listings
-- This is needed for the listings page to work
DROP POLICY IF EXISTS listings_read_all ON listings;
CREATE POLICY listings_read_all ON listings
  FOR SELECT
  USING (true);  -- Allow everyone to read all listings

-- ========================================
-- 3. Ensure Owner Write Policy Exists
-- ========================================
-- Owners can insert, update, delete their own listings
DROP POLICY IF EXISTS listings_owner_write ON listings;
CREATE POLICY listings_owner_write ON listings
  FOR ALL  -- INSERT, UPDATE, DELETE
  USING (
    owner_id = (SELECT auth.uid())
    OR owner_id IS NULL  -- Allow creating new listings
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    OR owner_id IS NULL  -- Allow creating new listings
  );

-- ========================================
-- 4. Verify Policies
-- ========================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Read Access'
    WHEN cmd = 'ALL' THEN '✅ Write Access (Owner)'
    ELSE cmd
  END as access_type
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'listings'
ORDER BY cmd, policyname;

-- ========================================
-- 5. Test Query (should work for any user)
-- ========================================
-- Run this as a logged-in user to test:
-- SELECT COUNT(*) FROM listings;
-- Should return 12 if RLS is working correctly

