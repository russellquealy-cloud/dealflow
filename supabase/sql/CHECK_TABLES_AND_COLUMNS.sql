-- 🔍 CHECK WHAT TABLES AND COLUMNS ACTUALLY EXIST
-- Run this first to see what your database actually has

-- Check which tables exist
SELECT 
    table_name,
    CASE WHEN table_name IN (
        'subscriptions', 'subscription_usage', 'contact_logs', 'ai_analysis_logs',
        'messages', 'watchlists', 'alerts', 'saved_searches', 'profiles',
        'listings', 'orgs', 'org_members', 'usage_counters', 'user_alerts',
        'user_watchlists', 'watchlist_items', 'support_tickets', 'user_feedback',
        'crm_exports', 'buyers', 'admin_analytics', 'admin_metrics',
        'system_settings', 'user_activity_logs'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'subscriptions', 'subscription_usage', 'contact_logs', 'ai_analysis_logs',
    'messages', 'watchlists', 'alerts', 'saved_searches', 'profiles',
    'listings', 'orgs', 'org_members', 'usage_counters', 'user_alerts',
    'user_watchlists', 'watchlist_items', 'support_tickets', 'user_feedback',
    'crm_exports', 'buyers', 'admin_analytics', 'admin_metrics',
    'system_settings', 'user_activity_logs'
)
ORDER BY table_name;

-- Check which columns exist on key tables
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('subscriptions', 'subscription_usage', 'contact_logs', 'ai_analysis_logs', 'messages', 'watchlists', 'alerts', 'saved_searches')
AND column_name IN ('user_id', 'owner_id', 'from_id', 'to_id', 'id')
ORDER BY table_name, column_name;

SELECT '✅ Check complete! Review the results above.' as status;
