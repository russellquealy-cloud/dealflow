// app/browse/page.tsx
'use client';

import dynamic from 'next/dynamic';
import ListingsSplitClient from '@/components/ListingsSplitClient';

const MapViewClient = dynamic(() => import('@/components/MapViewClient'), { ssr: false });

export default function BrowsePage() {
  return (
    <main className="p-4">
      <ListingsSplitClient points={[]} listings={[]} MapComponent={MapViewClient} />
    </main>
  );
}
