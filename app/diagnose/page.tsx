'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

export default function DiagnosePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [data, setData] = useState<{
    testData: unknown;
    listingsData: unknown[];
  } | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const diagnose = async () => {
      addLog('🔍 Starting diagnosis...');
      
      // Check environment variables
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      addLog(`Environment: URL=${hasUrl}, Key=${hasKey}`);
      
      if (!hasUrl || !hasKey) {
        addLog('❌ Missing environment variables');
        return;
      }

      try {
        // Test basic connection
        addLog('Testing Supabase connection...');
        const { data: testData, error: testError } = await supabase
          .from('listings')
          .select('count(*)')
          .limit(1);
        
        if (testError) {
          addLog(`❌ Database error: ${testError.message}`);
          addLog(`Error details: ${JSON.stringify(testError)}`);
          return;
        }
        
        addLog('✅ Database connected successfully');
        
        // Get actual listings
        addLog('Fetching listings...');
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .limit(10);
        
        if (listingsError) {
          addLog(`❌ Listings error: ${listingsError.message}`);
          addLog(`Error details: ${JSON.stringify(listingsError)}`);
          return;
        }
        
        addLog(`✅ Found ${listingsData?.length || 0} listings`);
        
        if (listingsData && listingsData.length > 0) {
          addLog('Sample listing:');
          addLog(JSON.stringify(listingsData[0], null, 2));
          
          // Check for coordinates
          const hasCoords = listingsData.some((listing: unknown) => {
            const l = listing as Record<string, unknown>;
            return (l.latitude && l.longitude) || (l.lat && l.lng);
          });
          addLog(`Has coordinates: ${hasCoords}`);
        } else {
          addLog('⚠️ No listings found in database');
        }
        
        setData({ testData, listingsData });
        
      } catch (err) {
        addLog(`❌ Unexpected error: ${err}`);
      }
    };

    diagnose();
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h1>🔍 DealFlow Diagnosis</h1>
      
      <div style={{ marginBottom: 20 }}>
        <h3>Diagnostic Logs:</h3>
        <div style={{ 
          background: '#f9f9f9', 
          padding: 15, 
          borderRadius: 8, 
          maxHeight: 400, 
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: 12
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: 4 }}>{log}</div>
          ))}
        </div>
      </div>

      {data && (
        <div style={{ marginBottom: 20 }}>
          <h3>Raw Data:</h3>
          <pre style={{ 
            background: '#f9f9f9', 
            padding: 10, 
            borderRadius: 4, 
            overflow: 'auto',
            maxHeight: 300,
            fontSize: 12
          }}>
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
