'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PLATFORMS } from '@/components/Badge'

export default function Settings() {
  const [goals, setGoals]           = useState({ day: 0, month: 0 })
  const [relistDays, setRelistDays] = useState(5)
  const [business, setBusiness]     = useState({ shopName:'', address:'', taxId:'', kleinunternehmer:true })
  const [platforms, setPlatforms]   = useState({})
  const [modal, setModal]           = useState(null)
  const [creds, setCreds]           = useState({ apiKey: '', username: '', password: '' })
  const [toast, setToast]           = useState(null)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r=>r.json()).then(s=>{
      if (s.dayGoal    !== undefined) setGoals({ day: s.dayGoal, month: s.monthGoal })
      if (s.relistDays !== undefined) setRelistDays(s.relistDays)
      setBusiness({ shopName: s.shopName||'', address: s.address||'', taxId: s.taxId||'', kleinunternehmer: s.kleinunternehmer !== false })
    })
    fetch('/api/platforms').then(r=>r.json()).then(list=>{
      const map = {}
      list.forEach(p => { map[p.platform] = p })
      setPlatforms(map)
    })
  }, [])

  const showToast = (msg, color='green') => {
    setToast({ msg, color })
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
    } catch { showToast('Fehler beim Speichern', 'red') }
    finally { setSaving(false) }
  }

  const openModal = (id) => {
    const p = PLATFORMS[id]
    const existing = platforms[id] || {}
    setCreds({ apiKey: existing.apiKey || '', username: existing.username || '', password: '' })
    setModal({ id, name: p.name, type: id === 'ebay' ? 'api' : 'login' })
  }

  const connectPlatform = async () => {
    if (!modal) return
    const { id, type } = modal
    const body = { platform: id, connected: true }
    if (type === 'api')   body.apiKey   = creds.apiKey
    if (type === 'login') body.username = creds.username
    try {
      const res = await fetch('/api/platforms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const updated = await res.json()
      setPlatforms(prev => ({ ...prev, [id]: updated }))
      setModal(null)
      showToast(`✅ ${PLATFORMS[id].name} verbunden!`)
    } catch { showToast('Fehler beim Verbinden', 'red') }
  }

  const disconnectPlatform = async (id) => {
    try {
      await fetch('/api/platforms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: id, connected: false })
      })
      setPlatforms(prev => ({ ...prev, [id]: { ...prev[id], connected: false } }))
      showToast(`${PLATFORMS[id].name} getrennt`)
    } catch { showToast('Fehler', 'red') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar/>
      <main className="md:ml-60 pb-20 md:pb-8">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
          <h1 className="text-2xl font-extrabold text-gray-900">Einstellungen</h1>

          {/* Business info */}
          <div id="business" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold text-gray-900">🏪 Geschäftsinfo (für Belege)</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name / Shopname</label>
              <input type="text" value={business.shopName} onChange={e=>setBusiness(b=>({...b,shopName:e.target.value}))}
                placeholder="Dein Name oder Shopname"
                className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse</label>
              <textarea rows={3} value={business.address} onChange={e=>setBusiness(b=>({...b,address:e.target.value}))}
                placeholder={"Musterstraße 1\n12345 Musterstadt"}
                className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm resize-none"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Steuernummer (optional)</label>
              <input type="text" value={business.taxId} onChange={e=>setBusiness(b=>({...b,taxId:e.target.value}))}
                placeholder="12/345/67890"
                className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm"/>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="klein" checked={business.kleinunternehmer}
                onChange={e=>setBusiness(b=>({...b,kleinunternehmer:e.target.checked}))}
                className="w-4 h-4 accent-indigo-600"/>
              <label htmlFor="klein" className="text-sm font-semibold text-gray-700">
                Kleinunternehmer nach §19 UStG (keine Umsatzsteuer)
              </label>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold text-gray-900">🎯 Umsatzziele</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tagesziel (€)</label>
                <input type="number" min="0" value={goals.day}
                  onChange={e=>setGoals(g=>({...g,day:Number(e.target.value)}))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monatsziel (€)</label>
                <input type="number" min="0" value={goals.month}
                  onChange={e=>setGoals(g=>({...g,month:Number(e.target.value)}))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm"/>
              </div>
            </div>
          </div>

          {/* Relist */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold text-gray-900">🔄 Relisting-Erinnerung</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Erinnere mich nach</label>
              <div className="flex items-center gap-3">
                <input type="number" min="1" max="60" value={relistDays}
                  onChange={e=>setRelistDays(Number(e.target.value))}
                  className="w-24 px-4 py-3 bg-white border border-gray-200 focus:border-indigo-400 rounded-xl text-sm font-bold text-center"/>
                <span className="text-sm text-gray-600 font-medium">Tagen ohne Verkauf</span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {[3,5,7,14].map(d=>(
                  <button key={d} onClick={()=>setRelistDays(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${relistDays===d?'bg-indigo-600 text-white border-indigo-600':'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                    {d} Tage
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Accounts */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold text-gray-900">Plattform-Konten</h2>
            {Object.entries(PLATFORMS).map(([id, p]) => {
              const acc = platforms[id] || {}
              const connected = acc.connected
              return (
                <div key={id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <span style={{width:8,height:8,borderRadius:'50%',background:p.dot,display:'inline-block'}}/>
                    <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                    {id==='ebay'
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">API</span>
                      : <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Login</span>}
                    {connected && <span className="text-xs text-green-600 font-semibold">● Verbunden{acc.username ? ` (${acc.username})` : ''}</span>}
                  </div>
                  {connected
                    ? <button onClick={()=>disconnectPlatform(id)}
                        className="text-sm px-4 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors">
                        Trennen
                      </button>
                    : <button onClick={()=>openModal(id)}
                        className="text-sm px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition-colors">
                        Verbinden
                      </button>}
                </div>
              )
            })}
          </div>

          {/* Plan */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Plan</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Freemium</span>
            </div>
            <button className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm">
              ✨ Auf Pro upgraden – ab 9€/Monat
            </button>
          </div>

          <button onClick={saveSettings} disabled={saving}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-colors">
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </main>
      <MobileNav/>

      {/* Connect Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-gray-900">{modal.name} verbinden</h3>
              <button onClick={()=>setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold hover:bg-gray-200">✕</button>
            </div>

            {modal.type === 'api' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">eBay API-Schlüssel</label>
                <input value={creds.apiKey} onChange={e=>setCreds(c=>({...c,apiKey:e.target.value}))}
                  placeholder="App ID / Production Key"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-indigo-400"/>
                <p className="text-xs text-gray-400 mt-2">Erhältlich unter developer.ebay.com → My Account → Application Keys</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Benutzername / E-Mail</label>
                  <input value={creds.username} onChange={e=>setCreds(c=>({...c,username:e.target.value}))}
                    placeholder={`Dein ${modal.name}-Benutzername`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-indigo-400"/>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <strong>Hinweis:</strong> Das Posting auf {modal.name} läuft über die ListSync Chrome Extension. Dein Account wird nur zur Anzeige gespeichert.
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={()=>setModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50">Abbrechen</button>
              <button onClick={connectPlatform}
                disabled={modal.type==='api'?!creds.apiKey.trim():!creds.username.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold transition-colors">
                Verbinden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl whitespace-nowrap ${toast.color==='red'?'bg-red-600':'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
