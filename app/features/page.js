'use client'
import { useRouter } from 'next/navigation'
import LzShell from '@/components/LzShell'

const MODULES = [
  { icon: '✨', title: 'KI-Texter', desc: 'Stichpunkte rein — perfekter Titel, SEO-Beschreibung und Hashtags raus. In Sekunden.', tag: 'Spart 15 Min / Artikel' },
  { icon: '🚀', title: 'Bulk-Crossposter', desc: 'Ein Artikel, ein Klick — automatisch live auf Vinted, Kleinanzeigen und eBay.', tag: '3 Plattformen, 1 Klick' },
  { icon: '📦', title: '3D-Lagersystem', desc: 'Regal, Box, Fach mit QR-Codes. Du findest jeden Artikel in Sekunden statt Minuten.', tag: 'QR-Codes inklusive' },
  { icon: '📊', title: 'Listing-Score', desc: 'AI-Score 0–100 zeigt dir genau, was an deinem Listing noch fehlt — und behebt es.', tag: 'Mehr Verkäufe' },
  { icon: '💰', title: 'Umsatz-Dashboard', desc: 'Einnahmen, Gewinn und Marge in Echtzeit. Sieh sofort, was sich wirklich lohnt.', tag: 'Live-Analytics' },
  { icon: '🧾', title: 'Buchhaltung', desc: 'Jeder Verkauf sauber erfasst, CSV-Export für die Steuer mit einem Klick.', tag: 'Steuer-ready' },
  { icon: '💬', title: 'Community', desc: 'Discord-Style Community mit Channels, Rängen und Legit-Check unter Resellern.', tag: 'XP & Ränge' },
  { icon: '⚡', title: 'Automatisierungen', desc: 'Auto-Relist, Auto-Rabatt und Preisanpassung — dein Shop arbeitet, während du schläfst.', tag: 'Läuft von allein' },
]

export default function FeaturesPage() {
  const router = useRouter()
  return (
    <LzShell>
      <header className="lzp-hero">
        <p className="lzp-eye">Features</p>
        <h1>Ein Tool, das <span className="ac">alles kann.</span></h1>
        <p>Acht Module ersetzen deinen kompletten Reseller-Tool-Stack — vom Texten über das Crossposten bis zur Steuer.</p>
      </header>
      <section className="lzp-sec">
        <div className="lzp-grid">
          {MODULES.map(m => (
            <div key={m.title} className="lzp-card">
              <div className="lzp-ico">{m.icon}</div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <span className="lzp-tag">{m.tag}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 50 }}>
          <button className="lzp-btn solid" onClick={() => router.push('/register')}>Kostenlos starten →</button>
          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(236,231,223,.45)' }}>Keine Kreditkarte · jederzeit kündbar</p>
        </div>
      </section>
    </LzShell>
  )
}
