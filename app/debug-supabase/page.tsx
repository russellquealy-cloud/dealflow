// app/debug-supabase/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

export default function DebugSupabase() {
  const [status, setStatus] = useState('Testing...');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Testing Supabase connection...');
        
        // Test basic connection
        const { data: testData, error: testError } = await supabase
          .from('listings')
          .select('id, title, address')
          .limit(5);

        if (testError) {
          setError(`Supabase Error: ${testError.message}`);
          setStatus('Connection failed');
          return;
        }

        setData(testData);
        setStatus(`Success! Found ${testData?.length || 0} listings`);
        
      } catch (err) {
        setError(`Connection Error: ${err}`);
        setStatus('Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Supabase Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: {status}</h2>
        {error && (
          <div style={{ color: 'red', background: '#fee', padding: '10px', borderRadius: '4px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {data && (
        <div>
          <h3>Sample Data:</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/listings'}
          style={{ 
            padding: '10px 20px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Listings
        </button>
      </div>
    </div>
  );
}
