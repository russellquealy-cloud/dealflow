/**
 * Market Snapshot Types
 * 
 * Types for market snapshot data from the public.market_snapshots_scored view.
 * This view includes all columns from market_snapshots plus computed score columns (0-100).
 */

/**
 * Row type as returned from Supabase (snake_case column names)
 */
export type MarketSnapshotRow = {
  // Primary identifiers
  region_id: number;
  size_rank: number | null;
  region_name: string | null;
  region_type: string | null;
  state_name: string | null;

  // ZHVI (Zillow Home Value Index) metrics
  zhvi_mid_all: number | null;
  zhvi_mid_all_raw: number | null;
  zhvi_mid_sfr: number | null;
  zhvi_mid_condo: number | null;
  zhvi_bottom_all: number | null;
  zhvi_top_all: number | null;
  zhvi_mid_1br: number | null;
  zhvi_mid_2br: number | null;
  zhvi_mid_3br: number | null;
  zhvi_mid_4br: number | null;
  zhvi_mid_5br: number | null;

  // Rental metrics
  zori_rent_index: number | null;

  // Inventory and listing metrics
  inventory_for_sale: number | null;
  new_listings: number | null;
  new_pending: number | null;
  sales_count: number | null;
  new_construction_sales_count: number | null;

  // Pricing metrics
  median_sale_price_now: number | null;
  median_sale_to_list: number | null;
  pct_sold_above_list: number | null;
  pct_listings_price_cut: number | null;
  median_days_to_close: number | null;

  // Market indicators
  market_temp_index: number | null;

  // Affordability metrics
  income_needed_to_buy_20pct_mid: number | null;
  income_needed_to_rent_mid: number | null;

  // Growth metrics
  zhvf_base_date: string | null; // date
  zhvf_growth_1m: number | null;
  zhvf_growth_3m: number | null;
  zhvf_growth_12m: number | null;

  // Snapshot date columns
  snapshot_date_zhvi_mid_all: string | null; // date
  snapshot_date_zhvi_mid_all_raw: string | null; // date
  snapshot_date_zhvi_mid_sfr: string | null; // date
  snapshot_date_zhvi_mid_condo: string | null; // date
  snapshot_date_zhvi_bottom_all: string | null; // date
  snapshot_date_zhvi_top_all: string | null; // date
  snapshot_date_zhvi_mid_1br: string | null; // date
  snapshot_date_zhvi_mid_2br: string | null; // date
  snapshot_date_zhvi_mid_3br: string | null; // date
  snapshot_date_zhvi_mid_4br: string | null; // date
  snapshot_date_zhvi_mid_5br: string | null; // date
  snapshot_date_zori_rent_index: string | null; // date
  snapshot_date_inventory_for_sale: string | null; // date
  snapshot_date_new_listings: string | null; // date
  snapshot_date_new_pending: string | null; // date
  snapshot_date_sales_count: string | null; // date
  snapshot_date_new_construction_sales_count: string | null; // date
  snapshot_date_median_sale_price_now: string | null; // date
  snapshot_date_median_sale_to_list: string | null; // date
  snapshot_date_pct_sold_above_list: string | null; // date
  snapshot_date_pct_listings_price_cut: string | null; // date
  snapshot_date_median_days_to_close: string | null; // date
  snapshot_date_market_temp_index: string | null; // date
  snapshot_date_income_needed_to_buy_20pct_mid: string | null; // date
  snapshot_date_income_needed_to_rent_mid: string | null; // date

  // Computed score columns (0-100, from market_snapshots_scored view)
  growth_score: number | null;
  competition_score: number | null;
  liquidity_score: number | null;
  affordability_score: number | null;
  rental_yield_score: number | null;
  market_strength_score: number | null;
  flip_score: number | null;
  rental_score: number | null;
};

/**
 * Market snapshot type with camelCase field names for use in TypeScript/JavaScript
 * Maps to the public.market_snapshots_scored view columns
 */
export type MarketSnapshot = {
  // Primary identifiers
  regionId: number;
  sizeRank: number | null;
  regionName: string;
  regionType: string;
  stateName: string | null;

  // ZHVI (Zillow Home Value Index) metrics
  zhviMidAll: number | null;
  zhviMidAllRaw: number | null;
  zhviMidSfr: number | null;
  zhviMidCondo: number | null;
  zhviBottomAll: number | null;
  zhviTopAll: number | null;
  zhviMid1br: number | null;
  zhviMid2br: number | null;
  zhviMid3br: number | null;
  zhviMid4br: number | null;
  zhviMid5br: number | null;

  // Rental metrics
  zoriRentIndex: number | null;

  // Inventory and listing metrics
  inventoryForSale: number | null;
  newListings: number | null;
  newPending: number | null;
  salesCount: number | null;
  newConstructionSalesCount: number | null;

  // Pricing metrics
  medianSalePriceNow: number | null;
  medianSaleToList: number | null;
  pctSoldAboveList: number | null;
  pctListingsPriceCut: number | null;
  medianDaysToClose: number | null;

  // Market indicators
  marketTempIndex: number | null;

  // Affordability metrics
  incomeNeededToBuy20pctMid: number | null;
  incomeNeededToRentMid: number | null;

  // Growth metrics
  zhvfBaseDate: string | null; // date as ISO string
  zhvfGrowth1m: number | null;
  zhvfGrowth3m: number | null;
  zhvfGrowth12m: number | null;

  // Snapshot date columns
  snapshotDateZhviMidAll: string | null; // date as ISO string
  snapshotDateZhviMidAllRaw: string | null; // date as ISO string
  snapshotDateZhviMidSfr: string | null; // date as ISO string
  snapshotDateZhviMidCondo: string | null; // date as ISO string
  snapshotDateZhviBottomAll: string | null; // date as ISO string
  snapshotDateZhviTopAll: string | null; // date as ISO string
  snapshotDateZhviMid1br: string | null; // date as ISO string
  snapshotDateZhviMid2br: string | null; // date as ISO string
  snapshotDateZhviMid3br: string | null; // date as ISO string
  snapshotDateZhviMid4br: string | null; // date as ISO string
  snapshotDateZhviMid5br: string | null; // date as ISO string
  snapshotDateZoriRentIndex: string | null; // date as ISO string
  snapshotDateInventoryForSale: string | null; // date as ISO string
  snapshotDateNewListings: string | null; // date as ISO string
  snapshotDateNewPending: string | null; // date as ISO string
  snapshotDateSalesCount: string | null; // date as ISO string
  snapshotDateNewConstructionSalesCount: string | null; // date as ISO string
  snapshotDateMedianSalePriceNow: string | null; // date as ISO string
  snapshotDateMedianSaleToList: string | null; // date as ISO string
  snapshotDatePctSoldAboveList: string | null; // date as ISO string
  snapshotDatePctListingsPriceCut: string | null; // date as ISO string
  snapshotDateMedianDaysToClose: string | null; // date as ISO string
  snapshotDateMarketTempIndex: string | null; // date as ISO string
  snapshotDateIncomeNeededToBuy20pctMid: string | null; // date as ISO string
  snapshotDateIncomeNeededToRentMid: string | null; // date as ISO string

  // Computed score columns (0-100)
  growthScore: number | null;
  competitionScore: number | null;
  liquidityScore: number | null;
  affordabilityScore: number | null;
  rentalYieldScore: number | null;
  marketStrengthScore: number | null;
  flipScore: number | null;
  rentalScore: number | null;
};

/**
 * Query parameters for filtering and sorting market snapshots
 */
export type MarketSnapshotQueryParams = {
  /** Filter by specific region ID */
  regionId?: number;
  /** Filter by state name (e.g., "California") */
  state?: string;
  /** Filter by region type. Defaults to 'msa' if not provided. */
  regionType?: 'msa' | 'country';
  /** Maximum number of results to return. Defaults to 200 if not provided. */
  limit?: number;
  /** Column to sort by. Defaults to 'sizeRank' if not provided. */
  sortBy?:
    | 'sizeRank'
    | 'regionName'
    | 'stateName'
    | 'zhviMidAll'
    | 'marketStrengthScore'
    | 'flipScore'
    | 'rentalScore'
    | 'growthScore'
    | 'competitionScore'
    | 'liquidityScore'
    | 'affordabilityScore'
    | 'rentalYieldScore';
  /** Sort direction. Defaults to 'asc' if not provided. */
  sortDir?: 'asc' | 'desc';
};

/**
 * Maps a database row (snake_case) to a MarketSnapshot type (camelCase)
 * 
 * @param row - The database row from market_snapshots_scored view
 * @returns MarketSnapshot with camelCase field names
 */
export function mapMarketSnapshotRow(row: MarketSnapshotRow): MarketSnapshot {
  // Helper to convert numeric values safely
  const toNumber = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(num) ? num : null;
  };

  // Helper to convert date values to ISO strings
  const toDateString = (value: string | null | undefined): string | null => {
    if (!value) return null;
    // If already in ISO format, return as-is
    if (typeof value === 'string' && value.includes('T')) return value;
    // If it's a date string like '2024-01-01', return as-is (Supabase returns dates as strings)
    return value;
  };

  return {
    // Primary identifiers
    regionId: row.region_id,
    sizeRank: toNumber(row.size_rank),
    regionName: row.region_name || '',
    regionType: row.region_type || '',
    stateName: row.state_name,

    // ZHVI metrics
    zhviMidAll: toNumber(row.zhvi_mid_all),
    zhviMidAllRaw: toNumber(row.zhvi_mid_all_raw),
    zhviMidSfr: toNumber(row.zhvi_mid_sfr),
    zhviMidCondo: toNumber(row.zhvi_mid_condo),
    zhviBottomAll: toNumber(row.zhvi_bottom_all),
    zhviTopAll: toNumber(row.zhvi_top_all),
    zhviMid1br: toNumber(row.zhvi_mid_1br),
    zhviMid2br: toNumber(row.zhvi_mid_2br),
    zhviMid3br: toNumber(row.zhvi_mid_3br),
    zhviMid4br: toNumber(row.zhvi_mid_4br),
    zhviMid5br: toNumber(row.zhvi_mid_5br),

    // Rental metrics
    zoriRentIndex: toNumber(row.zori_rent_index),

    // Inventory and listing metrics
    inventoryForSale: toNumber(row.inventory_for_sale),
    newListings: toNumber(row.new_listings),
    newPending: toNumber(row.new_pending),
    salesCount: toNumber(row.sales_count),
    newConstructionSalesCount: toNumber(row.new_construction_sales_count),

    // Pricing metrics
    medianSalePriceNow: toNumber(row.median_sale_price_now),
    medianSaleToList: toNumber(row.median_sale_to_list),
    pctSoldAboveList: toNumber(row.pct_sold_above_list),
    pctListingsPriceCut: toNumber(row.pct_listings_price_cut),
    medianDaysToClose: toNumber(row.median_days_to_close),

    // Market indicators
    marketTempIndex: toNumber(row.market_temp_index),

    // Affordability metrics
    incomeNeededToBuy20pctMid: toNumber(row.income_needed_to_buy_20pct_mid),
    incomeNeededToRentMid: toNumber(row.income_needed_to_rent_mid),

    // Growth metrics
    zhvfBaseDate: toDateString(row.zhvf_base_date),
    zhvfGrowth1m: toNumber(row.zhvf_growth_1m),
    zhvfGrowth3m: toNumber(row.zhvf_growth_3m),
    zhvfGrowth12m: toNumber(row.zhvf_growth_12m),

    // Snapshot date columns
    snapshotDateZhviMidAll: toDateString(row.snapshot_date_zhvi_mid_all),
    snapshotDateZhviMidAllRaw: toDateString(row.snapshot_date_zhvi_mid_all_raw),
    snapshotDateZhviMidSfr: toDateString(row.snapshot_date_zhvi_mid_sfr),
    snapshotDateZhviMidCondo: toDateString(row.snapshot_date_zhvi_mid_condo),
    snapshotDateZhviBottomAll: toDateString(row.snapshot_date_zhvi_bottom_all),
    snapshotDateZhviTopAll: toDateString(row.snapshot_date_zhvi_top_all),
    snapshotDateZhviMid1br: toDateString(row.snapshot_date_zhvi_mid_1br),
    snapshotDateZhviMid2br: toDateString(row.snapshot_date_zhvi_mid_2br),
    snapshotDateZhviMid3br: toDateString(row.snapshot_date_zhvi_mid_3br),
    snapshotDateZhviMid4br: toDateString(row.snapshot_date_zhvi_mid_4br),
    snapshotDateZhviMid5br: toDateString(row.snapshot_date_zhvi_mid_5br),
    snapshotDateZoriRentIndex: toDateString(row.snapshot_date_zori_rent_index),
    snapshotDateInventoryForSale: toDateString(row.snapshot_date_inventory_for_sale),
    snapshotDateNewListings: toDateString(row.snapshot_date_new_listings),
    snapshotDateNewPending: toDateString(row.snapshot_date_new_pending),
    snapshotDateSalesCount: toDateString(row.snapshot_date_sales_count),
    snapshotDateNewConstructionSalesCount: toDateString(row.snapshot_date_new_construction_sales_count),
    snapshotDateMedianSalePriceNow: toDateString(row.snapshot_date_median_sale_price_now),
    snapshotDateMedianSaleToList: toDateString(row.snapshot_date_median_sale_to_list),
    snapshotDatePctSoldAboveList: toDateString(row.snapshot_date_pct_sold_above_list),
    snapshotDatePctListingsPriceCut: toDateString(row.snapshot_date_pct_listings_price_cut),
    snapshotDateMedianDaysToClose: toDateString(row.snapshot_date_median_days_to_close),
    snapshotDateMarketTempIndex: toDateString(row.snapshot_date_market_temp_index),
    snapshotDateIncomeNeededToBuy20pctMid: toDateString(row.snapshot_date_income_needed_to_buy_20pct_mid),
    snapshotDateIncomeNeededToRentMid: toDateString(row.snapshot_date_income_needed_to_rent_mid),

    // Computed score columns (0-100)
    growthScore: toNumber(row.growth_score),
    competitionScore: toNumber(row.competition_score),
    liquidityScore: toNumber(row.liquidity_score),
    affordabilityScore: toNumber(row.affordability_score),
    rentalYieldScore: toNumber(row.rental_yield_score),
    marketStrengthScore: toNumber(row.market_strength_score),
    flipScore: toNumber(row.flip_score),
    rentalScore: toNumber(row.rental_score),
  };
}

/**
 * Maps camelCase sortBy field name to snake_case database column name
 * for use in Supabase queries
 */
export function mapSortByToColumn(sortBy: MarketSnapshotQueryParams['sortBy']): string {
  const mapping: Record<string, string> = {
    sizeRank: 'size_rank',
    regionName: 'region_name',
    stateName: 'state_name',
    zhviMidAll: 'zhvi_mid_all',
    marketStrengthScore: 'market_strength_score',
    flipScore: 'flip_score',
    rentalScore: 'rental_score',
    growthScore: 'growth_score',
    competitionScore: 'competition_score',
    liquidityScore: 'liquidity_score',
    affordabilityScore: 'affordability_score',
    rentalYieldScore: 'rental_yield_score',
  };

  return mapping[sortBy || 'sizeRank'] || 'size_rank';
}

