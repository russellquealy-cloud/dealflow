-- Fix RLS policies for watchlists and listing views
-- Created: 2025-12-07
-- Purpose: 
-- 1. Fix watchlists RLS to allow authenticated users to manage their own watchlist entries
-- 2. Add RLS policy to allow authenticated users to increment listing view counts

-- ========================================
-- 1. FIX WATCHLISTS RLS POLICIES
-- ========================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.watchlists ENABLE ROW LEVEL SECURITY;

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "watchlists_read_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_write_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_update_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_delete_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners select" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners modify" ON public.watchlists;
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON public.watchlists;

-- Create comprehensive policies for watchlists
-- SELECT: Users can read their own watchlist entries
CREATE POLICY "watchlists_select_own"
ON public.watchlists
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can insert watchlist entries for themselves
CREATE POLICY "watchlists_insert_own"
ON public.watchlists
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own watchlist entries (if needed in future)
CREATE POLICY "watchlists_update_own"
ON public.watchlists
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own watchlist entries
CREATE POLICY "watchlists_delete_own"
ON public.watchlists
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_property_id ON public.watchlists(property_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_property ON public.watchlists(user_id, property_id);

-- ========================================
-- 2. FIX LISTING VIEWS UPDATE RLS
-- ========================================

-- Create a secure Postgres function to increment listing views
-- This function runs with SECURITY DEFINER to bypass RLS, but only allows
-- incrementing the views column on live listings, preventing abuse
CREATE OR REPLACE FUNCTION public.increment_listing_view(listing_uuid UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_view_count INTEGER;
BEGIN
  -- Atomically increment views only for live listings
  UPDATE public.listings 
  SET views = COALESCE(views, 0) + 1,
      updated_at = NOW()
  WHERE id = listing_uuid 
    AND status = 'live'
  RETURNING views INTO new_view_count;
  
  -- Return the new view count (or 0 if listing not found/not live)
  RETURN COALESCE(new_view_count, 0);
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.increment_listing_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_view(UUID) TO anon;

-- Add comment explaining the function
COMMENT ON FUNCTION public.increment_listing_view(UUID) IS 
  'Safely increments the view count for a live listing. Only updates the views column and only for listings with status = ''live''. Returns the new view count.';

-- ========================================
-- 3. VERIFY POLICIES
-- ========================================

-- Check watchlists policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'watchlists' 
    AND policyname = 'watchlists_insert_own'
  ) THEN
    RAISE EXCEPTION 'Failed to create watchlists_insert_own policy';
  END IF;
  
  RAISE NOTICE '✅ Watchlists RLS policies created successfully';
END $$;

-- Check listings view increment function
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'increment_listing_view' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE EXCEPTION 'Failed to create increment_listing_view function';
  END IF;
  
  RAISE NOTICE '✅ Listings view increment function created successfully';
END $$;

