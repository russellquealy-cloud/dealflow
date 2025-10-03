// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallback() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    if (!code) { router.replace('/'); return }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) console.error('exchangeCodeForSession failed', error)
        router.replace('/')
      })
  }, [params, router])

  return <main style={{ padding: 24 }}>Signing you in…</main>
}
