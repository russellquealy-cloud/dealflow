-- ⚡ FIX REMAINING RLS POLICIES THAT STILL NEED OPTIMIZATION
-- Based on Security Advisor audit, many policies still use auth.uid() directly
-- This script fixes ALL remaining policies

-- ========================================
-- LISTING_IMAGES TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_images') THEN
    -- Fix listing_images_select_own
    DROP POLICY IF EXISTS listing_images_select_own ON listing_images;
    CREATE POLICY listing_images_select_own ON listing_images
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM listings 
          WHERE id = listing_images.listing_id 
          AND owner_id = (select auth.uid())
        )
      );

    -- Fix listing_images_insert_own
    DROP POLICY IF EXISTS listing_images_insert_own ON listing_images;
    CREATE POLICY listing_images_insert_own ON listing_images
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM listings 
          WHERE id = listing_images.listing_id 
          AND owner_id = (select auth.uid())
        )
      );

    -- Fix listing_images_update_own
    DROP POLICY IF EXISTS listing_images_update_own ON listing_images;
    CREATE POLICY listing_images_update_own ON listing_images
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM listings 
          WHERE id = listing_images.listing_id 
          AND owner_id = (select auth.uid())
        )
      );

    -- Fix listing_images_delete_own
    DROP POLICY IF EXISTS listing_images_delete_own ON listing_images;
    CREATE POLICY listing_images_delete_own ON listing_images
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM listings 
          WHERE id = listing_images.listing_id 
          AND owner_id = (select auth.uid())
        )
      );
  END IF;
END $$;

-- ========================================
-- LISTINGS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'owner_id') THEN
      -- Fix listings_owner_write
      DROP POLICY IF EXISTS listings_owner_write ON listings;
      CREATE POLICY listings_owner_write ON listings
        FOR ALL USING (owner_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- PROFILES TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Fix delete policy
    DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
    CREATE POLICY "Users can delete their own profile" ON profiles
      FOR DELETE USING (id = (select auth.uid()));
  END IF;
END $$;

-- ========================================
-- ORGS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orgs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orgs' AND column_name = 'owner_id') THEN
      -- Recreate with optimized policies
      DROP POLICY IF EXISTS "Users can view orgs they belong to" ON orgs;
      CREATE POLICY "Users can view orgs they belong to" ON orgs
        FOR SELECT USING (
          owner_id = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM org_members 
            WHERE org_id = orgs.id 
            AND user_id = (select auth.uid())
          )
        );

      DROP POLICY IF EXISTS "Owners can manage their orgs" ON orgs;
      CREATE POLICY "Owners can manage their orgs" ON orgs
        FOR ALL USING (owner_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- BUYERS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'buyers') THEN
    -- Fix authenticated users insert
    DROP POLICY IF EXISTS "Authenticated users can insert buyers" ON buyers;
    CREATE POLICY "Authenticated users can insert buyers" ON buyers
      FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

    -- Fix update policy
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can update their own buyers" ON buyers;
      CREATE POLICY "Users can update their own buyers" ON buyers
        FOR UPDATE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- ADMIN_ANALYTICS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_analytics') THEN
    DROP POLICY IF EXISTS "Admins can view all analytics" ON admin_analytics;
    CREATE POLICY "Admins can view all analytics" ON admin_analytics
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (select auth.uid()) 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ========================================
-- ADMIN_METRICS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_metrics') THEN
    DROP POLICY IF EXISTS "Admins can view all metrics" ON admin_metrics;
    CREATE POLICY "Admins can view all metrics" ON admin_metrics
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (select auth.uid()) 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ========================================
-- USER_ACTIVITY_LOGS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_activity_logs') THEN
    -- Fix admins policy
    DROP POLICY IF EXISTS "Admins can view all activity logs" ON user_activity_logs;
    CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (select auth.uid()) 
          AND role = 'admin'
        )
      );

    -- Fix users policy
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_activity_logs' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view own activity logs" ON user_activity_logs;
      CREATE POLICY "Users can view own activity logs" ON user_activity_logs
        FOR SELECT USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- ========================================
-- SYSTEM_SETTINGS TABLE
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
    DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
    CREATE POLICY "Admins can manage system settings" ON system_settings
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (select auth.uid()) 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ========================================
-- OTHER TABLES (if they exist)
-- ========================================

-- CRM Exports
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_exports') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_exports' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can create their own exports" ON crm_exports;
      CREATE POLICY "Users can create their own exports" ON crm_exports
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can view their own exports" ON crm_exports;
      CREATE POLICY "Users can view their own exports" ON crm_exports
        FOR SELECT USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- User Alerts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_alerts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_alerts' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own alerts" ON user_alerts;
      CREATE POLICY "Users can view their own alerts" ON user_alerts
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own alerts" ON user_alerts;
      CREATE POLICY "Users can insert their own alerts" ON user_alerts
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can update their own alerts" ON user_alerts;
      CREATE POLICY "Users can update their own alerts" ON user_alerts
        FOR UPDATE USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can delete their own alerts" ON user_alerts;
      CREATE POLICY "Users can delete their own alerts" ON user_alerts
        FOR DELETE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- Org Members
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'org_members') THEN
    DROP POLICY IF EXISTS "Users can view org members of their orgs" ON org_members;
    CREATE POLICY "Users can view org members of their orgs" ON org_members
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM orgs 
          WHERE id = org_members.org_id 
          AND (owner_id = (select auth.uid()) OR EXISTS (
            SELECT 1 FROM org_members om2 
            WHERE om2.org_id = orgs.id 
            AND om2.user_id = (select auth.uid())
          ))
        )
      );
  END IF;
END $$;

-- Usage Counters
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_counters') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usage_counters' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own usage" ON usage_counters;
      CREATE POLICY "Users can view their own usage" ON usage_counters
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can update their own usage" ON usage_counters;
      CREATE POLICY "Users can update their own usage" ON usage_counters
        FOR UPDATE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- User Watchlists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_watchlists') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_watchlists' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own watchlists" ON user_watchlists;
      CREATE POLICY "Users can view their own watchlists" ON user_watchlists
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own watchlists" ON user_watchlists;
      CREATE POLICY "Users can insert their own watchlists" ON user_watchlists
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can update their own watchlists" ON user_watchlists;
      CREATE POLICY "Users can update their own watchlists" ON user_watchlists
        FOR UPDATE USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can delete their own watchlists" ON user_watchlists;
      CREATE POLICY "Users can delete their own watchlists" ON user_watchlists
        FOR DELETE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- Watchlist Items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'watchlist_items') THEN
    DROP POLICY IF EXISTS "Users can view their own watchlist items" ON watchlist_items;
    CREATE POLICY "Users can view their own watchlist items" ON watchlist_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM user_watchlists 
          WHERE id = watchlist_items.watchlist_id 
          AND user_id = (select auth.uid())
        )
      );

    DROP POLICY IF EXISTS "Users can insert their own watchlist items" ON watchlist_items;
    CREATE POLICY "Users can insert their own watchlist items" ON watchlist_items
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_watchlists 
          WHERE id = watchlist_items.watchlist_id 
          AND user_id = (select auth.uid())
        )
      );

    DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON watchlist_items;
    CREATE POLICY "Users can delete their own watchlist items" ON watchlist_items
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM user_watchlists 
          WHERE id = watchlist_items.watchlist_id 
          AND user_id = (select auth.uid())
        )
      );
  END IF;
END $$;

-- Support Tickets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
      CREATE POLICY "Users can view their own tickets" ON support_tickets
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own tickets" ON support_tickets;
      CREATE POLICY "Users can insert their own tickets" ON support_tickets
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
      CREATE POLICY "Users can update their own tickets" ON support_tickets
        FOR UPDATE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

-- User Feedback
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_feedback') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_feedback' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own feedback" ON user_feedback;
      CREATE POLICY "Users can view their own feedback" ON user_feedback
        FOR SELECT USING (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can insert their own feedback" ON user_feedback;
      CREATE POLICY "Users can insert their own feedback" ON user_feedback
        FOR INSERT WITH CHECK (user_id = (select auth.uid()));

      DROP POLICY IF EXISTS "Users can update their own feedback" ON user_feedback;
      CREATE POLICY "Users can update their own feedback" ON user_feedback
        FOR UPDATE USING (user_id = (select auth.uid()));
    END IF;
  END IF;
END $$;

SELECT '✅ All remaining RLS policies optimized!' as status;
