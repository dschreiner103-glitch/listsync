'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const CREAM = '#ece7df'
const ACC = '#f4511e'

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
  lager:      <Ic><path d="M5 8h14M5 8a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v0a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/><path d="M10 12h4"/></Ic>,
  settings:   <Ic><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></Ic>,
  community:  <Ic><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Ic>,
  logout:     <Ic><path d="M17 16l4-4m0 0l-4-4m4 4H7"/><path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3"/></Ic>,
  plus:       <Ic><path d="M12 5v14M5 12h14"/></Ic>,
  upgrade:    <Ic><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></Ic>,
}

const NAV = [
  { section: 'NAVIGATION' },
  { href: '/dashboard',   icon: 'dashboard', label: 'Dashboard' },
  { href: '/listings',    icon: 'listings',  label: 'Meine Listings', showCount: true },
  { href: '/lager',       icon: 'lager',     label: 'Lager' },
  { section: 'AUSWERTUNG' },
  { href: '/buchhaltung', icon: 'chart',     label: 'Buchhaltung' },
  { href: '/belege',      icon: 'receipt',   label: 'Belege' },
  { section: 'COMMUNITY' },
  { href: '/community',   icon: 'community', label: 'Community' },
  { section: 'SYSTEM' },
  { href: '/pricing',     icon: 'upgrade',   label: 'Upgrade' },
  { href: '/settings',    icon: 'settings',  label: 'Einstellungen' },
]

export default function Sidebar({ activeCount = 0 }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { data: session } = useSession()

  const userName  = session?.user?.name  || session?.user?.email || 'User'
  const userInit  = userName.charAt(0).toUpperCase()
  const userEmail = session?.user?.email || ''

  return (
    <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 z-20"
      style={{ background: '#0a0a0c', borderRight: '1px solid rgba(236,231,223,0.08)' }}>

      {/* ── Logo ── */}
      <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid rgba(236,231,223,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: ACC,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: '-0.04em',
          boxShadow: '0 4px 14px rgba(244,81,30,.4)',
        }}>LS</div>
        <span style={{ fontWeight: 800, fontSize: 16, color: CREAM, letterSpacing: '-0.03em' }}>ListSync</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          padding: '2px 8px', borderRadius: 20,
          background: 'rgba(244,81,30,0.15)', color: '#ff8a5c', border: '1px solid rgba(244,81,30,0.25)',
        }}>BETA</span>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>

        {/* New Listing CTA — magnetisch */}
        <button data-magnetic onClick={() => router.push('/new')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '11px 16px', margin: '4px 0 16px', borderRadius: 12,
            background: 'linear-gradient(135deg, #ff6a3d, #f4511e)', color: '#fff', fontWeight: 700, fontSize: 13.5,
            border: 'none', cursor: 'pointer', willChange: 'transform',
            boxShadow: '0 6px 20px rgba(244,81,30,.4)',
            transition: 'transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, filter .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.07)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(244,81,30,.55)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(244,81,30,.4)' }}>
          {ICONS.plus}
          Neues Listing
        </button>

        {NAV.map((n, i) => {
          if (n.section) return (
            <p key={i} style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em',
              color: 'rgba(236,231,223,0.40)', textTransform: 'uppercase',
              padding: '14px 12px 6px', margin: 0,
            }}>{n.section}</p>
          )
          const active = pathname.startsWith(n.href)
          return (
            <button key={n.href} onClick={() => router.push(n.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                width: '100%', padding: '9px 12px', marginBottom: 2, borderRadius: 10,
                fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: 'left',
                cursor: 'pointer', border: '1px solid transparent',
                background: active ? 'rgba(244,81,30,0.10)' : 'transparent',
                color: active ? CREAM : 'rgba(236,231,223,0.52)',
                borderColor: active ? 'rgba(244,81,30,0.22)' : 'transparent',
                transition: 'background .12s, color .12s, border-color .12s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(236,231,223,0.05)'; e.currentTarget.style.color = CREAM }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(236,231,223,0.52)' }}}>
              <span style={{ color: active ? ACC : 'inherit', display: 'flex' }}>{ICONS[n.icon]}</span>
              {n.label}
              {n.showCount && activeCount > 0 && (
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 10,
                  background: 'rgba(244,81,30,0.16)', color: '#ff8a5c',
                }}>{activeCount}</span>
              )}
              {active && (
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 6, height: 6, borderRadius: '50%', background: ACC,
                  boxShadow: '0 0 8px rgba(244,81,30,.8)',
                  ...(n.showCount && activeCount > 0 ? { display: 'none' } : {}),
                }}/>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── User ── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(236,231,223,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: 'rgba(236,231,223,0.06)', border: '1px solid rgba(236,231,223,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: CREAM, fontWeight: 700, fontSize: 12,
        }}>{userInit}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: CREAM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{userName}</p>
          <p style={{ fontSize: 11, color: 'rgba(236,231,223,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{userEmail}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })} title="Abmelden"
          style={{ background: 'none', border: 'none', color: 'rgba(236,231,223,0.45)', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color .12s' }}
          onMouseEnter={e => e.currentTarget.style.color = CREAM}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(236,231,223,0.45)'}>
          {ICONS.logout}
        </button>
      </div>
    </aside>
  )
}
