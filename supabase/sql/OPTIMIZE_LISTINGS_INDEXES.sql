-- ⚡ OPTIMIZE LISTINGS TABLE INDEXES
-- These indexes will dramatically improve query performance
-- Updated to match your actual table schema (verified columns)
-- Run this after upgrading to Supabase Pro for best results

-- ========================================
-- SPATIAL INDEXES (for map queries)
-- ========================================
-- Ensure PostGIS extension is enabled (should already be enabled)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Index for spatial queries (latitude/longitude)
-- This speeds up map bounds filtering significantly
CREATE INDEX IF NOT EXISTS idx_listings_geom 
ON listings USING GIST (ST_MakePoint(longitude, latitude));

-- Use existing geom column if available (PostGIS)
-- This is even faster than ST_MakePoint
CREATE INDEX IF NOT EXISTS idx_listings_geom_column 
ON listings USING GIST (geom) WHERE geom IS NOT NULL;

-- ========================================
-- COLUMN INDEXES (for filtering and sorting)
-- ========================================

-- Featured listings (most common sort - HIGH PRIORITY)
CREATE INDEX IF NOT EXISTS idx_listings_featured_created 
ON listings (featured DESC NULLS LAST, created_at DESC);

-- Price range filtering (HIGH PRIORITY)
CREATE INDEX IF NOT EXISTS idx_listings_price 
ON listings (price) WHERE price IS NOT NULL;

-- ARV filtering (for investment analysis)
CREATE INDEX IF NOT EXISTS idx_listings_arv 
ON listings (arv) WHERE arv IS NOT NULL;

-- Location filtering (city/state - HIGH PRIORITY)
CREATE INDEX IF NOT EXISTS idx_listings_location 
ON listings (state, city) WHERE state IS NOT NULL AND city IS NOT NULL;

-- Bedrooms filtering (beds OR bedrooms - both exist)
CREATE INDEX IF NOT EXISTS idx_listings_beds 
ON listings (beds) WHERE beds IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_bedrooms 
ON listings (bedrooms) WHERE bedrooms IS NOT NULL;

-- Bathrooms filtering (baths OR bathrooms - both exist)
CREATE INDEX IF NOT EXISTS idx_listings_baths 
ON listings (baths) WHERE baths IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_bathrooms 
ON listings (bathrooms) WHERE bathrooms IS NOT NULL;

-- Square footage filtering (sqft OR home_sqft - both exist)
CREATE INDEX IF NOT EXISTS idx_listings_sqft 
ON listings (sqft) WHERE sqft IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_home_sqft 
ON listings (home_sqft) WHERE home_sqft IS NOT NULL;

-- Lot size filtering
CREATE INDEX IF NOT EXISTS idx_listings_lot_size 
ON listings (lot_size) WHERE lot_size IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_lot_sqft 
ON listings (lot_sqft) WHERE lot_sqft IS NOT NULL;

-- Created date (for sorting by newest - HIGH PRIORITY)
CREATE INDEX IF NOT EXISTS idx_listings_created_at 
ON listings (created_at DESC);

-- Owner ID (for "My Listings" queries - HIGH PRIORITY)
CREATE INDEX IF NOT EXISTS idx_listings_owner_id 
ON listings (owner_id) WHERE owner_id IS NOT NULL;

-- Status filtering (for active/inactive listings)
CREATE INDEX IF NOT EXISTS idx_listings_status 
ON listings (status);

-- Year built filtering
CREATE INDEX IF NOT EXISTS idx_listings_year_built 
ON listings (year_built) WHERE year_built IS NOT NULL;

-- Verified listings
CREATE INDEX IF NOT EXISTS idx_listings_verified 
ON listings (verified) WHERE verified = true;

-- Views tracking
CREATE INDEX IF NOT EXISTS idx_listings_views 
ON listings (views DESC) WHERE views IS NOT NULL;

-- ========================================
-- COMPOSITE INDEXES (for common query patterns)
-- ========================================

-- Common filter: location + price (VERY COMMON)
CREATE INDEX IF NOT EXISTS idx_listings_state_price 
ON listings (state, price) WHERE state IS NOT NULL AND price IS NOT NULL;

-- Common filter: location + beds (COMMON)
CREATE INDEX IF NOT EXISTS idx_listings_state_beds 
ON listings (state, beds) WHERE state IS NOT NULL AND beds IS NOT NULL;

-- Common filter: location + baths (COMMON)
CREATE INDEX IF NOT EXISTS idx_listings_state_baths 
ON listings (state, baths) WHERE state IS NOT NULL AND baths IS NOT NULL;

-- Featured + price (for featured listings sorting)
CREATE INDEX IF NOT EXISTS idx_listings_featured_price 
ON listings (featured DESC, price) WHERE featured = true AND price IS NOT NULL;

-- Owner + status (for "My Listings" with filters)
CREATE INDEX IF NOT EXISTS idx_listings_owner_status 
ON listings (owner_id, status) WHERE owner_id IS NOT NULL;

-- ========================================
-- VERIFY INDEXES
-- ========================================

-- Check which indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'listings'
  AND schemaname = 'public'
ORDER BY indexname;

-- Show index sizes to verify they're working
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE tablename = 'listings'
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

SELECT '✅ Listings table indexes created! Performance should improve significantly.' as status;
SELECT '📊 Run the queries above to see all indexes and their sizes.' as note;

