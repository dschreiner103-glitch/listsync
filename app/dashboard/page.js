'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { PlatformBadge, StatusBadge, PLATFORMS, fmt, profit, CARD_COLORS } from '@/components/Badge'

// ── Period helpers ────────────────────────────────────────────────────────────

const PERIODS = [
  { label: 'Letzte 7 Tage',  val: 7 },
  { label: 'Letzte 30 Tage', val: 30 },
  { label: 'Letzte 60 Tage', val: 60 },
  { label: 'Letzte 90 Tage', val: 90 },
  { label: 'Gesamt',         val: 'all' },
]

function filterByPeriod(sold, days) {
  if (days === 'all') return sold
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return sold.filter(l => new Date(l.createdAt) >= from)
}

// ── Period Chips ──────────────────────────────────────────────────────────────

function PeriodChips({ period, setPeriod }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 14 }}>
      {PERIODS.map(p => {
        const active = period === p.val
        return (
          <button key={p.val} onClick={() => setPeriod(p.val)}
            style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all .12s', minHeight: 34,
              border: active ? 'none' : '1px solid var(--chip-border)',
              background: active ? 'var(--chip-active)' : 'transparent',
              color: active ? 'var(--chip-active-fg)' : 'var(--text-2)',
              fontFamily: 'inherit',
            }}>
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Smooth Line Chart ─────────────────────────────────────────────────────────

function buildMonthlyData(listings, months = 6) {
  const now = new Date()
  const sold = listings.filter(l => l.status === 'verkauft')
  const MO = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
  return Array.from({ length: months }, (_, i) => {
    const d    = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const matches = sold.filter(l => { const t = new Date(l.createdAt); return t >= d && t < next })
    return {
      l:       MO[d.getMonth()],
      revenue: matches.reduce((s, l) => s + l.price, 0),
      profit:  matches.reduce((s, l) => s + (l.price - (l.buyPrice || 0)), 0),
    }
  })
}

function smoothPath(pts) {
  if (pts.length < 2) return ''
  return pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cpx  = (p.x - prev.x) * 0.42
    return `${acc} C ${prev.x + cpx} ${prev.y}, ${p.x - cpx} ${p.y}, ${p.x} ${p.y}`
  }, '')
}

function LineChart({ data }) {
  const [hovered, setHovered] = useState(null)
  const W = 500, H = 130, padL = 8, padR = 8, padT = 12, padB = 0

  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  const maxAll = Math.max(...data.map(d => Math.max(d.revenue, d.profit)), 1)

  const toX = i => padL + (i / (data.length - 1)) * (W - padL - padR)
  const toY = v => padT + (H - padT - padB) - (v / maxAll) * (H - padT - padB - 10)

  const revPts = data.map((d, i) => ({ x: toX(i), y: toY(d.revenue) }))
  const proPts = data.map((d, i) => ({ x: toX(i), y: toY(d.profit) }))

  const revPath = smoothPath(revPts)
  const proPath = smoothPath(proPts)
  const revFill = `${revPath} L ${revPts[revPts.length-1].x} ${H} L ${revPts[0].x} ${H} Z`
  const proFill = `${proPath} L ${proPts[proPts.length-1].x} ${H} L ${proPts[0].x} ${H} Z`

  const hasData = data.some(d => d.revenue > 0)

  return (
    <div style={{ position: 'relative' }}>
      {!hasData ? (
        <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Noch keine Verkäufe</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible', display: 'block' }}>
          <defs>
            <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="fillPro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Fills */}
          <path d={revFill} fill="url(#fillRev)"/>
          <path d={proFill} fill="url(#fillPro)"/>
          {/* Lines */}
          <path d={revPath} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round"/>
          <path d={proPath} fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round"/>
          {/* Hover dots */}
          {hovered !== null && (
            <>
              <circle cx={revPts[hovered].x} cy={revPts[hovered].y} r="4" fill="#3b82f6"/>
              <circle cx={proPts[hovered].x} cy={proPts[hovered].y} r="4" fill="#22c55e"/>
              <line x1={revPts[hovered].x} y1={padT} x2={revPts[hovered].x} y2={H}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3"/>
            </>
          )}
          {/* Invisible hover/touch areas */}
          {data.map((_, i) => (
            <rect key={i}
              x={toX(i) - (W / data.length) / 2}
              y={0} width={W / data.length} height={H}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={e => { e.preventDefault(); setHovered(i) }}
              onTouchEnd={() => setTimeout(() => setHovered(null), 1500)}
              style={{ cursor: 'default' }}
            />
          ))}
        </svg>
      )}
      {/* X-axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px 0' }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, flex: 1, textAlign: 'center' }}>{d.l}</span>
        ))}
      </div>
      {/* Tooltip */}
      {hovered !== null && hasData && (
        <div style={{
          position: 'absolute',
          left: `${(revPts[hovered].x / W) * 100}%`,
          top: 0, transform: 'translate(-50%, -100%)',
          background: '#111827', color: '#f9fafb', borderRadius: 8,
          padding: '6px 10px', fontSize: 12, fontWeight: 600,
          pointerEvents: 'none', whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          marginTop: -6,
        }}>
          <div style={{ color: '#93c5fd' }}>↑ {fmt(data[hovered].revenue)}</div>
          <div style={{ color: '#86efac' }}>↑ {fmt(data[hovered].profit)}</div>
        </div>
      )}
    </div>
  )
}

// ── Donut Gauge ───────────────────────────────────────────────────────────────

function DonutGauge({ pct, label, sub }) {
  const r = 52, cx = 70, cy = 68
  const circ = Math.PI * r
  const progress = Math.min(pct / 100, 1) * circ
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="140" height="78" viewBox="0 0 140 78" style={{ display: 'block', margin: '0 auto' }}>
        <path d={d} fill="none" style={{ stroke: 'var(--border)' }} strokeWidth="10" strokeLinecap="round"/>
        <path d={d} fill="none" stroke="#3b82f6" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${progress} ${circ}`}/>
      </svg>
      <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: '-8px 0 2px', letterSpacing: '-0.03em' }}>{Math.round(pct)}%</p>
      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  )
}

// ── Stat Card with period chips ───────────────────────────────────────────────

function StatCard({ title, icon, iconBg, iconColor, computeValue, computeSub, sold }) {
  const [period, setPeriod] = useState(30)
  const filtered = filterByPeriod(sold, period)
  const value = computeValue(filtered)
  const sub   = computeSub ? computeSub(filtered) : null

  return (
    <div className="ls-card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)' }}>{title}</span>
      </div>
      <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>{value}</p>
      {sub && <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>{sub}</p>}
      <PeriodChips period={period} setPeriod={setPeriod} />
    </div>
  )
}

function IcSm({ children }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return <div className="ls-card" style={{ padding: '22px 24px', ...style }}>{children}</div>
}

function STitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>{children}</h2>
      {action}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [listings, setListings]     = useState([])
  const [goals, setGoals]           = useState({ day: 0, month: 0 })
  const [relistDays, setRelistDays] = useState(5)
  const [loading, setLoading]       = useState(true)
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      fetch('/api/listings').then(r => r.json()).catch(() => []),
      fetch('/api/settings').then(r => r.json()).catch(() => ({})),
    ]).then(([ld, settings]) => {
      setListings(Array.isArray(ld) ? ld : [])
      if (settings.dayGoal !== undefined) setGoals({ day: settings.dayGoal, month: settings.monthGoal })
      if (settings.relistDays !== undefined) setRelistDays(settings.relistDays)
      setLoading(false)
    })
  }, [])

  const sold    = listings.filter(l => l.status === 'verkauft')
  const active  = listings.filter(l => l.status === 'aktiv')

  // Relist alerts: active listings older than relistDays
  const needsRelist = active.filter(l => {
    const d = new Date(l.relistedAt || l.createdAt)
    return Math.floor((Date.now() - d.getTime()) / (1000*60*60*24)) >= relistDays
  })

  const chartData = buildMonthlyData(listings, 6)

  // Goal: current month revenue vs goal
  const nowMonth     = new Date(); nowMonth.setDate(1); nowMonth.setHours(0,0,0,0)
  const thisMonthRev = sold.filter(l => new Date(l.createdAt) >= nowMonth).reduce((s, l) => s + l.price, 0)
  const goalPct      = goals.month > 0 ? (thisMonthRev / goals.month) * 100 : 0

  // Avg margin
  const totalProfit  = sold.reduce((s, l) => s + (l.price - (l.buyPrice || 0)), 0)
  const avgMarginPct = sold.length > 0 ? (totalProfit / sold.reduce((s, l) => s + l.price, 0)) * 100 : 0

  const pltBreakdown = Object.entries(PLATFORMS).map(([id, p]) => {
    const matches = sold.filter(l => l.platforms.includes(id))
    return { id, ...p, count: matches.length, revenue: matches.reduce((s, l) => s + l.price, 0) }
  })
  const totalRev = sold.reduce((s, l) => s + l.price, 0)

  return (
    <div className="ls-page">
      <Sidebar activeCount={active.length} />
      <main className="md:ml-60 ls-page-content">
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }} className="ls-content">

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 2px', letterSpacing: '-0.03em' }}>Dashboard</h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0, fontWeight: 500 }}>Dein Vinted-Business auf einen Blick</p>
            </div>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#6366f1', animation: 'spin 0.7s linear infinite' }}/>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Lädt…</span>
              </div>
            )}
          </div>

          {/* ── Relist alert ── */}
          {!loading && needsRelist.length > 0 && (
            <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>⏰</span>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--warn-title)', margin: 0 }}>
                    {needsRelist.length} {needsRelist.length === 1 ? 'Artikel wartet' : 'Artikel warten'} auf Relisting
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--warn-text)', margin: '2px 0 0' }}>
                    {needsRelist.slice(0, 2).map(l => l.title).join(', ')}{needsRelist.length > 2 ? ` + ${needsRelist.length - 2} weitere` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => router.push('/listings')}
                style={{ padding: '8px 16px', borderRadius: 10, background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                Ansehen
              </button>
            </div>
          )}

          {/* ── Skeleton loader ── */}
          {loading && (
            <div className="ls-grid-3">
              {[1,2,3].map(i => (
                <div key={i} className="ls-card" style={{ padding: 20 }}>
                  <div className="ls-skeleton" style={{ height: 14, width: '55%', marginBottom: 14 }}/>
                  <div className="ls-skeleton" style={{ height: 36, width: '70%', marginBottom: 8 }}/>
                  <div className="ls-skeleton" style={{ height: 11, width: '45%', marginBottom: 14 }}/>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[1,2,3,4].map(j => <div key={j} className="ls-skeleton" style={{ height: 28, flex: 1, borderRadius: 14 }}/>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Stat cards + Goal row ── */}
          {!loading && (<div className="ls-grid-3">

            {/* Einnahmen */}
            <StatCard
              title="Einnahmen"
              sold={sold}
              icon={<IcSm><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></IcSm>}
              iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6"
              computeValue={f => fmt(f.reduce((s, l) => s + l.price, 0))}
              computeSub={f => `${f.length} Verkauf${f.length !== 1 ? 'e' : ''}`}
            />

            {/* Gewinn */}
            <StatCard
              title="Gewinn"
              sold={sold}
              icon={<IcSm><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></IcSm>}
              iconBg="rgba(34,197,94,0.1)" iconColor="#22c55e"
              computeValue={f => {
                const g = f.reduce((s, l) => s + (l.price - (l.buyPrice || 0)), 0)
                return <span style={{ color: g > 0 ? '#16a34a' : 'var(--text-1)' }}>{fmt(g)}</span>
              }}
              computeSub={f => {
                const rev = f.reduce((s, l) => s + l.price, 0)
                const pro = f.reduce((s, l) => s + (l.price - (l.buyPrice || 0)), 0)
                const pct = rev > 0 ? Math.round((pro / rev) * 100) : 0
                return `Einnahmen – Einkaufspreise · ${pct}% Marge`
              }}
            />

            {/* Monatsziel */}
            <div className="ls-card" style={{ padding: 20 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 14px' }}>Monatsziel</p>
              {goals.month > 0 ? (
                <>
                  <DonutGauge
                    pct={goalPct}
                    label={`${fmt(thisMonthRev)} / ${fmt(goals.month)}`}
                    sub={`${sold.filter(l => new Date(l.createdAt) >= nowMonth).length} Verkäufe diesen Monat`}
                  />
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 10px' }}>Kein Ziel gesetzt</p>
                  <button onClick={() => router.push('/settings')}
                    style={{ fontSize: 12.5, color: '#3b82f6', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Jetzt festlegen →
                  </button>
                </div>
              )}
            </div>
          </div>)}

          {/* ── Chart + Marge row ── */}
          {!loading && <div className="ls-grid-2-1">

            {/* Line chart */}
            <div className="ls-card" style={{ padding: '20px 20px' }}>
              <STitle title="Monatliche Einnahmen">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }}/>Einnahmen
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }}/>Gewinn
                  </span>
                </div>
              </STitle>
              <LineChart data={chartData} />
            </div>

            {/* Marge & Gewinn */}
            <div className="ls-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 4px', fontWeight: 500 }}>Marge & Gewinn</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Ø Marge pro Verkauf</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: '6px 0 0', letterSpacing: '-0.03em' }}>
                  {fmt(sold.length > 0 ? totalProfit / sold.length : 0)} ({Math.round(avgMarginPct)}%)
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 4px' }}>Gesamtgewinn</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: totalProfit > 0 ? '#16a34a' : 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>{fmt(totalProfit)}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 4px' }}>Aktive Listings</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>{active.length}</p>
              </div>
            </div>
          </div>}

          {/* ── Monatsvergleich ── */}
          {!loading && sold.length >= 2 && (() => {
            const now = new Date()
            const startThis  = new Date(now.getFullYear(), now.getMonth(), 1)
            const startPrev  = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const endPrev    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

            const thisMonth  = sold.filter(l => new Date(l.createdAt) >= startThis)
            const prevMonth  = sold.filter(l => { const d = new Date(l.createdAt); return d >= startPrev && d <= endPrev })

            const thisRev  = thisMonth.reduce((s,l) => s + l.price, 0)
            const prevRev  = prevMonth.reduce((s,l) => s + l.price, 0)
            const thisPro  = thisMonth.reduce((s,l) => s + (l.price-(l.buyPrice||0)), 0)
            const prevPro  = prevMonth.reduce((s,l) => s + (l.price-(l.buyPrice||0)), 0)

            const revDiff  = prevRev > 0 ? Math.round(((thisRev - prevRev) / prevRev) * 100) : null
            const proDiff  = prevPro > 0 ? Math.round(((thisPro - prevPro) / prevPro) * 100) : null
            const MO = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

            const Arrow = ({ pct }) => pct === null ? null : (
              <span style={{ fontSize: 11, fontWeight: 800, color: pct >= 0 ? '#10b981' : '#ef4444' }}>
                {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}% vs. {MO[now.getMonth()-1<0?11:now.getMonth()-1]}
              </span>
            )

            return (
              <Card>
                <STitle>📅 Monatsvergleich</STitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Verkäufe', this: thisMonth.length, prev: prevMonth.length, fmt: v => v, diff: prevMonth.length > 0 ? Math.round(((thisMonth.length-prevMonth.length)/prevMonth.length)*100) : null },
                    { label: 'Einnahmen', this: thisRev, prev: prevRev, fmt: v => fmt(v), diff: revDiff },
                    { label: 'Gewinn', this: thisPro, prev: prevPro, fmt: v => fmt(v), diff: proDiff },
                  ].map(col => (
                    <div key={col.label} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg)', borderRadius: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>{col.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{col.fmt(col.this)}</p>
                      <Arrow pct={col.diff} />
                      {col.diff === null && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>kein Vormonat</span>}
                    </div>
                  ))}
                </div>
              </Card>
            )
          })()}

          {/* ── Platform breakdown ── */}
          <Card>
            <STitle>Verkäufe nach Plattform</STitle>
            {sold.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>Noch keine Verkäufe</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pltBreakdown.filter(p => p.count > 0).map(p => (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.dot, display: 'inline-block' }}/>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>{p.name}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-1)' }}>{fmt(p.revenue)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{p.count} Verkauf{p.count !== 1 ? 'e' : ''}</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', background: 'var(--border)', borderRadius: 10, height: 5 }}>
                      <div style={{ height: '100%', borderRadius: 10, background: p.dot, width: `${totalRev > 0 ? (p.revenue / totalRev) * 100 : 0}%`, transition: 'width .5s ease' }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Insights: Was verkauft sich am besten ── */}
          {!loading && sold.length > 0 && (() => {
            // Top Kategorien
            const catMap = {}
            sold.forEach(l => {
              const cat = (l.category || 'Sonstiges').split(' – ')[0]
              if (!catMap[cat]) catMap[cat] = { count:0, revenue:0, profit:0 }
              catMap[cat].count++
              catMap[cat].revenue += l.price || 0
              catMap[cat].profit  += (l.price||0) - (l.buyPrice||0)
            })
            const topCats = Object.entries(catMap).sort((a,b) => b[1].revenue - a[1].revenue).slice(0,4)

            // Bester Wochentag
            const dayMap = { 0:'So',1:'Mo',2:'Di',3:'Mi',4:'Do',5:'Fr',6:'Sa' }
            const dayCount = Array(7).fill(0)
            sold.forEach(l => { dayCount[new Date(l.createdAt).getDay()]++ })
            const bestDay = dayCount.indexOf(Math.max(...dayCount))
            const bestDayCount = dayCount[bestDay]

            // Bester Monat
            const monthMap = {}
            sold.forEach(l => {
              const m = new Date(l.createdAt).toLocaleString('de', { month:'short', year:'numeric' })
              if (!monthMap[m]) monthMap[m] = 0
              monthMap[m]++
            })
            const bestMonth = Object.entries(monthMap).sort((a,b) => b[1]-a[1])[0]

            return (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <Card>
                  <STitle>📊 Was verkauft sich am besten</STitle>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
                    <div style={{ background:'var(--bg)', borderRadius:12, padding:'12px 14px' }}>
                      <p style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 4px' }}>Bester Wochentag</p>
                      <p style={{ fontSize:20, fontWeight:800, color:'var(--text-1)', margin:'0 0 2px' }}>{dayMap[bestDay]}</p>
                      <p style={{ fontSize:11, color:'var(--text-3)', margin:0 }}>{bestDayCount} Verkauf{bestDayCount!==1?'e':''}</p>
                    </div>
                    <div style={{ background:'var(--bg)', borderRadius:12, padding:'12px 14px' }}>
                      <p style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 4px' }}>Bester Monat</p>
                      <p style={{ fontSize:20, fontWeight:800, color:'var(--text-1)', margin:'0 0 2px' }}>{bestMonth?.[0] || '–'}</p>
                      <p style={{ fontSize:11, color:'var(--text-3)', margin:0 }}>{bestMonth?.[1] || 0} Verkäufe</p>
                    </div>
                  </div>
                  <p style={{ fontSize:11, color:'var(--text-3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 8px' }}>Top-Kategorien</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {topCats.map(([cat, data], i) => {
                      const maxRev = topCats[0][1].revenue
                      const colors = ['#6366f1','#8b5cf6','#3b82f6','#10b981']
                      return (
                        <div key={cat}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:12, fontWeight:700, color:colors[i], background:`${colors[i]}18`, padding:'1px 8px', borderRadius:20 }}>{i+1}</span>
                              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{cat}</span>
                            </div>
                            <div style={{ display:'flex', gap:10 }}>
                              <span style={{ fontSize:12, color:'var(--text-3)' }}>{data.count}×</span>
                              <span style={{ fontSize:12.5, fontWeight:700, color:'var(--text-1)' }}>{fmt(data.revenue)}</span>
                              <span style={{ fontSize:12, color:'#10b981', fontWeight:600 }}>+{fmt(data.profit)}</span>
                            </div>
                          </div>
                          <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${(data.revenue/maxRev)*100}%`, background:colors[i], borderRadius:2, transition:'width .5s' }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>
            )
          })()}

          {/* ── Recent listings ── */}
          {listings.length > 0 && (
            <Card>
              <STitle action={
                <button onClick={() => router.push('/listings')}
                  style={{ fontSize: 12.5, color: '#3b82f6', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Alle ansehen →
                </button>
              }>Letzte Listings</STitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {listings.slice(0, 4).map(l => (
                  <div key={l.id} onClick={() => router.push('/listings')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 12, cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {Array.isArray(l.images) && l.images[0]
                      ? <img src={l.images[0]} alt="" style={{ width: 42, height: 42, borderRadius: 11, objectFit: 'cover', flexShrink: 0 }}/>
                      : <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: CARD_COLORS[l.id % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, color: 'var(--text-1)' }}>{l.title.charAt(0)}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{l.title}</p>
                      <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                        <StatusBadge status={l.status}/>
                        {l.platforms.slice(0, 2).map(p => <PlatformBadge key={p} plt={p}/>)}
                      </div>
                    </div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-1)', flexShrink: 0 }}>{fmt(l.price)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Empty ── */}
          {!loading && listings.length === 0 && (
            <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.75" strokeLinecap="round"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-1)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Noch keine Listings</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: '0 0 22px' }}>Erstelle dein erstes Listing und starte durch!</p>
              <button onClick={() => router.push('/new')}
                style={{ padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#22c55e', color: 'var(--text-1)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
                + Erstes Listing erstellen
              </button>
            </Card>
          )}

          {/* ── Uhrzeit-Analyse + Preis-Range ── */}
          {!loading && sold.length >= 3 && (() => {
            // Beste Uhrzeit (0-23)
            const hourCount = Array(24).fill(0)
            sold.forEach(l => { hourCount[new Date(l.createdAt).getHours()]++ })
            const bestHour = hourCount.indexOf(Math.max(...hourCount))
            const bestHourCount = hourCount[bestHour]
            const fmt2 = h => `${h}:00–${h+1}:00`

            // Ø Tage bis Verkauf (createdAt → updatedAt wenn verkauft)
            const withDays = sold.filter(l => l.createdAt && l.updatedAt && l.createdAt !== l.updatedAt)
            const avgDays = withDays.length > 0
              ? Math.round(withDays.reduce((s, l) => s + (new Date(l.updatedAt) - new Date(l.createdAt)) / (1000*60*60*24), 0) / withDays.length)
              : null

            // Preis-Range analyse
            const ranges = [
              { label: '< 10€',    min:0,   max:10  },
              { label: '10–25€',   min:10,  max:25  },
              { label: '25–50€',   min:25,  max:50  },
              { label: '50–100€',  min:50,  max:100 },
              { label: '> 100€',   min:100, max:999 },
            ]
            const rangeData = ranges.map(r => ({
              ...r,
              count:   sold.filter(l => l.price >= r.min && l.price < r.max).length,
              revenue: sold.filter(l => l.price >= r.min && l.price < r.max).reduce((s,l) => s+l.price, 0),
            })).filter(r => r.count > 0)
            const maxRangeCount = Math.max(...rangeData.map(r => r.count), 1)

            return (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {/* Beste Uhrzeit */}
                  <div className="ls-card" style={{ padding:'18px 20px' }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 6px' }}>Beste Uhrzeit</p>
                    <p style={{ fontSize:26, fontWeight:800, color:'var(--text-1)', margin:'0 0 2px', letterSpacing:'-0.03em' }}>{fmt2(bestHour)}</p>
                    <p style={{ fontSize:12, color:'var(--text-3)', margin:0 }}>{bestHourCount} Verkauf{bestHourCount!==1?'e':''} in dieser Stunde</p>
                  </div>
                  {/* Ø Tage bis Verkauf */}
                  <div className="ls-card" style={{ padding:'18px 20px' }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 6px' }}>Ø Verkaufszeit</p>
                    {avgDays !== null ? (
                      <>
                        <p style={{ fontSize:26, fontWeight:800, color:'var(--text-1)', margin:'0 0 2px', letterSpacing:'-0.03em' }}>{avgDays} Tage</p>
                        <p style={{ fontSize:12, color:'var(--text-3)', margin:0 }}>von Listing bis Verkauf</p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize:22, fontWeight:800, color:'var(--text-1)', margin:'0 0 2px' }}>–</p>
                        <p style={{ fontSize:12, color:'var(--text-3)', margin:0 }}>zu wenig Daten</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Preis-Range Analyse */}
                {rangeData.length > 1 && (
                  <Card>
                    <STitle>💰 Preis-Range Analyse</STitle>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {rangeData.sort((a,b) => b.count-a.count).map(r => (
                        <div key={r.label}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{r.label}</span>
                            <div style={{ display:'flex', gap:10 }}>
                              <span style={{ fontSize:12, color:'var(--text-3)' }}>{r.count}×</span>
                              <span style={{ fontSize:12.5, fontWeight:700, color:'var(--text-1)' }}>{fmt(r.revenue)}</span>
                            </div>
                          </div>
                          <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${(r.count/maxRangeCount)*100}%`, background:'#6366f1', borderRadius:2, transition:'width .5s' }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )
          })()}

          {/* ── Einkaufsempfehlung (Wann wieder kaufen?) ── */}
          {!loading && sold.length >= 3 && (() => {
            const catData = {}
            sold.forEach(l => {
              const cat = (l.category || 'Sonstiges').split(' – ')[0]
              if (!catData[cat]) catData[cat] = { sold: 0, active: 0, avgPrice: 0, prices: [] }
              catData[cat].sold++
              catData[cat].prices.push(l.price || 0)
            })
            active.forEach(l => {
              const cat = (l.category || 'Sonstiges').split(' – ')[0]
              if (catData[cat]) catData[cat].active++
            })
            Object.values(catData).forEach(d => {
              d.avgPrice = d.prices.length > 0 ? Math.round(d.prices.reduce((a,b)=>a+b,0)/d.prices.length) : 0
            })
            const recs = Object.entries(catData)
              .filter(([,d]) => d.sold >= 2 && d.active <= 1)
              .sort((a,b) => b[1].sold - a[1].sold)
              .slice(0, 4)

            if (recs.length === 0) return null
            return (
              <Card>
                <STitle>🛒 Einkaufsempfehlung</STitle>
                <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '-10px 0 14px', lineHeight: 1.5 }}>
                  Diese Kategorien verkaufen sich gut — der Lagerbestand ist niedrig.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recs.map(([cat, d]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px' }}>{cat}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                          {d.sold}× verkauft · Ø {fmt(d.avgPrice)} · noch {d.active} aktiv
                        </p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', whiteSpace: 'nowrap' }}>
                        Nachkaufen
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })()}

          {/* ── CTA row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => router.push('/new')}
              style={{ padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#22c55e', color: 'var(--text-1)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(34,197,94,0.25)' }}>
              + Neues Listing
            </button>
            <button onClick={() => router.push('/listings')}
              style={{ padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>
              Alle Listings →
            </button>
          </div>

        </div>
      </main>
      <MobileNav/>
    </div>
  )
}
