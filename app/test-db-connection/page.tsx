'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestDBConnectionPage() {
  const [status, setStatus] = useState('Testing...');
  const [data, setData] = useState<{
    count: unknown;
    listings: unknown[];
    totalListings: number;
    testInsert?: unknown;
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Testing Supabase connection...');
        
        // Check environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        console.log('Environment check:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          url: supabaseUrl?.substring(0, 20) + '...',
        });

        if (!supabaseUrl || !supabaseKey) {
          setError('Missing Supabase environment variables');
          setStatus('❌ Environment variables missing');
          return;
        }

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
          .limit(10);
        
        if (listingsError) {
          setError(`Listings error: ${listingsError.message}`);
          return;
        }
        
        setData({
          count: testData,
          listings: listingsData,
          totalListings: listingsData?.length || 0
        });

        // If no listings, try to insert test data
        if (!listingsData || listingsData.length === 0) {
          setStatus('No listings found, inserting test data...');
          
          const testListing = {
            address: '123 Test St',
            city: 'Tucson',
            state: 'AZ',
            zip: '85701',
            price: 250000,
            bedrooms: 3,
            bathrooms: 2,
            home_sqft: 1500,
            latitude: 32.2226,
            longitude: -110.9747,
            title: 'Test Property',
            description: 'This is a test property for debugging'
          };

          const { data: insertData, error: insertError } = await supabase
            .from('listings')
            .insert([testListing])
            .select();

          if (insertError) {
            setError(`Insert error: ${insertError.message}`);
            return;
          }

          setData(prev => ({
            count: prev?.count || null,
            listings: prev?.listings || [],
            totalListings: prev?.totalListings || 0,
            testInsert: insertData,
            message: 'Test data inserted successfully'
          }));
        }
        
      } catch (err) {
        setError(`Connection error: ${err}`);
        setStatus('❌ Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Database Connection Test</h1>
      
      <div style={{ marginBottom: 20, padding: 15, background: '#f3f4f6', borderRadius: 8 }}>
        <h3>Status: {status}</h3>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      {data && (
        <div style={{ marginBottom: 20 }}>
          <h3>Database Info:</h3>
          <pre style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, overflow: 'auto', maxHeight: 400 }}>
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
