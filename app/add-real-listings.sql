-- Add diverse real listings across multiple states
-- Run this in your Supabase SQL Editor

INSERT INTO listings (
  id, title, address, city, state, zip, price, beds, bedrooms, baths, sqft, 
  latitude, longitude, description, cover_image_url, created_at
) VALUES
-- Phoenix, Arizona
('real-001', 'Modern Phoenix Home', '1234 N Central Ave', 'Phoenix', 'AZ', '85004', 425000, 3, 3, 2, 1800, 
 33.4484, -112.0740, 'Beautiful modern home in central Phoenix', 
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', NOW()),

-- Las Vegas, Nevada  
('real-002', 'Vegas Desert Villa', '5678 Las Vegas Blvd', 'Las Vegas', 'NV', '89109', 675000, 4, 4, 3, 2400,
 36.1699, -115.1398, 'Stunning villa near the Strip',
 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', NOW()),

-- Denver, Colorado
('real-003', 'Mountain View Condo', '9012 E Colfax Ave', 'Denver', 'CO', '80220', 385000, 2, 2, 2, 1200,
 39.7392, -104.9903, 'Modern condo with mountain views',
 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', NOW()),

-- Austin, Texas
('real-004', 'Austin Craftsman', '3456 S Lamar Blvd', 'Austin', 'TX', '78704', 525000, 3, 3, 2, 1900,
 30.2672, -97.7431, 'Charming craftsman in South Austin',
 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', NOW()),

-- Miami, Florida
('real-005', 'Miami Beach Condo', '7890 Ocean Dr', 'Miami Beach', 'FL', '33139', 850000, 2, 2, 2, 1100,
 25.7617, -80.1918, 'Oceanfront luxury condo',
 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800', NOW()),

-- Seattle, Washington
('real-006', 'Seattle Townhouse', '2345 Pine St', 'Seattle', 'WA', '98101', 725000, 3, 3, 2.5, 1600,
 47.6062, -122.3321, 'Modern townhouse in Capitol Hill',
 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800', NOW()),

-- Atlanta, Georgia  
('real-007', 'Atlanta Victorian', '6789 Peachtree St', 'Atlanta', 'GA', '30309', 465000, 4, 4, 3, 2200,
 33.7490, -84.3880, 'Historic Victorian in Midtown',
 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800', NOW()),

-- Portland, Oregon
('real-008', 'Portland Bungalow', '4567 N Williams Ave', 'Portland', 'OR', '97227', 595000, 2, 2, 1, 1000,
 45.5152, -122.6784, 'Cozy bungalow in trendy neighborhood',
 'https://images.unsplash.com/photo-1600607688618-c4b3c7c5c567?w=800', NOW()),

-- Nashville, Tennessee
('real-009', 'Nashville Ranch', '8901 Music Valley Dr', 'Nashville', 'TN', '37214', 475000, 3, 3, 2, 1700,
 36.1627, -86.7816, 'Ranch style home near Music Row',
 'https://images.unsplash.com/photo-1600607688842-6c3b3b3b3b3b?w=800', NOW()),

-- Raleigh, North Carolina
('real-010', 'Raleigh Colonial', '1357 Glenwood Ave', 'Raleigh', 'NC', '27603', 395000, 4, 4, 2.5, 2000,
 35.7796, -78.6382, 'Classic colonial in downtown area',
 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800', NOW()),

-- Test 5+ bedroom house to verify filter
('real-011', 'Large Family Home', '9999 Test St', 'Phoenix', 'AZ', '85001', 750000, 5, 5, 4, 3500,
 33.4484, -112.0740, 'Large 5-bedroom family home - should be filtered out when max beds = 4',
 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800', NOW()),

-- More 4-bedroom houses to test filter
('real-012', '4BR Test House 1', '1111 Filter Test Ave', 'Las Vegas', 'NV', '89101', 550000, 4, 4, 3, 2200,
 36.1699, -115.1398, '4-bedroom house - should show when max beds = 4',
 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', NOW()),

('real-013', '4BR Test House 2', '2222 Filter Test Blvd', 'Denver', 'CO', '80201', 485000, 4, 4, 2.5, 2000,
 39.7392, -104.9903, '4-bedroom house - should show when max beds = 4',
 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', NOW())

ON CONFLICT (id) DO NOTHING;
