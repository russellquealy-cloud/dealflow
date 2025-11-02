-- 🔍 ADD MISSING FOREIGN KEY INDEXES
-- These indexes dramatically improve join performance

-- Critical for messages page performance
CREATE INDEX IF NOT EXISTS idx_messages_to_id ON messages(to_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

-- Critical for watchlists
CREATE INDEX IF NOT EXISTS idx_watchlists_property_id ON watchlists(property_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

-- Critical for orgs
CREATE INDEX IF NOT EXISTS idx_orgs_owner_id ON orgs(owner_id);

-- Other important indexes
CREATE INDEX IF NOT EXISTS idx_crm_exports_org_id ON crm_exports(org_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON system_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_listing_id ON watchlist_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

SELECT '✅ Missing indexes added!' as status;
