'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const ACC = { a:'#f4511e', aDeep:'#c81e1e', aSoft:'#ff8a4c', a2:'#e11d2a', glow:'244,81,30' }

function useTilt(strength = 10) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(800px) rotateY(${x*strength}deg) rotateX(${-y*strength}deg) scale(1.03)`
    }
    const leave = () => { el.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)' }
    el.addEventListener('mousemove', move); el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [strength])
  return ref
}

function useReveal() {
  const ref = useRef(null); const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.12 })
    if (ref.current) o.observe(ref.current); return () => o.disconnect()
  }, [])
  return [ref, v]
}

function ModuleCard({ n, icon, title, desc, tag, delay = 0 }) {
  const tilt = useTilt(8); const [ref, vis] = useReveal()
  return (
    <div ref={ref} style={{ opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(40px)', transition:`all .6s ease ${delay}s` }}>
      <div ref={tilt} className="module-card" style={{ background:'#0c0c11', border:'1px solid rgba(255,255,255,.08)', borderRadius:20, overflow:'hidden', transition:'transform .18s ease, box-shadow .2s, border-color .2s', transformStyle:'preserve-3d' }}>
        <div style={{ height:110, position:'relative', background:'linear-gradient(135deg,rgba(var(--glow),.35),rgba(var(--glow),.06) 60%,transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:44, filter:'drop-shadow(0 4px 12px rgba(0,0,0,.4))' }}>{icon}</span>
          <span style={{ position:'absolute', top:12, left:14, fontSize:11, fontWeight:900, color:'var(--aSoft)', letterSpacing:'.1em', background:'rgba(0,0,0,.35)', padding:'3px 9px', borderRadius:20 }}>MODUL {n}</span>
        </div>
        <div style={{ padding:'20px 22px 24px' }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:'#f8fafc', margin:'0 0 8px' }}>{title}</h3>
          <p style={{ fontSize:13.5, color:'#94a3b8', margin:'0 0 14px', lineHeight:1.6 }}>{desc}</p>
          <span style={{ fontSize:11.5, fontWeight:700, color:'var(--aSoft)', background:'rgba(var(--glow),.12)', border:'1px solid rgba(var(--glow),.22)', padding:'4px 10px', borderRadius:8 }}>{tag}</span>
        </div>
      </div>
    </div>
  )
}

function Orb({ size, x, y, color, dur }) {
  return <div style={{ position:'absolute', left:`${x}%`, top:`${y}%`, width:size, height:size, borderRadius:'50%', background:`radial-gradient(circle,${color},transparent 70%)`, filter:'blur(70px)', pointerEvents:'none', animation:`float${dur} ${dur}s ease-in-out infinite` }}/>
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background:'rgba(255,255,255,.025)', border:`1px solid ${open?'rgba(var(--glow),.35)':'rgba(255,255,255,.08)'}`, borderRadius:16, padding:'20px 22px', cursor:'pointer', transition:'border-color .2s' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <span style={{ fontSize:15.5, fontWeight:700, color:'#f1f5f9' }}>{q}</span>
        <span style={{ fontSize:22, color:'var(--a)', transform:open?'rotate(45deg)':'none', transition:'transform .2s' }}>+</span>
      </div>
      <div style={{ maxHeight:open?220:0, overflow:'hidden', transition:'max-height .3s ease', opacity:open?1:0 }}>
        <p style={{ fontSize:14, color:'#94a3b8', margin:'14px 0 0', lineHeight:1.65 }}>{a}</p>
      </div>
    </div>
  )
}

const MODULES = [
  { n:'01', icon:'✨', title:'KI-Texter',        desc:'Stichpunkte rein — perfekter Titel, SEO-Beschreibung und Hashtags raus. In Sekunden.', tag:'Spart 15 Min / Artikel' },
  { n:'02', icon:'🚀', title:'Bulk-Crossposter', desc:'Ein Artikel, ein Klick — automatisch live auf Vinted, Kleinanzeigen und eBay.', tag:'3 Plattformen, 1 Klick' },
  { n:'03', icon:'📦', title:'3D-Lagersystem',    desc:'Regal, Box, Fach mit QR-Codes. Du findest jeden Artikel in Sekunden statt Minuten.', tag:'QR-Codes inklusive' },
  { n:'04', icon:'📊', title:'Listing-Score',     desc:'AI-Score 0–100 zeigt dir genau, was an deinem Listing noch fehlt — und behebt es.', tag:'Mehr Verkäufe' },
  { n:'05', icon:'💰', title:'Umsatz-Dashboard',  desc:'Einnahmen, Gewinn und Marge in Echtzeit. Sieh sofort, was sich wirklich lohnt.', tag:'Live-Analytics' },
  { n:'06', icon:'🧾', title:'Buchhaltung',       desc:'Jeder Verkauf sauber erfasst, CSV-Export für die Steuer mit einem Klick.', tag:'Steuer-ready' },
  { n:'07', icon:'💬', title:'Community',         desc:'Discord-Style Community mit Channels, Rängen, XP und Legit-Check unter Resellern.', tag:'XP & Ränge' },
  { n:'08', icon:'⚡', title:'Automatisierungen', desc:'Auto-Relist, Auto-Rabatt und Preisanpassung — dein Shop arbeitet, während du schläfst.', tag:'Läuft von allein' },
]

const AUDIENCE = [
  { tag:'Einsteiger',        icon:'🌱', desc:'Gerade gestartet? ListSync nimmt dir die Technik ab — du fotografierst, der Rest läuft.' },
  { tag:'Nebenberuflich',    icon:'⏱️', desc:'Verkaufen neben dem Job. In Minuten statt Stunden auf allen Plattformen gelistet.' },
  { tag:'Vollzeit-Reseller', icon:'🔥', desc:'Hunderte Artikel im Monat. Bulk-Crossposting, Auto-Relist und Lager fest im Griff.' },
  { tag:'Power-Seller',      icon:'👑', desc:'Skaliere ohne Team. Automatisierungen, Analytics und Score holen jeden Cent raus.' },
]

const LEVELS = [
  { num:'01', title:'Du startest als Neuling',  xp:'Stufe 1',   icon:'🔑', c:'#ef4444', perk:'Voller Community-Zugang und alle Basis-Tools — ab dem ersten Tag.' },
  { num:'02', title:'Werde zum Verkäufer',      xp:'500 XP',    icon:'🛡️', c:'#94a3b8', perk:'Eigenes Profil-Badge und Zugang zum exklusiven Verkauf-Channel.' },
  { num:'03', title:'Steig zum Profi auf',      xp:'2.000 XP',  icon:'⚔️', c:'#f59e0b', perk:'Legit-Check-Rechte und deutlich mehr Sichtbarkeit im Community-Feed.' },
  { num:'04', title:'Werde Top-Seller',         xp:'8.000 XP',  icon:'👑', c:'#a855f7', perk:'Exklusive Channels und früher Zugang zu neuen Features vor allen anderen.' },
  { num:'05', title:'Erreiche Legenden-Status', xp:'25.000 XP', icon:'💎', c:'#3b82f6', perk:'Hall of Fame, Sonder-Rolle und direkter Draht zum ListSync-Team.' },
]

const TESTIMONIALS = [
  { name:'Lena M.',  role:'Pro',        title:'In 2 Minuten gelistet',    t:'Ich liste jetzt in 2 Minuten, was vorher 20 gedauert hat. Der KI-Text ist oft besser als meiner.' },
  { name:'Marco R.', role:'Top-Seller', title:'Ein Klick, 3 Plattformen', t:'Endlich alles an einem Ort — Vinted, eBay und Kleinanzeigen mit einem Klick. Ein Gamechanger.' },
  { name:'Sina K.',  role:'Pro',        title:'Schluss mit Lager-Chaos',  t:'Das Lagersystem mit QR-Codes hat mein Chaos beendet. Ich finde jeden Artikel in Sekunden.' },
  { name:'Tobias W.',role:'Profi',      title:'Läuft im Hintergrund',     t:'Auto-Relist läuft im Hintergrund, während ich schlafe. Meine Reichweite ist spürbar gestiegen.' },
  { name:'Aylin D.', role:'Verkäufer',  title:'Score pusht Verkäufe',     t:'Der Listing-Score zeigt mir genau, was fehlt. Seitdem verkaufen sich meine Sachen schneller.' },
  { name:'Jonas P.', role:'Top-Seller', title:'Community = Gold wert',    t:'Die Community ist Gold wert. Schnelle Legit-Checks und ehrliche Preis-Tipps von echten Resellern.' },
]

const RESULTS = [
  { h:'Entdecke', t:'welche Artikel sich am besten verkaufen — datenbasiert statt Bauchgefühl.' },
  { h:'Erhalte',  t:'fertige KI-Texte, die mehr Käufer anziehen und schneller verkaufen.' },
  { h:'Greife',   t:'mit einem einzigen Klick auf alle drei Plattformen gleichzeitig zu.' },
  { h:'Behalte',  t:'Lager, Umsatz und Gewinn jederzeit in Echtzeit im Blick.' },
  { h:'Spare',    t:'jeden Tag Stunden durch Auto-Relist, Auto-Rabatt und Automatisierung.' },
  { h:'Lerne',    t:'von einer Community echter Reseller — mit Legit-Check und Preis-Tipps.' },
]

const FAQ = [
  { cat:'general', q:'Was ist ListSync?', a:'Ein Crosslisting-Tool für Reseller. Du legst einen Artikel einmal an und postest ihn automatisch auf Vinted, Kleinanzeigen und eBay — inklusive KI-Texten, Lager, Analytics und Community.' },
  { cat:'general', q:'Brauche ich technisches Wissen?', a:'Nein. Du fotografierst deinen Artikel, die KI schreibt den Rest und ein Klick verteilt alles. Kein Setup, keine Programmierung.' },
  { cat:'general', q:'Sind meine Daten sicher?', a:'Deine Listings und Verkaufsdaten liegen geschützt in deinem Account. Wir verkaufen keine Daten weiter.' },
  { cat:'pricing', q:'Was kostet ListSync?', a:'Du startest kostenlos (bis 5 Listings, 1 Plattform). Pro kostet 9,99€/Monat für alles unlimitiert, oder einmalig 79€ Lifetime — kein Abo.' },
  { cat:'pricing', q:'Kann ich jederzeit kündigen?', a:'Ja. Pro ist monatlich kündbar, ohne Mindestlaufzeit. Keine Kreditkarte nötig, um kostenlos zu starten.' },
  { cat:'program', q:'Auf welchen Plattformen kann ich posten?', a:'Aktuell Vinted, Kleinanzeigen und eBay — alle gleichzeitig mit einem Klick über die Chrome Extension.' },
  { cat:'program', q:'Wie funktioniert das Crossposting?', a:'Über die ListSync Chrome Extension. Du klickst „Crossposten", die Extension öffnet die Plattformen und füllt alle Formulare inklusive Bildern automatisch aus.' },
]
const FAQ_TABS = [['general','Allgemein'],['pricing','Preise'],['program','Programm']]

export default function LandingPage() {
  const router = useRouter()
  const go = () => router.push('/register')
  const [showSticky, setShowSticky] = useState(false)
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [faqCat, setFaqCat] = useState('general')

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 900)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const mockupTilt = useTilt(8)
  const [audRef, audVis] = useReveal()
  const [pathRef, pathVis] = useReveal()
  const [resRef, resVis] = useReveal()
  const [modRef, modVis] = useReveal()
  const [lvlRef, lvlVis] = useReveal()
  const [testRef, testVis] = useReveal()
  const [pricRef, pricVis] = useReveal()
  const [faqRef, faqVis] = useReveal()

  const cssVars = { '--a':ACC.a, '--aDeep':ACC.aDeep, '--aSoft':ACC.aSoft, '--a2':ACC.a2, '--glow':ACC.glow }
  const Eyebrow = ({ children }) => <span style={{ fontSize:12, fontWeight:800, color:'var(--a)', textTransform:'uppercase', letterSpacing:'.14em' }}>{children}</span>

  return (
    <div style={{ ...cssVars, background:'#060608', color:'#f1f5f9', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX:'hidden' }}>
      <style>{`
        @keyframes float8{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes float12{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}
        @keyframes spin-slow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pulse-glow{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes slide-up{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes gradient-x{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes grid-drift{from{background-position:0 0}to{background-position:40px 40px}}
        @keyframes sticky-in{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .btn-primary{background:linear-gradient(135deg,var(--a) 0%,var(--aDeep) 50%,var(--a) 100%);background-size:200% 200%;color:#fff;border:none;padding:15px 30px;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 0 30px rgba(var(--glow),.45),0 4px 15px rgba(var(--glow),.3);animation:gradient-x 4s ease infinite;text-transform:uppercase;letter-spacing:.02em}
        .btn-primary:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 12px 45px rgba(var(--glow),.7),0 0 80px rgba(var(--glow),.3)}
        .btn-primary:active{transform:scale(.96)}
        .btn-ghost{background:rgba(255,255,255,.06);color:#f1f5f9;border:1px solid rgba(255,255,255,.14);padding:14px 28px;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-ghost:hover{background:rgba(255,255,255,.12);transform:translateY(-2px)}
        .login-link{color:#94a3b8;text-decoration:none;font-size:14px;font-weight:700;transition:color .2s}
        .login-link:hover{color:#fff}
        .hero-grid-bg{position:absolute;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(var(--glow),.08) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--glow),.08) 1px,transparent 1px);background-size:54px 54px;animation:grid-drift 8s linear infinite;-webkit-mask-image:radial-gradient(ellipse 80% 75% at 50% 45%,#000 25%,transparent 100%);mask-image:radial-gradient(ellipse 80% 75% at 50% 45%,#000 25%,transparent 100%)}
        .grad-text{background:linear-gradient(135deg,var(--a),var(--aSoft) 45%,var(--a2) 80%,var(--a));background-size:200% 200%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gradient-x 5s ease infinite}
        .module-card:hover{transform:translateY(-6px)!important;box-shadow:0 24px 60px rgba(0,0,0,.6)!important;border-color:rgba(var(--glow),.3)!important}
        .pcard:hover{transform:translateY(-6px)!important}
        .faq-tab{padding:11px 26px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:#94a3b8}
        .faq-tab.active{background:linear-gradient(135deg,var(--a),var(--aDeep));border-color:transparent;color:#fff}
        .sticky-cta{display:flex;animation:sticky-in .4s cubic-bezier(.34,1.56,.64,1)}
        .h-cap{font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:1;color:#fff}
        .nav-links{display:flex}
        .hero-inner{display:grid;grid-template-columns:1.05fr 1fr}
        .audience-grid{display:grid;grid-template-columns:repeat(4,1fr)}
        .paths-grid{display:grid;grid-template-columns:1fr 1fr}
        .results-grid{display:grid;grid-template-columns:1fr auto 1fr}
        .modules-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
        .test-grid{display:grid;grid-template-columns:repeat(3,1fr)}
        .founder-grid{display:grid;grid-template-columns:280px 1fr}
        .mockup-wrap{display:grid;grid-template-columns:200px 1fr}
        .swipe-hint{display:none}
        @media(max-width:860px){
          .nav-links{display:none}
          .hero-section{padding:96px 20px 50px!important}
          .hero-inner{grid-template-columns:1fr!important;gap:36px!important}
          .hero-left{text-align:center!important}
          .hero-left .hero-btns{justify-content:center}
          .hero-stats{justify-content:center!important;gap:28px!important}
          .hero-btns button{width:100%!important}
          .mockup-side{display:none!important}
          .mockup-mtabs{display:flex!important}
          .mockup-wrap{grid-template-columns:1fr!important}
          .audience-grid{grid-template-columns:1fr 1fr!important;gap:12px!important}
          .paths-grid{grid-template-columns:1fr!important;gap:36px!important}
          .vs-badge{display:none!important}
          .results-grid{grid-template-columns:1fr!important;gap:14px!important}
          .results-col{text-align:center!important}
          .results-rocket{order:-1;margin:0 auto 10px!important}
          .results-item{text-align:center!important}
          .modules-section{padding:60px 0!important;max-width:100%!important}
          .modules-head{padding:0 20px!important}
          .modules-grid{display:flex!important;overflow-x:auto!important;scroll-snap-type:x mandatory!important;gap:14px!important;padding:8px 20px 20px!important;scrollbar-width:none}
          .modules-grid::-webkit-scrollbar{display:none}
          .modules-grid>*{flex-shrink:0!important;width:78vw!important;max-width:300px!important;scroll-snap-align:start}
          .bonus-row{grid-template-columns:auto 1fr!important}
          .bonus-badge{display:none!important}
          .bonus-num{font-size:54px!important}
          .test-grid{grid-template-columns:1fr!important}
          .founder-grid{grid-template-columns:1fr!important;gap:24px!important;text-align:center}
          .founder-av{margin:0 auto!important}
          .pcols{grid-template-columns:1fr!important}
          .section{padding:60px 20px!important}
          .swipe-hint{display:block}
          .sticky-txt{display:none!important}
        }
      `}</style>

      {/* ── Top: Logo + Login ── */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(to bottom,rgba(6,6,8,.9),transparent)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,var(--a),var(--a2))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:'#fff' }}>LS</div>
          <span style={{ fontWeight:900, fontSize:19, letterSpacing:'-0.03em', color:'#fff' }}>ListSync</span>
        </div>
        <a onClick={() => router.push('/login')} className="login-link" style={{ position:'absolute', right:28, cursor:'pointer' }}>Einloggen</a>
      </div>

      {/* ── Hero ── */}
      <section className="hero-section" style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'120px 40px 80px', position:'relative', overflow:'hidden' }}>
        <div className="hero-grid-bg"/>
        <div style={{ position:'absolute', top:'-12%', left:'8%', width:'min(1100px,92vw)', height:820, background:'radial-gradient(ellipse at center,rgba(var(--glow),.30),rgba(var(--glow),.06) 45%,transparent 66%)', filter:'blur(30px)', pointerEvents:'none', zIndex:0 }}/>
        <Orb size={420} x={2} y={4} color="rgba(var(--glow),.22)" dur={12} />

        <div className="hero-inner" style={{ position:'relative', zIndex:1, maxWidth:1260, margin:'0 auto', width:'100%', gap:56, alignItems:'center' }}>
          <div className="hero-left" style={{ textAlign:'left' }}>
            <p style={{ fontSize:13, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.18em', margin:'0 0 20px', animation:'slide-up .6s ease' }}>Vom Reseller zum Power-Seller</p>
            <h1 className="h-cap" style={{ fontSize:'clamp(40px,5.4vw,74px)', margin:'0 0 24px', lineHeight:.98, animation:'slide-up .7s ease .1s both' }}>
              Verkaufe mehr.<br/><span className="grad-text">Arbeite weniger.</span>
            </h1>
            <p style={{ fontSize:'clamp(15px,1.5vw,19px)', color:'#9aa4b2', maxWidth:480, lineHeight:1.6, margin:'0 0 32px', animation:'slide-up .7s ease .2s both' }}>
              Einmal anlegen — automatisch auf Vinted, Kleinanzeigen & eBay. KI schreibt deine Listings, das Lager organisiert sich selbst. Alles in einem Tool.
            </p>
            <div className="hero-btns" style={{ animation:'slide-up .7s ease .3s both' }}>
              <button onClick={go} className="btn-primary" style={{ fontSize:16, padding:'17px 44px' }}>Kostenlos starten →</button>
            </div>
            <p style={{ fontSize:13, color:'#64748b', margin:'14px 0 0', animation:'slide-up .7s ease .35s both' }}>Jederzeit kündbar · keine Kreditkarte nötig.</p>
            <div className="hero-stats" style={{ display:'flex', gap:48, marginTop:44, animation:'slide-up .7s ease .4s both' }}>
              {[['12.000+','Listings erstellt'],['3','Plattformen, 1 Klick'],['4.9★','Bewertung']].map(([v,l]) => (
                <div key={l}><p style={{ fontSize:'clamp(28px,3vw,40px)', fontWeight:900, color:'#e2e8f0', margin:0, letterSpacing:'-0.02em' }}>{v}</p><p style={{ fontSize:13, color:'#64748b', margin:'2px 0 0', fontWeight:600 }}>{l}</p></div>
              ))}
            </div>
          </div>

          {/* Mockup rechts */}
          <div ref={mockupTilt} className="hero-mockup" style={{ maxWidth:600, width:'100%', transition:'transform .15s ease', transformStyle:'preserve-3d', animation:'slide-up .8s ease .4s both', position:'relative', zIndex:1 }}>
            <div style={{ background:'#111827', border:'1px solid rgba(255,255,255,.12)', borderRadius:20, overflow:'hidden', boxShadow:'0 40px 120px rgba(0,0,0,.7),0 0 80px rgba(var(--glow),.12)' }}>
              <div style={{ background:'#0d1117', padding:'12px 18px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width:12, height:12, borderRadius:'50%', background:c }}/>)}
                <div style={{ flex:1, background:'rgba(255,255,255,.05)', borderRadius:6, height:22, marginLeft:8, display:'flex', alignItems:'center', paddingLeft:10 }}><span style={{ fontSize:11, color:'#4b5563' }}>listsync.app/{activeScreen}</span></div>
              </div>
              <div className="mockup-wrap" style={{ minHeight:360 }}>
                <div className="mockup-side" style={{ background:'#111827', borderRight:'1px solid rgba(255,255,255,.06)', padding:'14px 10px', display:'flex', flexDirection:'column', gap:2 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', marginBottom:10 }}>
                    <div style={{ width:26, height:26, borderRadius:8, background:'var(--a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff' }}>LS</div>
                    <span style={{ fontSize:13, fontWeight:800, color:'#f9fafb' }}>ListSync</span>
                  </div>
                  <div onClick={go} style={{ background:'var(--a)', borderRadius:9, padding:'8px 12px', display:'flex', alignItems:'center', gap:6, marginBottom:8, cursor:'pointer' }}>
                    <span style={{ fontSize:13, color:'#fff', fontWeight:700 }}>+ Neues Listing</span>
                  </div>
                  {[['dashboard','⊞','Dashboard'],['listings','≡','Listings'],['lager','▦','Lager'],['community','◉','Community']].map(([id,ic,lb]) => (
                    <div key={id} onClick={() => setActiveScreen(id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', background:activeScreen===id?'rgba(255,255,255,.07)':'transparent', color:activeScreen===id?'#f9fafb':'#6b7280', fontWeight:activeScreen===id?600:500, fontSize:13 }}>
                      <span style={{ fontSize:15 }}>{ic}</span>{lb}{activeScreen===id&&<span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'var(--a)' }}/>}
                    </div>
                  ))}
                </div>
                <div style={{ background:'#0d1117', padding:16 }}>
                  <div className="mockup-mtabs" style={{ display:'none', gap:6, marginBottom:12 }}>
                    {[['dashboard','Dashboard'],['listings','Listings'],['lager','Lager'],['community','Chat']].map(([id,lb]) => (
                      <button key={id} onClick={() => setActiveScreen(id)} style={{ flex:1, padding:'8px 4px', fontSize:11, fontWeight:700, borderRadius:8, cursor:'pointer', fontFamily:'inherit', border:'1px solid '+(activeScreen===id?'transparent':'rgba(255,255,255,.08)'), background:activeScreen===id?'var(--a)':'rgba(255,255,255,.04)', color:activeScreen===id?'#fff':'#94a3b8' }}>{lb}</button>
                    ))}
                  </div>
                  {activeScreen==='dashboard' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <p style={{ fontSize:16, fontWeight:800, color:'#f9fafb', margin:0 }}>Dashboard</p>
                        <span style={{ fontSize:10, color:'#64748b', fontWeight:600 }}>Juni 2025</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }}>
                        {[['💰','1.240 €','Einnahmen','▲ 8%'],['📈','340 €','Gewinn','▲ 12%'],['🎯','87%','Monatsziel','']].map(([ic,v,l,d]) => (
                          <div key={l} style={{ background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:13, padding:'12px 12px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><span style={{ fontSize:17 }}>{ic}</span>{d && <span style={{ fontSize:9, fontWeight:800, color:'#10b981' }}>{d}</span>}</div>
                            <p style={{ fontSize:18, fontWeight:800, color:'#f1f5f9', margin:'7px 0 1px', letterSpacing:'-0.02em' }}>{v}</p>
                            <p style={{ fontSize:10.5, color:'#6b7280', margin:0 }}>{l}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:13, padding:13 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}><p style={{ fontSize:10.5, color:'#6b7280', fontWeight:700, textTransform:'uppercase', margin:0, letterSpacing:'.05em' }}>Umsatz · 7 Tage</p><span style={{ fontSize:10.5, fontWeight:800, color:'#10b981' }}>▲ 12%</span></div>
                        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:46 }}>
                          {[42,64,50,78,58,90,72].map((h,i) => <div key={i} style={{ flex:1, height:h+'%', borderRadius:'4px 4px 0 0', background:i===5?'linear-gradient(180deg,var(--a),rgba(var(--glow),.3))':'rgba(var(--glow),.25)' }}/>)}
                        </div>
                      </div>
                      <div style={{ background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:13, padding:13 }}>
                        <p style={{ fontSize:10.5, color:'#6b7280', fontWeight:700, textTransform:'uppercase', margin:'0 0 6px', letterSpacing:'.05em' }}>Aktive Listings</p>
                        {[['Nike Air Max 90','89 €','Vinted','#0d9488','👟'],["Levi's 501",'45 €','Kleinanz.','#ea580c','👖'],['Adidas Hoodie','35 €','eBay','#ca8a04','🧥']].map(([t,p,pl,c,ic]) => (
                          <div key={t} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                            <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,rgba(var(--glow),.28),rgba(255,255,255,.05))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{ic}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:12, color:'#e8edf3', margin:0, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t}</p>
                              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}><span style={{ width:6, height:6, borderRadius:'50%', background:c }}/><span style={{ fontSize:10, color:'#9ca3af' }}>{pl}</span></div>
                            </div>
                            <span style={{ fontSize:9, fontWeight:800, color:'#10b981', background:'rgba(16,185,129,.12)', padding:'2px 6px', borderRadius:6 }}>Aktiv</span>
                            <span style={{ fontSize:12.5, fontWeight:800, color:'#f1f5f9' }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeScreen==='listings' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <p style={{ fontSize:16, fontWeight:800, color:'#f9fafb', margin:'0 0 4px' }}>Meine Listings</p>
                      {[['Nike Air Max 90','89 €',82],["Levi's 501 W32",'45 €',74],['Adidas Hoodie M','35 €',55],['Polo Shirt L','28 €',40]].map(([t,p,sc]) => (
                        <div key={t} style={{ display:'flex', alignItems:'center', gap:10, background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, padding:'9px 11px' }}><div style={{ width:34, height:34, borderRadius:9, background:'rgba(var(--glow),.18)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'var(--aSoft)' }}>{t[0]}</div><span style={{ fontSize:12.5, fontWeight:600, color:'#f1f5f9', flex:1 }}>{t}</span><span style={{ fontSize:11, fontWeight:800, color:sc>=70?'#10b981':sc>=50?'#f59e0b':'#ef4444', background:`${sc>=70?'#10b981':sc>=50?'#f59e0b':'#ef4444'}18`, padding:'2px 7px', borderRadius:8 }}>{sc}</span><span style={{ fontSize:13, fontWeight:800, color:'#f1f5f9' }}>{p}</span></div>
                      ))}
                    </div>
                  )}
                  {activeScreen==='lager' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <p style={{ fontSize:16, fontWeight:800, color:'#f9fafb', margin:0 }}>📦 Lager</p>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                        {[['Regal A','12 Artikel'],['Regal B','8 Artikel'],['Unsortiert','5 Artikel']].map(([n,a]) => (
                          <div key={n}><div style={{ height:8, background:'rgba(var(--glow),.4)', borderRadius:'6px 6px 0 0' }}/><div style={{ background:'rgba(var(--glow),.08)', border:'1px solid rgba(var(--glow),.22)', borderRadius:'0 0 12px 12px', padding:'10px 12px' }}><p style={{ fontSize:13, fontWeight:800, color:'#f1f5f9', margin:'0 0 2px' }}>{n}</p><p style={{ fontSize:11, color:'#6b7280', margin:0 }}>{a}</p></div></div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeScreen==='community' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <p style={{ fontSize:16, fontWeight:800, color:'#f9fafb', margin:'0 0 4px' }}>💬 Community</p>
                      {[['Denny','👑','Hat jemand Erfahrung mit Vinted-Preisen?'],['Max','🔥','@Denny unter 10€ verkauft schneller!'],['Sarah','⭐','Legit-Check bitte 👆 original?']].map(([u,r,t]) => (
                        <div key={u} style={{ display:'flex', gap:8 }}><div style={{ width:28, height:28, borderRadius:8, background:'rgba(var(--glow),.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'var(--aSoft)' }}>{u[0]}</div><div><div style={{ display:'flex', gap:6, alignItems:'center' }}><span style={{ fontSize:12, fontWeight:700, color:'#f1f5f9' }}>{u}</span><span style={{ fontSize:10 }}>{r}</span></div><p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0' }}>{t}</p></div></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section style={{ padding:'26px 24px', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <p style={{ textAlign:'center', fontSize:11, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'.16em', margin:'0 0 16px' }}>Funktioniert mit deinen Plattformen</p>
        <div style={{ display:'flex', gap:40, justifyContent:'center', flexWrap:'wrap' }}>
          {[['Vinted','#0d9488'],['Kleinanzeigen','#ea580c'],['eBay','#ca8a04']].map(([n,c]) => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:9, opacity:.85 }}><span style={{ width:11, height:11, borderRadius:'50%', background:c }}/><span style={{ fontSize:19, fontWeight:800, color:'#cbd5e1' }}>{n}</span></div>
          ))}
        </div>
      </section>

      {/* ── Für wen ── */}
      <section ref={audRef} className="section" style={{ padding:'90px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48, opacity:audVis?1:0, transform:audVis?'none':'translateY(30px)', transition:'all .6s ease' }}>
          <Eyebrow>Für wen</Eyebrow>
          <h2 className="h-cap" style={{ fontSize:'clamp(28px,5vw,52px)', margin:'12px 0 14px' }}>Für wen ist <span className="grad-text">ListSync</span>?</h2>
          <p style={{ fontSize:17, color:'#64748b', maxWidth:520, margin:'0 auto', lineHeight:1.6 }}>Egal ob erster Verkauf oder hundertster pro Woche — ListSync wächst mit dir.</p>
        </div>
        <div className="audience-grid" style={{ gap:18 }}>
          {AUDIENCE.map((a,i) => (
            <div key={a.tag} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:20, padding:'26px 22px', opacity:audVis?1:0, transform:audVis?'none':'translateY(30px)', transition:`all .6s ease ${i*0.08}s` }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'rgba(var(--glow),.12)', border:'1px solid rgba(var(--glow),.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16 }}>{a.icon}</div>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#fff', margin:'0 0 8px' }}>{a.tag}</h3>
              <p style={{ fontSize:13.5, color:'#94a3b8', margin:0, lineHeight:1.6 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Zwei Wege ── */}
      <section ref={pathRef} className="section" style={{ padding:'90px 24px', background:'rgba(255,255,255,.015)', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <h2 className="h-cap" style={{ fontSize:'clamp(28px,5vw,52px)', textAlign:'center', margin:'0 0 48px', opacity:pathVis?1:0, transition:'all .6s ease' }}>Zwei Wege, <span className="grad-text">eine Entscheidung</span></h2>
        <div style={{ maxWidth:980, margin:'0 auto', position:'relative' }}>
          <div className="paths-grid" style={{ gap:60, alignItems:'stretch', position:'relative' }}>
            <div className="vs-badge" style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:54, height:54, borderRadius:'50%', background:'#060608', border:'2px solid var(--a)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, color:'var(--a)', zIndex:2 }}>VS</div>
            <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.1)', borderRadius:24, padding:32, opacity:pathVis?1:0, transform:pathVis?'none':'translateY(30px)', transition:'all .6s ease' }}>
              <p style={{ fontSize:12, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'.1em', textAlign:'center', margin:'0 0 8px' }}>Der alte Weg</p>
              <p className="h-cap" style={{ fontSize:38, textAlign:'center', color:'#94a3b8', margin:'0 0 20px' }}>Stunden</p>
              {['Jeden Artikel 3× per Hand eintippen','Texte selbst schreiben','4–5 Apps gleichzeitig offen','Kein Überblick über Gewinn'].map(x => (
                <div key={x} style={{ display:'flex', gap:10, fontSize:14, color:'#94a3b8', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}><span style={{ color:'#ef4444' }}>✕</span>{x}</div>
              ))}
              <div style={{ marginTop:22, textAlign:'center', padding:'13px', borderRadius:12, border:'1px solid rgba(255,255,255,.1)', color:'#64748b', fontSize:13, fontWeight:700 }}>🚫 So weitermachen</div>
            </div>
            <div style={{ background:'linear-gradient(135deg,rgba(var(--glow),.16),rgba(var(--glow),.05))', border:'1px solid rgba(var(--glow),.4)', borderRadius:24, padding:32, boxShadow:'0 0 60px rgba(var(--glow),.2)', opacity:pathVis?1:0, transform:pathVis?'none':'translateY(30px)', transition:'all .6s ease .1s' }}>
              <p style={{ fontSize:12, fontWeight:800, color:'var(--aSoft)', textTransform:'uppercase', letterSpacing:'.1em', textAlign:'center', margin:'0 0 8px' }}>Mit ListSync</p>
              <p className="h-cap" style={{ fontSize:38, textAlign:'center', margin:'0 0 20px' }}>Ab 0€</p>
              {['1× anlegen → 1 Klick auf alle Plattformen','KI schreibt Titel, Text & Hashtags','Alles in einem Tool','Umsatz & Gewinn automatisch getrackt'].map(x => (
                <div key={x} style={{ display:'flex', gap:10, fontSize:14, color:'#e2e8f0', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.06)' }}><span style={{ color:'var(--a)' }}>✓</span>{x}</div>
              ))}
              <button onClick={go} className="btn-primary" style={{ width:'100%', marginTop:22 }}>Gib mir Zugang →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ergebnisse (Rakete) ── */}
      <section ref={resRef} className="section" style={{ padding:'90px 24px', overflow:'hidden' }}>
        <div style={{ textAlign:'center', marginBottom:40, opacity:resVis?1:0, transition:'all .6s ease' }}>
          <Eyebrow>Echte Ergebnisse</Eyebrow>
          <h2 className="h-cap" style={{ fontSize:'clamp(26px,4.6vw,50px)', margin:'12px 0 0' }}>Deine <span className="grad-text">Ergebnisse</span> mit ListSync</h2>
        </div>
        <div className="results-grid" style={{ maxWidth:1100, margin:'0 auto', gap:40, alignItems:'center' }}>
          <div className="results-col" style={{ display:'flex', flexDirection:'column', gap:36, textAlign:'right' }}>
            {RESULTS.slice(0,3).map(r => (
              <p key={r.h} className="results-item" style={{ fontSize:15, color:'#cbd5e1', lineHeight:1.55, margin:0 }}><span style={{ color:'var(--a)', fontWeight:800 }}>{r.h}</span> {r.t}</p>
            ))}
          </div>
          <div className="results-rocket" style={{ width:'min(320px,70vw)', height:'min(320px,70vw)', borderRadius:'50%', background:'radial-gradient(circle at 35% 30%,rgba(var(--glow),.55),rgba(var(--glow),.12) 55%,transparent 72%)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(var(--glow),.25)', animation:'spin-slow 24s linear infinite' }}/>
            <span style={{ fontSize:130, filter:'drop-shadow(0 10px 30px rgba(var(--glow),.5))' }}>🚀</span>
          </div>
          <div className="results-col" style={{ display:'flex', flexDirection:'column', gap:36, textAlign:'left' }}>
            {RESULTS.slice(3).map(r => (
              <p key={r.h} className="results-item" style={{ fontSize:15, color:'#cbd5e1', lineHeight:1.55, margin:0 }}><span style={{ color:'var(--a)', fontWeight:800 }}>{r.h}</span> {r.t}</p>
            ))}
          </div>
        </div>
        <div style={{ textAlign:'center', marginTop:48 }}>
          <button onClick={go} className="btn-primary" style={{ fontSize:17, padding:'18px 46px' }}>Ja, ich will Zugang →</button>
          <p style={{ fontSize:13, color:'#64748b', margin:'14px 0 0' }}>Kostenlos starten · keine Kreditkarte nötig.</p>
        </div>
      </section>

      {/* ── Module ── */}
      <section ref={modRef} className="section modules-section" style={{ padding:'90px 24px', background:'rgba(255,255,255,.015)', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)', maxWidth:1180, margin:'0 auto' }}>
        <div className="modules-head" style={{ textAlign:'center', marginBottom:48, opacity:modVis?1:0, transition:'all .6s ease' }}>
          <Eyebrow>Alles drin</Eyebrow>
          <h2 className="h-cap" style={{ fontSize:'clamp(28px,5vw,52px)', margin:'12px 0 14px' }}>8 Module. <span className="grad-text">Ein Tool.</span></h2>
          <p style={{ fontSize:17, color:'#64748b', maxWidth:520, margin:'0 auto', lineHeight:1.6 }}>ListSync ersetzt deinen kompletten Tool-Stack — vom Texten bis zur Steuer.</p>
          <p className="swipe-hint" style={{ fontSize:11, color:'rgba(var(--glow),.7)', marginTop:14, fontWeight:700, letterSpacing:'.06em' }}>← SWIPE →</p>
        </div>
        <div className="modules-grid" style={{ gap:20 }}>{MODULES.map((m,i) => <ModuleCard key={m.title} {...m} delay={(i%4)*0.08}/>)}</div>
      </section>

      {/* ── Chrome Extension ── */}
      <section className="section" style={{ padding:'70px 24px' }}>
        <div className="ext-card" style={{ maxWidth:920, margin:'0 auto', background:'linear-gradient(135deg,rgba(var(--glow),.12),rgba(255,255,255,.02))', border:'1px solid rgba(var(--glow),.3)', borderRadius:24, padding:'36px 40px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
          <div style={{ width:88, height:88, borderRadius:22, background:'linear-gradient(135deg,var(--a),var(--aDeep))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:46, boxShadow:'0 0 40px rgba(var(--glow),.35)', flexShrink:0 }}>🧩</div>
          <div style={{ flex:1, minWidth:260 }}>
            <Eyebrow>Chrome Extension</Eyebrow>
            <h2 className="h-cap" style={{ fontSize:'clamp(23px,3.4vw,36px)', margin:'12px 0 12px' }}>Crossposten mit <span className="grad-text">einem Klick</span></h2>
            <p style={{ fontSize:15, color:'#94a3b8', margin:'0 0 20px', lineHeight:1.6, maxWidth:520 }}>Die ListSync-Extension füllt Vinted, Kleinanzeigen & eBay automatisch aus — Bilder inklusive. Du klickst nur noch „Crossposten". Kostenlos im Chrome Web Store.</p>
            <a href="https://chromewebstore.google.com/detail/listsync/nphcgkjlogciccdjkjiocciooknjfhho" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display:'inline-block', textDecoration:'none' }}>Zur Chrome Extension →</a>
          </div>
        </div>
      </section>

      {/* ── Level / Bonuses ── */}
      <section ref={lvlRef} className="section" style={{ padding:'90px 24px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48, opacity:lvlVis?1:0, transition:'all .6s ease' }}>
            <Eyebrow>Dein Aufstieg</Eyebrow>
            <h2 className="h-cap" style={{ fontSize:'clamp(26px,4.6vw,50px)', margin:'12px 0 12px' }}>Schalte exklusive <span className="grad-text">Perks frei</span></h2>
            <p style={{ fontSize:16, color:'#64748b', maxWidth:540, margin:'0 auto', lineHeight:1.6 }}>Sammle XP durch Verkäufe und Community — und klettere durch die Ränge.</p>
          </div>
          {LEVELS.map((l,i) => (
            <div key={l.num} className="bonus-row" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:24, alignItems:'center', padding:'24px 0', borderTop:i===0?'1px solid rgba(255,255,255,.07)':'none', borderBottom:'1px solid rgba(255,255,255,.07)', opacity:lvlVis?1:0, transform:lvlVis?'none':'translateY(20px)', transition:`all .5s ease ${i*0.07}s` }}>
              <span className="bonus-num" style={{ fontSize:74, fontWeight:900, lineHeight:.8, background:'linear-gradient(180deg,var(--a),rgba(200,30,30,.25))', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent' }}>{l.num}</span>
              <div><h3 className="h-cap" style={{ fontSize:20, margin:'0 0 6px' }}>{l.title}</h3><p style={{ fontSize:14, color:'#94a3b8', margin:0, lineHeight:1.6 }}>{l.perk}</p></div>
              <div className="bonus-badge" style={{ textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:16, background:`linear-gradient(135deg,${l.c},rgba(0,0,0,.4))`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, boxShadow:`0 0 26px ${l.c}55`, border:`1px solid ${l.c}66` }}>{l.icon}</div>
                <p style={{ fontSize:11, fontWeight:800, color:l.c, margin:'8px 0 0', letterSpacing:'.06em' }}>{l.xp}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section ref={testRef} className="section" style={{ padding:'90px 24px', maxWidth:1180, margin:'0 auto' }}>
        <h2 className="h-cap" style={{ fontSize:'clamp(26px,4.6vw,50px)', textAlign:'center', margin:'0 0 48px', opacity:testVis?1:0, transition:'all .6s ease' }}>Das sagen <span className="grad-text">unsere Reseller</span></h2>
        <div className="test-grid" style={{ gap:18 }}>
          {TESTIMONIALS.map((m,i) => (
            <div key={m.name} style={{ background:'#0c0c11', border:'1px solid rgba(255,255,255,.08)', borderRadius:18, padding:'22px 22px', opacity:testVis?1:0, transform:testVis?'none':'translateY(30px)', transition:`all .6s ease ${(i%3)*0.07}s` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#f8fafc', margin:0 }}>{m.title}</h3>
                <span style={{ fontSize:10, fontWeight:800, color:'var(--aSoft)', background:'rgba(var(--glow),.14)', padding:'3px 8px', borderRadius:6, letterSpacing:'.04em' }}>VERKAUF</span>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(var(--glow),.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'var(--aSoft)' }}>{m.name[0]}</div>
                <div><span style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>{m.name}</span> <span style={{ fontSize:11, color:'var(--aSoft)', fontWeight:700 }}>· {m.role}</span></div>
              </div>
              <p style={{ fontSize:13.5, color:'#94a3b8', margin:0, lineHeight:1.6 }}>{m.t}</p>
            </div>
          ))}
        </div>
        <p style={{ textAlign:'center', fontSize:18, fontWeight:800, color:'#e2e8f0', margin:'40px 0 6px' }}>Du könntest der Nächste sein.</p>
        <p style={{ textAlign:'center', fontSize:11.5, color:'#475569', margin:'0 auto', maxWidth:600 }}>Beispiel-Stimmen zur Veranschaulichung. Ergebnisse sind individuell und nicht garantiert.</p>
        <div style={{ textAlign:'center', marginTop:24 }}><button onClick={go} className="btn-primary" style={{ fontSize:16, padding:'16px 40px' }}>Jetzt kostenlos starten →</button></div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" ref={pricRef} className="section" style={{ padding:'90px 24px', background:'rgba(255,255,255,.015)', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <h2 className="h-cap" style={{ fontSize:'clamp(26px,4.6vw,50px)', textAlign:'center', margin:'0 0 40px', opacity:pricVis?1:0, transition:'all .6s ease' }}>Deine <span className="grad-text">Mitgliedschaft</span></h2>
        <div className="pcard" style={{ maxWidth:680, margin:'0 auto', background:'linear-gradient(135deg,rgba(var(--glow),.12),rgba(var(--glow),.03))', border:'1px solid rgba(var(--glow),.4)', borderRadius:28, padding:'40px 40px 36px', boxShadow:'0 0 70px rgba(var(--glow),.18)', transition:'transform .2s', opacity:pricVis?1:0, transform:pricVis?'none':'translateY(30px)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}><div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,var(--a),var(--a2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff' }}>LS</div><span style={{ fontSize:17, fontWeight:900, color:'#fff' }}>ListSync Pro</span></div>
            <span style={{ fontSize:12, fontWeight:800, color:'var(--aSoft)', background:'rgba(var(--glow),.14)', border:'1px solid rgba(var(--glow),.3)', padding:'5px 12px', borderRadius:99 }}>Beta-Preis</span>
          </div>
          <p className="h-cap" style={{ fontSize:'clamp(38px,6vw,58px)', textAlign:'center', margin:'0 0 4px' }}>Nur 9,99€<span style={{ fontSize:20, color:'#64748b' }}>/Monat</span></p>
          <p style={{ textAlign:'center', fontSize:13, color:'#64748b', margin:'0 0 28px' }}>Monatlich abgerechnet · jederzeit kündbar</p>
          <div className="pcols" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 24px', marginBottom:30 }}>
            {['Unlimitierte Listings','Alle 3 Plattformen','Bulk-Crossposten','KI-Assistent','Vollständige Analytics','Lager & QR-Codes','Community & Ränge','Priority Support'].map(f => (
              <div key={f} style={{ display:'flex', gap:8, alignItems:'center', fontSize:14, color:'#e2e8f0' }}><span style={{ color:'var(--a)', fontSize:16 }}>✓</span>{f}</div>
            ))}
          </div>
          <button onClick={go} className="btn-primary" style={{ width:'100%', fontSize:16, padding:'17px' }}>Jetzt Zugang sichern →</button>
          <p style={{ textAlign:'center', fontSize:12.5, color:'#64748b', margin:'14px 0 22px' }}>Sichere Bezahlung · du wirst zur Kasse weitergeleitet.</p>
          <div style={{ display:'flex', gap:22, justifyContent:'center', flexWrap:'wrap', opacity:.55 }}>
            {['Klarna','PayPal','Stripe','Apple Pay'].map(p => <span key={p} style={{ fontSize:13, fontWeight:800, color:'#94a3b8' }}>{p}</span>)}
          </div>
        </div>
        <p style={{ textAlign:'center', fontSize:14, color:'#64748b', margin:'28px 0 0' }}>
          Lieber erst testen? <span onClick={go} style={{ color:'var(--aSoft)', fontWeight:700, cursor:'pointer' }}>Kostenlos starten</span> · oder <span onClick={go} style={{ color:'var(--aSoft)', fontWeight:700, cursor:'pointer' }}>Lifetime für 79€ einmalig</span>
        </p>
      </section>

      {/* ── FAQ ── */}
      <section ref={faqRef} className="section" style={{ padding:'90px 24px' }}>
        <div style={{ maxWidth:780, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:32, opacity:faqVis?1:0, transition:'all .6s ease' }}>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="h-cap" style={{ fontSize:'clamp(26px,4.6vw,50px)', margin:'12px 0 0' }}>Alle Fragen <span className="grad-text">beantwortet</span></h2>
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:28, flexWrap:'wrap' }}>
            {FAQ_TABS.map(([id,lb]) => (
              <button key={id} onClick={() => setFaqCat(id)} className={`faq-tab${faqCat===id?' active':''}`}>{lb}</button>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {FAQ.filter(f => f.cat===faqCat).map(f => <FaqItem key={f.q} {...f}/>)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding:'100px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <Orb size={600} x={50} y={50} color="rgba(var(--glow),.25)" dur={12}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <h2 className="h-cap" style={{ fontSize:'clamp(32px,6vw,68px)', margin:'0 0 20px', textShadow:'0 0 60px rgba(var(--glow),.35)' }}>Bereit, mehr zu <span className="grad-text">verkaufen?</span></h2>
          <p style={{ fontSize:18, color:'#64748b', margin:'0 0 36px' }}>Kostenlos starten. Keine Kreditkarte nötig.</p>
          <button onClick={go} className="btn-primary" style={{ fontSize:18, padding:'18px 48px' }}>Jetzt kostenlos starten →</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding:'32px 20px 90px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:24, height:24, borderRadius:7, background:'linear-gradient(135deg,var(--a),var(--a2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff' }}>LS</div><span style={{ fontSize:13, fontWeight:700, color:'#64748b' }}>ListSync © 2025</span></div>
          <div style={{ display:'flex', gap:24 }}>{['Impressum','Datenschutz','AGB'].map(l => <a key={l} href="#" className="login-link" style={{ fontSize:12 }}>{l}</a>)}</div>
        </div>
      </footer>

      {/* ── Sticky CTA ── */}
      {showSticky && (
        <div className="sticky-cta" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:90, background:'rgba(10,10,14,.92)', backdropFilter:'blur(16px)', borderTop:'1px solid rgba(var(--glow),.3)', padding:'12px 24px', alignItems:'center', justifyContent:'center', gap:20, boxShadow:'0 -10px 40px rgba(0,0,0,.5)' }}>
          <span className="sticky-txt" style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>Bereit loszulegen? <span style={{ color:'#64748b', fontWeight:500 }}>Kostenlos, keine Kreditkarte.</span></span>
          <button onClick={go} className="btn-primary" style={{ padding:'12px 28px', fontSize:15 }}>Jetzt starten →</button>
        </div>
      )}
    </div>
  )
}
