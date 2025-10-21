'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

export default function SimpleListingsPage() {
  const [listings, setListings] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      console.log('🔍 Simple listings page - loading data...');
      
      try {
        console.log('🔍 Supabase client:', !!supabase);
        console.log('🔍 Environment check:', {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        });

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .limit(10);

        console.log('📊 Database response:', { data, error });

        if (error) {
          console.error('❌ Database error:', error);
          setError(`Database error: ${error.message}`);
          setLoading(false);
          return;
        }

        if (data) {
          console.log('✅ Data loaded:', data.length, 'listings');
          setListings(data);
        } else {
          console.log('⚠️ No data returned');
          setListings([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Unexpected error:', err);
        setError(`Unexpected error: ${err}`);
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Loading listings...</h2>
        <p>Checking database connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Error Loading Listings</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <a href="/add-test-data" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
          Try adding test data
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Simple Listings Test</h1>
      <p>Found {listings.length} listings</p>
      
      {listings.length === 0 ? (
        <div>
          <p>No listings found. This could mean:</p>
          <ul>
            <li>The database is empty</li>
            <li>RLS policies are blocking access</li>
            <li>There&apos;s a connection issue</li>
          </ul>
          <a href="/add-test-data" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
            Add test data
          </a>
        </div>
      ) : (
        <div>
          <h3>Sample Listings:</h3>
          {listings.map((listing, index) => {
            const l = listing as Record<string, unknown>;
            return (
              <div key={String(l.id) || index} style={{ 
                border: '1px solid #ddd', 
                padding: 10, 
                margin: '10px 0',
                borderRadius: 8 
              }}>
                <h4>{String(l.title) || 'Untitled'}</h4>
                <p><strong>Address:</strong> {String(l.address)}</p>
                <p><strong>Price:</strong> ${Number(l.price)?.toLocaleString()}</p>
                <p><strong>Beds/Baths:</strong> {Number(l.bedrooms)}/{Number(l.bathrooms)}</p>
                <p><strong>Coordinates:</strong> {Number(l.latitude)}, {Number(l.longitude)}</p>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <a href="/listings" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
          ← Back to Main Listings
        </a>
      </div>
    </div>
  );
}
