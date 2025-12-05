import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type MarketSnapshot = {
  regionId: number;
  regionName: string;
  stateName: string | null;
  regionType: string;
  sizeRank: number | null;
  zhviMidAll: number | null;
  zhviMidSfr: number | null;
  zoriRentIndex: number | null;
  inventoryForSale: number | null;
  newListings: number | null;
  newPending: number | null;
  salesCount: number | null;
  marketTempIndex: number | null;
  pctSoldAboveList: number | null;
  pctListingsPriceCut: number | null;
  medianDaysToClose: number | null;
  incomeNeededToBuy20pctMid: number | null;
  incomeNeededToRentMid: number | null;
  zhvfGrowth1m: number | null;
  zhvfGrowth3m: number | null;
  zhvfGrowth12m: number | null;
};

type MarketSnapshotRow = {
  region_id: number;
  region_name: string | null;
  state_name: string | null;
  region_type: string | null;
  size_rank: number | null;
  zhvi_mid_all: number | null;
  zhvi_mid_sfr: number | null;
  zori_rent_index: number | null;
  inventory_for_sale: number | null;
  new_listings: number | null;
  new_pending: number | null;
  sales_count: number | null;
  market_temp_index: number | null;
  pct_sold_above_list: number | null;
  pct_listings_price_cut: number | null;
  median_days_to_close: number | null;
  income_needed_to_buy_20pct_mid: number | null;
  income_needed_to_rent_mid: number | null;
  zhvf_growth_1m: number | null;
  zhvf_growth_3m: number | null;
  zhvf_growth_12m: number | null;
};

function mapRowToSnapshot(row: MarketSnapshotRow): MarketSnapshot {
  return {
    regionId: row.region_id,
    regionName: row.region_name || '',
    stateName: row.state_name,
    regionType: row.region_type || '',
    sizeRank: row.size_rank,
    zhviMidAll: row.zhvi_mid_all ? Number(row.zhvi_mid_all) : null,
    zhviMidSfr: row.zhvi_mid_sfr ? Number(row.zhvi_mid_sfr) : null,
    zoriRentIndex: row.zori_rent_index ? Number(row.zori_rent_index) : null,
    inventoryForSale: row.inventory_for_sale ? Number(row.inventory_for_sale) : null,
    newListings: row.new_listings ? Number(row.new_listings) : null,
    newPending: row.new_pending ? Number(row.new_pending) : null,
    salesCount: row.sales_count ? Number(row.sales_count) : null,
    marketTempIndex: row.market_temp_index ? Number(row.market_temp_index) : null,
    pctSoldAboveList: row.pct_sold_above_list ? Number(row.pct_sold_above_list) : null,
    pctListingsPriceCut: row.pct_listings_price_cut ? Number(row.pct_listings_price_cut) : null,
    medianDaysToClose: row.median_days_to_close ? Number(row.median_days_to_close) : null,
    incomeNeededToBuy20pctMid: row.income_needed_to_buy_20pct_mid ? Number(row.income_needed_to_buy_20pct_mid) : null,
    incomeNeededToRentMid: row.income_needed_to_rent_mid ? Number(row.income_needed_to_rent_mid) : null,
    zhvfGrowth1m: row.zhvf_growth_1m ? Number(row.zhvf_growth_1m) : null,
    zhvfGrowth3m: row.zhvf_growth_3m ? Number(row.zhvf_growth_3m) : null,
    zhvfGrowth12m: row.zhvf_growth_12m ? Number(row.zhvf_growth_12m) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const regionIdParam = searchParams.get('regionId');
    const stateParam = searchParams.get('state');
    const limitParam = searchParams.get('limit');
    const sortByParam = searchParams.get('sortBy') || 'size_rank';
    const sortDirParam = searchParams.get('sortDir') || 'asc';

    // Parse limit (default 200)
    const limit = limitParam ? parseInt(limitParam, 10) : 200;
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be a positive integer.' },
        { status: 400 }
      );
    }

    // Validate sort direction
    const sortDir = sortDirParam.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const supabase = await createServerClient();

    const selectColumns = `
      region_id,
      region_name,
      state_name,
      region_type,
      size_rank,
      zhvi_mid_all,
      zhvi_mid_sfr,
      zori_rent_index,
      inventory_for_sale,
      new_listings,
      new_pending,
      sales_count,
      market_temp_index,
      pct_sold_above_list,
      pct_listings_price_cut,
      median_days_to_close,
      income_needed_to_buy_20pct_mid,
      income_needed_to_rent_mid,
      zhvf_growth_1m,
      zhvf_growth_3m,
      zhvf_growth_12m
    `;

    let data: MarketSnapshotRow | MarketSnapshotRow[] | null = null;
    let error: { code?: string; message: string } | null | undefined = null;

    // Apply filters based on query params
    if (regionIdParam) {
      // Return single row for specific region
      const regionId = parseInt(regionIdParam, 10);
      if (isNaN(regionId)) {
        return NextResponse.json(
          { error: 'Invalid regionId parameter. Must be a valid number.' },
          { status: 400 }
        );
      }
      const { data: rowData, error: queryError } = await supabase
        .from('market_snapshots')
        .select(selectColumns)
        .eq('region_id', regionId)
        .single<MarketSnapshotRow>();
      data = rowData;
      error = queryError;
    } else if (stateParam) {
      // Return all rows for a specific state, sorted by size_rank
      const { data: rowsData, error: queryError } = await supabase
        .from('market_snapshots')
        .select(selectColumns)
        .eq('state_name', stateParam.trim())
        .order('size_rank', { ascending: true, nullsFirst: false });
      data = rowsData;
      error = queryError;
    } else {
      // Return top N metros sorted by size_rank (default)
      const validSortColumns = ['size_rank', 'region_name', 'state_name', 'zhvi_mid_all'];
      const sortBy = validSortColumns.includes(sortByParam) ? sortByParam : 'size_rank';
      
      const { data: rowsData, error: queryError } = await supabase
        .from('market_snapshots')
        .select(selectColumns)
        .order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false })
        .limit(limit);
      data = rowsData;
      error = queryError;
    }

    if (error) {
      console.error('Error fetching market snapshots:', error);
      
      // Handle specific error cases
      if (error.code === 'PGRST116') {
        // Not found (when using .single())
        return NextResponse.json(
          { error: 'Market snapshot not found for the specified regionId.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch market snapshots',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Handle single result (regionId query)
    if (regionIdParam && data) {
      const snapshot = mapRowToSnapshot(data as MarketSnapshotRow);
      return NextResponse.json(snapshot);
    }

    // Handle array results
    const rows = (data as MarketSnapshotRow[]) || [];
    const snapshots = rows.map(mapRowToSnapshot);

    return NextResponse.json(snapshots);

  } catch (error) {
    console.error('Error in market snapshot API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
