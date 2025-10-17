'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

function LoginInner() {
  const params = useSearchParams();
  const next = (params ? params.get('next') : null) ?? '/';

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage('Check your email for the sign-in link.');
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm text-neutral-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="you@example.com"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded border px-3 py-2 hover:bg-neutral-50 disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send magic link'}
        </button>

        {message && <p className="text-sm text-neutral-600">{message}</p>}
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-6 max-w-md mx-auto">Loading…</main>}>
      <LoginInner />
    </Suspense>
  );
}
