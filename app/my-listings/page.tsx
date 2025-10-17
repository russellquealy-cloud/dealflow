import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ListingCard from '@/components/ListingCard';

export const dynamic = 'force-dynamic';

export default async function MyListingsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login?next=/my-listings');

  const { data: listings = [] } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>My Listings</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {listings.map((l: any) => <ListingCard key={l.id} listing={l} />)}
        {!listings.length && <div>No listings yet.</div>}
      </div>
    </main>
  );
}
