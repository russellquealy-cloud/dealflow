'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('listings').select('*').limit(5);
        console.log('Database result:', { data, error });
        setData(data);
        setError(error);
        setLoading(false);
      } catch (err) {
        console.error('Connection error:', err);
        setError(err);
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Database Debug</h1>
      <h2>Error:</h2>
      <pre>{JSON.stringify(error, null, 2)}</pre>
      <h2>Data:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <h2>Count: {data?.length || 0}</h2>
    </div>
  );
}
