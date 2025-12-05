-- Market snapshots table for storing metro-level market data
-- Created: 2025-12-05
-- Purpose: Publicly readable market data snapshots from CSV imports

CREATE TABLE IF NOT EXISTS public.market_snapshots (
  region_id int8 PRIMARY KEY,
  size_rank int4,
  region_name text,
  region_type text,
  state_name text,
  zhvi_mid_all numeric,
  zhvi_mid_all_raw numeric,
  zhvi_mid_sfr numeric,
  zhvi_mid_condo numeric,
  zhvi_bottom_all numeric,
  zhvi_top_all numeric,
  zhvi_mid_1br numeric,
  zhvi_mid_2br numeric,
  zhvi_mid_3br numeric,
  zhvi_mid_4br numeric,
  zhvi_mid_5br numeric,
  zori_rent_index numeric,
  inventory_for_sale numeric,
  new_listings numeric,
  new_pending numeric,
  sales_count numeric,
  new_construction_sales_count numeric,
  median_sale_price_now numeric,
  median_sale_to_list numeric,
  pct_sold_above_list numeric,
  pct_listings_price_cut numeric,
  median_days_to_close numeric,
  market_temp_index numeric,
  income_needed_to_buy_20pct_mid numeric,
  income_needed_to_rent_mid numeric,
  zhvf_base_date date,
  zhvf_growth_1m numeric,
  zhvf_growth_3m numeric,
  zhvf_growth_12m numeric,
  -- Snapshot date columns (all as date type)
  snapshot_date_zhvi_mid_all date,
  snapshot_date_zhvi_mid_all_raw date,
  snapshot_date_zhvi_mid_sfr date,
  snapshot_date_zhvi_mid_condo date,
  snapshot_date_zhvi_bottom_all date,
  snapshot_date_zhvi_top_all date,
  snapshot_date_zhvi_mid_1br date,
  snapshot_date_zhvi_mid_2br date,
  snapshot_date_zhvi_mid_3br date,
  snapshot_date_zhvi_mid_4br date,
  snapshot_date_zhvi_mid_5br date,
  snapshot_date_zori_rent_index date,
  snapshot_date_inventory_for_sale date,
  snapshot_date_new_listings date,
  snapshot_date_new_pending date,
  snapshot_date_sales_count date,
  snapshot_date_new_construction_sales_count date,
  snapshot_date_median_sale_price_now date,
  snapshot_date_median_sale_to_list date,
  snapshot_date_pct_sold_above_list date,
  snapshot_date_pct_listings_price_cut date,
  snapshot_date_median_days_to_close date,
  snapshot_date_market_temp_index date,
  snapshot_date_income_needed_to_buy_20pct_mid date,
  snapshot_date_income_needed_to_rent_mid date
);

-- Enable Row Level Security
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow read access for all (authenticated and anonymous users)
CREATE POLICY "Allow read for all"
ON public.market_snapshots
FOR SELECT
TO public
USING (true);

-- Note: No INSERT, UPDATE, or DELETE policies
-- Writes must be done via service role key (server-side only)

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_market_snapshots_region_type ON public.market_snapshots(region_type);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_state_name ON public.market_snapshots(state_name);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_size_rank ON public.market_snapshots(size_rank);

-- Optional: Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_market_snapshots_state_region_type ON public.market_snapshots(state_name, region_type) 
  WHERE state_name IS NOT NULL AND region_type IS NOT NULL;

-- Verify table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'market_snapshots'
  ) THEN
    RAISE NOTICE 'Table market_snapshots created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create market_snapshots table';
  END IF;
END $$;
