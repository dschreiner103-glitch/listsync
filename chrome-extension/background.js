const BASE_URL = 'https://project-dle5b.vercel.app'

// ── Tab-Tracking für Hintergrund-Modus ───────────────────────────────────────
// tabId → { platform, listingId, listingTitle, isDraft, url }
const trackedTabs = new Map()

// Benachrichtigung anzeigen
async function showNotification(id, opts) {
  return chrome.notifications.create(id, {
    type:    'basic',
    iconUrl: 'icons/icon48.png',
    ...opts,
  })
}

// Hintergrund-Modus aktiv?
async function isBackgroundMode() {
  return new Promise(r => chrome.storage.local.get('backgroundMode', d => r(!!d.backgroundMode)))
}

// ── Notification-Klick: "Jetzt ansehen" → öffnet Listing ─────────────────────
chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (btnIdx === 0) {
    // Öffne ListSync-Listings-Seite
    const url = `${BASE_URL}/listings`
    chrome.tabs.create({ url, active: true })
  }
  chrome.notifications.clear(notifId)
})
chrome.notifications.onClicked.addListener(notifId => {
  chrome.notifications.clear(notifId)
})

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PING') {
    sendResponse({ ok: true })
    return true
  }
  if (msg.type === 'POST_LISTING') {
    handlePost(msg.listing, msg.platforms)
      .then(() => sendResponse({ ok: true }))
      .catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
  if (msg.type === 'VINTED_SYNC_DATA') {
    importVintedHistory(msg.data, sender.tab?.id)
      .then(result => sendResponse({ ok: true, result }))
      .catch(e => sendResponse({ ok: false, error: e.message }))
    return true // async response
  }
  if (msg.type === 'VINTED_STATS_DATA') {
    syncStatsToListSync(msg.stats, sender.tab?.id)
      .then(result => sendResponse({ ok: true, result }))
      .catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
  if (msg.type === 'IMPORT_VINTED_LISTING') {
    importVintedListing(msg.listing)
      .then(result => sendResponse({ ok: true, result }))
      .catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
  if (msg.type === 'PROGRESS') {
    // Content Script sendet Fortschritt: { platform, percent, step }
    const tabId = sender.tab?.id
    chrome.storage.local.get('crosspostProgress', r => {
      const prog = r.crosspostProgress || {}
      prog[msg.platform] = { percent: msg.percent, step: msg.step, tabId, ts: Date.now() }
      chrome.storage.local.set({ crosspostProgress: prog })
      // Auch an ListSync-App weiterleiten → zeigt Banner in der App
      forwardToListSyncBridge({ type: 'CROSSPOST_PROGRESS', progress: prog })
    })
    sendResponse({ ok: true })
    return true
  }
  if (msg.type === 'LISTING_POSTED') {
    const tabId = sender.tab?.id
    const info  = tabId ? trackedTabs.get(tabId) : null
    const plt   = PLT_NAMES[msg.platform] || msg.platform || 'Plattform'
    const isDraft = info?.isDraft || false
    const title   = info?.listingTitle || 'Listing'

    // Fortschritt auf 100% setzen
    chrome.storage.local.get('crosspostProgress', r => {
      const prog = r.crosspostProgress || {}
      prog[msg.platform] = { percent: 100, step: isDraft ? 'Entwurf gespeichert ✅' : 'Fertig ✅', tabId, done: true, ts: Date.now() }
      chrome.storage.local.set({ crosspostProgress: prog })
      // Nach 8s aus dem Progress entfernen
      setTimeout(() => {
        chrome.storage.local.get('crosspostProgress', r2 => {
          const p = r2.crosspostProgress || {}
          delete p[msg.platform]
          chrome.storage.local.set({ crosspostProgress: p })
          forwardToListSyncBridge({ type: 'CROSSPOST_PROGRESS', progress: p })
        })
      }, 8000)
    })

    // Benachrichtigung
    isBackgroundMode().then(bgMode => {
      const notifId = `posted-${tabId}-${Date.now()}`
      showNotification(notifId, {
        title:   isDraft ? `📝 Entwurf gespeichert – ${plt}` : `✅ Hochgeladen – ${plt}`,
        message: isDraft ? `"${title}" wurde als Entwurf gespeichert.` : `"${title}" wurde erfolgreich veröffentlicht.`,
        buttons: [{ title: 'Jetzt ansehen →' }],
      })
      // Im Hintergrund-Modus Tab automatisch schließen
      if (bgMode && tabId) {
        setTimeout(async () => {
          try { await chrome.tabs.remove(tabId) } catch {}
          trackedTabs.delete(tabId)
        }, 1500)
      }
    })

    forwardToListSyncBridge(msg).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }))
    return true
  }

  if (msg.type === 'LISTING_ERROR') {
    const tabId = sender.tab?.id
    const info  = tabId ? trackedTabs.get(tabId) : null
    const plt   = PLT_NAMES[msg.platform] || msg.platform || 'Plattform'
    const title = info?.listingTitle || 'Listing'
    const notifId = `error-${tabId}-${Date.now()}`
    showNotification(notifId, {
      title:   `❌ Fehler – ${plt}`,
      message: `"${title}": ${msg.error || 'Unbekannter Fehler'}`,
      buttons: [{ title: 'Tab öffnen →' }],
    })
    // Fortschritt auf Fehler setzen
    chrome.storage.local.get('crosspostProgress', r => {
      const prog = r.crosspostProgress || {}
      prog[msg.platform] = { percent: prog[msg.platform]?.percent || 0, step: '❌ Fehler', error: true, tabId, ts: Date.now() }
      chrome.storage.local.set({ crosspostProgress: prog })
    })
    // Bei Fehler Tab NICHT auto-schließen damit User sieht was passiert ist
    sendResponse({ ok: true })
    return true
  }
  if (msg.type === 'INJECT_MAIN_IMAGES') {
    const tabId = sender.tab?.id
    if (!tabId) { sendResponse({ ok: false, error: 'Kein Tab' }); return true }
    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: injectImages,
      args: [msg.imageData],
    }).then(() => sendResponse({ ok: true }))
      .catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
})

// ── ListSync-Bridge benachrichtigen ──────────────────────────────────────────

async function forwardToListSyncBridge(msg) {
  const tabs = await chrome.tabs.query({ url: [`${BASE_URL}/*`, 'http://localhost:3000/*'] })
  if (!tabs.length) { console.warn('[ListSync BG] Kein ListSync-Tab für LISTING_POSTED'); return }
  for (const tab of tabs) {
    try { await chrome.tabs.sendMessage(tab.id, msg); break } catch(e) {}
  }
}

// ── Image loader ──────────────────────────────────────────────────────────────

async function fetchImageAsBase64(url) {
  try {
    const res  = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const mime = blob.type || 'image/jpeg'

    // HEIC/HEIF werden von Chrome nicht dekodiert
    if (mime.includes('heic') || mime.includes('heif')) {
      console.warn('[ListSync BG] HEIC/HEIF übersprungen:', url)
      return null
    }
    if (blob.size > 15 * 1024 * 1024) {
      console.warn('[ListSync BG] Bild zu groß (>15MB):', url)
      return null
    }
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve({ base64: reader.result, type: mime })
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

// ── Post listing to platforms ─────────────────────────────────────────────────

const PLT_NAMES = { vinted: 'Vinted', kleinanzeigen: 'Kleinanzeigen', ebay: 'eBay' }

// Bereinigt interne Tags aus der Beschreibung vor dem Crossposten
function cleanDescription(desc) {
  return (desc || '')
    .replace(/\n?\[vintedId:\d+\]/g, '')
    .replace(/\n?\[vinted_id:\d+\]/g, '')
    .trim()
}

async function handlePost(listing, platforms) {
  const bgMode = await isBackgroundMode()

  // Im Hintergrund-Modus: aktuellen Tab merken um danach Fokus zurückzusetzen
  if (bgMode) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    _focusTabId    = activeTab?.id    || null
    _focusWindowId = activeTab?.windowId || null
  }

  // Beschreibung von internen Tags bereinigen
  const cleanListing = { ...listing, description: cleanDescription(listing.description) }

  // 1. Listing sofort ohne Bilder speichern – Tab kann sofort öffnen
  await chrome.storage.local.set({ pendingListing: { ...cleanListing, imageData: [] } })

  // 2. Tabs sofort öffnen (parallel, nicht warten)
  const tabPromises = platforms.map(async platform => {
    let tab = null
    if (platform === 'vinted')        tab = await openVintedNewListing(bgMode)
    else if (platform === 'kleinanzeigen') tab = await openKleinanzeigenNewListing(bgMode)
    else if (platform === 'ebay')     tab = await openEbayNewListing(cleanListing, bgMode)
    // Tab tracken für Notification + Auto-Close
    if (tab?.id) {
      trackedTabs.set(tab.id, {
        platform,
        listingId:    cleanListing.id,
        listingTitle: cleanListing.title || 'Listing',
        isDraft:      cleanListing.status === 'entwurf',
      })
      // Timeout: nach 10min ohne LISTING_POSTED → Fehler-Notification
      setTimeout(() => {
        if (trackedTabs.has(tab.id)) {
          trackedTabs.delete(tab.id)
          showNotification(`timeout-${tab.id}`, {
            title:   `⚠️ Timeout – ${PLT_NAMES[platform] || platform}`,
            message: `"${listing.title || 'Listing'}" – kein Status nach 10 Minuten. Bitte Tab prüfen.`,
            buttons: [{ title: 'Tab öffnen →' }],
          })
        }
      }, 10 * 60 * 1000)
    }
  })

  // 3. Bilder parallel laden (während Vinted-Tab lädt, spart ~2-5s)
  const imageData = (await Promise.all(
    (cleanListing.images || []).slice(0, 8).map(url => {
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
      return fetchImageAsBase64(fullUrl)
    })
  )).filter(Boolean)

  // 4. Storage mit Bildern aktualisieren – Content Script liest sie in injectImages() nochmal
  await chrome.storage.local.set({ pendingListing: { ...cleanListing, imageData } })
  console.log('[ListSync BG] Bilder geladen:', imageData.length, '– ID:', cleanListing.id)

  await Promise.all(tabPromises)
}

// Merkt sich den aktuellen Tab vor dem Crosspost
let _focusTabId = null
let _focusWindowId = null

// Öffnet einen Tab — im Hintergrund-Modus unsichtbar im gleichen Fenster
async function openInBackground(url, bgMode) {
  if (!bgMode) {
    return chrome.tabs.create({ url, active: true })
  }
  // Tab inaktiv öffnen + danach sofort Fokus auf ListSync-Tab zurück
  const tab = await chrome.tabs.create({ url, active: false })
  // Fokus sofort zurücksetzen damit der User nichts merkt
  if (_focusTabId && _focusWindowId) {
    try {
      await chrome.tabs.update(_focusTabId, { active: true })
      await chrome.windows.update(_focusWindowId, { focused: true })
    } catch {}
  }
  return tab
}

async function openKleinanzeigenNewListing(bgMode = false) {
  const tab = await openInBackground('https://www.kleinanzeigen.de/p-anzeige-aufgeben.html', bgMode)
  console.log('[ListSync BG] ✓ Kleinanzeigen-Tab geöffnet (bgMode:', bgMode, ')')
  return tab
}

async function openEbayNewListing(listing, bgMode = false) {
  const tab = await openInBackground('https://www.ebay.de/sl/prelist/suggest', bgMode)
  console.log('[ListSync BG] ✓ eBay-Tab geöffnet (bgMode:', bgMode, ')')
  return tab
}

async function openVintedNewListing(bgMode = false) {
  const tab = await openInBackground('https://www.vinted.de/items/new', bgMode)
  console.log('[ListSync BG] ✓ Vinted-Tab geöffnet (bgMode:', bgMode, ')')
  return tab
}

function getEbayCategoryIdFromListing(listing) {
  const cat  = listing?.category     || ''
  const ka   = listing?.kaCategory   || ''
  const ebay = listing?.ebayCategory || ''

  const catLow   = cat.toLowerCase()
  const isDamen  = catLow.includes('damen')  || (!catLow.includes('herren') && !catLow.includes('kinder'))
  const isHerren = catLow.includes('herren')
  const isKinder = catLow.includes('kinder')

  // Aus ebayCategory (vom Formular manuell gewählt) – höchste Priorität
  // Aus kaCategory (automatisch vorgeschlagen)  – zweite Priorität
  const src = ebay || ka
  if (src) {
    const s = src.toLowerCase()
    if (s.includes('jeans'))                              return isDamen ? '11554'  : isHerren ? '11483' : '11554'
    if (s.includes('jacken') || s.includes('mäntel'))    return isDamen ? '63862'  : isHerren ? '57988' : '63862'
    if (s.includes('pullover') || s.includes('strick'))  return isDamen ? '63864'  : isHerren ? '57988' : '63864'
    if (s.includes('kleider') || s.includes('röcke'))    return isDamen ? '63861'  : '63861'
    if (s.includes('shirts') || s.includes('tops') || s.includes('hemden') || s.includes('t-shirts')) return isDamen ? '63861' : isHerren ? '57988' : '63861'
    if (s.includes('hosen') || s.includes('chinos'))     return isDamen ? '63861'  : isHerren ? '57988' : '63861'
    if (s.includes('shorts'))                            return isDamen ? '63861'  : isHerren ? '57988' : '63861'
    if (s.includes('bademode'))                          return isDamen ? '63861'  : '63861'
    if (s.includes('sportbekleidung'))                   return isDamen ? '63861'  : isHerren ? '57988' : '63861'
    if (s.includes('sneaker'))                           return isDamen ? '63889'  : isHerren ? '93427' : '63889'
    if (s.includes('stiefel'))                           return isDamen ? '63889'  : isHerren ? '93427' : '63889'
    if (s.includes('pumps') || s.includes('ballerinas') || s.includes('sandalen')) return '63889'
    if (s.includes('halbschuhe'))                        return '93427'
    if (s.includes('handtaschen') || s.includes('rucksäcke') || s.includes('clutch') || s.includes('geldbörse')) return '169291'
    if (s.includes('parfüm') || s.includes('düfte'))    return '180345'
    if (s.includes('make-up'))                           return '26395'
    if (s.includes('hautpflege'))                        return '11854'
    if (s.includes('haarpflege'))                        return '26395'
    if (s.includes('smartphone'))                        return '9355'
    if (s.includes('laptop'))                            return '177'
    if (s.includes('tablet'))                            return '171485'
    if (s.includes('kopfhörer'))                         return '15052'
    if (s.includes('hunde'))                             return '20744'
    if (s.includes('katzen'))                            return '20741'
    if (isKinder)                                        return '171146'
  }

  if (!cat) return null
  const EBAY_IDS = {
    'Damen': '63861', 'Damen – Kleidung': '63861',
    'Damen – Kleidung – Jacken & Mäntel': '63862',
    'Damen – Kleidung – Pullover & Strickpullover': '63864',
    'Damen – Kleidung – Jeans': '11554',
    'Damen – Kleidung – Blazer & Anzüge': '3002',
    'Damen – Kleidung – Unterwäsche & Nachtwäsche': '63863',
    'Damen – Kleidung – Activewear': '137084',
    'Damen – Schuhe': '63889', 'Damen – Taschen': '169291',
    'Damen – Accessoires': '4251', 'Damen – Accessoires – Schmuck': '281',
    'Damen – Accessoires – Uhren': '14324', 'Damen – Beauty': '26395',
    'Herren': '57988', 'Herren – Kleidung': '57988',
    'Herren – Kleidung – Jeans': '11483',
    'Herren – Kleidung – Anzüge & Blazer': '3001',
    'Herren – Kleidung – Sportartikel': '137084',
    'Herren – Schuhe': '93427', 'Herren – Accessoires': '15322',
    'Herren – Accessoires – Taschen & Rucksäcke': '169291',
    'Kinder': '171146', 'Kinder – Mädchen': '171146', 'Kinder – Jungs': '171147',
    'Kinder – Spielzeug': '220', 'Kinder – Kinderwagen, Tragen & Autositze': '100218',
    'Elektronik': '293', 'Elektronik – Smartphones': '15032',
    'Sport': '888', 'Sport & Outdoor': '888',
    'Home': '11700', 'Home & Living': '11700',
    'Unterhaltung': '11232', 'Unterhaltung – Bücher': '267',
    'Beauty': '26395', 'Beauty – Make-up': '26395', 'Beauty – Hautpflege': '11854',
    'Beauty – Haarpflege': '26395', 'Beauty – Parfüm & Düfte': '180345',
    'Beauty – Beauty-Tools & -Geräte': '26395',
    'Haustiere': '1281', 'Haustiere – Hunde': '20744', 'Haustiere – Katzen': '20741',
    'Haustiere – Kleintiere': '20745', 'Haustiere – Vögel': '20746',
    'Sonstiges': '99',
  }
  if (EBAY_IDS[cat]) return EBAY_IDS[cat]
  const keys = Object.keys(EBAY_IDS).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (cat.startsWith(key + ' – ') || cat === key) return EBAY_IDS[key]
  }
  return EBAY_IDS[cat.split(' – ')[0]] || null
}

// ── Bild-URLs zu ListSync-Storage hochladen (Vinted-URLs laufen ab/hotlink) ──
async function uploadImageUrls(urls) {
  const uploaded = []
  for (const url of (urls || []).slice(0, 8)) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) continue
      const fd = new FormData()
      const ext = (blob.type || 'image/jpeg').split('/')[1] || 'jpg'
      fd.append('files', new File([blob], `import_${uploaded.length + 1}.${ext}`, { type: blob.type }))
      const up = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: fd, credentials: 'include' })
      if (up.ok) {
        const { urls: outUrls } = await up.json()
        if (outUrls?.[0]) uploaded.push(outUrls[0])
      }
    } catch(e) { console.warn('[ListSync BG] Bild-Upload fehlgeschlagen:', e.message) }
  }
  return uploaded
}

// ── Vinted history import ─────────────────────────────────────────────────────

async function importVintedHistory(data, sourceTabId) {
  try {
    // Aktive Listings: Bilder hochladen damit sie dauerhaft funktionieren
    if (Array.isArray(data.listings) && data.listings.length) {
      for (let i = 0; i < data.listings.length; i++) {
        const l = data.listings[i]
        if (l.images?.length) {
          const uploaded = await uploadImageUrls(l.images)
          if (uploaded.length) l.images = uploaded
        }
        // Fortschritt an Sync-Tab melden
        if (sourceTabId) {
          chrome.tabs.sendMessage(sourceTabId, {
            type: 'SYNC_UPLOAD_PROGRESS', done: i + 1, total: data.listings.length
          }).catch(() => {})
        }
      }
    }

    const { token } = await chrome.storage.local.get('authToken')
    const res = await fetch(`${BASE_URL}/api/import`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body:    JSON.stringify(data),
      credentials: 'include',
    })
    const result = await res.json()
    console.log('[ListSync BG] Import:', result)
    chrome.runtime.sendMessage({ type: 'IMPORT_DONE', result }).catch(() => {})
    return result
  } catch(e) {
    console.warn('[ListSync BG] Import fehlgeschlagen:', e.message)
    throw e
  }
}

// ── Stats an ListSync senden (nur views/likes) ───────────────────────────────
async function syncStatsToListSync(stats, sourceTabId) {
  try {
    const res = await fetch(`${BASE_URL}/api/listings/stats`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ stats }),
      credentials: 'include',
    })
    const result = await res.json()
    console.log('[ListSync BG] Stats-Sync:', result)
    // Hintergrund-Tab nach Stats-Sync schließen
    if (sourceTabId) { try { await chrome.tabs.remove(sourceTabId) } catch {} }
    return result
  } catch(e) {
    console.warn('[ListSync BG] Stats-Sync fehlgeschlagen:', e.message)
    if (sourceTabId) { try { await chrome.tabs.remove(sourceTabId) } catch {} }
    throw e
  }
}

// ── Automatischer Stats-Sync im Hintergrund (alle 4 Stunden) ──────────────────
const STATS_ALARM = 'ls-stats-sync'
const STATS_INTERVAL_MIN = 240 // 4 Stunden

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(STATS_ALARM, { periodInMinutes: STATS_INTERVAL_MIN, delayInMinutes: 5 })
})
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(STATS_ALARM, { periodInMinutes: STATS_INTERVAL_MIN, delayInMinutes: 5 })
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== STATS_ALARM) return
  await runBackgroundStatsSync()
})

async function runBackgroundStatsSync() {
  try {
    // Aktiven Account + Member-ID holen
    const { vintedAccounts = [], activeVintedAccount } = await chrome.storage.local.get(['vintedAccounts', 'activeVintedAccount'])
    const acc = vintedAccounts.find(a => (a.name || a) === activeVintedAccount) || vintedAccounts[0]
    const memberId = typeof acc === 'object' ? acc?.memberId : null
    if (!memberId) { console.log('[ListSync BG] Stats-Sync übersprungen – keine Member-ID'); return }

    // Flag setzen + Profil-Tab im Hintergrund öffnen
    await chrome.storage.local.set({ statsOnlyRequested: true })
    await chrome.tabs.create({ url: `https://www.vinted.de/member/${memberId}`, active: false })
    // vinted-sync.js scrapet die Stats und schließt den Tab via syncStatsToListSync
    console.log('[ListSync BG] Hintergrund-Stats-Sync gestartet für Member', memberId)
  } catch(e) {
    console.warn('[ListSync BG] Hintergrund-Stats-Sync Fehler:', e.message)
  }
}

// ── Vinted Listing importieren ────────────────────────────────────────────────

async function importVintedListing(listing) {
  try {
    const uploadedImages = []
    for (const url of (listing.images || []).slice(0, 8)) {
      try {
        const res = await fetch(url)
        if (!res.ok) continue
        const blob = await res.blob()
        const fd = new FormData()
        const ext = (blob.type || 'image/jpeg').split('/')[1] || 'jpg'
        fd.append('files', new File([blob], `import_${uploadedImages.length + 1}.${ext}`, { type: blob.type }))
        const uploadRes = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: fd, credentials: 'include' })
        if (uploadRes.ok) {
          const { urls } = await uploadRes.json()
          if (urls?.[0]) uploadedImages.push(urls[0])
        }
      } catch(e) { console.warn('[ListSync BG] Bild-Upload fehlgeschlagen:', e.message) }
    }
    const body = {
      title: listing.title || 'Vinted-Import', description: listing.description || '',
      price: listing.price || 0, buyPrice: 0, category: listing.category || 'Sonstiges',
      condition: listing.condition || '', brand: listing.brand || '',
      size: listing.size || '', color: listing.color || '',
      images: uploadedImages, platforms: ['vinted'], shipping: [], shipSize: '', status: 'aktiv',
    }
    const res = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), credentials: 'include',
    })
    if (!res.ok) throw new Error('API Fehler: ' + res.status)
    const result = await res.json()
    console.log('[ListSync BG] ✅ Vinted-Listing importiert:', result.id)
    return result
  } catch(e) {
    console.warn('[ListSync BG] Import-Fehler:', e.message)
    throw e
  }
}

// ── Image injection (runs in MAIN world via chrome.scripting.executeScript) ───
// WICHTIG: Diese Funktion wird als String serialisiert und im MAIN world
// der Zielseite ausgeführt. NUR synchroner Code, var statt let/const,
// keine Arrow-Functions in kritischen Pfaden – maximale Kompatibilität.

function injectImages(imageData) {
  if (!imageData || !imageData.length) {
    console.warn('[ListSync MAIN] Keine Bilder')
    return
  }
  console.warn('[ListSync MAIN] Start –', imageData.length, 'Bilder')

  // Base64 → File[]
  var files = []
  for (var i = 0; i < imageData.length; i++) {
    try {
      var img  = imageData[i]
      var mime = (img.type || 'image/jpeg')
      if (mime.indexOf('heic') !== -1 || mime.indexOf('heif') !== -1) continue
      var b64  = img.base64.split(',')[1] || img.base64
      var bin  = atob(b64)
      var arr  = new Uint8Array(bin.length)
      for (var j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j)
      files.push(new File([arr], 'photo_' + (i + 1) + '.jpg', { type: 'image/jpeg' }))
    } catch(e) { console.warn('[ListSync MAIN] Bild-Fehler:', e.message) }
  }
  if (!files.length) { console.warn('[ListSync MAIN] Keine Dateien'); return }

  var dt = new DataTransfer()
  for (var k = 0; k < files.length; k++) dt.items.add(files[k])

  // ── Hilfsfunktion: React-Fiber-Key vom DOM-Element ───────────────────────────
  // Bevorzuge __reactFiber (enthält .return/.child/.sibling für walk-up).
  // __reactProps ist nur ein Props-Objekt ohne Tree-Links.
  function getFiberKey(el) {
    var keys = Object.keys(el)
    for (var x = 0; x < keys.length; x++) {
      if (keys[x].indexOf('__reactFiber') === 0) return keys[x]
    }
    for (var y = 0; y < keys.length; y++) {
      if (keys[y].indexOf('__reactInternals') === 0) return keys[y]
    }
    return null
  }

  // ── Hilfsfunktion: onChange via Fiber walk-up aufrufen ───────────────────────
  // WICHTIG: onUploadFilesStart ist eine CALLBACK-PROP des Eltern-Komponenten –
  // sie wird vom Upload-Kind AUFGERUFEN, löst aber selbst keinen Upload aus.
  // Der echte Trigger ist onChange am File-Input (depth 1 im Fiber-Baum).
  function callOnChange(el, fiberKey) {
    var fnode = el[fiberKey]
    var cnt = 0
    while (fnode && cnt++ < 20) {
      var fp = fnode.memoizedProps || fnode.pendingProps
      if (fp && typeof fp.onChange === 'function') {
        try {
          fp.onChange({
            target: el, currentTarget: el,
            preventDefault: function(){}, stopPropagation: function(){},
            persist: function(){}, nativeEvent: new Event('change', { bubbles: true }),
            bubbles: true, cancelable: true,
          })
          console.warn('[ListSync MAIN] ✓ onChange (Fiber walk-up, Ebene ' + cnt + ')')
          return true
        } catch(e) { console.warn('[ListSync MAIN] onChange Fehler (Ebene ' + cnt + '):', e.message) }
      }
      fnode = fnode.return
    }
    return false
  }

  // ── Strategie 1 (Primär): File-Input → Dateien setzen → React onChange ───────
  // Dies ist der korrekte Weg: löst Vinted's internen Upload-Handler aus.
  // Echte Vinted-testids (live bestätigt): add-photos-input, media-upload, plus, dropzone
  // KA-testids: ad-image-upload, photo-upload, image-upload-input, ...
  var fi = null
  var inputSels = [
    '[data-testid="add-photos-input"]',
    '[data-testid="ad-image-upload"]',
    '[data-testid="photo-upload-input"]',
    '[data-testid="image-upload-input"]',
    '[data-testid="media-upload"] input[type="file"]',
    '[data-testid="plus"] input[type="file"]',
    '[data-testid="dropzone"] input[type="file"]',
    '#ad-images-upload',
    'input[name="ad-images"]',
    'input[name="images"]',
    'input[type="file"][accept*="image"]',
    'input[type="file"][multiple]',
    'input[type="file"]',
  ]
  for (var s = 0; s < inputSels.length; s++) {
    var candidate = document.querySelector(inputSels[s])
    if (candidate) { fi = candidate; break }
  }

  if (fi) {
    console.warn('[ListSync MAIN] File-Input gefunden:', fi.getAttribute('data-testid') || fi.className || 'kein testid')
    // Dateien in den File-Input injizieren (React liest .files beim onChange)
    try { Object.defineProperty(fi, 'files', { get: function() { return dt.files }, configurable: true }) }
    catch(e) { console.warn('[ListSync MAIN] defineProperty fehlgeschlagen:', e.message) }

    var fk = getFiberKey(fi)
    if (fk) {
      var ok = callOnChange(fi, fk)
      if (ok) return
    }
    // Native fallback wenn Fiber nicht gefunden oder onChange fehlgeschlagen
    // eBay fehelix: Input kurz sichtbar machen damit der change-Handler sicher feuert
    var wasHidden = fi.style.display === 'none' || window.getComputedStyle(fi).display === 'none'
    if (wasHidden) {
      fi.style.cssText = 'display:block;position:fixed;top:-9999px;opacity:0;pointer-events:none'
    }
    fi.dispatchEvent(new Event('change', { bubbles: true }))
    fi.dispatchEvent(new Event('input',  { bubbles: true }))
    if (wasHidden) {
      setTimeout(function() { fi.style.display = 'none' }, 2000)
    }
    // Angular 1.x: $apply() damit ngModel/ngChange Binding reagiert
    try {
      if (window.angular) {
        var $el = window.angular.element(fi)
        var scope = $el.scope && $el.scope()
        if (scope && !scope.$$phase) scope.$apply()
        console.warn('[ListSync MAIN] ✓ Angular $apply getriggert')
      }
    } catch(ae) {}
    console.warn('[ListSync MAIN] ✓ Native change/input Events (Fallback)')
    return
  }

  // ── Strategie 2: BFS – sucht File-Input-Fiber mit onChange im Fiber-Baum ──────
  // Verwendet wenn der File-Input im DOM nicht gefunden wird (z.B. lazy render).
  // KEIN Suchen nach onUploadFilesStart – das ist ein Callback-Prop, kein Trigger!
  var rootEl = document.getElementById('__next') || document.querySelector('[id="root"]') || document.body
  var rootFiberKey = null
  var rootElKeys = Object.keys(rootEl)
  for (var ri = 0; ri < rootElKeys.length; ri++) {
    var rk = rootElKeys[ri]
    if (rk.indexOf('__reactFiber') === 0 || rk.indexOf('__reactContainer') === 0 ||
        rk.indexOf('_reactRootContainer') === 0) { rootFiberKey = rk; break }
  }

  if (rootFiberKey) {
    var startFiber = rootEl[rootFiberKey]
    if (startFiber && startFiber._internalRoot) startFiber = startFiber._internalRoot.current
    if (startFiber && startFiber.current) startFiber = startFiber.current

    var queue = startFiber ? [startFiber] : []
    var visited = 0

    while (queue.length > 0 && visited < 15000) {
      var fnode = queue.shift()
      visited++
      if (!fnode) continue

      // Suche: Fiber-Node für ein File-Input-Element mit onChange-Handler
      var fprops = fnode.memoizedProps || fnode.pendingProps
      if (fprops && fprops.type === 'file' && typeof fprops.onChange === 'function') {
        var domEl = fnode.stateNode
        if (domEl && domEl.tagName === 'INPUT') {
          console.warn('[ListSync MAIN] BFS: File-Input Fiber gefunden (node #' + visited + ')')
          try { Object.defineProperty(domEl, 'files', { get: function() { return dt.files }, configurable: true }) }
          catch(e) {}
          try {
            fprops.onChange({
              target: domEl, currentTarget: domEl,
              preventDefault: function(){}, stopPropagation: function(){},
              persist: function(){}, nativeEvent: new Event('change', { bubbles: true }),
              bubbles: true, cancelable: true,
            })
            console.warn('[ListSync MAIN] ✓ onChange via BFS (node #' + visited + ')')
            return
          } catch(e) { console.warn('[ListSync MAIN] BFS onChange Fehler:', e.message) }
        }
      }
      if (fnode.child)   queue.push(fnode.child)
      if (fnode.sibling) queue.push(fnode.sibling)
    }
    console.warn('[ListSync MAIN] BFS: ' + visited + ' Nodes durchsucht, kein File-Input-onChange gefunden')
  }

  // ── Strategie 3: Drop-Zone ───────────────────────────────────────────────────
  // Echte Vinted-testids: dropzone, media-upload, plus
  var dropSels = [
    '[data-testid="dropzone"]',
    '[data-testid="media-upload"]',
    '[data-testid="plus"]',
    '[data-testid="media-upload-grid"]',
    '[data-testid*="photo-upload"]', '[data-testid*="upload-photo"]',
    '[class*="photo-upload"]', '[class*="upload-zone"]', '[class*="dropzone"]',
  ]
  for (var d = 0; d < dropSels.length; d++) {
    var zone = document.querySelector(dropSels[d])
    if (zone) {
      zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }))
      zone.dispatchEvent(new DragEvent('dragover',  { bubbles: true, cancelable: true, dataTransfer: dt }))
      zone.dispatchEvent(new DragEvent('drop',      { bubbles: true, cancelable: true, dataTransfer: dt }))
      console.log('[ListSync MAIN] ✓ Drop-Zone:', dropSels[d])
      return
    }
  }

  // ── Strategie 4: Clipboard Paste ────────────────────────────────────────────
  try {
    var pasteData = new DataTransfer()
    for (var p = 0; p < files.length; p++) pasteData.items.add(files[p])
    var pasteEvent = new ClipboardEvent('paste', { clipboardData: pasteData, bubbles: true, cancelable: true })
    var uploadArea = document.querySelector('[data-testid="dropzone"]') ||
                     document.querySelector('[data-testid="media-upload"]') ||
                     document.querySelector('[data-testid="plus"]') ||
                     document.body
    uploadArea.dispatchEvent(pasteEvent)
    console.log('[ListSync MAIN] ✓ Clipboard Paste versucht')
  } catch(e2) { console.warn('[ListSync MAIN] Clipboard Paste Fehler:', e2.message) }

  // Debug: alle sichtbaren testids loggen
  var allTestids = []
  var allTidEls = document.querySelectorAll('[data-testid]')
  for (var t = 0; t < allTidEls.length; t++) {
    var tidEl = allTidEls[t]
    var tidR = tidEl.getBoundingClientRect()
    if (tidR.width > 0 && tidR.height > 0) allTestids.push(tidEl.getAttribute('data-testid'))
  }
  console.warn('[ListSync MAIN] Alle Strategien fehlgeschlagen. Sichtbare testids:', allTestids.slice(0, 40).join(', '))
  console.warn('[ListSync MAIN] File inputs im DOM:', document.querySelectorAll('input[type="file"]').length)
}
