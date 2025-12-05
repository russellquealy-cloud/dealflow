import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';
import {
  type MarketSnapshot,
  type MarketSnapshotRow,
  type MarketSnapshotQueryParams,
  mapMarketSnapshotRow,
  mapSortByToColumn,
} from '../../../lib/types/markets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Hard maximum limit to prevent accidental huge responses
const MAX_LIMIT = 500;

// Valid sortBy values (camelCase as they come from query params)
const VALID_SORT_BY: MarketSnapshotQueryParams['sortBy'][] = [
  'sizeRank',
  'marketStrengthScore',
  'flipScore',
  'rentalScore',
  'growthScore',
  'rentalYieldScore',
];

// Build the full SELECT statement for all columns in the view
const SELECT_COLUMNS = `
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
  growth_score,
  competition_score,
  liquidity_score,
  affordability_score,
  rental_yield_score,
  market_strength_score,
  flip_score,
  rental_score
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const regionIdParam = searchParams.get('regionId');
    const stateParam = searchParams.get('state');
    const regionTypeParam = searchParams.get('regionType');
    const limitParam = searchParams.get('limit');
    const sortByParam = searchParams.get('sortBy');
    const sortDirParam = searchParams.get('sortDir');

    // Defaults
    const regionType: 'msa' | 'country' = (regionTypeParam === 'country' ? 'country' : 'msa');
    const limitRaw = limitParam ? parseInt(limitParam, 10) : 200;
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 200 : limitRaw), MAX_LIMIT);
    const sortBy: MarketSnapshotQueryParams['sortBy'] = 
      sortByParam && VALID_SORT_BY.includes(sortByParam as MarketSnapshotQueryParams['sortBy'])
        ? (sortByParam as MarketSnapshotQueryParams['sortBy'])
        : 'sizeRank';
    const sortDir: 'asc' | 'desc' = sortDirParam?.toLowerCase() === 'desc' ? 'desc' : 'asc';

    // Validate regionId if provided
    if (regionIdParam) {
      const regionId = parseInt(regionIdParam, 10);
      if (isNaN(regionId)) {
        return NextResponse.json(
          { error: 'Invalid regionId parameter. Must be a valid number.' },
          { status: 400 }
        );
      }

      const supabase = await createServerClient();

      const { data: rowData, error: queryError } = await supabase
        .from('market_snapshots_scored')
        .select(SELECT_COLUMNS)
        .eq('region_id', regionId)
        .eq('region_type', regionType)
        .maybeSingle<MarketSnapshotRow>();

      if (queryError) {
        console.error('[markets/snapshot] Error fetching single market snapshot:', {
          error: queryError.message,
          code: queryError.code,
          regionId,
          regionType,
        });
        return NextResponse.json(
          {
            error: 'Failed to fetch market snapshot',
            details: queryError.message,
          },
          { status: 500 }
        );
      }

      // Return single object directly (matching existing pattern in route)
      if (!rowData) {
        return NextResponse.json(
          { error: 'Market snapshot not found for the specified regionId and regionType.' },
          { status: 404 }
        );
      }

      const snapshot = mapMarketSnapshotRow(rowData);
      return NextResponse.json(snapshot);
    }

    // List queries (state filter or all)
    const supabase = await createServerClient();
    let query = supabase
      .from('market_snapshots_scored')
      .select(SELECT_COLUMNS)
      .eq('region_type', regionType);

    // Apply state filter if provided
    if (stateParam) {
      query = query.eq('state_name', stateParam.trim());
    }

    // Apply sorting
    const sortColumn = mapSortByToColumn(sortBy);
    query = query.order(sortColumn, {
      ascending: sortDir === 'asc',
      nullsFirst: false,
    });

    // Apply limit (only for list queries, not single regionId)
    query = query.limit(limit);

    const { data: rowsData, error: queryError } = await query;

    if (queryError) {
      console.error('[markets/snapshot] Error fetching market snapshots:', {
        error: queryError.message,
        code: queryError.code,
        state: stateParam,
        regionType,
        limit,
        sortBy,
        sortDir,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch market snapshots',
          details: queryError.message,
        },
        { status: 500 }
      );
    }

    // Map rows to MarketSnapshot objects
    const rows = (rowsData as MarketSnapshotRow[]) || [];
    const snapshots = rows.map(mapMarketSnapshotRow);

    // Return array directly (matching existing pattern)
    return NextResponse.json(snapshots);

  } catch (error) {
    console.error('[markets/snapshot] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
