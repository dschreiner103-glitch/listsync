'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { PLATFORMS } from '@/components/Badge'

function fmtEur(n) { return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) }
function fee(l) { return (l.platforms||[]).includes('ebay') ? (l.price||0)*0.13 : 0 }
function netProfit(l) { return (l.price||0) - (l.buyPrice||0) - fee(l) }
function margin(l) {
  if (!l.buyPrice || l.buyPrice === 0 || !l.price) return null
  return (netProfit(l) / l.price) * 100
}

// Das relevante Datum hängt vom Status ab:
//   verkauft → soldAt (Verkaufsdatum, darf leer sein!)
//   aktiv    → listedAt (online seit)
//   sonst    → createdAt (z.B. Einkaufsdatum)
function rowDateIso(l) {
  if (l.status === 'verkauft') return l.soldAt   || ''
  if (l.status === 'aktiv')    return l.listedAt || ''
  return l.createdAt || ''
}
// Feld, in das eine manuelle Datums-Eingabe geschrieben wird
function rowDateField(l) {
  if (l.status === 'verkauft') return 'soldAt'
  if (l.status === 'aktiv')    return 'listedAt'
  return 'updatedAt'
}
// ISO → yyyy-mm-dd für <input type=date>, '' wenn kein/ungültiges Datum
function dateInputValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
}
// Sortier-Key: relevantes Datum, Fallback createdAt, damit alles stabil ordnet
function rowDateMs(l) {
  const d = new Date(rowDateIso(l) || l.createdAt || l.updatedAt || 0)
  return isNaN(d.getTime()) ? 0 : d.getTime()
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
    rowDateIso(l) ? new Date(rowDateIso(l)).toLocaleDateString('de') : '',
  ].join(';'))]
  const blob = new Blob(['﻿'+lines.join('\n')],{type:'text/csv;charset=utf-8;'})
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `ListSync-Buchhaltung.csv`; a.click()
}

// ── Inline editable cell ─────────────────────────────────────────────────────
function EditCell({ value, type='text', placeholder='—', onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  function start() { setVal(value); setEditing(true) }
  function cancel() { setEditing(false) }
  function save() {
    const v = type === 'number' ? parseFloat(String(val).replace(',','.')) || 0 : val
    onSave(v); setEditing(false)
  }
  if (editing) return (
    <input
      autoFocus
      type={type==='number'?'number':type==='date'?'date':'text'}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key==='Enter') save(); if (e.key==='Escape') cancel() }}
      style={{
        width: '100%', background: 'var(--input-bg)', border: '1px solid #818cf8',
        borderRadius: 6, padding: '3px 6px', fontSize: 13, color: 'var(--text-1)',
        fontFamily: 'inherit', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)',
      }}
      step={type==='number'?'0.01':undefined}
    />
  )
  const isEmpty = value === '' || value == null
  return (
    <span onClick={start} title="Klicken zum Bearbeiten"
      style={{ cursor: 'pointer', borderRadius: 4, padding: '1px 4px', transition: 'background .1s' }}
      onMouseOver={e => e.currentTarget.style.background='rgba(99,102,241,0.07)'}
      onMouseOut={e => e.currentTarget.style.background='transparent'}
    >{isEmpty ? <span style={{ color: 'var(--text-3)' }}>{placeholder}</span> : value} <span style={{ fontSize: 10, opacity: 0.4 }}>✏</span></span>
  )
}

// ── Sort header ───────────────────────────────────────────────────────────────
function SortTh({ label, col, sort, setSort }) {
  const active = sort.col === col
  return (
    <th onClick={() => setSort(s => ({ col, dir: s.col===col && s.dir==='asc' ? 'desc' : 'asc' }))}
      style={{
        padding: '12px 10px', fontSize: 11, fontWeight: 700, color: active ? '#818cf8' : 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
        cursor: 'pointer', userSelect: 'none', transition: 'color .12s',
      }}>
      {label} <span style={{ color: active ? '#818cf8' : 'var(--border)' }}>{active ? (sort.dir==='asc'?'↑':'↓') : '↕'}</span>
    </th>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  verkauft: { bg: 'rgba(34,197,94,0.1)',  color: '#16a34a', label: 'Verkauft' },
  aktiv:    { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', label: 'Aktiv'    },
  inaktiv:  { bg: 'rgba(107,114,128,0.1)',color: '#6b7280', label: 'Inaktiv'  },
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function MobileCard({ l, i, onDelete, deleting, onPatch }) {
  const np  = netProfit(l)
  const mg  = margin(l)
  const sc  = STATUS_COLORS[l.status] || STATUS_COLORS.inaktiv
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 18, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        {l.images?.[0]
          ? <img src={l.images[0]} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
          : <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: 'var(--row-hover)', border: '1px solid var(--border)' }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', margin: '0 0 4px', lineHeight: 1.3 }}>{l.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: sc.bg, color: sc.color }}>{sc.label}</span>
            {(l.platforms||[]).map(p => (
              <span key={p} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>{PLATFORMS[p]?.name || p}</span>
            ))}
          </div>
        </div>
        <p style={{ fontWeight: 800, fontSize: 16, color: np >= 0 ? '#10b981' : '#ef4444', flexShrink: 0, margin: 0 }}>+{fmtEur(np)}</p>
      </div>

      {/* Financials row */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 12 }}>
        {[
          { label: 'EK', val: fmtEur(l.buyPrice||0), color: 'var(--text-2)' },
          { label: 'VK', val: fmtEur(l.price||0), color: 'var(--text-1)' },
          { label: 'Marge', val: mg != null ? `${mg.toFixed(0)}%` : '—', color: mg >= 30 ? '#10b981' : mg >= 10 ? '#f59e0b' : '#ef4444' },
        ].map((item, idx) => (
          <div key={idx} style={{
            flex: 1, padding: '8px 6px', textAlign: 'center',
            borderRight: idx < 2 ? '1px solid var(--border)' : 'none',
            background: 'var(--row-hover)',
          }}>
            <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>{item.label}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: item.color, margin: 0 }}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* Date + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {rowDateIso(l) ? new Date(rowDateIso(l)).toLocaleDateString('de') : '—'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => window.open(`/belege/${l.id}`, '_blank')}
            style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 9,
              background: 'rgba(99,102,241,0.07)', color: '#6366f1',
              border: '1px solid rgba(99,102,241,0.15)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Beleg
          </button>
          <button
            onClick={() => onDelete(l.id)}
            disabled={deleting === l.id}
            style={{
              fontSize: 12, padding: '5px 10px', borderRadius: 9,
              background: 'rgba(239,68,68,0.07)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.15)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              opacity: deleting === l.id ? 0.5 : 1,
            }}>
            {deleting === l.id ? '…' : '🗑'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Buchhaltung() {
  const router = useRouter()
  const [listings, setListings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [month, setMonth]           = useState('')
  const [year, setYear]             = useState(String(new Date().getFullYear()))
  const [statusFilter, setStatus]   = useState('verkauft')
  // Default-Tab 'verkauft' → neueste Verkäufe oben (absteigend). Andere Tabs: neueste unten (aufsteigend).
  const [sort, setSort]             = useState({ col: 'date', dir: 'desc' })
  const [isMobile, setIsMobile]     = useState(false)
  const [accounts, setAccounts]     = useState([])
  const [accountFilter, setAccountFilter] = useState('alle')
  const [addOpen, setAddOpen]       = useState(false)
  const [addSaving, setAddSaving]   = useState(false)
  const [addForm, setAddForm]       = useState({ title: '', buyPrice: '', price: '', status: 'aktiv', boughtAt: '', soldAt: '' })

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(d => setAccounts(Array.isArray(d) ? d : []))
    fetch('/api/listings').then(r => r.json()).then(d => {
      setListings(Array.isArray(d) ? d.map(l => ({
        ...l,
        platforms: Array.isArray(l.platforms) ? l.platforms : JSON.parse(l.platforms||'[]'),
        account_ids: l.account_ids ? (typeof l.account_ids === 'string' ? JSON.parse(l.account_ids) : l.account_ids) : {},
      })) : [])
      setLoading(false)
    })
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const years = useMemo(() => {
    const ys = new Set(listings.map(l => new Date(l.updatedAt||l.createdAt).getFullYear()))
    return Array.from(ys).sort((a,b)=>b-a)
  }, [listings])

  const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

  // Basis-Filter (Zeitraum + Account) OHNE Status – Grundlage für die Tab-Counts
  const baseFiltered = useMemo(() => listings.filter(l => {
    const d = new Date(rowDateIso(l) || l.createdAt || l.updatedAt)
    if (year  && String(d.getFullYear()) !== year) return false
    if (month && String(d.getMonth()+1).padStart(2,'0') !== month) return false
    if (accountFilter !== 'alle' && !Object.values(l.account_ids || {}).map(Number).includes(Number(accountFilter))) return false
    return true
  }), [listings, year, month, accountFilter])

  // Anzahl pro Status-Tab (für die Pills)
  const statusCounts = useMemo(() => ({
    alle:     baseFiltered.length,
    verkauft: baseFiltered.filter(l => l.status === 'verkauft').length,
    aktiv:    baseFiltered.filter(l => l.status === 'aktiv').length,
    inaktiv:  baseFiltered.filter(l => l.status === 'inaktiv').length,
  }), [baseFiltered])

  const filtered = useMemo(() =>
    statusFilter === 'alle' ? baseFiltered : baseFiltered.filter(l => l.status === statusFilter),
  [baseFiltered, statusFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const { col, dir } = sort
    const mul = dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (col==='date')     return mul * (rowDateMs(a) - rowDateMs(b))
      if (col==='title')    return mul * (a.title||'').localeCompare(b.title||'','de')
      if (col==='price')    return mul * ((a.price||0) - (b.price||0))
      if (col==='buyPrice') return mul * ((a.buyPrice||0) - (b.buyPrice||0))
      if (col==='profit')   return mul * (netProfit(a) - netProfit(b))
      if (col==='margin')   { const ma=margin(a)??-999, mb=margin(b)??-999; return mul*(ma-mb) }
      if (col==='fee')      return mul * (fee(a) - fee(b))
      if (col==='status')   return mul * (a.status||'').localeCompare(b.status||'','de')
      return 0
    })
    return arr
  }, [filtered, sort])

  // Summary-Cards: NUR verkaufte Artikel des Zeitraums (tab-unabhängig, damit der Umsatz
  // beim Wechsel auf "Aktiv" nicht auf 0 fällt). Aktive/inaktive blähen die Zahlen nicht auf.
  const soldOnly = useMemo(() => baseFiltered.filter(l => l.status === 'verkauft'), [baseFiltered])
  const totals = useMemo(() => ({
    revenue:  soldOnly.reduce((s,l)=>s+(l.price||0),0),
    purchase: soldOnly.reduce((s,l)=>s+(l.buyPrice||0),0),
    fees:     soldOnly.reduce((s,l)=>s+fee(l),0),
    profit:   soldOnly.reduce((s,l)=>s+netProfit(l),0),
  }), [soldOnly])

  // Footer der Tabelle: summiert die GERADE angezeigten Zeilen (passt zum aktiven Tab)
  const viewTotals = useMemo(() => ({
    purchase: filtered.reduce((s,l)=>s+(l.buyPrice||0),0),
    revenue:  filtered.reduce((s,l)=>s+(l.price||0),0),
    fees:     filtered.reduce((s,l)=>s+fee(l),0),
    profit:   filtered.reduce((s,l)=>s+netProfit(l),0),
  }), [filtered])

  // Account-Vergleich: pro zugeordnetem Account Umsatz/Gewinn/Verkäufe/aktiv/Verkaufsquote.
  // Basis = Zeitraum-gefilterte Listings (ohne Status-Tab), damit der Vergleich vollständig ist.
  const accountStats = useMemo(() => {
    const map = {}
    for (const l of baseFiltered) {
      const ids = Object.values(l.account_ids || {}).map(Number).filter(Boolean)
      for (const id of ids) {
        const m = map[id] || (map[id] = { id, sold: 0, active: 0, revenue: 0, profit: 0 })
        if (l.status === 'verkauft') { m.sold++; m.revenue += l.price||0; m.profit += netProfit(l) }
        else if (l.status === 'aktiv') m.active++
      }
    }
    return Object.values(map)
      .map(m => ({ ...m, account: accounts.find(a => Number(a.id) === m.id),
                   quote: (m.sold + m.active) ? m.sold / (m.sold + m.active) : 0 }))
      .filter(m => m.account)
      .sort((a,b) => b.revenue - a.revenue)
  }, [baseFiltered, accounts])

  const maxAccRevenue = useMemo(() => Math.max(1, ...accountStats.map(a => a.revenue)), [accountStats])
  const assignedCount = useMemo(() => baseFiltered.filter(l => Object.keys(l.account_ids||{}).length).length, [baseFiltered])

  async function patch(id, data) {
    setSaving(id)
    const res = await fetch(`/api/listings/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
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

  // Eigenes Listing manuell anlegen (ohne Account/Import). POST + danach Daten nachpatchen.
  async function addListing() {
    if (!addForm.title.trim()) return
    setAddSaving(true)
    try {
      const res = await fetch('/api/listings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title.trim(),
          buyPrice: parseFloat(String(addForm.buyPrice).replace(',', '.')) || 0,
          price:    parseFloat(String(addForm.price).replace(',', '.')) || 0,
          status:   addForm.status,
          platforms: [], images: [],
        }),
      })
      const created = await res.json()
      if (!res.ok) { alert(created.upgrade ? 'Free-Limit erreicht – Upgrade auf Pro nötig.' : (created.error || 'Fehler beim Anlegen')); return }
      // Datums-Felder nachtragen (raw-SQL-Felder, nicht im POST)
      const dates = {}
      if (addForm.boughtAt) dates.boughtAt = new Date(addForm.boughtAt).toISOString()
      if (addForm.status === 'verkauft') dates.soldAt = new Date(addForm.soldAt || new Date()).toISOString()
      let full = { ...created, account_ids: {}, boughtAt: dates.boughtAt || null, soldAt: dates.soldAt || null, listedAt: null }
      if (Object.keys(dates).length) {
        const r2 = await fetch(`/api/listings/${created.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dates),
        })
        const updated = await r2.json()
        full = { ...full, ...updated, platforms: Array.isArray(updated.platforms) ? updated.platforms : JSON.parse(updated.platforms||'[]') }
      }
      setListings(prev => [{ ...full, platforms: Array.isArray(full.platforms) ? full.platforms : JSON.parse(full.platforms||'[]'), images: Array.isArray(full.images) ? full.images : JSON.parse(full.images||'[]') }, ...prev])
      setAddOpen(false)
      setAddForm({ title: '', buyPrice: '', price: '', status: 'aktiv', boughtAt: '', soldAt: '' })
    } finally {
      setAddSaving(false)
    }
  }

  // Status ändern – wird ein Artikel auf "verkauft" gesetzt und hat noch kein Verkaufsdatum,
  // automatisch HEUTE eintragen (genau der Moment des Verkaufs).
  function changeStatus(l, newStatus) {
    const data = { status: newStatus }
    if (newStatus === 'verkauft' && !l.soldAt) data.soldAt = new Date().toISOString()
    patch(l.id, data)
  }

  // Aktuell zugeordnete Account-ID (erster Eintrag in account_ids) – '' wenn keiner
  function listingAccountId(l) {
    const vals = Object.values(l.account_ids || {})
    return vals.length ? Number(vals[0]) : ''
  }
  // Account einem Listing zuordnen (account_ids[platform] = id); leere Auswahl entfernt die Zuordnung
  async function assignAccount(l, accountId) {
    const acc = accounts.find(a => Number(a.id) === Number(accountId))
    const next = (!accountId || !acc) ? {} : { ...(l.account_ids||{}), [acc.platform]: Number(accountId) }
    await patch(l.id, { account_ids: next })
  }

  const selStyle = {
    padding: '9px 32px 9px 12px', borderRadius: 12, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-1)', fontSize: 13.5,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div className="ls-page">

      {/* ── Confirm clear modal ── */}
      {confirmClear && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)', padding: '16px', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 22, padding: '24px',
            maxWidth: 360, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px' }}>Tabelle leeren?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: '0 0 20px' }}>
              Alle {listings.length} Einträge werden unwiderruflich gelöscht.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmClear(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Abbrechen
              </button>
              <button onClick={clearAll}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manuelles Listing anlegen ── */}
      {addOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: '16px', backdropFilter: 'blur(4px)' }}
          onClick={() => !addSaving && setAddOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 22, padding: '24px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Eigenes Listing anlegen</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 18px' }}>Manueller Eintrag – ohne Account/Import.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { k: 'title',    label: 'Titel',          type: 'text',   ph: 'z.B. Nike Hoodie grau' },
              ].map(f => (
                <label key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</span>
                  <input type={f.type} value={addForm[f.k]} placeholder={f.ph} autoFocus
                    onChange={e => setAddForm(s => ({ ...s, [f.k]: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit' }} />
                </label>
              ))}
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ k: 'buyPrice', label: 'Einkauf (EK)' }, { k: 'price', label: 'Verkauf (VK)' }].map(f => (
                  <label key={f.k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</span>
                    <input type="number" step="0.01" value={addForm[f.k]} placeholder="0,00"
                      onChange={e => setAddForm(s => ({ ...s, [f.k]: e.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                  </label>
                ))}
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                <select value={addForm.status} onChange={e => setAddForm(s => ({ ...s, status: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="aktiv">aktiv</option>
                  <option value="verkauft">verkauft</option>
                  <option value="inaktiv">inaktiv</option>
                </select>
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eingekauft am</span>
                  <input type="date" value={addForm.boughtAt} onChange={e => setAddForm(s => ({ ...s, boughtAt: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                </label>
                {addForm.status === 'verkauft' && (
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verkauft am</span>
                    <input type="date" value={addForm.soldAt} onChange={e => setAddForm(s => ({ ...s, soldAt: e.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setAddOpen(false)} disabled={addSaving}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Abbrechen
              </button>
              <button onClick={addListing} disabled={addSaving || !addForm.title.trim()}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: addSaving || !addForm.title.trim() ? 'default' : 'pointer', fontFamily: 'inherit', opacity: addSaving || !addForm.title.trim() ? 0.6 : 1, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                {addSaving ? 'Speichern…' : 'Anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="md:ml-60 ls-page-content">
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }} className="ls-content">

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.03em' }}>Buchhaltung</h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '3px 0 0', fontWeight: 500 }}>
                {isMobile ? 'Tap auf Karte für Details' : 'Klicke auf Zellen zum Bearbeiten · Spalten sortieren per Klick'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setAddOpen(true)}
                style={{ padding: '9px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                + Listing
              </button>
              <button onClick={() => downloadCSV(sorted)}
                style={{ padding: '9px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⬇ CSV
              </button>
              <button onClick={() => router.push('/belege')}
                style={{ padding: '9px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.07)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                🧾 Belege
              </button>
              <button onClick={() => setConfirmClear(true)}
                style={{ padding: '9px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.07)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                🗑
              </button>
            </div>
          </div>

          {/* ── Status-Tabs ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'verkauft', label: 'Verkauft', color: '#10b981' },
              { id: 'aktiv',    label: 'Aktiv',    color: '#2563eb' },
              { id: 'inaktiv',  label: 'Inaktiv',  color: '#6b7280' },
              { id: 'alle',     label: 'Alle',     color: '#6366f1' },
            ].map(t => {
              const active = statusFilter === t.id
              return (
                <button key={t.id} onClick={() => { setStatus(t.id); setSort({ col: 'date', dir: t.id === 'verkauft' ? 'desc' : 'asc' }) }}
                  style={{
                    padding: '8px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    border: `1.5px solid ${active ? t.color : 'var(--border)'}`,
                    background: active ? `${t.color}15` : 'var(--surface)',
                    color: active ? t.color : 'var(--text-2)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                  {t.label}
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 8,
                    background: active ? `${t.color}22` : 'var(--row-hover)',
                    color: active ? t.color : 'var(--text-3)',
                  }}>{statusCounts[t.id] ?? 0}</span>
                </button>
              )
            })}
          </div>

          {/* ── Summary cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }} className="md:grid-cols-4">
            {[
              { label: 'Umsatz',        val: fmtEur(totals.revenue),  bg: 'rgba(99,102,241,0.07)',  color: '#6366f1'  },
              { label: 'Einkauf',       val: fmtEur(totals.purchase), bg: 'rgba(239,68,68,0.07)',   color: '#ef4444'  },
              { label: 'Gebühren',      val: fmtEur(totals.fees),     bg: 'rgba(245,158,11,0.07)',  color: '#d97706'  },
              { label: 'Netto-Gewinn',  val: fmtEur(totals.profit),   bg: totals.profit>=0 ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)', color: totals.profit>=0 ? '#10b981' : '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, borderRadius: 18, padding: '14px 16px',
                border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* ── Account-Vergleich ── */}
          {accounts.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  Account-Vergleich
                </p>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>
                  {assignedCount}/{baseFiltered.length} zugeordnet
                </span>
              </div>

              {accountStats.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
                  Noch keine Artikel einem Account zugeordnet. Beim nächsten Vinted-Sync passiert das automatisch –
                  oder ordne sie unten in der Tabelle in der Spalte <strong>Account</strong> manuell zu.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {accountStats.map(a => (
                    <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORMS[a.account.platform]?.dot || '#6366f1', flexShrink: 0 }} />
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.account.name}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>
                            {PLATFORMS[a.account.platform]?.name || a.account.platform}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 14, fontSize: 12.5, fontWeight: 700 }}>
                          <span style={{ color: 'var(--text-1)' }}>{fmtEur(a.revenue)}</span>
                          <span style={{ color: a.profit>=0 ? '#10b981' : '#ef4444' }}>{fmtEur(a.profit)}</span>
                          <span style={{ color: 'var(--text-3)' }}>{a.sold}✓ · {a.active} aktiv</span>
                          <span style={{ color: 'var(--text-2)' }}>{Math.round(a.quote*100)}%</span>
                        </div>
                      </div>
                      {/* Umsatz-Balken relativ zum stärksten Account */}
                      <div style={{ height: 6, borderRadius: 4, background: 'var(--row-hover)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.max(2, (a.revenue/maxAccRevenue)*100)}%`, background: PLATFORMS[a.account.platform]?.dot || '#6366f1', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, marginTop: 2, justifyContent: 'flex-end' }}>
                    <span>Umsatz · Gewinn · verkauft/aktiv · Verkaufsquote</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Filters ── */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '14px 16px',
            display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <select value={year} onChange={e => setYear(e.target.value)} style={selStyle}>
              <option value="">Alle Jahre</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(e.target.value)} style={selStyle}>
              <option value="">Alle Monate</option>
              {MONTHS.map((m,i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
            </select>
            {accounts.length > 0 && (
              <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={selStyle}>
                <option value="alle">Alle Accounts</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={String(acc.id)}>
                    {PLATFORMS[acc.platform]?.name || acc.platform}: {acc.name}
                  </option>
                ))}
              </select>
            )}
            <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 'auto', fontWeight: 600 }}>{sorted.length} Einträge</span>
          </div>

          {/* ── Content: mobile cards / desktop table ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
                  <div className="ls-skeleton" style={{ height: 18, width: '60%', marginBottom: 10 }}/>
                  <div className="ls-skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }}/>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="ls-skeleton" style={{ height: 40, flex: 1, borderRadius: 10 }}/>
                    <div className="ls-skeleton" style={{ height: 40, flex: 1, borderRadius: 10 }}/>
                    <div className="ls-skeleton" style={{ height: 40, flex: 1, borderRadius: 10 }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)', fontWeight: 600, fontSize: 14 }}>
              Keine Einträge
            </div>
          ) : isMobile ? (
            /* ── Mobile: card list ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map((l, i) => (
                <MobileCard key={l.id} l={l} i={i} onDelete={deleteRow} deleting={deleting} onPatch={patch} />
              ))}
            </div>
          ) : (
            /* ── Desktop: full table ── */
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--row-hover)' }}>
                      <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>#</th>
                      <SortTh label="Artikel"  col="title"    sort={sort} setSort={setSort}/>
                      <SortTh label="Status"   col="status"   sort={sort} setSort={setSort}/>
                      <SortTh label="EK"       col="buyPrice" sort={sort} setSort={setSort}/>
                      <SortTh label="VK"       col="price"    sort={sort} setSort={setSort}/>
                      <SortTh label="Gebühr"   col="fee"      sort={sort} setSort={setSort}/>
                      <SortTh label="Gewinn"   col="profit"   sort={sort} setSort={setSort}/>
                      <SortTh label="Marge"    col="margin"   sort={sort} setSort={setSort}/>
                      {accounts.length === 0 && (
                        <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plattform</th>
                      )}
                      {accounts.length > 0 && (
                        <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account</th>
                      )}
                      <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Eingekauft am</th>
                      <SortTh label={statusFilter==='verkauft' ? 'Verkauft am' : statusFilter==='aktiv' ? 'Online seit' : 'Datum'} col="date" sort={sort} setSort={setSort}/>
                      <th style={{ padding: '12px 10px', position: 'sticky', right: 0, background: 'var(--row-hover)', zIndex: 2 }}/>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((l, i) => {
                      const np = netProfit(l)
                      const mg = margin(l)
                      const sc = STATUS_COLORS[l.status] || STATUS_COLORS.inaktiv
                      const isSaving = saving === l.id
                      return (
                        <tr key={l.id} style={{
                          borderBottom: '1px solid var(--divider)', opacity: isSaving ? 0.6 : 1,
                          transition: 'background .1s',
                        }}
                          onMouseOver={e => e.currentTarget.style.background='var(--row-hover)'}
                          onMouseOut={e => e.currentTarget.style.background='transparent'}
                        >
                          <td style={{ padding: '10px', color: 'var(--text-3)', fontFamily: 'monospace', fontSize: 12 }}>{sort.dir==='desc' ? sorted.length - i : i+1}</td>
                          <td style={{ padding: '10px', maxWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              {l.images?.[0]
                                ? <img src={l.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                                : <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: 'var(--row-hover)', border: '1px solid var(--border)' }} />}
                              <EditCell value={l.title} onSave={v => patch(l.id, { title: v })} />
                            </div>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <select value={l.status} onChange={e => changeStatus(l, e.target.value)}
                              style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 20px 3px 8px', borderRadius: 8,
                                border: 'none', cursor: 'pointer', background: sc.bg, color: sc.color,
                                fontFamily: 'inherit',
                              }}>
                              <option value="aktiv">aktiv</option>
                              <option value="verkauft">verkauft</option>
                              <option value="inaktiv">inaktiv</option>
                            </select>
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                            <EditCell value={(l.buyPrice||0).toFixed(2).replace('.',',')} type="number" onSave={v => patch(l.id, { buyPrice: v })} />
                          </td>
                          <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
                            <EditCell value={(l.price||0).toFixed(2).replace('.',',')} type="number" onSave={v => patch(l.id, { price: v })} />
                          </td>
                          <td style={{ padding: '10px', color: '#d97706', whiteSpace: 'nowrap' }}>
                            {fee(l) > 0 ? `−${fmtEur(fee(l))}` : '—'}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700, color: np>=0 ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                            {fmtEur(np)}
                          </td>
                          <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                            {mg !== null ? (
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                                background: mg>=30 ? 'rgba(16,185,129,0.1)' : mg>=10 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                color: mg>=30 ? '#10b981' : mg>=10 ? '#d97706' : '#ef4444',
                              }}>{mg.toFixed(0)}%</span>
                            ) : '—'}
                          </td>
                          {accounts.length === 0 && (
                            <td style={{ padding: '10px', color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                              {(l.platforms||[]).map(p => PLATFORMS[p]?.name || p).join(', ') || '—'}
                            </td>
                          )}
                          {accounts.length > 0 && (() => {
                            const relevant = accounts.filter(a => (l.platforms||[]).includes(a.platform))
                            const opts = relevant.length ? relevant : accounts
                            return (
                              <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                                <select value={listingAccountId(l)} onChange={e => assignAccount(l, e.target.value)}
                                  style={{ fontSize: 12, padding: '4px 22px 4px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: listingAccountId(l) ? 'var(--text-1)' : 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', maxWidth: 140 }}>
                                  <option value="">— Account —</option>
                                  {opts.map(a => (
                                    <option key={a.id} value={a.id}>{PLATFORMS[a.platform]?.name || a.platform}: {a.name}</option>
                                  ))}
                                </select>
                              </td>
                            )
                          })()}
                          <td style={{ padding: '10px', color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                            <EditCell
                              value={dateInputValue(l.boughtAt)}
                              type="date"
                              placeholder="Datum +"
                              onSave={v => patch(l.id, { boughtAt: v ? new Date(v).toISOString() : null })}
                            />
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                            <EditCell
                              value={dateInputValue(rowDateIso(l))}
                              type="date"
                              placeholder={l.status === 'verkauft' ? 'Datum +' : '—'}
                              onSave={v => patch(l.id, { [rowDateField(l)]: v ? new Date(v).toISOString() : null })}
                            />
                          </td>
                          <td style={{ padding: '10px', position: 'sticky', right: 0, background: 'var(--surface)', boxShadow: '-6px 0 8px -6px rgba(0,0,0,0.18)' }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button onClick={() => window.open(`/belege/${l.id}`, '_blank')}
                                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.07)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                Beleg
                              </button>
                              <button onClick={() => deleteRow(l.id)} disabled={deleting === l.id}
                                style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.07)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: deleting === l.id ? 0.5 : 1 }}>
                                {deleting === l.id ? '…' : '🗑'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--row-hover)', borderTop: '2px solid var(--border)' }}>
                      <td colSpan={3} style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {statusFilter==='verkauft' ? 'Verkauft' : statusFilter==='aktiv' ? 'Aktiv' : statusFilter==='inaktiv' ? 'Inaktiv' : 'Summe'} ({sorted.length})
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--text-2)' }}>{fmtEur(viewTotals.purchase)}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--text-1)' }}>{fmtEur(viewTotals.revenue)}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: '#d97706' }}>{viewTotals.fees>0 ? `−${fmtEur(viewTotals.fees)}` : '—'}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 800, color: viewTotals.profit>=0 ? '#10b981' : '#ef4444' }}>{fmtEur(viewTotals.profit)}</td>
                      <td colSpan={5}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
      
    </div>
  )
}
