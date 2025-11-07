-- Performance indexes for listings table
-- Created: 2025-01-08
-- Purpose: Improve query performance for listings queries

-- Index on created_at for ordering (most common sort)
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Index on price for price range filters
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price) WHERE price IS NOT NULL;

-- Index on beds for bedroom filters
CREATE INDEX IF NOT EXISTS idx_listings_beds ON listings(beds) WHERE beds IS NOT NULL;

-- Index on baths for bathroom filters
CREATE INDEX IF NOT EXISTS idx_listings_baths ON listings(baths) WHERE baths IS NOT NULL;

-- Index on sqft for square footage filters
CREATE INDEX IF NOT EXISTS idx_listings_sqft ON listings(sqft) WHERE sqft IS NOT NULL;

-- Composite index for common filter combinations (price + beds)
CREATE INDEX IF NOT EXISTS idx_listings_price_beds ON listings(price, beds) WHERE price IS NOT NULL AND beds IS NOT NULL;

-- Index on city and state for location filters (exact match, not wildcard)
CREATE INDEX IF NOT EXISTS idx_listings_city_state ON listings(city, state) WHERE city IS NOT NULL AND state IS NOT NULL;

-- Index on latitude/longitude for map queries (if using bounding box)
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index on featured for featured listings
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured, created_at DESC) WHERE featured = true;

-- If using PostGIS for polygon searches, create spatial index
-- Note: This requires PostGIS extension to be enabled
-- Uncomment if you're using PostGIS geometry column
-- CREATE INDEX IF NOT EXISTS idx_listings_geom ON listings USING GIST (geom);

-- Verify indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'listings'
AND schemaname = 'public'
ORDER BY indexname;

