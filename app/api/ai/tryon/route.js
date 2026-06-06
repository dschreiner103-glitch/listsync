import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const maxDuration = 30
export const runtime = 'nodejs'

function stripMetadata(buf, fallbackMime = 'image/png') {
  try {
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
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
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
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
  } catch {}
  return { buffer: buf, mime: fallbackMime }
}

function dataUrlToBlob(d) {
  if (typeof d !== 'string') return null
  const m = /^data:(.*?);base64,(.*)$/s.exec(d)
  const mime = m ? (m[1] || 'image/jpeg') : 'image/jpeg'
  const b64 = m ? m[2] : d
  return new Blob([Buffer.from(b64, 'base64')], { type: mime })
}

// ── GET — Replicate Prediction Status pollen ─────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Keine ID' }, { status: 400 })

  const replicateToken = process.env.REPLICATE_API_TOKEN
  if (!replicateToken) return NextResponse.json({ error: 'Kein Replicate Token' }, { status: 400 })

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${replicateToken}` },
    })
    const pred = await res.json()

    if (pred.status === 'succeeded') {
      const outputUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output
      if (!outputUrl) return NextResponse.json({ status: 'failed', error: 'Kein Ergebnis-Bild' })
      const imgRes = await fetch(outputUrl)
      if (!imgRes.ok) return NextResponse.json({ status: 'failed', error: 'Bild konnte nicht geladen werden' })
      const rawBuf = Buffer.from(await imgRes.arrayBuffer())
      const { buffer, mime } = stripMetadata(rawBuf, 'image/webp')
      return NextResponse.json({ status: 'succeeded', image: `data:${mime};base64,${buffer.toString('base64')}` })
    }

    if (pred.status === 'failed' || pred.status === 'canceled') {
      return NextResponse.json({ status: 'failed', error: pred.error || 'Generierung fehlgeschlagen' })
    }

    return NextResponse.json({ status: pred.status }) // 'starting' | 'processing'
  } catch (e) {
    return NextResponse.json({ status: 'failed', error: String(e?.message || e).slice(0, 120) })
  }
}

// ── POST — Neue Prediction starten ───────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { piece, model, type } = await req.json()
  if (!piece || !model) {
    return NextResponse.json({ error: 'Bitte beide Bilder hochladen (Kleidungsstück + Modell).' }, { status: 400 })
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN

  // ── Replicate IDM-VTON (realistisch, async) ─────────────────────────────────
  if (replicateToken) {
    const category = type === 'lower' ? 'lower_body' : type === 'overall' ? 'dresses' : 'upper_body'
    const garmentDesc = type === 'lower' ? 'pants / jeans' : type === 'overall' ? 'dress / jacket' : 'top / shirt'

    try {
      const predRes = await fetch('https://api.replicate.com/v1/models/cuuupid/idm-vton/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${replicateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            human_img: model,
            garm_img: piece,
            garment_des: garmentDesc,
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42,
            category,
          },
        }),
      })

      if (!predRes.ok) {
        const err = await predRes.json().catch(() => ({}))
        return NextResponse.json({ error: 'Replicate Fehler: ' + (err?.detail || predRes.status) }, { status: 500 })
      }

      const pred = await predRes.json()
      if (!pred.id) return NextResponse.json({ error: 'Keine Prediction-ID erhalten' }, { status: 500 })
      return NextResponse.json({ id: pred.id, status: pred.status, provider: 'replicate' })
    } catch (e) {
      return NextResponse.json({ error: 'Replicate nicht erreichbar: ' + String(e?.message || e).slice(0, 120) }, { status: 500 })
    }
  }

  // ── Fallback: CatVTON via HuggingFace (gratis, langsamer) ───────────────────
  const hfToken = process.env.HF_TOKEN
  if (!hfToken || !hfToken.startsWith('hf_') || hfToken.includes('DEIN_TOKEN')) {
    return NextResponse.json({
      error: 'Kein API-Key konfiguriert. Trage REPLICATE_API_TOKEN (replicate.com) oder HF_TOKEN (huggingface.co) in .env ein.',
    }, { status: 400 })
  }

  const garmentBlob = dataUrlToBlob(piece)
  const humanBlob   = dataUrlToBlob(model)
  if (!garmentBlob || !humanBlob) {
    return NextResponse.json({ error: 'Bild konnte nicht verarbeitet werden.' }, { status: 400 })
  }

  const clothType = ['upper', 'lower', 'overall'].includes(type) ? type : 'upper'
  const space = process.env.HF_TRYON_SPACE || 'zhengchong/CatVTON'

  try {
    const { Client } = await import('@gradio/client')
    const client = await Client.connect(space, { hf_token: hfToken })

    const result = await client.predict('/submit_function', [
      { background: humanBlob, layers: [], composite: null },
      garmentBlob,
      clothType,
      40,
      2.5,
      42,
      'result only',
    ])

    const out = Array.isArray(result?.data) ? result.data[0] : null
    let url = null
    if (out?.url) url = out.url
    else if (typeof out === 'string') url = out
    else if (out?.path) url = `https://${space.replace('/', '-')}.hf.space/file=${out.path}`

    if (!url) return NextResponse.json({ error: 'Anprobe-Modell hat kein Bild zurückgegeben.' }, { status: 502 })

    const headers = url.includes('hf.space') ? { Authorization: `Bearer ${hfToken}` } : {}
    const imgRes = await fetch(url, { headers })
    if (!imgRes.ok) return NextResponse.json({ error: 'Ergebnisbild konnte nicht geladen werden.' }, { status: 502 })

    const rawBuf = Buffer.from(await imgRes.arrayBuffer())
    const { buffer, mime } = stripMetadata(rawBuf, 'image/png')
    return NextResponse.json({ image: `data:${mime};base64,${buffer.toString('base64')}`, provider: 'hf' })
  } catch (e) {
    const msg = String(e?.message || e)
    if (/quota|gpu|exceeded/i.test(msg)) {
      return NextResponse.json({ error: 'Gratis-GPU-Kontingent erschöpft. Bitte später erneut versuchen.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Anprobe fehlgeschlagen: ' + msg.slice(0, 160) }, { status: 500 })
  }
}
