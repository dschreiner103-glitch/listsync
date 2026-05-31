import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bulletPoints, category, brand, condition, price, size, color } = await req.json()

  if (!bulletPoints?.trim()) {
    return NextResponse.json({ error: 'Stichpunkte fehlen' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY nicht konfiguriert' }, { status: 500 })

  const context = [
    category && `Kategorie: ${category}`,
    brand && `Marke: ${brand}`,
    condition && `Zustand: ${condition}`,
    size && `Größe: ${size}`,
    color && `Farbe: ${color}`,
    price && `Preis: ${price}€`,
  ].filter(Boolean).join('\n')

  const prompt = `Du bist ein Experte für Reselling auf deutschen Plattformen (Vinted, Kleinanzeigen, eBay).

Erstelle auf Basis der folgenden Stichpunkte einen SEO-optimierten Titel, eine Beschreibung im exakten Stil des Verkäufers und passende Keywords.

${context ? `Artikel-Details:\n${context}\n` : ''}
Stichpunkte des Verkäufers:
${bulletPoints}

TITEL-REGELN:
- Maximal 70 Zeichen
- Format: [Marke] [Artikelname] [Farbe/Stil] [Größe] — wichtigste Keywords vorne
- Klar, konkret, keine Füllwörter

BESCHREIBUNGS-REGELN:
Schreibe die Beschreibung exakt in diesem Format und Stil:

Zum Artikel :

Size : [Größe falls bekannt, sonst leer lassen]
Maße: [Breit] cm Breit [Lang] cm Lang
Zustand: [Zustand]

🍍Verfügbar

Versende Innerhalb 24h📦
❕Am Liebsten Hermes ❕
Jedoch Sind Alle Versandoptionen Offen

Ich nehme alle gängigen Zahlungsarten an ✅


Per Fragen Gerne Melden🙋🏽


[20-35 passende Hashtags basierend auf dem Artikel — mix aus spezifischen (Marke, Stil, Artikel) und allgemeinen (vintage, streetwear, y2k etc.) Tags, auf Deutsch und Englisch, mit # davor, durch Leerzeichen getrennt]

Hiermit würde ich dir gerne folgenden Artikel vorstellen:

Ein hochwertiges Piece in [Zustand]. [1-2 Sätze über den Artikel: Material, Besonderheiten, Tragezustand — konkret und ehrlich, keine leeren Floskeln].

Name: [Artikelname]
Größe: [Größe]
Versand: Innerhalb 24h

Bei Fragen gerne schreiben

Schneller Versand & faire Preise | Bei ernsthaftem Interesse gerne anschreiben

[weitere 15-25 spezifische Hashtags zum Artikel]

KEYWORD-REGELN:
- 10-15 kurze deutsche und englische Suchbegriffe die Käufer auf Vinted/eBay/Kleinanzeigen wirklich eintippen
- Mix aus Marke, Artikeltyp, Stil, Größe
- Keine #-Zeichen bei den Keywords

Antworte NUR als valides JSON in exakt diesem Format (kein Markdown, keine Erklärung):
{
  "title": "...",
  "description": "...",
  "keywords": ["...", "..."]
}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Gemini error:', err)
      return NextResponse.json({ error: 'KI-Fehler: ' + (err?.error?.message || res.status) }, { status: 500 })
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('JSON parse failed:', cleaned)
      return NextResponse.json({ error: 'KI hat ungültiges Format zurückgegeben' }, { status: 500 })
    }

    return NextResponse.json({
      title: parsed.title || '',
      description: parsed.description || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    })
  } catch (e) {
    console.error('AI generate error:', e)
    return NextResponse.json({ error: 'Netzwerkfehler zur KI' }, { status: 500 })
  }
}
