'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Session hydration guard to prevent flicker on mobile
 * Wraps components that depend on session state
 * Only renders children after session is initialized
 */
export function SessionGuard({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { loading } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after first render to prevent SSR/client mismatch
    setHydrated(true);
  }, []);

  // Show fallback or nothing while loading or not hydrated
  if (!hydrated || loading) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}

