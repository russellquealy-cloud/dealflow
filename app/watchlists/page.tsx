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
  listings: ListingLike | null; // ROOT CAUSE FIX: Use 'listings' (plural) to match API response
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
      console.log('📋 Watchlist: No session, skipping load');
      return;
    }

    const headers: HeadersInit = {};
    if (session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Only log once per load attempt, not in a loop
    console.log('📋 Watchlist: Loading watchlists...', {
      userId: session.user.id,
      hasToken: !!session.access_token,
    });

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
      console.log('✅ Watchlist: Watchlists loaded', {
        count: data.watchlists?.length || 0,
      });
      
      // Ensure we're mapping 'listings' (plural) from API response
      // The API returns { watchlists: [{ id, property_id, listings: {...} }] }
      const watchlistArray = Array.isArray(data.watchlists) ? data.watchlists : [];
      
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

  // Split items into available (with listings) and unavailable (without listings)
  // Treating "no listing attached" as a normal case, not an error
  const { itemsWithListings, itemsWithoutListings } = useMemo(() => {
    const available: (WatchlistItem & { listings: ListingLike })[] = [];
    const unavailable: WatchlistItem[] = [];
    
    watchlists.forEach((item) => {
      if (item.listings) {
        available.push(item as WatchlistItem & { listings: ListingLike });
      } else {
        // Item without listing - this is normal (listing may have been deleted)
        // Only log in development mode for debugging
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Watchlist] Item without listing, treating as unavailable', {
            id: item.id,
            property_id: item.property_id,
          });
        }
        unavailable.push(item);
      }
    });
    
    // Log summary in development
    if (process.env.NODE_ENV === 'development' && unavailable.length > 0) {
      console.debug(`[Watchlist] Found ${unavailable.length} unavailable item(s) (normal case)`);
    }
    
    return {
      itemsWithListings: available,
      itemsWithoutListings: unavailable,
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

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>My Watchlist</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          Properties you&apos;ve saved for later
        </p>
      </div>

      {itemsWithListings.length === 0 && itemsWithoutListings.length === 0 ? (
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
        <>
          {itemsWithoutListings.length > 0 && (
            <div style={{
              marginBottom: 16,
              padding: 16,
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: 8,
              fontSize: 14,
              color: '#92400e'
            }}>
              <strong>⚠️ Unavailable Properties:</strong> {itemsWithoutListings.length} saved {itemsWithoutListings.length === 1 ? 'property' : 'properties'} {itemsWithoutListings.length === 1 ? 'is' : 'are'} no longer available. This may be because the listing was deleted or is no longer accessible.
              <div style={{ marginTop: 12, fontSize: 12, color: '#78350f' }}>
                {itemsWithoutListings.map((item) => (
                  <div key={item.id} style={{ marginBottom: 8, padding: 8, background: '#fde68a', borderRadius: 4 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Property ID: {item.property_id}</div>
                    <div style={{ fontSize: 11, color: '#92400e' }}>
                      Saved on: {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleRemove(item.id, item.property_id)}
                      style={{
                        marginTop: 8,
                        padding: '4px 12px',
                        background: '#fff',
                        border: '1px solid #dc2626',
                        borderRadius: 4,
                        color: '#dc2626',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Remove from Watchlist
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {itemsWithListings.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20
            }}>
              {itemsWithListings.map((item) => (
                <div key={item.id} style={{ position: 'relative' }}>
                  {/* ROOT CAUSE FIX: Use item.listings (plural) to match API response */}
                  <ListingCard listing={item.listings} />
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
        </>
      )}
    </main>
  );
}
