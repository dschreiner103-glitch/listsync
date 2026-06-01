'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

// ── Helpers ──────────────────────────────────────────────────────────
function parsePlatz(platz) {
  if (!platz) return { regal: null, box: null, fach: null }
  const parts = platz.split('/').map(s => s.trim())
  return { regal: parts[0]||null, box: parts[1]||null, fach: parts[2]||null }
}
function makePlatz(r, b, f) { return [r,b,f].filter(Boolean).join('/') }

function buildTree(listings) {
  const tree = {}
  for (const l of listings) {
    const { regal, box, fach } = parsePlatz(l.lagerplatz)
    const r = regal || '—'
    const b = box   || '—'
    const f = fach  || '—'
    if (!tree[r]) tree[r] = {}
    if (!tree[r][b]) tree[r][b] = {}
    if (!tree[r][b][f]) tree[r][b][f] = []
    tree[r][b][f].push(l)
  }
  return tree
}

const PALETTE = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6','#f97316']
function pickColor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

const STATUS_COLOR = { aktiv:'#10b981', verkauft:'#6366f1', entwurf:'#f59e0b', inaktiv:'#6b7280' }
const STATUS_LABEL = { aktiv:'Aktiv', verkauft:'Verkauft', entwurf:'Entwurf', inaktiv:'Inaktiv' }

// ── 3D Shelf Card ────────────────────────────────────────────────────
function ShelfCard({ name, count, itemCount, color, active, onClick }) {
  const [hov, setHov] = useState(false)
  const rgb = hexToRgb(color)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: 'pointer',
        width: 150,
        transition: 'transform .25s, box-shadow .25s',
        transform: active
          ? 'perspective(600px) rotateY(-8deg) rotateX(8deg) scale(1.06)'
          : hov
          ? 'perspective(600px) rotateY(-6deg) rotateX(6deg) scale(1.03)'
          : 'perspective(600px) rotateY(-4deg) rotateX(4deg)',
      }}>
      {/* Top face */}
      <div style={{
        background: `rgba(${rgb},.55)`,
        height: 18,
        borderRadius: '10px 10px 0 0',
        border: `1.5px solid rgba(${rgb},.7)`,
        borderBottom: 'none',
        backdropFilter: 'blur(4px)',
      }}/>
      {/* Front face */}
      <div style={{
        background: active
          ? `linear-gradient(145deg, rgba(${rgb},.22), rgba(${rgb},.14))`
          : `linear-gradient(145deg, rgba(${rgb},.15), rgba(${rgb},.08))`,
        border: `1.5px solid rgba(${rgb},.4)`,
        borderTop: `2px solid rgba(${rgb},.7)`,
        borderRadius: '0 0 14px 14px',
        padding: '18px 16px 16px',
        boxShadow: active
          ? `0 16px 40px rgba(${rgb},.35), inset 0 1px 0 rgba(255,255,255,.1)`
          : `0 8px 24px rgba(${rgb},.2), inset 0 1px 0 rgba(255,255,255,.08)`,
      }}>
        <div style={{ width:38,height:38,borderRadius:10,background:`rgba(${rgb},.2)`,border:`1.5px solid rgba(${rgb},.4)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:10 }}>📦</div>
        <p style={{ fontSize:14,fontWeight:800,color:'var(--text-1)',margin:'0 0 2px',letterSpacing:'-0.01em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{name}</p>
        <p style={{ fontSize:11,color:'var(--text-3)',margin:0 }}>{count} Box{count!==1?'en':''} · {itemCount} Artikel</p>
        {active && <div style={{ marginTop:10,height:2,borderRadius:2,background:`rgba(${rgb},.6)` }}/>}
      </div>
    </div>
  )
}

// ── Box Card ─────────────────────────────────────────────────────────
function BoxCard({ name, fachCount, itemCount, color, active, onClick }) {
  const [hov, setHov] = useState(false)
  const rgb = hexToRgb(color)
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        cursor:'pointer', width:130,
        transition:'transform .2s, box-shadow .2s',
        transform: active ? 'translateY(-6px) scale(1.04)' : hov ? 'translateY(-3px)' : 'none',
      }}>
      <div style={{
        background: active ? `rgba(${rgb},.18)` : hov ? `rgba(${rgb},.1)` : 'var(--surface)',
        border: `1.5px solid ${active ? `rgba(${rgb},.5)` : 'var(--border)'}`,
        borderRadius:14, padding:'14px 14px',
        boxShadow: active ? `0 12px 30px rgba(${rgb},.25)` : hov ? `0 6px 16px rgba(0,0,0,.1)` : 'none',
        transition:'all .2s',
      }}>
        {/* Mini drawer visual */}
        <div style={{ display:'flex',flexDirection:'column',gap:3,marginBottom:10 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              height:6,borderRadius:3,
              background: i < Math.min(fachCount,3) ? `rgba(${rgb},.5)` : 'var(--border)',
              transition:'background .2s',
            }}/>
          ))}
        </div>
        <p style={{ fontSize:13,fontWeight:700,color:'var(--text-1)',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{name}</p>
        <p style={{ fontSize:10.5,color:'var(--text-3)',margin:0 }}>{fachCount} Fach/Fächer · {itemCount} Stück</p>
      </div>
    </div>
  )
}

// ── Assign Modal ──────────────────────────────────────────────────────
function AssignModal({ listing, tree, onSave, onClose }) {
  const existing = parsePlatz(listing.lagerplatz)
  const [regal, setRegal] = useState(existing.regal || '')
  const [box,   setBox]   = useState(existing.box   || '')
  const [fach,  setFach]  = useState(existing.fach  || '')
  const [saving, setSaving] = useState(false)

  const regale = Object.keys(tree).filter(k => k !== '—').sort()
  const boxes  = regal && tree[regal] ? Object.keys(tree[regal]).filter(k=>k!=='—').sort() : []
  const faecher = regal && box && tree[regal]?.[box] ? Object.keys(tree[regal][box]).filter(k=>k!=='—').sort() : []

  const handleSave = async () => {
    setSaving(true)
    const platz = makePlatz(regal, box, fach)
    await fetch(`/api/listings/${listing.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ lagerplatz: platz }),
    })
    onSave(listing.id, platz)
    setSaving(false)
  }

  const inp = { padding:'9px 12px', border:'1px solid var(--border)', borderRadius:10, fontSize:13, background:'var(--surface)', color:'var(--text-1)', fontFamily:'inherit', width:'100%' }

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--surface)',borderRadius:24,padding:28,maxWidth:380,width:'100%',boxShadow:'0 24px 60px rgba(0,0,0,.3)' }}>
        <p style={{ fontSize:16,fontWeight:800,color:'var(--text-1)',margin:'0 0 4px' }}>📦 Lagerplatz zuweisen</p>
        <p style={{ fontSize:12,color:'var(--text-3)',margin:'0 0 20px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{listing.title}</p>
        <div style={{ display:'flex',flexDirection:'column',gap:12,marginBottom:20 }}>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:4 }}>Regal</label>
            <input value={regal} onChange={e=>{setRegal(e.target.value);setBox('');setFach('')}}
              list="regale-list" placeholder="z.B. Regal A" style={inp}/>
            <datalist id="regale-list">{regale.map(r=><option key={r} value={r}/>)}</datalist>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:4 }}>Box</label>
            <input value={box} onChange={e=>{setBox(e.target.value);setFach('')}}
              list="boxes-list" placeholder="z.B. Box 1" style={inp}/>
            <datalist id="boxes-list">{boxes.map(b=><option key={b} value={b}/>)}</datalist>
          </div>
          <div>
            <label style={{ fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:4 }}>Fach</label>
            <input value={fach} onChange={e=>setFach(e.target.value)}
              list="faecher-list" placeholder="z.B. Fach 1" style={inp}/>
            <datalist id="faecher-list">{faecher.map(f=><option key={f} value={f}/>)}</datalist>
          </div>
        </div>
        {regal && (
          <div style={{ background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',borderRadius:12,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#6366f1',fontWeight:600 }}>
            📍 {[regal,box,fach].filter(Boolean).join(' → ') || regal}
          </div>
        )}
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:'11px',borderRadius:12,border:'1px solid var(--border)',background:'var(--modal-close)',color:'var(--text-1)',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>Abbrechen</button>
          <button onClick={handleSave} disabled={saving||!regal}
            style={{ flex:1,padding:'11px',borderRadius:12,border:'none',background:saving||!regal?'var(--modal-close)':'#6366f1',color:saving||!regal?'var(--text-3)':'#fff',fontWeight:700,fontSize:13,cursor:saving||!regal?'default':'pointer',fontFamily:'inherit' }}>
            {saving ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── QR Modal ──────────────────────────────────────────────────────────
function QRModal({ platz, onClose }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(platz)}&bgcolor=ffffff&color=111827&margin=10`
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--surface)',borderRadius:24,padding:32,maxWidth:320,width:'100%',textAlign:'center',boxShadow:'0 24px 60px rgba(0,0,0,.3)' }}>
        <p style={{ fontSize:17,fontWeight:800,color:'var(--text-1)',margin:'0 0 4px' }}>QR-Code</p>
        <p style={{ fontSize:12,color:'var(--text-3)',margin:'0 0 18px' }}>{platz}</p>
        <img src={qrUrl} alt={platz} style={{ width:200,height:200,borderRadius:12,border:'1px solid var(--border)' }}/>
        <p style={{ fontSize:11,color:'var(--text-3)',margin:'14px 0 18px' }}>Ausdrucken und an der Box befestigen</p>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>window.open(qrUrl,'_blank')} style={{ flex:1,padding:'10px',borderRadius:12,border:'1px solid var(--border)',background:'var(--modal-close)',color:'var(--text-1)',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>🖨️ Drucken</button>
          <button onClick={onClose} style={{ flex:1,padding:'10px',borderRadius:12,border:'none',background:'#6366f1',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function LagerPage() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selRegal, setSelRegal] = useState(null)
  const [selBox,   setSelBox]   = useState(null)
  const [selFach,  setSelFach]  = useState(null)
  const [assign,   setAssign]   = useState(null)
  const [qr,       setQr]       = useState(null)

  useEffect(() => {
    fetch('/api/lager').then(r=>r.json()).then(d=>{
      setListings(Array.isArray(d)?d:[])
      setLoading(false)
    })
  }, [])

  const updateListing = (id, lagerplatz) => {
    setListings(prev => prev.map(l => l.id===id ? {...l,lagerplatz} : l))
    setAssign(null)
  }

  const tree = buildTree(listings)
  const sortedRegale = Object.keys(tree).sort((a,b) => a==='—'?1:b==='—'?-1:a.localeCompare(b))

  // Search mode
  const searchResults = search.trim()
    ? listings.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || (l.lagerplatz||'').toLowerCase().includes(search.toLowerCase()))
    : []

  // Breadcrumb
  const crumbs = [
    { label:'Lager', onClick:()=>{setSelRegal(null);setSelBox(null);setSelFach(null)} },
    ...(selRegal ? [{ label:selRegal, onClick:()=>{setSelBox(null);setSelFach(null)} }] : []),
    ...(selBox   ? [{ label:selBox,   onClick:()=>setSelFach(null) }] : []),
    ...(selFach  ? [{ label:selFach,  onClick:()=>{} }] : []),
  ]

  const totalItems = listings.length
  const totalValue = listings.reduce((s,l)=>s+(Number(l.buyPrice)||0),0)
  const totalPlaces = new Set(listings.map(l=>l.lagerplatz).filter(Boolean)).size

  return (
    <div className="ls-page">
      <Sidebar/>
      <main className="md:ml-60 ls-page-content">
        <div style={{ maxWidth:1000,margin:'0 auto',padding:'24px 16px 48px' }}>

          {/* ── Header ── */}
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12 }}>
            <div>
              <h1 style={{ fontSize:22,fontWeight:800,color:'var(--text-1)',margin:'0 0 3px',letterSpacing:'-0.02em' }}>📦 Lager</h1>
              <p style={{ fontSize:13,color:'var(--text-3)',margin:0 }}>3D Übersicht · Regal → Box → Fach</p>
            </div>
            <button onClick={()=>router.push('/new')} style={{ padding:'10px 18px',borderRadius:12,border:'none',background:'#6366f1',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>
              + Neues Listing
            </button>
          </div>

          {/* ── Stats ── */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24 }}>
            {[
              { icon:'📦', v:totalItems,  l:'Artikel' },
              { icon:'🗂️', v:totalPlaces, l:'Lagerplätze' },
              { icon:'💰', v:`${totalValue.toFixed(2).replace('.',',')} €`, l:'Einkaufswert' },
            ].map(s=>(
              <div key={s.l} className="ls-card" style={{ padding:'14px 16px' }}>
                <span style={{ fontSize:20 }}>{s.icon}</span>
                <p style={{ fontSize:20,fontWeight:800,color:'var(--text-1)',margin:'4px 0 1px',letterSpacing:'-0.02em' }}>{s.v}</p>
                <p style={{ fontSize:11,color:'var(--text-3)',margin:0 }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* ── Search ── */}
          <div style={{ position:'relative',marginBottom:24 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="🔍  Artikel suchen — zeigt Lagerplatz-Pfad..."
              style={{ width:'100%',padding:'12px 16px',border:'1px solid var(--border)',borderRadius:14,fontSize:14,background:'var(--surface)',color:'var(--text-1)',fontFamily:'inherit',boxSizing:'border-box' }}/>
          </div>

          {/* ── Search Results ── */}
          {search.trim() && (
            <div style={{ marginBottom:28 }}>
              <p style={{ fontSize:12,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10 }}>{searchResults.length} Treffer</p>
              {searchResults.length === 0
                ? <p style={{ color:'var(--text-3)',fontSize:13 }}>Keine Artikel gefunden.</p>
                : searchResults.map(item => {
                    const { regal,box,fach } = parsePlatz(item.lagerplatz)
                    const color = regal ? pickColor(regal) : '#6b7280'
                    return (
                      <div key={item.id} style={{ display:'flex',alignItems:'center',gap:12,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'12px 16px',marginBottom:8 }}>
                        <div style={{ width:42,height:42,borderRadius:10,overflow:'hidden',flexShrink:0,background:'var(--modal-close)',border:'1px solid var(--border)' }}>
                          {item.images?.[0] ? <img src={item.images[0]} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>📷</div>}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <p style={{ fontSize:13.5,fontWeight:700,color:'var(--text-1)',margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.title}</p>
                          {item.lagerplatz
                            ? <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                                {[regal,box,fach].filter(Boolean).map((part,i)=>(
                                  <span key={i} style={{ display:'flex',alignItems:'center',gap:4 }}>
                                    {i>0 && <span style={{ fontSize:10,color:'var(--text-3)' }}>→</span>}
                                    <span style={{ fontSize:11,fontWeight:700,color,background:`rgba(${hexToRgb(color)},.12)`,padding:'2px 8px',borderRadius:6 }}>{part}</span>
                                  </span>
                                ))}
                              </div>
                            : <span style={{ fontSize:11,color:'var(--text-3)' }}>Kein Lagerplatz</span>
                          }
                        </div>
                        <button onClick={()=>setAssign(item)} style={{ padding:'6px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--modal-close)',color:'var(--text-2)',fontWeight:600,fontSize:11.5,cursor:'pointer',fontFamily:'inherit' }}>
                          ✏️ Platz
                        </button>
                      </div>
                    )
                  })
              }
            </div>
          )}

          {/* ── Breadcrumb ── */}
          {!search.trim() && (
            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:20,flexWrap:'wrap' }}>
              {crumbs.map((c,i)=>(
                <span key={i} style={{ display:'flex',alignItems:'center',gap:6 }}>
                  {i>0 && <span style={{ color:'var(--text-3)',fontSize:14 }}>›</span>}
                  <button onClick={c.onClick} style={{
                    padding:'5px 12px',borderRadius:20,border:'none',fontFamily:'inherit',cursor:'pointer',fontSize:13,fontWeight:i===crumbs.length-1?700:500,
                    background: i===crumbs.length-1 ? 'rgba(99,102,241,.12)' : 'var(--modal-close)',
                    color: i===crumbs.length-1 ? '#6366f1' : 'var(--text-2)',
                  }}>{c.label}</button>
                </span>
              ))}
            </div>
          )}

          {loading && <p style={{ color:'var(--text-3)',textAlign:'center',padding:60 }}>Wird geladen…</p>}

          {/* ── OVERVIEW: Regale ── */}
          {!search.trim() && !loading && !selRegal && (
            <div>
              {sortedRegale.length === 0 && (
                <div style={{ textAlign:'center',padding:'60px 20px' }}>
                  <p style={{ fontSize:40,margin:'0 0 12px' }}>🏗️</p>
                  <p style={{ fontSize:15,fontWeight:700,color:'var(--text-1)',margin:'0 0 6px' }}>Noch kein Lager eingerichtet</p>
                  <p style={{ fontSize:13,color:'var(--text-3)',margin:'0 0 20px' }}>Erstelle Listings mit einem Lagerplatz (z.B. "Regal A/Box 1/Fach 2") um dein Lager zu strukturieren.</p>
                  <button onClick={()=>router.push('/new')} style={{ padding:'11px 22px',borderRadius:12,border:'none',background:'#6366f1',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>Erstes Listing + Lagerplatz</button>
                </div>
              )}
              <div style={{ display:'flex',flexWrap:'wrap',gap:20,alignItems:'flex-start' }}>
                {sortedRegale.filter(r=>r!=='—').map(regal => {
                  const boxes = Object.keys(tree[regal])
                  const items = boxes.flatMap(b => Object.values(tree[regal][b]).flat())
                  const color = pickColor(regal)
                  return (
                    <ShelfCard key={regal} name={regal} count={boxes.length} itemCount={items.length}
                      color={color} active={selRegal===regal}
                      onClick={()=>{ setSelRegal(regal); setSelBox(null); setSelFach(null) }}/>
                  )
                })}
                {/* Unsorted */}
                {tree['—'] && (() => {
                  const boxes = Object.keys(tree['—'])
                  const items = boxes.flatMap(b=>Object.values(tree['—'][b]).flat())
                  return (
                    <ShelfCard key="—" name="Unsortiert" count={boxes.length} itemCount={items.length}
                      color="#6b7280" active={selRegal==='—'}
                      onClick={()=>{ setSelRegal('—'); setSelBox(null); setSelFach(null) }}/>
                  )
                })()}
                {/* Add new Regal hint */}
                <div onClick={()=>router.push('/new')}
                  style={{ cursor:'pointer',width:150,border:'2px dashed var(--border)',borderRadius:14,padding:'40px 16px',textAlign:'center',color:'var(--text-3)',transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#6366f1';e.currentTarget.style.color='#6366f1'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)'}}>
                  <p style={{ fontSize:24,margin:'0 0 6px' }}>+</p>
                  <p style={{ fontSize:12,fontWeight:600,margin:0 }}>Neues Listing</p>
                </div>
              </div>
            </div>
          )}

          {/* ── REGAL VIEW: Boxes ── */}
          {!search.trim() && !loading && selRegal && !selBox && (
            <div>
              <p style={{ fontSize:13,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16 }}>Boxes in {selRegal}</p>
              <div style={{ display:'flex',flexWrap:'wrap',gap:16 }}>
                {Object.keys(tree[selRegal]||{}).sort().map(box => {
                  const faecher = Object.keys(tree[selRegal][box])
                  const items   = faecher.flatMap(f=>tree[selRegal][box][f])
                  const color   = pickColor(selRegal)
                  return (
                    <BoxCard key={box} name={box} fachCount={faecher.length} itemCount={items.length}
                      color={color} active={selBox===box}
                      onClick={()=>{ setSelBox(box); setSelFach(null) }}/>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── BOX VIEW: Fächer ── */}
          {!search.trim() && !loading && selRegal && selBox && !selFach && (
            <div>
              <p style={{ fontSize:13,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16 }}>Fächer in {selRegal} / {selBox}</p>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14 }}>
                {Object.keys(tree[selRegal]?.[selBox]||{}).sort().map(fach => {
                  const items = tree[selRegal][selBox][fach] || []
                  const color = pickColor(selRegal)
                  const rgb   = hexToRgb(color)
                  return (
                    <div key={fach} onClick={()=>setSelFach(fach)}
                      style={{ cursor:'pointer',background:'var(--surface)',border:`1.5px solid rgba(${rgb},.25)`,borderRadius:16,padding:14,transition:'all .2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 8px 20px rgba(${rgb},.2)`}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                      {/* Item previews */}
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginBottom:10,aspectRatio:'1',background:'var(--bg)',borderRadius:10,overflow:'hidden',padding:4 }}>
                        {items.slice(0,4).map((item,i)=>(
                          <div key={i} style={{ borderRadius:6,overflow:'hidden',background:'var(--modal-close)' }}>
                            {item.images?.[0]
                              ? <img src={item.images[0]} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                              : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>📷</div>
                            }
                          </div>
                        ))}
                        {items.length === 0 && <div style={{ gridColumn:'1/-1',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-3)',fontSize:22 }}>📭</div>}
                      </div>
                      <p style={{ fontSize:13,fontWeight:700,color:'var(--text-1)',margin:'0 0 2px' }}>{fach}</p>
                      <p style={{ fontSize:11,color:'var(--text-3)',margin:0 }}>{items.length} Artikel</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── FACH VIEW: Items ── */}
          {!search.trim() && !loading && selRegal && selBox && selFach && (
            <div>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
                <p style={{ fontSize:13,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',margin:0 }}>
                  Artikel in {selRegal} / {selBox} / {selFach}
                </p>
                <button onClick={()=>setQr(makePlatz(selRegal,selBox,selFach))}
                  style={{ padding:'7px 14px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text-2)',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit' }}>
                  QR-Code
                </button>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {(tree[selRegal]?.[selBox]?.[selFach]||[]).map(item=>(
                  <div key={item.id} style={{ display:'flex',alignItems:'center',gap:14,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'14px 16px' }}>
                    <div style={{ width:52,height:52,borderRadius:12,overflow:'hidden',flexShrink:0,background:'var(--modal-close)',border:'1px solid var(--border)' }}>
                      {item.images?.[0] ? <img src={item.images[0]} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>📷</div>}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ fontSize:14,fontWeight:700,color:'var(--text-1)',margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.title}</p>
                      <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                        <span style={{ fontSize:11,fontWeight:700,color:STATUS_COLOR[item.status]||'#6b7280',background:`${STATUS_COLOR[item.status]||'#6b7280'}18`,padding:'2px 8px',borderRadius:6 }}>{STATUS_LABEL[item.status]||item.status}</span>
                        {item.size  && <span style={{ fontSize:11,color:'var(--text-3)' }}>Gr. {item.size}</span>}
                        {Number(item.buyPrice)>0 && <span style={{ fontSize:11,color:'var(--text-3)' }}>EK {Number(item.buyPrice).toFixed(2).replace('.',',')} €</span>}
                        {Number(item.price)>0    && <span style={{ fontSize:11,color:'#10b981',fontWeight:600 }}>{Number(item.price).toFixed(2).replace('.',',')} €</span>}
                      </div>
                    </div>
                    <button onClick={()=>setAssign(item)}
                      style={{ padding:'7px 12px',borderRadius:10,border:'1px solid var(--border)',background:'var(--modal-close)',color:'var(--text-2)',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit',flexShrink:0 }}>
                      ✏️ Verschieben
                    </button>
                  </div>
                ))}
                {(tree[selRegal]?.[selBox]?.[selFach]||[]).length === 0 && (
                  <p style={{ color:'var(--text-3)',fontSize:13,textAlign:'center',padding:30 }}>Fach ist leer.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
      <MobileNav/>
      {assign && assign.id !== '__new__' && (
        <AssignModal listing={assign} tree={tree} onSave={updateListing} onClose={()=>setAssign(null)}/>
      )}
      {qr && <QRModal platz={qr} onClose={()=>setQr(null)}/>}
    </div>
  )
}
