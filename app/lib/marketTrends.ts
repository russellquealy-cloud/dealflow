'use server';

import { getSupabaseServiceRole } from '@/lib/supabase/service';

type MarketTrendRow = {
  median_sale_price: number | null;
};

function formatDateForQuery(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getLatestMedianSalePrice(region: string): Promise<number | null> {
  const supabase = await getSupabaseServiceRole();
  const { data, error } = await supabase
    .from('market_trends')
    .select('median_sale_price')
    .eq('region', region)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle<MarketTrendRow>();

  if (error) {
    console.error('Failed to load latest median sale price', { region, error });
    return null;
  }

  return data?.median_sale_price ?? null;
}

export async function getMedianSalePriceAtDate(
  region: string,
  date: Date
): Promise<number | null> {
  const supabase = await getSupabaseServiceRole();
  const targetDate = formatDateForQuery(date);

  const { data, error } = await supabase
    .from('market_trends')
    .select('median_sale_price')
    .eq('region', region)
    .lte('period_end', targetDate)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle<MarketTrendRow>();

  if (error) {
    console.error('Failed to load historical median sale price', {
      region,
      targetDate,
      error,
    });
    return null;
  }

  return data?.median_sale_price ?? null;
}

export function adjustPriceForTrend(
  originalPrice: number,
  medianAtSale: number | null,
  medianCurrent: number | null
): number {
  if (medianAtSale === null || medianCurrent === null || medianAtSale === 0) {
    return originalPrice;
  }

  return originalPrice * (medianCurrent / medianAtSale);
}


