'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Aurora from '@/components/Aurora'
import { PLATFORMS } from '@/components/Badge'

function fmt(n) { return (n || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) }

export default function Belege() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('verkauft')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/listings').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([ls, s]) => {
      setListings(Array.isArray(ls) ? ls : [])
      setSettings(s || {})
      setLoading(false)
    })
  }, [])

  const inRange = (item) => {
    const d = new Date(item.updatedAt || item.createdAt)
    if (dateFrom && d < new Date(dateFrom)) return false
    if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false
    return true
  }

  const sales     = listings.filter(l => l.status === 'verkauft' && inRange(l))
  const purchases = listings.filter(l => l.status === 'inaktiv'  && l.buyPrice > 0 && inRange(l))
  const shown     = tab === 'verkauft' ? sales : purchases

  const totalRevenue = sales.reduce((s, l) => s + (l.price || 0), 0)
  const totalEK      = purchases.reduce((s, l) => s + (l.buyPrice || 0), 0)

  async function openBeleg(listing) {
    const res = await fetch('/api/receipts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sale', listingId: listing.id, totalNet: listing.price }),
    })
    const receipt = await res.json()
    window.open(`/belege/${listing.id}?rn=${receipt.receiptNo}`, '_blank')
  }

  async function openEinkaufBeleg(listing) {
    const res = await fetch('/api/receipts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'purchase', listingId: listing.id, totalNet: listing.buyPrice }),
    })
    const receipt = await res.json()
    window.open(`/belege/${listing.id}?rn=${receipt.receiptNo}&type=purchase`, '_blank')
  }

  async function openSammelbeleg() {
    const items = tab === 'verkauft' ? sales : purchases
    if (!items.length) return
    const res = await fetch('/api/receipts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'monthly', periodFrom: dateFrom || null, periodTo: dateTo || null,
        totalNet: tab === 'verkauft' ? totalRevenue : totalEK,
      }),
    })
    const receipt = await res.json()
    const ids = items.map(l => l.id).join(',')
    const label = [dateFrom, dateTo].filter(Boolean).join(' – ') || 'Alle'
    window.open(`/belege/monthly?ids=${ids}&month=${encodeURIComponent(label)}&rn=${receipt.receiptNo}&type=${tab}`, '_blank')
  }

  const inputStyle = {
    padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 10,
    background: 'var(--input-bg)', color: 'var(--text-1)', fontSize: 13,
    fontFamily: 'inherit', flex: 1, minWidth: 0,
  }

  if (loading) return (
    <div className="ls-page">
      <Aurora />
      <Sidebar />
      <main className="md:ml-60 ls-page-content" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }} className="ls-content">
          {[1,2,3].map(i => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
              <div className="ls-skeleton" style={{ height: 18, width: '55%', marginBottom: 8 }}/>
              <div className="ls-skeleton" style={{ height: 12, width: '35%' }}/>
            </div>
          ))}
        </div>
      </main>
    </div>
  )

  return (
    <div className="ls-page">
      <Aurora />
      <Sidebar />
      <main className="md:ml-60 ls-page-content" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }} className="ls-content">

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }} className="ls-text-shimmer">Belege</h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '3px 0 0', fontWeight: 500 }}>Finanzamt-konforme Belege für Einkäufe & Verkäufe</p>
            </div>
            {!settings.shopName && (
              <button onClick={() => router.push('/settings')}
                style={{
                  fontSize: 12.5, padding: '7px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                  background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', color: 'var(--warn-text)',
                  fontFamily: 'inherit',
                }}>
                ⚠️ Geschäftsinfo fehlt
              </button>
            )}
          </div>

          {/* ── Summary cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(244,81,30,0.07)', border: '1px solid rgba(244,81,30,0.15)', borderRadius: 18, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Verkäufe im Zeitraum</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 2px' }}>{sales.length}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f4511e', margin: 0 }}>{fmt(totalRevenue)} Umsatz</p>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 18, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Einkäufe im Zeitraum</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 2px' }}>{purchases.length}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', margin: 0 }}>{fmt(totalEK)} Einkauf</p>
            </div>
          </div>

          {/* ── Filters ── */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Zeitraum & Typ</p>

            {/* Tab row */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'verkauft', label: 'Verkaufsbelege', color: '#f4511e', bg: 'rgba(244,81,30,0.08)' },
                { id: 'einkauf',  label: 'Einkaufsbelege', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 11, fontSize: 13, fontWeight: 700,
                    border: `1.5px solid ${tab === t.id ? t.color : 'var(--border)'}`,
                    background: tab === t.id ? t.bg : 'var(--surface)',
                    color: tab === t.id ? t.color : 'var(--text-2)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>Von</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle}/>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>Bis</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle}/>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo('') }}
                  style={{ fontSize: 13, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '4px 6px' }}>
                  ✕
                </button>
              )}
            </div>

            {/* Batch receipt button */}
            <button onClick={openSammelbeleg} disabled={!shown.length}
              style={{
                width: '100%', padding: '13px', borderRadius: 13,
                background: shown.length ? 'linear-gradient(135deg,#f4511e,#e0451a)' : 'var(--modal-close)',
                color: shown.length ? '#fff' : 'var(--text-3)',
                border: 'none', fontWeight: 700, fontSize: 14, cursor: shown.length ? 'pointer' : 'default',
                fontFamily: 'inherit', boxShadow: shown.length ? '0 4px 14px rgba(244,81,30,0.3)' : 'none',
                transition: 'all .15s',
              }}>
              🖨️ Sammelbeleg für {shown.length} {tab === 'verkauft' ? 'Verkäufe' : 'Einkäufe'} erstellen
            </button>
          </div>

          {/* ── Listing rows ── */}
          {shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--modal-close)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.75" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
              </div>
              <p style={{ fontWeight: 600, color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
                {tab === 'verkauft' ? 'Keine Verkäufe im gewählten Zeitraum.' : 'Keine Einkäufe im gewählten Zeitraum.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shown.map(l => {
                const plt    = (l.platforms || []).map(p => PLATFORMS[p]?.name || p).join(', ') || '—'
                const date   = new Date(l.updatedAt || l.createdAt).toLocaleDateString('de-DE')
                const amount = tab === 'verkauft' ? l.price : l.buyPrice
                return (
                  <div key={l.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'background .1s',
                  }}
                    onMouseOver={e => e.currentTarget.style.background='var(--row-hover)'}
                    onMouseOut={e => e.currentTarget.style.background='var(--surface)'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{plt} · {date}</p>
                    </div>
                    <p style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: 15, flexShrink: 0, margin: 0 }}>{fmt(amount)}</p>
                    <button
                      onClick={() => tab === 'verkauft' ? openBeleg(l) : openEinkaufBeleg(l)}
                      style={{
                        flexShrink: 0, padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                        background: 'rgba(244,81,30,0.07)', color: '#f4511e',
                        border: '1px solid rgba(244,81,30,0.15)', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      Beleg
                    </button>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </main>
      
    </div>
  )
}
