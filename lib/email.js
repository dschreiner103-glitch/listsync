import { Resend } from 'resend'

let _resend = null
export function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

// Absender: in .env / Vercel setzen, z.B. EMAIL_FROM="ListSync <updates@deine-domain.de>"
// Ohne verifizierte Domain erlaubt Resend nur den Test-Absender (onboarding@resend.dev),
// der ausschließlich an die eigene Konto-Email zustellt.
export function emailFrom() {
  return process.env.EMAIL_FROM || 'ListSync <onboarding@resend.dev>'
}

// Sendet dieselbe Mail an viele Empfänger — einzeln (kein geteiltes To/BCC),
// in Batches à 100 über die Resend-Batch-API. Gibt {sent, failed, errors} zurück.
export async function sendBroadcast({ subject, html, recipients }) {
  const resend = getResend()
  if (!resend) throw new Error('RESEND_API_KEY fehlt')

  const to = [...new Set((recipients || []).map(e => String(e).trim().toLowerCase()).filter(Boolean))]
  if (!to.length) return { sent: 0, failed: 0, errors: [] }

  const from = emailFrom()
  let sent = 0, failed = 0
  const errors = []

  // 100er-Batches
  for (let i = 0; i < to.length; i += 100) {
    const chunk = to.slice(i, i + 100)
    const payload = chunk.map(addr => ({ from, to: addr, subject, html }))
    try {
      const res = await resend.batch.send(payload)
      if (res?.error) { failed += chunk.length; errors.push(res.error.message || String(res.error)) }
      else { sent += chunk.length }
    } catch (e) {
      failed += chunk.length
      errors.push(e?.message || String(e))
    }
  }
  return { sent, failed, errors }
}

// Wandelt einfachen Text (mit Zeilenumbrüchen) in schlichtes HTML mit ListSync-Header.
export function basicEmailHtml({ heading, body }) {
  const safe = (body || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.06);">
        <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:22px;">
          <span style="display:inline-grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#f4511e;color:#fff;font-weight:800;font-size:13px;">LS</span>
          <strong style="font-size:17px;color:#08080a;">ListSync</strong>
        </div>
        ${heading ? `<h1 style="font-size:21px;color:#08080a;margin:0 0 14px;">${heading}</h1>` : ''}
        <div style="font-size:15px;line-height:1.6;color:#3f3f46;">${safe}</div>
      </div>
      <p style="text-align:center;font-size:12px;color:#a1a1aa;margin-top:20px;">© ListSync · Du erhältst diese Mail, weil du ein ListSync-Konto hast.</p>
    </div>
  </body></html>`
}
