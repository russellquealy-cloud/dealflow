'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  return (
    <div style={{
      background: '#111827',
      color: '#fff',
      padding: 8,
      borderRadius: 6,
      fontSize: 12,
      margin: '8px 16px'
    }}>
      <div>Debug UserID: {userId || 'Not logged in'}</div>
    </div>
  );
}
