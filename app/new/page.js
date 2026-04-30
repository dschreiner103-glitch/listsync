'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PlatformBadge, PLATFORMS, CONDITIONS, CATEGORIES, BRANDS, COLORS, SHIPPING_OPTIONS, SHIP_SIZES, getSizes, optimizeTitle, fmt } from '@/components/Badge'

export default function NewListing() {
  const router  = useRouter()
  const fileRef = useRef(null)
  const [step, setStep]       = useState(1)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imgs, setImgs]       = useState([])   // array of { url, preview }
  const [form, setForm]       = useState({
    title:'', description:'', price:'', buyPrice:'',
    condition:'Sehr gut', category:'Damen – Kleidung',
    brand:'', size:'', color:'', shipping:[], shipSize:'',
    platforms:[]
  })

  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const togglePlt  = p => set('platforms', form.platforms.includes(p)?form.platforms.filter(x=>x!==p):[...form.platforms,p])
  const toggleShip = s => set('shipping',  form.shipping.includes(s) ?form.shipping.filter(x=>x!==s) :[...form.shipping,s])

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
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      const res  = await fetch('/api/upload', { method:'POST', body: fd })
      const data = await res.json()
      const newImgs = data.urls.map((url, i) => ({
        url,
        preview: URL.createObjectURL(files[i])
      }))
      setImgs(x => [...x, ...newImgs])
    } catch { alert('Upload fehlgeschlagen. Bitte erneut versuchen.') }
    finally { setUploading(false); e.target.value = '' }
  }

  const removeImg = (i) => setImgs(x => x.filter((_,j)=>j!==i))

  const handleNext = async () => {
    if(!validate()) return
    if(step<3){ setStep(s=>s+1); setErrors({}); return }
    setLoading(true)
    try {
      const res = await fetch('/api/listings', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          ...form,
          price:    Number(form.price),
          buyPrice: Number(form.buyPrice||0),
          images:   imgs.map(i=>i.url),
          brand:    form.brand,
          size:     form.size,
          color:    form.color,
          shipping: form.shipping,
          shipSize: form.shipSize,
        })
      })
      if(res.ok) router.push('/listings')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar/>
      <main className="md:ml-60 pb-20 md:pb-8">
        <div className="max-w-xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={()=>step>1?setStep(s=>s-1):router.push('/listings')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">←</button>
            <h1 className="text-xl font-extrabold text-gray-900">Neues Listing</h1>
          </div>

          {/* Steps */}
          <div className="flex items-center mb-8">
            {['Basis-Info','Bilder','Plattformen'].map((label,i) => {
              const s=i+1; const done=s<step; const active=s===step
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done?'bg-green-500 text-white':active?'bg-indigo-600 text-white':'bg-gray-100 text-gray-400'}`}>{done?'✓':s}</div>
                    <span className={`text-xs font-semibold ${active?'text-indigo-600':'text-gray-400'}`}>{label}</span>
                  </div>
                  {s<3&&<div className={`flex-1 h-0.5 mb-4 mx-1 ${done?'bg-green-400':'bg-gray-200'}`}/>}
                </div>
              )
            })}
          </div>

          {step===1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titel *</label>
                <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="z.B. Nike Air Force 1 Weiß Gr. 43"
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm ${errors.title?'border-red-300':'border-gray-200 focus:border-indigo-400'}`}/>
                {errors.title&&<p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                <p className="text-xs text-gray-400 mt-1">{form.title.length}/80 Zeichen</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Beschreibung</label>
                <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={4}
                  placeholder="Beschreibe deinen Artikel…"
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Verkaufspreis * (€)</label>
                  <input type="number" min="0" value={form.price} onChange={e=>set('price',e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-sm ${errors.price?'border-red-300':'border-gray-200 focus:border-indigo-400'}`}/>
                  {errors.price&&<p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Einkaufspreis (€)</label>
                  <input type="number" min="0" value={form.buyPrice} onChange={e=>set('buyPrice',e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm"/>
                </div>
              </div>
              {form.price&&form.buyPrice&&Number(form.price)>Number(form.buyPrice)&&(
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-700 font-semibold">
                  💰 Erwarteter Gewinn: +{fmt(Number(form.price)-Number(form.buyPrice))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zustand</label>
                  <select value={form.condition} onChange={e=>set('condition',e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm">
                    {CONDITIONS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategorie</label>
                  <select value={form.category} onChange={e=>{ set('category',e.target.value); set('size','') }}
                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Vinted-spezifische Felder */}
              <div className="pt-2 pb-1">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">🏷️ Vinted-Details</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Marke</label>
                  <select value={form.brand} onChange={e=>set('brand',e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm">
                    <option value="">– keine Angabe –</option>
                    {BRANDS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Farbe</label>
                  <select value={form.color} onChange={e=>set('color',e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm">
                    <option value="">– keine Angabe –</option>
                    {COLORS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {getSizes(form.category).length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Größe</label>
                  <select value={form.size} onChange={e=>set('size',e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm">
                    <option value="">– keine Angabe –</option>
                    {getSizes(form.category).map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Versandoptionen</label>
                <div className="space-y-2">
                  {SHIPPING_OPTIONS.map(opt=>{
                    const sel = form.shipping.includes(opt.id)
                    return (
                      <div key={opt.id} onClick={()=>toggleShip(opt.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${sel?'border-indigo-400 bg-indigo-50/40':'border-gray-100 bg-white hover:border-gray-200'}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${sel?'border-indigo-600 bg-indigo-600':'border-gray-300'}`}>
                          {sel&&<span className="text-white text-xs font-extrabold">✓</span>}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Versandgröße</label>
                <div className="grid grid-cols-3 gap-2">
                  {SHIP_SIZES.map(sz=>{
                    const sel = form.shipSize === sz.id
                    return (
                      <div key={sz.id} onClick={()=>set('shipSize', sel ? '' : sz.id)}
                        className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl border-2 cursor-pointer transition-all text-center ${sel?'border-indigo-400 bg-indigo-50/40':'border-gray-100 bg-white hover:border-gray-200'}`}>
                        <span className="text-lg">{sz.id==='S'?'📦':sz.id==='M'?'🗃️':'🏗️'}</span>
                        <p className={`text-sm font-bold ${sel?'text-indigo-700':'text-gray-800'}`}>{sz.label}</p>
                        <p className="text-xs text-gray-400 leading-tight">{sz.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {step===2 && (
            <div className="space-y-4">
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange}/>
              <div onClick={()=>!uploading&&imgs.length<8&&fileRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer select-none transition-all ${uploading?'border-indigo-300 bg-indigo-50/30':'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20'}`}>
                {uploading ? (
                  <><p className="text-3xl mb-3 animate-pulse">⏳</p><p className="font-semibold text-indigo-600">Wird hochgeladen…</p></>
                ) : (
                  <><p className="text-4xl mb-3">📷</p>
                  <p className="font-semibold text-gray-700">Tippe zum Hochladen</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC · max. 8 Bilder</p></>
                )}
              </div>
              {imgs.length>0&&(
                <div className="grid grid-cols-4 gap-3">
                  {imgs.map((img,i)=>(
                    <div key={i} className="aspect-square bg-gray-100 rounded-xl relative overflow-hidden group">
                      <img src={img.preview||img.url} alt="" className="w-full h-full object-cover"/>
                      <button onClick={()=>removeImg(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      {i===0&&<span className="absolute bottom-1 left-1 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded font-semibold">Haupt</span>}
                    </div>
                  ))}
                  {imgs.length<8&&!uploading&&(
                    <div onClick={()=>fileRef.current.click()} className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-2xl text-gray-300 hover:border-indigo-300 cursor-pointer">+</div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">{imgs.length}/8 Bilder hochgeladen</p>
            </div>
          )}

          {step===3 && (
            <div className="space-y-4">
              {errors.platforms&&<p className="text-red-500 text-sm font-semibold">{errors.platforms}</p>}
              {Object.entries(PLATFORMS).map(([id,p])=>{
                const sel=form.platforms.includes(id)
                return (
                  <div key={id} onClick={()=>{togglePlt(id);setErrors({})}}
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${sel?'border-indigo-400 bg-indigo-50/30':'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel?'border-indigo-600 bg-indigo-600':'border-gray-300'}`}>
                        {sel&&<span className="text-white text-xs font-extrabold">✓</span>}
                      </div>
                      <PlatformBadge plt={id}/>
                    </div>
                    {sel&&(
                      <div className={`mt-3 p-3 rounded-xl ${p.bg} border ${p.border}`}>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Optimierter Titel</p>
                        <p className={`text-sm font-semibold ${p.text}`}>{optimizeTitle(form.title||'Dein Artikel',id)}</p>
                      </div>
                    )}
                  </div>
                )
              })}
              {form.platforms.length>0&&(
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <p className="text-sm font-bold text-green-700">✨ Bereit zum Veröffentlichen</p>
                  <p className="text-xs text-green-600 mt-1">Wird auf {form.platforms.length} Plattform{form.platforms.length>1?'en':''} gepostet.</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step>1&&<button onClick={()=>setStep(s=>s-1)} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">← Zurück</button>}
            <button onClick={handleNext} disabled={loading||uploading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-colors">
              {loading ? 'Wird gespeichert…' : step<3 ? 'Weiter →' : '🚀 Listing erstellen & posten'}
            </button>
          </div>
        </div>
      </main>
      <MobileNav/>
    </div>
  )
}
