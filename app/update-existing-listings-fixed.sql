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
  cover_image_url = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  contact_name = 'John Smith',
  contact_email = 'john.smith@example.com',
  contact_phone = '555-123-4567'
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
  cover_image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  contact_name = 'Sarah Johnson',
  contact_email = 'sarah.johnson@example.com',
  contact_phone = '555-234-5678'
WHERE id = 'fb85cc91-e76c-436b-8d6f-1143933d0374';

-- Update the third listing
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
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
  cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  contact_name = 'Mike Wilson',
  contact_email = 'mike.wilson@example.com',
  contact_phone = '555-345-6789'
WHERE id = 'd6242826-c396-4a0d-bcc7-be39d3bb5ac4';

-- Update the fourth listing
UPDATE listings 
SET 
  beds = 5,
  baths = 3,
  sqft = 3000,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Historic renovation project in a desirable neighborhood. Great potential for a custom home.',
  year_built = 1930,
  garage = 0,
  image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  contact_name = 'Lisa Davis',
  contact_email = 'lisa.davis@example.com',
  contact_phone = '555-456-7890'
WHERE id = 'b1dd3f39-aba8-4f6c-b9e1-4b21dec458bd';

-- Update the fifth listing
UPDATE listings 
SET 
  beds = 4,
  baths = 2,
  sqft = 2200,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Beautiful mountain view property with a large lot and mature landscaping. Quiet and private.',
  year_built = 1980,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  contact_name = 'David Brown',
  contact_email = 'david.brown@example.com',
  contact_phone = '555-567-8901'
WHERE id = 'df0b627a-8267-4a6a-adbb-e38c00a3eeb3';

-- Update the sixth listing
UPDATE listings 
SET 
  beds = 2,
  baths = 1,
  sqft = 1200,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Cozy starter home, recently updated with new flooring and paint. Great for first-time buyers.',
  year_built = 1970,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  contact_name = 'Robert Anderson',
  contact_email = 'robert.anderson@example.com',
  contact_phone = '555-789-0123'
WHERE id = '9a659527-d7d8-48e6-bc3a-83dcc3340dbf';

-- Update the seventh listing
UPDATE listings 
SET 
  beds = 5,
  baths = 4,
  sqft = 4000,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Luxury estate with a private pool and spa, perfect for high-end living and entertaining.',
  year_built = 2005,
  garage = 3,
  image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  contact_name = 'Amanda White',
  contact_email = 'amanda.white@example.com',
  contact_phone = '555-890-1234'
WHERE id = 'ba3ce286-61f4-4434-aaab-e85fa7e5ea17';

-- Update the eighth listing
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 1600,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Investment opportunity: well-maintained duplex with stable rental income. Close to amenities.',
  year_built = 1965,
  garage = 0,
  image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  contact_name = 'Christopher Lee',
  contact_email = 'christopher.lee@example.com',
  contact_phone = '555-901-2345'
WHERE id = 'da5bbffb-2862-482c-94bd-3954d90e18fe';

-- Update the ninth listing
UPDATE listings 
SET 
  beds = 1,
  baths = 1,
  sqft = 800,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Urban loft with stunning city views, perfect for a single professional. Modern design.',
  year_built = 2010,
  garage = 0,
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  contact_name = 'Michelle Garcia',
  contact_email = 'michelle.garcia@example.com',
  contact_phone = '555-012-3456'
WHERE id = 'a8834a1c-e400-49ba-839c-92a0b992bab1';

-- Update the tenth listing
UPDATE listings 
SET 
  beds = 4,
  baths = 2,
  sqft = 2800,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Rural acreage with a charming farmhouse, perfect for those seeking peace and quiet.',
  year_built = 1945,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  contact_name = 'Daniel Martinez',
  contact_email = 'daniel.martinez@example.com',
  contact_phone = '555-112-2334'
WHERE id = '2e9c6787-bd39-4620-a628-292b2c904d1e';

-- Update the eleventh listing
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 1900,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Well-maintained home in a quiet neighborhood, close to shopping and dining.',
  year_built = 1988,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  contact_name = 'Jessica Taylor',
  contact_email = 'jessica.taylor@example.com',
  contact_phone = '555-223-3445'
WHERE id = '9487600b-b3e7-4e3a-9927-6d150d7d7f8e';

-- Update the twelfth listing
UPDATE listings 
SET 
  beds = 4,
  baths = 3,
  sqft = 2500,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Spacious home with a large yard, perfect for families. Recent upgrades throughout.',
  year_built = 1992,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  contact_name = 'Kevin Moore',
  contact_email = 'kevin.moore@example.com',
  contact_phone = '555-334-4556'
WHERE id = '9f849bd3-aab9-42a8-afa6-f6a666504398';

-- Update the thirteenth listing
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 1750,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Charming bungalow with original details and modern updates. Great location.',
  year_built = 1955,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  contact_name = 'Laura Hall',
  contact_email = 'laura.hall@example.com',
  contact_phone = '555-445-5667'
WHERE id = 'd446dfd5-f5a4-470c-b23d-d42be357578e';

-- Update the fourteenth listing
UPDATE listings 
SET 
  beds = 4,
  baths = 3,
  sqft = 3200,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Executive home with stunning views and high-end finishes. Must see!',
  year_built = 2000,
  garage = 3,
  image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  contact_name = 'Brian King',
  contact_email = 'brian.king@example.com',
  contact_phone = '555-556-6778'
WHERE id = 'ed9f53f4-b61f-4654-b1c4-7b3df08663c2';

-- Update the fifteenth listing
UPDATE listings 
SET 
  beds = 2,
  baths = 2,
  sqft = 1400,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Cozy townhouse with a private patio, perfect for low-maintenance living.',
  year_built = 1998,
  garage = 1,
  image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  contact_name = 'Nicole Wright',
  contact_email = 'nicole.wright@example.com',
  contact_phone = '555-667-7889'
WHERE id = '72e25ff7-a174-428f-8dbc-748117a46422';

-- Update the sixteenth listing
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 1850,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Renovated adobe home with historic charm and modern amenities. Prime location.',
  year_built = 1935,
  garage = 0,
  image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  contact_name = 'Matthew Green',
  contact_email = 'matthew.green@example.com',
  contact_phone = '555-778-8990'
WHERE id = 'ed397f2c-a81e-4071-924a-92e096ea816a';

-- Update the seventeenth listing
UPDATE listings 
SET 
  beds = 3,
  baths = 2,
  sqft = 2100,
  city = 'Tucson',
  state = 'AZ',
  zip = '85701',
  description = 'Spacious home with a large backyard, perfect for families. Recent upgrades throughout.',
  year_built = 1990,
  garage = 2,
  image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  images = ARRAY[
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
  ],
  cover_image_url = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  contact_name = 'Olivia Baker',
  contact_email = 'olivia.baker@example.com',
  contact_phone = '555-889-9001'
WHERE id = '4001b49b-34d8-46e2-8da2-84b0619103bc';

-- Verify the updates worked
SELECT id, title, beds, baths, sqft, contact_name, contact_email, contact_phone 
FROM listings 
WHERE contact_name IS NOT NULL 
LIMIT 5;
