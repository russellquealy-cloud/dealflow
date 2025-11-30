'use client';

import { useEffect, useRef } from 'react';

/**
 * Client component that tracks a single view for a listing.
 * Calls the view API endpoint once when the component mounts.
 * Prevents double-counting on re-renders using a ref.
 */
export default function ListingViewTracker({ listingId }: { listingId: string }) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Only track once per component mount
    if (hasTrackedRef.current || !listingId) {
      return;
    }

    hasTrackedRef.current = true;

    // Call the view tracking API
    fetch(`/api/listings/${listingId}/view`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          // Silently handle errors - view tracking is non-critical
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to track view:', response.status);
          }
        }
        // Success - view was tracked
      })
      .catch((error) => {
        // Silently handle network errors - view tracking is non-critical
        if (process.env.NODE_ENV === 'development') {
          console.error('Error tracking view:', error);
        }
      });
  }, [listingId]);

  // This component doesn't render anything
  return null;
}

