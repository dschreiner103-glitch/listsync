'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PLATFORMS } from '@/components/Badge'

function fmtEur(n) { return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) }
function fee(l) { return (l.platforms||[]).includes('ebay') ? (l.price||0)*0.13 : 0 }
function netProfit(l) { return (l.price||0) - (l.buyPrice||0) - fee(l) }
function margin(l) {
  if (!l.buyPrice || l.buyPrice === 0 || !l.price) return null
  return (netProfit(l) / l.price) * 100
}

function downloadCSV(rows) {
  const h = ['Nr.','Artikel','Status','EK','VK','Gebühr','Gewinn','Marge%','Plattform','Datum']
  const lines = [h.join(';'), ...rows.map((l,i) => [
    i+1,
    `"${(l.title||'').replace(/"/g,'""')}"`,
    l.status,
    (l.buyPrice||0).toFixed(2).replace('.',','),
    (l.price||0).toFixed(2).replace('.',','),
    fee(l).toFixed(2).replace('.',','),
    netProfit(l).toFixed(2).replace('.',','),
    margin(l)!=null ? margin(l).toFixed(1).replace('.',',') : '',
    (l.platforms||[]).join(', '),
    new Date(l.updatedAt||l.createdAt).toLocaleDateString('de'),
  ].join(';'))]
  const blob = new Blob(['﻿'+lines.join('\n')],{type:'text/csv;charset=utf-8;'})
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `ListSync-Buchhaltung.csv`; a.click()
}

// ── Inline editable cell ──────────────────────────────────────────────────────
function EditCell({ value, type='text', onSave, className='' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  function start() { setVal(value); setEditing(true) }
  function cancel() { setEditing(false) }
  function save() {
    const v = type === 'number' ? parseFloat(String(val).replace(',','.')) || 0 : val
    onSave(v)
    setEditing(false)
  }

  if (editing) return (
    <input
      autoFocus
      type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key==='Enter') save(); if (e.key==='Escape') cancel() }}
      className="w-full border border-indigo-400 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      step={type==='number'?'0.01':undefined}
    />
  )

  return (
    <span
      onClick={start}
      title="Klicken zum Bearbeiten"
      className={`cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 rounded px-1 -mx-1 transition-colors group relative ${className}`}
    >
      {value}
      <span className="ml-1 opacity-0 group-hover:opacity-40 text-xs">✏️</span>
    </span>
  )
}

// ── Sort header ───────────────────────────────────────────────────────────────
function SortTh({ label, col, sort, setSort }) {
  const active = sort.col === col
  return (
    <th
      onClick={() => setSort(s => ({ col, dir: s.col===col && s.dir==='asc' ? 'desc' : 'asc' }))}
      className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-indigo-600 select-none"
    >
      {label}
      <span className="ml-1 text-gray-300">
        {active ? (sort.dir==='asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Buchhaltung() {
  const router = useRouter()
  const [listings, setListings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(null) // id of row being saved
  const [deleting, setDeleting]   = useState(null) // id of row being deleted
  const [confirmClear, setConfirmClear] = useState(false)
  const [month, setMonth]         = useState('')
  const [year, setYear]           = useState(String(new Date().getFullYear()))
  const [statusFilter, setStatus] = useState('alle')
  const [sort, setSort]           = useState({ col: 'date', dir: 'desc' })

  useEffect(() => {
    fetch('/api/listings').then(r => r.json()).then(d => {
      setListings(Array.isArray(d) ? d.map(l => ({
        ...l,
        platforms: Array.isArray(l.platforms) ? l.platforms : JSON.parse(l.platforms||'[]'),
      })) : [])
      setLoading(false)
    })
  }, [])

  const years = useMemo(() => {
    const ys = new Set(listings.map(l => new Date(l.updatedAt||l.createdAt).getFullYear()))
    return Array.from(ys).sort((a,b)=>b-a)
  }, [listings])

  const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

  const filtered = useMemo(() => {
    return listings.filter(l => {
      const d = new Date(l.updatedAt||l.createdAt)
      if (year  && String(d.getFullYear()) !== year) return false
      if (month && String(d.getMonth()+1).padStart(2,'0') !== month) return false
      if (statusFilter !== 'alle' && l.status !== statusFilter) return false
      return true
    })
  }, [listings, year, month, statusFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const { col, dir } = sort
    const mul = dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (col === 'date')   return mul * (new Date(a.updatedAt||a.createdAt) - new Date(b.updatedAt||b.createdAt))
      if (col === 'title')  return mul * (a.title||'').localeCompare(b.title||'','de')
      if (col === 'price')  return mul * ((a.price||0) - (b.price||0))
      if (col === 'buyPrice') return mul * ((a.buyPrice||0) - (b.buyPrice||0))
      if (col === 'profit') return mul * (netProfit(a) - netProfit(b))
      if (col === 'margin') { const ma=margin(a)??-999, mb=margin(b)??-999; return mul*(ma-mb) }
      if (col === 'fee')    return mul * (fee(a) - fee(b))
      if (col === 'status') return mul * (a.status||'').localeCompare(b.status||'','de')
      return 0
    })
    return arr
  }, [filtered, sort])

  const totals = useMemo(() => ({
    revenue:  filtered.reduce((s,l)=>s+(l.price||0),0),
    purchase: filtered.reduce((s,l)=>s+(l.buyPrice||0),0),
    fees:     filtered.reduce((s,l)=>s+fee(l),0),
    profit:   filtered.reduce((s,l)=>s+netProfit(l),0),
  }), [filtered])

  // Patch a listing field
  async function patch(id, data) {
    setSaving(id)
    const res = await fetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setListings(prev => prev.map(l => l.id === id ? {
      ...l, ...updated,
      platforms: Array.isArray(updated.platforms) ? updated.platforms : JSON.parse(updated.platforms||'[]'),
    } : l))
    setSaving(null)
  }

  async function deleteRow(id) {
    setDeleting(id)
    await fetch(`/api/listings/${id}`, { method: 'DELETE' })
    setListings(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  async function clearAll() {
    setConfirmClear(false)
    await fetch('/api/listings', { method: 'DELETE' })
    setListings([])
  }

  function patchDate(id, dateStr) {
    if (!dateStr) return
    patch(id, { updatedAt: new Date(dateStr).toISOString() })
  }

  function formatDateInput(l) {
    const d = new Date(l.updatedAt||l.createdAt)
    return d.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirm clear modal */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Tabelle wirklich leeren?</h3>
            <p className="text-sm text-gray-500 mb-5">Alle {listings.length} Einträge werden unwiderruflich gelöscht.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmClear(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm">
                Abbrechen
              </button>
              <button onClick={clearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm">
                Ja, alles löschen
              </button>
            </div>
          </div>
        </div>
      )}
      <Sidebar />
      <main className="md:ml-60 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">📊 Buchhaltung</h1>
              <p className="text-gray-400 text-sm mt-0.5">Klicke auf Zellen um sie zu bearbeiten · Spalten sortieren per Klick</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => downloadCSV(sorted)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm">
                ⬇ CSV
              </button>
              <button onClick={() => router.push('/belege')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm">
                🧾 Belege
              </button>
              <button onClick={() => setConfirmClear(true)}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-semibold text-sm">
                🗑 Alles löschen
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Umsatz',     val: fmtEur(totals.revenue),  color:'text-indigo-600', bg:'bg-indigo-50' },
              { label:'Einkauf',    val: fmtEur(totals.purchase), color:'text-red-600',    bg:'bg-red-50'    },
              { label:'Gebühren',   val: fmtEur(totals.fees),     color:'text-amber-600',  bg:'bg-amber-50'  },
              { label:'Netto-Gewinn', val: fmtEur(totals.profit), color: totals.profit>=0?'text-green-600':'text-red-600', bg:'bg-green-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-xl font-extrabold mt-1 ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-3 flex-wrap items-center">
            <select value={statusFilter} onChange={e=>setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white">
              <option value="alle">Alle Status</option>
              <option value="verkauft">Verkauft</option>
              <option value="aktiv">Aktiv</option>
              <option value="inaktiv">Inaktiv</option>
            </select>
            <select value={year} onChange={e=>setYear(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white">
              <option value="">Alle Jahre</option>
              {years.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <select value={month} onChange={e=>setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white">
              <option value="">Alle Monate</option>
              {MONTHS.map((m,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
            </select>
            <span className="text-sm text-gray-400 ml-auto">{sorted.length} Einträge</span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-gray-400">Lade…</div>
            ) : sorted.length === 0 ? (
              <div className="p-10 text-center text-gray-400">Keine Einträge</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">#</th>
                      <SortTh label="Artikel"  col="title"    sort={sort} setSort={setSort}/>
                      <SortTh label="Status"   col="status"   sort={sort} setSort={setSort}/>
                      <SortTh label="EK"       col="buyPrice" sort={sort} setSort={setSort}/>
                      <SortTh label="VK"       col="price"    sort={sort} setSort={setSort}/>
                      <SortTh label="Gebühr"   col="fee"      sort={sort} setSort={setSort}/>
                      <SortTh label="Gewinn"   col="profit"   sort={sort} setSort={setSort}/>
                      <SortTh label="Marge"    col="margin"   sort={sort} setSort={setSort}/>
                      <th className="px-3 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Plattform</th>
                      <SortTh label="Datum"    col="date"     sort={sort} setSort={setSort}/>
                      <th className="px-3 py-3"/>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((l, i) => {
                      const np = netProfit(l)
                      const mg = margin(l)
                      const isSaving = saving === l.id
                      return (
                        <tr key={l.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSaving ? 'opacity-60' : ''}`}>
                          <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{i+1}</td>

                          {/* Artikel – editierbar */}
                          <td className="px-3 py-2.5 max-w-[180px]">
                            <EditCell
                              value={l.title}
                              onSave={v => patch(l.id, { title: v })}
                              className="font-semibold text-gray-900 truncate block"
                            />
                          </td>

                          {/* Status – editierbar via select */}
                          <td className="px-3 py-2.5">
                            <select
                              value={l.status}
                              onChange={e => patch(l.id, { status: e.target.value })}
                              className={`text-xs font-bold px-2 py-0.5 rounded-full border-0 cursor-pointer
                                ${l.status==='verkauft'?'bg-green-100 text-green-700':
                                  l.status==='aktiv'?'bg-blue-100 text-blue-700':
                                  'bg-gray-100 text-gray-500'}`}
                            >
                              <option value="aktiv">aktiv</option>
                              <option value="verkauft">verkauft</option>
                              <option value="inaktiv">inaktiv</option>
                            </select>
                          </td>

                          {/* EK – editierbar */}
                          <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                            <EditCell
                              value={(l.buyPrice||0).toFixed(2).replace('.',',')}
                              type="number"
                              onSave={v => patch(l.id, { buyPrice: v })}
                            />
                          </td>

                          {/* VK – editierbar */}
                          <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">
                            <EditCell
                              value={(l.price||0).toFixed(2).replace('.',',')}
                              type="number"
                              onSave={v => patch(l.id, { price: v })}
                            />
                          </td>

                          <td className="px-3 py-2.5 text-amber-600 whitespace-nowrap">
                            {fee(l) > 0 ? `−${fmtEur(fee(l))}` : '—'}
                          </td>

                          <td className={`px-3 py-2.5 font-bold whitespace-nowrap ${np>=0?'text-green-600':'text-red-600'}`}>
                            {fmtEur(np)}
                          </td>

                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {mg !== null ? (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                ${mg>=30?'bg-green-100 text-green-700':mg>=10?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                                {mg.toFixed(0)}%
                              </span>
                            ) : '—'}
                          </td>

                          <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                            {(l.platforms||[]).map(p=>PLATFORMS[p]?.name||p).join(', ')||'—'}
                          </td>

                          {/* Datum – editierbar */}
                          <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                            <EditCell
                              value={formatDateInput(l)}
                              type="date"
                              onSave={v => patchDate(l.id, v)}
                              className="font-mono"
                            />
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="flex gap-1.5 items-center">
                              <button
                                onClick={() => window.open(`/belege/${l.id}`, '_blank')}
                                className="text-xs px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-semibold whitespace-nowrap"
                              >
                                Beleg
                              </button>
                              <button
                                onClick={() => deleteRow(l.id)}
                                disabled={deleting === l.id}
                                title="Eintrag löschen"
                                className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg font-semibold disabled:opacity-40"
                              >
                                {deleting === l.id ? '…' : '🗑'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                      <td colSpan={3} className="px-3 py-3 text-gray-500 text-xs uppercase">Gesamt ({sorted.length})</td>
                      <td className="px-3 py-3 text-gray-700">{fmtEur(totals.purchase)}</td>
                      <td className="px-3 py-3 text-gray-900">{fmtEur(totals.revenue)}</td>
                      <td className="px-3 py-3 text-amber-600">{totals.fees>0?`−${fmtEur(totals.fees)}`:'—'}</td>
                      <td className={`px-3 py-3 font-extrabold ${totals.profit>=0?'text-green-600':'text-red-600'}`}>{fmtEur(totals.profit)}</td>
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
