// app/auth/callback/page.tsx
'use client'

// This page is strictly client-only; do not prerender
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Read ?code= from the URL on the client
    const code =
      typeof window !== 'undefined'
        ? new URL(window.location.href).searchParams.get('code')
        : null

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
        if (error) console.error('exchangeCodeForSession error:', error)
      } finally {
        router.replace('/')
      }
    })()
  }, [router])

  return <main style={{ padding: 24 }}>Signing you in…</main>
}
