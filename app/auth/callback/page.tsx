// app/auth/callback/page.tsx
'use client'

// Don't prerender this page; run only on the client
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
    const code = url?.searchParams.get('code')
    const token_hash = url?.searchParams.get('token_hash')
    const type = url?.searchParams.get('type') as
      | 'magiclink'
      | 'recovery'
      | 'invite'
      | 'signup'
      | 'email_change'
      | null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    ;(async () => {
      try {
        if (code) {
          // OAuth
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) console.error('exchangeCodeForSession error:', error)
        } else if (token_hash && type) {
          // Magic link / invites / recoveries
          const { error } = await supabase.auth.verifyOtp({ token_hash, type })
          if (error) console.error('verifyOtp error:', error)
        } else {
          console.warn('Auth callback missing code or token_hash')
        }
      } finally {
        router.replace('/') // where to land after auth
      }
    })()
  }, [router])

  return <main style={{ padding: 24 }}>Signing you in…</main>
}
