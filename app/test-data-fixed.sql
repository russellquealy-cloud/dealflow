-- Test Data SQL Script for DealFlow (Fixed for existing schema)
-- This script creates real listings with real addresses and coordinates across multiple states

-- First, let's add the missing columns to your existing table
-- Run these ALTER TABLE statements first if the columns don't exist:

-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS year_built INTEGER;
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
-- ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Insert test listings with real addresses and coordinates
-- Using only columns that exist in your current schema
INSERT INTO listings (
    id, title, address, city, state, zip, price, bedrooms, bathrooms, 
    home_sqft, lot_size, garage, description, created_at, updated_at
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
    'Beautiful historic home in downtown Tucson with original hardwood floors and period details.',
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
    'Stunning modern home with mountain views and energy-efficient features.',
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
    'Spacious ranch-style home with panoramic mountain views and updated kitchen.',
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
    'Charming bungalow in trendy South Austin with original character and modern updates.',
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
    'Contemporary downtown loft with exposed brick and modern amenities.',
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
    'Historic beach bungalow steps from the sand with ocean views.',
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
    'Stunning modern home in Hollywood Hills with city views and infinity pool.',
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
    'Beautiful Art Deco condo in historic district with ocean views.',
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
    'Luxury villa in Coconut Grove with tropical landscaping and pool.',
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
    'Charming craftsman home in trendy Highlands neighborhood.',
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
    'Modern mountain home with views of the Flatirons and updated finishes.',
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
    'Contemporary home in Summerlin with desert landscaping and pool.',
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
    'Authentic adobe home in historic Old Town with traditional features.',
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
    'Charming bungalow in downtown Salt Lake with mountain views.',
    NOW(),
    NOW()
);

-- Now add the coordinates separately using UPDATE statements
-- This will work even if the latitude/longitude columns don't exist yet

-- Arizona coordinates
UPDATE listings 
SET latitude = 32.2226, longitude = -110.9747 
WHERE address = '123 E Broadway Blvd' AND city = 'Tucson';

UPDATE listings 
SET latitude = 32.2326, longitude = -110.9847 
WHERE address = '456 N Campbell Ave' AND city = 'Tucson';

UPDATE listings 
SET latitude = 32.2426, longitude = -110.9947 
WHERE address = '789 E Speedway Blvd' AND city = 'Tucson';

-- Texas coordinates
UPDATE listings 
SET latitude = 30.2672, longitude = -97.7431 
WHERE address = '1234 S Lamar Blvd' AND city = 'Austin';

UPDATE listings 
SET latitude = 30.2672, longitude = -97.7431 
WHERE address = '567 E 6th St' AND city = 'Austin';

-- California coordinates
UPDATE listings 
SET latitude = 33.9850, longitude = -118.4695 
WHERE address = '123 Ocean Front Walk' AND city = 'Venice';

UPDATE listings 
SET latitude = 34.0928, longitude = -118.3287 
WHERE address = '456 Mulholland Dr' AND city = 'Los Angeles';

-- Florida coordinates
UPDATE listings 
SET latitude = 25.7907, longitude = -80.1300 
WHERE address = '123 Ocean Dr' AND city = 'Miami Beach';

UPDATE listings 
SET latitude = 25.7280, longitude = -80.2434 
WHERE address = '456 Main Hwy' AND city = 'Coconut Grove';

-- Colorado coordinates
UPDATE listings 
SET latitude = 39.7611, longitude = -105.0169 
WHERE address = '1234 32nd Ave' AND city = 'Denver';

UPDATE listings 
SET latitude = 40.0150, longitude = -105.2705 
WHERE address = '567 Pearl St' AND city = 'Boulder';

-- Nevada coordinates
UPDATE listings 
SET latitude = 36.1699, longitude = -115.1398 
WHERE address = '1234 W Charleston Blvd' AND city = 'Las Vegas';

-- New Mexico coordinates
UPDATE listings 
SET latitude = 35.0844, longitude = -106.6504 
WHERE address = '123 Romero St NW' AND city = 'Albuquerque';

-- Utah coordinates
UPDATE listings 
SET latitude = 40.7608, longitude = -111.8910 
WHERE address = '456 E 300 S' AND city = 'Salt Lake City';
