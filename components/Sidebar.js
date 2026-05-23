'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useDark } from '@/lib/theme'

function Ic({ children, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ICONS = {
  dashboard:  <Ic><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Ic>,
  listings:   <Ic><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none"/></Ic>,
  chart:      <Ic><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></Ic>,
  receipt:    <Ic><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"/></Ic>,
  settings:   <Ic><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></Ic>,
  logout:     <Ic><path d="M17 16l4-4m0 0l-4-4m4 4H7"/><path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3"/></Ic>,
  plus:       <Ic><path d="M12 5v14M5 12h14"/></Ic>,
}

const NAV = [
  { section: 'NAVIGATION' },
  { href: '/dashboard',   icon: 'dashboard', label: 'Dashboard' },
  { href: '/listings',    icon: 'listings',  label: 'Meine Listings', showCount: true },
  { section: 'AUSWERTUNG' },
  { href: '/buchhaltung', icon: 'chart',     label: 'Buchhaltung' },
  { href: '/belege',      icon: 'receipt',   label: 'Belege' },
  { section: 'SYSTEM' },
  { href: '/settings',    icon: 'settings',  label: 'Einstellungen' },
]

export default function Sidebar({ activeCount = 0 }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { data: session } = useSession()
  const { dark, toggle } = useDark()

  const userName  = session?.user?.name  || session?.user?.email || 'User'
  const userInit  = userName.charAt(0).toUpperCase()
  const userEmail = session?.user?.email || ''

  return (
    <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 z-20"
      style={{ background: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* ── Logo ── */}
      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: '#22c55e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#111827', fontWeight: 900, fontSize: 13, letterSpacing: '-0.04em',
        }}>LS</div>
        <span style={{ fontWeight: 800, fontSize: 15.5, color: '#f9fafb', letterSpacing: '-0.02em' }}>ListSync</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
          padding: '2px 7px', borderRadius: 20,
          background: 'rgba(34,197,94,0.15)', color: '#22c55e',
        }}>BETA</span>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>

        {/* New Listing CTA */}
        <button onClick={() => router.push('/new')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '9px 16px', margin: '4px 0 14px', borderRadius: 10,
            background: '#22c55e', color: '#111827', fontWeight: 700, fontSize: 13.5,
            border: 'none', cursor: 'pointer', transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {ICONS.plus}
          Neues Listing
        </button>

        {NAV.map((n, i) => {
          if (n.section) return (
            <p key={i} style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em',
              color: 'var(--text-2)', textTransform: 'uppercase',
              padding: '12px 12px 5px', margin: 0,
            }}>{n.section}</p>
          )
          const active = pathname.startsWith(n.href)
          return (
            <button key={n.href} onClick={() => router.push(n.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '8.5px 12px', marginBottom: 2, borderRadius: 9,
                fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: 'left',
                cursor: 'pointer', border: 'none',
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: active ? '#f9fafb' : '#6b7280',
                transition: 'background .12s, color .12s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#d1d5db' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}}>
              {ICONS[n.icon]}
              {n.label}
              {n.showCount && activeCount > 0 && (
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 10,
                  background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                }}>{activeCount}</span>
              )}
              {active && (
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
                  ...(n.showCount && activeCount > 0 ? { display: 'none' } : {}),
                }}/>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── User ── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#9ca3af', fontWeight: 700, fontSize: 12,
        }}>{userInit}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{userName}</p>
          <p style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{userEmail}</p>
        </div>
        <button onClick={toggle} title={dark ? 'Light Mode' : 'Dark Mode'}
          style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color .12s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
          onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
          {dark
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          }
        </button>
        <button onClick={() => signOut({ callbackUrl: '/login' })} title="Abmelden"
          style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color .12s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
          onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
          {ICONS.logout}
        </button>
      </div>
    </aside>
  )
}
