'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard';
import type { ListingLike } from '@/components/ListingCard';
import { useAuth } from '@/providers/AuthProvider';

interface WatchlistItem {
  id: string;
  property_id: string;
  created_at: string;
  listing: ListingLike | null;
}

export default function WatchlistsPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authToken = useMemo(() => session?.access_token ?? null, [session]);

  const loadWatchlists = React.useCallback(async () => {
    if (!session) {
      return;
    }

    const headers: HeadersInit = {};
    if (session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    console.log('📋 Loading watchlists...');
    fetch('/api/watchlists', {
      credentials: 'include',
      headers,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          const errorMessage = `Failed to load watchlists: ${response.status} ${errorText}`;
          console.error('❌ Error loading watchlists:', errorMessage);
          setError(errorMessage);
          setWatchlists([]);
          return;
        }
        const data = await response.json();
        console.log('✅ Watchlists loaded:', { count: data.watchlists?.length || 0, watchlists: data.watchlists });
        setWatchlists(data.watchlists || []);
        setError(null);
      })
      .catch((error) => {
        console.error('❌ Error loading watchlists:', error);
        setError(error instanceof Error ? error.message : 'Failed to load watchlists');
        setWatchlists([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      router.push('/login?next=/watchlists');
      return;
    }

    loadWatchlists();
  }, [authLoading, session, router, loadWatchlists]);

  // Listen for watchlist updates from other pages
  useEffect(() => {
    const handleWatchlistUpdate = (event: CustomEvent) => {
      console.log('📋 Watchlist updated event received:', event.detail);
      // Reload watchlists when a property is saved/unsaved
      loadWatchlists();
    };

    window.addEventListener('watchlist:updated', handleWatchlistUpdate as EventListener);
    return () => {
      window.removeEventListener('watchlist:updated', handleWatchlistUpdate as EventListener);
    };
  }, [loadWatchlists]);

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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div>Loading watchlists...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          border: '1px solid #dc2626',
          borderRadius: 12,
          padding: 24,
          background: '#fef2f2',
          color: '#991b1b'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>Error Loading Watchlist</h2>
          <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              // Retry loading
              const headers: HeadersInit = {};
              if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
              }
              fetch('/api/watchlists', {
                credentials: 'include',
                headers,
              })
                .then(async (response) => {
                  if (!response.ok) {
                    const errorText = await response.text().catch(() => '');
                    setError(`Failed to load watchlists: ${response.status} ${errorText}`);
                    return;
                  }
                  const data = await response.json();
                  setWatchlists(data.watchlists || []);
                  setError(null);
                })
                .catch((err) => {
                  setError(err instanceof Error ? err.message : 'Failed to load watchlists');
                })
                .finally(() => {
                  setLoading(false);
                });
            }}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Retry
          </button>
        </div>
      </main>
    );
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

