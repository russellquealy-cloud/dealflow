'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestSimplePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      console.log('=== SIMPLE TEST ===');
      
      try {
        const { data, error } = await supabase.from('listings').select('*').limit(10);
        console.log('Database result:', { data, error, count: data?.length });
        
        if (error) {
          console.error('Error:', error);
          return;
        }
        
        if (!data) {
          console.log('No data');
          return;
        }

        // Simple processing
        const items = data.map((r: any) => ({
          id: String(r.id),
          address: r.address,
          city: r.city,
          state: r.state,
          price: r.price,
          bedrooms: r.bedrooms,
          bathrooms: r.bathrooms,
          home_sqft: r.home_sqft,
          description: r.description,
          cover_image_url: r.image_url,
        }));

        const pts = data
          .map((r: any) => {
            const lat = r.latitude;
            const lng = r.longitude;
            return typeof lat === 'number' && typeof lng === 'number'
              ? { id: String(r.id), lat, lng, price: r.price }
              : null;
          })
          .filter((x: any) => !!x);

        console.log('Processed:', { items: items.length, points: pts.length });
        console.log('Sample item:', items[0]);
        console.log('Sample point:', pts[0]);
        
        setListings(items);
        setPoints(pts);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Simple Test Page</h1>
      
      <h2>Listings ({listings.length})</h2>
      {listings.map((listing) => (
        <div key={listing.id} style={{ border: '1px solid #ccc', padding: 10, margin: 5 }}>
          <strong>{listing.address}</strong> - ${listing.price} - {listing.bedrooms}bed/{listing.bathrooms}bath
        </div>
      ))}
      
      <h2>Points ({points.length})</h2>
      {points.map((point) => (
        <div key={point.id} style={{ border: '1px solid #ccc', padding: 10, margin: 5 }}>
          Point: {point.lat}, {point.lng} - ${point.price}
        </div>
      ))}
    </div>
  );
}
