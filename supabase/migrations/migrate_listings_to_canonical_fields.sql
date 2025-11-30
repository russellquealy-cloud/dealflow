-- Migration: Migrate listings table from legacy fields to canonical fields
-- 
-- This migration:
-- 1. Copies data from legacy fields to canonical fields (with COALESCE to preserve existing canonical data)
-- 2. Provides commented-out DROP statements to remove legacy columns after verification
--
-- IMPORTANT: Review the data migration results before running the DROP statements
--
-- Run this migration in two phases:
-- Phase 1: Run the UPDATE statements to copy data
-- Phase 2: After verifying the app works correctly, uncomment and run the DROP statements

-- ==============================================================================
-- PHASE 1: COPY DATA FROM LEGACY FIELDS TO CANONICAL FIELDS
-- ==============================================================================

-- Copy bedrooms -> beds (only if beds is NULL or 0)
UPDATE listings
SET beds = COALESCE(beds, bedrooms)
WHERE bedrooms IS NOT NULL
  AND (beds IS NULL OR beds = 0);

-- Copy bathrooms -> baths (only if baths is NULL or 0)
-- Note: bathrooms might be stored as text in some cases, so we cast it
UPDATE listings
SET baths = COALESCE(baths, CASE 
  WHEN bathrooms::text ~ '^[0-9]+\.?[0-9]*$' THEN (bathrooms::text)::numeric
  ELSE NULL
END)
WHERE bathrooms IS NOT NULL
  AND (baths IS NULL OR baths = 0);

-- Copy home_sqft -> sqft (only if sqft is NULL or 0)
UPDATE listings
SET sqft = COALESCE(sqft, home_sqft)
WHERE home_sqft IS NOT NULL
  AND (sqft IS NULL OR sqft = 0);

-- Copy lot_size -> lot_sqft (only if lot_sqft is NULL or 0)
-- Note: If lot_unit exists and is 'acre', convert acres to sqft (1 acre = 43560 sqft)
UPDATE listings
SET lot_sqft = COALESCE(
  lot_sqft,
  CASE 
    WHEN lot_unit = 'acre' AND lot_size IS NOT NULL THEN lot_size * 43560
    WHEN lot_unit = 'sqft' AND lot_size IS NOT NULL THEN lot_size
    WHEN lot_unit IS NULL AND lot_size IS NOT NULL THEN lot_size -- Assume sqft if no unit
    ELSE NULL
  END
)
WHERE lot_size IS NOT NULL
  AND (lot_sqft IS NULL OR lot_sqft = 0);

-- Copy garage -> garage_spaces
-- Handle integer values (garage is typically an integer column)
-- If garage > 0, use that value; otherwise set to NULL
UPDATE listings
SET garage_spaces = COALESCE(
  garage_spaces,
  CASE 
    WHEN garage > 0 THEN garage
    ELSE NULL
  END
)
WHERE garage IS NOT NULL
  AND (garage_spaces IS NULL OR garage_spaces = 0);

-- ==============================================================================
-- VERIFY DATA MIGRATION
-- ==============================================================================

-- Check migration results
SELECT 
  'Total listings' as metric,
  COUNT(*) as count
FROM listings
UNION ALL
SELECT 
  'Listings with beds (canonical)',
  COUNT(*) 
FROM listings 
WHERE beds IS NOT NULL
UNION ALL
SELECT 
  'Listings with bedrooms (legacy)',
  COUNT(*) 
FROM listings 
WHERE bedrooms IS NOT NULL
UNION ALL
SELECT 
  'Listings with baths (canonical)',
  COUNT(*) 
FROM listings 
WHERE baths IS NOT NULL
UNION ALL
SELECT 
  'Listings with bathrooms (legacy)',
  COUNT(*) 
FROM listings 
WHERE bathrooms IS NOT NULL
UNION ALL
SELECT 
  'Listings with sqft (canonical)',
  COUNT(*) 
FROM listings 
WHERE sqft IS NOT NULL
UNION ALL
SELECT 
  'Listings with home_sqft (legacy)',
  COUNT(*) 
FROM listings 
WHERE home_sqft IS NOT NULL
UNION ALL
SELECT 
  'Listings with lot_sqft (canonical)',
  COUNT(*) 
FROM listings 
WHERE lot_sqft IS NOT NULL
UNION ALL
SELECT 
  'Listings with lot_size (legacy)',
  COUNT(*) 
FROM listings 
WHERE lot_size IS NOT NULL
UNION ALL
SELECT 
  'Listings with garage_spaces (canonical)',
  COUNT(*) 
FROM listings 
WHERE garage_spaces IS NOT NULL
UNION ALL
SELECT 
  'Listings with garage (legacy)',
  COUNT(*) 
FROM listings 
WHERE garage IS NOT NULL;

-- ==============================================================================
-- PHASE 2: DROP LEGACY COLUMNS
-- ==============================================================================
--
-- ⚠️  WARNING: Only run these after verifying that:
--     1. All data has been successfully migrated
--     2. The application code has been updated to use canonical fields only
--     3. You have a database backup
--
-- After verifying the app works correctly in production, run:

ALTER TABLE listings
  DROP COLUMN IF EXISTS bedrooms,
  DROP COLUMN IF EXISTS bathrooms,
  DROP COLUMN IF EXISTS home_sqft,
  DROP COLUMN IF EXISTS lot_size,
  DROP COLUMN IF EXISTS lot_unit,
  DROP COLUMN IF EXISTS garage;

-- ==============================================================================
-- POSTGIS GEOM UPDATE FUNCTION AND TRIGGER
-- ==============================================================================

-- Ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create trigger function to automatically update geom when latitude/longitude change
CREATE OR REPLACE FUNCTION update_listing_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.geom = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before INSERT or UPDATE of latitude/longitude
DROP TRIGGER IF EXISTS trigger_update_listing_geom ON listings;
CREATE TRIGGER trigger_update_listing_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_geom();

-- Create RPC function for manual updates (used by API routes)
CREATE OR REPLACE FUNCTION update_listing_geom(listing_id UUID, lng NUMERIC, lat NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  WHERE id = listing_id
    AND lng IS NOT NULL
    AND lat IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill geom for existing listings that have coordinates but no geom
UPDATE listings
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND (geom IS NULL OR geom::text = '');

SELECT '✅ PostGIS geom update function, trigger, and RPC created! Geom will now update automatically when coordinates change.' as status;

