'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PlatformBadge, StatusBadge, PLATFORMS, fmt, profit, CARD_COLORS } from '@/components/Badge'

// ── Chart helpers ─────────────────────────────────────────────────────────────

function buildChartData(sold, period) {
  const now = new Date()

  if (period === 'tag') {
    // Bars: last 7 days
    const days = ['So','Mo','Di','Mi','Do','Fr','Sa']
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)
      const next = new Date(d); next.setDate(next.getDate() + 1)
      const v = sold
        .filter(l => { const t = new Date(l.createdAt); return t >= d && t < next })
        .reduce((s, l) => s + l.price, 0)
      return { l: days[d.getDay()], v }
    })
  }

  if (period === 'monat') {
    // Bars: last 6 months
    const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const v = sold
        .filter(l => { const t = new Date(l.createdAt); return t >= d && t < next })
        .reduce((s, l) => s + l.price, 0)
      return { l: months[d.getMonth()], v }
    })
  }

  // jahr: last 3 years
  return Array.from({ length: 3 }, (_, i) => {
    const year = now.getFullYear() - (2 - i)
    const v = sold
      .filter(l => new Date(l.createdAt).getFullYear() === year)
      .reduce((s, l) => s + l.price, 0)
    return { l: String(year), v }
  })
}

function getPeriodStats(sold, period) {
  const now = new Date()
  let from
  if (period === 'tag') {
    from = new Date(now); from.setHours(0, 0, 0, 0)
  } else if (period === 'monat') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    from = new Date(now.getFullYear(), 0, 1)
  }
  const matches = sold.filter(l => new Date(l.createdAt) >= from)
  return {
    revenue: matches.reduce((s, l) => s + l.price, 0),
    sales:   matches.length,
    label:   period === 'tag' ? 'Heute' : period === 'monat'
      ? new Date().toLocaleString('de', { month: 'long' })
      : String(now.getFullYear()),
  }
}

// ── BarChart component ────────────────────────────────────────────────────────

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.v), 1)
  const hasData = data.some(d => d.v > 0)
  return (
    <div className="flex items-end gap-1.5 px-1" style={{ height: 128 }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full relative group cursor-default">
            <div
              className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-md transition-all"
              style={{ height: hasData ? Math.max((d.v / max) * 100, d.v > 0 ? 4 : 0) : 0 }}
            />
            {d.v > 0 && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {fmt(d.v)}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 font-medium">{d.l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [listings, setListings]   = useState([])
  const [period, setPeriod]       = useState('monat')
  const [goals, setGoals]         = useState({ day: 0, month: 0 })
  const [relistDays, setRelistDays] = useState(5)
  const [loading, setLoading]     = useState(true)
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      fetch('/api/listings').then(r => r.json()).catch(() => []),
      fetch('/api/settings').then(r => r.json()).catch(() => ({})),
    ]).then(([listingsData, settings]) => {
      setListings(Array.isArray(listingsData) ? listingsData : [])
      if (settings.dayGoal  !== undefined) setGoals({ day: settings.dayGoal, month: settings.monthGoal })
      if (settings.relistDays !== undefined) setRelistDays(settings.relistDays)
      setLoading(false)
    })
  }, [])

  const sold   = listings.filter(l => l.status === 'verkauft')
  const active = listings.filter(l => l.status === 'aktiv')
  const relistAlerts = active.filter(l => l.days >= relistDays)

  const chartData = buildChartData(sold, period)
  const meta      = getPeriodStats(sold, period)
  const goalVal   = period === 'tag' ? goals.day : goals.month
  const goalPct   = goalVal > 0 ? Math.min((meta.revenue / goalVal) * 100, 100) : 0

  const pltBreakdown = Object.entries(PLATFORMS).map(([id, p]) => {
    const matches = sold.filter(l => l.platforms.includes(id))
    return { id, ...p, count: matches.length, revenue: matches.reduce((s, l) => s + l.price, 0) }
  })
  const totalRev = sold.reduce((s, l) => s + l.price, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeCount={active.length} />
      <main className="md:ml-60 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
              <p className="text-gray-400 text-sm mt-0.5">Dein Überblick auf einen Blick</p>
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0">
              {['tag', 'monat', 'jahr'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Relist alerts */}
          {relistAlerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔄</span>
                <p className="font-bold text-amber-900 text-sm">{relistAlerts.length} Listing{relistAlerts.length > 1 ? 's' : ''} älter als {relistDays} Tage</p>
              </div>
              <div className="space-y-2">
                {relistAlerts.map(l => (
                  <div key={l.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-amber-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{l.title}</p>
                      <p className="text-xs text-amber-600">Seit {l.days} Tagen · {l.views} Views</p>
                    </div>
                    <button onClick={() => router.push('/listings')} className="ml-3 text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors">Relisten</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: `Umsatz (${meta.label})`, value: fmt(meta.revenue), color: 'text-indigo-600' },
              { label: `Verkäufe (${meta.label})`, value: meta.sales, color: 'text-green-600' },
              { label: 'Aktive Listings', value: active.length },
              { label: 'Gewinn gesamt', value: fmt(sold.reduce((s, l) => s + profit(l), 0)), color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide leading-tight">{s.label}</p>
                <p className={`text-2xl font-extrabold mt-1 ${s.color || 'text-gray-900'}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">Umsatzverlauf</h2>
            {!loading && sold.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
                Noch keine Verkäufe — Daten erscheinen sobald du Listings als verkauft markierst
              </div>
            ) : (
              <BarChart data={chartData} />
            )}
          </div>

          {/* Goal */}
          {period !== 'jahr' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-gray-900">{period === 'tag' ? 'Tagesziel' : 'Monatsziel'}</h2>
                {goalVal > 0
                  ? <span className="text-sm font-bold text-gray-900">{fmt(meta.revenue)} / {fmt(goalVal)}</span>
                  : <button onClick={() => router.push('/settings')} className="text-xs text-indigo-600 font-semibold hover:underline">Ziel setzen →</button>
                }
              </div>
              {goalVal > 0 ? (
                <>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${goalPct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${goalPct}%` }} />
                  </div>
                  <p className={`text-xs mt-1 ${goalPct >= 100 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                    {goalPct >= 100 ? '🎉 Ziel erreicht!' : `Noch ${fmt(Math.max(goalVal - meta.revenue, 0))} bis zum Ziel · ${Math.round(goalPct)}%`}
                  </p>
                </>
              ) : (
                <div className="text-sm text-gray-400 text-center py-2">
                  Kein Ziel gesetzt — lege eines in den Einstellungen fest
                </div>
              )}
            </div>
          )}

          {/* Platform breakdown */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">Verkäufe nach Plattform</h2>
            {sold.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Noch keine Verkäufe 🚀</p>
            ) : (
              <div className="space-y-3">
                {pltBreakdown.filter(p => p.count > 0).map(p => (
                  <div key={p.id}>
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.dot, display: 'inline-block' }} />
                        <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{fmt(p.revenue)}</span>
                        <span className="text-xs text-gray-400 ml-2">{p.count} Verkauf{p.count !== 1 ? 'e' : ''}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${totalRev > 0 ? (p.revenue / totalRev) * 100 : 0}%`, background: p.dot }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent listings */}
          {listings.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between mb-4">
                <h2 className="font-bold text-gray-900">Letzte Listings</h2>
                <button onClick={() => router.push('/listings')} className="text-indigo-600 text-sm font-semibold hover:underline">Alle →</button>
              </div>
              <div className="space-y-2">
                {listings.slice(0, 3).map(l => (
                  <div key={l.id} onClick={() => router.push('/listings')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-extrabold text-gray-500"
                      style={{ background: CARD_COLORS[l.id % 5] }}>{l.title.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{l.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <StatusBadge status={l.status} />
                        {l.platforms.slice(0, 2).map(p => <PlatformBadge key={p} plt={p} />)}
                      </div>
                    </div>
                    <p className="font-extrabold text-gray-900 text-sm flex-shrink-0">{fmt(l.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && listings.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-bold text-gray-900 mb-1">Noch keine Listings</h3>
              <p className="text-sm text-gray-400 mb-4">Erstelle dein erstes Listing und starte durch!</p>
              <button onClick={() => router.push('/new')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">
                + Erstes Listing erstellen
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push('/new')} className="py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-colors">+ Neues Listing</button>
            <button onClick={() => router.push('/listings')} className="py-3.5 bg-white hover:bg-gray-50 text-gray-800 rounded-2xl font-bold text-sm border border-gray-200 transition-colors">Alle Listings →</button>
          </div>

        </div>
      </main>
      <MobileNav />
    </div>
  )
}
