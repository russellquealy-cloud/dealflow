-- Generate test listings for DealFlow with proper coordinates
-- Run this in Supabase SQL Editor to populate your database with sample data
-- 
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your@email.com';

-- First, let's ensure we have the correct columns
-- This is just a safety check - the columns should already exist

-- Insert test listings in Tucson, AZ area
INSERT INTO listings (
  title,
  address,
  city,
  state,
  zip,
  price,
  beds,
  baths,
  sqft,
  latitude,
  longitude,
  lot_size,
  garage,
  year_built,
  description,
  arv,
  repairs,
  assignment_fee,
  contact_name,
  contact_email,
  contact_phone,
  images,
  cover_image_url,
  owner_id,
  status
) VALUES
-- Listing 1: Downtown Tucson
(
  'Historic Downtown Home',
  '123 E Broadway Blvd',
  'Tucson',
  'AZ',
  '85701',
  250000,
  3,
  2,
  1800,
  32.2226,
  -110.9747,
  5000,
  1,
  1920,
  'Charming historic home in the heart of downtown Tucson. Original hardwood floors, high ceilings, and tons of character. Walking distance to restaurants and shops.',
  350000,
  45000,
  15000,
  'John Smith',
  'john@example.com',
  '555-0101',
  ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  'YOUR_USER_ID_HERE',
  'active'
),

-- Listing 2: University Area
(
  'Modern University District Investment',
  '456 N Campbell Ave',
  'Tucson',
  'AZ',
  '85719',
  450000,
  4,
  3,
  2400,
  32.2326,
  -110.9447,
  7500,
  2,
  2015,
  'Stunning modern home near University of Arizona. Open floor plan, gourmet kitchen, and premium finishes throughout. Great rental potential.',
  550000,
  30000,
  20000,
  'Sarah Johnson',
  'sarah@example.com',
  '555-0102',
  ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'],
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  'YOUR_USER_ID_HERE',
  'active'
),

-- Listing 3: Foothills
(
  'Catalina Foothills Mountain View',
  '789 E Skyline Dr',
  'Tucson',
  'AZ',
  '85718',
  750000,
  5,
  4,
  3500,
  32.3326,
  -110.8747,
  12000,
  3,
  2020,
  'Luxury home with breathtaking mountain views in the prestigious Catalina Foothills. Custom built with high-end finishes, resort-style pool, and smart home technology.',
  850000,
  20000,
  25000,
  'Mike Davis',
  'mike@example.com',
  '555-0103',
  ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'],
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  'YOUR_USER_ID_HERE',
  'active'
),

-- Listing 4: East Side
(
  'East Side Fix & Flip Opportunity',
  '321 S Houghton Rd',
  'Tucson',
  'AZ',
  '85748',
  180000,
  3,
  2,
  1500,
  32.2126,
  -110.7747,
  6000,
  1,
  1985,
  'Great fix and flip opportunity in established neighborhood. Needs cosmetic updates but solid bones. Easy access to major roads and shopping.',
  280000,
  55000,
  12000,
  'Lisa Martinez',
  'lisa@example.com',
  '555-0104',
  ARRAY['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'],
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  'YOUR_USER_ID_HERE',
  'active'
),

-- Listing 5: Northwest
(
  'Northwest Marana Family Home',
  '654 W Tangerine Rd',
  'Marana',
  'AZ',
  '85658',
  320000,
  4,
  2.5,
  2200,
  32.4126,
  -111.0747,
  8000,
  2,
  2010,
  'Spacious family home in growing Northwest area. Open concept living, large backyard, and highly rated schools. Perfect for owner-occupant or rental.',
  400000,
  35000,
  15000,
  'Tom Wilson',
  'tom@example.com',
  '555-0105',
  ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'],
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'YOUR_USER_ID_HERE',
  'active'
);

-- Verify the data was inserted
SELECT 
  id,
  title,
  address,
  city,
  price,
  beds,
  baths,
  sqft,
  latitude,
  longitude,
  created_at
FROM listings
ORDER BY created_at DESC
LIMIT 5;

-- Check that coordinates are valid
SELECT 
  id,
  title,
  latitude,
  longitude,
  CASE 
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN '✅ Valid'
    ELSE '❌ Missing coordinates'
  END as coordinate_status
FROM listings
ORDER BY created_at DESC
LIMIT 5;

