-- ✅ VERIFY RLS FIXES ARE WORKING (FIXED VERSION)
-- Run this to confirm everything is set up correctly

-- ========================================
-- 1. Check RLS is Enabled on Critical Tables
-- ========================================
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('listings', 'profiles', 'listing_images', 'messages', 'watchlists', 'alerts', 'saved_searches', 'subscriptions', 'subscription_usage')
ORDER BY tablename;

-- ========================================
-- 2. Check RLS Policies Exist
-- ========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    '✅ EXISTS' as policy_status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('messages', 'watchlists', 'alerts', 'saved_searches', 'profiles', 'subscriptions', 'subscription_usage')
ORDER BY tablename, policyname;

-- ========================================
-- 3. Check Indexes Exist
-- ========================================
SELECT 
    tablename,
    indexname,
    CASE WHEN indexdef IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as index_status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
    indexname LIKE 'idx_messages%' 
    OR indexname LIKE 'idx_watchlists%'
    OR indexname LIKE 'idx_alerts%'
    OR indexname LIKE 'idx_saved_searches%'
    OR indexname LIKE 'idx_subscriptions%'
)
ORDER BY tablename, indexname;

-- ========================================
-- 4. Summary
-- ========================================
SELECT 
    '✅ RLS Verification Complete!' as status,
    COUNT(DISTINCT tablename) as tables_with_rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('listings', 'profiles', 'listing_images', 'messages', 'watchlists', 'alerts', 'saved_searches')
AND rowsecurity = true;
