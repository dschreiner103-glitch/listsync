'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: 'für immer',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg,#374151,#1f2937)',
    features: [
      { text: '5 Listings', ok: true },
      { text: '1 Plattform pro Crosspost', ok: true },
      { text: 'Basis-Analytics', ok: true },
      { text: 'Bulk Crosspost', ok: false },
      { text: 'Alle 3 Plattformen', ok: false },
      { text: 'Vollständige Analytics', ok: false },
    ],
    cta: 'Aktueller Plan',
    disabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€9,99',
    period: 'pro Monat',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    badge: 'Beliebt',
    features: [
      { text: 'Unlimitierte Listings', ok: true },
      { text: 'Alle 3 Plattformen', ok: true },
      { text: 'Bulk Crosspost', ok: true },
      { text: 'Vollständige Analytics', ok: true },
      { text: 'Prioritäts-Support', ok: true },
      { text: 'Monatlich kündbar', ok: true },
    ],
    cta: 'Pro starten',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '€79',
    period: 'einmalig',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg,#d97706,#f59e0b)',
    badge: 'Bestes Angebot',
    features: [
      { text: 'Alles aus Pro', ok: true },
      { text: 'Einmalige Zahlung', ok: true },
      { text: 'Für immer Pro', ok: true },
      { text: 'Alle zukünftigen Features', ok: true },
      { text: 'Keine Abo-Gebühren', ok: true },
      { text: 'Sofortiger Zugang', ok: true },
    ],
    cta: 'Lifetime holen',
  },
]

function Check({ ok }) {
  return ok ? (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function Pricing() {
  const router = useRouter()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  async function handleUpgrade(planId) {
    if (planId === 'free') return
    setLoading(planId)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        setError(data.error || 'Fehler beim Checkout')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Verbindungsfehler. Bitte versuche es erneut.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="ls-page" style={{ display: 'flex' }}>
      <Sidebar active="pricing" />
      <div style={{ flex: 1, minWidth: 0, padding: '28px 24px', paddingBottom: 80 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 12px' }}>
              Wähle deinen Plan
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-2)', margin: 0 }}>
              Starte kostenlos — upgrade wenn du bereit bist.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', color: '#dc2626', marginBottom: 24, textAlign: 'center', fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'start' }}>
            {plans.map(plan => (
              <div key={plan.id} style={{
                background: 'var(--surface)',
                border: plan.id === 'pro' ? '2px solid #6366f1' : '1px solid var(--border)',
                borderRadius: 24,
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform .2s, box-shadow .2s',
              }}>
                {/* Top gradient bar */}
                <div style={{ background: plan.gradient, height: 6 }} />

                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: 20, right: 16,
                    background: plan.gradient, color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  }}>{plan.badge}</div>
                )}

                <div style={{ padding: '28px 28px 32px' }}>
                  {/* Name */}
                  <p style={{ fontSize: 13, fontWeight: 700, color: plan.color, letterSpacing: '.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                    {plan.name}
                  </p>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{plan.price}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 28px' }}>{plan.period}</p>

                  {/* Features */}
                  <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Check ok={f.ok} />
                        <span style={{ fontSize: 14, color: f.ok ? 'var(--text-1)' : 'var(--text-3)' }}>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={plan.disabled || loading === plan.id}
                    style={{
                      width: '100%',
                      padding: '13px 0',
                      borderRadius: 14,
                      border: 'none',
                      cursor: plan.disabled ? 'default' : 'pointer',
                      fontSize: 15,
                      fontWeight: 700,
                      transition: 'opacity .15s',
                      background: plan.disabled ? 'var(--border)' : plan.gradient,
                      color: plan.disabled ? 'var(--text-3)' : '#fff',
                      opacity: loading && loading !== plan.id ? 0.6 : 1,
                    }}
                  >
                    {loading === plan.id ? 'Weiterleitung…' : plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ marginTop: 64, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
              Fragen? Schreib uns auf{' '}
              <span style={{ color: '#6366f1', fontWeight: 600 }}>support@listsync.de</span>
              {' '}· Alle Preise inkl. MwSt.
            </p>
          </div>

        </div>
      </div>
      <MobileNav active="pricing" />
    </div>
  )
}
