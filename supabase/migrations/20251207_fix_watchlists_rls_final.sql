-- Fix RLS policies for watchlists table
-- Created: 2025-12-07
-- Purpose: Ensure authenticated users can manage their own watchlist entries
-- 
-- This migration:
-- 1. Drops all existing conflicting policies
-- 2. Creates clean, consistent policies for SELECT, INSERT, UPDATE, DELETE
-- 3. Ensures policies use auth.uid() = user_id (matching API route logic)
-- 4. Preserves service role access if needed

-- ========================================
-- 1. ENABLE RLS AND DROP CONFLICTING POLICIES
-- ========================================

ALTER TABLE IF EXISTS public.watchlists ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "watchlists_read_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_write_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_select_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_insert_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_update_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_delete_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners select" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners modify" ON public.watchlists;
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON public.watchlists;

-- ========================================
-- 2. CREATE CONSISTENT RLS POLICIES
-- ========================================

-- SELECT: Users can read their own watchlist entries
-- RLS checks: USING (auth.uid() = user_id)
CREATE POLICY "watchlists_select_own"
ON public.watchlists
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can insert watchlist entries for themselves
-- RLS checks: WITH CHECK (auth.uid() = user_id)
-- The API route sets user_id = user.id, so this will pass
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

-- ========================================
-- 3. ENSURE INDEXES EXIST
-- ========================================

-- Indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_property_id ON public.watchlists(property_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_property ON public.watchlists(user_id, property_id);

-- ========================================
-- 4. VERIFY POLICIES WERE CREATED
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

