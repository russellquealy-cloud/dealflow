-- Add missing columns to your existing listings table
-- Run this first, then run the test-data-fixed.sql

-- Add missing columns if they don't exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name IN ('year_built', 'cover_image_url', 'latitude', 'longitude');
