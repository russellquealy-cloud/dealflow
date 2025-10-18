import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/types';

export const dynamic = 'force-dynamic';

function toUndef<T>(v: T | null | undefined): T | undefined {
  return v === null || v === undefined ? undefined : v;
}

function toStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function toNum(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function toStrArray(v: unknown): string[] | undefined {
  return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : undefined;
}

export default async function MyListingsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login?next=/my-listings');

  const { data: rows = [], error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 16 }}>
        <h1>My Listings</h1>
        <p style={{ color: '#b91c1c' }}>{error.message}</p>
      </main>
    );
  }

  const listings = rows as unknown as Listing[];

  return (
    <main style={{ padding: 24 }}>
      <div className="mb-3">
        <a href="/my-listings/new" className="rounded-md border px-3 py-2 hover:bg-gray-50">
          Post a Deal
        </a>
      </div>

      <h1 style={{ margin: 0, marginBottom: 12 }}>My Listings</h1>

      <div style={{ display: 'grid', gap: 12 }}>
        {listings.map((l) => {
          const listingObj = {
            id: String(l.id),
            address: toStr(toUndef(l.address)),
            price: toNum(toUndef(l.price)),
            bedrooms: toNum((l as unknown as { bedrooms?: number; beds?: number }).bedrooms ?? (l as unknown as { beds?: number }).beds),
            bathrooms: toNum((l as unknown as { bathrooms?: number; baths?: number }).bathrooms ?? (l as unknown as { baths?: number }).baths),
            home_sqft: toNum((l as unknown as { home_sqft?: number; square_feet?: number }).home_sqft ?? (l as unknown as { square_feet?: number }).square_feet),
            images: toStrArray((l as unknown as { images?: unknown }).images),
            city: toStr(toUndef(l.city)),
            state: toStr(toUndef(l.state)),
            zip: toStr(toUndef(l.zip)),
            title: toStr(toUndef(l.title)),
          };
          return <ListingCard key={String(l.id)} listing={listingObj} />;
        })}
        {!listings.length && <div>No listings yet.</div>}
      </div>
    </main>
  );
}
