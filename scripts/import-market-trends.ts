import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { getSupabaseServiceRole } from '@/lib/supabase/service';

type CsvRow = {
  PERIOD_END: string;
  REGION: string;
  MEDIAN_SALE_PRICE: string;
  HOMES_SOLD?: string;
  MEDIAN_DAYS_ON_MARKET?: string;
  AVG_SALE_TO_LIST?: string;
};

type MarketTrendInsert = {
  region: string;
  period_end: string;
  median_sale_price: number;
  homes_sold: number | null;
  median_days_on_market: number | null;
  avg_sale_to_list: number | null;
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
    return record as CsvRow;
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

function normalizeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid PERIOD_END value: ${value}`);
  }
  return date.toISOString().slice(0, 10);
}

function prepareRows(rows: CsvRow[]): MarketTrendInsert[] {
  return rows.map((row) => {
    if (!row.REGION) {
      throw new Error('Encountered row without REGION value.');
    }
    const periodEnd = normalizeDate(row.PERIOD_END);
    const medianSalePrice = toNumeric(row.MEDIAN_SALE_PRICE);
    if (medianSalePrice === null) {
      throw new Error(
        `Median sale price is required. REGION=${row.REGION}, PERIOD_END=${row.PERIOD_END}`
      );
    }

    return {
      region: row.REGION,
      period_end: periodEnd,
      median_sale_price: medianSalePrice,
      homes_sold: toInteger(row.HOMES_SOLD),
      median_days_on_market: toInteger(row.MEDIAN_DAYS_ON_MARKET),
      avg_sale_to_list: toNumeric(row.AVG_SALE_TO_LIST),
    };
  });
}

async function main() {
  const filePath = path.join(process.cwd(), 'data', 'redfin_metro_clean.csv');
  console.log(`Reading market trend data from ${filePath}`);

  const contents = await readFile(filePath, 'utf-8');
  const parsed = parseCsv(contents);
  if (parsed.length === 0) {
    console.log('No rows found in CSV. Nothing to import.');
    return;
  }

  const rows = prepareRows(parsed);
  const supabase = await getSupabaseServiceRole();

  const chunkSize = 500;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase
      .from('market_trends')
      .upsert(chunk, { onConflict: 'region,period_end' });

    if (error) {
      console.error('Failed while inserting market trend data chunk.', error);
      throw error;
    }
    console.log(`Upserted ${Math.min(index + chunkSize, rows.length)} of ${rows.length} rows...`);
  }

  console.log(`Market trend import complete. Total rows processed: ${rows.length}`);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exitCode = 1;
});


