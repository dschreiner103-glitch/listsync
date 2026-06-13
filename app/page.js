'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Hero3D = dynamic(() => import('./Hero3D'), { ssr: false })

/* ════════════════════════════════════════════════════════════
   ListSync × Lusion-Style — 1:1 Experience
   Preloader → Enter-Gate (Klick) → Curtain-Reveal →
   3D-Partikel-Sphere · scroll-gepinnte Sektionen · Wort-Reveals ·
   gepinnte Horizontal-Galerie · custom Cursor · magnetische Buttons
   Pure Canvas 2D + CSS, keine Dependencies.
   ════════════════════════════════════════════════════════════ */

const CREAM = '#ece7df'
const INK = '#08080a'
const ACC = '#f4511e'

/* ─────────── shared scroll/mouse state (no re-render) ─────────── */
const FX = { mx: 0, my: 0, tx: 0, ty: 0, scroll: 0, entered: 0, drag: 0 }

/* ═══════════════ Canvas: aurora + 3D particle sphere ═══════════════ */
function Scene() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let w, h, dpr, raf

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize(); window.addEventListener('resize', resize)

    // fibonacci sphere points
    const NP = 760
    const pts = []
    for (let i = 0; i < NP; i++) {
      const y = 1 - (i / (NP - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const phi = i * 2.399963
      pts.push({ x: Math.cos(phi) * r, y, z: Math.sin(phi) * r })
    }
    // distant dust
    const dust = []
    for (let i = 0; i < 70; i++) dust.push({ x: Math.random(), y: Math.random(), z: Math.random() * 0.8 + 0.2, a: Math.random() * 6.28, s: 0.01 + Math.random() * 0.04 })

    let t = 0, ease = 0
    const draw = () => {
      t += 0.0045
      // eased mouse
      FX.mx += (FX.tx - FX.mx) * 0.07
      FX.my += (FX.ty - FX.my) * 0.07
      ease += (FX.entered - ease) * 0.05

      ctx.clearRect(0, 0, w, h)

      // aurora orbs
      const orbs = [
        { x: 0.22 + Math.sin(t * 0.7) * 0.07, y: 0.32 + Math.cos(t * 0.5) * 0.07, r: 420, c: [244, 81, 30, 0.15] },
        { x: 0.8 + Math.cos(t * 0.6) * 0.06, y: 0.72 + Math.sin(t * 0.8) * 0.06, r: 460, c: [200, 30, 30, 0.12] },
        { x: 0.62 + Math.sin(t * 0.9) * 0.05, y: 0.24, r: 340, c: [255, 150, 90, 0.08] },
      ]
      for (const o of orbs) {
        const g = ctx.createRadialGradient(o.x * w, o.y * h, 0, o.x * w, o.y * h, o.r)
        g.addColorStop(0, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${o.c[3]})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      }

      // drifting dust
      for (const d of dust) {
        d.a += d.s * 0.5
        const x = d.x * w + Math.cos(d.a) * 14
        const y = d.y * h + Math.sin(d.a) * 14
        ctx.beginPath(); ctx.arc(x, y, d.z * 1.4, 0, 6.2832)
        ctx.fillStyle = `rgba(236,231,223,${0.10 + d.z * 0.12})`; ctx.fill()
      }

      // ── 3D sphere ──
      const scrollN = Math.min(FX.scroll / (h || 1), 1.4)   // 0..~1.4 through hero
      const cx = w * (0.5 + FX.mx * 0.04)
      // sphere rises & shrinks as we scroll past hero; sits center on gate
      const cy = h * (0.46 + scrollN * 0.55) + (1 - ease) * 0
      const baseR = Math.min(w, h) * (0.30) * (1 - scrollN * 0.35) * (0.6 + ease * 0.4)
      const rotY = t * 0.6 + FX.mx * 0.9 + FX.scroll * 0.0012 + FX.drag * 0.5
      const rotX = -0.35 + FX.my * 0.6 + Math.sin(t * 0.5) * 0.08
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
      const persp = 2.4
      const proj = []
      for (const p of pts) {
        let x = p.x, y = p.y, z = p.z
        let x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY
        let y1 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX
        const s = persp / (persp - z2)
        proj.push({ X: cx + x1 * baseR * s, Y: cy + y1 * baseR * s, d: z2, s })
      }
      proj.sort((a, b) => a.d - b.d)
      const fade = Math.max(0, 1 - scrollN * 0.8) * (0.25 + ease * 0.75)
      for (const p of proj) {
        const depth = (p.d + 1) / 2
        const rad = (0.6 + depth * 1.8) * p.s
        const orange = depth > 0.62
        const alpha = (0.10 + depth * 0.85) * fade
        ctx.beginPath(); ctx.arc(p.X, p.Y, rad, 0, 6.2832)
        ctx.fillStyle = orange ? `rgba(244,90,40,${alpha})` : `rgba(236,231,223,${alpha})`
        ctx.fill()
      }
      // glow core
      const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.1)
      gg.addColorStop(0, `rgba(244,81,30,${0.22 * fade})`)
      gg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, baseR * 1.1, 0, 6.2832); ctx.fill()

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
}

/* ═══════════════ Custom cursor with label ═══════════════ */
function Cursor() {
  const dot = useRef(null), ring = useRef(null), lab = useRef(null)
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return
    let mx = 0, my = 0, rx = 0, ry = 0, raf
    const move = (e) => {
      mx = e.clientX; my = e.clientY
      if (dot.current) dot.current.style.transform = `translate(${mx}px,${my}px)`
      const el = e.target.closest('[data-cursor],a,button')
      const txt = el?.getAttribute?.('data-cursor')
      if (ring.current) {
        ring.current.dataset.state = txt ? 'label' : (el ? 'hover' : 'idle')
        if (lab.current) lab.current.textContent = txt || ''
      }
    }
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18
      if (ring.current) ring.current.style.transform = `translate(${rx}px,${ry}px)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', move); loop()
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])
  return (
    <>
      <div ref={dot} className="cur-dot" />
      <div ref={ring} className="cur-ring" data-state="idle"><span ref={lab} className="cur-lab" /></div>
    </>
  )
}

/* ═══════════════ Magnetic button ═══════════════ */
function Magnetic({ children, className, onClick, style, ...rest }) {
  const ref = useRef(null)
  const move = (e) => {
    const el = ref.current, r = el.getBoundingClientRect()
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.35}px,${(e.clientY - r.top - r.height / 2) * 0.5}px)`
  }
  return (
    <button ref={ref} className={className} style={style} onClick={onClick}
      onMouseMove={move} onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)' }} {...rest}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>{children}</span>
    </button>
  )
}

function useReveal(threshold = 0.2) {
  const ref = useRef(null); const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setV(true), { threshold })
    if (ref.current) o.observe(ref.current); return () => o.disconnect()
  }, [threshold])
  return [ref, v]
}

const PANELS = [
  { n: '01', t: 'KI-Texter', tags: ['AI', 'Copy', 'SEO'], d: 'Stichpunkte rein — perfekter Titel, SEO-Text & Hashtags raus. In Sekunden.', icon: '✦' },
  { n: '02', t: 'Bulk-Crossposter', tags: ['Vinted', 'eBay', 'Kleinanzeigen'], d: 'Ein Artikel, ein Klick — automatisch live auf allen drei Plattformen.', icon: '⟁' },
  { n: '03', t: '3D-Lagersystem', tags: ['QR', 'Inventory'], d: 'Regal, Box, Fach mit QR-Codes. Jeden Artikel in Sekunden finden.', icon: '◇' },
  { n: '04', t: 'Live-Analytics', tags: ['Umsatz', 'Gewinn', 'Marge'], d: 'Einnahmen, Gewinn und Marge in Echtzeit — datenbasiert statt Bauchgefühl.', icon: '◈' },
]

const TESTIMONIALS = [
  { name: 'Lena M.', role: 'Pro-Sellerin', t: 'Ich liste jetzt in 2 Minuten, was vorher 20 gedauert hat. Der KI-Text ist oft besser als meiner.' },
  { name: 'Marco R.', role: 'Top-Seller', t: 'Endlich alles an einem Ort — Vinted, eBay und Kleinanzeigen mit einem Klick. Ein Gamechanger.' },
  { name: 'Sina K.', role: 'Pro-Sellerin', t: 'Das Lagersystem mit QR-Codes hat mein Chaos beendet. Ich finde jeden Artikel in Sekunden.' },
  { name: 'Tobias W.', role: 'Reseller', t: 'Auto-Relist läuft im Hintergrund, während ich schlafe. Meine Reichweite ist spürbar gestiegen.' },
  { name: 'Aylin D.', role: 'Verkäuferin', t: 'Der Listing-Score zeigt mir genau, was fehlt. Seitdem verkaufen sich meine Sachen schneller.' },
  { name: 'Jonas P.', role: 'Top-Seller', t: 'Die Analytics sind Gold wert — ich sehe sofort, was sich lohnt und was nicht.' },
]

export default function LusionLanding() {
  const router = useRouter()
  const go = () => router.push('/register')
  const scrollToId = (id) => {
    const el = document.getElementById(id); if (!el) return
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY)
    if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { window.scrollTo({ top, behavior: 'smooth' }); return }
    FX.starget = top
  }
  const [phase, setPhase] = useState('loading') // loading | ready | entered
  const [count, setCount] = useState(0)
  const [menu, setMenu] = useState(false)

  const stmtRef = useRef(null)
  const galWrapRef = useRef(null)
  const galTrackRef = useRef(null)
  const heroRef = useRef(null)

  // preloader counter
  useEffect(() => {
    let n = 0
    const id = setInterval(() => {
      n += Math.floor(Math.random() * 8) + 4
      if (n >= 100) { n = 100; clearInterval(id); setTimeout(() => setPhase('ready'), 350) }
      setCount(n)
    }, 80)
    return () => clearInterval(id)
  }, [])

  // lock scroll until entered
  useEffect(() => {
    document.body.style.overflow = phase === 'entered' ? '' : 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [phase])

  const enter = () => {
    FX.entered = 1
    setPhase('entered')
    window.scrollTo(0, 0)
  }

  // global mouse feed (for canvas sphere)
  useEffect(() => {
    const move = (e) => { FX.tx = (e.clientX / window.innerWidth - 0.5) * 2; FX.ty = (e.clientY / window.innerHeight - 0.5) * 2 }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  // scroll-driven effects — computed on every scroll event (robust, frame-throttled)
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight
      FX.scroll = window.scrollY
      // hero parallax fade
      if (heroRef.current) {
        const p = Math.min(Math.max(window.scrollY / vh, 0), 1)
        heroRef.current.style.opacity = String(Math.max(0, 1 - p * 1.15))
        heroRef.current.style.transform = `translateY(${p * -60}px)`
      }
      // statement word reveal
      if (stmtRef.current) {
        const r = stmtRef.current.getBoundingClientRect()
        const total = stmtRef.current.offsetHeight - vh
        const prog = Math.min(Math.max(-r.top / (total || 1), 0), 1)
        const words = stmtRef.current.querySelectorAll('.word')
        const lit = Math.floor(prog * (words.length + 4))
        words.forEach((wd, i) => { wd.style.opacity = i < lit ? '1' : '0.12' })
      }
      // pinned horizontal gallery
      if (galWrapRef.current && galTrackRef.current) {
        const r = galWrapRef.current.getBoundingClientRect()
        const total = galWrapRef.current.offsetHeight - vh
        const prog = Math.min(Math.max(-r.top / (total || 1), 0), 1)
        const dist = galTrackRef.current.scrollWidth - window.innerWidth
        galTrackRef.current.style.transform = `translate3d(${-prog * dist}px,0,0)`
      }
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  // Lenis-lite smooth scroll + velocity skew (desktop, non-touch, motion-ok)
  useEffect(() => {
    if (phase !== 'entered') return
    if (window.matchMedia('(hover: none)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    FX.starget = window.scrollY
    let current = window.scrollY, raf
    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const onWheel = (e) => {
      if (e.ctrlKey) return // let browser zoom through
      e.preventDefault()
      FX.starget = Math.min(Math.max(FX.starget + e.deltaY, 0), maxScroll())
    }
    // resync ONLY when idle (external scrollbar/keyboard). While animating we ignore
    // scroll events — they're our own scrollTo (which fire asynchronously, so a lock flag won't work).
    const onExt = () => { if (Math.abs(FX.starget - current) > 1.5) return; current = FX.starget = window.scrollY }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onExt, { passive: true })
    const loop = () => {
      const prev = current
      current += (FX.starget - current) * 0.12
      if (Math.abs(FX.starget - current) < 0.5) current = FX.starget
      if (Math.abs(current - prev) > 0.05) window.scrollTo(0, current)
      document.documentElement.style.setProperty('--vskew', Math.max(-5, Math.min(5, (current - prev) * 0.05)).toFixed(2) + 'deg')
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onExt)
      document.documentElement.style.setProperty('--vskew', '0deg')
    }
  }, [phase])

  const [ctaRef, ctaVis] = useReveal(0.3)
  const [workHeadRef, workHeadVis] = useReveal(0.4)

  const STATEMENT = 'Wir folgen keinen Trends. Wir bauen das Tool, das Reseller wirklich brauchen — schnell, schön und radikal einfach.'

  return (
    <div className={'lz' + (phase === 'entered' ? ' in' : '')} style={{ background: INK, color: CREAM }}>
      <style>{`
        .lz{ font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; cursor:none; overflow-x:clip; position:relative; }
        /* velocity skew (driven by --vskew from smooth-scroll loop) */
        .htitle,.astro-h,.stmt,.panel{ transform:skewY(var(--vskew,0deg)); }
        @media(hover:none){ .lz{cursor:auto} .cur-dot,.cur-ring{display:none} }
        .lz a,.lz button{ cursor:none; }

        /* cursor */
        .cur-dot{ position:fixed; top:0; left:0; width:6px; height:6px; margin:-3px 0 0 -3px; border-radius:50%; background:${CREAM}; z-index:9999; pointer-events:none; mix-blend-mode:difference; }
        .cur-ring{ position:fixed; top:0; left:0; width:40px; height:40px; margin:-20px 0 0 -20px; border:1px solid rgba(236,231,223,.5); border-radius:50%; z-index:9999; pointer-events:none; display:grid; place-items:center; transition:width .3s,height .3s,margin .3s,background .3s,border-color .3s; mix-blend-mode:difference; }
        .cur-ring[data-state="hover"]{ width:44px; height:44px; margin:-22px 0 0 -22px; background:rgba(236,231,223,.1); border-color:transparent; }
        .cur-ring[data-state="label"]{ width:92px; height:92px; margin:-46px 0 0 -46px; background:${ACC}; border-color:transparent; mix-blend-mode:normal; }
        .cur-lab{ font-size:12px; font-weight:800; letter-spacing:.08em; color:#fff; text-transform:uppercase; }

        /* preloader / enter gate */
        .gate{ position:fixed; inset:0; z-index:1000; background:${INK}; display:flex; flex-direction:column; align-items:center; justify-content:center; transition:transform 1.1s cubic-bezier(.76,0,.24,1), opacity .6s ease; }
        .gate.gone{ transform:translateY(-100%); }
        .gate-num{ font-size:clamp(90px,20vw,260px); font-weight:800; letter-spacing:-.05em; line-height:.8; }
        .gate-lbl{ font-size:12px; letter-spacing:.3em; text-transform:uppercase; color:rgba(236,231,223,.45); margin-top:26px; }
        .gate-bar{ position:absolute; left:0; bottom:0; height:2px; background:${ACC}; transition:width .15s linear; }
        .enter-wrap{ display:flex; flex-direction:column; align-items:center; gap:30px; opacity:0; transform:translateY(20px); transition:opacity .7s ease .1s, transform .7s ease .1s; }
        .gate.ready .enter-wrap{ opacity:1; transform:none; }
        .gate.ready .gate-loadview{ display:none; }
        .gate-brand{ font-size:clamp(40px,8vw,104px); font-weight:800; letter-spacing:-.05em; line-height:1; }
        .gate-brand em{ font-style:italic; font-weight:300; color:${ACC}; }
        .enter-btn{ position:relative; width:170px; height:170px; border-radius:50%; border:1px solid rgba(236,231,223,.35); background:transparent; color:${CREAM}; font-size:15px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; display:grid; place-items:center; transition:background .4s, color .4s, transform .4s; }
        .enter-btn:hover{ background:${ACC}; border-color:${ACC}; color:#fff; transform:scale(1.06); }
        .enter-btn::after{ content:''; position:absolute; inset:-9px; border-radius:50%; border:1px solid rgba(236,231,223,.18); animation:spinring 9s linear infinite; }
        @keyframes spinring{ to{ transform:rotate(360deg);} }
        .gate-hint{ font-size:12px; letter-spacing:.25em; text-transform:uppercase; color:rgba(236,231,223,.4); }

        /* nav */
        .nav{ position:fixed; top:0; left:0; right:0; z-index:300; display:flex; align-items:center; justify-content:space-between; padding:26px 40px; mix-blend-mode:difference; opacity:0; transition:opacity .8s ease .3s; }
        .lz.in .nav{ opacity:1; }
        .logo{ font-weight:800; font-size:21px; letter-spacing:-.04em; display:flex; align-items:center; gap:9px; }
        .logo b{ width:30px; height:30px; border-radius:8px; background:${ACC}; display:grid; place-items:center; font-size:13px; color:#fff; }
        .navlinks{ display:flex; gap:34px; }
        .navlinks a{ color:${CREAM}; text-decoration:none; font-size:14px; font-weight:500; position:relative; }
        .navlinks a::after{ content:''; position:absolute; left:0; bottom:-4px; width:0; height:1px; background:${CREAM}; transition:width .35s cubic-bezier(.76,0,.24,1); }
        .navlinks a:hover::after{ width:100%; }
        .menubtn{ display:none; background:none; border:none; color:${CREAM}; font-size:14px; font-weight:700; letter-spacing:.1em; }
        @media(max-width:820px){ .navlinks{display:none} .menubtn{display:block} .nav{padding:20px 22px} }

        /* content sits above canvas(z1) */
        .content{ position:relative; z-index:2; }

        /* hero */
        .hero{ position:relative; min-height:100vh; display:flex; flex-direction:column; justify-content:center; padding:0 40px; max-width:1440px; margin:0 auto; }
        @media(max-width:820px){ .hero{ padding:0 22px; } }
        .eyebrow{ display:flex; align-items:center; gap:14px; font-size:13px; letter-spacing:.18em; text-transform:uppercase; color:rgba(236,231,223,.55); margin-bottom:30px; }
        .eyebrow i{ width:46px; height:1px; background:rgba(236,231,223,.4); }
        .hl{ overflow:hidden; }
        .hl > span{ display:block; white-space:nowrap; transform:translateY(110%); transition:transform 1.1s cubic-bezier(.76,0,.24,1); }
        .lz.in .hl > span{ transform:translateY(0); }
        .lz.in .hl:nth-child(3) > span{ transition-delay:.08s; }
        .lz.in .hl:nth-child(4) > span{ transition-delay:.16s; }
        .htitle{ font-size:clamp(44px,9.2vw,148px); font-weight:800; line-height:.9; letter-spacing:-.045em; margin:0; }
        .htitle .it{ font-style:italic; font-weight:300; }
        .htitle .ac{ color:${ACC}; }
        .hsub{ max-width:440px; margin-top:36px; font-size:clamp(15px,1.6vw,19px); line-height:1.55; color:rgba(236,231,223,.72); overflow:hidden; }
        .hsub span{ display:block; transform:translateY(110%); transition:transform 1.1s cubic-bezier(.76,0,.24,1) .25s; }
        .lz.in .hsub span{ transform:translateY(0); }
        .hrow{ margin-top:44px; display:flex; align-items:center; gap:22px; flex-wrap:wrap; opacity:0; transform:translateY(20px); transition:all .9s ease .6s; }
        .lz.in .hrow{ opacity:1; transform:none; }

        .btn{ background:${CREAM}; color:${INK}; border:none; border-radius:60px; padding:19px 38px; font-size:15px; font-weight:700; transition:background .3s,color .3s; }
        .btn:hover{ background:${ACC}; color:#fff; }
        .btn.ghost{ background:transparent; color:${CREAM}; border:1px solid rgba(236,231,223,.3); }
        .btn.ghost:hover{ border-color:${CREAM}; }

        .scrollcue{ position:absolute; left:50%; bottom:34px; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:10px; font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:rgba(236,231,223,.5); opacity:0; transition:opacity 1s ease 1.1s; }
        .lz.in .scrollcue{ opacity:1; }
        .scrollcue i{ width:1px; height:40px; background:linear-gradient(${CREAM},transparent); animation:cue 1.8s ease-in-out infinite; }
        @keyframes cue{ 0%,100%{transform:scaleY(.4);transform-origin:top;opacity:.4} 50%{transform:scaleY(1);opacity:1} }

        /* marquee */
        .marq{ border-top:1px solid rgba(236,231,223,.12); border-bottom:1px solid rgba(236,231,223,.12); padding:28px 0; overflow:hidden; white-space:nowrap; background:rgba(8,8,10,.5); backdrop-filter:blur(2px); }
        .marq .track{ display:inline-block; animation:scroll 28s linear infinite; }
        .marq span{ font-size:clamp(28px,5vw,62px); font-weight:800; letter-spacing:-.03em; padding:0 26px; color:transparent; -webkit-text-stroke:1px rgba(236,231,223,.5); }
        .marq b{ color:${ACC}; -webkit-text-stroke:0; padding:0 16px; }
        @keyframes scroll{ from{transform:translateX(0)} to{transform:translateX(-50%)} }

        /* astronaut section */
        .astrosec{ position:relative; height:100vh; overflow:hidden; display:flex; align-items:center; }
        .astrocanvas{ position:absolute; inset:0; z-index:1; }
        .astro-ui{ position:relative; z-index:2; max-width:1440px; margin:0 auto; padding:0 40px; width:100%; pointer-events:none; }
        @media(max-width:820px){ .astro-ui{ padding:0 22px; } }
        .astro-h{ font-size:clamp(40px,7vw,104px); font-weight:800; letter-spacing:-.045em; line-height:.92; margin:0; max-width:8ch; text-shadow:0 8px 40px rgba(0,0,0,.6); }
        .astro-h .ac{ color:${ACC}; }
        .astro-sub{ margin-top:24px; max-width:380px; font-size:clamp(15px,1.5vw,18px); line-height:1.55; color:rgba(236,231,223,.75); text-shadow:0 4px 20px rgba(0,0,0,.7); }
        .astro-cue{ position:absolute; bottom:34px; left:50%; transform:translateX(-50%); z-index:2; font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:rgba(236,231,223,.5); }

        /* statement pinned */
        .stmtwrap{ height:260vh; position:relative; }
        .stmtpin{ position:sticky; top:0; height:100vh; display:flex; align-items:center; padding:0 40px; max-width:1300px; margin:0 auto; }
        @media(max-width:820px){ .stmtpin{ padding:0 22px; } }
        .stmt{ font-size:clamp(28px,5vw,74px); font-weight:300; line-height:1.14; letter-spacing:-.02em; }
        .stmt .word{ display:inline-block; opacity:.12; transition:opacity .35s ease; margin-right:.28em; }
        .stmt .word.ac{ color:${ACC}; font-style:italic; font-weight:500; }

        /* section head */
        .sec{ max-width:1440px; margin:0 auto; padding:120px 40px; }
        @media(max-width:820px){ .sec{ padding:80px 22px; } }
        .sechead{ font-size:13px; letter-spacing:.18em; text-transform:uppercase; color:rgba(236,231,223,.5); margin-bottom:18px; }
        .workhead{ font-size:clamp(30px,5vw,68px); font-weight:800; letter-spacing:-.04em; margin:0; line-height:1; max-width:820px; opacity:0; transform:translateY(36px); transition:all .9s cubic-bezier(.76,0,.24,1); }
        .workhead.in{ opacity:1; transform:none; }
        .workhead .ac{ color:${ACC}; }

        /* pinned horizontal gallery */
        .galwrap{ height:420vh; position:relative; }
        .galpin{ position:sticky; top:0; height:100vh; overflow:hidden; display:flex; align-items:center; }
        .galtrack{ display:flex; gap:30px; padding:0 40px; will-change:transform; }
        .panel{ position:relative; flex:0 0 auto; width:min(74vw,560px); height:64vh; border-radius:22px; border:1px solid rgba(236,231,223,.14); background:linear-gradient(160deg,#101012,#0a0a0c); overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; padding:42px; }
        .panel::before{ content:''; position:absolute; inset:0; background:radial-gradient(circle at 75% 18%,rgba(244,81,30,.18),transparent 58%); opacity:.6; }
        .panel:hover::before{ opacity:1; }
        .panel .pnum{ position:absolute; top:34px; right:38px; font-size:13px; color:rgba(236,231,223,.4); letter-spacing:.1em; }
        .panel .pico{ font-size:40px; color:${ACC}; position:relative; transition:transform .6s cubic-bezier(.76,0,.24,1); }
        .panel:hover .pico{ transform:rotate(180deg); }
        .panel .pt{ font-size:clamp(28px,3.4vw,46px); font-weight:700; letter-spacing:-.03em; margin:18px 0 12px; position:relative; }
        .panel .pd{ font-size:15px; color:rgba(236,231,223,.62); line-height:1.55; max-width:380px; position:relative; }
        .panel .ptags{ display:flex; gap:8px; flex-wrap:wrap; margin-top:22px; position:relative; }
        .ptag{ font-size:12px; padding:6px 14px; border:1px solid rgba(236,231,223,.2); border-radius:30px; color:rgba(236,231,223,.72); }
        .galnum{ position:absolute; bottom:40px; left:40px; font-size:13px; letter-spacing:.2em; color:rgba(236,231,223,.4); z-index:3; }

        /* big stats */
        .stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:30px; border-top:1px solid rgba(236,231,223,.12); padding-top:60px; margin-top:40px; }
        @media(max-width:820px){ .stats{ grid-template-columns:1fr; gap:40px; } }
        .stat b{ display:block; font-size:clamp(48px,7vw,96px); font-weight:800; letter-spacing:-.04em; line-height:.9; }
        .stat span{ display:block; margin-top:12px; color:rgba(236,231,223,.55); font-size:15px; }
        .stat b .ac{ color:${ACC}; }

        /* testimonials */
        .tsec{ max-width:1440px; margin:0 auto; padding:120px 40px; }
        .tgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .tcard{ background:rgba(236,231,223,.03); border:1px solid rgba(236,231,223,.1); border-radius:18px; padding:28px; transition:border-color .3s,background .3s; }
        .tcard:hover{ border-color:rgba(244,81,30,.4); background:rgba(244,81,30,.04); }
        .tcard p{ font-size:15.5px; line-height:1.6; color:rgba(236,231,223,.86); margin:0 0 20px; }
        .tcard .who{ display:flex; align-items:center; gap:12px; }
        .tcard .av{ width:40px; height:40px; border-radius:50%; background:rgba(244,81,30,.18); border:1px solid rgba(244,81,30,.4); display:grid; place-items:center; font-weight:800; color:${ACC}; font-size:15px; }
        .tcard .nm{ font-size:14px; font-weight:700; }
        .tcard .rl{ font-size:12px; color:rgba(236,231,223,.5); }
        @media(max-width:820px){ .tsec{padding:80px 22px} .tgrid{grid-template-columns:1fr} }

        /* pricing */
        .psec{ max-width:1120px; margin:0 auto; padding:120px 40px; }
        .pgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; align-items:stretch; }
        .pcard{ position:relative; background:rgba(236,231,223,.03); border:1px solid rgba(236,231,223,.12); border-radius:22px; padding:34px 30px; display:flex; flex-direction:column; transition:transform .3s,border-color .3s; }
        .pcard:hover{ transform:translateY(-6px); }
        .pcard.feat{ background:linear-gradient(160deg,rgba(244,81,30,.16),rgba(244,81,30,.04)); border-color:rgba(244,81,30,.45); box-shadow:0 0 60px rgba(244,81,30,.15); }
        .pcard .pname{ font-size:13px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:rgba(236,231,223,.7); }
        .pcard .pprice{ font-size:clamp(40px,5vw,58px); font-weight:800; letter-spacing:-.03em; margin:14px 0 2px; }
        .pcard .pprice small{ font-size:16px; font-weight:600; color:rgba(236,231,223,.5); }
        .pcard .pnote{ font-size:13px; color:rgba(236,231,223,.5); margin:0 0 22px; }
        .pcard ul{ list-style:none; padding:0; margin:0 0 26px; display:flex; flex-direction:column; gap:11px; flex:1; }
        .pcard li{ display:flex; gap:10px; font-size:14px; color:rgba(236,231,223,.85); }
        .pcard li::before{ content:'✓'; color:${ACC}; font-weight:800; }
        .pbtn{ width:100%; border:none; border-radius:60px; padding:16px; font-size:15px; font-weight:700; transition:background .3s,color .3s; }
        .pbtn.solid{ background:${CREAM}; color:${INK}; } .pbtn.solid:hover{ background:${ACC}; color:#fff; }
        .pbtn.out{ background:transparent; color:${CREAM}; border:1px solid rgba(236,231,223,.3); } .pbtn.out:hover{ border-color:${CREAM}; }
        .pbadge{ position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:${ACC}; color:#fff; font-size:11px; font-weight:800; letter-spacing:.06em; padding:5px 14px; border-radius:30px; }
        @media(max-width:820px){ .psec{padding:80px 22px} .pgrid{grid-template-columns:1fr} }

        /* cta */
        .cta{ text-align:center; padding:150px 24px 80px; }
        .cta h2{ font-size:clamp(40px,9vw,132px); font-weight:800; letter-spacing:-.045em; line-height:.95; margin:0 0 46px; opacity:0; transform:translateY(40px); transition:all 1s cubic-bezier(.76,0,.24,1); }
        .cta.in h2{ opacity:1; transform:none; }
        .cta h2 em{ font-style:italic; font-weight:300; color:${ACC}; }

        /* footer */
        .foot{ border-top:1px solid rgba(236,231,223,.12); padding:40px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; font-size:14px; color:rgba(236,231,223,.55); }
        .foot a{ color:rgba(236,231,223,.55); text-decoration:none; }
        .foot a:hover{ color:${CREAM}; }
        .footlinks{ display:flex; gap:26px; }

        /* mobile menu */
        .mov{ position:fixed; inset:0; z-index:400; background:${ACC}; display:flex; flex-direction:column; justify-content:center; padding:40px; transform:translateY(-100%); transition:transform .7s cubic-bezier(.76,0,.24,1); }
        .mov.open{ transform:none; }
        .mov a{ color:#fff; text-decoration:none; font-size:36px; font-weight:800; letter-spacing:-.03em; padding:9px 0; }
        .mov .close{ position:absolute; top:22px; right:26px; background:none; border:none; color:#fff; font-size:15px; font-weight:700; }
      `}</style>

      {/* Canvas scene (sphere + aurora) */}
      <Scene />
      <Cursor />

      {/* ── Preloader / Enter gate ── */}
      <div className={'gate' + (phase === 'ready' ? ' ready' : '') + (phase === 'entered' ? ' gone' : '')}
        onMouseDown={() => { FX.drag = 0.4 }} onMouseUp={() => { FX.drag = 0 }}>
        <div className="gate-loadview" style={{ textAlign: 'center' }}>
          <div className="gate-num">{count}</div>
          <div className="gate-lbl">ListSync® — Crosslisting Studio</div>
        </div>
        <div className="enter-wrap">
          <div className="gate-brand">List<em>Sync</em></div>
          <Magnetic className="enter-btn" onClick={enter} data-cursor="Los">Eintreten</Magnetic>
          <div className="gate-hint">Klicke, um die Experience zu starten</div>
        </div>
        <div className="gate-bar" style={{ width: count + '%' }} />
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="logo"><b>LS</b>ListSync</div>
        <div className="navlinks">
          <a onClick={() => router.push('/features')}>Features</a>
          <a onClick={() => router.push('/vision')}>Vision</a>
          <a onClick={() => router.push('/preise')}>Preise</a>
          <a onClick={() => router.push('/faq')}>FAQ</a>
          <a onClick={() => router.push('/login')}>Login</a>
        </div>
        <button className="menubtn" onClick={() => setMenu(true)}>MENÜ</button>
      </nav>

      <div className={'mov' + (menu ? ' open' : '')}>
        <button className="close" onClick={() => setMenu(false)}>SCHLIESSEN ✕</button>
        <a onClick={() => router.push('/features')}>Features</a>
        <a onClick={() => router.push('/vision')}>Vision</a>
        <a onClick={() => router.push('/preise')}>Preise</a>
        <a onClick={() => router.push('/faq')}>FAQ</a>
        <a onClick={() => router.push('/login')}>Login</a>
        <a onClick={go}>Kostenlos starten →</a>
      </div>

      <div className="content">
        {/* Hero */}
        <header className="hero" ref={heroRef}>
          <div className="eyebrow"><i />Reseller-Tooling, neu gedacht</div>
          <h1 className="htitle">
            <div className="hl"><span>Verkaufe <em className="it">smarter</em>.</span></div>
            <div className="hl"><span>Liste <span className="ac">überall</span>.</span></div>
            <div className="hl"><span>Arbeite <em className="it">weniger</em>.</span></div>
          </h1>
          <p className="hsub"><span>Ein Artikel, ein Klick — automatisch live auf Vinted, Kleinanzeigen & eBay. KI schreibt, das Lager organisiert sich, die Zahlen laufen in Echtzeit.</span></p>
          <div className="hrow">
            <Magnetic className="btn" onClick={go} data-cursor="Go">Kostenlos starten <span style={{ fontSize: 18 }}>→</span></Magnetic>
            <Magnetic className="btn ghost" onClick={() => scrollToId('work')}>Features ansehen</Magnetic>
          </div>
          <div className="scrollcue">Scroll<i /></div>
        </header>

        {/* Marquee */}
        <div className="marq">
          <div className="track">
            {[0, 1].map(k => (
              <span key={k}>CROSSPOST<b>•</b>KI-TEXTE<b>•</b>ANALYTICS<b>•</b>LAGER<b>•</b>COMMUNITY<b>•&nbsp;</b></span>
            ))}
          </div>
        </div>

        {/* 3D Liquid-Metal Blob (Lusion-style) */}
        <section className="astrosec">
          <div className="astrocanvas"><Hero3D /></div>
          <div className="astro-ui">
            <p className="sechead" style={{ marginBottom: 14 }}>Ein Tool</p>
            <h2 className="astro-h">Alles fließt<br /><span className="ac">zusammen.</span></h2>
            <p className="astro-sub">Vinted, Kleinanzeigen & eBay — verschmolzen in einer Oberfläche. Beweg die Maus.</p>
          </div>
          <div className="astro-cue">Weiterscrollen ↓</div>
        </section>

        {/* Statement pinned word-reveal */}
        <section className="stmtwrap" id="vision" ref={stmtRef}>
          <div className="stmtpin">
            <p className="stmt">
              {STATEMENT.split(' ').map((word, i) => (
                <span key={i} className={'word' + (/(radikal|einfach|schnell|schön)/.test(word) ? ' ac' : '')}>{word}</span>
              ))}
            </p>
          </div>
        </section>

        {/* Work head */}
        <section className="sec" id="work">
          <p className="sechead">Selected Modules — 04</p>
          <h2 ref={workHeadRef} className={'workhead' + (workHeadVis ? ' in' : '')}>
            Vier Werkzeuge, die deinen Reselling-Alltag <span className="ac">auf den Kopf stellen.</span>
          </h2>
        </section>

        {/* Pinned horizontal gallery */}
        <section className="galwrap" ref={galWrapRef}>
          <div className="galpin">
            <div className="galnum">SCROLL ↓ — 01 / 04</div>
            <div className="galtrack" ref={galTrackRef}>
              {PANELS.map(p => (
                <article key={p.n} className="panel" data-cursor="View">
                  <span className="pnum">{p.n} / 04</span>
                  <div className="pico">{p.icon}</div>
                  <div>
                    <h3 className="pt">{p.t}</h3>
                    <p className="pd">{p.d}</p>
                    <div className="ptags">{p.tags.map(t => <span key={t} className="ptag">{t}</span>)}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Big stats */}
        <section className="sec">
          <p className="sechead">In Zahlen</p>
          <div className="stats">
            <div className="stat"><b>12.000<span className="ac">+</span></b><span>Listings über ListSync erstellt</span></div>
            <div className="stat"><b>3<span className="ac">→</span>1</b><span>Plattformen mit einem Klick bespielt</span></div>
            <div className="stat"><b>15<span className="ac">min</span></b><span>gespart pro Artikel durch KI & Bulk</span></div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="tsec">
          <p className="sechead">Stimmen</p>
          <h2 className="workhead" style={{ margin: '12px 0 44px', maxWidth: 760 }}>Reseller, die <span className="ac">schneller verkaufen.</span></h2>
          <div className="tgrid">
            {TESTIMONIALS.map(m => (
              <div key={m.name} className="tcard" data-hover>
                <p>„{m.t}"</p>
                <div className="who"><div className="av">{m.name[0]}</div><div><div className="nm">{m.name}</div><div className="rl">{m.role}</div></div></div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="psec" id="pricing">
          <p className="sechead" style={{ textAlign: 'center' }}>Preise</p>
          <h2 className="workhead" style={{ textAlign: 'center', margin: '12px auto 50px', maxWidth: 680 }}>Fair, transparent, <span className="ac">jederzeit kündbar.</span></h2>
          <div className="pgrid">
            <div className="pcard" data-hover>
              <span className="pname">Free</span>
              <p className="pprice">0€</p>
              <p className="pnote">Zum Reinschnuppern</p>
              <ul>{['Bis zu 5 Listings', '1 Plattform', 'KI-Texter (limitiert)', 'Basis-Analytics'].map(f => <li key={f}>{f}</li>)}</ul>
              <Magnetic className="pbtn out" onClick={go} data-cursor="Go">Kostenlos starten</Magnetic>
            </div>
            <div className="pcard feat" data-hover>
              <span className="pbadge">Beliebt</span>
              <span className="pname">Pro</span>
              <p className="pprice">9,99€<small>/Monat</small></p>
              <p className="pnote">Monatlich kündbar</p>
              <ul>{['Unlimitierte Listings', 'Alle 3 Plattformen', 'Bulk-Crossposten', 'Voller KI-Assistent', 'Lager & QR-Codes', 'Vollständige Analytics'].map(f => <li key={f}>{f}</li>)}</ul>
              <Magnetic className="pbtn solid" onClick={go} data-cursor="Go">Pro holen →</Magnetic>
            </div>
            <div className="pcard" data-hover>
              <span className="pname">Lifetime</span>
              <p className="pprice">79€<small> einmalig</small></p>
              <p className="pnote">Pro für immer · kein Abo</p>
              <ul>{['Alles aus Pro', 'Einmalzahlung', 'Alle künftigen Updates', 'Keine monatlichen Kosten'].map(f => <li key={f}>{f}</li>)}</ul>
              <Magnetic className="pbtn out" onClick={go} data-cursor="Go">Lifetime sichern</Magnetic>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: 26, fontSize: 13, color: 'rgba(236,231,223,.45)' }}>Alle Fragen offen? <a onClick={() => router.push('/faq')} style={{ color: ACC, cursor: 'none', fontWeight: 700 }}>Zum FAQ →</a></p>
        </section>

        {/* CTA */}
        <section className={'cta' + (ctaVis ? ' in' : '')} ref={ctaRef}>
          <p className="sechead">Bereit?</p>
          <h2>Bist du bereit,<br /><em>durchzustarten?</em></h2>
          <Magnetic className="btn" onClick={go} data-cursor="Go" style={{ fontSize: 17, padding: '22px 50px' }}>
            Jetzt kostenlos starten <span style={{ fontSize: 20 }}>→</span>
          </Magnetic>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(236,231,223,.45)' }}>Keine Kreditkarte · jederzeit kündbar</p>
        </section>

        {/* Footer */}
        <footer className="foot">
          <div className="logo" style={{ fontSize: 18 }}><b>LS</b>ListSync</div>
          <div className="footlinks">
            <a onClick={() => router.push('/features')}>Features</a>
            <a onClick={() => router.push('/preise')}>Preise</a>
            <a onClick={() => router.push('/faq')}>FAQ</a>
            <a onClick={() => router.push('/privacy')}>Datenschutz</a>
          </div>
          <span>© 2026 ListSync. Alle Rechte vorbehalten.</span>
        </footer>
      </div>
    </div>
  )
}
