import { supabase } from './lib/supabase'; // NOTE: relative path

type Listing = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number;
  arv: number | null;
  repairs: number | null;
  image_url: string | null;
  status: string;
};

export default async function DealsPage() {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id,address,city,state,zip,price,arv,repairs,image_url,status')
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return <main style={{ padding: 24 }}>Supabase error: {error.message}</main>;
  }

  if (!listings || listings.length === 0) {
    return <main style={{ padding: 24 }}>No live deals yet. Try adding one in Supabase or at /post.</main>;
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Deals</h1>
      <a href="/post" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, textDecoration: 'none' }}>
        Post
      </a>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {listings.map((l) => (
          <a
            key={l.id}
            href={`/listing/${l.id}`}
            style={{
              display: 'block',
              border: '1px solid #e5e5e5',
              borderRadius: 12,
              background: '#fff',
              overflow: 'hidden',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div style={{ height: 160, background: '#f2f2f2' }}>
              {l.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>${Number(l.price).toLocaleString()}</div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                {l.address}{l.city ? `, ${l.city}` : ''}{l.state ? `, ${l.state}` : ''}{l.zip ? ` ${l.zip}` : ''}
              </div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                ARV ${Number(l.arv || 0).toLocaleString()} · Repairs ${Number(l.repairs || 0).toLocaleString()}
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
