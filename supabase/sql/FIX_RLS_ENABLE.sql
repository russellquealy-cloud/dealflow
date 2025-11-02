-- 🚨 CRITICAL: Enable RLS on Tables
-- Run this FIRST before any other fixes
-- This enables Row Level Security on critical tables

-- Enable RLS on listings (CRITICAL - currently exposed!)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles (CRITICAL - user data exposed!)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on listing_images
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on subscription_plans (if it exists)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    tablename, 
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('listings', 'profiles', 'listing_images', 'subscription_plans')
ORDER BY tablename;
