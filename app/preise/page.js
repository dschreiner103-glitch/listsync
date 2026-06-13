'use client'
import { useRouter } from 'next/navigation'
import LzShell from '@/components/LzShell'

const PLANS = [
  { name: 'Free', price: '0€', note: 'Zum Reinschnuppern', feat: ['Bis zu 5 Listings', '1 Plattform', 'KI-Texter (limitiert)', 'Basis-Analytics'], cta: 'Kostenlos starten', solid: false },
  { name: 'Pro', price: '9,99€', unit: '/Monat', note: 'Monatlich kündbar', badge: 'Beliebt', feat: ['Unlimitierte Listings', 'Alle 3 Plattformen', 'Bulk-Crossposten', 'Voller KI-Assistent', 'Lager & QR-Codes', 'Vollständige Analytics', 'Community & Ränge', 'Priority Support'], cta: 'Pro holen →', solid: true, feat_: true },
  { name: 'Lifetime', price: '79€', unit: ' einmalig', note: 'Pro für immer · kein Abo', feat: ['Alles aus Pro', 'Einmalzahlung', 'Alle künftigen Updates', 'Keine monatlichen Kosten'], cta: 'Lifetime sichern', solid: false },
]

export default function PreisePage() {
  const router = useRouter()
  const go = () => router.push('/register')
  return (
    <LzShell>
      <style>{`
        .pp-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; align-items:stretch; max-width:1080px; margin:0 auto; }
        @media(max-width:820px){ .pp-grid{grid-template-columns:1fr} }
        .pp-card{ position:relative; background:rgba(236,231,223,.03); border:1px solid rgba(236,231,223,.12); border-radius:22px; padding:34px 30px; display:flex; flex-direction:column; transition:transform .3s; }
        .pp-card:hover{ transform:translateY(-6px); }
        .pp-card.feat{ background:linear-gradient(160deg,rgba(244,81,30,.16),rgba(244,81,30,.04)); border-color:rgba(244,81,30,.45); box-shadow:0 0 60px rgba(244,81,30,.15); }
        .pp-name{ font-size:13px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:rgba(236,231,223,.7); }
        .pp-price{ font-size:clamp(40px,5vw,58px); font-weight:800; letter-spacing:-.03em; margin:14px 0 2px; }
        .pp-price small{ font-size:16px; font-weight:600; color:rgba(236,231,223,.5); }
        .pp-note{ font-size:13px; color:rgba(236,231,223,.5); margin:0 0 22px; }
        .pp-card ul{ list-style:none; padding:0; margin:0 0 26px; display:flex; flex-direction:column; gap:11px; flex:1; }
        .pp-card li{ display:flex; gap:10px; font-size:14px; color:rgba(236,231,223,.85); }
        .pp-card li::before{ content:'✓'; color:#f4511e; font-weight:800; }
        .pp-badge{ position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:#f4511e; color:#fff; font-size:11px; font-weight:800; letter-spacing:.06em; padding:5px 14px; border-radius:30px; }
        .pp-btn{ width:100%; border:none; border-radius:60px; padding:16px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:background .3s,color .3s,border-color .3s; }
        .pp-btn.solid{ background:#ece7df; color:#08080a; } .pp-btn.solid:hover{ background:#f4511e; color:#fff; }
        .pp-btn.out{ background:transparent; color:#ece7df; border:1px solid rgba(236,231,223,.3); } .pp-btn.out:hover{ border-color:#ece7df; }
      `}</style>

      <header className="lzp-hero">
        <p className="lzp-eye">Preise</p>
        <h1>Fair, transparent, <span className="ac">jederzeit kündbar.</span></h1>
        <p>Starte kostenlos. Upgrade, wenn du wächst. Kein Risiko, keine versteckten Kosten.</p>
      </header>

      <section className="lzp-sec">
        <div className="pp-grid">
          {PLANS.map(p => (
            <div key={p.name} className={'pp-card' + (p.feat_ ? ' feat' : '')}>
              {p.badge && <span className="pp-badge">{p.badge}</span>}
              <span className="pp-name">{p.name}</span>
              <p className="pp-price">{p.price}{p.unit && <small>{p.unit}</small>}</p>
              <p className="pp-note">{p.note}</p>
              <ul>{p.feat.map(f => <li key={f}>{f}</li>)}</ul>
              <button className={'pp-btn ' + (p.solid ? 'solid' : 'out')} onClick={go}>{p.cta}</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'rgba(236,231,223,.5)' }}>
          Noch Fragen? <a onClick={() => router.push('/faq')} style={{ color: '#f4511e', fontWeight: 700, cursor: 'pointer' }}>Zum FAQ →</a>
        </p>
      </section>
    </LzShell>
  )
}
