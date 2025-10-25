-- Correct Test Data for Off Axis Deals
-- This matches your actual table schema

INSERT INTO listings (
    id, title, address, city, state, zip, price, bedrooms, bathrooms, 
    home_sqft, lot_size, garage, description, latitude, longitude, year_built, cover_image_url
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
    1,  -- garage: 1 = yes, 0 = no
    'Beautiful historic home in downtown Tucson with original hardwood floors and period details.',
    32.2226,
    -110.9747,
    1925,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
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
    2,  -- garage: 2 spaces
    'Stunning modern home with mountain views and energy-efficient features.',
    32.2326,
    -110.9847,
    2018,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
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
    1,  -- garage: 1 space
    'Spacious ranch-style home with panoramic mountain views and updated kitchen.',
    32.2426,
    -110.9947,
    1995,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
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
    0,  -- garage: 0 = no garage
    'Charming bungalow in trendy South Austin with original character and modern updates.',
    30.2672,
    -97.7431,
    1950,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
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
    1,  -- garage: 1 space
    'Contemporary downtown loft with exposed brick and modern amenities.',
    30.2672,
    -97.7431,
    2020,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
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
    0,  -- garage: 0 = no garage
    'Historic beach bungalow steps from the sand with ocean views.',
    33.9850,
    -118.4695,
    1920,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
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
    3,  -- garage: 3 spaces
    'Stunning modern home in Hollywood Hills with city views and infinity pool.',
    34.0928,
    -118.3287,
    2015,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
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
    1,  -- garage: 1 space
    'Beautiful Art Deco condo in historic district with ocean views.',
    25.7907,
    -80.1300,
    1935,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
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
    2,  -- garage: 2 spaces
    'Luxury villa in Coconut Grove with tropical landscaping and pool.',
    25.7280,
    -80.2434,
    1985,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
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
    1,  -- garage: 1 space
    'Charming craftsman home in trendy Highlands neighborhood.',
    39.7611,
    -105.0169,
    1910,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
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
    2,  -- garage: 2 spaces
    'Modern mountain home with views of the Flatirons and updated finishes.',
    40.0150,
    -105.2705,
    2005,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
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
    2,  -- garage: 2 spaces
    'Contemporary home in Summerlin with desert landscaping and pool.',
    36.1699,
    -115.1398,
    2010,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
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
    0,  -- garage: 0 = no garage
    'Authentic adobe home in historic Old Town with traditional features.',
    35.0844,
    -106.6504,
    1950,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
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
    1,  -- garage: 1 space
    'Charming bungalow in downtown Salt Lake with mountain views.',
    40.7608,
    -111.8910,
    1940,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
);
