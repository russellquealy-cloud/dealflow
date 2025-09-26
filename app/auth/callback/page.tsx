// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Let Supabase handle the OAuth redirect session
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(error);
      }
      // Redirect back home after login
      router.push('/');
    })();
  }, [router]);

  return (
    <main style={{ padding: 32 }}>
      <p>Completing sign-in…</p>
    </main>
  );
}
