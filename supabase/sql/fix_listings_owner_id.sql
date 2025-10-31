-- Fix listings owner_id issue
-- This script assigns owner_id to listings that have null owner_id
-- It will assign the listing to a random wholesaler profile if available

-- Step 1: Check current state
SELECT 
  COUNT(*) as total_listings,
  COUNT(owner_id) as listings_with_owner,
  COUNT(*) - COUNT(owner_id) as listings_without_owner
FROM listings;

-- Step 2: Get a list of wholesaler user IDs to use as owners
-- (Run this query first to see available wholesalers)
-- Note: email is in auth.users, not profiles
SELECT id, full_name
FROM profiles 
WHERE role = 'wholesaler'
LIMIT 10;

-- Step 3: Update listings with null owner_id
-- Option A: Assign all to first available wholesaler
UPDATE listings
SET owner_id = (
  SELECT id FROM profiles WHERE role = 'wholesaler' LIMIT 1
)
WHERE owner_id IS NULL;

-- Option B: Distribute listings across multiple wholesalers (more realistic)
-- First, create a function to randomly assign wholesalers
DO $$
DECLARE
  listing_record RECORD;
  wholesaler_id UUID;
  wholesaler_count INTEGER;
BEGIN
  -- Count wholesalers
  SELECT COUNT(*) INTO wholesaler_count
  FROM profiles
  WHERE role = 'wholesaler';
  
  IF wholesaler_count = 0 THEN
    RAISE NOTICE 'No wholesalers found. Please create wholesaler profiles first.';
    RETURN;
  END IF;
  
  -- Assign each listing without owner to a random wholesaler
  FOR listing_record IN 
    SELECT id FROM listings WHERE owner_id IS NULL
  LOOP
    -- Get random wholesaler
    SELECT id INTO wholesaler_id
    FROM profiles
    WHERE role = 'wholesaler'
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- Assign to this listing
    UPDATE listings
    SET owner_id = wholesaler_id
    WHERE id = listing_record.id;
  END LOOP;
  
  RAISE NOTICE 'Updated listings with owner_id';
END $$;

-- Step 4: Verify the update
SELECT 
  COUNT(*) as total_listings,
  COUNT(owner_id) as listings_with_owner,
  COUNT(*) - COUNT(owner_id) as listings_without_owner
FROM listings;

-- Step 5: Show sample of updated listings
-- Note: To see owner email, you'd need to join with auth.users
SELECT 
  l.id,
  l.title,
  l.address,
  p.full_name as owner_name,
  l.owner_id
FROM listings l
LEFT JOIN profiles p ON l.owner_id = p.id
LIMIT 10;

