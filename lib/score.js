// ── AI Listings Score ──────────────────────────────────────────────────
// Berechnet einen 0-100 Score für ein Listing basierend auf Qualitätskriterien

export function calcScore(listing) {
  const checks = []

  // ── Titel (25 Punkte) ──────────────────────────────────────────────
  const titleLen = (listing.title || '').length
  if (titleLen >= 30) checks.push({ key:'title_long',    pts:10, label:'Titel hat gute Länge', ok:true })
  else                checks.push({ key:'title_long',    pts:10, label:`Titel zu kurz (${titleLen}/30 Zeichen)`, ok:false, tip:'Füge Marke, Farbe und Größe hinzu' })

  const hasKeywords = ['nike','adidas','zara','h&m','vintage','neu','gebraucht','gr.','größe','cm','oversized','slim'].some(k => listing.title?.toLowerCase().includes(k))
  if (hasKeywords)    checks.push({ key:'title_kw',      pts:8,  label:'Titel enthält relevante Keywords', ok:true })
  else                checks.push({ key:'title_kw',      pts:8,  label:'Keine Keywords im Titel', ok:false, tip:'Füge Marke, Stil oder Maße in den Titel ein' })

  const titleClean = !/[!]{2,}|[A-Z]{5,}/.test(listing.title || '')
  if (titleClean)     checks.push({ key:'title_clean',   pts:7,  label:'Titel ist sauber formatiert', ok:true })
  else                checks.push({ key:'title_clean',   pts:7,  label:'Titel hat Großbuchstaben oder !!', ok:false, tip:'Vermeide GROSSBUCHSTABEN und !!!-Spam' })

  // ── Bilder (25 Punkte) ─────────────────────────────────────────────
  const imgCount = (listing.images || []).length
  if (imgCount >= 5)  checks.push({ key:'imgs_many',     pts:15, label:`${imgCount} Bilder – super`, ok:true })
  else if (imgCount >= 3) checks.push({ key:'imgs_many', pts:10, label:`${imgCount} Bilder (empfohlen: 5+)`, ok:false, tip:'Mehr Bilder = mehr Vertrauen. Füge Detail- und Maßfotos hinzu' })
  else if (imgCount >= 1) checks.push({ key:'imgs_many', pts:5,  label:`Nur ${imgCount} Bild – zu wenig`, ok:false, tip:'Mindestens 3-5 Bilder hochladen' })
  else                checks.push({ key:'imgs_many',     pts:0,  label:'Keine Bilder', ok:false, tip:'Fotos sind Pflicht – Artikel ohne Bilder verkaufen sich kaum' })

  if (imgCount >= 1)  checks.push({ key:'imgs_exist',    pts:10, label:'Bilder vorhanden', ok:true })
  else                checks.push({ key:'imgs_exist',    pts:10, label:'Keine Bilder hochgeladen', ok:false, tip:'Lade mindestens 1 Foto hoch' })

  // ── Beschreibung (20 Punkte) ───────────────────────────────────────
  const descLen = (listing.description || '').length
  if (descLen >= 150) checks.push({ key:'desc_long',     pts:12, label:'Ausführliche Beschreibung', ok:true })
  else if (descLen >= 60) checks.push({ key:'desc_long', pts:7,  label:'Beschreibung könnte länger sein', ok:false, tip:'Beschreibe Zustand, Maße und Besonderheiten genauer' })
  else                checks.push({ key:'desc_long',     pts:0,  label:'Beschreibung fehlt oder zu kurz', ok:false, tip:'Nutze den KI-Assistenten für eine SEO-optimierte Beschreibung' })

  const hasHashtags = /#\w/.test(listing.description || '')
  if (hasHashtags)    checks.push({ key:'desc_tags',     pts:8,  label:'Hashtags in der Beschreibung', ok:true })
  else                checks.push({ key:'desc_tags',     pts:8,  label:'Keine Hashtags in der Beschreibung', ok:false, tip:'Füge relevante Hashtags hinzu für bessere Sichtbarkeit' })

  // ── Artikel-Details (20 Punkte) ────────────────────────────────────
  if (listing.brand)    checks.push({ key:'brand',       pts:5,  label:`Marke: ${listing.brand}`, ok:true })
  else                  checks.push({ key:'brand',       pts:5,  label:'Keine Marke angegeben', ok:false, tip:'Marke angeben erhöht die Auffindbarkeit' })

  if (listing.size)     checks.push({ key:'size',        pts:5,  label:`Größe: ${listing.size}`, ok:true })
  else                  checks.push({ key:'size',        pts:5,  label:'Keine Größe angegeben', ok:false, tip:'Größe ist wichtig für Käufer' })

  if (listing.condition) checks.push({ key:'condition',  pts:5,  label:`Zustand: ${listing.condition}`, ok:true })
  else                  checks.push({ key:'condition',   pts:5,  label:'Kein Zustand angegeben', ok:false })

  if (listing.color)    checks.push({ key:'color',       pts:5,  label:`Farbe: ${listing.color}`, ok:true })
  else                  checks.push({ key:'color',       pts:5,  label:'Keine Farbe angegeben', ok:false, tip:'Farbe hilft Käufern beim Suchen und Filtern' })

  // ── Plattformen (10 Punkte) ────────────────────────────────────────
  const pltCount = (listing.platforms || []).length
  if (pltCount >= 3)  checks.push({ key:'platforms',     pts:10, label:`Auf ${pltCount} Plattformen`, ok:true })
  else if (pltCount >= 2) checks.push({ key:'platforms', pts:6,  label:`Nur ${pltCount} Plattformen`, ok:false, tip:'Crossposte auf alle 3 Plattformen für mehr Reichweite' })
  else                checks.push({ key:'platforms',     pts:2,  label:'Nur 1 Plattform', ok:false, tip:'Mehr Plattformen = mehr potenzielle Käufer' })

  const total = checks.reduce((s, c) => s + (c.ok ? c.pts : 0), 0)
  const max   = checks.reduce((s, c) => s + c.pts, 0)
  const score = Math.round((total / max) * 100)

  const improvements = checks.filter(c => !c.ok && c.tip).slice(0, 3)

  return { score, checks, improvements }
}

export function scoreColor(score) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

export function scoreLabel(score) {
  if (score >= 80) return 'Top'
  if (score >= 60) return 'Gut'
  if (score >= 40) return 'Ok'
  return 'Schwach'
}
