-- Ensure RLS policies for watchlists are correct and idempotent

ALTER TABLE IF EXISTS public.watchlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "watchlists_read_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_write_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_update_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists_delete_own" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners select" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners modify" ON public.watchlists;
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON public.watchlists;

-- Create new policies
CREATE POLICY "watchlists_read_own"
ON public.watchlists
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "watchlists_write_own"
ON public.watchlists
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlists_update_own"
ON public.watchlists
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlists_delete_own"
ON public.watchlists
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON public.watchlists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_listing ON public.watchlists(property_id);

