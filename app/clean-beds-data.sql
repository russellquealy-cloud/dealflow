-- Clean up beds/bedrooms data inconsistencies and create fresh test data
-- Run this in your Supabase SQL Editor

-- Step 1: Delete all existing listings to start fresh
DELETE FROM listings;

-- Step 2: Insert clean test data with consistent beds/bedrooms values
INSERT INTO listings (
  title, address, city, state, zip, price, beds, bedrooms, baths, sqft, 
  latitude, longitude, description, cover_image_url, created_at
) VALUES
-- 1 Bedroom Properties
('Downtown Loft', '123 Main St', 'Miami', 'FL', '33101', 350000, 1, 1, 1, 800, 
 25.7617, -80.1918, 'Modern downtown loft', 
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', NOW()),

('Beach Condo', '456 Ocean Dr', 'Miami Beach', 'FL', '33139', 450000, 1, 1, 1, 900, 
 25.7907, -80.1300, 'Oceanfront condo', 
 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', NOW()),

-- 2 Bedroom Properties  
('Coral Gables Home', '789 Miracle Mile', 'Coral Gables', 'FL', '33134', 650000, 2, 2, 2, 1200, 
 25.7213, -80.2684, 'Charming 2-bedroom home', 
 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', NOW()),

('Brickell Apartment', '321 Brickell Ave', 'Miami', 'FL', '33131', 575000, 2, 2, 2, 1100, 
 25.7663, -80.1917, 'High-rise apartment', 
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', NOW()),

('Wynwood Loft', '654 NW 2nd Ave', 'Miami', 'FL', '33127', 525000, 2, 2, 1, 1000, 
 25.8006, -80.1994, 'Artist district loft', 
 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', NOW()),

-- 3 Bedroom Properties
('Coconut Grove Villa', '987 Main Hwy', 'Coconut Grove', 'FL', '33133', 850000, 3, 3, 2, 1600, 
 25.7289, -80.2387, 'Beautiful 3-bedroom villa', 
 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', NOW()),

('Aventura Townhouse', '147 Country Club Dr', 'Aventura', 'FL', '33180', 750000, 3, 3, 2, 1500, 
 25.9564, -80.1390, 'Modern townhouse', 
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', NOW()),

('Key Biscayne Home', '258 Crandon Blvd', 'Key Biscayne', 'FL', '33149', 950000, 3, 3, 3, 1800, 
 25.6687, -80.1561, 'Island home with views', 
 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', NOW()),

-- 4 Bedroom Properties
('Pinecrest Estate', '369 SW 57th Ave', 'Pinecrest', 'FL', '33156', 1200000, 4, 4, 3, 2500, 
 25.6687, -80.2978, 'Luxury 4-bedroom estate', 
 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', NOW()),

('Palmetto Bay House', '741 SW 184th St', 'Palmetto Bay', 'FL', '33157', 1100000, 4, 4, 3, 2300, 
 25.6198, -80.3150, 'Family home with pool', 
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', NOW()),

-- 5+ Bedroom Properties (These should be filtered out when Max Beds < 5)
('Miami Shores Mansion', '852 NE 2nd Ave', 'Miami Shores', 'FL', '33138', 2500000, 5, 5, 4, 4000, 
 25.8648, -80.1625, 'Luxury 5-bedroom mansion - SHOULD BE FILTERED OUT', 
 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', NOW()),

('Star Island Villa', '963 Star Island Dr', 'Miami Beach', 'FL', '33139', 8500000, 6, 6, 5, 6000, 
 25.7847, -80.1581, 'Ultra-luxury 6-bedroom villa - SHOULD BE FILTERED OUT', 
 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', NOW());

-- Verify the data
SELECT 
  title, 
  beds, 
  bedrooms, 
  CASE 
    WHEN beds = bedrooms THEN '✅ CONSISTENT'
    ELSE '❌ INCONSISTENT' 
  END as data_quality,
  price
FROM listings 
ORDER BY beds, bedrooms;
