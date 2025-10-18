import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/types';

export const dynamic = 'force-dynamic';

export default async function MyListingsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If no session, redirect to login with return
  if (!session) redirect('/login?next=/my-listings');
}


  const { data: rows = [] } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false });

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
          <ListingCard key={String(l.id)} listing={l} />
        ))}
        {!listings.length && <div>No listings yet.</div>}
      </div>
    </main>
  );
}
