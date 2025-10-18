'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugListingsPage() {
  const [data, setData] = useState<any>(null);
  const [processed, setProcessed] = useState<any>(null);

  useEffect(() => {
    const testData = async () => {
      console.log('=== DEBUG LISTINGS TEST ===');
      
      // Test 1: Raw database query
      const { data: rawData, error } = await supabase.from('listings').select('*').limit(5);
      console.log('1. Raw database query:', { data: rawData, error, count: rawData?.length });
      setData(rawData);

      if (!rawData) return;

      // Test 2: Process the data like the main page does
      const toNum = (v: unknown): number | undefined => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string') {
          const n = Number(v.replace(/[^0-9.\-]/g, ''));
          return Number.isFinite(n) ? n : undefined;
        }
        return undefined;
      };

      const items = rawData.map((r: any) => {
        const price = toNum(r.price);
        return {
          id: String(r.id),
          title: r.title ?? undefined,
          address: r.address ?? undefined,
          city: r.city ?? undefined,
          state: r.state ?? undefined,
          zip: r.zip ?? undefined,
          price,
          bedrooms: (r.bedrooms ?? r.beds) ?? undefined,
          bathrooms: (r.bathrooms ?? r.baths) ?? undefined,
          home_sqft: (r.home_sqft ?? r.square_feet) ?? undefined,
          lot_size: toNum(r.lot_size),
          garage: r.garage ?? undefined,
          year_built: r.year_built ?? undefined,
          description: r.description ?? undefined,
          owner_phone: r.contact_phone ?? r.owner_phone ?? undefined,
          owner_email: r.contact_email ?? r.owner_email ?? undefined,
          owner_name: r.contact_name ?? r.owner_name ?? undefined,
          cover_image_url: r.image_url ?? r.cover_image_url ?? undefined,
        };
      });

      const points = rawData
        .map((r: any) => {
          const lat = r.latitude ?? r.lat;
          const lng = r.longitude ?? r.lng;
          return typeof lat === 'number' && typeof lng === 'number'
            ? { id: String(r.id), lat, lng, price: toNum(r.price) }
            : null;
        })
        .filter((x: any) => !!x);

      console.log('2. Processed items:', { items: items.length, points: points.length });
      console.log('3. Sample item:', items[0]);
      console.log('4. Sample point:', points[0]);
      
      setProcessed({ items, points });
    };

    testData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Debug Listings Processing</h1>
      
      <h2>Raw Data ({data?.length || 0} items)</h2>
      <pre style={{ background: '#f5f5f5', padding: 10, overflow: 'auto', maxHeight: 300 }}>
        {JSON.stringify(data, null, 2)}
      </pre>

      <h2>Processed Items ({processed?.items?.length || 0} items)</h2>
      <pre style={{ background: '#f5f5f5', padding: 10, overflow: 'auto', maxHeight: 300 }}>
        {JSON.stringify(processed?.items, null, 2)}
      </pre>

      <h2>Processed Points ({processed?.points?.length || 0} points)</h2>
      <pre style={{ background: '#f5f5f5', padding: 10, overflow: 'auto', maxHeight: 300 }}>
        {JSON.stringify(processed?.points, null, 2)}
      </pre>
    </div>
  );
}
