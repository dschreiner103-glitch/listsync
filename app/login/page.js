'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CREAM = '#ece7df'
const INK = '#08080a'
const ACC = '#f4511e'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [gLoading, setGLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { redirect: false, email, password })
    setLoading(false)
    if (res?.error) { setError('E-Mail oder Passwort falsch.') }
    else { router.push('/dashboard') }
  }

  function handleGoogle() {
    setGLoading(true)
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="lz-auth">
      <style>{`
        .lz-auth{ min-height:100vh; background:${INK}; color:${CREAM}; position:relative; overflow:hidden;
          display:flex; align-items:center; justify-content:center; padding:40px 20px;
          font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; }
        /* aurora orbs */
        .lz-auth .orb{ position:absolute; border-radius:50%; filter:blur(90px); pointer-events:none; }
        .lz-auth .orb1{ width:520px; height:520px; background:radial-gradient(circle,rgba(244,81,30,.32),transparent 68%); top:-160px; left:-120px; animation:lzfloat-a 22s ease-in-out infinite; }
        .lz-auth .orb2{ width:460px; height:460px; background:radial-gradient(circle,rgba(200,30,30,.22),transparent 68%); bottom:-180px; right:-120px; animation:lzfloat-b 27s ease-in-out infinite; }
        .lz-auth .orb3{ width:360px; height:360px; background:radial-gradient(circle,rgba(255,150,90,.14),transparent 70%); top:30%; right:24%; animation:lzfloat-c 31s ease-in-out infinite; }
        @keyframes lzfloat-a{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(50px,40px)} }
        @keyframes lzfloat-b{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,-50px)} }
        @keyframes lzfloat-c{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-30px)} }
        @media(prefers-reduced-motion:reduce){ .lz-auth .orb{animation:none} }

        .lz-auth .wrap{ position:relative; z-index:2; width:100%; max-width:400px; }
        .lz-auth .brand{ display:flex; align-items:center; justify-content:center; gap:11px; margin-bottom:30px; }
        .lz-auth .brand b{ width:38px; height:38px; border-radius:10px; background:${ACC}; display:grid; place-items:center; font-size:16px; font-weight:800; color:#fff; }
        .lz-auth .brand span{ font-size:24px; font-weight:800; letter-spacing:-.04em; }

        .lz-auth .card{ background:rgba(236,231,223,.035); border:1px solid rgba(236,231,223,.12);
          border-radius:24px; padding:40px 34px 34px; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
          box-shadow:0 30px 80px rgba(0,0,0,.5); }
        .lz-auth h1{ font-size:30px; font-weight:800; letter-spacing:-.04em; margin:0 0 8px; line-height:1.05; }
        .lz-auth h1 em{ font-style:italic; font-weight:300; color:${ACC}; }
        .lz-auth .sub{ font-size:14.5px; color:rgba(236,231,223,.55); margin:0 0 28px; }

        .lz-auth label{ display:block; font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:rgba(236,231,223,.6); margin-bottom:8px; }
        .lz-auth .field{ position:relative; margin-bottom:18px; }
        .lz-auth input{ width:100%; box-sizing:border-box; padding:15px 16px; font-size:15px; font-family:inherit;
          background:rgba(236,231,223,.05); border:1px solid rgba(236,231,223,.16); border-radius:14px;
          color:${CREAM}; transition:border-color .2s, box-shadow .2s, background .2s; }
        .lz-auth input::placeholder{ color:rgba(236,231,223,.3); }
        .lz-auth input:focus{ outline:none; border-color:${ACC}; background:rgba(236,231,223,.07); box-shadow:0 0 0 3px rgba(244,81,30,.18); }
        .lz-auth .pw-toggle{ position:absolute; right:6px; top:34px; background:none; border:none; color:rgba(236,231,223,.5);
          font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; padding:8px 10px; cursor:pointer; }
        .lz-auth .pw-toggle:hover{ color:${CREAM}; }

        .lz-auth .err{ background:rgba(244,81,30,.1); border:1px solid rgba(244,81,30,.35); color:#ff8a5e;
          font-size:13px; border-radius:12px; padding:11px 14px; font-weight:600; margin-bottom:18px; }

        .lz-auth .submit{ width:100%; padding:16px; border:none; border-radius:60px; font-size:15px; font-weight:700;
          font-family:inherit; cursor:pointer; background:${ACC}; color:#fff; transition:transform .2s, opacity .2s, box-shadow .2s;
          box-shadow:0 10px 30px rgba(244,81,30,.35); }
        .lz-auth .submit:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 14px 38px rgba(244,81,30,.45); }
        .lz-auth .submit:disabled{ opacity:.6; cursor:default; box-shadow:none; }

        .lz-auth .divider{ display:flex; align-items:center; gap:14px; margin:24px 0; color:rgba(236,231,223,.4); font-size:12px; letter-spacing:.1em; text-transform:uppercase; }
        .lz-auth .divider::before,.lz-auth .divider::after{ content:''; flex:1; height:1px; background:rgba(236,231,223,.14); }

        .lz-auth .google{ width:100%; padding:15px; border-radius:60px; font-size:15px; font-weight:700; font-family:inherit; cursor:pointer;
          background:${CREAM}; color:${INK}; border:none; display:flex; align-items:center; justify-content:center; gap:11px;
          transition:transform .2s, opacity .2s; }
        .lz-auth .google:hover:not(:disabled){ transform:translateY(-2px); }
        .lz-auth .google:disabled{ opacity:.6; cursor:default; }

        .lz-auth .foot{ text-align:center; font-size:14px; color:rgba(236,231,223,.5); margin-top:24px; }
        .lz-auth .foot a{ color:${ACC}; font-weight:700; text-decoration:none; }
        .lz-auth .foot a:hover{ text-decoration:underline; }
        .lz-auth .back{ position:absolute; top:26px; left:26px; z-index:3; color:rgba(236,231,223,.6); text-decoration:none; font-size:14px; font-weight:600; }
        .lz-auth .back:hover{ color:${CREAM}; }
        @media(max-width:480px){ .lz-auth .card{ padding:32px 24px 28px; } .lz-auth .back{ top:18px; left:18px; } }
      `}</style>

      <span className="orb orb1" /><span className="orb orb2" /><span className="orb orb3" />

      <Link href="/" className="back">← Zurück</Link>

      <div className="wrap">
        <div className="brand"><b>LS</b><span>ListSync</span></div>

        <div className="card">
          <h1>Willkommen <em>zurück</em>.</h1>
          <p className="sub">Melde dich an, um weiterzumachen.</p>

          <button type="button" className="google" onClick={handleGoogle} disabled={gLoading}>
            <GoogleIcon />
            {gLoading ? 'Weiterleiten…' : 'Mit Google anmelden'}
          </button>

          <div className="divider">oder mit E-Mail</div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>E-Mail</label>
              <input type="email" required autoComplete="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="deine@email.de" />
            </div>

            <div className="field">
              <label>Passwort</label>
              <input type={showPw ? 'text' : 'password'} required autoComplete="current-password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                {showPw ? 'Verbergen' : 'Zeigen'}
              </button>
            </div>

            {error && <div className="err">{error}</div>}

            <button type="submit" className="submit" disabled={loading}>
              {loading ? 'Anmelden…' : 'Anmelden →'}
            </button>
          </form>
        </div>

        <p className="foot">
          Noch kein Konto? <Link href="/register">Jetzt registrieren</Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  )
}
