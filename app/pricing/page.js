'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'

const plans = [
  {
    id: 'free',
    name: 'Free',
    sub: 'Zum Ausprobieren',
    price: '0 €',
    period: 'für immer',
    accent: '#6b7280',
    features: [
      'Bis zu 5 Listings',
      '1 Plattform pro Crosspost',
      'Lager & QR-Codes',
      'Community Zugang',
      'Basis-Dashboard',
    ],
    cta: 'Kostenlos weiter',
  },
  {
    id: 'pro',
    name: 'Pro',
    sub: 'Flexibel, jederzeit kündbar',
    price: '9,99 €',
    period: '/ Monat',
    accent: '#6366f1',
    features: [
      'Unlimitierte Listings',
      'Alle 3 Plattformen (Vinted, KA, eBay)',
      'Bulk Crossposten',
      'KI-Assistent',
      'Vollständige Analytics',
      'Prioritäts-Support',
    ],
    cta: 'Pro starten',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    sub: 'Einmal zahlen, für immer Pro',
    price: '79 €',
    period: 'einmalig',
    accent: '#22c55e',
    badge: 'Bestes Angebot',
    highlight: true,
    features: [
      'Alles aus Pro',
      'Einmalige Zahlung',
      'Keine Abo-Gebühren',
      'Alle zukünftigen Features',
      'Sofortiger Zugang',
    ],
    cta: 'Lifetime holen',
  },
]

function Check({ accent }) {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [codeMsg, setCodeMsg] = useState(null)   // { ok:bool, text:string }
  const [redeeming, setRedeeming] = useState(false)

  async function handleRedeem() {
    if (!code.trim()) return
    setRedeeming(true)
    setCodeMsg(null)
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/register'); return }
        setCodeMsg({ ok: false, text: data.error || 'Code ungültig.' })
        return
      }
      setCodeMsg({ ok: true, text: '✓ Code eingelöst! Du wirst weitergeleitet…' })
      setTimeout(() => router.push('/dashboard'), 900)
    } catch {
      setCodeMsg({ ok: false, text: 'Verbindungsfehler. Bitte erneut versuchen.' })
    } finally {
      setRedeeming(false)
    }
  }

  async function handleSelect(planId) {
    setError('')
    if (planId === 'free') {
      // Free → als onboarded markieren, dann ins Dashboard
      setLoading('free')
      try {
        const res = await fetch('/api/onboard-free', { method: 'POST' })
        if (res.status === 401) { router.push('/register'); return }
      } catch {}
      router.push('/dashboard')
      return
    }
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/register`)
          return
        }
        setError(data.error || 'Fehler beim Checkout. Bitte versuche es erneut.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Verbindungsfehler. Bitte versuche es erneut.')
    } finally {
      setLoading(null)
    }
  }

  // Auto-Checkout falls von Homepage mit ?plan= gekommen
  useEffect(() => {
    const plan = searchParams.get('plan')
    if (plan === 'pro' || plan === 'lifetime') handleSelect(plan)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, #131325, #07070f 60%)',
      color: '#f1f5f9',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '40px 20px 80px',
    }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* Logout oben rechts */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Abmelden
          </button>
        </div>

        {/* Locked Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center',
          maxWidth: 720, margin: '0 auto 40px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: 16, padding: '16px 22px',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <p style={{ margin: 0, fontSize: 14.5, color: '#fbbf24', fontWeight: 500, textAlign: 'center' }}>
            Bitte wähle einen Plan oder löse einen Code ein, um auf dein Dashboard zuzugreifen.
          </p>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 'clamp(30px,5vw,46px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            Wähle deinen Plan
          </h1>
          <p style={{ fontSize: 17, color: '#94a3b8', margin: 0 }}>
            Starte jetzt mit ListSync und behalte den Überblick.
          </p>
        </div>

        {error && (
          <div style={{
            maxWidth: 600, margin: '0 auto 28px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '12px 18px', color: '#f87171', textAlign: 'center', fontSize: 14, fontWeight: 600,
          }}>{error}</div>
        )}

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22, alignItems: 'stretch' }}>
          {plans.map(plan => (
            <div key={plan.id} style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column',
              background: plan.highlight ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.025)',
              border: plan.highlight ? `1.5px solid ${plan.accent}` : '1px solid rgba(255,255,255,0.09)',
              borderRadius: 22, padding: '30px 26px 28px',
              boxShadow: plan.highlight ? `0 0 50px ${plan.accent}22` : 'none',
            }}>
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                  background: plan.accent, color: '#06140a',
                  fontSize: 11.5, fontWeight: 800, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap',
                }}>★ {plan.badge}</div>
              )}

              <p style={{ fontSize: 19, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{plan.name}</p>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 22px' }}>{plan.sub}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 24 }}>
                <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{plan.period}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 28 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14.5, color: '#cbd5e1', lineHeight: 1.4 }}>
                    <Check accent={plan.accent} />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={loading === plan.id}
                style={{
                  marginTop: 'auto',
                  width: '100%', padding: '14px 0', borderRadius: 13, border: 'none',
                  cursor: loading === plan.id ? 'default' : 'pointer',
                  fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                  transition: 'opacity .15s, transform .15s',
                  background: plan.id === 'free' ? 'rgba(255,255,255,0.08)' : plan.accent,
                  color: plan.id === 'free' ? '#e2e8f0' : (plan.id === 'lifetime' ? '#06140a' : '#fff'),
                  opacity: loading === plan.id ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (loading !== plan.id) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {loading === plan.id ? 'Weiterleitung…' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Aktivierungscode */}
        <div style={{
          maxWidth: 520, margin: '48px auto 0',
          border: '1.5px dashed rgba(255,255,255,0.14)', borderRadius: 20,
          padding: '30px 28px', textAlign: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
            <path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 000 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1a2 2 0 000-4V9z" /><path d="M13 5v2M13 17v2M13 11v2" />
          </svg>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Hast du einen Aktivierungscode?</p>
          <p style={{ fontSize: 13.5, color: '#94a3b8', margin: '0 0 20px' }}>Beta-User und Community-Mitglieder können hier ihren Code einlösen</p>

          <div style={{ display: 'flex', gap: 10, maxWidth: 400, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setCodeMsg(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handleRedeem() }}
              placeholder="LISTSYNC-XXXX-XXXX"
              style={{
                flex: 1, minWidth: 180, padding: '12px 16px', borderRadius: 11,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#fff', fontSize: 14.5, fontFamily: 'inherit', textAlign: 'center',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}
            />
            <button onClick={handleRedeem} disabled={redeeming || !code.trim()}
              style={{
                padding: '12px 24px', borderRadius: 11, border: 'none',
                background: '#fff', color: '#07070f', fontSize: 14.5, fontWeight: 700,
                cursor: redeeming || !code.trim() ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: redeeming || !code.trim() ? 0.5 : 1,
              }}>
              {redeeming ? '…' : 'Einlösen'}
            </button>
          </div>

          {codeMsg && (
            <p style={{ margin: '14px 0 0', fontSize: 13.5, fontWeight: 600, color: codeMsg.ok ? '#22c55e' : '#f87171' }}>
              {codeMsg.text}
            </p>
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', marginTop: 40 }}>
          Sichere Zahlung über Stripe · Jederzeit kündbar · Alle Preise inkl. MwSt.
        </p>

      </div>
    </div>
  )
}

export default function Pricing() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#07070f' }} />}>
      <PricingContent />
    </Suspense>
  )
}
