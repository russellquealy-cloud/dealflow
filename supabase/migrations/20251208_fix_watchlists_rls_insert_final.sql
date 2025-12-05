-- Fix RLS policies for watchlists INSERT operations
-- Created: 2025-12-08
-- Purpose: Ensure authenticated users can INSERT their own watchlist entries
-- 
-- This migration fixes the INSERT policy to ensure it works correctly with
-- both cookie-based auth and bearer token auth (when session is properly set).
--
-- CRITICAL: The API route must set user_id = auth.uid() when inserting,
-- and the session must be set on the Supabase client for RLS to access auth.uid()

-- ========================================
-- 1. ENABLE RLS (IDEMPOTENT)
-- ========================================

ALTER TABLE IF EXISTS public.watchlists ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. DROP EXISTING POLICIES (CLEAN SLATE)
-- ========================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "watchlists_read_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_write_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_select_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_insert_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_update_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_delete_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners select" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners modify" ON public.watchlists;
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_service_role_all" ON public.watchlists;

-- ========================================
-- 3. CREATE CONSISTENT RLS POLICIES
-- ========================================

-- SELECT: Users can read their own watchlist entries
-- RLS checks: USING (auth.uid() = user_id)
-- This allows users to see only their own saved listings
CREATE POLICY "watchlists_select_own"
ON public.watchlists
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can insert watchlist entries for themselves
-- RLS checks: WITH CHECK (auth.uid() = user_id)
-- CRITICAL: The API route MUST set user_id = user.id (which equals auth.uid())
-- for this policy to pass. The API route must also have the session set on the
-- Supabase client (either via cookies or via setSession() after bearer token auth).
CREATE POLICY "watchlists_insert_own"
ON public.watchlists
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own watchlist entries (if needed in future)
-- RLS checks: USING (for existing rows) and WITH CHECK (for updated rows)
CREATE POLICY "watchlists_update_own"
ON public.watchlists
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own watchlist entries
-- RLS checks: USING (auth.uid() = user_id)
CREATE POLICY "watchlists_delete_own"
ON public.watchlists
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role policy (for admin operations, background jobs, etc.)
-- This bypasses RLS for trusted server-side operations
CREATE POLICY "watchlists_service_role_all"
ON public.watchlists
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- 4. ENSURE INDEXES EXIST
-- ========================================

-- Indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_property_id ON public.watchlists(property_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_property ON public.watchlists(user_id, property_id);

-- ========================================
-- 5. VERIFY POLICIES WERE CREATED
-- ========================================

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
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'watchlists' 
    AND policyname = 'watchlists_select_own'
  ) THEN
    RAISE EXCEPTION 'Failed to create watchlists_select_own policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'watchlists' 
    AND policyname = 'watchlists_delete_own'
  ) THEN
    RAISE EXCEPTION 'Failed to create watchlists_delete_own policy';
  END IF;
  
  RAISE NOTICE '✅ Watchlists RLS policies created successfully';
END $$;

