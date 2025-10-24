-- Seed buyer data for Deal Flow
-- Run this in your Supabase SQL Editor

-- Create buyers table if it doesn't exist
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  company TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  investment_focus TEXT[], -- Array of focus areas
  price_range_min INTEGER,
  price_range_max INTEGER,
  property_types TEXT[], -- Array of property types
  bed_min INTEGER,
  bed_max INTEGER,
  bath_min INTEGER,
  bath_max INTEGER,
  sqft_min INTEGER,
  sqft_max INTEGER,
  max_distance_miles INTEGER DEFAULT 25,
  investment_criteria JSONB, -- Additional criteria
  tags TEXT[], -- Tags for matching
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active buyers" ON buyers 
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can insert buyers" ON buyers 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own buyers" ON buyers 
  FOR UPDATE USING (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS buyers_city_state_idx ON buyers(city, state);
CREATE INDEX IF NOT EXISTS buyers_price_range_idx ON buyers(price_range_min, price_range_max);
CREATE INDEX IF NOT EXISTS buyers_property_types_idx ON buyers USING GIN(property_types);
CREATE INDEX IF NOT EXISTS buyers_tags_idx ON buyers USING GIN(tags);
CREATE INDEX IF NOT EXISTS buyers_active_idx ON buyers(is_active);

-- Insert sample buyer data
INSERT INTO buyers (
  name, email, phone, company, city, state, zip,
  investment_focus, price_range_min, price_range_max, property_types,
  bed_min, bed_max, bath_min, bath_max, sqft_min, sqft_max,
  max_distance_miles, investment_criteria, tags
) VALUES
-- Tucson, AZ Buyers
('John Smith', 'john@tucsoninvestments.com', '(520) 555-0101', 'Tucson Investment Group', 'Tucson', 'AZ', '85701',
 ARRAY['fix_and_flip', 'rental'], 150000, 400000, ARRAY['single_family', 'condo'],
 2, 4, 2, 3, 1200, 2500, 15,
 '{"min_roi": 15, "max_arv": 500000, "preferred_areas": ["downtown", "university"]}',
 ARRAY['experienced', 'cash_buyer', 'quick_close']),

('Sarah Johnson', 'sarah@desertproperties.com', '(520) 555-0102', 'Desert Properties LLC', 'Tucson', 'AZ', '85719',
 ARRAY['rental', 'buy_and_hold'], 100000, 300000, ARRAY['single_family', 'townhouse'],
 2, 3, 2, 2, 1000, 2000, 20,
 '{"min_cap_rate": 8, "max_rent_ratio": 0.8, "preferred_areas": ["suburbs"]}',
 ARRAY['landlord', 'long_term', 'tenant_ready']),

('Mike Rodriguez', 'mike@azwholesale.com', '(520) 555-0103', 'AZ Wholesale Partners', 'Tucson', 'AZ', '85705',
 ARRAY['wholesale', 'assignment'], 80000, 250000, ARRAY['single_family', 'multi_family'],
 1, 5, 1, 4, 800, 3000, 30,
 '{"assignment_fee_max": 10000, "closing_time": "14_days", "preferred_areas": ["all"]}',
 ARRAY['wholesaler', 'assignment_fee', 'quick_turn']),

-- Phoenix, AZ Buyers
('Lisa Chen', 'lisa@phoenixcapital.com', '(602) 555-0201', 'Phoenix Capital Partners', 'Phoenix', 'AZ', '85001',
 ARRAY['fix_and_flip', 'new_construction'], 200000, 600000, ARRAY['single_family', 'condo'],
 3, 5, 2, 4, 1500, 3500, 25,
 '{"min_roi": 20, "max_arv": 800000, "preferred_areas": ["scottsdale", "tempe"]}',
 ARRAY['high_end', 'luxury', 'new_construction']),

('David Wilson', 'david@valleyinvestments.com', '(602) 555-0202', 'Valley Investment Group', 'Phoenix', 'AZ', '85016',
 ARRAY['rental', 'commercial'], 100000, 500000, ARRAY['single_family', 'multi_family', 'commercial'],
 2, 6, 2, 4, 1000, 4000, 35,
 '{"min_cap_rate": 10, "max_rent_ratio": 0.7, "preferred_areas": ["phoenix", "mesa"]}',
 ARRAY['commercial', 'multi_family', 'cash_flow']),

-- Las Vegas, NV Buyers
('Jennifer Martinez', 'jennifer@vegasdeals.com', '(702) 555-0301', 'Vegas Deal Finders', 'Las Vegas', 'NV', '89101',
 ARRAY['wholesale', 'fix_and_flip'], 120000, 350000, ARRAY['single_family', 'condo'],
 2, 4, 2, 3, 1200, 2500, 20,
 '{"assignment_fee_max": 15000, "closing_time": "21_days", "preferred_areas": ["henderson", "summerlin"]}',
 ARRAY['vegas_specialist', 'tourist_areas', 'short_term_rental']),

('Robert Kim', 'robert@nevadainvestments.com', '(702) 555-0302', 'Nevada Investment Co', 'Las Vegas', 'NV', '89117',
 ARRAY['rental', 'buy_and_hold'], 150000, 400000, ARRAY['single_family', 'townhouse'],
 3, 5, 2, 3, 1500, 3000, 25,
 '{"min_cap_rate": 9, "max_rent_ratio": 0.75, "preferred_areas": ["suburbs", "new_construction"]}',
 ARRAY['long_term', 'stable_income', 'growth_areas']),

-- Denver, CO Buyers
('Amanda Thompson', 'amanda@denvercapital.com', '(303) 555-0401', 'Denver Capital Group', 'Denver', 'CO', '80201',
 ARRAY['fix_and_flip', 'luxury'], 300000, 800000, ARRAY['single_family', 'condo'],
 3, 6, 3, 5, 2000, 5000, 30,
 '{"min_roi": 25, "max_arv": 1000000, "preferred_areas": ["cherry_creek", "highlands"]}',
 ARRAY['luxury', 'high_end', 'mountain_views']),

('Carlos Garcia', 'carlos@coloradoinvestments.com', '(303) 555-0402', 'Colorado Investment Partners', 'Denver', 'CO', '80202',
 ARRAY['rental', 'multi_family'], 200000, 600000, ARRAY['single_family', 'multi_family'],
 2, 8, 2, 4, 1200, 4000, 40,
 '{"min_cap_rate": 8, "max_rent_ratio": 0.8, "preferred_areas": ["aurora", "lakewood"]}',
 ARRAY['multi_family', 'cash_flow', 'growth_market']),

-- Austin, TX Buyers
('Michelle Lee', 'michelle@austininvestments.com', '(512) 555-0501', 'Austin Investment Group', 'Austin', 'TX', '78701',
 ARRAY['fix_and_flip', 'new_construction'], 250000, 700000, ARRAY['single_family', 'condo'],
 3, 5, 2, 4, 1500, 3500, 25,
 '{"min_roi": 18, "max_arv": 900000, "preferred_areas": ["downtown", "east_austin"]}',
 ARRAY['tech_corridor', 'growth_market', 'young_professionals']),

('James Brown', 'james@texaswholesale.com', '(512) 555-0502', 'Texas Wholesale Partners', 'Austin', 'TX', '78702',
 ARRAY['wholesale', 'assignment'], 150000, 400000, ARRAY['single_family', 'townhouse'],
 2, 4, 2, 3, 1200, 2500, 30,
 '{"assignment_fee_max": 12000, "closing_time": "14_days", "preferred_areas": ["round_rock", "cedar_park"]}',
 ARRAY['wholesaler', 'assignment_fee', 'suburbs']),

-- Miami, FL Buyers
('Elena Rodriguez', 'elena@miamideals.com', '(305) 555-0601', 'Miami Deal Finders', 'Miami', 'FL', '33101',
 ARRAY['fix_and_flip', 'luxury'], 400000, 1200000, ARRAY['single_family', 'condo'],
 3, 6, 3, 5, 2000, 5000, 20,
 '{"min_roi": 20, "max_arv": 1500000, "preferred_areas": ["brickell", "coconut_grove"]}',
 ARRAY['luxury', 'waterfront', 'international']),

('Anthony Davis', 'anthony@floridainvestments.com', '(305) 555-0602', 'Florida Investment Co', 'Miami', 'FL', '33125',
 ARRAY['rental', 'short_term_rental'], 200000, 600000, ARRAY['single_family', 'condo'],
 2, 4, 2, 3, 1200, 3000, 25,
 '{"min_cap_rate": 10, "max_rent_ratio": 0.7, "preferred_areas": ["airport", "downtown"]}',
 ARRAY['short_term_rental', 'tourist_market', 'airbnb']),

-- National Buyers (Multiple Markets)
('National Capital Group', 'investments@nationalcapital.com', '(555) 555-1001', 'National Capital Group', 'Multiple', 'Multiple', '00000',
 ARRAY['fix_and_flip', 'rental', 'commercial'], 100000, 2000000, ARRAY['single_family', 'multi_family', 'commercial'],
 1, 10, 1, 6, 800, 10000, 50,
 '{"min_roi": 15, "max_arv": 3000000, "preferred_areas": ["major_metros"]}',
 ARRAY['national', 'large_portfolio', 'institutional']),

('Quick Cash Buyers', 'quick@cashbuyers.com', '(555) 555-1002', 'Quick Cash Buyers', 'Multiple', 'Multiple', '00000',
 ARRAY['wholesale', 'cash_sale'], 50000, 500000, ARRAY['single_family', 'condo', 'townhouse'],
 1, 5, 1, 4, 600, 3000, 100,
 '{"assignment_fee_max": 20000, "closing_time": "7_days", "preferred_areas": ["all"]}',
 ARRAY['cash_buyer', 'quick_close', 'any_condition']);

-- Create function to find matching buyers
CREATE OR REPLACE FUNCTION find_matching_buyers(
  listing_city TEXT,
  listing_state TEXT,
  listing_price INTEGER,
  listing_beds INTEGER,
  listing_baths INTEGER,
  listing_sqft INTEGER,
  listing_type TEXT DEFAULT 'single_family'
)
RETURNS TABLE (
  buyer_id UUID,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_company TEXT,
  match_score INTEGER,
  match_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.email,
    b.phone,
    b.company,
    -- Calculate match score (0-100)
    (
      CASE WHEN b.city = listing_city AND b.state = listing_state THEN 30 ELSE 0 END +
      CASE WHEN listing_price BETWEEN b.price_range_min AND b.price_range_max THEN 25 ELSE 0 END +
      CASE WHEN listing_beds BETWEEN b.bed_min AND b.bed_max THEN 15 ELSE 0 END +
      CASE WHEN listing_baths BETWEEN b.bath_min AND b.bath_max THEN 10 ELSE 0 END +
      CASE WHEN listing_sqft BETWEEN b.sqft_min AND b.sqft_max THEN 10 ELSE 0 END +
      CASE WHEN listing_type = ANY(b.property_types) THEN 10 ELSE 0 END
    ) as match_score,
    ARRAY[
      CASE WHEN b.city = listing_city AND b.state = listing_state THEN 'Same city/state' END,
      CASE WHEN listing_price BETWEEN b.price_range_min AND b.price_range_max THEN 'Price range match' END,
      CASE WHEN listing_beds BETWEEN b.bed_min AND b.bed_max THEN 'Bedroom count match' END,
      CASE WHEN listing_baths BETWEEN b.bath_min AND b.bath_max THEN 'Bathroom count match' END,
      CASE WHEN listing_sqft BETWEEN b.sqft_min AND b.sqft_max THEN 'Square footage match' END,
      CASE WHEN listing_type = ANY(b.property_types) THEN 'Property type match' END
    ] as match_reasons
  FROM buyers b
  WHERE b.is_active = TRUE
    AND (
      (b.city = listing_city AND b.state = listing_state) OR
      (b.max_distance_miles >= 25) -- National buyers
    )
    AND listing_price BETWEEN b.price_range_min AND b.price_range_max
    AND listing_beds BETWEEN b.bed_min AND b.bed_max
    AND listing_baths BETWEEN b.bath_min AND b.bath_max
    AND listing_sqft BETWEEN b.sqft_min AND b.sqft_max
    AND listing_type = ANY(b.property_types)
  ORDER BY match_score DESC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get buyer statistics
CREATE OR REPLACE FUNCTION get_buyer_stats()
RETURNS TABLE (
  total_buyers BIGINT,
  active_buyers BIGINT,
  buyers_by_state JSONB,
  buyers_by_focus JSONB,
  avg_price_range JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_buyers,
    COUNT(*) FILTER (WHERE is_active = TRUE) as active_buyers,
    jsonb_object_agg(state, state_count) as buyers_by_state,
    jsonb_object_agg(focus, focus_count) as buyers_by_focus,
    jsonb_build_object(
      'min', AVG(price_range_min),
      'max', AVG(price_range_max)
    ) as avg_price_range
  FROM (
    SELECT 
      state,
      COUNT(*) as state_count
    FROM buyers
    WHERE is_active = TRUE
    GROUP BY state
  ) state_stats,
  (
    SELECT 
      unnest(investment_focus) as focus,
      COUNT(*) as focus_count
    FROM buyers
    WHERE is_active = TRUE
    GROUP BY unnest(investment_focus)
  ) focus_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
