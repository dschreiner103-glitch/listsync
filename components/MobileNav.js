'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useDark } from '@/lib/theme'
import { useState } from 'react'

function NavIcon({ children, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const items = [
  {
    href: '/dashboard', label: 'Home',
    icon: (
      <NavIcon>
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </NavIcon>
    ),
  },
  {
    href: '/listings', label: 'Listings',
    icon: (
      <NavIcon>
        <path d="M9 6h11M9 12h11M9 18h11"/>
        <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none"/>
      </NavIcon>
    ),
  },
  { primary: true },
  {
    href: '/buchhaltung', label: 'Buchh.',
    icon: (
      <NavIcon>
        <rect x="3" y="12" width="4" height="9" rx="1"/>
        <rect x="10" y="7" width="4" height="14" rx="1"/>
        <rect x="17" y="3" width="4" height="18" rx="1"/>
      </NavIcon>
    ),
  },
  {
    href: '/settings', label: 'Settings',
    icon: (
      <NavIcon>
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </NavIcon>
    ),
  },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { dark } = useDark()
  const [pressed, setPressed] = useState(null)

  const handleNav = (href) => {
    setPressed(href)
    router.push(href)
    setTimeout(() => setPressed(null), 300)
  }

  return (
    <>
      <style>{`
        @keyframes slideUpNav {
          from { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.9); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);   }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9);  opacity: 0.7; }
          70%  { transform: scale(1.45); opacity: 0; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.4) translateX(-50%); }
          60%  { transform: scale(1.3)  translateX(-50%); }
          100% { opacity: 1; transform: scale(1)   translateX(-50%); }
        }
        @keyframes icon-bounce {
          0%,100% { transform: translateY(0) scale(1); }
          40%     { transform: translateY(-5px) scale(1.15); }
          70%     { transform: translateY(-2px) scale(1.05); }
        }
        .mn-btn { -webkit-tap-highlight-color: transparent; }
        .mn-btn:active { transform: scale(0.82) !important; }
      `}</style>

      <nav className="md:hidden"
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 28px)',
          maxWidth: 430,
          zIndex: 100,
          background: dark ? 'rgba(7, 9, 16, 0.82)' : 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRadius: 30,
          border: dark
            ? '1px solid rgba(255,255,255,0.09)'
            : '1px solid rgba(0,0,0,0.07)',
          boxShadow: dark
            ? '0 12px 50px rgba(0,0,0,0.65), inset 0 0 0 0.5px rgba(255,255,255,0.05), 0 0 80px rgba(99,102,241,0.12)'
            : '0 12px 50px rgba(15,23,42,0.18), 0 3px 12px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.95)',
          padding: '8px 10px',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          animation: 'slideUpNav 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}>

        {items.map((n, i) => {
          if (n.primary) return (
            <button key="new"
              className="mn-btn"
              onPointerDown={() => setPressed('new')}
              onPointerUp={() => { setPressed(null); router.push('/new') }}
              onPointerLeave={() => setPressed(null)}
              style={{
                width: 54, height: 54,
                flexShrink: 0,
                background: 'linear-gradient(145deg, #818cf8 0%, #6366f1 45%, #4f46e5 100%)',
                borderRadius: 20,
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: pressed === 'new'
                  ? '0 2px 10px rgba(99,102,241,0.4)'
                  : '0 5px 24px rgba(99,102,241,0.6), 0 0 50px rgba(99,102,241,0.25)',
                transform: pressed === 'new'
                  ? 'scale(0.84) translateY(3px)'
                  : 'scale(1) translateY(0)',
                transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
              }}>
              <div style={{
                position: 'absolute', inset: -6,
                borderRadius: 26,
                border: '2px solid rgba(99,102,241,0.55)',
                animation: 'pulse-ring 2.2s cubic-bezier(0.4,0,0.6,1) infinite',
                pointerEvents: 'none',
              }}/>
              <div style={{
                position: 'absolute', inset: -11,
                borderRadius: 31,
                border: '1.5px solid rgba(99,102,241,0.3)',
                animation: 'pulse-ring 2.2s cubic-bezier(0.4,0,0.6,1) 0.6s infinite',
                pointerEvents: 'none',
              }}/>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          )

          const active = pathname.startsWith(n.href)
          return (
            <button key={n.href}
              className="mn-btn"
              onPointerDown={() => setPressed(n.href)}
              onPointerUp={() => { setPressed(null); router.push(n.href) }}
              onPointerLeave={() => setPressed(null)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                border: 'none', background: 'none', cursor: 'pointer',
                padding: '9px 14px', borderRadius: 20,
                color: active ? '#6366f1' : dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
                transform: pressed === n.href
                  ? 'scale(0.80)'
                  : active ? 'translateY(-1px)' : 'translateY(0)',
                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), color 0.2s, background 0.2s',
                position: 'relative',
                minWidth: 0,
                fontFamily: 'inherit',
                background: active
                  ? (dark ? 'rgba(99,102,241,0.14)' : 'rgba(99,102,241,0.08)')
                  : 'transparent',
              }}>

              {/* radial glow behind active icon */}
              {active && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 20,
                  background: 'radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.28), transparent 70%)',
                  pointerEvents: 'none',
                }}/>
              )}

              {/* icon with drop-shadow glow when active */}
              <div style={{
                filter: active ? 'drop-shadow(0 0 7px rgba(99,102,241,0.75))' : 'none',
                transform: active ? 'scale(1.12)' : 'scale(1)',
                transition: 'filter 0.3s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                animation: 'none',
              }}>
                {n.icon}
              </div>

              <span style={{
                fontSize: 9.5, fontWeight: active ? 700 : 500,
                letterSpacing: active ? '0.03em' : 0,
              }}>{n.label}</span>

              {/* glowing dot indicator */}
              {active && (
                <span style={{
                  position: 'absolute', bottom: 4, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#6366f1',
                  boxShadow: '0 0 10px rgba(99,102,241,0.9), 0 0 20px rgba(99,102,241,0.5)',
                  animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                }}/>
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}
