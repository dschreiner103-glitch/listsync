// Variiert Titel & Beschreibung beim Reupload – IMMER aus dem Original abgeleitet,
// gesteuert durch den Reupload-Zähler (seed). So sieht jede Runde für Vinted anders aus,
// ohne dass sich Müll aufschaukelt (nie aus dem zuletzt mutierten Text ableiten!).

const TITLE_EMOJIS = ['✨', '🔥', '⭐', '💫', '🌟', '💎', '🩷', '⚡', '🌈', '🍀', '👑', '💝']

// Entfernt evtl. vorhandene Deko-Emojis am Anfang/Ende (Sicherheitsnetz)
function stripDeco(t) {
  return (t || '')
    .replace(/^\s*[✨🔥⭐💫🌟💎🩷⚡🌈🍀👑💝]+\s*/u, '')
    .replace(/\s*[✨🔥⭐💫🌟💎🩷⚡🌈🍀👑💝]+\s*$/u, '')
    .trim()
}

export function varyTitle(base, seed) {
  const t = stripDeco(base)
  if (!t) return t
  const emoji = TITLE_EMOJIS[seed % TITLE_EMOJIS.length]
  // gerade: Emoji hinten, ungerade: vorne – zusätzliche Variation
  const out = seed % 2 === 0 ? `${t} ${emoji}` : `${emoji} ${t}`
  return out.slice(0, 200)
}

const CLOSERS = [
  'Bei Fragen einfach melden!',
  'Versand am selben Tag möglich.',
  'Schau gerne auch meine anderen Artikel an!',
  'Preis ist verhandelbar.',
  'Tierfreier Nichtraucherhaushalt.',
  'Schneller & gut verpackter Versand.',
  'Zahlung sicher über die Plattform.',
  'Jede Woche neue Artikel im Profil!',
  'Bündel-Rabatt bei mehreren Artikeln.',
  'Sofort versandbereit.',
]

export function varyDescription(base, seed) {
  const clean = stripDeco(base).trim()
  const closer = CLOSERS[seed % CLOSERS.length]
  const sep = seed % 2 === 0 ? '\n\n' : '\n'
  const out = clean ? `${clean}${sep}${closer}` : closer
  return out.slice(0, 4000)
}
