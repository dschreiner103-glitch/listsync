'use client'
import { useRouter } from 'next/navigation'
import LzShell from '@/components/LzShell'

const VALUES = [
  { icon: '⚡', title: 'Radikal einfach', desc: 'Fotografieren, der Rest läuft. Keine Technik, kein Setup, keine Lernkurve.' },
  { icon: '🎯', title: 'Für Reseller gebaut', desc: 'Jede Funktion entsteht aus echtem Reseller-Alltag — nichts Überflüssiges.' },
  { icon: '🔒', title: 'Deine Daten gehören dir', desc: 'Verkaufsdaten geschützt in deinem Account. Wir verkaufen nichts weiter.' },
]

const OLD = ['Jeden Artikel 3× per Hand eintippen', 'Texte selbst schreiben', '4–5 Apps gleichzeitig offen', 'Kein Überblick über Gewinn']
const NEW = ['1× anlegen → 1 Klick auf alle Plattformen', 'KI schreibt Titel, Text & Hashtags', 'Alles in einem Tool', 'Umsatz & Gewinn automatisch getrackt']

export default function VisionPage() {
  const router = useRouter()
  return (
    <LzShell>
      <style>{`
        .vstmt{ max-width:1000px; margin:0 auto; padding:30px 24px 20px; }
        .vstmt p{ font-size:clamp(26px,4.6vw,52px); font-weight:300; line-height:1.2; letter-spacing:-.02em; color:rgba(236,231,223,.92); }
        .vstmt .ac{ color:#f4511e; font-style:italic; font-weight:500; }
        .vs-ways{ display:grid; grid-template-columns:1fr 1fr; gap:18px; max-width:900px; margin:10px auto 0; }
        @media(max-width:760px){ .vs-ways{grid-template-columns:1fr} }
        .vs-way{ border:1px solid rgba(236,231,223,.12); border-radius:20px; padding:30px; }
        .vs-way.neu{ background:linear-gradient(160deg,rgba(244,81,30,.14),rgba(244,81,30,.03)); border-color:rgba(244,81,30,.4); }
        .vs-way h4{ font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:rgba(236,231,223,.6); margin:0 0 14px; }
        .vs-way .row{ display:flex; gap:10px; font-size:14.5px; padding:9px 0; color:rgba(236,231,223,.82); border-bottom:1px solid rgba(236,231,223,.06); }
      `}</style>

      <header className="lzp-hero">
        <p className="lzp-eye">Vision</p>
        <h1>Verkaufen, wie es <span className="ac">sein sollte.</span></h1>
        <p>Reselling soll Spaß machen, nicht in Fleißarbeit ertrinken. Deshalb gibt es ListSync.</p>
      </header>

      <section className="vstmt">
        <p>
          Wir folgen keinen Trends. Wir bauen das Tool, das Reseller wirklich brauchen — <span className="ac">schnell, schön und radikal einfach.</span> Du fotografierst, der Rest passiert von allein.
        </p>
      </section>

      <section className="lzp-sec">
        <div className="lzp-grid">
          {VALUES.map(v => (
            <div key={v.title} className="lzp-card">
              <div className="lzp-ico">{v.icon}</div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lzp-sec" style={{ paddingTop: 10 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 30px' }}>
          Zwei Wege, <span style={{ color: '#f4511e' }}>eine Entscheidung.</span>
        </h2>
        <div className="vs-ways">
          <div className="vs-way">
            <h4>Der alte Weg</h4>
            {OLD.map(x => <div key={x} className="row"><span style={{ color: '#ef4444' }}>✕</span>{x}</div>)}
          </div>
          <div className="vs-way neu">
            <h4>Mit ListSync</h4>
            {NEW.map(x => <div key={x} className="row"><span style={{ color: '#f4511e' }}>✓</span>{x}</div>)}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 44 }}>
          <button className="lzp-btn solid" onClick={() => router.push('/register')}>Jetzt kostenlos starten →</button>
        </div>
      </section>
    </LzShell>
  )
}
