'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import MobilePostHelper from '@/components/MobilePostHelper'
import { PlatformBadge, PLATFORMS, CONDITIONS, BRANDS, COLORS, MATERIALS, SHIPPING_OPTIONS, SHIP_SIZES, getSizes, optimizeTitle, fmt } from '@/components/Badge'
import CategoryPicker from '@/components/CategoryPicker'

// eBay-Unterkategorie-Optionen je Hauptkategorie
const EBAY_CATS = {
  'Damen':             ['Jeans','Jacken & Mäntel','Pullover & Strickjacken','Kleider & Röcke','Shirts & Tops','Hosen','Shorts','Bademode','Sportbekleidung'],
  'Damen – Kleidung':  ['Jeans','Jacken & Mäntel','Pullover & Strickjacken','Kleider & Röcke','Shirts & Tops','Hosen','Shorts','Bademode','Sportbekleidung'],
  'Damen – Schuhe':    ['Sneaker','Stiefel & Stiefeletten','Pumps','Ballerinas','Sandalen'],
  'Damen – Taschen':   ['Handtaschen','Rucksäcke','Clutches','Geldbörsen'],
  'Herren':            ['Jeans','Jacken & Mäntel','Pullover & Strickjacken','Hemden','Hosen & Chinos','T-Shirts','Shorts','Sportbekleidung'],
  'Herren – Kleidung': ['Jeans','Jacken & Mäntel','Pullover & Strickjacken','Hemden','Hosen & Chinos','T-Shirts','Shorts','Sportbekleidung'],
  'Herren – Schuhe':   ['Sneaker','Stiefel','Halbschuhe & Schnürschuhe'],
  'Kinder':            ['Babykleidung','Mädchenkleidung','Jungenkleidung','Kinderschuhe','Spielzeug'],
  'Kinder – Mädchen':  ['Mädchenkleidung','Mädchenschuhe','Spielzeug'],
  'Kinder – Jungs':    ['Jungenkleidung','Jungenschuhe','Spielzeug'],
  'Elektronik':        ['Smartphones','Laptops','Tablets','Kopfhörer','Sonstige Elektronik'],
  'Beauty':            ['Parfüm & Düfte','Make-up','Hautpflege','Haarpflege'],
  'Beauty – Make-up':  ['Make-up'],
  'Beauty – Hautpflege': ['Hautpflege'],
  'Beauty – Parfüm & Düfte': ['Parfüm & Düfte'],
  'Haustiere':         ['Hundezubehör','Katzenzubehör','Sonstiges Zubehör'],
  'Haustiere – Hunde': ['Hundezubehör'],
  'Haustiere – Katzen':['Katzenzubehör'],
  'Sonstiges':         ['Sonstiges'],
}
function getEbayCats(category) {
  if (!category) return []
  if (EBAY_CATS[category]) return EBAY_CATS[category]
  // Partial match (e.g. "Damen – Kleidung – Jeans" → "Damen – Kleidung")
  const keys = Object.keys(EBAY_CATS).sort((a,b) => b.length - a.length)
  for (const k of keys) {
    if (category === k || category.startsWith(k + ' – ') || category.startsWith(k)) {
      return EBAY_CATS[k]
    }
  }
  return []
}

// KA-Unterkategorie-Optionen je Hauptkategorie
const KA_LEAVES = {
  '153/154': ['Jacken & Mäntel','Jeans','Pullover','Hosen','Röcke & Kleider','Shirts & Tops','Shorts','Sportbekleidung','Bademode','Weitere Damenbekleidung'],
  '153/159': ['Sneaker','Stiefel & Stiefeletten','Ballerinas','Pumps','Sandalen & Flip-Flops','Weitere Damenschuhe'],
  '153/156': ['Handtaschen','Rucksäcke','Geldbörsen','Weitere Taschen'],
  '153/160': ['Shirts & Hemden','Pullover & Strickjacken','Hosen & Chinos','Jeans','Jacken & Mäntel','Anzüge & Sakkos','Sportbekleidung','Weitere Herrenbekleidung'],
  '153/158': ['Sneaker','Stiefel','Halbschuhe & Schnürschuhe','Weitere Herrenschuhe'],
  '153/224': ['Parfüm & Düfte','Make-up','Hautpflege','Haarpflege','Nagelpflege','Weitere Beauty'],
  '17/22':   ['Babykleidung & -schuhe','Kinderkleidung','Kinderschuhe','Spielzeug'],
  '17/23':   ['Spielzeug','Weiteres Spielzeug'],
  '130/135': ['Hunde','Katzen','Kleintiere','Vögel','Weitere Haustiere'],
  '161':     ['Smartphones','Laptops','Tablets','Weitere Elektronik'],
  '80':      ['Möbel','Dekoration','Küche','Weitere Home'],
  '185':     ['Sportkleidung','Sportschuhe','Sportausrüstung','Weitere Sport'],
  '228':     ['Sonstiges'],
}
// Welcher KA-Pfad zu welcher Haupt-Kategorie gehört
const KA_PATH_BY_CATEGORY = {
  'Damen': '153/154', 'Damen – Kleidung': '153/154',
  'Damen – Schuhe': '153/159', 'Damen – Taschen': '153/156', 'Damen – Accessoires': '153/156',
  'Herren': '153/160', 'Herren – Kleidung': '153/160', 'Herren – Schuhe': '153/158',
  'Beauty': '153/224', 'Kinder': '17/22', 'Kinder – Spielzeug': '17/23',
  'Haustiere': '130/135', 'Elektronik': '161', 'Home & Living': '80',
  'Sport & Outdoor': '185', 'Sonstiges': '228',
}
function getKALeaves(category) {
  if (!category) return []
  const keys = Object.keys(KA_PATH_BY_CATEGORY).sort((a,b) => b.length - a.length)
  for (const k of keys) {
    if (category === k || category.startsWith(k + ' – ') || category.startsWith(k)) {
      return KA_LEAVES[KA_PATH_BY_CATEGORY[k]] || []
    }
  }
  return []
}
// Bestes KA-Leaf aus Kategorie-String automatisch vorschlagen
const CAT_TO_KA_LEAF_SUGGEST = {
  'Jeans': 'Jeans', 'Hosen & Jeans': 'Jeans', 'Hosen': 'Hosen', 'Hosen & Chinos': 'Hosen & Chinos',
  'Pullover & Strickpullover': 'Pullover', 'Pullover & Sweater': 'Pullover', 'Pullover': 'Pullover',
  'Jacken & Mäntel': 'Jacken & Mäntel', 'Kleider': 'Röcke & Kleider', 'Röcke & Kleider': 'Röcke & Kleider',
  'Tops & T-Shirts': 'Shirts & Tops', 'Shirts & Tops': 'Shirts & Tops', 'Shorts': 'Shorts',
  'Sportkleidung': 'Sportbekleidung', 'Bademode': 'Bademode',
  'Sneaker': 'Sneaker', 'Stiefel & Stiefeletten': 'Stiefel & Stiefeletten',
  'Ballerinas': 'Ballerinas', 'Pumps': 'Pumps', 'Sandalen & Flip-Flops': 'Sandalen & Flip-Flops',
  'Handtaschen': 'Handtaschen', 'Rucksäcke': 'Rucksäcke', 'Geldbörsen': 'Geldbörsen',
  'Shirts & Hemden': 'Shirts & Hemden', 'Anzüge & Blazer': 'Anzüge & Sakkos',
  'Blazer & Anzüge': 'Anzüge & Sakkos', 'Jeans (Herren)': 'Jeans',
}
function suggestKALeaf(category) {
  if (!category) return ''
  const parts = category.split(' – ')
  const last = parts[parts.length - 1]?.trim()
  return CAT_TO_KA_LEAF_SUGGEST[last] || ''
}

export default function NewListing() {
  const router  = useRouter()
  const fileRef = useRef(null)
  const [step, setStep]       = useState(1)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mobileHelper, setMobileHelper] = useState(null)
  const [imgs, setImgs]       = useState([])
  const [form, setForm]       = useState({
    title:'', description:'', price:'', buyPrice:'',
    condition:'Sehr gut', category:'',
    brand:'', size:'', color:'', material:'', stil:'', beinform:'', taillenumfang:'', kaCategory:'', ebayCategory:'', shipping:[], shipSize:'',
    platforms:['vinted','kleinanzeigen','ebay'],
    address:''
  })

  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const togglePlt  = p => set('platforms', form.platforms.includes(p)?form.platforms.filter(x=>x!==p):[...form.platforms,p])
  const toggleShip = s => set('shipping',  form.shipping.includes(s)?form.shipping.filter(x=>x!==s):[...form.shipping,s])

  // Wenn Kategorie gesetzt wird → KA-Kategorie automatisch vorschlagen (nur wenn noch leer)
  useEffect(() => {
    if (form.category && !form.kaCategory) {
      const suggested = suggestKALeaf(form.category)
      if (suggested) set('kaCategory', suggested)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category])

  const validate = () => {
    const e = {}
    if(step===1){ if(!form.title.trim()) e.title='Bitte Titel eingeben'; if(!form.price||Number(form.price)<=0) e.price='Gültigen Preis eingeben' }
    if(step===3){ if(form.platforms.length===0) e.platforms='Mindestens eine Plattform wählen' }
    setErrors(e); return Object.keys(e).length===0
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (imgs.length + files.length > 8) { alert('Maximal 8 Bilder'); return }
    setUploading(true)
    try {
      let newImgs
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        const { upload } = await import('@vercel/blob/client')
        const results = await Promise.all(files.map(file =>
          upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' })
        ))
        newImgs = results.map((blob, i) => ({ url: blob.url, preview: URL.createObjectURL(files[i]) }))
      } else {
        const fd = new FormData()
        files.forEach(f => fd.append('files', f))
        const res  = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        newImgs = data.urls.map((url, i) => ({ url, preview: URL.createObjectURL(files[i]) }))
      }
      setImgs(x => [...x, ...newImgs])
    } catch(err) { alert('Upload fehlgeschlagen: ' + err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  const removeImg = (i) => setImgs(x => x.filter((_,j)=>j!==i))

  const handleNext = async () => {
    if(!validate()) return
    if(step<3){ setStep(s=>s+1); setErrors({}); return }
    setLoading(true)
    try {
      const res = await fetch('/api/listings', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          ...form, price: Number(form.price), buyPrice: Number(form.buyPrice||0),
          images: imgs.map(i=>i.url), ebayCategory: form.ebayCategory,
        })
      })
      if(res.ok) {
        const created = await res.json().catch(() => null)
        const extPlatforms = form.platforms.filter(p => ['vinted','kleinanzeigen','ebay'].includes(p))
        if (extPlatforms.length > 0 && created) {
          // Ping/Pong: Extension wirklich aktiv? (zuverlässiger als DOM-Attribut)
          const extAvail = await new Promise(resolve => {
            if (document.documentElement.getAttribute('data-listsync-extension') === '1') return resolve(true)
            let done = false
            const handler = (e) => {
              if (e.source !== window || e.data?.type !== 'LISTSYNC_PONG') return
              if (!done) { done = true; window.removeEventListener('message', handler); resolve(true) }
            }
            window.addEventListener('message', handler)
            window.postMessage({ type: 'LISTSYNC_PING' }, '*')
            setTimeout(() => { if (!done) { done = true; window.removeEventListener('message', handler); resolve(false) } }, 600)
          })
          if (extAvail) {
            window.postMessage({ type: 'LISTSYNC_POST', listing: { ...created, images: imgs.map(i=>i.url) }, platforms: extPlatforms }, '*')
          } else {
            setMobileHelper({ listing: { ...created, images: imgs.map(i=>i.url) }, platforms: extPlatforms })
            setLoading(false); return
          }
        }
        sessionStorage.setItem('ls_just_created', created?.title || 'Listing erstellt')
        router.push('/listings')
      } else {
        const err = await res.json().catch(() => ({}))
        alert('Fehler beim Speichern: ' + (err.error || res.status))
      }
    } catch(e) { alert('Netzwerkfehler: ' + e.message) }
    finally { setLoading(false) }
  }

  const lbl  = { display:'block', fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:6 }
  const inp  = { width:'100%', padding:'12px 14px', border:'1px solid var(--border)', borderRadius:12, fontSize:14, background:'var(--input-bg)', color:'var(--text-1)', fontFamily:'inherit' }
  const inpErr = { ...inp, borderColor:'rgba(239,68,68,0.5)', boxShadow:'0 0 0 3px rgba(239,68,68,0.08)' }

  const CheckBox = ({ checked }) => (
    <div style={{
      width:20, height:20, borderRadius:6, flexShrink:0,
      border:`2px solid ${checked?'#6366f1':'var(--border)'}`,
      background:checked?'#6366f1':'transparent',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
    </div>
  )

  return (
    <div className="ls-page">
      <Sidebar/>
      <main className="md:ml-60 ls-page-content">
        <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px 32px' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
            <button onClick={()=>step>1?setStep(s=>s-1):router.push('/listings')}
              style={{ width:36, height:36, borderRadius:'50%', border:'none', cursor:'pointer', background:'var(--modal-close)', color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0 }}>←</button>
            <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-1)', margin:0, letterSpacing:'-0.02em' }}>Neues Listing</h1>
          </div>

          {/* Step indicator */}
          <div style={{ display:'flex', alignItems:'center', marginBottom:32 }}>
            {['Basis-Info','Bilder','Plattformen'].map((label,i) => {
              const s=i+1; const done=s<step; const active=s===step
              return (
                <div key={s} style={{ display:'flex', alignItems:'center', flex:1 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{
                      width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:13, fontWeight:700,
                      background: done?'#22c55e':active?'#6366f1':'var(--modal-close)',
                      color: (done||active)?'#fff':'var(--text-3)',
                    }}>{done?'✓':s}</div>
                    <span style={{ fontSize:11, fontWeight:600, color:active?'#6366f1':'var(--text-3)', whiteSpace:'nowrap' }}>{label}</span>
                  </div>
                  {s<3 && <div style={{ flex:1, height:2, margin:'0 4px 16px', background:done?'#22c55e':'var(--border)' }}/>}
                </div>
              )
            })}
          </div>

          {/* ── Step 1 ── */}
          {step===1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* ─ Essential ─ */}
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={lbl}>Titel *</label>
                  <input value={form.title} onChange={e=>set('title',e.target.value)}
                    placeholder="z.B. Nike Air Force 1 Weiß Gr. 43" style={errors.title?inpErr:inp} maxLength={80}/>
                  {errors.title
                    ? <p style={{ color:'#ef4444', fontSize:12, margin:'4px 0 0' }}>{errors.title}</p>
                    : <p style={{ fontSize:12, color: form.title.length>65?'#f59e0b':'var(--text-3)', margin:'4px 0 0', fontWeight: form.title.length>65?700:400 }}>{form.title.length}/80 Zeichen</p>
                  }
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={lbl}>Verkaufspreis * (€)</label>
                    <input type="number" min="0" step="0.5" value={form.price} onChange={e=>set('price',e.target.value)} style={errors.price?inpErr:inp}/>
                    {errors.price && <p style={{ color:'#ef4444', fontSize:12, margin:'4px 0 0' }}>{errors.price}</p>}
                  </div>
                  <div>
                    <label style={lbl}>Einkaufspreis (€)</label>
                    <input type="number" min="0" step="0.5" value={form.buyPrice} onChange={e=>set('buyPrice',e.target.value)} style={inp}/>
                  </div>
                </div>

                {form.price && form.buyPrice && Number(form.price)>Number(form.buyPrice) && (
                  <div style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)', borderRadius:14, padding:'10px 14px', fontSize:13, color:'#10b981', fontWeight:700 }}>
                    💰 Erwarteter Gewinn: +{fmt(Number(form.price)-Number(form.buyPrice))}
                    <span style={{ fontWeight:400, opacity:.75, marginLeft:8 }}>({Math.round((Number(form.price)-Number(form.buyPrice))/Number(form.buyPrice)*100)}% ROI)</span>
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={lbl}>Zustand</label>
                    <select value={form.condition} onChange={e=>set('condition',e.target.value)} style={inp}>
                      {CONDITIONS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Kategorie</label>
                    <CategoryPicker value={form.category} onChange={v=>{ set('category',v); set('size',''); set('kaCategory', suggestKALeaf(v)) }}/>
                  </div>
                </div>
              </div>

              {/* ─ Kleinanzeigen Kategorie ─ */}
              {form.platforms.includes('kleinanzeigen') && form.category && getKALeaves(form.category).length > 0 && (
                <div style={{ background:'rgba(234,88,12,0.06)', border:'1px solid rgba(234,88,12,0.25)', borderRadius:12, padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#ea580c', textTransform:'uppercase', letterSpacing:'.06em' }}>🟠 Kleinanzeigen Kategorie</span>
                    {form.kaCategory && <span style={{ fontSize:10, color:'#ea580c', opacity:.7 }}>wird automatisch ausgewählt</span>}
                  </div>
                  <select
                    value={form.kaCategory}
                    onChange={e => set('kaCategory', e.target.value)}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid rgba(234,88,12,0.35)', background:'var(--surface)', color:'var(--text-1)', fontSize:13, fontWeight:600 }}
                  >
                    <option value="">– automatisch erkennen –</option>
                    {getKALeaves(form.category).map(leaf => (
                      <option key={leaf} value={leaf}>{leaf}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ─ eBay Kategorie ─ */}
              {form.platforms.includes('ebay') && form.category && getEbayCats(form.category).length > 0 && (
                <div style={{ background:'rgba(202,138,4,0.06)', border:'1px solid rgba(202,138,4,0.3)', borderRadius:12, padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#ca8a04', textTransform:'uppercase', letterSpacing:'.06em' }}>🟡 eBay Kategorie</span>
                    <span style={{ fontSize:10, color:'#ca8a04', opacity:.7 }}>verhindert falsche Auto-Erkennung</span>
                  </div>
                  <select
                    value={form.ebayCategory}
                    onChange={e => set('ebayCategory', e.target.value)}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid rgba(202,138,4,0.4)', background:'var(--surface)', color:'var(--text-1)', fontSize:13, fontWeight:600 }}
                  >
                    <option value="">– automatisch erkennen –</option>
                    {getEbayCats(form.category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ─ Divider ─ */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>Details (optional)</span>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              </div>

              {/* ─ Details Grid ─ */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={lbl}>Marke</label>
                    <select value={form.brand} onChange={e=>set('brand',e.target.value)} style={inp}>
                      <option value="">– keine –</option>
                      {BRANDS.map(b=><option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Farbe</label>
                    <select value={form.color} onChange={e=>set('color',e.target.value)} style={inp}>
                      <option value="">– keine –</option>
                      {COLORS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns: getSizes(form.category).length>0 ? '1fr 1fr' : '1fr', gap:12 }}>
                  {getSizes(form.category).length>0 && (
                    <div>
                      <label style={lbl}>Größe</label>
                      <select value={form.size} onChange={e=>set('size',e.target.value)} style={inp}>
                        <option value="">– keine –</option>
                        {getSizes(form.category).map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Material</label>
                    <select value={form.material} onChange={e=>set('material',e.target.value)} style={inp}>
                      <option value="">– keines –</option>
                      {MATERIALS.map(m=><option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {/* ─ eBay-Merkmale ─ */}
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0' }}>
                  <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>eBay-Merkmale (optional)</span>
                  <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                  <div>
                    <label style={lbl}>Stil</label>
                    <input value={form.stil} onChange={e=>set('stil',e.target.value)}
                      placeholder="z.B. Casual" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Beinform</label>
                    <input value={form.beinform} onChange={e=>set('beinform',e.target.value)}
                      placeholder="z.B. Slim Fit" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Taillenumfang</label>
                    <input value={form.taillenumfang} onChange={e=>set('taillenumfang',e.target.value)}
                      placeholder="z.B. M / 38" style={inp}/>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Beschreibung</label>
                  <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3}
                    placeholder="Beschreibe den Artikel, Besonderheiten, Maße…" style={{ ...inp, resize:'vertical' }}/>
                </div>
              </div>

              {/* ─ Divider ─ */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>Versand</span>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              </div>

              {/* ─ Shipping ─ */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <label style={{ ...lbl, marginBottom:8 }}>Versandoptionen</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {SHIPPING_OPTIONS.map(opt => {
                      const sel = form.shipping.includes(opt.id)
                      return (
                        <div key={opt.id} onClick={()=>toggleShip(opt.id)}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:14, cursor:'pointer', border:`2px solid ${sel?'#818cf8':'var(--border)'}`, background:sel?'rgba(99,102,241,0.07)':'var(--surface)', transition:'all .15s' }}>
                          <CheckBox checked={sel}/>
                          <div>
                            <p style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', margin:0 }}>{opt.label}</p>
                            <p style={{ fontSize:11.5, color:'var(--text-3)', margin:'1px 0 0' }}>{opt.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Adresse <span style={{ fontWeight:400, color:'var(--text-3)' }}>(optional · nur für Kleinanzeigen)</span></label>
                  <input value={form.address} onChange={e=>set('address',e.target.value)}
                    placeholder="z.B. 80331 München" style={inp}/>
                </div>

                <div>
                  <label style={{ ...lbl, marginBottom:8 }}>Paketgröße</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {SHIP_SIZES.map(sz => {
                      const sel = form.shipSize===sz.id
                      return (
                        <div key={sz.id} onClick={()=>set('shipSize',sel?'':sz.id)}
                          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'11px 8px', borderRadius:14, cursor:'pointer', border:`2px solid ${sel?'#818cf8':'var(--border)'}`, background:sel?'rgba(99,102,241,0.07)':'var(--surface)', textAlign:'center', transition:'all .15s' }}>
                          <span style={{ fontSize:20 }}>{sz.id==='S'?'📦':sz.id==='M'?'🗃️':'🏗️'}</span>
                          <p style={{ fontSize:12.5, fontWeight:700, color:sel?'#6366f1':'var(--text-1)', margin:0 }}>{sz.label}</p>
                          <p style={{ fontSize:10.5, color:'var(--text-3)', margin:0, lineHeight:1.3 }}>{sz.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step===2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleFileChange}/>
              <div onClick={()=>!uploading&&imgs.length<8&&fileRef.current.click()}
                style={{ border:`2px dashed ${uploading?'#818cf8':'var(--border)'}`, borderRadius:20, padding:'40px 20px', textAlign:'center', cursor:imgs.length>=8?'default':'pointer', userSelect:'none', background:uploading?'rgba(99,102,241,0.04)':'var(--surface)', transition:'all .15s' }}>
                {uploading ? (
                  <><p style={{ fontSize:36, margin:'0 0 10px' }}>⏳</p><p style={{ fontWeight:600, color:'#818cf8', margin:0 }}>Wird hochgeladen…</p></>
                ) : (
                  <><p style={{ fontSize:42, margin:'0 0 10px' }}>📷</p>
                  <p style={{ fontWeight:600, color:'var(--text-1)', margin:'0 0 4px' }}>Tippe zum Hochladen</p>
                  <p style={{ fontSize:12, color:'var(--text-3)', margin:0 }}>JPG, PNG, HEIC · max. 8 Bilder</p></>
                )}
              </div>
              {imgs.length>0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {imgs.map((img,i) => (
                    <div key={i} style={{ aspectRatio:'1', borderRadius:16, position:'relative', overflow:'hidden', background:'var(--modal-close)' }}>
                      <img src={img.preview||img.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      <button onClick={()=>removeImg(i)}
                        style={{ position:'absolute', top:6, right:6, width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.55)', color:'#fff', border:'none', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                      {i===0 && <span style={{ position:'absolute', bottom:6, left:6, fontSize:10, background:'#6366f1', color:'#fff', padding:'2px 7px', borderRadius:6, fontWeight:700 }}>Haupt</span>}
                    </div>
                  ))}
                  {imgs.length<8&&!uploading && (
                    <div onClick={()=>fileRef.current.click()}
                      style={{ aspectRatio:'1', border:'2px dashed var(--border)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:'var(--text-3)', cursor:'pointer' }}>+</div>
                  )}
                </div>
              )}
              <p style={{ fontSize:12, color:'var(--text-3)', textAlign:'center' }}>{imgs.length}/8 Bilder hochgeladen</p>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step===3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {errors.platforms && <p style={{ color:'#ef4444', fontSize:13, fontWeight:600 }}>{errors.platforms}</p>}
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button
                  onClick={() => set('platforms', form.platforms.length === Object.keys(PLATFORMS).length ? [] : Object.keys(PLATFORMS))}
                  style={{ padding:'6px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text-2)', fontWeight:600, fontSize:12.5, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                  {form.platforms.length === Object.keys(PLATFORMS).length ? 'Keine' : 'Alle'}
                </button>
              </div>
              {Object.entries(PLATFORMS).map(([id,p]) => {
                const sel = form.platforms.includes(id)
                return (
                  <div key={id} onClick={()=>{ togglePlt(id); setErrors({}) }}
                    style={{ border:`2px solid ${sel?'#818cf8':'var(--border)'}`, borderRadius:20, padding:16, cursor:'pointer', background:sel?'rgba(99,102,241,0.06)':'var(--surface)', transition:'all .15s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, border:`2px solid ${sel?'#6366f1':'var(--border)'}`, background:sel?'#6366f1':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <PlatformBadge plt={id}/>
                    </div>
                    {sel && (
                      <div className={`mt-3 p-3 rounded-xl ${p.bg} border ${p.border}`}>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Optimierter Titel</p>
                        <p className={`text-sm font-semibold ${p.text}`}>{optimizeTitle(form.title||'Dein Artikel',id)}</p>
                      </div>
                    )}
                  </div>
                )
              })}
              {form.platforms.length>0 && (
                <div style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)', borderRadius:20, padding:16 }}>
                  <p style={{ fontSize:13.5, fontWeight:700, color:'#10b981', margin:'0 0 4px' }}>✨ Bereit zum Veröffentlichen</p>
                  <p style={{ fontSize:12, color:'#10b981', margin:0, opacity:0.8 }}>Wird auf {form.platforms.length} Plattform{form.platforms.length>1?'en':''} gepostet.</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:'flex', gap:12, marginTop:32 }}>
            {step>1 && (
              <button onClick={()=>setStep(s=>s-1)}
                style={{ padding:'14px 20px', borderRadius:14, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text-1)', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                ← Zurück
              </button>
            )}
            <button onClick={handleNext} disabled={loading||uploading}
              className="ls-btn-primary"
              style={{ flex:1, padding:14, borderRadius:14, fontSize:15 }}>
              {loading?'Wird gespeichert…':step<3?'Weiter →':'🚀 Listing erstellen & posten'}
            </button>
          </div>
        </div>
      </main>
      <MobileNav/>
      {mobileHelper && (
        <MobilePostHelper
          listing={mobileHelper.listing}
          platforms={mobileHelper.platforms}
          onClose={()=>{ setMobileHelper(null); router.push('/listings') }}
        />
      )}
    </div>
  )
}
