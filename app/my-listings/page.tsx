import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/types';

export const dynamic = 'force-dynamic';

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
        {listings.map((l) => (
  <ListingCard
    key={String(l.id)}
    listing={{
      id: String(l.id),
      address: l.address ?? undefined,
      price: l.price ?? undefined,
      bedrooms: (l as any).bedrooms ?? (l as any).beds ?? undefined,
      bathrooms: (l as any).bathrooms ?? (l as any).baths ?? undefined,
      home_sqft: (l as any).home_sqft ?? (l as any).square_feet ?? undefined,
      images: Array.isArray((l as any).images) ? (l as any).images : undefined,
      city: l.city ?? undefined,
      state: l.state ?? undefined,
      zip: l.zip ?? undefined,
      title: l.title ?? undefined,
    }}
  />
))}

        {!listings.length && <div>No listings yet.</div>}
      </div>
    </main>
  );
}
