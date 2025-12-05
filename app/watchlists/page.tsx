'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard';
import type { ListingLike } from '@/components/ListingCard';
import { useAuth } from '@/providers/AuthProvider';

// Type matching the API response shape
type Listing = {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  featured_image_url: string | null;
};

type WatchlistItem = {
  id: string;
  user_id: string;
  property_id: string | null;
  created_at: string;
  listing: Listing | null;
};

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
        setError(errorMessage);
        setWatchlists([]);
        return;
      }

      const data = await response.json();
      
      // Extract watchlist array from API response
      const watchlistArray = Array.isArray(data.watchlists) ? data.watchlists : [];
      setWatchlists(watchlistArray as WatchlistItem[]);
      setError(null);
    } catch (error) {
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

    loadWatchlists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, router]);

  // Listen for watchlist updates from other pages
  useEffect(() => {
    const handleWatchlistUpdate = () => {
      // Reload watchlists when a property is saved/unsaved
      loadWatchlists();
    };

    window.addEventListener('watchlist:updated', handleWatchlistUpdate as EventListener);
    return () => {
      window.removeEventListener('watchlist:updated', handleWatchlistUpdate as EventListener);
    };
  }, [loadWatchlists]);

  const handleRemove = async (watchlistId: string, propertyId: string) => {
    try {
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/watchlists?listingId=${propertyId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        setWatchlists(watchlists.filter(w => w.id !== watchlistId));
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('watchlist:updated', { detail: { action: 'remove', listingId: propertyId } }));
      } else {
        setError('Failed to remove item from watchlist. Please try again.');
      }
    } catch {
      setError('Error removing item from watchlist. Please try again.');
    }
  };

  // Split items into available (with listing) and unavailable (without listing)
  const { availableItems, unavailableItems } = useMemo(() => {
    const available: WatchlistItem[] = [];
    const unavailable: WatchlistItem[] = [];
    
    watchlists.forEach((item) => {
      if (item.listing) {
        available.push(item);
      } else {
        unavailable.push(item);
      }
    });
    
    return {
      availableItems: available,
      unavailableItems: unavailable,
    };
  }, [watchlists]);

  // Convert API listing format to ListingLike format for ListingCard
  const convertListingToCardFormat = (listing: Listing): ListingLike => {
    return {
      id: listing.id,
      title: listing.title ?? undefined,
      address: listing.address ?? undefined,
      city: listing.city ?? undefined,
      state: listing.state ?? undefined,
      zip: listing.zip ?? undefined,
      price: listing.price ?? undefined,
      bedrooms: listing.beds ?? undefined,
      bathrooms: listing.baths ?? undefined,
      home_sqft: listing.sqft ?? undefined,
      cover_image_url: listing.featured_image_url ?? undefined,
      images: listing.featured_image_url ? [listing.featured_image_url] : undefined,
    };
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
          <p style={{ margin: 0, fontSize: 14, marginBottom: 16 }}>{error}</p>
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

  const hasAnyItems = watchlists.length > 0;

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>My Watchlist</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          Properties you&apos;ve saved for later
        </p>
      </div>

      {!hasAnyItems ? (
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
          {/* Unavailable Properties Section */}
          {unavailableItems.length > 0 && (
            <div style={{
              marginBottom: 24,
              padding: 16,
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: 8,
              fontSize: 14,
              color: '#92400e'
            }}>
              <strong>⚠️ Unavailable Properties:</strong> {unavailableItems.length} saved {unavailableItems.length === 1 ? 'property' : 'properties'} {unavailableItems.length === 1 ? 'is' : 'are'} no longer available. This may be because the listing was deleted or is no longer accessible.
              <div style={{ marginTop: 12, fontSize: 12, color: '#78350f' }}>
                {unavailableItems.map((item) => (
                  <div key={item.id} style={{ marginBottom: 8, padding: 8, background: '#fde68a', borderRadius: 4 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Property ID: {item.property_id}</div>
                    <div style={{ fontSize: 11, color: '#92400e', marginBottom: 8 }}>
                      Saved on: {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleRemove(item.id, item.property_id || '')}
                      style={{
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

          {/* Available Properties Section */}
          {availableItems.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20
            }}>
              {availableItems.map((item) => {
                if (!item.listing) return null;

                const listingForCard = convertListingToCardFormat(item.listing);

                return (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <ListingCard listing={listingForCard} />
                    <button
                      onClick={() => handleRemove(item.id, item.property_id || '')}
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
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
