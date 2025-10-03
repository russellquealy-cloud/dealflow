// app/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function LoginPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Always compute redirectTo from the current origin (Preview, Prod, or Local)
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? '')
  const redirectTo = `${origin}/auth/callback`

  async function loginWithGoogle() {
    setBusy(true); setMsg(null); setErr(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
    if (error) { setErr(error.message); setBusy(false) }
    // on success we’ll be redirected away; nothing else to do here
  }

  async function loginWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null); setErr(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    })
    setBusy(false)
    if (error) setErr(error.message)
    else setMsg('Check your inbox for a login link.')
  }

  return (
    <main style={{ minHeight: '60dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: 380, maxWidth: '100%', padding: 24, border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Sign in</h1>

        <button
          onClick={loginWithGoogle}
          disabled={busy}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: '#111827', color: '#fff', border: '1px solid #1f2937',
            cursor: 'pointer', marginBottom: 14
          }}
        >
          Continue with Google
        </button>

        <form onSubmit={loginWithEmail}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid #d1d5db', marginBottom: 10
            }}
          />
          <button
            type="submit"
            disabled={busy || !email}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              background: '#e5e7eb', color: '#111', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Send magic link
          </button>
        </form>

        {msg && <p style={{ color: '#065f46', marginTop: 10 }}>{msg}</p>}
        {err && <p style={{ color: '#b91c1c', marginTop: 10 }}>{err}</p>}

        <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
          Redirect will go to: <code>{redirectTo}</code>
        </p>
      </div>
    </main>
  )
}
