'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'

// Öffentliche Seiten (ohne Login erreichbar)
const PUBLIC = ['/', '/login', '/register']
// Das Plan-Auswahl-Gate
const GATE = '/pricing'

function Loader() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #07070f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(127,127,127,0.25)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )
}

export default function RouteGuard({ children }) {
  const { status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const onboardedRef = useRef(false)   // einmal true → bleibt true (kein Refetch nötig)

  const isPublic = PUBLIC.includes(pathname)

  useEffect(() => {
    let active = true
    setReady(false)

    ;(async () => {
      if (status === 'loading') return

      // ── Nicht eingeloggt ──
      if (status === 'unauthenticated') {
        onboardedRef.current = false
        if (!isPublic) { router.replace('/login'); return }
        if (active) setReady(true)
        return
      }

      // ── Eingeloggt: Onboarding-Status prüfen ──
      let onboarded = onboardedRef.current
      if (!onboarded) {
        try {
          const res = await fetch('/api/subscription')
          const data = await res.json()
          onboarded = !!data.onboarded
          if (onboarded) onboardedRef.current = true
        } catch { /* im Zweifel als nicht-onboarded behandeln */ }
      }
      if (!active) return

      if (!onboarded) {
        // Plan noch nicht gewählt → immer aufs Gate
        if (pathname !== GATE) { router.replace('/pricing'); return }
        if (active) setReady(true)
      } else {
        // Hat Zugriff → von öffentlichen/Auth-Seiten direkt ins Dashboard
        if (isPublic) { router.replace('/dashboard'); return }
        if (active) setReady(true)
      }
    })()

    return () => { active = false }
  }, [status, pathname])

  // Öffentliche Seiten sofort rendern; geschützte erst nach Check
  if (isPublic) return children
  return ready ? children : <Loader />
}
