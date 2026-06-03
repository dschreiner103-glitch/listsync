import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const maxDuration = 60   // Gemini-Bildgenerierung braucht etwas länger
export const runtime = 'nodejs'

// ── Metadaten (EXIF / Text-Chunks) aus dem generierten Bild entfernen ──────────
function stripMetadata(buf, fallbackMime = 'image/png') {
  try {
    // JPEG: alle APPn-Segmente (EXIF/XMP/ICC) + Kommentare entfernen
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
      const out = [Buffer.from([0xFF, 0xD8])]
      let i = 2
      while (i < buf.length) {
        if (buf[i] !== 0xFF) { out.push(buf.slice(i)); break }
        const marker = buf[i + 1]
        if (marker === 0xDA) { out.push(buf.slice(i)); break }   // SOS → Bilddaten, Rest kopieren
        const len = buf.readUInt16BE(i + 2)
        const segEnd = i + 2 + len
        const isMeta = (marker >= 0xE0 && marker <= 0xEF) || marker === 0xFE  // APPn oder COM
        if (!isMeta) out.push(buf.slice(i, segEnd))
        i = segEnd
      }
      return { buffer: Buffer.concat(out), mime: 'image/jpeg' }
    }
    // PNG: nur essentielle Chunks behalten, alle Metadaten-Chunks (tEXt, eXIf, tIME …) raus
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
  } catch { /* fällt unten auf Original zurück */ }
  return { buffer: buf, mime: fallbackMime }
}

function parseImg(d) {
  if (typeof d !== 'string') return null
  const m = /^data:(.*?);base64,(.*)$/s.exec(d)
  if (m) return { mime: m[1] || 'image/jpeg', data: m[2] }
  return { mime: 'image/jpeg', data: d }
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { piece, model } = await req.json()
  const p = parseImg(piece)
  const m = parseImg(model)
  if (!p || !m) return NextResponse.json({ error: 'Bitte beide Bilder hochladen (Kleidungsstück + Modell).' }, { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY nicht konfiguriert' }, { status: 500 })

  const prompt = `You are a professional fashion photo editor performing a virtual try-on.
Image 1 = a clothing item (the garment). Image 2 = a photo of a person (the model).

Produce ONE single photorealistic image in which the EXACT SAME person from Image 2 is now wearing the garment from Image 1.

STRICT RULES:
- Keep the model's face, hairstyle, skin tone, body shape, pose and the entire background EXACTLY identical to Image 2. Do not change the person or the scene.
- Only change the clothing: dress the model in the garment from Image 1, matching its exact color, pattern, print, texture, length and shape.
- Realistic fit with natural folds, correct lighting and shadows consistent with Image 2.
- No text, no watermark, no logo, no border. Output only the final edited photograph.`

  // Verfügbare Bildmodelle (per ListModels bestätigt), nach Präferenz
  const models = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image']
  let inline = null
  let lastErr = ''
  let quotaHit = false

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: p.mime, data: p.data } },
                { inline_data: { mime_type: m.mime, data: m.data } },
              ],
            }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'], temperature: 0.4 },
          }),
        }
      )
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        lastErr = j?.error?.message || `HTTP ${res.status}`
        if (res.status === 429 || /quota/i.test(lastErr)) quotaHit = true
        continue
      }
      const parts = j?.candidates?.[0]?.content?.parts || []
      const imgPart = parts.find(pt => (pt.inlineData?.data) || (pt.inline_data?.data))
      if (imgPart) { inline = imgPart.inlineData || imgPart.inline_data; break }
      lastErr = 'KI hat kein Bild zurückgegeben (evtl. wurde der Inhalt blockiert).'
    } catch (e) {
      lastErr = e.message || 'Netzwerkfehler'
    }
  }

  if (!inline?.data) {
    if (quotaHit) {
      return NextResponse.json({
        error: 'Gemini-Bildgenerierung ist nicht freigeschaltet (Kontingent erschöpft). Der GEMINI_API_KEY benötigt aktiviertes Billing in Google AI Studio — die Bild-Modelle sind nicht im kostenlosen Kontingent enthalten.',
      }, { status: 402 })
    }
    return NextResponse.json({ error: 'Bildgenerierung fehlgeschlagen: ' + lastErr }, { status: 500 })
  }

  const rawBuf = Buffer.from(inline.data, 'base64')
  const { buffer, mime } = stripMetadata(rawBuf, inline.mimeType || inline.mime_type || 'image/png')
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`

  return NextResponse.json({ image: dataUrl })
}
