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

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY nicht konfiguriert' }, { status: 500 })

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
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Groq error:', err)
      return NextResponse.json({ error: 'KI-Fehler: ' + (err?.error?.message || res.status) }, { status: 500 })
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || ''
    console.log('GROQ RAW:', text)

    // Extract JSON from response — strip markdown fences or surrounding text
    let cleaned = text.trim()
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) cleaned = fenceMatch[1].trim()
    const braceMatch = cleaned.match(/\{[\s\S]*\}/)
    if (braceMatch) cleaned = braceMatch[0]

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('JSON parse failed, raw text:', text)
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
