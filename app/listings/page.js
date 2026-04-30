'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PlatformBadge, StatusBadge, PLATFORMS, fmt, profit, CARD_COLORS } from '@/components/Badge'

export default function Listings() {
  const [listings, setListings]         = useState([])
  const [filter, setFilter]             = useState('alle')
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(null)
  const [toast, setToast]               = useState(null)
  const [selPlatforms, setSelPlatforms] = useState([])
  const [relistDays, setRelistDays]     = useState(5)
  useEffect(() => {
    fetch('/api/listings').then(r=>r.json()).then(setListings)
    fetch('/api/settings').then(r=>r.json()).then(s => { if(s.relistDays) setRelistDays(s.relistDays) })
    // Auch auf Event hören (falls Extension noch lädt)

  }, [])

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  const needsRelist = (l) => {
    if (l.status !== 'aktiv') return false
    const created = new Date(l.relistedAt || l.createdAt)
    const diffDays = Math.floor((Date.now() - created.getTime()) / (1000*60*60*24))
    return diffDays >= relistDays
  }

  const doRelist = async (id) => {
    const res = await fetch(`/api/listings/${id}/relist`, { method: 'POST' })
    const updated = await res.json()
    setListings(ls => ls.map(l => l.id===id ? { ...l, days: 0, relistedAt: updated.relistedAt, status: 'aktiv' } : l))
    showToast('Erneut gelistet! Erinnerung zurückgesetzt ✅')
    setModal(null)
  }

  const markSold = async (id) => {
    await fetch(`/api/listings/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'verkauft'}) })
    setListings(ls => ls.map(l => l.id===id ? {...l, status:'verkauft'} : l))
    showToast('Verkauft! Listings deaktiviert ✅')
    setModal(null)
  }

  const doPost = async (id) => {
    const listing = listings.find(l => l.id === id)
    await fetch(`/api/listings/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({platforms: selPlatforms}) })
    setListings(ls => ls.map(l => l.id===id ? {...l, platforms: selPlatforms} : l))

    // Prüfe ob Extension-Plattformen dabei sind
    const extPlatforms = selPlatforms.filter(p => p === 'vinted' || p === 'kleinanzeigen')
    if (extPlatforms.length > 0 && listing) {
      window.postMessage({ type: 'LISTSYNC_POST', listing, platforms: extPlatforms }, '*')
      showToast(`Öffne ${extPlatforms.join(' & ')}… 🚀`)
    } else {
      showToast(`Auf ${selPlatforms.length} Plattform${selPlatforms.length>1?'en':''} gepostet! 🚀`)
    }
    setModal(null)
  }

  const relistAlerts = listings.filter(needsRelist)

  const tabs = [
    {id:'alle',    label:'Alle',    count:listings.length},
    {id:'aktiv',   label:'Aktiv',   count:listings.filter(l=>l.status==='aktiv').length},
    {id:'verkauft',label:'Verkauft',count:listings.filter(l=>l.status==='verkauft').length},
    {id:'inaktiv', label:'Inaktiv', count:listings.filter(l=>l.status==='inaktiv').length},
  ]
  const visible = listings.filter(l => (filter==='alle'||l.status===filter) && (!search||l.title.toLowerCase().includes(search.toLowerCase())))
  const modalListing = modal ? listings.find(l=>l.id===modal.id) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeCount={listings.filter(l=>l.status==='aktiv').length}/>
      <main className="md:ml-60 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-gray-900">Meine Listings</h1>
            <span className="text-sm text-gray-400">{visible.length} Artikel</span>
          </div>

          {/* Relist Alerts */}
          {relistAlerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-bold text-amber-800">🔄 {relistAlerts.length} Artikel sollten erneut gelistet werden</p>
              {relistAlerts.map(l => (
                <div key={l.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                  <span className="text-sm text-gray-700 font-medium truncate flex-1 mr-2">{l.title}</span>
                  <button onClick={()=>doRelist(l.id)}
                    className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex-shrink-0 transition-colors">
                    Relisten
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" placeholder="Durchsuchen…" value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-indigo-400"/>
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setFilter(t.id)}
                className={`flex-1 py-1.5 px-1 rounded-lg text-xs md:text-sm font-semibold transition-colors ${filter===t.id?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
                {t.label} <span className={filter===t.id?'text-indigo-500':'text-gray-400'}>({t.count})</span>
              </button>
            ))}
          </div>

          {visible.length===0 ? (
            <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📦</p><p className="font-semibold">Keine Listings gefunden</p></div>
          ) : (
            <div className="space-y-3">
              {visible.map(l => {
                const imgs = Array.isArray(l.images) ? l.images : []
                const aged = needsRelist(l)
                return (
                  <div key={l.id} className={`bg-white rounded-2xl p-4 shadow-sm border transition-colors ${aged?'border-amber-200 hover:border-amber-300':'border-gray-100 hover:border-indigo-200'}`}>
                    <div className="flex items-start gap-3">
                      {imgs.length > 0
                        ? <img src={imgs[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-100"/>
                        : <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-xl font-extrabold text-gray-500"
                            style={{background:CARD_COLORS[l.id%5]}}>{l.title.charAt(0)}</div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-gray-900 text-sm leading-snug">{l.title}</p>
                          <p className="font-extrabold text-gray-900 text-sm flex-shrink-0">{fmt(l.price)}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{l.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <StatusBadge status={l.status}/>
                          {aged && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">⏰ Relist</span>}
                          {l.platforms.map(p=><PlatformBadge key={p} plt={p}/>)}
                          <span className="text-xs text-gray-400 ml-auto">{l.views} Views</span>
                        </div>
                      </div>
                    </div>
                    {l.status==='aktiv' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                        {aged && (
                          <button onClick={()=>doRelist(l.id)}
                            className="flex-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold">🔄 Relisten</button>
                        )}
                        <button onClick={()=>{setSelPlatforms([...l.platforms]);setModal({type:'crosspost',id:l.id})}}
                          className="flex-1 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold">🔗 Crossposten</button>
                        <button onClick={()=>setModal({type:'sold',id:l.id})}
                          className="flex-1 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold">✅ Verkauft</button>
                      </div>
                    )}
                    {l.status==='inaktiv' && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <button onClick={()=>doRelist(l.id)}
                          className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold">🔄 Relisten</button>
                      </div>
                    )}
                    {l.status==='verkauft' && (
                      <div className="mt-3 pt-3 border-t border-gray-50 flex gap-3">
                        <p className="text-xs text-gray-400">Einkauf: {fmt(l.buyPrice)}</p>
                        <span className="text-gray-200">·</span>
                        <p className="text-xs text-emerald-600 font-bold">Gewinn: +{fmt(profit(l))}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <MobileNav/>

      {/* Crosspost Modal */}
      {modal?.type==='crosspost' && modalListing && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-5">
              <h2 className="text-lg font-extrabold">Crossposten</h2>
              <button onClick={()=>setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 font-bold">×</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="font-bold text-sm">{modalListing.title}</p>
              <p className="text-xs text-gray-500 mt-1">{modalListing.condition} · {fmt(modalListing.price)}</p>
            </div>
            <div className="space-y-3 mb-5">
              {Object.entries(PLATFORMS).map(([id,p]) => {
                const sel = selPlatforms.includes(id)
                return (
                  <div key={id} onClick={()=>setSelPlatforms(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${sel?'border-indigo-400 bg-indigo-50/30':'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel?'border-indigo-600 bg-indigo-600':'border-gray-300'}`}>
                        {sel&&<span className="text-white text-xs font-extrabold">✓</span>}
                      </div>
                      <PlatformBadge plt={id}/>
                    </div>
                    {sel && (
                      <div className={`mt-3 p-3 rounded-xl ${p.bg} border ${p.border}`}>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Optimierter Titel</p>
                        <p className={`text-sm font-semibold ${p.text}`}>
                          {id==='ebay'?(modalListing.title+' | Top Zustand ✅').substring(0,80):id==='vinted'?modalListing.title.substring(0,60):modalListing.title+' (VHB)'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={()=>doPost(modalListing.id)} disabled={selPlatforms.length===0}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold transition-colors">
              {selPlatforms.length>0?`🚀 Auf ${selPlatforms.length} Plattform${selPlatforms.length>1?'en':''} posten`:'Plattform auswählen'}
            </button>
          </div>
        </div>
      )}

      {/* Sold Modal */}
      {modal?.type==='sold' && modalListing && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-5">
              <h2 className="text-lg font-extrabold">Als verkauft markieren</h2>
              <button onClick={()=>setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 font-bold">×</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="font-bold text-sm">{modalListing.title}</p>
              <p className="text-xs text-emerald-600 font-bold mt-1">Gewinn: +{fmt(profit(modalListing))}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-bold text-amber-800">⚠️ Wird auf allen Plattformen deaktiviert</p>
              <div className="flex gap-2 mt-2 flex-wrap">{modalListing.platforms.map(p=><PlatformBadge key={p} plt={p}/>)}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50">Abbrechen</button>
              <button onClick={()=>markSold(modalListing.id)} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold">✅ Bestätigen</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl ${toast.type==='success'?'bg-green-600':'bg-red-500'} flex items-center gap-2 whitespace-nowrap`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
