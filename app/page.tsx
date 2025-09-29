// app/page.tsx
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
  created_at?: string;

  bedrooms: number | null;
  bathrooms: number | null;
  home_sqft: number | null;
};

export default function HomePage() {
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Listings
  const [listings, setListings] = useState<Listing[]>([]);

  // Search / filters
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  useEffect(() => {
    (async () => {
      await fetchListings(); // initial load w/out filters
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchListings(opts?: {
    keyword?: string;
    city?: string;
    stateCode?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
  }) {
    setSubmitting(true);

    const k = opts?.keyword ?? keyword;
    const c = opts?.city ?? city;
    const s = opts?.stateCode ?? stateCode;
    const min = (opts?.minPrice ?? (minPrice ? Number(minPrice) : null)) ?? null;
    const max = (opts?.maxPrice ?? (maxPrice ? Number(maxPrice) : null)) ?? null;

    let query = supabase
      .from('listings')
      .select(
        'id,address,city,state,zip,price,arv,repairs,image_url,status,created_at,bedrooms,bathrooms,home_sqft'
      )
      .eq('status', 'live')
      .order('created_at', { ascending: false });

    const kw = k.trim();
    if (kw) {
      query = query.or(
        `address.ilike.%${kw}%,city.ilike.%${kw}%,state.ilike.%${kw}%,zip.ilike.%${kw}%`
      );
    }

    const cityTrim = c.trim();
    if (cityTrim) query = query.ilike('city', cityTrim);

    const st = s.trim();
    if (st) query = query.ilike('state', st);

    if (min !== null && !Number.isNaN(min)) query = query.gte('price', min);
    if (max !== null && !Number.isNaN(max)) query = query.lte('price', max);

    const { data, error } = await query;
    if (!error) setListings(data || []);
    setSubmitting(false);
  }

  function resetFilters() {
    setKeyword('');
    setCity('');
    setStateCode('');
    setMinPrice('');
    setMaxPrice('');
    fetchListings({
      keyword: '',
      city: '',
      stateCode: '',
      minPrice: null,
      maxPrice: null,
    });
  }

  const disabledSearch = useMemo(
    () => submitting || loading,
    [submitting, loading]
  );

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0f172a', // slate-900
        color: '#fff',
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Top nav actions (white text blocks) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Link href="/post" style={navBtn}>Post Deal</Link>
          <Link href="/listings" style={navBtn}>My Listings</Link>
          <Link href="/login" style={navBtn}>Login</Link>
          <Link href="/" style={navBtn}>Deals</Link>
        </div>

        {/* Title + mobile filter toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              marginBottom: 12,
              color: '#fff',
            }}
          >
            Deals
          </h1>

          {/* Mobile-only toggle */}
          <button
            type="button"
            onClick={() => setShowFiltersMobile((v) => !v)}
            className="filters-toggle"
            style={filtersToggle}
            aria-label="Toggle filters"
          >
            {showFiltersMobile ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Search / Filter Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchListings();
          }}
          className={`filters ${showFiltersMobile ? 'open' : ''}`}
        >
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search address/city/state/zip…"
            style={inputStyle}
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            style={inputStyle}
          />
          <input
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            placeholder="ST"
            style={{ ...inputStyle, textTransform: 'uppercase' }}
          />
          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min Price"
            inputMode="numeric"
            style={inputStyle}
          />
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max Price"
            inputMode="numeric"
            style={inputStyle}
          />
          <button
            disabled={disabledSearch}
            type="submit"
            style={{
              ...btnPrimary,
              opacity: disabledSearch ? 0.6 : 1,
              cursor: disabledSearch ? 'not-allowed' : 'pointer',
            }}
            title="Search"
          >
            {submitting ? 'Searching…' : 'Search'}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            disabled={disabledSearch}
            style={{
              ...btnGhost,
              opacity: disabledSearch ? 0.6 : 1,
              cursor: disabledSearch ? 'not-allowed' : 'pointer',
            }}
            title="Reset filters"
          >
            Reset
          </button>
        </form>

        {/* Results */}
        {loading ? (
          <div style={{ opacity: 0.8 }}>Loading…</div>
        ) : listings.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No deals found.</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {listings.map((l) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                style={{
                  display: 'block',
                  background: '#111827', // gray-900 card
                  border: '1px solid #27272a',
                  borderRadius: 12,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: '#fff',
                }}
              >
                <div style={{ height: 160, background: '#0b0f1a' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.image_url ? (
                    <img
                      src={l.image_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : null}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    ${Number(l.price).toLocaleString()}
                  </div>
                  <div style={{ opacity: 0.85, fontSize: 14 }}>
                    {l.address}
                    {l.city ? `, ${l.city}` : ''}
                    {l.state ? `, ${l.state}` : ''}
                    {l.zip ? ` ${l.zip}` : ''}
                  </div>

                  {/* quick specs row */}
                  {(l.bedrooms || l.bathrooms || l.home_sqft) ? (
                    <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                      {numOrDash(l.bedrooms)} bd • {numOrDash(l.bathrooms)} ba
                      {l.home_sqft ? ` • ${Number(l.home_sqft).toLocaleString()} sf` : ''}
                    </div>
                  ) : null}

                  {/* ARV / Repairs chips */}
                  {(l.arv || l.repairs) ? (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {l.arv ? (
                        <span style={chip}>ARV ${Number(l.arv).toLocaleString()}</span>
                      ) : null}
                      {l.repairs ? (
                        <span style={chip}>Repairs ${Number(l.repairs).toLocaleString()}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Responsive styles for the filter grid */}
      <style jsx>{`
        .filters {
          display: grid;
          grid-template-columns: 2fr 1fr 80px 1fr 1fr auto auto;
          gap: 8px;
          align-items: center;
          margin-bottom: 12px;
        }
        .filters-toggle {
          display: none;
        }

        /* Tablet */
        @media (max-width: 900px) {
          .filters {
            grid-template-columns: 1fr 1fr 80px;
            grid-auto-rows: minmax(0, auto);
          }
        }

        /* Phones: collapse with a toggle for room */
        @media (max-width: 640px) {
          .filters-toggle {
            display: inline-flex;
          }
          .filters {
            display: none;
            grid-template-columns: 1fr;
            width: 100%;
            margin-bottom: 12px;
          }
          .filters.open {
            display: grid;
          }
          .filters > * {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

/* ——— helpers ——— */
function numOrDash(n: number | null) {
  return typeof n === 'number' && Number.isFinite(n) ? String(n) : '—';
}

/* ——— styles ——— */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #334155', // slate-700
  borderRadius: 10,
  background: '#0b1220', // near-black
  color: '#fff',
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  background: '#0ea5e9', // sky-500
  color: '#fff',
  border: '0',
  fontWeight: 700,
};

const btnGhost: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  background: '#0b1220',
  color: '#fff',
  border: '1px solid #334155',
  fontWeight: 700,
};

const navBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  background: '#0b1220',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.12)',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
};

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: 999,
  background: '#0b1220',
  border: '1px solid #334155',
  fontSize: 12,
  opacity: 0.95,
};
const filtersToggle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  background: '#0b1220',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.2)',
  fontWeight: 700,
  cursor: 'pointer',
};
