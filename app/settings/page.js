'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PLATFORMS } from '@/components/Badge'

function Ic({ children, size = 16, sw = 1.8 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}

// ── Styled section card ───────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{title}</h2>
      {children}
    </div>
  )
}

// ── Labeled input ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 12,
  background: 'var(--input-bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit',
  boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
}

const PLAN_LABELS = {
  free:     { label: 'Free',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  pro:      { label: 'Pro',      color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  lifetime: { label: 'Lifetime', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
}

export default function Settings() {
  const [goals, setGoals]           = useState({ day: 0, month: 0 })
  const [relistDays, setRelistDays] = useState(5)
  const [business, setBusiness]     = useState({ shopName:'', address:'', taxId:'', kleinunternehmer:true })
  const [platforms, setPlatforms]   = useState({})
  const [modal, setModal]           = useState(null)
  const [creds, setCreds]           = useState({ apiKey: '', username: '', password: '' })
  const [toast, setToast]           = useState(null)
  const [saving, setSaving]         = useState(false)
  const [plan, setPlan]             = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetch('/api/settings').then(r=>r.json()).then(s=>{
      if (s.dayGoal !== undefined) setGoals({ day: s.dayGoal, month: s.monthGoal })
      if (s.relistDays !== undefined) setRelistDays(s.relistDays)
      setBusiness({ shopName: s.shopName||'', address: s.address||'', taxId: s.taxId||'', kleinunternehmer: s.kleinunternehmer !== false })
    })
    fetch('/api/platforms').then(r=>r.json()).then(list=>{
      const map = {}
      list.forEach(p => { map[p.platform] = p })
      setPlatforms(map)
    })
    fetch('/api/subscription').then(r=>r.json()).then(d => setPlan(d.plan || 'free')).catch(()=>setPlan('free'))
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayGoal: goals.day, monthGoal: goals.month, relistDays, ...business })
      })
      showToast('✅ Einstellungen gespeichert!')
    } catch { showToast('Fehler beim Speichern', 'error') }
    finally { setSaving(false) }
  }

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.error || 'Fehler', 'error')
    } catch { showToast('Verbindungsfehler', 'error') }
    finally { setPortalLoading(false) }
  }

  const openModal = (id) => {
    const existing = platforms[id] || {}
    setCreds({ apiKey: existing.apiKey || '', username: existing.username || '', password: '' })
    setModal({ id, name: PLATFORMS[id].name, type: id === 'ebay' ? 'api' : 'login' })
  }

  const connectPlatform = async () => {
    if (!modal) return
    const { id, type } = modal
    const body = { platform: id, connected: true }
    if (type === 'api')   body.apiKey   = creds.apiKey
    if (type === 'login') body.username = creds.username
    try {
      const res = await fetch('/api/platforms', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const updated = await res.json()
      setPlatforms(prev => ({ ...prev, [id]: updated }))
      setModal(null)
      showToast(`✅ ${PLATFORMS[id].name} verbunden!`)
    } catch { showToast('Fehler beim Verbinden', 'error') }
  }

  const disconnectPlatform = async (id) => {
    try {
      await fetch('/api/platforms', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: id, connected: false })
      })
      setPlatforms(prev => ({ ...prev, [id]: { ...prev[id], connected: false } }))
      showToast(`${PLATFORMS[id].name} getrennt`)
    } catch { showToast('Fehler', 'error') }
  }

  return (
    <div className="ls-page">
      <Sidebar />
      <main className="md:ml-60 ls-page-content">
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }} className="ls-content">

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>Einstellungen</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '3px 0 0', fontWeight: 500 }}>App-Konfiguration und Geschäftsinfos</p>
          </div>

          {/* ── Plan ── */}
          {plan !== null && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 20px 22px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 16px' }}>Dein Plan</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
                  background: PLAN_LABELS[plan]?.bg,
                  color: PLAN_LABELS[plan]?.color,
                }}>
                  {PLAN_LABELS[plan]?.label || plan}
                </span>
                {plan === 'free' && (
                  <button onClick={() => router.push('/pricing')} style={{
                    padding: '8px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    Auf Pro upgraden
                  </button>
                )}
                {plan === 'pro' && (
                  <button onClick={openPortal} disabled={portalLoading} style={{
                    padding: '8px 18px', borderRadius: 12, border: '1px solid var(--border)',
                    cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-1)',
                    fontSize: 13, fontWeight: 600,
                  }}>
                    {portalLoading ? 'Laden…' : 'Abo verwalten'}
                  </button>
                )}
                {plan === 'lifetime' && (
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Lifetime — kein Abo nötig</span>
                )}
              </div>
              {plan === 'free' && (
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '12px 0 0' }}>
                  Free Plan: max. 5 Listings, 1 Plattform pro Crosspost.
                </p>
              )}
            </div>
          )}

          {/* ── Business info ── */}
          <Section title="🏪 Geschäftsinfo">
            <Field label="Name / Shopname">
              <input type="text" value={business.shopName}
                onChange={e => setBusiness(b => ({ ...b, shopName: e.target.value }))}
                placeholder="Dein Name oder Shopname"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#818cf8'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
              />
            </Field>
            <Field label="Adresse">
              <textarea rows={3} value={business.address}
                onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))}
                placeholder={"Musterstraße 1\n12345 Musterstadt"}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => { e.target.style.borderColor='#818cf8'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
              />
            </Field>
            <Field label="Steuernummer (optional)">
              <input type="text" value={business.taxId}
                onChange={e => setBusiness(b => ({ ...b, taxId: e.target.value }))}
                placeholder="12/345/67890"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#818cf8'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
              />
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `2px solid ${business.kleinunternehmer ? '#6366f1' : 'var(--border)'}`,
                background: business.kleinunternehmer ? '#6366f1' : 'var(--input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s', cursor: 'pointer',
              }}
                onClick={() => setBusiness(b => ({ ...b, kleinunternehmer: !b.kleinunternehmer }))}>
                {business.kleinunternehmer && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              <span style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 500, lineHeight: 1.4 }}>
                Kleinunternehmer nach §19 UStG <span style={{ color: 'var(--text-3)', fontSize: 12 }}>(keine Umsatzsteuer)</span>
              </span>
            </label>
          </Section>

          {/* ── Goals ── */}
          <Section title="🎯 Umsatzziele">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Tagesziel (€)">
                <input type="number" min="0" value={goals.day}
                  onChange={e => setGoals(g => ({ ...g, day: Number(e.target.value) }))}
                  style={{ ...inputStyle, textAlign: 'center', fontWeight: 700 }}
                  onFocus={e => { e.target.style.borderColor='#818cf8'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
                />
              </Field>
              <Field label="Monatsziel (€)">
                <input type="number" min="0" value={goals.month}
                  onChange={e => setGoals(g => ({ ...g, month: Number(e.target.value) }))}
                  style={{ ...inputStyle, textAlign: 'center', fontWeight: 700 }}
                  onFocus={e => { e.target.style.borderColor='#818cf8'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
                />
              </Field>
            </div>
          </Section>

          {/* ── Relist ── */}
          <Section title="🔄 Relisting-Erinnerung">
            <Field label="Erinnere mich nach">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="number" min="1" max="60" value={relistDays}
                  onChange={e => setRelistDays(Number(e.target.value))}
                  style={{ ...inputStyle, width: 80, textAlign: 'center', fontWeight: 700 }}
                  onFocus={e => { e.target.style.borderColor='#818cf8'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
                />
                <span style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 500 }}>Tagen ohne Verkauf</span>
              </div>
            </Field>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[3,5,7,14].map(d => (
                <button key={d} onClick={() => setRelistDays(d)}
                  style={{
                    padding: '8px 16px', borderRadius: 11, fontSize: 13, fontWeight: 700,
                    border: `1.5px solid ${relistDays === d ? '#6366f1' : 'var(--border)'}`,
                    background: relistDays === d ? 'rgba(99,102,241,0.08)' : 'var(--surface)',
                    color: relistDays === d ? '#6366f1' : 'var(--text-2)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                  }}>
                  {d} Tage
                </button>
              ))}
            </div>
          </Section>

          {/* ── Platform accounts ── */}
          <Section title="Plattform-Konten">
            {Object.entries(PLATFORMS).map(([id, p]) => {
              const acc = platforms[id] || {}
              const connected = acc.connected
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.dot, display: 'inline-block', flexShrink: 0 }}/>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{p.name}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 7,
                      background: id === 'ebay' ? 'rgba(99,102,241,0.1)' : 'rgba(59,130,246,0.1)',
                      color: id === 'ebay' ? '#6366f1' : '#3b82f6',
                    }}>{id === 'ebay' ? 'API' : 'Login'}</span>
                    {connected && (
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                        ● {acc.username ? acc.username : 'Verbunden'}
                      </span>
                    )}
                  </div>
                  {connected
                    ? <button onClick={() => disconnectPlatform(id)}
                        style={{ fontSize: 12.5, padding: '6px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        Trennen
                      </button>
                    : <button onClick={() => openModal(id)}
                        style={{ fontSize: 12.5, padding: '6px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.07)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        Verbinden
                      </button>
                  }
                </div>
              )
            })}
          </Section>

          {/* ── Plan ── */}
          <Section title="Plan">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 500 }}>Aktueller Plan</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>Freemium</span>
            </div>
            <button style={{
              width: '100%', padding: '13px', borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}>
              ✨ Auf Pro upgraden – ab 9€/Monat
            </button>
          </Section>

          {/* ── Save button ── */}
          <button onClick={saveSettings} disabled={saving}
            className="ls-btn-primary"
            style={{ padding: '15px', borderRadius: 16, fontSize: 15, width: '100%', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Speichern…' : 'Einstellungen speichern'}
          </button>

        </div>
      </main>
      <MobileNav />

      {/* ── Connect Modal ── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, padding: '16px',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
        }}
          className="md:items-center"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 420,
            padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>{modal.name} verbinden</h3>
              <button onClick={() => setModal(null)}
                style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--modal-close)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {modal.type === 'api' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>eBay API-Schlüssel</label>
                <input value={creds.apiKey} onChange={e => setCreds(c => ({ ...c, apiKey: e.target.value }))}
                  placeholder="App ID / Production Key"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='#818cf8'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Erhältlich unter developer.ebay.com → My Account → Application Keys</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>Benutzername / E-Mail</label>
                  <input value={creds.username} onChange={e => setCreds(c => ({ ...c, username: e.target.value }))}
                    placeholder={`Dein ${modal.name}-Benutzername`}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor='#818cf8'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                    onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
                  />
                </div>
                <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12.5, color: 'var(--warn-text)', margin: 0, lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--warn-title)' }}>Hinweis:</strong> Das Posting auf {modal.name} läuft über die ListSync Chrome Extension. Dein Account wird nur zur Anzeige gespeichert.
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setModal(null)}
                style={{ flex: 1, padding: '13px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 700, fontSize: 14, color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'inherit' }}>
                Abbrechen
              </button>
              <button onClick={connectPlatform}
                disabled={modal.type === 'api' ? !creds.apiKey.trim() : !creds.username.trim()}
                className="ls-btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: 13, fontSize: 14 }}>
                Verbinden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, padding: '12px 22px', borderRadius: 14, color: '#fff',
          fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap',
          background: toast.type === 'error' ? '#ef4444' : '#0f172a',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        }}
          className="md:bottom-8">
          {toast.msg}
        </div>
      )}
    </div>
  )
}
