-- Minimal Test Data SQL Script for Off Axis Deals
-- This script uses only the most basic columns that should exist in your listings table

-- Insert test listings with real addresses and coordinates
-- Using only the most basic columns that should exist
INSERT INTO listings (
    id, title, address, city, state, zip, price, bedrooms, bathrooms, 
    home_sqft, lot_size, garage, description
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
    'Beautiful historic home in downtown Tucson with original hardwood floors and period details.'
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
    'Stunning modern home with mountain views and energy-efficient features.'
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
    'Spacious ranch-style home with panoramic mountain views and updated kitchen.'
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
    'Charming bungalow in trendy South Austin with original character and modern updates.'
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
    'Contemporary downtown loft with exposed brick and modern amenities.'
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
    'Historic beach bungalow steps from the sand with ocean views.'
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
    'Stunning modern home in Hollywood Hills with city views and infinity pool.'
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
    'Beautiful Art Deco condo in historic district with ocean views.'
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
    'Luxury villa in Coconut Grove with tropical landscaping and pool.'
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
    'Charming craftsman home in trendy Highlands neighborhood.'
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
    'Modern mountain home with views of the Flatirons and updated finishes.'
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
    'Contemporary home in Summerlin with desert landscaping and pool.'
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
    'Authentic adobe home in historic Old Town with traditional features.'
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
    'Charming bungalow in downtown Salt Lake with mountain views.'
);
