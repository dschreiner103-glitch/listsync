'use client'
import { useState, useCallback } from 'react'

// ── Platform configs ──────────────────────────────────────────────────────────
const PLATFORM_CONFIG = {
  vinted: {
    name: 'Vinted',
    dot: '#0d9488',
    url: 'https://www.vinted.de/items/new',
    urlLabel: 'Auf Vinted öffnen',
    fields: (l) => [
      { label: 'Titel',        value: (l.title || '').substring(0, 60),                   hint: 'max. 60 Zeichen' },
      { label: 'Beschreibung', value: l.description || '',                                 hint: null },
      { label: 'Preis (€)',    value: String(l.price || ''),                               hint: null },
      { label: 'Zustand',      value: l.condition || '',                                   hint: null },
      { label: 'Marke',        value: l.brand || '',                                       hint: null },
      { label: 'Größe',        value: l.size || '',                                        hint: null },
      { label: 'Farbe',        value: l.color || '',                                       hint: null },
      { label: 'Material',     value: l.material || '',                                    hint: null },
    ].filter(f => f.value),
  },
  kleinanzeigen: {
    name: 'Kleinanzeigen',
    dot: '#ea580c',
    url: 'https://www.kleinanzeigen.de/anzeige/aufgeben',
    urlLabel: 'Auf Kleinanzeigen öffnen',
    fields: (l) => [
      { label: 'Titel',        value: ((l.title || '').substring(0, 65) + ' (VHB)').substring(0, 70), hint: 'max. 70 Zeichen' },
      { label: 'Beschreibung', value: (l.description || '') + (l.description ? '\n\nVersand möglich.' : 'Versand möglich.'), hint: null },
      { label: 'Preis (€)',    value: String(l.price || ''),                                          hint: null },
      { label: 'Zustand',      value: l.condition || '',                                              hint: null },
    ].filter(f => f.value),
  },
  ebay: {
    name: 'eBay',
    dot: '#ca8a04',
    url: 'https://www.ebay.de/sl/list',
    urlLabel: 'Auf eBay öffnen',
    fields: (l) => [
      { label: 'Titel',         value: ((l.title || '') + ' | Top Zustand ✅').substring(0, 80), hint: 'max. 80 Zeichen' },
      { label: 'Beschreibung',  value: l.description || '',                                      hint: null },
      { label: 'Preis (€)',     value: String(l.price || ''),                                    hint: null },
      { label: 'Zustand',       value: l.condition || '',                                        hint: null },
      { label: 'Marke',         value: l.brand || '',                                            hint: null },
      { label: 'Größe',         value: l.size || '',                                             hint: null },
      { label: 'Farbe',         value: l.color || '',                                            hint: null },
      { label: 'Material',      value: l.material || '',                                         hint: null },
      { label: 'Stil',          value: l.stil || '',                                             hint: null },
      { label: 'Beinform',      value: l.beinform || '',                                         hint: null },
      { label: 'Taillenumfang', value: l.taillenumfang || '',                                    hint: null },
    ].filter(f => f.value),
  },
}

// ── CopyField ─────────────────────────────────────────────────────────────────
function CopyField({ label, value, hint }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'; ta.style.top = '-9999px'
      document.body.appendChild(ta); ta.focus(); ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  return (
    <div style={{
      background: 'var(--row-hover)',
      border: copied ? '1.5px solid #22c55e' : '1.5px solid var(--border)',
      borderRadius: 14, padding: '12px 14px',
      transition: 'border-color .2s, background .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
          {hint && <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontStyle: 'italic' }}>{hint}</span>}
        </div>
        <button onClick={copy} style={{
          padding: '5px 11px', borderRadius: 9, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
          background: copied ? '#dcfce7' : 'var(--surface)',
          color: copied ? '#16a34a' : 'var(--text-2)',
          transition: 'all .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        }}>
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
      </div>
      <p style={{
        fontSize: 13.5, color: 'var(--text-1)', margin: 0,
        whiteSpace: 'pre-wrap', lineHeight: 1.45,
        maxHeight: 72, overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
      }}>{value}</p>
    </div>
  )
}

// ── MobilePostHelper ──────────────────────────────────────────────────────────
export default function MobilePostHelper({ listing, platforms, onClose }) {
  const [activePlatform, setActivePlatform] = useState(platforms[0] || 'vinted')
  const [allCopied, setAllCopied] = useState({})

  if (!listing || !platforms.length) return null

  const cfg = PLATFORM_CONFIG[activePlatform]
  if (!cfg) return null

  const fields = cfg.fields(listing)

  const copyAll = async () => {
    const allText = fields.map(f => `${f.label}:\n${f.value}`).join('\n\n')
    try {
      await navigator.clipboard.writeText(allText)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = allText
      ta.style.position = 'fixed'; ta.style.top = '-9999px'
      document.body.appendChild(ta); ta.focus(); ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setAllCopied(p => ({ ...p, [activePlatform]: true }))
    setTimeout(() => setAllCopied(p => ({ ...p, [activePlatform]: false })), 2500)
  }

  const openPlatform = () => {
    window.open(cfg.url, '_blank')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 520,
        padding: '0 0 env(safe-area-inset-bottom,0)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }}/>
        </div>

        {/* Header */}
        <div style={{ padding: '8px 20px 12px', borderBottom: '1px solid var(--divider)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>
                📋 Felder kopieren
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '3px 0 0' }}>
                Kein Extension erkannt · Kopiere die Felder manuell
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 10, background: 'var(--modal-close)',
              border: 'none', cursor: 'pointer', color: 'var(--text-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Platform tabs */}
          {platforms.length > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {platforms.map(plt => {
                const c = PLATFORM_CONFIG[plt]
                if (!c) return null
                const active = plt === activePlatform
                return (
                  <button key={plt} onClick={() => setActivePlatform(plt)}
                    style={{
                      padding: '6px 13px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                      background: active ? c.dot : 'var(--tab-bg)',
                      color: active ? '#fff' : 'var(--text-2)',
                      transition: 'all .15s',
                    }}>
                    {c.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Listing preview */}
        <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {Array.isArray(listing.images) && listing.images[0]
              ? <img src={listing.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}/>
              : <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--border)', flexShrink: 0 }}/>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{(listing.price || 0).toFixed(2).replace('.', ',')} € · {listing.condition}</p>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }}/>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)' }}>{cfg.name}</span>
            </div>
          </div>
        </div>

        {/* Fields (scrollable) */}
        <div style={{ padding: '12px 20px 16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fields.map((f, i) => (
            <CopyField key={`${activePlatform}-${i}`} label={f.label} value={f.value} hint={f.hint} />
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyAll} style={{
              flex: 1, padding: '13px', borderRadius: 14, border: '1px solid var(--border)',
              background: allCopied[activePlatform] ? '#dcfce7' : 'var(--surface)',
              color: allCopied[activePlatform] ? '#16a34a' : 'var(--text-1)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .2s',
            }}>
              {allCopied[activePlatform] ? '✓ Kopiert' : '📋 Alles kopieren'}
            </button>
            <button onClick={openPlatform} style={{
              flex: 1, padding: '13px', borderRadius: 14, border: 'none',
              background: cfg.dot, color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 4px 12px ${cfg.dot}44`,
            }}>
              {cfg.urlLabel} →
            </button>
          </div>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={async () => {
              const allText = fields.map(f => `${f.label}: ${f.value}`).join('\n')
              try { await navigator.share({ title: listing.title, text: allText }) } catch {}
            }} style={{
              width: '100%', padding: '12px', borderRadius: 14,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-2)', fontWeight: 600, fontSize: 13.5,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              Als Text teilen (WhatsApp, Notizen…)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
