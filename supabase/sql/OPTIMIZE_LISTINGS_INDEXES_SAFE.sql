-- ⚡ OPTIMIZE LISTINGS TABLE INDEXES (SAFE VERSION)
-- This version only creates indexes for columns that actually exist
-- Run CHECK_LISTINGS_COLUMNS.sql first to see what columns you have

-- ========================================
-- SPATIAL INDEXES (for map queries)
-- ========================================
-- Ensure PostGIS extension is enabled (should already be enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Index for spatial queries (latitude/longitude)
-- This speeds up map bounds filtering
-- Only create if both latitude and longitude columns exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name IN ('latitude', 'longitude')
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_geom 
        ON listings USING GIST (ST_MakePoint(longitude, latitude));
    END IF;
END $$;

-- ========================================
-- COLUMN INDEXES (for filtering and sorting)
-- ========================================

-- Featured listings (most common sort)
-- Only if featured column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'featured'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_featured_created 
        ON listings (featured DESC NULLS LAST, created_at DESC);
    END IF;
END $$;

-- Price range filtering
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'price'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_price 
        ON listings (price) WHERE price IS NOT NULL;
    END IF;
END $$;

-- Location filtering (city/state)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name IN ('state', 'city')
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_location 
        ON listings (state, city) WHERE state IS NOT NULL AND city IS NOT NULL;
    END IF;
END $$;

-- Bedrooms/Baths filtering
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name IN ('beds', 'baths')
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_beds_baths 
        ON listings (beds, baths) WHERE beds IS NOT NULL AND baths IS NOT NULL;
    END IF;
END $$;

-- Square footage filtering (check for sqft or square_feet)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'sqft'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_sqft 
        ON listings (sqft) WHERE sqft IS NOT NULL;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'square_feet'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_square_feet 
        ON listings (square_feet) WHERE square_feet IS NOT NULL;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'home_sqft'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_home_sqft 
        ON listings (home_sqft) WHERE home_sqft IS NOT NULL;
    END IF;
END $$;

-- Created date (for sorting by newest)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_created_at 
        ON listings (created_at DESC);
    END IF;
END $$;

-- Owner ID (for "My Listings" queries)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'owner_id'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_owner_id 
        ON listings (owner_id) WHERE owner_id IS NOT NULL;
    END IF;
END $$;

-- ========================================
-- COMPOSITE INDEXES (for common query patterns)
-- ========================================

-- Common filter combination: location + price
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name IN ('state', 'price')
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_listings_state_price 
        ON listings (state, price) WHERE state IS NOT NULL AND price IS NOT NULL;
    END IF;
END $$;

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

SELECT '✅ Listings table indexes created! Performance should improve significantly.' as status;

