'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PLATFORMS, fmt } from '@/components/Badge'

const PLATFORM_FEE = {
  ebay:         0.13, // ~13%
  vinted:       0,    // Käufer zahlt Gebühr
  kleinanzeigen:0,
}

function fee(listing) {
  const platforms = listing.platforms || []
  if (platforms.includes('ebay')) return listing.price * PLATFORM_FEE.ebay
  return 0
}

function netProfit(listing) {
  return listing.price - (listing.buyPrice || 0) - fee(listing)
}

function margin(listing) {
  if (!listing.buyPrice || listing.buyPrice === 0) return null
  return (netProfit(listing) / listing.price) * 100
}

function downloadCSV(rows, filename) {
  const headers = ['Nr.','Artikel','Status','Einkaufspreis','Verkaufspreis','Plattform-Gebühr','Gewinn (netto)','Marge %','Plattformen','Datum']
  const lines = [headers.join(';'), ...rows.map(r => [
    r.id,
    `"${r.title.replace(/"/g,'""')}"`,
    r.status,
    r.buyPrice?.toFixed(2).replace('.',',') || '0,00',
    r.price?.toFixed(2).replace('.',','),
    fee(r).toFixed(2).replace('.',','),
    netProfit(r).toFixed(2).replace('.',','),
    margin(r) !== null ? margin(r).toFixed(1).replace('.',',') : '',
    (r.platforms||[]).join(', '),
    new Date(r.updatedAt || r.createdAt).toLocaleDateString('de'),
  ].join(';'))]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = filename; a.click()
}

export default function Buchhaltung() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [month, setMonth]       = useState('')   // '' = all
  const [year, setYear]         = useState(String(new Date().getFullYear()))
  const [statusFilter, setStatus] = useState('verkauft')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/listings').then(r => r.json()).then(data => {
      setListings(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  const years = useMemo(() => {
    const ys = new Set(listings.map(l => new Date(l.updatedAt||l.createdAt).getFullYear()))
    return Array.from(ys).sort((a,b) => b-a)
  }, [listings])

  const filtered = useMemo(() => {
    return listings.filter(l => {
      const d = new Date(l.updatedAt || l.createdAt)
      if (year && String(d.getFullYear()) !== year) return false
      if (month && String(d.getMonth()+1).padStart(2,'0') !== month) return false
      if (statusFilter !== 'alle' && l.status !== statusFilter) return false
      return true
    })
  }, [listings, year, month, statusFilter])

  const totals = useMemo(() => ({
    revenue:  filtered.reduce((s,l) => s + l.price, 0),
    purchase: filtered.reduce((s,l) => s + (l.buyPrice||0), 0),
    fees:     filtered.reduce((s,l) => s + fee(l), 0),
    profit:   filtered.reduce((s,l) => s + netProfit(l), 0),
  }), [filtered])

  const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

  function exportCSV() {
    const label = month ? `${MONTHS[Number(month)-1]}-${year}` : year
    downloadCSV(filtered, `ListSync-Buchhaltung-${label}.csv`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-60 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Buchhaltung</h1>
              <p className="text-gray-400 text-sm mt-0.5">Einnahmen, Ausgaben & Gewinne im Überblick</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Excel exportieren
              </button>
              <button onClick={() => router.push('/belege')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Belege
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 flex-wrap items-center">
            <select value={year} onChange={e => setYear(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white focus:border-indigo-400">
              <option value="">Alle Jahre</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white focus:border-indigo-400">
              <option value="">Alle Monate</option>
              {MONTHS.map((m,i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white focus:border-indigo-400">
              <option value="alle">Alle</option>
              <option value="verkauft">Nur Verkäufe</option>
              <option value="aktiv">Nur Aktive</option>
            </select>
            <span className="text-sm text-gray-400 ml-auto">{filtered.length} Einträge</span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Umsatz',     value: fmt(totals.revenue),  color:'text-indigo-600', bg:'bg-indigo-50' },
              { label:'Einkauf',    value: fmt(totals.purchase), color:'text-red-600',    bg:'bg-red-50'    },
              { label:'Gebühren',   value: fmt(totals.fees),     color:'text-amber-600',  bg:'bg-amber-50'  },
              { label:'Gewinn (netto)', value: fmt(totals.profit), color: totals.profit >= 0 ? 'text-green-600' : 'text-red-600', bg:'bg-green-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Lade Daten…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Keine Einträge für diesen Zeitraum</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      {['#','Artikel','EK','VK','Gebühr','Gewinn','Marge','Plattform','Datum',''].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l, i) => {
                      const m = margin(l)
                      const np = netProfit(l)
                      return (
                        <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i+1}</td>
                          <td className="px-4 py-3 max-w-[180px]">
                            <p className="font-semibold text-gray-900 truncate">{l.title}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${l.status==='verkauft'?'bg-green-100 text-green-700':l.status==='aktiv'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'}`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(l.buyPrice||0)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmt(l.price)}</td>
                          <td className="px-4 py-3 text-amber-600 whitespace-nowrap">{fee(l) > 0 ? `−${fmt(fee(l))}` : '—'}</td>
                          <td className={`px-4 py-3 font-bold whitespace-nowrap ${np >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(np)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {m !== null ? (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m >= 30 ? 'bg-green-100 text-green-700' : m >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {m.toFixed(0)}%
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {(l.platforms||[]).map(p => PLATFORMS[p]?.name || p).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                            {new Date(l.updatedAt||l.createdAt).toLocaleDateString('de')}
                          </td>
                          <td className="px-4 py-3">
                            {l.status === 'verkauft' && (
                              <button onClick={() => router.push(`/belege/${l.id}`)}
                                className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 whitespace-nowrap">
                                Beleg
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={2} className="px-4 py-3 font-bold text-gray-900 text-xs uppercase">Gesamt</td>
                      <td className="px-4 py-3 font-bold text-gray-700">{fmt(totals.purchase)}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{fmt(totals.revenue)}</td>
                      <td className="px-4 py-3 font-bold text-amber-600">{totals.fees > 0 ? `−${fmt(totals.fees)}` : '—'}</td>
                      <td className={`px-4 py-3 font-extrabold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(totals.profit)}</td>
                      <td colSpan={4}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
      <MobileNav />
    </div>
  )
}
