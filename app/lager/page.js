'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

const STATUS_COLOR = { aktiv: '#10b981', verkauft: '#6366f1', entwurf: '#f59e0b', inaktiv: '#6b7280' }
const STATUS_LABEL = { aktiv: 'Aktiv', verkauft: 'Verkauft', entwurf: 'Entwurf', inaktiv: 'Inaktiv' }

function QRModal({ platz, onClose }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(platz)}&bgcolor=ffffff&color=111827&margin=10`
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--surface)', borderRadius:24, padding:32, maxWidth:340, width:'100%', textAlign:'center', boxShadow:'0 24px 60px rgba(0,0,0,0.3)' }}>
        <p style={{ fontSize:18, fontWeight:800, color:'var(--text-1)', margin:'0 0 4px' }}>QR-Code</p>
        <p style={{ fontSize:13, color:'var(--text-3)', margin:'0 0 20px' }}>{platz}</p>
        <img src={qrUrl} alt={platz} style={{ width:220, height:220, borderRadius:12, border:'1px solid var(--border)' }}/>
        <p style={{ fontSize:12, color:'var(--text-3)', margin:'16px 0 20px' }}>Ausdrucken und an der Box befestigen</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>window.open(qrUrl,'_blank')}
            style={{ flex:1, padding:'11px', borderRadius:12, border:'1px solid var(--border)', background:'var(--modal-close)', color:'var(--text-1)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            🖨️ Drucken
          </button>
          <button onClick={onClose}
            style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:'#6366f1', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LagerPage() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null) // selected lagerplatz key
  const [qrPlatz, setQrPlatz]   = useState(null)
  const [editing, setEditing]   = useState(null) // { id, value }
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    fetch('/api/lager').then(r => r.json()).then(d => {
      const data = Array.isArray(d) ? d : []
      setListings(data)
      setLoading(false)
    })
  }, [])

  const saveLagerplatz = async (id, value) => {
    await fetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lagerplatz: value }),
    })
    setListings(prev => prev.map(l => l.id === id ? { ...l, lagerplatz: value } : l))
    setEditing(null)
  }

  // Build groups
  const groups = {}
  for (const l of listings) {
    const key = l.lagerplatz || '—'
    if (!groups[key]) groups[key] = []
    groups[key].push(l)
  }
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === '—') return 1
    if (b === '—') return -1
    return a.localeCompare(b)
  })

  // Auto-select first location
  useEffect(() => {
    if (!loading && sortedKeys.length > 0 && selected === null) {
      setSelected(sortedKeys[0])
    }
  }, [loading, sortedKeys.length])

  const activeItems = selected ? (groups[selected] || []) : []
  const totalItems  = listings.length
  const totalValue  = listings.reduce((s, l) => s + (Number(l.buyPrice) || 0), 0)
  const locations   = sortedKeys.filter(k => k !== '—').length

  return (
    <div className="ls-page" style={{ display:'flex' }}>
      <Sidebar/>
      <main className="md:ml-60" style={{ flex:1, display:'flex', height:'100vh', overflow:'hidden' }}>

        {/* ── Location Sidebar ── */}
        <div style={{
          width: 220, flexShrink:0,
          background:'var(--surface)',
          borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column',
        }} className="hidden md:flex">

          <div style={{ padding:'18px 16px 12px', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:11, fontWeight:800, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.09em', margin:'0 0 8px' }}>Lager</p>
            {/* Mini Stats */}
            <div style={{ display:'flex', gap:6 }}>
              {[
                { v: totalItems,  l: 'Artikel' },
                { v: locations,   l: 'Plätze' },
              ].map(s => (
                <div key={s.l} style={{ flex:1, background:'var(--bg)', borderRadius:10, padding:'7px 10px' }}>
                  <p style={{ fontSize:16, fontWeight:800, color:'var(--text-1)', margin:0, letterSpacing:'-0.02em' }}>{s.v}</p>
                  <p style={{ fontSize:10, color:'var(--text-3)', margin:0 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:'8px 8px', flex:1, overflowY:'auto' }}>
            <p style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', padding:'8px 8px 4px', margin:0 }}>Lagerplätze</p>

            {loading && <p style={{ fontSize:12, color:'var(--text-3)', padding:'8px 10px', margin:0 }}>Lädt…</p>}

            {sortedKeys.map(platz => {
              const active = selected === platz
              const isNone = platz === '—'
              const count  = groups[platz]?.length || 0
              return (
                <button key={platz} onClick={() => { setSelected(platz); setPanelOpen(false) }}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    width:'100%', padding:'7px 10px', borderRadius:8, marginBottom:2,
                    border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                    background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                    color: active ? '#6366f1' : isNone ? 'var(--text-3)' : 'var(--text-2)',
                    fontWeight: active ? 700 : 500, fontSize:13,
                    transition:'all .12s',
                  }}>
                  <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ fontSize:14 }}>{isNone ? '❓' : '📦'}</span>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:110 }}>{isNone ? 'Kein Platz' : platz}</span>
                  </span>
                  <span style={{
                    fontSize:10.5, fontWeight:700, padding:'1px 6px', borderRadius:10,
                    background: active ? 'rgba(99,102,241,0.2)' : 'var(--bg)',
                    color: active ? '#6366f1' : 'var(--text-3)',
                    flexShrink:0,
                  }}>{count}</span>
                </button>
              )
            })}

            {!loading && sortedKeys.length === 0 && (
              <p style={{ fontSize:12, color:'var(--text-3)', padding:'8px 10px', margin:0 }}>Noch keine Lagerplätze</p>
            )}
          </div>

          {/* Add new listing CTA */}
          <div style={{ padding:'12px', borderTop:'1px solid var(--border)' }}>
            <button onClick={() => router.push('/new')}
              style={{ width:'100%', padding:'9px', borderRadius:10, border:'none', background:'rgba(99,102,241,0.1)', color:'#6366f1', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'opacity .15s' }}>
              + Neues Listing
            </button>
          </div>
        </div>

        {/* ── Main Area ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

          {/* Header */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <button onClick={() => setPanelOpen(s => !s)} className="md:hidden"
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', fontSize:20, lineHeight:1, padding:0 }}>
              ☰
            </button>
            <span style={{ fontSize:20 }}>📦</span>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15, fontWeight:800, color:'var(--text-1)', margin:0 }}>{selected === '—' ? 'Kein Lagerplatz' : (selected || 'Lager')}</p>
              <p style={{ fontSize:12, color:'var(--text-3)', margin:0 }}>{activeItems.length} Artikel{totalValue > 0 ? ` · ${totalValue.toFixed(2).replace('.',',')} € Einkaufswert gesamt` : ''}</p>
            </div>
            {selected && selected !== '—' && (
              <button onClick={() => setQrPlatz(selected)}
                style={{ padding:'8px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--modal-close)', color:'var(--text-2)', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                QR-Code
              </button>
            )}
          </div>

          {/* Items */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
            {loading && <p style={{ color:'var(--text-3)', textAlign:'center', paddingTop:60 }}>Wird geladen…</p>}

            {!loading && !selected && (
              <div style={{ textAlign:'center', paddingTop:80 }}>
                <p style={{ fontSize:40, margin:'0 0 12px' }}>📦</p>
                <p style={{ fontSize:15, fontWeight:700, color:'var(--text-1)', margin:'0 0 6px' }}>Lagerplatz wählen</p>
                <p style={{ fontSize:13, color:'var(--text-3)', margin:0 }}>Wähle links einen Lagerplatz aus.</p>
              </div>
            )}

            {!loading && selected && activeItems.length === 0 && (
              <div style={{ textAlign:'center', paddingTop:80 }}>
                <p style={{ fontSize:40, margin:'0 0 12px' }}>📭</p>
                <p style={{ fontSize:15, fontWeight:700, color:'var(--text-1)', margin:'0 0 6px' }}>Leer</p>
                <p style={{ fontSize:13, color:'var(--text-3)', margin:0 }}>Keine Artikel an diesem Lagerplatz.</p>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {activeItems.map(item => {
                const img    = item.images?.[0]
                const isEdit = editing?.id === item.id
                return (
                  <div key={item.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                    {/* Thumbnail */}
                    <div style={{ width:56, height:56, borderRadius:12, overflow:'hidden', flexShrink:0, background:'var(--modal-close)', border:'1px solid var(--border)' }}>
                      {img
                        ? <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📷</div>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:14, fontWeight:700, color:'var(--text-1)', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, fontWeight:700, color: STATUS_COLOR[item.status] || '#6b7280', background:`${STATUS_COLOR[item.status]}18`, padding:'2px 8px', borderRadius:6 }}>
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                        {item.brand && <span style={{ fontSize:11, color:'var(--text-3)' }}>{item.brand}</span>}
                        {item.size  && <span style={{ fontSize:11, color:'var(--text-3)' }}>Gr. {item.size}</span>}
                        {Number(item.buyPrice) > 0 && <span style={{ fontSize:11, color:'var(--text-3)' }}>EK {Number(item.buyPrice).toFixed(2).replace('.',',')} €</span>}
                        {Number(item.price) > 0    && <span style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>{Number(item.price).toFixed(2).replace('.',',')} €</span>}
                      </div>
                    </div>

                    {/* Lagerplatz edit */}
                    <div style={{ flexShrink:0 }}>
                      {isEdit ? (
                        <div style={{ display:'flex', gap:6 }}>
                          <input autoFocus value={editing.value}
                            onChange={e => setEditing(v => ({ ...v, value: e.target.value }))}
                            onKeyDown={e => { if (e.key==='Enter') saveLagerplatz(item.id, editing.value); if (e.key==='Escape') setEditing(null) }}
                            style={{ padding:'6px 10px', border:'1px solid #6366f1', borderRadius:8, fontSize:12, background:'var(--surface)', color:'var(--text-1)', fontFamily:'inherit', width:110 }}/>
                          <button onClick={() => saveLagerplatz(item.id, editing.value)}
                            style={{ padding:'6px 10px', borderRadius:8, border:'none', background:'#6366f1', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>✓</button>
                          <button onClick={() => setEditing(null)}
                            style={{ padding:'6px 8px', borderRadius:8, border:'1px solid var(--border)', background:'var(--modal-close)', color:'var(--text-2)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditing({ id: item.id, value: item.lagerplatz || '' })}
                          style={{ padding:'6px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--modal-close)', color:'var(--text-2)', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                          ✏️ Verschieben
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
      <MobileNav/>
      {qrPlatz && <QRModal platz={qrPlatz} onClose={() => setQrPlatz(null)}/>}
    </div>
  )
}
