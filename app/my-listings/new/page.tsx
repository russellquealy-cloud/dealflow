'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateListingForm from '@/components/CreateListingForm';
import { useAuth } from '@/providers/AuthProvider';

export default function NewListingPage() {
  const router = useRouter();
  const { session, loading, refreshSession } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      void refreshSession();
      router.replace('/login?next=/my-listings/new');
    }
  }, [session, loading, router, refreshSession]);

  if (loading) {
    return (
      <main style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: 16, color: '#4b5563' }}>Checking your session…</div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Create Listing</h1>
      <CreateListingForm ownerId={session.user.id} />
    </main>
  );
}
