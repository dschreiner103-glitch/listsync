'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useDark } from '@/lib/theme'

function NavIcon({ children }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const items = [
  {
    href: '/dashboard', label: 'Home',
    icon: <NavIcon><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></NavIcon>,
  },
  {
    href: '/listings', label: 'Listings',
    icon: <NavIcon><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none"/></NavIcon>,
  },
  { primary: true },
  {
    href: '/buchhaltung', label: 'Buchh.',
    icon: <NavIcon><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></NavIcon>,
  },
  {
    href: '/settings', label: 'Settings',
    icon: <NavIcon><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></NavIcon>,
  },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { dark, toggle } = useDark()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex ls-mobile-nav"
      style={{
        background: 'var(--surface)', minHeight: 60,
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -2px 16px rgba(15,23,42,0.06)',
      }}>
      {items.map((n, i) => {
        if (n.primary) return (
          <button key="new" onClick={() => router.push('/new')}
            className="flex-1 flex flex-col items-center justify-center"
            style={{ border: 'none', background: 'none', cursor: 'pointer', paddingBottom: 8 }}>
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', marginTop: -24,
              boxShadow: '0 6px 18px rgba(99,102,241,0.45), 0 0 0 4px var(--bg)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, marginTop: 4 }}>Neu</span>
          </button>
        )
        const active = pathname.startsWith(n.href)
        return (
          <button key={n.href} onClick={() => router.push(n.href)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: active ? '#6366f1' : 'var(--text-3)', position: 'relative', paddingBottom: 8, minHeight: 60 }}>
            {n.icon}
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{n.label}</span>
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 2.5, borderRadius: '0 0 3px 3px',
                background: '#6366f1',
              }}/>
            )}
          </button>
        )
      })}
    </nav>
  )
}
