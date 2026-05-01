'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { fmt, PLATFORMS } from '@/components/Badge'

export default function Belege() {
  const router = useRouter()
  const [listings, setListings]   = useState([])
  const [settings, setSettings]   = useState({})
  const [selMonth, setSelMonth]   = useState('')
  const [selYear, setSelYear]     = useState(String(new Date().getFullYear()))
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/listings').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([ls, s]) => {
      setListings(Array.isArray(ls) ? ls.filter(l => l.status === 'verkauft') : [])
      setSettings(s || {})
      setLoading(false)
    })
  }, [])

  const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
  const years = [...new Set(listings.map(l => new Date(l.updatedAt||l.createdAt).getFullYear()))].sort((a,b)=>b-a)

  const filtered = listings.filter(l => {
    const d = new Date(l.updatedAt||l.createdAt)
    if (selYear && String(d.getFullYear()) !== selYear) return false
    if (selMonth && String(d.getMonth()+1).padStart(2,'0') !== selMonth) return false
    return true
  })

  const monthLabel = selMonth ? `${MONTHS[Number(selMonth)-1]} ${selYear}` : selYear

  function printMonthly() {
    const ids = filtered.map(l => l.id).join(',')
    window.open(`/belege/monthly?ids=${ids}&month=${monthLabel}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-60 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Belege</h1>
              <p className="text-gray-400 text-sm mt-0.5">Druckfertige Belege für deine Verkäufe</p>
            </div>
            <button onClick={() => router.push('/settings#business')}
              className="text-sm text-indigo-600 font-semibold hover:underline">
              Geschäftsinfo ⚙
            </button>
          </div>

          {!settings.shopName && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              <strong>Tipp:</strong> Hinterlege deinen Namen/Shopnamen in den{' '}
              <button onClick={() => router.push('/settings')} className="underline font-semibold">Einstellungen</button>
              {' '}damit er auf deinen Belegen erscheint.
            </div>
          )}

          {/* Filter + Monthly button */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 flex-wrap items-center">
            <select value={selYear} onChange={e => setSelYear(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selMonth} onChange={e => setSelMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white">
              <option value="">Alle Monate</option>
              {MONTHS.map((m,i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
            </select>
            <span className="text-sm text-gray-400">{filtered.length} Verkäufe</span>
            <button onClick={printMonthly} disabled={filtered.length === 0}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Sammelbeleg drucken
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Lade…</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-100">
                Keine Verkäufe in diesem Zeitraum
              </div>
            ) : (
              filtered.map((l, i) => (
                <div key={l.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    #{filtered.length - i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(l.updatedAt||l.createdAt).toLocaleDateString('de')} ·{' '}
                      {(l.platforms||[]).map(p => PLATFORMS[p]?.name || p).join(', ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-extrabold text-gray-900">{fmt(l.price)}</p>
                    <p className="text-xs text-green-600 font-semibold">+{fmt(l.price - (l.buyPrice||0))} Gewinn</p>
                  </div>
                  <button onClick={() => window.open(`/belege/${l.id}`, '_blank')}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl text-sm font-semibold transition-colors border border-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                    Beleg
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </main>
      <MobileNav />
    </div>
  )
}
