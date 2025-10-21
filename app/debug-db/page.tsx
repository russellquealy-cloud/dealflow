'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

export default function DebugDBPage() {
  const [status, setStatus] = useState('Loading...');
  const [data, setData] = useState<{
    count: unknown;
    listings: unknown[];
    totalListings: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Testing database connection...');
        
        // Test basic connection
        const { data: testData, error: testError } = await supabase
          .from('listings')
          .select('count(*)')
          .limit(1);
        
        if (testError) {
          setError(`Database error: ${testError.message}`);
          setStatus('❌ Database connection failed');
          return;
        }
        
        setStatus('✅ Database connected successfully');
        
        // Get actual listings data
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .limit(5);
        
        if (listingsError) {
          setError(`Listings error: ${listingsError.message}`);
          return;
        }
        
        setData({
          count: testData,
          listings: listingsData,
          totalListings: listingsData?.length || 0
        });
        
      } catch (err) {
        setError(`Connection error: ${err}`);
        setStatus('❌ Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Database Debug Page</h1>
      
      <div style={{ marginBottom: 20, padding: 15, background: '#f3f4f6', borderRadius: 8 }}>
        <h3>Status: {status}</h3>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      {data && (
        <div style={{ marginBottom: 20 }}>
          <h3>Database Info:</h3>
          <pre style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <a href="/listings" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
          ← Back to Listings
        </a>
      </div>
    </div>
  );
}
