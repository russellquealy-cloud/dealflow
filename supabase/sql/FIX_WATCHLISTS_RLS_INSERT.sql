-- Fix RLS policies for watchlists table to allow authenticated users to insert
-- This ensures users can add listings to their watchlist

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.watchlists ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "watchlists_read_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_write_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_update_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_delete_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners select" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners modify" ON public.watchlists;
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON public.watchlists;

-- Create explicit policies for each operation
-- SELECT: Users can view their own watchlists
CREATE POLICY "watchlists_read_own"
ON public.watchlists
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can add listings to their own watchlist
-- CRITICAL: Must use WITH CHECK for INSERT operations
CREATE POLICY "watchlists_write_own"
ON public.watchlists
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own watchlists
CREATE POLICY "watchlists_update_own"
ON public.watchlists
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can remove listings from their own watchlist
CREATE POLICY "watchlists_delete_own"
ON public.watchlists
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'watchlists'
ORDER BY policyname;

