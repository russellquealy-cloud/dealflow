'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

type Props = {
  listingId: string | number;
  size?: 'small' | 'medium' | 'large';
};

export default function WatchlistButton({ listingId, size = 'medium' }: Props) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkWatchlist = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      try {
        const response = await fetch(`/api/watchlists?listingId=${listingId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsInWatchlist(data.isInWatchlist || false);
        }
      } catch (error) {
        console.error('Error checking watchlist:', error);
      } finally {
        setLoading(false);
      }
    };

    checkWatchlist();
  }, [listingId]);

  const toggleWatchlist = async () => {
    if (!userId || updating) return;

    setUpdating(true);
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlists?listingId=${listingId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          setIsInWatchlist(false);
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  if (loading) {
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

