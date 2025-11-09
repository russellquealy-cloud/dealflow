'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard';
import type { ListingLike } from '@/components/ListingCard';
import { useAuth } from '@/providers/AuthProvider';

interface WatchlistItem {
  id: string;
  property_id: string;
  created_at: string;
  listing: ListingLike;
}

export default function WatchlistsPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const authToken = useMemo(() => session?.access_token ?? null, [session]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      router.push('/login?next=/watchlists');
      return;
    }

    const headers: HeadersInit = {};
    if (session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    fetch('/api/watchlists', {
      credentials: 'include',
      headers,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`Failed to load watchlists: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        setWatchlists(data.watchlists || []);
      })
      .catch((error) => {
        console.error('Error loading watchlists:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, session, router]);

  const handleRemove = async (watchlistId: string, listingId: string) => {
    try {
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/watchlists?listingId=${listingId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        setWatchlists(watchlists.filter(w => w.id !== watchlistId));
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div>Loading watchlists...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>My Watchlist</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          Properties you&apos;ve saved for later
        </p>
      </div>

      {watchlists.filter((item) => item.listing).length === 0 ? (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          background: '#fff'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>No Saved Properties</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Start saving properties you&apos;re interested in to track them here.
          </p>
          <Link href="/listings" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Browse Listings
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20
        }}>
            {watchlists.filter((item): item is WatchlistItem & { listing: ListingLike } => Boolean(item.listing)).map((item) => (
            <div key={item.id} style={{ position: 'relative' }}>
              <ListingCard listing={item.listing} />
              <button
                onClick={() => handleRemove(item.id, item.property_id)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  padding: '6px 12px',
                  background: '#fff',
                  border: '1px solid #dc2626',
                  borderRadius: 6,
                  color: '#dc2626',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

