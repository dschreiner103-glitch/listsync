import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bulletPoints, category, brand, condition, price, size, color, material } = await req.json()

  if (!bulletPoints?.trim()) {
    return NextResponse.json({ error: 'Stichpunkte fehlen' }, { status: 400 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY nicht konfiguriert' }, { status: 500 })

  const context = [
    category  && `Kategorie: ${category}`,
    brand     && `Marke: ${brand}`,
    condition && `Zustand: ${condition}`,
    size      && `Größe: ${size}`,
    color     && `Farbe: ${color}`,
    material  && `Material: ${material}`,
    price     && `Preis: ${price}€`,
  ].filter(Boolean).join('\n')

  const cat = (category || '').toLowerCase()
  const br  = (brand || '').toLowerCase()
  const isHerren = cat.includes('herren')
  const isDamen  = cat.includes('damen')
  const isSchuhe = cat.includes('schuh') || cat.includes('sneaker')
  const isJacke  = cat.includes('jacke') || cat.includes('mantel')

  // Kontext-Hashtags ohne #-Zeichen (werden als Array übergeben)
  const contextTags = [
    isHerren ? 'herrenmode herrenstyle menswear mensfashion männermode herren herrenvintage' : '',
    isDamen  ? 'damenmode damenstyle womenswear womenstyle girloutfit damen damenvintage' : '',
    isSchuhe ? 'sneakerhead sneakers kicks trainers schuhe sneakerstyle footwear' : '',
    isJacke  ? 'jacket outerwear coat winterjacke jacke jackenoutfit' : '',
    br       ? `${br} ${br}style ${br}vintage ${br}outfit ${br}fashion ${br}secondhand ${br}brand` : '',
  ].filter(Boolean).join(' ')

  const prompt = `Du bist Reselling-Experte. Antworte NUR als valides JSON ohne Markdown.

${context ? `Artikel:\n${context}\n` : ''}Stichpunkte: ${bulletPoints}

JSON mit diesen 4 Feldern:

{
  "title": "SEO-Titel 70-80 Zeichen, so viele Suchbegriffe wie möglich für maximale Auffindbarkeit: [Marke] [Artikelname] [Farbe] [Größe] [Material] [Stil/Zustand]. Nutze die 80 Zeichen möglichst aus, aber NIEMALS über 80 Zeichen und kein Wort abschneiden.",
  "intro": "2-3 konkrete ehrliche Sätze über diesen spezifischen Artikel: Zustand, Besonderheiten, Tragezustand. Kein Marketing-Blabla.",
  "hashtags": ["mindestens70", "eintraege", "nurDasWort", "ohne#"],
  "keywords": ["15", "suchbegriffe", "ohne#"]
}

FÜR hashtags-Array — PFLICHT: mindestens 70 Einträge, nur das Wort ohne #:
Artikel-spezifisch (min. 6): Marke, Typ, Farbe, Größe, Material
Brand-Variationen (min. 5): z.B. NikeHoodie NikeStyle NikeVintage NikeFleece NikeOutfit
Stil & Ära (alle verwenden): vintage vintagestyle y2k y2kvintage y2kfashion 90s 90svintage 90sstyle 2000s 00s retro archive pashastyle oldmoney preppy streetwear streetstyle urbanstyle hiphop
Fit & Schnitt: oversized regularfit baggy relaxedfit casualchic casual basicstyle minimal cleanstyle zeitlos klassisch modern
Material & Qualität: premium highquality luxus luxuryvibes cozy soft baumwolle cotton fleece wool warm
Saison: winterstyle herbstoutfit winteroutfit frühlingsstyle layering kuscheligwarm coldweatherfit
Plattform & Nachhaltigkeit: secondhand thrifted thrifting vintedde nachhaltig slowfashion upcycling preowned reselling
Fashion allgemein: fashion outfit ootd style musthave rare trend aesthetic inspo look wiwt fashionstyle
Community: findoftheday bestdeal günstig topzustand angebot
${contextTags ? `Kontext (ALLE verwenden): ${contextTags}` : ''}`

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
        temperature: 0.75,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: 'KI-Fehler: ' + (err?.error?.message || res.status) }, { status: 500 })
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || ''

    let cleaned = text.trim()
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) cleaned = fenceMatch[1].trim()
    const braceMatch = cleaned.match(/\{[\s\S]*\}/)
    if (braceMatch) cleaned = braceMatch[0]

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'KI hat ungültiges Format zurückgegeben' }, { status: 500 })
    }

    const intro    = (parsed.intro    || '').trim()
    const hashArr  = Array.isArray(parsed.hashtags) ? parsed.hashtags : []
    const hashStr  = hashArr.map(h => `#${h.replace(/^#/, '')}`).join(' ')
    const itemName = [brand, parsed.title?.split(' ').slice(1, 3).join(' ')].filter(Boolean).join(' ') || 'Artikel'

    // Beschreibung server-seitig aus festem Template + AI-Intro + AI-Hashtags zusammenbauen
    const description = [
      '✨ Hiermit würde ich dir gerne folgenden Artikel vorstellen: ✨',
      '',
      intro,
      '',
      `📌 Name: ${itemName}`,
      `✏️ Größe: ${size || '–'}`,
      '📦 Versand: Innerhalb 24h',
      '💬 Bei Fragen gerne schreiben',
      '🔄 Schneller Versand & faire Preise',
      '',
      'Zum Artikel :',
      '',
      `Size : ${size || '–'}`,
      `Maße: – cm Breit – cm Lang`,
      `Zustand: ${condition || '–'}`,
      '',
      '🍍Verfügbar',
      '',
      'Versende Innerhalb 24h📦',
      '❕Am Liebsten Hermes ❕',
      'Jedoch Sind Alle Versandoptionen Offen',
      '',
      'Ich nehme alle gängigen Zahlungsarten an ✅',
      '',
      '',
      'Per Fragen Gerne Melden🙋🏽',
      '',
      '',
      'Bei Fragen oder ernsthaftem Interesse gerne anschreiben 🤙',
      '',
      hashStr,
    ].join('\n')

    // Wortsicher auf 80 Zeichen kürzen (kein abgehacktes Wort)
    const clamp80 = (s) => {
      s = (s || '').trim()
      if (s.length <= 80) return s
      let cut = s.slice(0, 80)
      if (s[80] !== ' ') {
        const i = cut.lastIndexOf(' ')
        if (i > 40) cut = cut.slice(0, i)
      }
      return cut.trim()
    }

    return NextResponse.json({
      title:        clamp80(parsed.title || ''),
      description,
      keywords:     Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 15) : [],
      hashtagCount: hashArr.length,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Netzwerkfehler zur KI' }, { status: 500 })
  }
}
