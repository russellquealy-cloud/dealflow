-- Simple Test Data for Off Axis Deals
-- This is a clean, simple version that should work

INSERT INTO listings (
    id, title, address, city, state, zip, price, bedrooms, bathrooms, 
    home_sqft, lot_size, garage, description
) VALUES 
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
);
