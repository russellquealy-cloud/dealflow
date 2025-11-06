-- Add polygon/GeoJSON support to saved_searches table
-- This allows storing polygon search areas drawn on the map

-- Add polygon column if it doesn't exist
ALTER TABLE saved_searches 
  ADD COLUMN IF NOT EXISTS polygon GEOGRAPHY(POLYGON);

-- Add GeoJSON column for storing polygon as GeoJSON (easier to work with in frontend)
ALTER TABLE saved_searches 
  ADD COLUMN IF NOT EXISTS polygon_geojson JSONB;

-- Create index for spatial queries (using polygon)
CREATE INDEX IF NOT EXISTS idx_saved_searches_polygon 
  ON saved_searches USING GIST(polygon);

-- Create index for GeoJSON queries
CREATE INDEX IF NOT EXISTS idx_saved_searches_polygon_geojson 
  ON saved_searches USING GIN(polygon_geojson);

-- Add comment
COMMENT ON COLUMN saved_searches.polygon IS 'PostGIS geography polygon for spatial queries';
COMMENT ON COLUMN saved_searches.polygon_geojson IS 'GeoJSON representation of polygon for frontend use';

