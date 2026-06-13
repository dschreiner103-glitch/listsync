'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LzShell from '@/components/LzShell'

const FAQ = [
  { cat: 'general', q: 'Was ist ListSync?', a: 'Ein Crosslisting-Tool für Reseller. Du legst einen Artikel einmal an und postest ihn automatisch auf Vinted, Kleinanzeigen und eBay — inklusive KI-Texten, Lager und Analytics.' },
  { cat: 'general', q: 'Brauche ich technisches Wissen?', a: 'Nein. Du fotografierst deinen Artikel, die KI schreibt den Rest und ein Klick verteilt alles. Kein Setup, keine Programmierung.' },
  { cat: 'general', q: 'Sind meine Daten sicher?', a: 'Deine Listings und Verkaufsdaten liegen geschützt in deinem Account. Wir verkaufen keine Daten weiter.' },
  { cat: 'pricing', q: 'Was kostet ListSync?', a: 'Du startest kostenlos (bis 5 Listings, 1 Plattform). Pro kostet 9,99€/Monat für alles unlimitiert, oder einmalig 79€ Lifetime — kein Abo.' },
  { cat: 'pricing', q: 'Kann ich jederzeit kündigen?', a: 'Ja. Pro ist monatlich kündbar, ohne Mindestlaufzeit. Keine Kreditkarte nötig, um kostenlos zu starten.' },
  { cat: 'pricing', q: 'Wie funktioniert Lifetime?', a: 'Einmalig 79€ und du hast Pro für immer — alle künftigen Updates inklusive, keine monatlichen Kosten.' },
  { cat: 'program', q: 'Auf welchen Plattformen kann ich posten?', a: 'Aktuell Vinted, Kleinanzeigen und eBay — alle gleichzeitig mit einem Klick über die Chrome Extension.' },
  { cat: 'program', q: 'Wie funktioniert das Crossposting?', a: 'Über die ListSync Chrome Extension. Du klickst „Crossposten", die Extension öffnet die Plattformen und füllt alle Formulare inklusive Bildern automatisch aus.' },
  { cat: 'program', q: 'Funktioniert es auch mobil?', a: 'Das Dashboard, Lager und Analytics sind voll mobil nutzbar. Das automatische Crossposting läuft über die Chrome Extension am Desktop.' },
]
const TABS = [['general', 'Allgemein'], ['pricing', 'Preise'], ['program', 'Programm']]

function Item({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fitem" data-open={open ? '1' : '0'} onClick={() => setOpen(o => !o)}>
      <div className="fq"><span>{q}</span><span className="fplus">+</span></div>
      <div className="fa-wrap"><p className="fa">{a}</p></div>
    </div>
  )
}

export default function FaqPage() {
  const router = useRouter()
  const [cat, setCat] = useState('general')
  return (
    <LzShell>
      <style>{`
        .ftabs{ display:flex; gap:10px; justify-content:center; margin:30px 0 28px; flex-wrap:wrap; }
        .ftab{ padding:11px 24px; border-radius:40px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; border:1px solid rgba(236,231,223,.16); background:transparent; color:rgba(236,231,223,.7); transition:all .25s; }
        .ftab.on{ background:#ece7df; color:#08080a; border-color:transparent; }
        .flist{ max-width:820px; margin:0 auto; padding:0 24px 80px; display:flex; flex-direction:column; gap:12px; }
        .fitem{ border:1px solid rgba(236,231,223,.12); border-radius:16px; padding:22px 24px; cursor:pointer; transition:border-color .25s,background .25s; }
        .fitem:hover{ border-color:rgba(236,231,223,.28); }
        .fitem[data-open="1"]{ border-color:rgba(244,81,30,.45); background:rgba(244,81,30,.04); }
        .fq{ display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .fq span:first-child{ font-size:16.5px; font-weight:700; }
        .fplus{ font-size:24px; color:#f4511e; transition:transform .25s; line-height:1; }
        .fitem[data-open="1"] .fplus{ transform:rotate(45deg); }
        .fa-wrap{ display:grid; grid-template-rows:0fr; transition:grid-template-rows .3s ease; }
        .fitem[data-open="1"] .fa-wrap{ grid-template-rows:1fr; }
        .fa{ overflow:hidden; margin:0; font-size:15px; color:rgba(236,231,223,.7); line-height:1.65; }
        .fitem[data-open="1"] .fa{ margin-top:14px; }
      `}</style>

      <header className="lzp-hero">
        <p className="lzp-eye">Hilfe-Center</p>
        <h1>Alle Fragen, <span className="ac">beantwortet.</span></h1>
        <p>Alles, was du über ListSync wissen musst.</p>
      </header>

      <div className="ftabs">
        {TABS.map(([id, lb]) => (
          <button key={id} className={'ftab' + (cat === id ? ' on' : '')} onClick={() => setCat(id)}>{lb}</button>
        ))}
      </div>

      <div className="flist">
        {FAQ.filter(f => f.cat === cat).map(f => <Item key={f.q} {...f} />)}
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button className="lzp-btn solid" onClick={() => router.push('/register')}>Jetzt kostenlos starten →</button>
        </div>
      </div>
    </LzShell>
  )
}
