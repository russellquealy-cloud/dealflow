'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';

type Props = {
  listingId: string | number;
  size?: 'small' | 'medium' | 'large';
};

export default function WatchlistButton({ listingId, size = 'medium' }: Props) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user?.id ?? null;
  const authToken = session?.access_token ?? null;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      setLoading(false);
      return;
    }

    const headers: HeadersInit = {};
    if (session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    fetch(`/api/watchlists?listingId=${listingId}`, {
      credentials: 'include',
      headers,
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Failed to check watchlist: ${response.status} ${text}`);
        }
        const data = await response.json();
        setIsInWatchlist(data.isInWatchlist || false);
      })
      .catch((error) => {
        console.error('Error checking watchlist:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, session, listingId]);

  const toggleWatchlist = async () => {
    if (!userId || updating || !authToken) return;

    setUpdating(true);
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlists?listingId=${listingId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          setIsInWatchlist(false);
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ listingId }),
          credentials: 'include',
        });

        if (response.ok) {
          setIsInWatchlist(true);
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || authLoading) {
    return (
      <button
        disabled
        style={{
          padding: size === 'small' ? '4px 8px' : size === 'large' ? '12px 24px' : '8px 16px',
          fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          background: '#f3f4f6',
          color: '#6b7280',
          cursor: 'not-allowed',
        }}
      >
        ⭐
      </button>
    );
  }

  if (!userId) {
    return null; // Don't show button if not logged in
  }

  const buttonStyle = {
    padding: size === 'small' ? '4px 8px' : size === 'large' ? '12px 24px' : '8px 16px',
    fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
    border: isInWatchlist ? '1px solid #f59e0b' : '1px solid #e5e7eb',
    borderRadius: 6,
    background: isInWatchlist ? '#fffbeb' : '#fff',
    color: isInWatchlist ? '#f59e0b' : '#6b7280',
    cursor: updating ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 600,
  };

  return (
    <button onClick={toggleWatchlist} disabled={updating} style={buttonStyle}>
      {isInWatchlist ? '⭐ Saved' : '⭐ Save'}
    </button>
  );
}

