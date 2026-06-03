'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Registrierung fehlgeschlagen.')
      setLoading(false)
      return
    }

    const login = await signIn('credentials', { redirect: false, email, password })
    setLoading(false)
    if (login?.error) router.push('/login')
    else router.push('/pricing')   // Nach Registrierung → Preis-Seite zum Plan wählen
  }

  const inputStyle = {
    width: '100%', padding: '13px 14px',
    border: '1px solid var(--border)', borderRadius: 12, fontSize: 15,
    background: 'var(--input-bg)', color: 'var(--text-1)',
    fontFamily: 'inherit', transition: 'box-shadow .15s, border-color .15s',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6h11M9 12h11M9 18h11"/>
              <circle cx="5" cy="6" r="1.5" fill="white" stroke="none"/>
              <circle cx="5" cy="12" r="1.5" fill="white" stroke="none"/>
              <circle cx="5" cy="18" r="1.5" fill="white" stroke="none"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px', letterSpacing: '-0.03em' }}>ListSync</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, fontWeight: 500 }}>Erstelle dein Konto</p>
        </div>

        {/* Card */}
        <div className="ls-card" style={{ padding: '28px 26px 24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>
                Name <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                autoComplete="name"
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Dein Name"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>E-Mail</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.de"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Passwort</label>
              <input
                type="password" required autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', fontSize: 13, borderRadius: 10, padding: '10px 14px', fontWeight: 600,
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
                transition: 'opacity .15s',
                fontFamily: 'inherit', marginTop: 4,
              }}>
              {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--text-3)', marginTop: 20 }}>
          Bereits registriert?{' '}
          <Link href="/login" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
