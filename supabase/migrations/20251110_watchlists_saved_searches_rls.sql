-- Ensure RLS policies for watchlists and saved_searches follow least privilege access

-- Watchlists policies
ALTER TABLE IF EXISTS public.watchlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners select" ON public.watchlists;
DROP POLICY IF EXISTS "watchlists owners modify" ON public.watchlists;

CREATE POLICY "watchlists owners select"
ON public.watchlists
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "watchlists owners modify"
ON public.watchlists
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Saved searches policies
ALTER TABLE IF EXISTS public.saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can insert their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can update their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches owners select" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches owners modify" ON public.saved_searches;

CREATE POLICY "saved_searches owners select"
ON public.saved_searches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "saved_searches owners modify"
ON public.saved_searches
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


