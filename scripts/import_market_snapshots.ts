import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

type CsvRow = Record<string, string>;

type MarketSnapshotInsert = {
  region_id: number;
  size_rank: number | null;
  region_name: string | null;
  region_type: string | null;
  state_name: string | null;
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
  zori_rent_index: number | null;
  inventory_for_sale: number | null;
  new_listings: number | null;
  new_pending: number | null;
  sales_count: number | null;
  new_construction_sales_count: number | null;
  median_sale_price_now: number | null;
  median_sale_to_list: number | null;
  pct_sold_above_list: number | null;
  pct_listings_price_cut: number | null;
  median_days_to_close: number | null;
  market_temp_index: number | null;
  income_needed_to_buy_20pct_mid: number | null;
  income_needed_to_rent_mid: number | null;
  zhvf_base_date: string | null;
  zhvf_growth_1m: number | null;
  zhvf_growth_3m: number | null;
  zhvf_growth_12m: number | null;
  snapshot_date_zhvi_mid_all: string | null;
  snapshot_date_zhvi_mid_all_raw: string | null;
  snapshot_date_zhvi_mid_sfr: string | null;
  snapshot_date_zhvi_mid_condo: string | null;
  snapshot_date_zhvi_bottom_all: string | null;
  snapshot_date_zhvi_top_all: string | null;
  snapshot_date_zhvi_mid_1br: string | null;
  snapshot_date_zhvi_mid_2br: string | null;
  snapshot_date_zhvi_mid_3br: string | null;
  snapshot_date_zhvi_mid_4br: string | null;
  snapshot_date_zhvi_mid_5br: string | null;
  snapshot_date_zori_rent_index: string | null;
  snapshot_date_inventory_for_sale: string | null;
  snapshot_date_new_listings: string | null;
  snapshot_date_new_pending: string | null;
  snapshot_date_sales_count: string | null;
  snapshot_date_new_construction_sales_count: string | null;
  snapshot_date_median_sale_price_now: string | null;
  snapshot_date_median_sale_to_list: string | null;
  snapshot_date_pct_sold_above_list: string | null;
  snapshot_date_pct_listings_price_cut: string | null;
  snapshot_date_median_days_to_close: string | null;
  snapshot_date_market_temp_index: string | null;
  snapshot_date_income_needed_to_buy_20pct_mid: string | null;
  snapshot_date_income_needed_to_rent_mid: string | null;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const peek = line[i + 1];
      if (inQuotes && peek === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });
    return record;
  });
}

function toNumeric(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/[$,%]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value: string | undefined): number | null {
  const numeric = toNumeric(value);
  if (numeric === null) return null;
  const rounded = Math.round(numeric);
  return Number.isFinite(rounded) ? rounded : null;
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  
  // Handle ISO date format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try parsing as date
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function prepareRows(rows: CsvRow[]): MarketSnapshotInsert[] {
  return rows
    .filter((row) => {
      // Filter for msa or country region types only
      const regionType = (row.RegionType ?? row.region_type)?.trim().toLowerCase();
      return regionType === 'msa' || regionType === 'country';
    })
    .map((row) => {
      const regionId = toInteger(row.RegionID ?? row.region_id);
      if (regionId === null) {
        throw new Error(`Missing or invalid RegionID for row: ${JSON.stringify(row)}`);
      }

      return {
        region_id: regionId,
        size_rank: toInteger(row.SizeRank ?? row.size_rank),
        region_name: (row.RegionName ?? row.region_name)?.trim() || null,
        region_type: (row.RegionType ?? row.region_type)?.trim() || null,
        state_name: (row.StateName ?? row.state_name)?.trim() || null,
        zhvi_mid_all: toNumeric(row.zhvi_mid_all),
        zhvi_mid_all_raw: toNumeric(row.zhvi_mid_all_raw),
        zhvi_mid_sfr: toNumeric(row.zhvi_mid_sfr),
        zhvi_mid_condo: toNumeric(row.zhvi_mid_condo),
        zhvi_bottom_all: toNumeric(row.zhvi_bottom_all),
        zhvi_top_all: toNumeric(row.zhvi_top_all),
        zhvi_mid_1br: toNumeric(row.zhvi_mid_1br),
        zhvi_mid_2br: toNumeric(row.zhvi_mid_2br),
        zhvi_mid_3br: toNumeric(row.zhvi_mid_3br),
        zhvi_mid_4br: toNumeric(row.zhvi_mid_4br),
        zhvi_mid_5br: toNumeric(row.zhvi_mid_5br),
        zori_rent_index: toNumeric(row.zori_rent_index),
        inventory_for_sale: toNumeric(row.inventory_for_sale),
        new_listings: toNumeric(row.new_listings),
        new_pending: toNumeric(row.new_pending),
        sales_count: toNumeric(row.sales_count),
        new_construction_sales_count: toNumeric(row.new_construction_sales_count),
        median_sale_price_now: toNumeric(row.median_sale_price_now),
        median_sale_to_list: toNumeric(row.median_sale_to_list),
        pct_sold_above_list: toNumeric(row.pct_sold_above_list),
        pct_listings_price_cut: toNumeric(row.pct_listings_price_cut),
        median_days_to_close: toNumeric(row.median_days_to_close),
        market_temp_index: toNumeric(row.market_temp_index),
        income_needed_to_buy_20pct_mid: toNumeric(row.income_needed_to_buy_20pct_mid),
        income_needed_to_rent_mid: toNumeric(row.income_needed_to_rent_mid),
        zhvf_base_date: normalizeDate(row.zhvf_base_date),
        zhvf_growth_1m: toNumeric(row.zhvf_growth_1m),
        zhvf_growth_3m: toNumeric(row.zhvf_growth_3m),
        zhvf_growth_12m: toNumeric(row.zhvf_growth_12m),
        snapshot_date_zhvi_mid_all: normalizeDate(row.snapshot_date_zhvi_mid_all),
        snapshot_date_zhvi_mid_all_raw: normalizeDate(row.snapshot_date_zhvi_mid_all_raw),
        snapshot_date_zhvi_mid_sfr: normalizeDate(row.snapshot_date_zhvi_mid_sfr),
        snapshot_date_zhvi_mid_condo: normalizeDate(row.snapshot_date_zhvi_mid_condo),
        snapshot_date_zhvi_bottom_all: normalizeDate(row.snapshot_date_zhvi_bottom_all),
        snapshot_date_zhvi_top_all: normalizeDate(row.snapshot_date_zhvi_top_all),
        snapshot_date_zhvi_mid_1br: normalizeDate(row.snapshot_date_zhvi_mid_1br),
        snapshot_date_zhvi_mid_2br: normalizeDate(row.snapshot_date_zhvi_mid_2br),
        snapshot_date_zhvi_mid_3br: normalizeDate(row.snapshot_date_zhvi_mid_3br),
        snapshot_date_zhvi_mid_4br: normalizeDate(row.snapshot_date_zhvi_mid_4br),
        snapshot_date_zhvi_mid_5br: normalizeDate(row.snapshot_date_zhvi_mid_5br),
        snapshot_date_zori_rent_index: normalizeDate(row.snapshot_date_zori_rent_index),
        snapshot_date_inventory_for_sale: normalizeDate(row.snapshot_date_inventory_for_sale),
        snapshot_date_new_listings: normalizeDate(row.snapshot_date_new_listings),
        snapshot_date_new_pending: normalizeDate(row.snapshot_date_new_pending),
        snapshot_date_sales_count: normalizeDate(row.snapshot_date_sales_count),
        snapshot_date_new_construction_sales_count: normalizeDate(row.snapshot_date_new_construction_sales_count),
        snapshot_date_median_sale_price_now: normalizeDate(row.snapshot_date_median_sale_price_now),
        snapshot_date_median_sale_to_list: normalizeDate(row.snapshot_date_median_sale_to_list),
        snapshot_date_pct_sold_above_list: normalizeDate(row.snapshot_date_pct_sold_above_list),
        snapshot_date_pct_listings_price_cut: normalizeDate(row.snapshot_date_pct_listings_price_cut),
        snapshot_date_median_days_to_close: normalizeDate(row.snapshot_date_median_days_to_close),
        snapshot_date_market_temp_index: normalizeDate(row.snapshot_date_market_temp_index),
        snapshot_date_income_needed_to_buy_20pct_mid: normalizeDate(row.snapshot_date_income_needed_to_buy_20pct_mid),
        snapshot_date_income_needed_to_rent_mid: normalizeDate(row.snapshot_date_income_needed_to_rent_mid),
      };
    });
}

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function main() {
  const filePath = path.join(process.cwd(), 'data', 'market', 'offaxis_market_snapshot_metro_latest.csv');
  console.log(`Reading market snapshot data from ${filePath}`);

  const contents = await readFile(filePath, 'utf-8');
  const parsed = parseCsv(contents);
  
  if (parsed.length === 0) {
    console.log('No rows found in CSV. Nothing to import.');
    return;
  }

  console.log(`Total rows in CSV: ${parsed.length}`);

  // Filter and prepare rows
  const allRows = prepareRows(parsed);
  const validRows = allRows.filter((row) => row.region_id !== null);
  const skippedRows = parsed.length - validRows.length;

  console.log(`Rows filtered for msa/country: ${validRows.length}`);
  console.log(`Rows skipped (missing RegionID or non-msa/country): ${skippedRows}`);

  if (validRows.length === 0) {
    console.log('No valid rows to import.');
    return;
  }

  const supabase = createSupabaseClient();

  // Upsert in chunks
  const chunkSize = 500;
  let totalUpserted = 0;

  for (let index = 0; index < validRows.length; index += chunkSize) {
    const chunk = validRows.slice(index, index + chunkSize);
    const { error } = await supabase
      .from('market_snapshots')
      .upsert(chunk, { onConflict: 'region_id' });

    if (error) {
      console.error('Failed while inserting market snapshot data chunk.', error);
      throw error;
    }
    
    totalUpserted += chunk.length;
    console.log(`Upserted ${Math.min(index + chunkSize, validRows.length)} of ${validRows.length} rows...`);
  }

  console.log(`\n✅ Market snapshot import complete.`);
  console.log(`Total rows processed: ${parsed.length}`);
  console.log(`Total rows upserted: ${totalUpserted}`);
  console.log(`Rows skipped: ${skippedRows}`);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exitCode = 1;
});
