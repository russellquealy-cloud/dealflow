'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    (async () => {
      // For magic links, supabase-js will hydrate the session on page load
      // when the access_token is in the URL hash. We just ensure it’s ready,
      // then bounce the user to their intended page.
      await supabase.auth.getSession().catch(() => {});
      const next = params.get('next') || '/';
      router.replace(next);
    })();
  }, [router, params]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Signing you in…</h1>
      <p>You’ll be redirected automatically.</p>
    </main>
  );
}
