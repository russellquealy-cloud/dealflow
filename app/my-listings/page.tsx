/* eslint-disable @typescript-eslint/no-explicit-any */


import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MyListingsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login?next=/my-listings');

  const { data: listings, error } = await supabase
    .from('listings').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false });

  if (error) return <div style={{ padding: 24 }}>Error: {error.message}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>My Listings</h1>
      {(!listings || listings.length === 0) ? 'No listings yet.' :
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {listings.map((l:any) => (
            <li key={l.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:16, marginBottom:12 }}>
              <a href={`/listing/${l.id}`} style={{ textDecoration:'none', color:'inherit', fontWeight:600 }}>
                {l.address ?? 'Untitled'} {l.price ? `— $${Number(l.price).toLocaleString()}` : ''}
              </a>
            </li>
          ))}
        </ul>}
    </div>
  );
}
