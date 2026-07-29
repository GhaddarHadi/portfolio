'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

// Minimal magic-link login, added early so the owner's auth user exists and the
// seed can run. The full admin UI is Phase 3.
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setMessage('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <main
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '4rem 1.5rem',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <p style={{ opacity: 0.5, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
        Admin
      </p>
      <h1 style={{ fontSize: 24, margin: '0.5rem 0 1.5rem' }}>Sign in</h1>

      {status === 'sent' ? (
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, lineHeight: 1.7 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Check your email</p>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: 13 }}>
            A sign-in link is on its way to {email}. Open it to finish logging in.
          </p>
        </div>
      ) : (
        <form onSubmit={sendLink}>
          <label htmlFor="email" style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              borderRadius: 8,
              background: '#1C2024',
              color: '#fff',
              fontSize: 14,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Email me a link'}
          </button>
          {status === 'error' && (
            <p style={{ color: '#D93A2B', fontSize: 13, marginTop: 10 }}>{message}</p>
          )}
        </form>
      )}
    </main>
  )
}
