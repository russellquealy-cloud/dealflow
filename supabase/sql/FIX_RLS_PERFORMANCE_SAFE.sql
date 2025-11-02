-- ⚡ FIX RLS POLICY PERFORMANCE (SAFE VERSION)
-- Wrap all auth.uid() and auth.email() calls in (select ...) to cache results
-- This version only fixes tables that actually exist

-- ========================================
-- MESSAGES TABLE (CRITICAL FOR MESSAGES PAGE!)
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DROP POLICY IF EXISTS "Users can view messages they sent or received or own listing" ON messages;
    
    -- Check if listings table exists and what columns it has
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
      -- Check if listings has owner_id column
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'owner_id') THEN
        CREATE POLICY "Users can view messages they sent or received or own listing" ON messages
          FOR SELECT USING (
            from_id = (select auth.uid())
            OR to_id = (select auth.uid())
            OR EXISTS (
              SELECT 1 FROM listings 
              WHERE id = messages.listing_id 
              AND owner_id = (select auth.uid())
            )
          );
      ELSE
        -- If listings exists but no owner_id, just check messages without listing check
        CREATE POLICY "Users can view messages they sent or received or own listing" ON messages
          FOR SELECT USING (
            from_id = (select auth.uid())
            OR to_id = (select auth.uid())
          );
      END IF;
    ELSE
      -- If listings doesn't exist, just check messages
      CREATE POLICY "Users can view messages they sent or received or own listing" ON messages
        FOR SELECT USING (
          from_id = (select auth.uid())
          OR to_id = (select auth.uid())
        );
    END IF;

    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    CREATE POLICY "Users can send messages" ON messages
      FOR INSERT WITH CHECK (from_id = (select auth.uid()));

    DROP POLICY IF EXISTS "Users can update messages they received" ON messages;
    CREATE POLICY "Users can update messages they received" ON messages
      FOR UPDATE USING (to_id = (select auth.uid()));
  END IF;
END $$;

-- ========================================
-- WATCHLISTS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'watchlists') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'watchlists' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can manage their own watchlists" ON watchlists;
      CREATE POLICY "Users can manage their own watchlists" ON watchlists
        FOR ALL USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- ALERTS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alerts' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can manage their own alerts" ON alerts;
      CREATE POLICY "Users can manage their own alerts" ON alerts
        FOR ALL USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- SAVED_SEARCHES TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_searches' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
      CREATE POLICY "Users can view their own saved searches" ON saved_searches
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own saved searches" ON saved_searches;
      CREATE POLICY "Users can insert their own saved searches" ON saved_searches
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can update their own saved searches" ON saved_searches;
      CREATE POLICY "Users can update their own saved searches" ON saved_searches
        FOR UPDATE USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can delete their own saved searches" ON saved_searches;
      CREATE POLICY "Users can delete their own saved searches" ON saved_searches
        FOR DELETE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- PROFILES TABLE (if it has specific policies that need fixing)
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Fix any policies that use auth.uid() directly
    -- Note: We need to check what policies exist first
    -- This is a safe wrapper that won't break if policies don't exist
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    CREATE POLICY "Users can view their own profile" ON profiles
      FOR SELECT USING (id = (select auth.uid()));

    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    CREATE POLICY "Users can update their own profile" ON profiles
      FOR UPDATE USING (id = (select auth.uid()));

    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    CREATE POLICY "Users can insert their own profile" ON profiles
      FOR INSERT WITH CHECK (id = (select auth.uid()));
  END IF;
END $$;

-- ========================================
-- LISTINGS TABLE (if owner_id or user_id exists)
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
    -- Only fix policies that use auth functions if listings table has owner/user columns
    -- This will be handled by checking existing policies, so we'll just ensure they're optimized
    -- Note: Listings policies are complex and may need manual review
  END IF;
END $$;

-- ========================================
-- SUBSCRIPTIONS TABLE (only if exists)
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
      CREATE POLICY "Users can view their own subscription" ON subscriptions
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own subscription" ON subscriptions;
      CREATE POLICY "Users can insert their own subscription" ON subscriptions
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;
      CREATE POLICY "Users can update their own subscription" ON subscriptions
        FOR UPDATE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- SUBSCRIPTION_USAGE TABLE (only if exists)
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_usage') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_usage' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own usage" ON subscription_usage;
      CREATE POLICY "Users can view their own usage" ON subscription_usage
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own usage" ON subscription_usage;
      CREATE POLICY "Users can insert their own usage" ON subscription_usage
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can update their own usage" ON subscription_usage;
      CREATE POLICY "Users can update their own usage" ON subscription_usage
        FOR UPDATE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- OTHER TABLES (only if they exist)
-- ========================================

-- Contact logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contact_logs' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own contact logs" ON contact_logs;
      CREATE POLICY "Users can view their own contact logs" ON contact_logs
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own contact logs" ON contact_logs;
      CREATE POLICY "Users can insert their own contact logs" ON contact_logs
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- AI Analysis logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_analysis_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_analysis_logs' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own AI analysis logs" ON ai_analysis_logs;
      CREATE POLICY "Users can view their own AI analysis logs" ON ai_analysis_logs
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own AI analysis logs" ON ai_analysis_logs;
      CREATE POLICY "Users can insert their own AI analysis logs" ON ai_analysis_logs
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

SELECT '✅ RLS Performance fixes applied (safe version)!' as status;
