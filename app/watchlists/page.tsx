'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
// import Link from 'next/link'; // Temporarily unused in debug mode
// import ListingCard from '@/components/ListingCard'; // Temporarily unused in debug mode
import type { ListingLike } from '@/components/ListingCard';
import { useAuth } from '@/providers/AuthProvider';

interface WatchlistItem {
  id: string;
  property_id: string;
  created_at: string;
  // Primary field: 'property' contains the listing/property data (or null if not found)
  property: ListingLike | null;
  // Backward compatibility: 'listings' field (same as property)
  listings: ListingLike | null;
}

// Type for raw API response items (for debugging)
type WatchlistApiItem = {
  id: string;
  created_at: string;
  property_id: string | null;
  listing_id?: string | null;
  property?: Record<string, unknown> | null;
  listing?: Record<string, unknown> | null;
  listings?: Record<string, unknown> | null;
};

export default function WatchlistsPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [rawItems, setRawItems] = useState<WatchlistApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(true);
  const authToken = useMemo(() => session?.access_token ?? null, [session]);

  const loadWatchlists = React.useCallback(async () => {
    if (!session) {
      console.log('📋 Watchlist: No session, skipping load');
      return;
    }

    const headers: HeadersInit = {};
    if (session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Watchlist: Loading watchlists...', {
        userId: session.user.id,
        hasToken: !!session.access_token,
      });
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/watchlists', {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        // Handle 401 gracefully - stop retrying to prevent loops
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }));
          console.error('❌ Watchlist: Unauthorized (401)', {
            error: errorData.error,
          });
          setError('Please sign in to view your watchlist.');
          setWatchlists([]);
          setLoading(false);
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/login?next=/watchlists');
          }, 2000);
          return;
        }
        
        const errorText = await response.text().catch(() => '');
        const errorMessage = `Failed to load watchlists: ${response.status} ${errorText}`;
        console.error('❌ Watchlist: Error loading watchlists', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        setError(errorMessage);
        setWatchlists([]);
        return;
      }

      const data = await response.json();
      
      // Extract watchlist array from API response
      // The API returns { watchlists: [{ id, property_id, property: {...}, ... }] }
      const watchlistArray = Array.isArray(data.watchlists) ? data.watchlists : [];
      
      // Store raw items for debugging
      const rawApiItems = watchlistArray as WatchlistApiItem[];
      setRawItems(rawApiItems);
      
      // Log raw items in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Watchlist RAW items', rawApiItems);
        console.log('✅ Watchlist: Watchlists loaded', {
          count: rawApiItems.length,
        });
      }
      
      // Still set watchlists for backward compatibility (but we'll use rawItems for debug view)
      setWatchlists(watchlistArray);
      setError(null);
    } catch (error) {
      console.error('❌ Watchlist: Error loading watchlists', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fullError: error,
      });
      setError(error instanceof Error ? error.message : 'Failed to load watchlists');
      setWatchlists([]);
    } finally {
      setLoading(false);
    }
  }, [session, router]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      router.push('/login?next=/watchlists');
      return;
    }

    // Only load once when session becomes available
    // The loadWatchlists callback handles its own state, so we can call it safely
    loadWatchlists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, router]); // Only reload when auth state changes, not when loadWatchlists changes

  // Listen for watchlist updates from other pages
  useEffect(() => {
    const handleWatchlistUpdate = (event: CustomEvent) => {
      console.log('📋 Watchlist: Watchlist updated event received', event.detail);
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

      console.log('📋 Watchlist: Removing item', { watchlistId, listingId });

      const response = await fetch(`/api/watchlists?listingId=${listingId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        console.log('✅ Watchlist: Successfully removed item', { watchlistId, listingId });
        setWatchlists(watchlists.filter(w => w.id !== watchlistId));
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('watchlist:updated', { detail: { action: 'remove', listingId } }));
      } else {
        console.error('❌ Watchlist: Failed to remove item', {
          status: response.status,
          watchlistId,
          listingId,
        });
        setError('Failed to remove item from watchlist. Please try again.');
      }
    } catch (error) {
      console.error('❌ Watchlist: Error removing item', {
        error: error instanceof Error ? error.message : 'Unknown error',
        watchlistId,
        listingId,
      });
      setError('Error removing item from watchlist. Please try again.');
    }
  };

  // Helper to check if item has a valid property
  const hasProperty = (item: WatchlistItem): boolean => !!item.property;

  // Split items into available (with property) and unavailable (without property)
  // Simple logic: if property exists, it's available; otherwise it's unavailable
  const { itemsWithListings, itemsWithoutListings } = useMemo(() => {
    const activeItems: (WatchlistItem & { property: ListingLike })[] = [];
    const unavailableItems: WatchlistItem[] = [];
    
    watchlists.forEach((item) => {
      if (hasProperty(item) && item.property) {
        // Item has a valid property - render in main list
        activeItems.push(item as WatchlistItem & { property: ListingLike });
      } else {
        // Item without property - show in unavailable section
        unavailableItems.push(item);
      }
    });
    
    // Log summary in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Watchlist: Loaded items', {
        count: watchlists.length,
        activeCount: activeItems.length,
        unavailableCount: unavailableItems.length,
      });
    }
    
    return {
      itemsWithListings: activeItems,
      itemsWithoutListings: unavailableItems,
    };
  }, [watchlists]);

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
          <p style={{ margin: 0, fontSize: 14, marginBottom: 16 }}>{error}</p>
          <div style={{ fontSize: 12, color: '#7f1d1d', marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 6 }}>
            <strong>Debug Info:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li>Check browser console for detailed logs</li>
              <li>Verify you&apos;re logged in</li>
              <li>Check network tab for API response</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setError(null);
              loadWatchlists();
            }}
            style={{
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

  // Simplified debug view - use raw items directly
  const items = rawItems ?? [];
  const hasAnyItems = items.length > 0;

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>My Watchlist</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          Properties you&apos;ve saved for later
        </p>
      </div>

      {/* Debug toggle */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          Debug: show raw watchlist items
        </label>
      </div>

      {/* Debug JSON block */}
      {debugMode && (
        <pre
          style={{
            background: '#111827',
            color: '#e5e7eb',
            padding: '12px',
            borderRadius: '8px',
            maxHeight: '260px',
            overflow: 'auto',
            fontSize: '12px',
            marginBottom: '16px',
            border: '1px solid #374151',
          }}
        >
          {JSON.stringify(rawItems, null, 2)}
        </pre>
      )}

      {/* Simplified raw items view */}
      {hasAnyItems ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Watchlist ID: {item.id}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                property_id: {String(item.property_id ?? 'null')}
                {' · '}
                listing_id: {String(item.listing_id ?? 'null')}
              </div>
              <div style={{ fontSize: 12, marginBottom: 4, wordBreak: 'break-word' }}>
                property:{' '}
                {item.property ? JSON.stringify(item.property, null, 2) : 'null'}
              </div>
              <div style={{ fontSize: 12, marginBottom: 4, wordBreak: 'break-word' }}>
                listing:{' '}
                {item.listing ? JSON.stringify(item.listing, null, 2) : 'null'}
              </div>
              <div style={{ fontSize: 12, marginBottom: 4, wordBreak: 'break-word' }}>
                listings:{' '}
                {item.listings ? JSON.stringify(item.listings, null, 2) : 'null'}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No raw watchlist items.</p>
      )}

      {/* TEMPORARILY COMMENTED OUT - Original rendering logic will be restored after debugging */}
    </main>
  );
}
