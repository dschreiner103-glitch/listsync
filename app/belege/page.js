'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PLATFORMS } from '@/components/Badge'

function fmt(n) { return (n || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) }

export default function Belege() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('verkauft') // 'verkauft' | 'einkauf'
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
    // Create receipt with sequential number
    const res = await fetch('/api/receipts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type: 'sale', listingId: listing.id, totalNet: listing.price }),
    })
    const receipt = await res.json()
    window.open(`/belege/${listing.id}?rn=${receipt.receiptNo}`, '_blank')
  }

  async function openEinkaufBeleg(listing) {
    const res = await fetch('/api/receipts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type: 'purchase', listingId: listing.id, totalNet: listing.buyPrice }),
    })
    const receipt = await res.json()
    window.open(`/belege/${listing.id}?rn=${receipt.receiptNo}&type=purchase`, '_blank')
  }

  async function openSammelbeleg() {
    const items = tab === 'verkauft' ? sales : purchases
    if (!items.length) return
    const res = await fetch('/api/receipts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type:       'monthly',
        periodFrom: dateFrom || null,
        periodTo:   dateTo   || null,
        totalNet:   tab === 'verkauft' ? totalRevenue : totalEK,
      }),
    })
    const receipt = await res.json()
    const ids = items.map(l => l.id).join(',')
    const label = [dateFrom, dateTo].filter(Boolean).join(' – ') || 'Alle'
    window.open(`/belege/monthly?ids=${ids}&month=${encodeURIComponent(label)}&rn=${receipt.receiptNo}&type=${tab}`, '_blank')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-60 flex items-center justify-center h-screen">
        <p className="text-gray-400">Lade…</p>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-60 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">🧾 Belege</h1>
              <p className="text-sm text-gray-500 mt-0.5">Finanzamt-konforme Belege für Einkäufe & Verkäufe</p>
            </div>
            {!settings.shopName && (
              <button onClick={() => router.push('/settings')}
                className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg font-semibold">
                ⚠️ Bitte Geschäftsinfo in Einstellungen hinterlegen
              </button>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Verkäufe im Zeitraum</p>
              <p className="text-2xl font-black text-gray-900">{sales.length}</p>
              <p className="text-sm font-bold text-indigo-600 mt-0.5">{fmt(totalRevenue)} Umsatz</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Einkäufe im Zeitraum</p>
              <p className="text-2xl font-black text-gray-900">{purchases.length}</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">{fmt(totalEK)} Einkauf</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Zeitraum & Typ</p>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2">
                <button onClick={() => setTab('verkauft')}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition ${tab === 'verkauft' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  Verkaufsbelege
                </button>
                <button onClick={() => setTab('einkauf')}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition ${tab === 'einkauf' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  Einkaufsbelege
                </button>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <label className="text-xs text-gray-500 font-semibold whitespace-nowrap">Von</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0"/>
                <label className="text-xs text-gray-500 font-semibold whitespace-nowrap">Bis</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0"/>
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(''); setDateTo('') }}
                    className="text-xs text-gray-400 hover:text-red-500 font-bold px-1">✕</button>
                )}
              </div>
            </div>
            <button onClick={openSammelbeleg} disabled={!shown.length}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold">
              🖨️ Sammelbeleg für {shown.length} {tab === 'verkauft' ? 'Verkäufe' : 'Einkäufe'} erstellen
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {shown.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                {tab === 'verkauft' ? 'Keine Verkäufe im gewählten Zeitraum.' : 'Keine Einkäufe im gewählten Zeitraum.'}
              </div>
            )}
            {shown.map(l => {
              const plt  = (l.platforms || []).map(p => PLATFORMS[p]?.name || p).join(', ') || '—'
              const date = new Date(l.updatedAt || l.createdAt).toLocaleDateString('de-DE')
              const amount = tab === 'verkauft' ? l.price : l.buyPrice
              return (
                <div key={l.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{l.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{plt} · {date}</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm shrink-0">{fmt(amount)}</p>
                  <button
                    onClick={() => tab === 'verkauft' ? openBeleg(l) : openEinkaufBeleg(l)}
                    className="shrink-0 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold">
                    Beleg
                  </button>
                </div>
              )
            })}
          </div>

        </div>
      </main>
      <MobileNav />
    </div>
  )
}
