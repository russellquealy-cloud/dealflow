-- Test Data SQL Script for DealFlow
-- This script creates real listings with real addresses and coordinates across multiple states

-- First, let's ensure the listings table has all necessary columns
-- (Run this if you need to add missing columns)

-- Add missing columns if they don't exist
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS year_built INTEGER;
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Insert test listings with real addresses and coordinates
INSERT INTO listings (
    id, title, address, city, state, zip, price, bedrooms, bathrooms, 
    home_sqft, lot_size, garage, year_built, description, latitude, longitude,
    cover_image_url, created_at, updated_at
) VALUES 
-- Arizona Listings (Tucson area)
(
    gen_random_uuid(),
    'Historic Downtown Gem',
    '123 E Broadway Blvd',
    'Tucson',
    'AZ',
    '85701',
    285000,
    3,
    2,
    1850,
    0.15,
    true,
    1925,
    'Beautiful historic home in downtown Tucson with original hardwood floors and period details.',
    32.2226,
    -110.9747,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Modern Desert Oasis',
    '456 N Campbell Ave',
    'Tucson',
    'AZ',
    '85719',
    425000,
    4,
    3,
    2450,
    0.35,
    true,
    2018,
    'Stunning modern home with mountain views and energy-efficient features.',
    32.2326,
    -110.9847,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Mountain View Ranch',
    '789 E Speedway Blvd',
    'Tucson',
    'AZ',
    '85719',
    325000,
    3,
    2,
    2100,
    0.25,
    true,
    1995,
    'Spacious ranch-style home with panoramic mountain views and updated kitchen.',
    32.2426,
    -110.9947,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    NOW(),
    NOW()
),

-- Texas Listings (Austin area)
(
    gen_random_uuid(),
    'South Austin Bungalow',
    '1234 S Lamar Blvd',
    'Austin',
    'TX',
    '78704',
    485000,
    3,
    2,
    1650,
    0.2,
    false,
    1950,
    'Charming bungalow in trendy South Austin with original character and modern updates.',
    30.2672,
    -97.7431,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'East Austin Modern',
    '567 E 6th St',
    'Austin',
    'TX',
    '78701',
    625000,
    2,
    2,
    1400,
    0.1,
    true,
    2020,
    'Contemporary downtown loft with exposed brick and modern amenities.',
    30.2672,
    -97.7431,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    NOW(),
    NOW()
),

-- California Listings (Los Angeles area)
(
    gen_random_uuid(),
    'Venice Beach Bungalow',
    '123 Ocean Front Walk',
    'Venice',
    'CA',
    '90291',
    1250000,
    2,
    1,
    1200,
    0.08,
    false,
    1920,
    'Historic beach bungalow steps from the sand with ocean views.',
    33.9850,
    -118.4695,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Hollywood Hills Modern',
    '456 Mulholland Dr',
    'Los Angeles',
    'CA',
    '90046',
    1850000,
    4,
    3,
    3200,
    0.4,
    true,
    2015,
    'Stunning modern home in Hollywood Hills with city views and infinity pool.',
    34.0928,
    -118.3287,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    NOW(),
    NOW()
),

-- Florida Listings (Miami area)
(
    gen_random_uuid(),
    'Art Deco District Condo',
    '123 Ocean Dr',
    'Miami Beach',
    'FL',
    '33139',
    750000,
    2,
    2,
    1200,
    0.05,
    true,
    1935,
    'Beautiful Art Deco condo in historic district with ocean views.',
    25.7907,
    -80.1300,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Coconut Grove Villa',
    '456 Main Hwy',
    'Coconut Grove',
    'FL',
    '33133',
    950000,
    3,
    2,
    2200,
    0.3,
    true,
    1985,
    'Luxury villa in Coconut Grove with tropical landscaping and pool.',
    25.7280,
    -80.2434,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    NOW(),
    NOW()
),

-- Colorado Listings (Denver area)
(
    gen_random_uuid(),
    'Denver Highlands Craftsman',
    '1234 32nd Ave',
    'Denver',
    'CO',
    '80211',
    485000,
    3,
    2,
    1800,
    0.2,
    true,
    1910,
    'Charming craftsman home in trendy Highlands neighborhood.',
    39.7611,
    -105.0169,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Boulder Mountain Home',
    '567 Pearl St',
    'Boulder',
    'CO',
    '80302',
    675000,
    4,
    3,
    2800,
    0.4,
    true,
    2005,
    'Modern mountain home with views of the Flatirons and updated finishes.',
    40.0150,
    -105.2705,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    NOW(),
    NOW()
),

-- Nevada Listings (Las Vegas area)
(
    gen_random_uuid(),
    'Summerlin Modern',
    '1234 W Charleston Blvd',
    'Las Vegas',
    'NV',
    '89102',
    425000,
    3,
    2,
    2200,
    0.25,
    true,
    2010,
    'Contemporary home in Summerlin with desert landscaping and pool.',
    36.1699,
    -115.1398,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    NOW(),
    NOW()
),

-- New Mexico Listings (Albuquerque area)
(
    gen_random_uuid(),
    'Old Town Adobe',
    '123 Romero St NW',
    'Albuquerque',
    'NM',
    '87104',
    285000,
    2,
    1,
    1200,
    0.15,
    false,
    1950,
    'Authentic adobe home in historic Old Town with traditional features.',
    35.0844,
    -106.6504,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    NOW(),
    NOW()
),

-- Utah Listings (Salt Lake City area)
(
    gen_random_uuid(),
    'Salt Lake City Bungalow',
    '456 E 300 S',
    'Salt Lake City',
    'UT',
    '84111',
    385000,
    3,
    2,
    1650,
    0.2,
    true,
    1940,
    'Charming bungalow in downtown Salt Lake with mountain views.',
    40.7608,
    -111.8910,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    NOW(),
    NOW()
);

-- Update any existing test data to have proper coordinates
UPDATE listings 
SET latitude = 32.2226, longitude = -110.9747 
WHERE address LIKE '%Main St%' AND city = 'Tucson';

UPDATE listings 
SET latitude = 32.2326, longitude = -110.9847 
WHERE address LIKE '%Desert View Dr%' AND city = 'Tucson';

-- Add some additional fields that might be missing
UPDATE listings 
SET 
    arv = price * 1.2,
    repairs = price * 0.1,
    spread = (price * 1.2) - price - (price * 0.1),
    roi = ROUND(((price * 1.2) - price - (price * 0.1)) / price * 100, 2)
WHERE arv IS NULL;
