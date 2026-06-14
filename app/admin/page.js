'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CREAM = '#ece7df'
const INK = '#08080a'
const ACC = '#f4511e'

export default function AdminPage() {
  const router = useRouter()
  const [code, setCode]       = useState('')        // akzeptierter Code
  const [codeInput, setCodeInput] = useState('')
  const [users, setUsers]     = useState([])
  const [count, setCount]     = useState(0)
  const [state, setState]     = useState('locked')  // locked | loading | ok | error
  const [lockMsg, setLockMsg] = useState('')
  const [errMsg, setErrMsg]   = useState('')
  const [tab, setTab]         = useState('users')

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult]   = useState(null)

  // Beim Laden: gespeicherten Code aus der Sitzung versuchen
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('adminCode') : null
    if (saved) unlock(saved)
  }, [])

  async function unlock(tryCode) {
    setState('loading'); setLockMsg('')
    try {
      const r = await fetch('/api/admin/users', { headers: { 'x-admin-code': tryCode } })
      if (r.status === 403) { setState('locked'); setLockMsg('Falscher Code.'); sessionStorage.removeItem('adminCode'); return }
      if (!r.ok) {
        let msg = 'HTTP ' + r.status
        try { const d = await r.json(); if (d?.error) msg = d.error } catch {}
        setErrMsg(msg); setState('error'); return
      }
      const data = await r.json()
      setUsers(data.users || []); setCount(data.count || 0)
      setCode(tryCode); sessionStorage.setItem('adminCode', tryCode)
      setState('ok')
    } catch { setState('error') }
  }

  async function send(testOnly) {
    if (!subject.trim() || !message.trim()) { setResult({ error: 'Betreff und Nachricht ausfüllen.' }); return }
    if (!testOnly && !confirm(`Mail wirklich an alle ${count} Nutzer senden?`)) return
    setSending(true); setResult(null)
    try {
      const r = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-code': code },
        body: JSON.stringify({ subject, message, testOnly }),
      })
      const data = await r.json()
      if (!r.ok) setResult({ error: data.error || 'Fehler beim Senden.' })
      else setResult({ ...data })
    } catch { setResult({ error: 'Netzwerkfehler.' }) }
    setSending(false)
  }

  const fmtDate = (ms) => {
    if (!ms) return '—'
    const d = new Date(Number(ms))
    return isNaN(d) ? '—' : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="adm">
      <style>{`
        .adm{ min-height:100vh; background:${INK}; color:${CREAM}; font-family:'Inter',-apple-system,sans-serif; padding:40px 22px 80px; }
        .adm .inner{ max-width:980px; margin:0 auto; }
        .adm .top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:26px; flex-wrap:wrap; gap:14px; }
        .adm .brand{ display:flex; align-items:center; gap:10px; font-weight:800; font-size:20px; letter-spacing:-.03em; }
        .adm .brand b{ width:32px; height:32px; border-radius:9px; background:${ACC}; display:grid; place-items:center; font-size:14px; color:#fff; }
        .adm .back{ background:none; border:1px solid rgba(236,231,223,.2); color:${CREAM}; border-radius:30px; padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
        .adm .back:hover{ border-color:${CREAM}; }
        .adm h1{ font-size:30px; font-weight:800; letter-spacing:-.04em; margin:0 0 4px; }
        .adm h1 em{ font-style:italic; font-weight:300; color:${ACC}; }
        .adm .muted{ color:rgba(236,231,223,.55); font-size:14px; margin:0 0 24px; }
        .adm .tabs{ display:flex; gap:8px; margin-bottom:22px; }
        .adm .tab{ background:rgba(236,231,223,.05); border:1px solid rgba(236,231,223,.14); color:${CREAM}; border-radius:30px; padding:10px 20px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
        .adm .tab.on{ background:${ACC}; border-color:${ACC}; color:#fff; }
        .adm .card{ background:rgba(236,231,223,.035); border:1px solid rgba(236,231,223,.12); border-radius:18px; padding:22px; }
        .adm table{ width:100%; border-collapse:collapse; font-size:13.5px; }
        .adm th{ text-align:left; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:rgba(236,231,223,.5); padding:8px 10px; border-bottom:1px solid rgba(236,231,223,.14); }
        .adm td{ padding:11px 10px; border-bottom:1px solid rgba(236,231,223,.07); color:rgba(236,231,223,.9); }
        .adm tr:hover td{ background:rgba(236,231,223,.03); }
        .adm .pill{ font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; text-transform:uppercase; letter-spacing:.04em; }
        .adm .pill.free{ background:rgba(236,231,223,.1); color:rgba(236,231,223,.7); }
        .adm .pill.pro{ background:rgba(99,102,241,.2); color:#a5b4fc; }
        .adm .pill.lifetime{ background:rgba(244,81,30,.2); color:#ff8a5e; }
        .adm .yes{ color:#4ade80; font-weight:700; } .adm .no{ color:rgba(236,231,223,.35); }
        .adm label{ display:block; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:rgba(236,231,223,.6); margin:0 0 8px; }
        .adm input,.adm textarea{ width:100%; box-sizing:border-box; padding:13px 14px; font-size:15px; font-family:inherit; background:rgba(236,231,223,.05); border:1px solid rgba(236,231,223,.16); border-radius:12px; color:${CREAM}; margin-bottom:18px; }
        .adm input:focus,.adm textarea:focus{ outline:none; border-color:${ACC}; box-shadow:0 0 0 3px rgba(244,81,30,.18); }
        .adm textarea{ min-height:170px; resize:vertical; line-height:1.5; }
        .adm .row{ display:flex; gap:12px; flex-wrap:wrap; }
        .adm .btn{ border:none; border-radius:40px; padding:14px 26px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
        .adm .btn.primary{ background:${ACC}; color:#fff; box-shadow:0 8px 24px rgba(244,81,30,.3); }
        .adm .btn.ghost{ background:transparent; color:${CREAM}; border:1px solid rgba(236,231,223,.25); }
        .adm .btn:disabled{ opacity:.5; cursor:default; box-shadow:none; }
        .adm .note{ font-size:12.5px; color:rgba(236,231,223,.45); margin-top:14px; line-height:1.5; }
        .adm .res{ margin-top:16px; padding:12px 14px; border-radius:12px; font-size:13.5px; font-weight:600; }
        .adm .res.ok{ background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.3); color:#4ade80; }
        .adm .res.err{ background:rgba(244,81,30,.1); border:1px solid rgba(244,81,30,.35); color:#ff8a5e; }
        .adm .center{ text-align:center; padding:60px 20px; color:rgba(236,231,223,.6); }
        .adm .stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
        @media(max-width:620px){ .adm .stats{ grid-template-columns:repeat(2,1fr); } }
        .adm .stat{ background:rgba(236,231,223,.04); border:1px solid rgba(236,231,223,.12); border-radius:16px; padding:18px 20px; }
        .adm .stat .n{ font-size:30px; font-weight:800; letter-spacing:-.03em; line-height:1; }
        .adm .stat .l{ font-size:12px; color:rgba(236,231,223,.55); margin-top:6px; text-transform:uppercase; letter-spacing:.05em; }
        .adm .stat.acc .n{ color:${ACC}; }
        /* Lock-Screen */
        .adm .lock{ max-width:340px; margin:12vh auto 0; text-align:center; }
        .adm .lock .ico{ width:56px; height:56px; border-radius:16px; background:${ACC}; display:grid; place-items:center; margin:0 auto 20px; font-size:24px; }
        .adm .lock h2{ font-size:22px; font-weight:800; margin:0 0 8px; }
        .adm .lock p{ color:rgba(236,231,223,.55); font-size:14px; margin:0 0 24px; }
        .adm .lock input{ text-align:center; letter-spacing:.3em; font-size:20px; }
        .adm .lock .err{ color:#ff8a5e; font-size:13px; font-weight:600; margin:-8px 0 14px; }
      `}</style>

      <div className="inner">
        <div className="top">
          <div className="brand"><b>LS</b>ListSync · Admin</div>
          <button className="back" onClick={() => router.push('/dashboard')}>← Dashboard</button>
        </div>

        {(state === 'locked' || state === 'loading') && (
          <div className="lock">
            <div className="ico">🔒</div>
            <h2>Admin-Zugang</h2>
            <p>Gib deinen Zugangscode ein.</p>
            <form onSubmit={(e) => { e.preventDefault(); unlock(codeInput) }}>
              <input
                type="password" inputMode="numeric" autoFocus
                value={codeInput} onChange={e => setCodeInput(e.target.value)}
                placeholder="• • • • • •"
              />
              {lockMsg && <div className="err">{lockMsg}</div>}
              <button type="submit" className="btn primary" style={{ width: '100%' }} disabled={state === 'loading'}>
                {state === 'loading' ? 'Prüfe…' : 'Zugang'}
              </button>
            </form>
          </div>
        )}

        {state === 'error' && (
          <div className="center">
            Fehler beim Laden.<br />
            <span style={{ fontSize: 13, color: 'rgba(236,231,223,.5)' }}>{errMsg}</span><br /><br />
            <button className="back" onClick={() => { setState('locked'); setErrMsg('') }}>Nochmal</button>
          </div>
        )}

        {state === 'ok' && <>
          <h1>Nutzer & <em>Broadcast</em></h1>
          <p className="muted">{count} registrierte Nutzer.</p>

          {(() => {
            const free     = users.filter(u => (u.plan || 'free') === 'free').length
            const pro      = users.filter(u => u.plan === 'pro').length
            const lifetime = users.filter(u => u.plan === 'lifetime').length
            return (
              <div className="stats">
                <div className="stat"><div className="n">{count}</div><div className="l">Gesamt</div></div>
                <div className="stat acc"><div className="n">{free}</div><div className="l">Free</div></div>
                <div className="stat"><div className="n">{pro}</div><div className="l">Pro</div></div>
                <div className="stat"><div className="n">{lifetime}</div><div className="l">Lifetime</div></div>
              </div>
            )
          })()}

          <div className="tabs">
            <button className={'tab' + (tab === 'users' ? ' on' : '')} onClick={() => setTab('users')}>Nutzer ({count})</button>
            <button className={'tab' + (tab === 'broadcast' ? ' on' : '')} onClick={() => setTab('broadcast')}>Mail an alle</button>
          </div>

          {tab === 'users' && (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr>
                  <th>ID</th><th>E-Mail</th><th>Name</th><th>Telefon</th><th>Plan</th><th>Stripe</th><th>Registriert</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>{u.name || '—'}</td>
                      <td>{u.phone || '—'}</td>
                      <td><span className={'pill ' + (u.plan || 'free')}>{u.plan || 'free'}</span></td>
                      <td>{u.inStripe ? <span className="yes">✓</span> : <span className="no">–</span>}</td>
                      <td>{fmtDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'broadcast' && (
            <div className="card">
              <label>Betreff</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="z.B. Neues Feature: …" />
              <label>Nachricht</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hallo,&#10;&#10;wir haben gerade …" />
              <div className="row">
                <button className="btn ghost" disabled={sending} onClick={() => send(true)}>
                  {sending ? '…' : 'Testmail an mich'}
                </button>
                <button className="btn primary" disabled={sending} onClick={() => send(false)}>
                  {sending ? 'Sende…' : `An alle ${count} senden`}
                </button>
              </div>
              {result && (
                result.error
                  ? <div className="res err">{result.error}</div>
                  : <div className="res ok">
                      {result.testOnly ? 'Testmail verschickt' : 'Gesendet'}: {result.sent} ✓
                      {result.failed ? ` · ${result.failed} fehlgeschlagen` : ''}
                      {result.errors?.length ? ` (${result.errors[0]})` : ''}
                    </div>
              )}
              <p className="note">
                Tipp: Erst „Testmail an mich" klicken und in deinem Postfach prüfen, dann an alle senden.<br />
                Benötigt einen <code>RESEND_API_KEY</code> und einen Absender via <code>EMAIL_FROM</code> in den Vercel-Variablen.
              </p>
            </div>
          )}
        </>}
      </div>
    </div>
  )
}
