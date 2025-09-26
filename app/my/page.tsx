'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  owner_id: string | null;
};

export default function MyListingsPage() {
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [rows, setRows] = useState<Listing[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setRows(data || []);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [user]);

  async function markSold(id: string) {
    setBusyId(id);
    const { error } = await supabase.from('listings').update({ status: 'sold' }).eq('id', id);
    if (error) alert(error.message);
    // refresh list
    const next = rows?.map(r => (r.id === id ? { ...r, status: 'sold' } : r)) || null;
    setRows(next);
    setBusyId(null);
  }

  async function del(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setBusyId(id);
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) alert(error.message);
    setRows((prev) => (prev ? prev.filter(r => r.id !== id) : prev));
    setBusyId(null);
  }

  if (user === null) {
    return (
      <main className="container" style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>My Listings</h1>
        <p>You need to be logged in to see your listings.</p>
        <Link href="/login?next=/my" className="btnPrimary">Login</Link>
      </main>
    );
  }

  if (err) return <main className="container">Error: {err}</main>;
  if (!rows) return <main className="container">Loading…</main>;
  if (rows.length === 0) {
    return (
      <main className="container">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>My Listings</h1>
        <p>You haven’t posted any listings yet.</p>
        <Link href="/post" className="btnPrimary">Post a Deal</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>My Listings</h1>
      <div className="toolbar" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Link href="/">Deals</Link>
        <Link href="/post">Post</Link>
        <Link href="/my">My Listings</Link>
      </div>

      <div className="grid">
        {rows.map(l => (
          <div key={l.id} className="card" style={{ position: 'relative' }}>
            {l.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.image_url} alt="" style={{ filter: l.status === 'sold' ? 'grayscale(100%)' : undefined }} />
            )}
            {l.status === 'sold' && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: '#dc3545',
                  color: '#fff',
                  fontWeight: 800,
                  letterSpacing: 1,
                  padding: '6px 10px',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,.2)',
                }}
              >
                SOLD
              </div>
            )}
            <div style={{ padding: 12 }}>
              <div className="price">${Number(l.price).toLocaleString()}</div>
              <div className="subtle">
                {l.address}{l.city ? `, ${l.city}` : ''}{l.state ? `, ${l.state}` : ''}{l.zip ? ` ${l.zip}` : ''}
              </div>
              <div className="subtle" style={{ marginTop: 6 }}>
                ARV ${Number(l.arv || 0).toLocaleString()} · Repairs ${Number(l.repairs || 0).toLocaleString()}
              </div>

              <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                <Link href={`/listing/${l.id}`} className="btnGhost">View</Link>

                {l.status !== 'sold' && (
                  <button
                    onClick={() => markSold(l.id)}
                    disabled={busyId === l.id}
                    style={{ padding:'8px 12px', background:'#28a745', color:'#fff', borderRadius:8, border:'none', cursor:'pointer' }}
                  >
                    {busyId === l.id ? 'Saving…' : 'Mark Sold'}
                  </button>
                )}

                <button
                  onClick={() => del(l.id)}
                  disabled={busyId === l.id}
                  style={{ padding:'8px 12px', background:'#dc3545', color:'#fff', borderRadius:8, border:'none', cursor:'pointer' }}
                >
                  {busyId === l.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
