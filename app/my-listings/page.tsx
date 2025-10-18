// app/my-listings/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

export const dynamic = 'force-dynamic';

export default async function MyListingsPage() {
  const supabase = createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login?next=/my-listings');

  const { data: listings, error } = await supabase
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

  return (
    <main style={{ display: 'grid', gap: 12, padding: 16 }}>
      <h1 style={{ marginBottom: 6 }}>My Listings</h1>
      {(!listings || listings.length === 0) ? (
        <p>No listings yet. <a href="/post">Post one</a>.</p>
      ) : (
        listings.map((l: any) => (
          <a
            key={l.id}
            href={`/listing/${l.id}`}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 12,
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: 12,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ background: '#f3f4f6', height: 90, borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 800 }}>{l.price ? Number(l.price).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—'}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{l.address ?? '—'}</div>
            </div>
          </a>
        ))
      )}
    </main>
  );
}
