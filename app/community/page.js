'use client'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import Aurora from '@/components/Aurora'

// ⚠️ HIER DEINE DISCORD-INVITE-URL EINSETZEN ⚠️
// Tipp: dauerhaften (never-expire) Invite in Discord erstellen:
// Server-Einstellungen → Einladungen → "Bearbeiten" → Läuft nie ab + unbegrenzt
const DISCORD_INVITE = 'https://discord.gg/DEIN-INVITE-CODE'

const PERKS = [
  { emoji: '🛍️', title: 'Verkaufstipps', desc: 'Was läuft gerade, welche Preise ziehen' },
  { emoji: '✅', title: 'Legit-Checks', desc: 'Echtheit gemeinsam prüfen' },
  { emoji: '💡', title: 'Direktes Feedback', desc: 'Feature-Wünsche & Bugs direkt an uns' },
  { emoji: '🚀', title: 'Listing-Optimierung', desc: 'Mehr Reichweite, schnellere Verkäufe' },
]

// Discord-Logo (offizieller Mark, currentColor)
function DiscordMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369A19.79 19.79 0 0016.558 3.2a.074.074 0 00-.079.037c-.34.6-.717 1.385-.98 2.001a18.27 18.27 0 00-5.001 0 12.6 12.6 0 00-.997-2.001.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C1.533 7.59.953 10.733 1.237 13.83a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.009c.12.099.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.891.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-3.177-.838-6.295-2.546-9.435a.061.061 0 00-.031-.028zM8.02 12.945c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

export default function Community() {
  const { data: session } = useSession()
  const firstName = (session?.user?.name || '').split(' ')[0]

  return (
    <div className="ls-page">
      <Aurora />
      <Sidebar />
      <main className="md:ml-60 ls-page-content" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 64px' }}>

          <div className="ls-card" style={{ padding: '40px 32px', textAlign: 'center' }}>

            {/* Discord-Icon-Badge */}
            <div style={{
              width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
              background: '#5865F2', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DiscordMark size={34} />
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
              {firstName ? `${firstName}, komm in die ListSync Community` : 'Tritt der ListSync Community bei'}
            </h1>
            <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 auto 28px', maxWidth: 460 }}>
              Tausch dich mit anderen Resellern aus, hol dir Verkaufstipps und gestalte ListSync mit.
              Unsere Community läuft auf Discord — nur für eingeloggte Mitglieder.
            </p>

            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '13px 28px', borderRadius: 12,
                background: '#5865F2', color: '#fff', fontWeight: 700, fontSize: 15,
                textDecoration: 'none', transition: 'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <DiscordMark size={20} />
              Discord beitreten
            </a>

            {/* Perks */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14, marginTop: 36, textAlign: 'left',
            }}>
              {PERKS.map(p => (
                <div key={p.title} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '14px 16px', borderRadius: 12,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{p.emoji}</span>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px' }}>{p.title}</p>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4, margin: 0 }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
