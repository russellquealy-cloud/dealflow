-- Update existing listings with complete data
-- Run this in your Supabase SQL Editor to populate missing fields in your current listings

-- First, let's see what we're working with
SELECT id, title, address, city, state, zip, beds, baths, sqft, image_url 
FROM listings 
LIMIT 5;

-- Update the first listing (Heart of Tucson)
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 1800,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Charming historic home in downtown Tucson. Original hardwood floors, high ceilings, and tons of character. Walking distance to restaurants and shops.',
  year_built = 1920,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
WHERE id = '64e49eda-3b34-4004-a041-2bfd6b26ecb7';

-- Update the second listing
UPDATE listings 
SET 
  beds = 4,
  baths = 3,
  sqft = 2400,
  city = 'Tucson',
  state = 'AZ',
  zip = '85719',
  description = 'Stunning modern home near University of Arizona. Open floor plan, gourmet kitchen, and premium finishes throughout. Great rental potential.',
  year_built = 2015,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
WHERE id = 'fb85cc91-e76c-436b-8d6f-1143933d0374';

-- Update the third listing
UPDATE listings 
SET 
  beds = 3,
  baths = 2.5,
  sqft = 2000,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Beautiful family home in established neighborhood. Large backyard, updated kitchen, and plenty of space for growing families.',
  year_built = 1995,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
WHERE id = 'd6242826-c396-4a0d-bcc7-be39d3bb5ac4';

-- Update Historic Downtown Gem
UPDATE listings 
SET 
  beds = 4,
  baths = 3,
  sqft = 2800,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Historic gem in the heart of downtown. Original architectural details preserved with modern amenities added.',
  year_built = 1910,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
WHERE id = 'b1dd3f39-aba8-4f6c-b9e1-4b21dec458bd';

-- Update Modern Desert Oasis
UPDATE listings 
SET 
  beds = 5,
  baths = 4,
  sqft = 3200,
  city = 'Tucson',
  state = 'AZ',
  zip = '85718',
  description = 'Luxury desert home with stunning mountain views. Resort-style pool, outdoor kitchen, and premium finishes throughout.',
  year_built = 2020,
  garage = 3,
  image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
WHERE id = 'df0b627a-8267-4a6a-adbb-e38c00a3eeb3';

-- Update Mountain View Ranch
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 2200,
  city = 'Tucson',
  state = 'AZ',
  zip = '85719',
  description = 'Spacious ranch home with panoramic mountain views. Large lot, mature landscaping, and peaceful neighborhood.',
  year_built = 1985,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
WHERE id = '9a659527-d7d8-48e6-bc3a-83dcc3340dbf';

-- Update South Austin Bungalow
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 1800,
  city = 'Austin',
  state = 'TX',
  zip = '78704',
  description = 'Charming bungalow in South Austin. Walking distance to South by Southwest venues and trendy restaurants.',
  year_built = 1940,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
WHERE id = 'ba3ce286-61f4-4434-aaab-e85fa7e5ea17';

-- Update East Austin Modern
UPDATE listings 
SET 
  beds = 4,
  baths = 3,
  sqft = 2600,
  city = 'Austin',
  state = 'TX',
  zip = '78721',
  description = 'Modern home in rapidly growing East Austin. Open floor plan, energy efficient, and close to downtown.',
  year_built = 2018,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
WHERE id = 'da5bbffb-2862-482c-94bd-3954d90e18fe';

-- Update Venice Beach Bungalow
UPDATE listings 
SET 
  beds = 2,
  baths = 1,
  sqft = 1200,
  city = 'Venice',
  state = 'CA',
  zip = '90291',
  description = 'Classic Venice Beach bungalow steps from the boardwalk. Perfect for investors or beach lovers.',
  year_built = 1920,
  garage = 0,
  image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
WHERE id = 'a8834a1c-e400-49ba-839c-92a0b992bab1';

-- Update Hollywood Hills Modern
UPDATE listings 
SET 
  beds = 6,
  baths = 5,
  sqft = 4500,
  city = 'Los Angeles',
  state = 'CA',
  zip = '90068',
  description = 'Luxury modern home in Hollywood Hills. Stunning city views, infinity pool, and smart home technology.',
  year_built = 2021,
  garage = 3,
  image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
WHERE id = '2e9c6787-bd39-4620-a628-292b2c904d1e';

-- Update Art Deco District Condo
UPDATE listings 
SET 
  beds = 2,
  baths = 2,
  sqft = 1400,
  city = 'Miami Beach',
  state = 'FL',
  zip = '33139',
  description = 'Stunning Art Deco condo in the heart of Miami Beach. Ocean views, rooftop pool, and walking distance to everything.',
  year_built = 1930,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
WHERE id = '9487600b-b3e7-4e3a-9927-6d150d7d7f8e';

-- Update Coconut Grove Villa
UPDATE listings 
SET 
  beds = 4,
  baths = 3,
  sqft = 2800,
  city = 'Miami',
  state = 'FL',
  zip = '33133',
  description = 'Elegant villa in Coconut Grove. Private pool, tropical landscaping, and close to the bay.',
  year_built = 1965,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
WHERE id = '9f849bd3-aab9-42a8-afa6-f6a666504398';

-- Update Denver Highlands Craftsman
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 2000,
  city = 'Denver',
  state = 'CO',
  zip = '80211',
  description = 'Beautiful craftsman home in Denver Highlands. Updated kitchen, hardwood floors, and mountain views.',
  year_built = 1915,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
WHERE id = 'd446dfd5-f5a4-470c-b23d-d42be357578e';

-- Update Boulder Mountain Home
UPDATE listings 
SET 
  beds = 4,
  baths = 3,
  sqft = 3200,
  city = 'Boulder',
  state = 'CO',
  zip = '80302',
  description = 'Mountain home with breathtaking views of the Flatirons. Hiking trails out the back door.',
  year_built = 1990,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
WHERE id = 'ed9f53f4-b61f-4654-b1c4-7b3df08663c2';

-- Update Summerlin Modern
UPDATE listings 
SET 
  beds = 4,
  baths = 3,
  sqft = 2600,
  city = 'Las Vegas',
  state = 'NV',
  zip = '89144',
  description = 'Modern home in Summerlin. Energy efficient, smart home features, and close to Red Rock Canyon.',
  year_built = 2019,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
WHERE id = '72e25ff7-a174-428f-8dbc-748117a46422';

-- Update Old Town Adobe
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 1800,
  city = 'Albuquerque',
  state = 'NM',
  zip = '87104',
  description = 'Authentic adobe home in Old Town. Traditional architecture with modern amenities. Walking distance to shops and restaurants.',
  year_built = 1850,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
WHERE id = 'ed397f2c-a81e-4071-924a-92e096ea816a';

-- Update Salt Lake City Bungalow
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 1900,
  city = 'Salt Lake City',
  state = 'UT',
  zip = '84102',
  description = 'Charming bungalow in downtown Salt Lake City. Walking distance to Temple Square and city center.',
  year_built = 1925,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
WHERE id = '4001b49b-34d8-46e2-8da2-84b0619103bc';

-- Verify the updates worked
SELECT 
  id,
  title,
  city,
  state,
  zip,
  beds,
  baths,
  sqft,
  CASE 
    WHEN image_url IS NOT NULL THEN '✅ Has Image'
    ELSE '❌ No Image'
  END as image_status
FROM listings
ORDER BY created_at DESC
LIMIT 10;

-- Check coordinate status
SELECT 
  COUNT(*) as total_listings,
  COUNT(latitude) as listings_with_lat,
  COUNT(longitude) as listings_with_lng,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as listings_with_both_coords
FROM listings;
