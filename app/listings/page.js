'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import MobilePostHelper from '@/components/MobilePostHelper'
import { PlatformBadge, StatusBadge, PLATFORMS, fmt, profit, CARD_COLORS } from '@/components/Badge'

// ── Icon helper ───────────────────────────────────────────────────────────────
function Ic({ children, size = 16, sw = 2 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}

const ICONS = {
  search:   <Ic size={15} sw={2}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></Ic>,
  relist:   <Ic size={14}><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/></Ic>,
  crosspost:<Ic size={14}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></Ic>,
  check:    <Ic size={14}><polyline points="20 6 9 17 4 12"/></Ic>,
  close:    <Ic size={15} sw={2.5}><path d="M18 6L6 18M6 6l12 12"/></Ic>,
}

export default function Listings() {
  const [listings, setListings]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('alle')
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(null)
  const [toast, setToast]               = useState(null)
  const [selPlatforms, setSelPlatforms] = useState([])
  const [relistDays, setRelistDays]     = useState(5)
  const [mobileHelper, setMobileHelper] = useState(null) // { listing, platforms }
  const [extStatus, setExtStatus]       = useState(null)  // null | true | false

  useEffect(() => {
    fetch('/api/listings').then(r => r.json()).then(d => { setListings(d); setLoading(false) })
    fetch('/api/settings').then(r => r.json()).then(s => { if (s.relistDays) setRelistDays(s.relistDays) })
    // Check extension after a short delay (bridge fires LISTSYNC_EXTENSION_READY)
    const check = () => setExtStatus(!!window.__LISTSYNC_EXTENSION__)
    if (typeof window !== 'undefined') {
      window.addEventListener('LISTSYNC_EXTENSION_READY', () => setExtStatus(true), { once: true })
      setTimeout(() => setExtStatus(!!window.__LISTSYNC_EXTENSION__), 2500)
    }
  }, [])

  // Extension detection: bridge sets window.__LISTSYNC_EXTENSION__ = true
  const hasExtension = () => {
    if (typeof window === 'undefined') return false
    return !!window.__LISTSYNC_EXTENSION__
  }

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const needsRelist = (l) => {
    if (l.status !== 'aktiv') return false
    const created  = new Date(l.relistedAt || l.createdAt)
    const diffDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= relistDays
  }

  const openRelistModal = (id) => {
    const listing = listings.find(l => l.id === id)
    setSelPlatforms(listing?.platforms || [])
    setModal({ type: 'relist', id })
  }

  const doRelist = async (id) => {
    const listing = listings.find(l => l.id === id)
    const res     = await fetch(`/api/listings/${id}/relist`, { method: 'POST' })
    const updated = await res.json()
    setListings(ls => ls.map(l => l.id === id ? { ...l, days: 0, relistedAt: updated.relistedAt, status: 'aktiv' } : l))
    const extPlatforms = selPlatforms.filter(p => p === 'vinted' || p === 'kleinanzeigen' || p === 'ebay')
    setModal(null)
    if (extPlatforms.length > 0 && listing) {
      if (hasExtension()) {
        window.postMessage({ type: 'LISTSYNC_POST', listing, platforms: extPlatforms }, '*')
        showToast(`Relisten auf ${extPlatforms.join(' & ')}…`)
      } else {
        setMobileHelper({ listing, platforms: extPlatforms })
      }
    } else {
      showToast('Erneut gelistet – Timer zurückgesetzt')
    }
  }

  const markSold = async (id) => {
    await fetch(`/api/listings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'verkauft' }) })
    setListings(ls => ls.map(l => l.id === id ? { ...l, status: 'verkauft' } : l))
    showToast('Als verkauft markiert')
    setModal(null)
  }

  const doPost = async (id) => {
    const listing = listings.find(l => l.id === id)
    await fetch(`/api/listings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platforms: selPlatforms }) })
    setListings(ls => ls.map(l => l.id === id ? { ...l, platforms: selPlatforms } : l))
    const extPlatforms = selPlatforms.filter(p => p === 'vinted' || p === 'kleinanzeigen' || p === 'ebay')
    setModal(null)
    if (extPlatforms.length > 0 && listing) {
      if (hasExtension()) {
        window.postMessage({ type: 'LISTSYNC_POST', listing, platforms: extPlatforms }, '*')
        showToast(`Öffne ${extPlatforms.join(' & ')}…`)
      } else {
        setMobileHelper({ listing, platforms: extPlatforms })
      }
    } else {
      showToast(`Auf ${selPlatforms.length} Plattform${selPlatforms.length > 1 ? 'en' : ''} gepostet`)
    }
  }

  const relistAlerts = listings.filter(needsRelist)
  const tabs = [
    { id: 'alle',     label: 'Alle',     count: listings.length },
    { id: 'aktiv',    label: 'Aktiv',    count: listings.filter(l => l.status === 'aktiv').length },
    { id: 'verkauft', label: 'Verkauft', count: listings.filter(l => l.status === 'verkauft').length },
    { id: 'inaktiv',  label: 'Inaktiv',  count: listings.filter(l => l.status === 'inaktiv').length },
  ]
  const visible = listings.filter(l =>
    (filter === 'alle' || l.status === filter) &&
    (!search || l.title.toLowerCase().includes(search.toLowerCase()))
  )
  const modalListing = modal ? listings.find(l => l.id === modal.id) : null

  // ── Inline card styles ────────────────────────────────────────────────────

  const cardStyle = (aged) => ({
    background: 'var(--surface)',
    border: `1px solid ${aged ? '#fcd34d' : 'var(--border)'}`,
    borderRadius: 18,
    padding: '16px',
    boxShadow: aged
      ? '0 1px 3px rgba(245,158,11,.08), 0 6px 20px rgba(245,158,11,.06)'
      : '0 1px 3px rgba(15,23,42,.04), 0 6px 20px rgba(15,23,42,.05)',
    transition: 'border-color .15s, box-shadow .15s',
  })

  const actionBtn = (bg, color, border = 'transparent') => ({
    flex: 1, padding: '10px 8px', borderRadius: 11, fontSize: 13, fontWeight: 700,
    border: `1px solid ${border}`, background: bg, color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'opacity .12s', fontFamily: 'inherit',
  })

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const ModalWrap = ({ children }) => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '16px', background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
    }}
      className="md:items-center"
      onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 480,
        padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {children}
      </div>
    </div>
  )

  const ModalHeader = ({ title }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h2 style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
      <button onClick={() => setModal(null)}
        style={{
          width: 32, height: 32, borderRadius: 10, background: 'var(--modal-close)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-2)',
        }}>{ICONS.close}</button>
    </div>
  )

  const ListingPreview = ({ l }) => (
    <div style={{ background: 'var(--row-hover)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
      {Array.isArray(l.images) && l.images[0]
        ? <img src={l.images[0]} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
        : <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: CARD_COLORS[l.id % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#475569' }}>{l.title.charAt(0)}</div>
      }
      <div>
        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', margin: '0 0 3px' }}>{l.title}</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0 }}>{l.condition} · {fmt(l.price)}</p>
      </div>
    </div>
  )

  const PlatformPicker = ({ l }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
      {Object.entries(PLATFORMS).map(([id, p]) => {
        const sel = selPlatforms.includes(id)
        return (
          <div key={id}
            onClick={() => setSelPlatforms(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])}
            style={{
              border: `2px solid ${sel ? '#818cf8' : 'var(--border)'}`,
              borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
              background: sel ? 'rgba(99,102,241,0.07)' : 'var(--surface)',
              display: 'flex', alignItems: 'center', gap: 12, transition: 'all .15s',
            }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${sel ? '#6366f1' : 'var(--border)'}`,
              background: sel ? '#6366f1' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <PlatformBadge plt={id} />
            {l?.platforms?.includes(id) && (
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', background: 'var(--modal-close)', padding: '2px 8px', borderRadius: 8 }}>aktiv</span>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="ls-page">
      <Sidebar activeCount={listings.filter(l => l.status === 'aktiv').length} />
      <main className="md:ml-60 ls-page-content">
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }} className="ls-content">

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>Meine Listings</h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: '3px 0 0', fontWeight: 500 }}>{visible.length} Artikel</p>
            </div>
            {/* Extension status indicator */}
            {extStatus === true && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Extension aktiv</span>
              </div>
            )}
            {extStatus === false && (
              <a href="https://chrome.google.com/webstore" target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', textDecoration: 'none' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }} className="hidden md:inline">Extension installieren</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }} className="md:hidden">Kein Extension</span>
              </a>
            )}
          </div>

          {/* ── Relist Alerts ── */}
          {relistAlerts.length > 0 && (
            <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 18, padding: '14px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--warn-title)', margin: '0 0 10px' }}>
                {relistAlerts.length} Artikel sollten erneut gelistet werden
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {relistAlerts.map(l => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', borderRadius: 11, padding: '9px 12px', border: '1px solid var(--warn-border)' }}>
                    <span style={{ fontSize: 13.5, color: 'var(--text-1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 12 }}>{l.title}</span>
                    <button onClick={() => openRelistModal(l.id)}
                      style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(245,158,11,0.3)', fontFamily: 'inherit' }}>
                      Relisten
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Search ── */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex' }}>{ICONS.search}</span>
            <input type="text" placeholder="Listings durchsuchen…" value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 14, fontSize: 14,
                color: 'var(--text-1)', boxShadow: '0 1px 4px rgba(15,23,42,.04)',
              }} />
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: 'var(--tab-bg)' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                style={{
                  flex: 1, padding: '9px 6px', borderRadius: 11, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, transition: 'all .15s', fontFamily: 'inherit',
                  background: filter === t.id ? 'var(--tab-active)' : 'transparent',
                  color: filter === t.id ? 'var(--text-1)' : 'var(--text-2)',
                  boxShadow: filter === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                {t.label} <span style={{ color: filter === t.id ? '#6366f1' : 'var(--text-3)' }}>({t.count})</span>
              </button>
            ))}
          </div>

          {/* ── Listing cards ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div className="ls-skeleton" style={{ width: 58, height: 58, borderRadius: 13, flexShrink: 0 }}/>
                    <div style={{ flex: 1 }}>
                      <div className="ls-skeleton" style={{ height: 16, width: '65%', marginBottom: 8 }}/>
                      <div className="ls-skeleton" style={{ height: 12, width: '45%', marginBottom: 8 }}/>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <div className="ls-skeleton" style={{ height: 20, width: 52, borderRadius: 10 }}/>
                        <div className="ls-skeleton" style={{ height: 20, width: 60, borderRadius: 10 }}/>
                      </div>
                    </div>
                    <div className="ls-skeleton" style={{ height: 18, width: 42, flexShrink: 0 }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--modal-close)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.75" strokeLinecap="round"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/></svg>
              </div>
              <p style={{ fontWeight: 700, color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Keine Listings gefunden</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visible.map(l => {
                const imgs = Array.isArray(l.images) ? l.images : []
                const aged = needsRelist(l)
                return (
                  <div key={l.id} style={cardStyle(aged)}>
                    {/* Main row */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {imgs.length > 0
                        ? <img src={imgs[0]} alt="" style={{ width: 58, height: 58, borderRadius: 13, objectFit: 'cover', flexShrink: 0, background: 'var(--border)' }}/>
                        : <div style={{
                            width: 58, height: 58, borderRadius: 13, flexShrink: 0,
                            background: CARD_COLORS[l.id % 5],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 22, color: 'var(--text-1)',
                          }}>{l.title.charAt(0)}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14, margin: 0, lineHeight: 1.3 }}>{l.title}</p>
                          <p style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: 15, flexShrink: 0, margin: 0 }}>{fmt(l.price)}</p>
                        </div>
                        <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '4px 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5 }}>
                          <StatusBadge status={l.status} />
                          {aged && (
                            <span style={{ fontSize: 11.5, background: 'var(--warn-bg)', color: 'var(--warn-text)', padding: '2px 8px', borderRadius: 8, fontWeight: 700, border: '1px solid var(--warn-border)' }}>
                              Relist
                            </span>
                          )}
                          {l.platforms.map(p => <PlatformBadge key={p} plt={p} />)}
                          <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>{l.views} Views</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {l.status === 'aktiv' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--divider)' }}>
                        <button onClick={() => openRelistModal(l.id)}
                          style={actionBtn(aged ? 'var(--warn-bg)' : 'var(--row-hover)', aged ? '#d97706' : 'var(--text-2)', aged ? 'var(--warn-border)' : 'var(--border)')}>
                          {ICONS.relist} Relisten
                        </button>
                        <button onClick={() => { setSelPlatforms([...l.platforms]); setModal({ type: 'crosspost', id: l.id }) }}
                          style={actionBtn('rgba(99,102,241,0.07)', '#4f46e5', 'rgba(99,102,241,0.15)')}>
                          {ICONS.crosspost} Crossposten
                        </button>
                        <button onClick={() => setModal({ type: 'sold', id: l.id })}
                          style={actionBtn('rgba(16,185,129,0.07)', '#059669', 'rgba(16,185,129,0.15)')}>
                          {ICONS.check} Verkauft
                        </button>
                      </div>
                    )}

                    {l.status === 'inaktiv' && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--divider)' }}>
                        <button onClick={() => openRelistModal(l.id)}
                          style={{ ...actionBtn('rgba(99,102,241,0.07)', '#4f46e5', 'rgba(99,102,241,0.15)'), flex: 'unset', width: '100%' }}>
                          {ICONS.relist} Relisten
                        </button>
                      </div>
                    )}

                    {l.status === 'verkauft' && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--divider)' }}>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                          <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>Einkauf: {fmt(l.buyPrice)}</p>
                          <p style={{ fontSize: 12.5, color: '#10b981', fontWeight: 700, margin: 0 }}>Gewinn: +{fmt(profit(l))}</p>
                        </div>
                        <button onClick={() => openRelistModal(l.id)}
                          style={{ ...actionBtn('rgba(99,102,241,0.07)', '#4f46e5', 'rgba(99,102,241,0.15)'), flex: 'unset', width: '100%' }}>
                          {ICONS.relist} Erneut verkaufen
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <MobileNav />

      {/* ── Relist Modal ── */}
      {modal?.type === 'relist' && modalListing && (
        <ModalWrap>
          <ModalHeader title="Erneut listen" />
          <ListingPreview l={modalListing} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Auf welchen Plattformen?</p>
          <PlatformPicker l={modalListing} />
          <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
            <p style={{ fontSize: 12.5, color: 'var(--warn-text)', margin: 0 }}>Timer wird zurückgesetzt – nächste Erinnerung in <strong>{relistDays} Tagen</strong></p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setModal(null)}
              style={{ flex: 1, padding: '13px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'inherit' }}>
              Abbrechen
            </button>
            <button onClick={() => doRelist(modalListing.id)} disabled={selPlatforms.length === 0}
              className="ls-btn-primary"
              style={{ flex: 1, padding: '12px', borderRadius: 13, fontSize: 14 }}>
              {selPlatforms.length > 0 ? `Auf ${selPlatforms.length} Plattform${selPlatforms.length > 1 ? 'en' : ''} listen` : 'Plattform wählen'}
            </button>
          </div>
        </ModalWrap>
      )}

      {/* ── Crosspost Modal ── */}
      {modal?.type === 'crosspost' && modalListing && (
        <ModalWrap>
          <ModalHeader title="Crossposten" />
          <ListingPreview l={modalListing} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Plattformen auswählen</p>
          <div style={{ marginBottom: 18 }}>
            {Object.entries(PLATFORMS).map(([id, p]) => {
              const sel = selPlatforms.includes(id)
              return (
                <div key={id} style={{ marginBottom: 8 }}>
                  <div onClick={() => setSelPlatforms(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])}
                    style={{
                      border: `2px solid ${sel ? '#818cf8' : 'var(--border)'}`, borderRadius: 14, padding: '12px 14px',
                      cursor: 'pointer', background: sel ? 'rgba(99,102,241,0.07)' : 'var(--surface)',
                      display: 'flex', alignItems: 'center', gap: 12, transition: 'all .15s',
                    }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${sel ? '#6366f1' : 'var(--border)'}`,
                      background: sel ? '#6366f1' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <PlatformBadge plt={id} />
                  </div>
                  {sel && (
                    <div style={{ margin: '6px 0 0 2px', padding: '10px 14px', borderRadius: 12, background: 'var(--row-hover)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Optimierter Titel</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
                        {id === 'ebay' ? (modalListing.title + ' | Top Zustand ✅').substring(0, 80)
                          : id === 'vinted' ? modalListing.title.substring(0, 60)
                          : modalListing.title + ' (VHB)'}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <button onClick={() => doPost(modalListing.id)} disabled={selPlatforms.length === 0}
            className="ls-btn-primary"
            style={{ width: '100%', padding: '13px', borderRadius: 14, fontSize: 14 }}>
            {selPlatforms.length > 0 ? `Auf ${selPlatforms.length} Plattform${selPlatforms.length > 1 ? 'en' : ''} posten` : 'Plattform auswählen'}
          </button>
        </ModalWrap>
      )}

      {/* ── Sold Modal ── */}
      {modal?.type === 'sold' && modalListing && (
        <ModalWrap>
          <ModalHeader title="Als verkauft markieren" />
          <ListingPreview l={modalListing} />
          <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#059669', margin: '0 0 6px' }}>Erwarteter Gewinn: +{fmt(profit(modalListing))}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{modalListing.platforms.map(p => <PlatformBadge key={p} plt={p} />)}</div>
          </div>
          <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
            <p style={{ fontSize: 12.5, color: 'var(--warn-text)', margin: 0, fontWeight: 600 }}>Wird auf allen Plattformen als inaktiv markiert</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setModal(null)}
              style={{ flex: 1, padding: '13px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'inherit' }}>
              Abbrechen
            </button>
            <button onClick={() => markSold(modalListing.id)}
              style={{
                flex: 1, padding: '12px', borderRadius: 13, fontSize: 14, fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              }}>
              Bestätigen
            </button>
          </div>
        </ModalWrap>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, padding: '12px 22px', borderRadius: 14, color: '#fff',
          fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap',
          background: toast.type === 'success' ? '#0f172a' : '#ef4444',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        }}
          className="md:bottom-8">
          {toast.msg}
        </div>
      )}

      {/* ── Mobile Post Helper (no extension) ── */}
      {mobileHelper && (
        <MobilePostHelper
          listing={mobileHelper.listing}
          platforms={mobileHelper.platforms}
          onClose={() => setMobileHelper(null)}
        />
      )}
    </div>
  )
}
