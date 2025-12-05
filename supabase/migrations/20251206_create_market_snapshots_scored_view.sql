-- Market Snapshots Scored View
-- Created: 2025-12-06
-- Purpose: Adds computed score columns (0-100) to market_snapshots based on percentile rankings

CREATE OR REPLACE VIEW public.market_snapshots_scored AS
WITH base_data AS (
  -- Filter to only MSA and country regions, and select all columns
  SELECT *
  FROM public.market_snapshots
  WHERE region_type IN ('msa', 'country')
),
percentiles AS (
  -- Compute all percentiles using PERCENT_RANK() window functions
  -- PERCENT_RANK() returns 0-1, where 0 is the minimum and 1 is the maximum
  -- PERCENT_RANK() automatically excludes NULL values from ranking
  SELECT
    *,
    -- Growth percentile (higher is better)
    CASE 
      WHEN zhvf_growth_12m IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY zhvf_growth_12m)
      ELSE NULL
    END AS growth_pct,
    
    -- Competition percentiles (higher is better for most)
    CASE 
      WHEN pct_sold_above_list IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY pct_sold_above_list)
      ELSE NULL
    END AS pct_sold_above_list_pct,
    
    CASE 
      WHEN median_sale_to_list IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY median_sale_to_list)
      ELSE NULL
    END AS median_sale_to_list_pct,
    
    CASE 
      WHEN market_temp_index IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY market_temp_index)
      ELSE NULL
    END AS market_temp_index_pct,
    
    CASE 
      WHEN pct_listings_price_cut IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY pct_listings_price_cut)
      ELSE NULL
    END AS price_cuts_pct,
    
    -- Liquidity percentiles (higher is better for sales_count, lower is better for days_to_close)
    CASE 
      WHEN sales_count IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY sales_count)
      ELSE NULL
    END AS sales_count_pct,
    
    CASE 
      WHEN median_days_to_close IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY median_days_to_close)
      ELSE NULL
    END AS median_days_to_close_pct,
    
    -- Affordability percentiles (lower is better for all of these, so we'll invert)
    CASE 
      WHEN zhvi_mid_sfr IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY zhvi_mid_sfr)
      ELSE NULL
    END AS zhvi_mid_sfr_pct,
    
    CASE 
      WHEN income_needed_to_buy_20pct_mid IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY income_needed_to_buy_20pct_mid)
      ELSE NULL
    END AS income_to_buy_pct,
    
    CASE 
      WHEN income_needed_to_rent_mid IS NOT NULL 
      THEN PERCENT_RANK() OVER (ORDER BY income_needed_to_rent_mid)
      ELSE NULL
    END AS income_to_rent_pct,
    
    -- Rental yield percentile (computed from zori_rent_index / zhvi_mid_sfr)
    CASE 
      WHEN zori_rent_index IS NOT NULL 
        AND zhvi_mid_sfr IS NOT NULL 
        AND zhvi_mid_sfr != 0
      THEN PERCENT_RANK() OVER (ORDER BY (zori_rent_index / NULLIF(zhvi_mid_sfr, 0)))
      ELSE NULL
    END AS rental_yield_pct
  FROM base_data
)
SELECT
  -- All original columns from market_snapshots
  region_id,
  size_rank,
  region_name,
  region_type,
  state_name,
  zhvi_mid_all,
  zhvi_mid_all_raw,
  zhvi_mid_sfr,
  zhvi_mid_condo,
  zhvi_bottom_all,
  zhvi_top_all,
  zhvi_mid_1br,
  zhvi_mid_2br,
  zhvi_mid_3br,
  zhvi_mid_4br,
  zhvi_mid_5br,
  zori_rent_index,
  inventory_for_sale,
  new_listings,
  new_pending,
  sales_count,
  new_construction_sales_count,
  median_sale_price_now,
  median_sale_to_list,
  pct_sold_above_list,
  pct_listings_price_cut,
  median_days_to_close,
  market_temp_index,
  income_needed_to_buy_20pct_mid,
  income_needed_to_rent_mid,
  zhvf_base_date,
  zhvf_growth_1m,
  zhvf_growth_3m,
  zhvf_growth_12m,
  snapshot_date_zhvi_mid_all,
  snapshot_date_zhvi_mid_all_raw,
  snapshot_date_zhvi_mid_sfr,
  snapshot_date_zhvi_mid_condo,
  snapshot_date_zhvi_bottom_all,
  snapshot_date_zhvi_top_all,
  snapshot_date_zhvi_mid_1br,
  snapshot_date_zhvi_mid_2br,
  snapshot_date_zhvi_mid_3br,
  snapshot_date_zhvi_mid_4br,
  snapshot_date_zhvi_mid_5br,
  snapshot_date_zori_rent_index,
  snapshot_date_inventory_for_sale,
  snapshot_date_new_listings,
  snapshot_date_new_pending,
  snapshot_date_sales_count,
  snapshot_date_new_construction_sales_count,
  snapshot_date_median_sale_price_now,
  snapshot_date_median_sale_to_list,
  snapshot_date_pct_sold_above_list,
  snapshot_date_pct_listings_price_cut,
  snapshot_date_median_days_to_close,
  snapshot_date_market_temp_index,
  snapshot_date_income_needed_to_buy_20pct_mid,
  snapshot_date_income_needed_to_rent_mid,
  
  -- Computed scores (0-100)
  -- Growth Score: Direct percentile
  ROUND(100 * COALESCE(growth_pct, 0.5))::integer AS growth_score,
  
  -- Competition Score: Average of competition indicators
  -- Higher pct_sold_above_list, median_sale_to_list, market_temp_index = more competition (better)
  -- Lower price_cuts = less competition (better), so we use (1 - price_cuts_pct)
  ROUND(100 * (
    COALESCE(pct_sold_above_list_pct, 0.5) + 
    COALESCE(median_sale_to_list_pct, 0.5) + 
    COALESCE(market_temp_index_pct, 0.5) + 
    (1 - COALESCE(price_cuts_pct, 0.5))
  ) / 4.0)::integer AS competition_score,
  
  -- Liquidity Score: Average of liquidity indicators
  -- Higher sales_count = better, lower days_to_close = better
  ROUND(100 * (
    COALESCE(sales_count_pct, 0.5) + 
    (1 - COALESCE(median_days_to_close_pct, 0.5))
  ) / 2.0)::integer AS liquidity_score,
  
  -- Affordability Score: Average of affordability indicators (inverted since lower = better)
  ROUND(100 * (
    (1 - COALESCE(zhvi_mid_sfr_pct, 0.5)) + 
    (1 - COALESCE(income_to_buy_pct, 0.5)) + 
    (1 - COALESCE(income_to_rent_pct, 0.5))
  ) / 3.0)::integer AS affordability_score,
  
  -- Rental Yield Score: Direct percentile
  ROUND(100 * COALESCE(rental_yield_pct, 0.5))::integer AS rental_yield_score,
  
  -- Market Strength Score: Weighted combination
  ROUND(100 * (
    0.4 * COALESCE(growth_pct, 0.5) + 
    0.25 * (COALESCE(pct_sold_above_list_pct, 0.5) + COALESCE(median_sale_to_list_pct, 0.5) + COALESCE(market_temp_index_pct, 0.5) + (1 - COALESCE(price_cuts_pct, 0.5))) / 4.0 +
    0.2 * (COALESCE(sales_count_pct, 0.5) + (1 - COALESCE(median_days_to_close_pct, 0.5))) / 2.0 +
    0.15 * COALESCE(rental_yield_pct, 0.5)
  ))::integer AS market_strength_score,
  
  -- Flip Score: Weighted combination for flipping strategy
  ROUND(100 * (
    0.5 * (COALESCE(sales_count_pct, 0.5) + (1 - COALESCE(median_days_to_close_pct, 0.5))) / 2.0 +
    0.3 * (COALESCE(pct_sold_above_list_pct, 0.5) + COALESCE(median_sale_to_list_pct, 0.5) + COALESCE(market_temp_index_pct, 0.5) + (1 - COALESCE(price_cuts_pct, 0.5))) / 4.0 +
    0.2 * COALESCE(growth_pct, 0.5)
  ))::integer AS flip_score,
  
  -- Rental Score: Weighted combination for rental strategy
  ROUND(100 * (
    0.45 * COALESCE(rental_yield_pct, 0.5) +
    0.35 * ((1 - COALESCE(zhvi_mid_sfr_pct, 0.5)) + (1 - COALESCE(income_to_buy_pct, 0.5)) + (1 - COALESCE(income_to_rent_pct, 0.5))) / 3.0 +
    0.2 * COALESCE(growth_pct, 0.5)
  ))::integer AS rental_score

FROM percentiles;

-- Grant read access to the view (same as the base table)
GRANT SELECT ON public.market_snapshots_scored TO authenticated;
GRANT SELECT ON public.market_snapshots_scored TO anon;

-- Add comment to document the view
COMMENT ON VIEW public.market_snapshots_scored IS 
'Market snapshots with computed score columns (0-100). Scores are based on percentile rankings across all MSA and country regions. Higher scores indicate better performance for each metric.';

