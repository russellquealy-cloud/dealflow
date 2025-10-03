// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Read `code` robustly (works even if searchParams is null in TS)
    const codeFromHook = (searchParams && typeof searchParams.get === 'function')
      ? searchParams.get('code')
      : null

    const code =
      codeFromHook ??
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('code')
        : null)

    if (!code) {
      router.replace('/')
      return
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    ;(async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          // Not fatal for UX, but log for debugging
          console.error('exchangeCodeForSession error:', error)
        }
      } finally {
        // land user on the homepage (or wherever you want)
        router.replace('/')
      }
    })()
  }, [searchParams, router])

  return <main style={{ padding: 24 }}>Signing you in…</main>
}
