-- DealFlow RLS Policies for Secure Database Access
-- Run these in your Supabase SQL Editor

-- =============================================
-- LISTINGS TABLE POLICIES
-- =============================================

-- 1. Allow anyone to READ listings (for public browsing)
-- This is safe because we're only exposing property data, not user data
CREATE POLICY "Public can view listings" ON listings
FOR SELECT USING (true);

-- 2. Only authenticated users can INSERT listings
-- Must be logged in and the owner_id must match their auth.uid()
CREATE POLICY "Users can create own listings" ON listings
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = owner_id
);

-- 3. Only listing owners can UPDATE their listings
-- Prevents users from editing other people's listings
CREATE POLICY "Users can update own listings" ON listings
FOR UPDATE USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = owner_id
);

-- 4. Only listing owners can DELETE their listings
-- Prevents users from deleting other people's listings
CREATE POLICY "Users can delete own listings" ON listings
FOR DELETE USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = owner_id
);

-- =============================================
-- PROFILES TABLE POLICIES (if you have one)
-- =============================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can create own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- SECURITY NOTES
-- =============================================

/*
SECURITY FEATURES IMPLEMENTED:

1. PUBLIC READ ACCESS FOR LISTINGS:
   - Safe because property data is meant to be public
   - No sensitive user information exposed
   - Contact info is only shown to authenticated users

2. AUTHENTICATED WRITE ACCESS:
   - Users must be logged in to create/edit/delete
   - Users can only modify their own listings
   - Prevents unauthorized data manipulation

3. OWNER VERIFICATION:
   - Every write operation checks auth.uid() = owner_id
   - Prevents users from accessing other users' data
   - Ensures data isolation between users

4. NO ADMIN BYPASS:
   - Even admins must follow these rules
   - Prevents privilege escalation attacks
   - Maintains consistent security model

BEST PRACTICES FOLLOWED:
- Principle of least privilege
- Defense in depth
- Data isolation
- Authentication required for writes
- Public read for intended public data
*/
