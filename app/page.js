'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Mouse 3D tilt hook ────────────────────────────────────────────────
function useTilt(strength = 15) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width  - 0.5
      const y = (e.clientY - r.top)  / r.height - 0.5
      el.style.transform = `perspective(800px) rotateY(${x*strength}deg) rotateX(${-y*strength}deg) scale(1.04)`
    }
    const leave = () => { el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)' }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [strength])
  return ref
}

// ── Scroll reveal hook ────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

// ── Animated counter ─────────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0)
  const [ref, vis] = useReveal()
  useEffect(() => {
    if (!vis) return
    let start = 0; const step = to / 60
    const id = setInterval(() => { start = Math.min(start + step, to); setVal(Math.floor(start)); if (start >= to) clearInterval(id) }, 16)
    return () => clearInterval(id)
  }, [vis, to])
  return <span ref={ref}>{val.toLocaleString('de')}{suffix}</span>
}

// ── Feature Card with 3D tilt ─────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay = 0 }) {
  const tilt = useTilt(12)
  const [ref, vis] = useReveal()
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(40px)', transition: `all .6s ease ${delay}s` }}>
      <div ref={tilt} className="feature-card-inner" style={{ background:'linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02))', border:'1px solid rgba(255,255,255,.10)', borderRadius:24, padding:'28px 24px', cursor:'default', transition:'transform .15s ease, box-shadow .2s', transformStyle:'preserve-3d', boxShadow:'0 4px 20px rgba(0,0,0,.3)' }}>
        <div style={{ width:52,height:52,borderRadius:16,background:`linear-gradient(135deg,${color}33,${color}11)`,border:`1px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:18 }}>
          {icon}
        </div>
        <h3 style={{ fontSize:17,fontWeight:800,color:'#f1f5f9',margin:'0 0 8px',letterSpacing:'-0.02em' }}>{title}</h3>
        <p style={{ fontSize:13.5,color:'#94a3b8',margin:0,lineHeight:1.6 }}>{desc}</p>
        <div style={{ position:'absolute',inset:0,borderRadius:24,background:`radial-gradient(circle at 50% 0%,${color}08,transparent 70%)`,pointerEvents:'none' }}/>
      </div>
    </div>
  )
}

// ── Floating orb ─────────────────────────────────────────────────────
function Orb({ size, x, y, color, dur }) {
  return (
    <div style={{
      position:'absolute', left:`${x}%`, top:`${y}%`,
      width:size, height:size, borderRadius:'50%',
      background:`radial-gradient(circle,${color}40,transparent 70%)`,
      filter:'blur(60px)', pointerEvents:'none',
      animation:`float${dur} ${dur}s ease-in-out infinite`,
    }}/>
  )
}

// ── Pricing Card ─────────────────────────────────────────────────────
function PricingCard({ vis, delay, router, label, price, sub, included, excluded, cta, ctaStyle, ctaHref, highlight }) {
  const tilt = useTilt(6)
  return (
    <div ref={tilt}
      className={`pricing-card${highlight ? ' pricing-pro pricing-pro-card' : ''}`}
      style={{
        background: highlight ? 'linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1))' : 'rgba(255,255,255,.03)',
        border: highlight ? '1px solid rgba(99,102,241,.4)' : '1px solid rgba(255,255,255,.08)',
        borderRadius:24, padding:32, position:'relative',
        opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(40px)',
        transition:`all .6s ease ${delay}s, transform .2s cubic-bezier(0.34,1.56,0.64,1)`,
        boxShadow: highlight ? '0 0 60px rgba(99,102,241,.2), 0 0 120px rgba(99,102,241,.08)' : 'none',
      }}>
      {highlight && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:99, padding:'4px 14px', fontSize:11, fontWeight:800, color:'white', whiteSpace:'nowrap' }}>BELIEBTESTE WAHL</div>}
      {ctaStyle === 'gold' && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#d97706,#f59e0b)', borderRadius:99, padding:'4px 14px', fontSize:11, fontWeight:800, color:'white', whiteSpace:'nowrap' }}>BESTES ANGEBOT</div>}
      <p style={{ fontSize:12, fontWeight:700, color:highlight?'#818cf8':'#64748b', textTransform:'uppercase', letterSpacing:'.1em', margin:'0 0 12px' }}>{label}</p>
      <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4 }}>
        <p style={{ fontSize:42, fontWeight:900, color:'white', margin:0, letterSpacing:'-0.03em' }}>{price}</p>
        {highlight && <span style={{ fontSize:14, color:'#64748b' }}>/Mo</span>}
      </div>
      <p style={{ fontSize:13, color:'#64748b', margin:'0 0 28px' }}>{sub}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
        {included.map(f => (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:highlight?'#e2e8f0':'#94a3b8' }}>
            <span style={{ color:'#22c55e', fontSize:16 }}>✓</span>{f}
          </div>
        ))}
        {excluded.map(f => (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:'#374151' }}>
            <span style={{ fontSize:16 }}>✕</span>{f}
          </div>
        ))}
      </div>
      <button onClick={() => router.push(ctaHref || '/register')}
        className={ctaStyle === 'primary' ? 'btn-primary' : ctaStyle === 'gold' ? 'btn-gold' : 'btn-ghost'}
        style={{ width:'100%', textAlign:'center' }}>{cta}</button>
    </div>
  )
}

const FEATURES = [
  { icon:'✨', title:'KI-Assistent',      color:'#818cf8', desc:'Stichpunkte eingeben — KI schreibt den perfekten Titel, SEO-Beschreibung und Hashtags automatisch.', delay:0 },
  { icon:'🚀', title:'Bulk Crossposten',  color:'#22c55e', desc:'Ein Artikel, alle Plattformen. Vinted, Kleinanzeigen und eBay gleichzeitig mit einem Klick bespielen.', delay:.1 },
  { icon:'📦', title:'3D Lagersystem',    color:'#f59e0b', desc:'Regal, Box, Fach — behalte den Überblick über dein komplettes Lager mit QR-Codes für jeden Platz.', delay:.2 },
  { icon:'📊', title:'Score & Insights',  color:'#ec4899', desc:'AI Listing Score 0-100 zeigt dir genau was du verbessern musst. Dashboard zeigt was sich wann am besten verkauft.', delay:.3 },
  { icon:'💬', title:'Community',         color:'#14b8a6', desc:'Discord-ähnliche Community mit Channels, Rollen, XP-Ranking, @mentions und Legit-Check.', delay:.4 },
  { icon:'⚡', title:'Automatisierungen', color:'#f97316', desc:'Auto-Relist, Auto-Rabatt, automatische Preisanpassung — dein Reselling läuft auch wenn du schläfst.', delay:.5 },
]

export default function LandingPage() {
  const router = useRouter()
  const heroRef = useRef(null)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX / window.innerWidth - 0.5); setMouseY(e.clientY / window.innerHeight - 0.5) }
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('scroll', onScroll) }
  }, [])

  const mockupTilt = useTilt(8)
  const [statsRef, statsVis] = useReveal()
  const [featRef, featVis] = useReveal()
  const [pricRef, pricVis] = useReveal()
  const [activeScreen, setActiveScreen] = useState('dashboard')

  return (
    <div style={{ background:'#060610', color:'#f1f5f9', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX:'hidden' }}>

      <style>{`
        @keyframes float8  { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-20px)} }
        @keyframes float12 { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-30px)} }
        @keyframes float6  { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-14px)} }
        @keyframes spin-slow    { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
        @keyframes pulse-glow   { 0%,100%{opacity:.4}            50%{opacity:.9} }
        @keyframes slide-up     { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gradient-x   { 0%,100%{background-position:0% 50%}  50%{background-position:100% 50%} }
        @keyframes neon-flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.85} 94%{opacity:1} 97%{opacity:.9} 98%{opacity:1} }
        @keyframes scan-line    { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
        @keyframes grid-drift   { from{background-position:0 0} to{background-position:40px 40px} }
        @keyframes glow-orb     { 0%,100%{transform:scale(1) translate(0,0)} 33%{transform:scale(1.1) translate(20px,-20px)} 66%{transform:scale(.9) translate(-15px,15px)} }

        /* ── Buttons ── */
        .nav-link { color:#94a3b8; text-decoration:none; font-size:14px; font-weight:600; transition:color .2s }
        .nav-link:hover { color:#f1f5f9 }
        .btn-primary {
          background: linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#6366f1 100%);
          background-size: 200% 200%;
          color: white; border: none; padding: 14px 28px; border-radius: 14px;
          font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: all .25s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 0 30px rgba(99,102,241,.4), 0 4px 15px rgba(99,102,241,.3);
          animation: gradient-x 4s ease infinite;
          position: relative; overflow: hidden;
        }
        .btn-primary::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.18), transparent);
          opacity: 0; transition: opacity .2s;
        }
        .btn-primary:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 12px 45px rgba(99,102,241,.65), 0 0 80px rgba(99,102,241,.25) }
        .btn-primary:hover::after { opacity: 1 }
        .btn-primary:active { transform: scale(0.96); }
        .btn-ghost {
          background: rgba(255,255,255,.06); color:#f1f5f9;
          border: 1px solid rgba(255,255,255,.14); padding:14px 28px; border-radius:14px;
          font-size:15px; font-weight:600; cursor:pointer; font-family:inherit;
          transition: all .2s cubic-bezier(0.4,0,0.2,1);
          backdrop-filter: blur(10px);
        }
        .btn-ghost:hover { background:rgba(255,255,255,.12); transform:translateY(-2px); border-color:rgba(255,255,255,.25); box-shadow: 0 8px 30px rgba(0,0,0,.3) }
        .btn-ghost:active { transform: scale(0.96); }
        .btn-gold {
          background: linear-gradient(135deg,#d97706 0%,#f59e0b 50%,#d97706 100%);
          background-size: 200% 200%;
          color:white; border:none; padding:14px 28px; border-radius:14px;
          font-size:15px; font-weight:700; cursor:pointer; font-family:inherit;
          transition: all .25s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow:0 0 30px rgba(245,158,11,.35);
          animation: gradient-x 4s ease infinite;
        }
        .btn-gold:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 12px 40px rgba(245,158,11,.6) }
        .btn-gold:active { transform: scale(0.96); }

        /* ── Desktop defaults ── */
        .nav-links-desktop { display:flex }
        .nav-btns-desktop  { display:flex }
        .stats-grid        { display:grid; grid-template-columns:repeat(4,1fr) }
        .mockup-wrap       { display:block }
        .mockup-sidebar    { display:flex }
        .features-grid     { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)) }
        .steps-grid        { display:grid; grid-template-columns:repeat(3,1fr) }
        .pricing-grid      { display:grid; grid-template-columns:1fr 1fr 1fr }
        .footer-inner      { display:flex }
        .pricing-pro       { order: 0 }

        /* ── Feature card hover glow ── */
        .feature-card-inner {
          transition: transform .18s ease, box-shadow .18s ease !important;
        }
        .feature-card-inner:hover {
          transform: translateY(-6px) scale(1.02) !important;
          box-shadow: 0 20px 50px rgba(0,0,0,.5) !important;
        }

        /* ── Stat number glow ── */
        .stat-number { text-shadow: 0 0 30px rgba(99,102,241,.4); }

        /* ── Pricing card glow on hover ── */
        .pricing-card { transition: transform .2s cubic-bezier(0.34,1.56,0.64,1), box-shadow .2s !important; }
        .pricing-card:hover { transform: translateY(-8px) scale(1.02) !important; }

        /* ══════════════════════════════════
           ── MOBILE OVERHAUL ──
        ══════════════════════════════════ */
        @media (max-width: 768px) {
          /* Nav */
          .nav-links-desktop { display:none !important }
          .nav-btns-desktop { gap:6px !important }
          .nav-btns-desktop .btn-ghost { display:none }
          .nav-btns-desktop .btn-primary { padding:10px 18px !important; font-size:13px !important; border-radius:12px !important }
          nav { padding:12px 16px !important }

          /* Hero */
          .hero-section { padding:90px 20px 50px !important }
          .hero-btns { flex-direction:column; align-items:stretch !important; gap:12px !important }
          .hero-btns button { width:100% !important; padding:18px 24px !important; font-size:16px !important; border-radius:16px !important }
          .hero-pill { font-size:12px !important }
          .hero-mockup { margin-top:40px !important; border-radius:16px !important }

          /* Stats */
          .stats-grid { grid-template-columns:repeat(2,1fr) !important; gap:16px !important }
          .stat-number { font-size:36px !important }

          /* App mockup */
          .mockup-sidebar { display:none !important }
          .mockup-wrap { grid-template-columns:1fr !important }

          /* ── Features: horizontal scroll carousel ── */
          .features-section-pad {
            padding: 60px 0 !important;
            max-width: 100% !important;
          }
          .features-header { padding: 0 20px !important; margin-bottom: 28px !important }
          .features-grid {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            gap: 14px !important;
            padding: 8px 20px 20px !important;
            margin: 0 !important;
            scrollbar-width: none !important;
            align-items: stretch !important;
          }
          .features-grid::-webkit-scrollbar { display: none !important }
          .features-grid > * {
            flex-shrink: 0 !important;
            width: 78vw !important;
            max-width: 290px !important;
            scroll-snap-align: start !important;
          }

          /* ── Steps ── */
          .steps-grid { grid-template-columns:1fr !important; gap:0 !important }
          .step-item { position:relative !important }
          .step-item:not(:last-child)::after {
            content:'↓';
            display:block;
            text-align:center;
            font-size:24px;
            color:rgba(99,102,241,.5);
            padding:8px 0;
          }
          .section-pad { padding:60px 20px !important }

          /* ── Pricing: Pro on top, full width ── */
          .pricing-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .pricing-pro { order: -1 !important }

          /* Footer */
          .footer-inner { flex-direction:column; align-items:center; gap:12px !important }

          /* Button active states */
          .btn-primary:active, .btn-ghost:active, .btn-gold:active {
            transform: scale(0.94) !important;
          }

          /* Feature card tap */
          .feature-card-inner:active {
            transform: scale(0.97) !important;
          }
        }

        /* ── Pricing card mobile highlight ring ── */
        @media (max-width: 768px) {
          .pricing-pro-card {
            box-shadow: 0 0 0 2px rgba(99,102,241,.6), 0 0 60px rgba(99,102,241,.2) !important;
          }
        }

        /* ── Swipe hint: only on mobile ── */
        .mobile-swipe-hint { display: none }
        @media (max-width: 768px) { .mobile-swipe-hint { display: block } }

        /* ── Animated grid background ── */
        .hero-grid-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(99,102,241,.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,.07) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-drift 8s linear infinite;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        /* ── Stat number glow ── */
        .stat-number { text-shadow: 0 0 40px rgba(99,102,241,.5), 0 0 80px rgba(99,102,241,.2); }

        /* ── Hero headline animated gradient ── */
        .hero-gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #22c55e 60%, #6366f1 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-x 5s ease infinite;
        }

        /* ── CTA section neon glow ── */
        .cta-headline {
          text-shadow: 0 0 60px rgba(99,102,241,.3), 0 0 120px rgba(99,102,241,.15);
          animation: neon-flicker 8s ease infinite;
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'16px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(6,6,16,.8)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#6366f1,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13, color:'white' }}>LS</div>
          <span style={{ fontWeight:800, fontSize:17, letterSpacing:'-0.03em', color:'white' }}>ListSync</span>
          <span style={{ fontSize:10, fontWeight:700, color:'#22c55e', background:'rgba(34,197,94,.15)', padding:'2px 7px', borderRadius:20, border:'1px solid rgba(34,197,94,.3)' }}>BETA</span>
        </div>
        <div className="nav-links-desktop" style={{ alignItems:'center', gap:32 }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Preise</a>
          <a href="#community" className="nav-link">Community</a>
        </div>
        <div className="nav-btns-desktop" style={{ gap:10 }}>
          <button onClick={() => router.push('/login')} className="btn-ghost" style={{ padding:'10px 20px', fontSize:14 }}>Einloggen</button>
          <button onClick={() => router.push('/register')} className="btn-primary" style={{ padding:'10px 20px', fontSize:14 }}>Kostenlos starten →</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="hero-section" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'120px 24px 80px', position:'relative', overflow:'hidden' }}>

        {/* Animated grid background */}
        <div className="hero-grid-bg"/>

        {/* Background orbs */}
        <Orb size={600} x={10}  y={10}  color="#6366f1" dur={12} />
        <Orb size={400} x={75}  y={20}  color="#8b5cf6" dur={8}  />
        <Orb size={500} x={50}  y={60}  color="#22c55e" dur={12} />
        <Orb size={300} x={85}  y={70}  color="#ec4899" dur={6}  />

        {/* Rotating ring */}
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', border:'1px solid rgba(99,102,241,.12)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', animation:'spin-slow 20s linear infinite', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', border:'1px solid rgba(139,92,246,.08)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', animation:'spin-slow 15s linear infinite reverse', pointerEvents:'none' }}/>

        {/* Pill badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.25)', borderRadius:99, padding:'8px 16px', marginBottom:32, animation:'slide-up .6s ease forwards' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#6366f1', animation:'pulse-glow 2s ease-in-out infinite' }}/>
          <span style={{ fontSize:13, fontWeight:700, color:'#818cf8' }}>Das KI-Tool für Reseller</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize:'clamp(40px,7vw,90px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.05, margin:'0 0 24px', maxWidth:900, animation:'slide-up .7s ease .1s both' }}>
          <span style={{ color:'white' }}>Verkaufe mehr.</span>
          <br/>
          <span className="hero-gradient-text">Arbeite weniger.</span>
        </h1>

        <p style={{ fontSize:'clamp(16px,2.5vw,20px)', color:'#94a3b8', maxWidth:600, lineHeight:1.6, margin:'0 0 48px', animation:'slide-up .7s ease .2s both' }}>
          KI schreibt deine Listings. Einmal anlegen, automatisch auf Vinted, Kleinanzeigen und eBay posten. Lager verwalten. Community. Alles in einem.
        </p>

        <div className="hero-btns" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', animation:'slide-up .7s ease .3s both', width:'100%', maxWidth:400 }}>
          <button onClick={() => router.push('/register')} className="btn-primary" style={{ fontSize:16, padding:'16px 36px' }}>
            Kostenlos starten →
          </button>
          <button onClick={() => router.push('/login')} className="btn-ghost" style={{ fontSize:16, padding:'16px 36px' }}>
            Demo ansehen
          </button>
        </div>

        {/* 3D Interactive Mockup */}
        <div ref={mockupTilt} style={{ marginTop:80, maxWidth:900, width:'100%', transition:'transform .15s ease', transformStyle:'preserve-3d', animation:'slide-up .8s ease .4s both' }}>
          <div style={{ background:'#111827', border:'1px solid rgba(255,255,255,.12)', borderRadius:20, overflow:'hidden', boxShadow:'0 40px 120px rgba(0,0,0,.7), 0 0 80px rgba(99,102,241,.12)' }}>

            {/* Window chrome */}
            <div style={{ background:'#0d1117', padding:'12px 18px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'#ef4444' }}/>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'#f59e0b' }}/>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'#22c55e' }}/>
              <div style={{ flex:1, background:'rgba(255,255,255,.05)', borderRadius:6, height:22, marginLeft:8, display:'flex', alignItems:'center', paddingLeft:10 }}>
                <span style={{ fontSize:11, color:'#4b5563' }}>project-dle5b.vercel.app/{activeScreen === 'dashboard' ? 'dashboard' : activeScreen}</span>
              </div>
            </div>

            {/* App layout */}
            <div className="mockup-wrap" style={{ display:'grid', gridTemplateColumns:'210px 1fr', minHeight:380 }}>

              {/* Sidebar — exactly like real app */}
              <div className="mockup-sidebar" style={{ background:'#111827', borderRight:'1px solid rgba(255,255,255,.06)', padding:'14px 10px', flexDirection:'column', gap:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', marginBottom:10 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#111827' }}>LS</div>
                  <span style={{ fontSize:13, fontWeight:800, color:'#f9fafb' }}>ListSync</span>
                  <span style={{ fontSize:9, color:'#22c55e', background:'rgba(34,197,94,.15)', padding:'1px 5px', borderRadius:10, marginLeft:'auto' }}>BETA</span>
                </div>

                {/* New Listing CTA */}
                <div style={{ background:'#22c55e', borderRadius:9, padding:'8px 12px', display:'flex', alignItems:'center', gap:6, marginBottom:8, cursor:'pointer' }}
                  onClick={() => router.push('/register')}>
                  <span style={{ fontSize:14, color:'#111827', fontWeight:700 }}>+</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>Neues Listing</span>
                </div>

                <p style={{ fontSize:10, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'.08em', padding:'6px 10px 3px', margin:0 }}>Navigation</p>
                {[
                  { id:'dashboard', label:'Dashboard',       icon:'⊞' },
                  { id:'listings',  label:'Meine Listings',  icon:'≡' },
                  { id:'lager',     label:'Lager',           icon:'▦' },
                ].map(item => (
                  <div key={item.id} onClick={() => setActiveScreen(item.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer',
                      background: activeScreen===item.id ? 'rgba(255,255,255,.07)' : 'transparent',
                      color: activeScreen===item.id ? '#f9fafb' : '#6b7280',
                      fontWeight: activeScreen===item.id ? 600 : 500, fontSize:13,
                      transition:'all .12s' }}>
                    <span style={{ fontSize:15 }}>{item.icon}</span>
                    {item.label}
                    {activeScreen===item.id && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#22c55e' }}/>}
                  </div>
                ))}

                <p style={{ fontSize:10, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'.08em', padding:'10px 10px 3px', margin:0 }}>Community</p>
                {[
                  { id:'community', label:'Community', icon:'◉' },
                ].map(item => (
                  <div key={item.id} onClick={() => setActiveScreen(item.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer',
                      background: activeScreen===item.id ? 'rgba(255,255,255,.07)' : 'transparent',
                      color: activeScreen===item.id ? '#f9fafb' : '#6b7280',
                      fontWeight: activeScreen===item.id ? 600 : 500, fontSize:13 }}>
                    <span style={{ fontSize:15 }}>{item.icon}</span>
                    {item.label}
                    {activeScreen===item.id && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#22c55e' }}/>}
                  </div>
                ))}
              </div>

              {/* Main content — switches per screen */}
              <div style={{ background:'#0d1117', padding:16, overflow:'hidden' }}>

                {/* DASHBOARD */}
                {activeScreen === 'dashboard' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <p style={{ fontSize:16, fontWeight:800, color:'#f9fafb', margin:0 }}>Dashboard</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                      {[['💰','1.240 €','Einnahmen','#3b82f6'],['📈','340 €','Gewinn','#22c55e'],['🎯','87%','Monatsziel','#f59e0b']].map(([ic,v,l,c]) => (
                        <div key={l} style={{ background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:14, padding:'14px 14px' }}>
                          <span style={{ fontSize:20 }}>{ic}</span>
                          <p style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', margin:'8px 0 2px', letterSpacing:'-0.02em' }}>{v}</p>
                          <p style={{ fontSize:11, color:'#6b7280', margin:0 }}>{l}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:14, padding:14 }}>
                      <p style={{ fontSize:11, color:'#6b7280', fontWeight:700, textTransform:'uppercase', margin:'0 0 10px', letterSpacing:'.06em' }}>Aktive Listings</p>
                      {[['Nike Air Max 90','89€','Vinted'],["Vintage Levi's 501",'45€','KA'],['Adidas Hoodie','35€','eBay']].map(([t,p,pl]) => (
                        <div key={t} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                          <div style={{ width:30, height:30, borderRadius:8, background:'rgba(99,102,241,.2)', flexShrink:0 }}/>
                          <span style={{ fontSize:12, color:'#e2e8f0', flex:1 }}>{t}</span>
                          <span style={{ fontSize:11, color:'#9ca3af' }}>{pl}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:'#f1f5f9' }}>{p}</span>
                          <span style={{ fontSize:10, color:'#22c55e', fontWeight:700, background:'rgba(34,197,94,.1)', padding:'2px 7px', borderRadius:20 }}>Aktiv</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LISTINGS */}
                {activeScreen === 'listings' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <p style={{ fontSize:16, fontWeight:800, color:'#f9fafb', margin:0 }}>Meine Listings</p>
                      <span style={{ fontSize:11, color:'#818cf8', background:'rgba(99,102,241,.1)', padding:'3px 10px', borderRadius:20, fontWeight:700 }}>12 Artikel</span>
                    </div>
                    {[
                      { t:'Nike Air Max 90 Weiß Gr. 42', p:'89 €', s:'Aktiv', sc:82, img:'#6366f1' },
                      { t:"Vintage Levi's 501 W32 L32", p:'45 €', s:'Aktiv', sc:74, img:'#8b5cf6' },
                      { t:'Adidas Originals Hoodie M', p:'35 €', s:'Aktiv', sc:55, img:'#ec4899' },
                      { t:'Ralph Lauren Polo Shirt L', p:'28 €', s:'Entwurf', sc:40, img:'#f59e0b' },
                    ].map(item => (
                      <div key={item.t} style={{ display:'flex', alignItems:'center', gap:10, background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:14, padding:'10px 12px' }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:`${item.img}33`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:item.img }}>{item.t.charAt(0)}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:12.5, fontWeight:700, color:'#f1f5f9', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.t}</p>
                          <span style={{ fontSize:10, fontWeight:700, color: item.s==='Aktiv'?'#10b981':'#f59e0b', background: item.s==='Aktiv'?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)', padding:'1px 6px', borderRadius:6 }}>{item.s}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:11, fontWeight:800, color: item.sc>=70?'#10b981':item.sc>=50?'#f59e0b':'#ef4444', background: `${item.sc>=70?'#10b981':item.sc>=50?'#f59e0b':'#ef4444'}18`, padding:'2px 7px', borderRadius:8 }}>{item.sc}</span>
                          <span style={{ fontSize:13, fontWeight:800, color:'#f1f5f9' }}>{item.p}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* LAGER */}
                {activeScreen === 'lager' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <p style={{ fontSize:16, fontWeight:800, color:'#f9fafb', margin:0 }}>📦 Lager</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                      {[['Regal A','3 Boxen','12 Artikel','#6366f1'],['Regal B','2 Boxen','8 Artikel','#8b5cf6'],['Unsortiert','1 Box','5 Artikel','#6b7280']].map(([n,b,a,c]) => (
                        <div key={n} style={{ cursor:'pointer', transition:'transform .15s' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                          <div style={{ height:8, background:`${c}55`, borderRadius:'6px 6px 0 0', border:`1px solid ${c}44`, borderBottom:'none' }}/>
                          <div style={{ background:`${c}12`, border:`1px solid ${c}33`, borderRadius:'0 0 12px 12px', padding:'10px 12px' }}>
                            <p style={{ fontSize:14, fontWeight:800, color:'#f1f5f9', margin:'0 0 2px' }}>{n}</p>
                            <p style={{ fontSize:11, color:'#6b7280', margin:0 }}>{b} · {a}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:14, padding:12 }}>
                      <p style={{ fontSize:11, color:'#6b7280', fontWeight:700, margin:'0 0 8px' }}>REGAL A → BOX 1</p>
                      {[['Nike Air Max 90','Fach 1'],["Levi's 501",'Fach 1'],['Adidas Hoodie','Fach 2']].map(([t,f]) => (
                        <div key={t} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                          <div style={{ width:26, height:26, borderRadius:7, background:'rgba(99,102,241,.2)' }}/>
                          <span style={{ fontSize:12, color:'#e2e8f0', flex:1 }}>{t}</span>
                          <span style={{ fontSize:10, color:'#6b7280' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* COMMUNITY */}
                {activeScreen === 'community' && (
                  <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:10, height:'100%' }}>
                    <div style={{ background:'#161b22', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, padding:10 }}>
                      <p style={{ fontSize:9, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 6px' }}>Channels</p>
                      {[['💬','allgemein',true],['🛍️','verkauf',false],['✅','legit-check',false],['📢','ankündigungen',false]].map(([e,l,a]) => (
                        <div key={l} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 7px', borderRadius:6, background:a?'rgba(99,102,241,.12)':'transparent', color:a?'#818cf8':'#6b7280', fontSize:11, fontWeight:a?700:500, marginBottom:2 }}>
                          <span>{e}</span># {l}
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        { u:'Denny', r:'👑 Owner', t:'Hat jemand Erfahrung mit Vinted-Preisgestaltung?', c:'#6366f1' },
                        { u:'Max', r:'🔥 Active', t:'@Denny ja, unter 10€ verkauft sich viel schneller!', c:'#8b5cf6' },
                        { u:'Sarah', r:'⭐ Regular', t:'Legit check bitte 👆 ist das original?', c:'#ec4899' },
                      ].map(msg => (
                        <div key={msg.u} style={{ display:'flex', gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:8, background:`${msg.c}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:msg.c, flexShrink:0 }}>{msg.u.charAt(0)}</div>
                          <div>
                            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
                              <span style={{ fontSize:12, fontWeight:700, color:'#f1f5f9' }}>{msg.u}</span>
                              <span style={{ fontSize:9, color:msg.c, background:`${msg.c}18`, padding:'1px 5px', borderRadius:4, fontWeight:700 }}>{msg.r}</span>
                            </div>
                            <p style={{ fontSize:12, color:'#9ca3af', margin:0, lineHeight:1.4 }}>{msg.t}</p>
                          </div>
                        </div>
                      ))}
                      <div style={{ display:'flex', gap:8, marginTop:'auto', alignItems:'center' }}>
                        <div style={{ flex:1, background:'#1f2937', borderRadius:8, padding:'7px 12px', fontSize:12, color:'#4b5563' }}>Nachricht schreiben…</div>
                        <div style={{ width:28, height:28, borderRadius:8, background:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:14, color:'white' }}>↑</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
          {/* Reflection */}
          <div style={{ height:50, background:'linear-gradient(to bottom,rgba(99,102,241,.08),transparent)', transform:'scaleY(-1)', opacity:.25, marginTop:-1, borderRadius:'0 0 20px 20px' }}/>
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={statsRef} style={{ padding:'60px 24px', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div className="stats-grid" style={{ maxWidth:900, margin:'0 auto', gap:24, textAlign:'center' }}>
          {[
            { val:12000, suf:'+', label:'Listings erstellt' },
            { val:3,     suf:'',  label:'Plattformen' },
            { val:98,    suf:'%', label:'Zeitersparnis' },
            { val:4.9,   suf:'★', label:'Bewertung' },
          ].map(s => (
            <div key={s.label} style={{ opacity:statsVis?1:0, transform:statsVis?'translateY(0)':'translateY(30px)', transition:'all .6s ease' }}>
              <p className="stat-number" style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, color:'white', margin:'0 0 6px', letterSpacing:'-0.03em' }}>
                {statsVis ? <Counter to={Math.floor(s.val)} suffix={s.suf}/> : '0'}
              </p>
              <p style={{ fontSize:13, color:'#64748b', margin:0, fontWeight:600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" ref={featRef} className="section-pad features-section-pad" style={{ padding:'100px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div className="features-header" style={{ textAlign:'center', marginBottom:64, opacity:featVis?1:0, transform:featVis?'translateY(0)':'translateY(30px)', transition:'all .6s ease' }}>
          <span style={{ fontSize:12, fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'.12em' }}>Features</span>
          <h2 style={{ fontSize:'clamp(28px,5vw,54px)', fontWeight:900, color:'white', letterSpacing:'-0.03em', margin:'12px 0 16px' }}>
            Alles was du als Reseller brauchst
          </h2>
          <p style={{ fontSize:17, color:'#64748b', maxWidth:500, margin:'0 auto', lineHeight:1.6 }}>
            Kein Tool-Dschungel mehr. ListSync ersetzt fünf verschiedene Apps.
          </p>
          {/* Mobile swipe hint */}
          <p style={{ fontSize:11, color:'rgba(99,102,241,.6)', marginTop:16, fontWeight:700, letterSpacing:'.06em' }}
            className="mobile-swipe-hint">← SWIPE →</p>
        </div>
        <div className="features-grid" style={{ gap:20 }}>
          {FEATURES.map(f => <FeatureCard key={f.title} {...f}/>)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding:'100px 24px', background:'rgba(255,255,255,.015)', borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
          <span style={{ fontSize:12, fontWeight:800, color:'#22c55e', textTransform:'uppercase', letterSpacing:'.12em' }}>So einfach</span>
          <h2 style={{ fontSize:'clamp(28px,5vw,54px)', fontWeight:900, color:'white', letterSpacing:'-0.03em', margin:'12px 0 60px' }}>3 Schritte zum Verkauf</h2>
          <div className="steps-grid" style={{ gap:40 }}>
            {[
              { n:'01', icon:'📸', title:'Foto machen', desc:'Produkt fotografieren, in ListSync hochladen.' },
              { n:'02', icon:'✨', title:'KI übernimmt', desc:'Titel, Beschreibung & Hashtags automatisch generiert.' },
              { n:'03', icon:'🚀', title:'Überall live', desc:'Mit einem Klick auf Vinted, Kleinanzeigen & eBay.' },
            ].map(step => (
              <div key={step.n} className="step-item" style={{ textAlign:'center' }}>
                <div style={{
                  width:80, height:80, borderRadius:24, margin:'0 auto 16px',
                  background:`linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.1))`,
                  border:'1px solid rgba(99,102,241,.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:36,
                  boxShadow:'0 0 30px rgba(99,102,241,.15)',
                }}>{step.icon}</div>
                <div style={{ fontSize:11, fontWeight:800, color:'#6366f1', letterSpacing:'.1em', marginBottom:8 }}>SCHRITT {step.n}</div>
                <h3 style={{ fontSize:20, fontWeight:800, color:'white', margin:'0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize:14, color:'#64748b', margin:0, lineHeight:1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" ref={pricRef} style={{ padding:'100px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <span style={{ fontSize:12, fontWeight:800, color:'#8b5cf6', textTransform:'uppercase', letterSpacing:'.12em' }}>Preise</span>
          <h2 style={{ fontSize:'clamp(28px,5vw,54px)', fontWeight:900, color:'white', letterSpacing:'-0.03em', margin:'12px 0 16px' }}>
            Wähle deinen Plan
          </h2>
          <p style={{ fontSize:16, color:'#64748b', margin:'0 0 48px' }}>Starte kostenlos — upgrade wenn du bereit bist.</p>
          <div className="pricing-grid" style={{ gap:20, textAlign:'left' }}>
            {/* Free */}
            <PricingCard vis={pricVis} delay={0} router={router}
              label="Free" price="0€" sub="Für immer kostenlos"
              included={['5 Listings','Lager & QR-Codes','Community Zugang','Basis Dashboard']}
              excluded={['KI-Assistent','Bulk Crossposten','Alle 3 Plattformen']}
              cta="Kostenlos starten" ctaStyle="ghost" ctaHref="/register" highlight={false}/>
            {/* Pro */}
            <PricingCard vis={pricVis} delay={0.1} router={router}
              label="Pro — 9,99€/Monat" price="9,99€" sub="Monatlich kündbar"
              included={['Unlimitierte Listings','Alle 3 Plattformen','Bulk Crossposten','KI-Assistent','Vollständige Analytics','Priority Support']}
              excluded={[]}
              cta="Pro starten →" ctaStyle="primary" ctaHref="/register" highlight={true}/>
            {/* Lifetime */}
            <PricingCard vis={pricVis} delay={0.2} router={router}
              label="Lifetime — Einmalig" price="79€" sub="Für immer Pro — kein Abo"
              included={['Alles aus Pro','Einmalige Zahlung','Alle zukünftigen Features','Keine Abo-Gebühren']}
              excluded={[]}
              cta="Lifetime holen →" ctaStyle="gold" ctaHref="/register" highlight={false}/>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'100px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <Orb size={600} x={50} y={50} color="#6366f1" dur={12}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <h2 style={{ fontSize:'clamp(32px,6vw,70px)', fontWeight:900, color:'white', letterSpacing:'-0.04em', margin:'0 0 20px', lineHeight:1.05 }}>
            Bereit loszulegen?
          </h2>
          <p style={{ fontSize:18, color:'#64748b', margin:'0 0 40px' }}>Kostenlos starten. Kein Kreditkarte nötig.</p>
          <button onClick={() => router.push('/register')} className="btn-primary" style={{ fontSize:18, padding:'18px 48px' }}>
            Jetzt kostenlos starten →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding:'32px 20px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
      <div className="footer-inner" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:7, background:'linear-gradient(135deg,#6366f1,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'white' }}>LS</div>
          <span style={{ fontSize:13, fontWeight:700, color:'#64748b' }}>ListSync © 2025</span>
        </div>
        <div style={{ display:'flex', gap:24 }}>
          {['Impressum','Datenschutz','AGB'].map(l => <a key={l} href="#" className="nav-link" style={{ fontSize:12 }}>{l}</a>)}
        </div>
      </div>
      </footer>
    </div>
  )
}
