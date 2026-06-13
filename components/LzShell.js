'use client'
import { useRouter, usePathname } from 'next/navigation'

/* Geteilte Hülle für die Lusion-Style Unterseiten (Features, Vision, Preise, FAQ):
   einheitliche Nav, Footer und Basis-Styles. */

const CREAM = '#ece7df'
const INK = '#08080a'
const ACC = '#f4511e'

const NAV = [['Home', '/'], ['Features', '/features'], ['Vision', '/vision'], ['Preise', '/preise'], ['FAQ', '/faq']]

export default function LzShell({ children }) {
  const router = useRouter()
  const path = usePathname()
  return (
    <div className="lzp" style={{ background: INK, color: CREAM, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .lzp{ font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; }
        .lzp a{ cursor:pointer; }
        .lzp-nav{ display:flex; align-items:center; justify-content:space-between; padding:24px 40px; position:sticky; top:0; z-index:50; background:rgba(8,8,10,.72); backdrop-filter:blur(14px); border-bottom:1px solid rgba(236,231,223,.08); }
        .lzp-logo{ font-weight:800; font-size:20px; letter-spacing:-.04em; display:flex; align-items:center; gap:9px; cursor:pointer; }
        .lzp-logo b{ width:29px; height:29px; border-radius:8px; background:${ACC}; display:grid; place-items:center; font-size:13px; color:#fff; }
        .lzp-links{ display:flex; align-items:center; gap:28px; }
        .lzp-links a{ color:${CREAM}; text-decoration:none; font-size:14px; font-weight:500; opacity:.78; transition:opacity .2s; position:relative; }
        .lzp-links a:hover, .lzp-links a.on{ opacity:1; }
        .lzp-links a.on::after{ content:''; position:absolute; left:0; right:0; bottom:-6px; height:2px; background:${ACC}; border-radius:2px; }
        .lzp-cta{ background:${CREAM}; color:${INK}; border:none; border-radius:40px; padding:11px 22px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:background .3s,color .3s; }
        .lzp-cta:hover{ background:${ACC}; color:#fff; }
        @media(max-width:760px){ .lzp-nav{padding:18px 20px} .lzp-links{gap:16px} .lzp-links .lzp-hide{display:none} }

        .lzp-main{ flex:1; }
        .lzp-hero{ max-width:1000px; margin:0 auto; padding:90px 24px 20px; text-align:center; }
        .lzp-eye{ font-size:13px; letter-spacing:.2em; text-transform:uppercase; color:rgba(236,231,223,.5); }
        .lzp-hero h1{ font-size:clamp(40px,8vw,92px); font-weight:800; letter-spacing:-.045em; line-height:.95; margin:16px 0 16px; }
        .lzp-hero h1 .ac{ color:${ACC}; font-style:italic; font-weight:300; }
        .lzp-hero p{ color:rgba(236,231,223,.66); font-size:18px; line-height:1.55; max-width:600px; margin:0 auto; }

        .lzp-sec{ max-width:1180px; margin:0 auto; padding:50px 24px 60px; }
        .lzp-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:18px; }
        .lzp-card{ background:rgba(236,231,223,.03); border:1px solid rgba(236,231,223,.1); border-radius:20px; padding:30px; transition:border-color .3s,background .3s,transform .3s; }
        .lzp-card:hover{ border-color:rgba(244,81,30,.4); background:rgba(244,81,30,.04); transform:translateY(-4px); }
        .lzp-ico{ font-size:32px; }
        .lzp-card h3{ font-size:20px; font-weight:700; letter-spacing:-.02em; margin:16px 0 8px; }
        .lzp-card p{ font-size:14.5px; line-height:1.55; color:rgba(236,231,223,.65); margin:0 0 14px; }
        .lzp-tag{ display:inline-block; font-size:12px; font-weight:700; color:${ACC}; background:rgba(244,81,30,.12); border:1px solid rgba(244,81,30,.28); padding:5px 12px; border-radius:30px; }

        .lzp-btn{ border:none; border-radius:60px; padding:17px 38px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:background .3s,color .3s,border-color .3s; }
        .lzp-btn.solid{ background:${CREAM}; color:${INK}; } .lzp-btn.solid:hover{ background:${ACC}; color:#fff; }
        .lzp-btn.out{ background:transparent; color:${CREAM}; border:1px solid rgba(236,231,223,.3); } .lzp-btn.out:hover{ border-color:${CREAM}; }

        .lzp-foot{ border-top:1px solid rgba(236,231,223,.1); padding:36px 40px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:18px; font-size:14px; color:rgba(236,231,223,.55); }
        .lzp-foot a{ color:rgba(236,231,223,.55); text-decoration:none; } .lzp-foot a:hover{ color:${CREAM}; }
        .lzp-foot .fl{ display:flex; gap:24px; flex-wrap:wrap; }
      `}</style>

      <nav className="lzp-nav">
        <div className="lzp-logo" onClick={() => router.push('/')}><b>LS</b>ListSync</div>
        <div className="lzp-links">
          {NAV.map(([lb, href]) => (
            <a key={href} className={'lzp-hide' + (path === href ? ' on' : '')} onClick={() => router.push(href)}>{lb}</a>
          ))}
          <a className="lzp-hide" onClick={() => router.push('/login')}>Login</a>
          <button className="lzp-cta" onClick={() => router.push('/register')}>Kostenlos starten</button>
        </div>
      </nav>

      <main className="lzp-main">{children}</main>

      <footer className="lzp-foot">
        <div className="lzp-logo" style={{ fontSize: 17 }} onClick={() => router.push('/')}><b>LS</b>ListSync</div>
        <div className="fl">
          <a onClick={() => router.push('/features')}>Features</a>
          <a onClick={() => router.push('/vision')}>Vision</a>
          <a onClick={() => router.push('/preise')}>Preise</a>
          <a onClick={() => router.push('/faq')}>FAQ</a>
          <a onClick={() => router.push('/privacy')}>Datenschutz</a>
        </div>
        <span>© 2026 ListSync</span>
      </footer>
    </div>
  )
}
