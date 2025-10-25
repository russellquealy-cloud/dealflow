-- Clean up test/fake listings for production deployment
-- Run this in your Supabase SQL Editor when ready to go live

-- Remove all test listings (ones with IDs starting with 'test-' or 'real-')
DELETE FROM listings WHERE id LIKE 'test-%' OR id LIKE 'real-%';

-- Remove any listings from test addresses
DELETE FROM listings WHERE 
  address LIKE '%Test%' OR 
  address LIKE '%Filter Test%' OR
  address LIKE '%9999%' OR
  title LIKE '%Test%';

-- Remove listings from obvious test cities/addresses
DELETE FROM listings WHERE 
  (city = 'Tucson' AND address IN ('123 E Broadway Blvd', '456 N Campbell Ave', '789 E Speedway Blvd'));

-- Show remaining listings count
SELECT COUNT(*) as remaining_listings FROM listings;

-- Show remaining listings to verify cleanup
SELECT id, title, city, state, address FROM listings ORDER BY created_at DESC;
