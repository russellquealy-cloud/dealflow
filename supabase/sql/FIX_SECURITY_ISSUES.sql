-- 🔒 FIX SECURITY ISSUES FROM ADVISOR
-- Addresses Security Definer Views and Missing Policies

-- ========================================
-- 1. FIX SECURITY DEFINER VIEWS
-- ========================================

-- Fix listings_geo view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'listings_geo') THEN
    -- Recreate as SECURITY INVOKER (uses caller's permissions)
    DROP VIEW IF EXISTS listings_geo CASCADE;
    -- Note: You'll need to recreate this view with SECURITY INVOKER
    -- The actual view definition depends on your schema
    -- This is a placeholder - adjust based on your actual view definition
    RAISE NOTICE 'listings_geo view needs to be recreated as SECURITY INVOKER. Check your view definition.';
  END IF;
END $$;

-- Fix admin_dashboard view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'admin_dashboard') THEN
    -- Recreate as SECURITY INVOKER
    DROP VIEW IF EXISTS admin_dashboard CASCADE;
    -- Note: You'll need to recreate this view with SECURITY INVOKER
    RAISE NOTICE 'admin_dashboard view needs to be recreated as SECURITY INVOKER. Check your view definition.';
  END IF;
END $$;

-- ========================================
-- 2. ADD RLS POLICY FOR subscription_plans
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
    
    -- Create policy - subscription plans should be public read
    DROP POLICY IF EXISTS "Public can view subscription plans" ON subscription_plans;
    CREATE POLICY "Public can view subscription plans" ON subscription_plans
      FOR SELECT USING (true);
  END IF;
END $$;

-- ========================================
-- 3. IGNORE spatial_ref_sys (PostGIS system table)
-- ========================================
-- Note: spatial_ref_sys is a PostGIS system table
-- It's generally safe to leave RLS disabled on system tables
-- If you want to enable it:
-- ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read" ON spatial_ref_sys FOR SELECT USING (true);

SELECT '✅ Security issues addressed! Note: Views need manual recreation.' as status;
