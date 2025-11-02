-- ⚡ FIX RLS POLICY PERFORMANCE
-- Wrap all auth.uid() and auth.email() calls in (select ...) to cache results
-- This prevents re-evaluation for every row, dramatically improving performance

-- ========================================
-- SUBSCRIPTIONS TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
CREATE POLICY "Users can view their own subscription" ON subscriptions
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own subscription" ON subscriptions;
CREATE POLICY "Users can insert their own subscription" ON subscriptions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;
CREATE POLICY "Users can update their own subscription" ON subscriptions
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ========================================
-- SUBSCRIPTION_USAGE TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can view their own usage" ON subscription_usage;
CREATE POLICY "Users can view their own usage" ON subscription_usage
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own usage" ON subscription_usage;
CREATE POLICY "Users can insert their own usage" ON subscription_usage
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own usage" ON subscription_usage;
CREATE POLICY "Users can update their own usage" ON subscription_usage
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ========================================
-- CONTACT_LOGS TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can view their own contact logs" ON contact_logs;
CREATE POLICY "Users can view their own contact logs" ON contact_logs
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own contact logs" ON contact_logs;
CREATE POLICY "Users can insert their own contact logs" ON contact_logs
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ========================================
-- AI_ANALYSIS_LOGS TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can view their own AI analysis logs" ON ai_analysis_logs;
CREATE POLICY "Users can view their own AI analysis logs" ON ai_analysis_logs
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own AI analysis logs" ON ai_analysis_logs;
CREATE POLICY "Users can insert their own AI analysis logs" ON ai_analysis_logs
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ========================================
-- ADMIN TABLES
-- ========================================
DROP POLICY IF EXISTS "Admins can view all analytics" ON admin_analytics;
CREATE POLICY "Admins can view all analytics" ON admin_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all metrics" ON admin_metrics;
CREATE POLICY "Admins can view all metrics" ON admin_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ========================================
-- USER_ACTIVITY_LOGS TABLE
-- ========================================
DROP POLICY IF EXISTS "Admins can view all activity logs" ON user_activity_logs;
CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view own activity logs" ON user_activity_logs;
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
  FOR SELECT USING (user_id = (select auth.uid()));

-- ========================================
-- SYSTEM_SETTINGS TABLE
-- ========================================
DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ========================================
-- BUYERS TABLE
-- ========================================
DROP POLICY IF EXISTS "Authenticated users can insert buyers" ON buyers;
CREATE POLICY "Authenticated users can insert buyers" ON buyers
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own buyers" ON buyers;
CREATE POLICY "Users can update their own buyers" ON buyers
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ========================================
-- ORGS TABLE
-- ========================================
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
DROP POLICY IF EXISTS "Org owners can manage members" ON orgs; -- Remove duplicate
CREATE POLICY "Owners can manage their orgs" ON orgs
  FOR ALL USING (owner_id = (select auth.uid()));

-- ========================================
-- ORG_MEMBERS TABLE
-- ========================================
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

-- ========================================
-- CRM_EXPORTS TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can create their own exports" ON crm_exports;
CREATE POLICY "Users can create their own exports" ON crm_exports
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own exports" ON crm_exports;
CREATE POLICY "Users can view their own exports" ON crm_exports
  FOR SELECT USING (user_id = (select auth.uid()));

-- ========================================
-- USER_ALERTS TABLE
-- ========================================
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

-- ========================================
-- USAGE_COUNTERS TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can view their own usage" ON usage_counters;
CREATE POLICY "Users can view their own usage" ON usage_counters
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own usage" ON usage_counters;
CREATE POLICY "Users can update their own usage" ON usage_counters
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ========================================
-- WATCHLISTS TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can manage their own watchlists" ON watchlists;
CREATE POLICY "Users can manage their own watchlists" ON watchlists
  FOR ALL USING (user_id = (select auth.uid()));

-- ========================================
-- ALERTS TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can manage their own alerts" ON alerts;
CREATE POLICY "Users can manage their own alerts" ON alerts
  FOR ALL USING (user_id = (select auth.uid()));

-- ========================================
-- USER_WATCHLISTS TABLE
-- ========================================
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

-- ========================================
-- WATCHLIST_ITEMS TABLE
-- ========================================
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

-- ========================================
-- SUPPORT_TICKETS TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own tickets" ON support_tickets;
CREATE POLICY "Users can insert their own tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
CREATE POLICY "Users can update their own tickets" ON support_tickets
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ========================================
-- USER_FEEDBACK TABLE
-- ========================================
DROP POLICY IF EXISTS "Users can view their own feedback" ON user_feedback;
CREATE POLICY "Users can view their own feedback" ON user_feedback
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own feedback" ON user_feedback;
CREATE POLICY "Users can insert their own feedback" ON user_feedback
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own feedback" ON user_feedback;
CREATE POLICY "Users can update their own feedback" ON user_feedback
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ========================================
-- MESSAGES TABLE (CRITICAL FOR MESSAGES PAGE!)
-- ========================================
DROP POLICY IF EXISTS "Users can view messages they sent or received or own listing" ON messages;
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

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (from_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update messages they received" ON messages;
CREATE POLICY "Users can update messages they received" ON messages
  FOR UPDATE USING (to_id = (select auth.uid()));

-- ========================================
-- SAVED_SEARCHES TABLE
-- ========================================
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

SELECT '✅ RLS Performance fixes applied!' as status;
