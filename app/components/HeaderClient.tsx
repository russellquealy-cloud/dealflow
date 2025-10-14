'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function HeaderClient() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh(); // or router.push('/')
  };

  return (
    <nav className="flex items-center gap-6 md:gap-8 text-sm">
      <Link href="/listings" className="hover:underline">Browse</Link>
      <Link href="/my-listings" className="hover:underline">My Listings</Link>
      {!email ? (
        <Link href="/login" className="rounded-lg border px-3 py-1.5 hover:bg-neutral-50">Sign in</Link>
      ) : (
        <button onClick={signOut} className="rounded-lg border px-3 py-1.5 hover:bg-neutral-50">Sign out</button>
      )}
    </nav>
  );
}
