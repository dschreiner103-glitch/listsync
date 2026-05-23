'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { redirect: false, email, password })
    setLoading(false)
    if (res?.error) { setError('E-Mail oder Passwort falsch.') }
    else { router.push('/dashboard') }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14,
    background: '#fff', color: '#0f172a',
    fontFamily: 'inherit', transition: 'box-shadow .15s, border-color .15s',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6h11M9 12h11M9 18h11"/>
              <circle cx="5" cy="6" r="1.5" fill="white" stroke="none"/>
              <circle cx="5" cy="12" r="1.5" fill="white" stroke="none"/>
              <circle cx="5" cy="18" r="1.5" fill="white" stroke="none"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.03em' }}>ListSync</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, fontWeight: 500 }}>Melde dich an, um weiterzumachen</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 22,
          border: '1px solid #e8ecf2', padding: '28px 28px 24px',
          boxShadow: '0 2px 8px rgba(15,23,42,.06), 0 16px 48px rgba(15,23,42,.07)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>E-Mail</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.de"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Passwort</label>
              <input
                type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#dc2626', fontSize: 13, borderRadius: 10, padding: '10px 14px', fontWeight: 500,
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', border: 'none', borderRadius: 13,
                fontSize: 14.5, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
                transition: 'opacity .15s',
                fontFamily: 'inherit', marginTop: 4,
              }}>
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13.5, color: '#94a3b8', marginTop: 20 }}>
          Noch kein Konto?{' '}
          <Link href="/register" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}
