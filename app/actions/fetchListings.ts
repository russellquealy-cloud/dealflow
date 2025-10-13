'use server';

import { createServerClient } from '@/supabase/server';

export type Filters = {
  priceMin?: number; priceMax?: number;
  bedsMin?: number;  bedsMax?: number | '6+';
  bathsMin?: number; bathsMax?: number | '4+';
  sqftMin?: number;  sqftMax?: number;
  lotMin?: number;   lotMax?: number;
};

const clampMax = (v: any) => (v === '6+' || v === '4+' ? 999 : v);

export async function fetchListings(filters: Filters) {
  const supabase = createServerClient();

  let q = supabase.from('listings').select('*');

  if (filters.priceMin) q = q.gte('price', filters.priceMin);
  if (filters.priceMax) q = q.lte('price', filters.priceMax);

  if (filters.bedsMin)  q = q.gte('beds', filters.bedsMin);
  if (filters.bedsMax)  q = q.lte('beds', clampMax(filters.bedsMax));

  if (filters.bathsMin) q = q.gte('baths', filters.bathsMin);
  if (filters.bathsMax) q = q.lte('baths', clampMax(filters.bathsMax));

  if (filters.sqftMin)  q = q.gte('sqft', filters.sqftMin);
  if (filters.sqftMax)  q = q.lte('sqft', filters.sqftMax);

  if (filters.lotMin)   q = q.gte('lot_acres', filters.lotMin);
  if (filters.lotMax)   q = q.lte('lot_acres', filters.lotMax);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
