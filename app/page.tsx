'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from './lib/supabase';

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

export default function DealsPage() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [city, setCity] = useState<string>('');
  const [stateVal, setStateVal] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [typing, setTyping] = useState(false);

  // options
  const [options, setOptions] = useState<{ cities: string[]; states: string[] }>({ cities: [], states: [] });

  // Load filter options from current live listings (simple + fast for MVP)
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('city,state')
          .eq('status', 'live')
          .limit(1000);
        if (error) throw error;

        const cities = Array.from(new Set((data || []).map(d => (d.city || '').trim()).filter(Boolean))).sort();
        const states = Array.from(new Set((data || []).map(d => (d.state || '').trim()).filter(Boolean))).sort();

        setOptions({ cities, states });
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  // Debounced search to avoid spamming Supabase while the user types
  useEffect(() => {
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch filtered listings
  useEffect(() => {
    if (typing) return; // wait for debounce

    (async () => {
      try {
        let query = supabase
          .from('listings')
          .select('id,address,city,state,zip,price,arv,repairs,image_url,status')
          .eq('status', 'live');

        if (city) query = query.eq('city', city);
        if (stateVal) query = query.eq('state', stateVal);

        if (q.trim()) {
          const ilike = `%${q.trim()}%`;
          // Match address / city / state / zip
          query = query.or(
            `address.ilike.${ilike},city.ilike.${ilike},state.ilike.${ilike},zip.ilike.${ilike}`
          );
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        setListings(data || []);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [city, stateVal, q, typing]);

  const reset = () => {
    setCity('');
    setStateVal('');
    setQ('');
  };

  if (err) return <main className="container">Browser fetch error: {err}</main>;
  if (!listings) return <main className="container">Loading…</main>;
  if (listings.length === 0) {
    return (
      <main className="container">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Deals</h1>

        <Filters
          q={q} setQ={setQ}
          city={city} setCity={setCity}
          stateVal={stateVal} setStateVal={setStateVal}
          options={options}
          reset={reset}
        />

        <p>No live deals found. Try adjusting filters.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Deals</h1>

      <div className="toolbar" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Link href="/">Deals</Link>
        <Link href="/post">Post</Link>
        <Link href="/my">My Listings</Link>
        <Link href="/login">Login</Link>
      </div>

      <Filters
        q={q} setQ={setQ}
        city={city} setCity={setCity}
        stateVal={stateVal} setStateVal={setStateVal}
        options={options}
        reset={reset}
      />

      <div className="grid">
        {listings.map((l) => (
          <Link
            key={l.id}
            href={`/listing/${l.id}`}
            className="card"
            style={{ textDecoration: 'none', color: 'inherit', position: 'relative' }}
          >
            {l.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.image_url} alt="" />
            )}
            <div style={{ padding: 12 }}>
              <div className="price">${Number(l.price).toLocaleString()}</div>
              <div className="subtle">
                {l.address}{l.city ? `, ${l.city}` : ''}{l.state ? `, ${l.state}` : ''}{l.zip ? ` ${l.zip}` : ''}
              </div>
              <div className="subtle" style={{ marginTop: 6 }}>
                ARV ${Number(l.arv || 0).toLocaleString()} · Repairs ${Number(l.repairs || 0).toLocaleString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

function Filters(props: {
  q: string; setQ: (v: string) => void;
  city: string; setCity: (v: string) => void;
  stateVal: string; setStateVal: (v: string) => void;
  options: { cities: string[]; states: string[] };
  reset: () => void;
}) {
  const { q, setQ, city, setCity, stateVal, setStateVal, options, reset } = props;
  const hasActive = useMemo(() => !!(q || city || stateVal), [q, city, stateVal]);

  return (
    <div style={{ display: 'grid', gap: 8, marginBottom: 16, alignItems: 'center' }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search address / city / state / zip"
        style={{ padding: '10px 12px', border: '1px solid var(--ring)', borderRadius: 10 }}
      />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap: 8 }}>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid var(--ring)', borderRadius: 10, background:'#0b1220', color:'var(--text)' }}
        >
          <option value="">All Cities</option>
          {options.cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={stateVal}
          onChange={(e) => setStateVal(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid var(--ring)', borderRadius: 10, background:'#0b1220', color:'var(--text)' }}
        >
          <option value="">All States</option>
          {options.states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <button
          onClick={reset}
          disabled={!hasActive}
          className="btnGhost"
          style={{ padding: '10px 14px', opacity: hasActive ? 1 : 0.6 }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
