import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const maxDuration = 60   // IDM-VTON kann etwas dauern (Warteschlange möglich)
export const runtime = 'nodejs'

// ── Metadaten (EXIF / Text-Chunks) aus dem generierten Bild entfernen ──────────
function stripMetadata(buf, fallbackMime = 'image/png') {
  try {
    if (buf[0] === 0xFF && buf[1] === 0xD8) {  // JPEG
      const out = [Buffer.from([0xFF, 0xD8])]
      let i = 2
      while (i < buf.length) {
        if (buf[i] !== 0xFF) { out.push(buf.slice(i)); break }
        const marker = buf[i + 1]
        if (marker === 0xDA) { out.push(buf.slice(i)); break }
        const len = buf.readUInt16BE(i + 2)
        const segEnd = i + 2 + len
        const isMeta = (marker >= 0xE0 && marker <= 0xEF) || marker === 0xFE
        if (!isMeta) out.push(buf.slice(i, segEnd))
        i = segEnd
      }
      return { buffer: Buffer.concat(out), mime: 'image/jpeg' }
    }
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {  // PNG
      const keep = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND'])
      const out = [buf.slice(0, 8)]
      let i = 8
      while (i + 8 <= buf.length) {
        const len = buf.readUInt32BE(i)
        const type = buf.toString('ascii', i + 4, i + 8)
        const end = i + 12 + len
        if (keep.has(type)) out.push(buf.slice(i, end))
        if (type === 'IEND') break
        i = end
      }
      return { buffer: Buffer.concat(out), mime: 'image/png' }
    }
  } catch { /* fällt unten auf Original zurück */ }
  return { buffer: buf, mime: fallbackMime }
}

function dataUrlToBlob(d) {
  if (typeof d !== 'string') return null
  const m = /^data:(.*?);base64,(.*)$/s.exec(d)
  const mime = m ? (m[1] || 'image/jpeg') : 'image/jpeg'
  const b64 = m ? m[2] : d
  return new Blob([Buffer.from(b64, 'base64')], { type: mime })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { piece, model, desc } = await req.json()
  const garmentBlob = dataUrlToBlob(piece)
  const humanBlob   = dataUrlToBlob(model)
  if (!garmentBlob || !humanBlob) {
    return NextResponse.json({ error: 'Bitte beide Bilder hochladen (Kleidungsstück + Modell).' }, { status: 400 })
  }

  const hfToken = process.env.HF_TOKEN
  if (!hfToken || !hfToken.startsWith('hf_') || hfToken.includes('DEIN_TOKEN')) {
    return NextResponse.json({
      error: 'Kein gültiger Hugging-Face-Token hinterlegt. Lege einen gratis Account an (huggingface.co), erstelle ein Token (beginnt mit hf_) und trage es als HF_TOKEN ein.',
    }, { status: 400 })
  }

  const space = process.env.HF_TRYON_SPACE || 'yisol/IDM-VTON'

  try {
    const { Client } = await import('@gradio/client')
    const client = await Client.connect(space, { hf_token: hfToken })

    // IDM-VTON /tryon: [ humanImageEditor, garmentImg, garmentDesc, autoMask, autoCrop, denoiseSteps, seed ]
    const result = await client.predict('/tryon', [
      { background: humanBlob, layers: [], composite: null },
      garmentBlob,
      desc || 'a clothing item',
      true,   // Auto-Maskierung
      false,  // Auto-Crop
      30,     // Denoise-Steps
      42,     // Seed
    ])

    const out = Array.isArray(result?.data) ? result.data[0] : null
    let url = null
    if (out?.url) url = out.url
    else if (typeof out === 'string') url = out
    else if (out?.path) url = `https://${space.replace('/', '-')}.hf.space/file=${out.path}`

    if (!url) {
      return NextResponse.json({ error: 'Anprobe-Modell hat kein Bild zurückgegeben.' }, { status: 502 })
    }

    const headers = url.includes('hf.space') ? { Authorization: `Bearer ${hfToken}` } : {}
    const imgRes = await fetch(url, { headers })
    if (!imgRes.ok) return NextResponse.json({ error: 'Ergebnisbild konnte nicht geladen werden.' }, { status: 502 })

    const rawBuf = Buffer.from(await imgRes.arrayBuffer())
    const { buffer, mime } = stripMetadata(rawBuf, 'image/png')
    return NextResponse.json({ image: `data:${mime};base64,${buffer.toString('base64')}` })
  } catch (e) {
    const msg = String(e?.message || e)
    if (/quota|gpu|exceeded/i.test(msg)) {
      return NextResponse.json({ error: 'Gratis-GPU-Kontingent erschöpft oder Modell überlastet. Bitte später erneut versuchen.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Anprobe fehlgeschlagen: ' + msg.slice(0, 160) }, { status: 500 })
  }
}
