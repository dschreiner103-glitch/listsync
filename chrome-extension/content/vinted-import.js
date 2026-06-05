'use strict'

// Läuft auf https://www.vinted.de/items/XXXXX-slug
// Erkennt eigene Listings → zeigt "In ListSync importieren"-Button

const BASE_URL = 'https://project-dle5b.vercel.app'

// ── Warten bis DOM bereit ─────────────────────────────────────────────────────
function waitForEl(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector)
    if (el) return resolve(el)
    const ob = new MutationObserver(() => {
      const found = document.querySelector(selector)
      if (found) { ob.disconnect(); clearTimeout(tid); resolve(found) }
    })
    ob.observe(document.body, { childList: true, subtree: true })
    const tid = setTimeout(() => { ob.disconnect(); reject() }, timeout)
  })
}

// ── Eigenes Listing erkennen ──────────────────────────────────────────────────
function isOwnListing() {
  const editSelectors = [
    'a[href*="/edit"]',
    '[data-testid="item-edit-button"]',
    '[data-testid="item-close-button"]',
    'button[data-testid*="edit"]',
    '[class*="ItemActions"]',
    '[class*="item-actions"]',
  ]
  return editSelectors.some(s => document.querySelector(s))
}

// ── Daten auslesen ────────────────────────────────────────────────────────────
function scrapeTitle() {
  // 1. og:title – von Vinted server-side gerendert, immer korrekt
  const og = document.querySelector('meta[property="og:title"]')?.content || ''
  if (og) {
    // "Ralph Lauren Daunenjacke Dunkelblau (S) | Vinted" → Titel extrahieren
    let t = og.replace(/\s*\|\s*Vinted.*$/i, '').trim()
    // Manche Vinted-Titel: "Titel, Größe X - 80,00 €" → vor " - Preis" abschneiden
    t = t.replace(/\s*[-–]\s*\d+[,.]\d+\s*€.*$/, '').trim()
    if (t.length > 1) return t
  }
  // 2. document.title
  const dt = (document.title || '').replace(/\s*\|\s*Vinted.*$/i, '').trim()
  if (dt && dt.length > 1 && !/^vinted/i.test(dt)) return dt
  // 3. DOM-Fallbacks
  const sels = ['[data-testid="item-title"]', '[itemprop="name"]', 'h1']
  for (const s of sels) {
    const t = document.querySelector(s)?.textContent?.trim()
    if (t && t.length > 1) return t
  }
  return ''
}

function scrapePrice() {
  const sels = [
    '[data-testid="item-price"]',
    '[itemprop="price"]',
    '[class*="ItemPrice"]',
    '[class*="price"]',
  ]
  for (const s of sels) {
    const el = document.querySelector(s)
    if (!el) continue
    const raw = el.getAttribute('content') || el.textContent || ''
    const num = parseFloat(raw.replace(/[^0-9.,]/g, '').replace(',', '.'))
    if (!isNaN(num) && num > 0) return num
  }
  return 0
}

function scrapeDescription() {
  const sels = [
    '[data-testid="item-description"]',
    '[itemprop="description"]',
    '[class*="description"]',
  ]
  for (const s of sels) {
    const t = document.querySelector(s)?.textContent?.trim()
    if (t) return t
  }
  return document.querySelector('meta[name="description"]')?.content?.trim() || ''
}

function scrapeImages() {
  const urls = []
  for (const img of document.querySelectorAll('img')) {
    // Avatar / Profil / Header / Breadcrumb-Bilder überspringen
    if (img.closest('[class*="circ"], [class*="avatar"], [class*="Avatar"], header, nav, [class*="breadcrumb"]')) continue
    let src = img.src || ''
    // srcset für höchste Auflösung
    const srcset = img.srcset || img.getAttribute('srcset') || ''
    if (srcset) {
      const best = srcset.split(',').map(s => s.trim().split(' '))
        .sort((a, b) => parseFloat(b[1] || 0) - parseFloat(a[1] || 0))[0]?.[0]
      if (best) src = best
    }
    if (!src || src.startsWith('data:')) continue
    // Nur Vinted-Produktfoto-CDN
    if (!/images\d*\.vinted\.net/.test(src)) continue
    urls.push(src)
  }

  // Dedup über den EINDEUTIGEN Pfad-Hash zwischen /t/ und der Größe.
  // WICHTIG: die Zahl am Ende (z.B. 1774202794) ist ein gemeinsamer Timestamp,
  // KEIN eindeutiger Foto-Identifier – darüber zu dedupen lässt nur 1 Bild übrig.
  const seen = new Set()
  const result = []
  for (const u of urls) {
    const hash = u.match(/\/t\/([^/]+)\//)?.[1] || u.split('?')[0]
    if (!seen.has(hash)) { seen.add(hash); result.push(u) }
  }
  console.log('[ListSync IMAGES]', result.length, 'Bilder')
  return result.slice(0, 12)
}

function scrapeCategory() {
  // Echter Breadcrumb-Container (.breadcrumbs) – NICHT die Hashtag-Links in der Beschreibung
  const bc = document.querySelector('.breadcrumbs, [class*="breadcrumbs--"]')
  if (bc) {
    let items = [...bc.querySelectorAll('a')]
      .map(a => a.textContent.trim())
      .filter(t => t && !t.startsWith('#') && !['Vinted', 'Startseite', 'Home'].includes(t))
    // Letzter Eintrag ist oft marken-spezifisch ("Ralph Lauren Daunenjacken") → raus
    const brand = scrapeBrand()
    if (items.length > 1 && brand && items[items.length - 1].includes(brand)) {
      items = items.slice(0, -1)
    }
    if (items.length) return items.join(' – ')
  }
  // Fallback
  const crumbs = [...document.querySelectorAll('[class*="breadcrumb"] a')]
    .map(a => a.textContent.trim())
    .filter(t => t && !t.startsWith('#') && !['Vinted', 'Startseite', 'Home'].includes(t))
  return crumbs.length ? crumbs.slice(0, 5).join(' – ') : 'Sonstiges'
}

function scrapeCondition() {
  return scrapeDetailMap()['condition'] || ''
}

function scrapeBrand() {
  return scrapeDetailMap()['brand'] || ''
}

function scrapeSize() {
  return scrapeDetailMap()['size'] || ''
}

function scrapeColor() {
  return scrapeDetailMap()['color'] || ''
}

function scrapeMaterial() {
  return scrapeDetailMap()['material'] || ''
}

// ── Robuste Detail-Tabelle: liest Label→Wert Paare aus der Artikel-Detailbox ──
// Vinted zeigt: Marke | Ralph Lauren, Größe | S, Zustand | Sehr gut, Material | Daunen, Farbe | Marineblau
let _detailMapCache = null
function scrapeDetailMap() {
  if (_detailMapCache) return _detailMapCache
  const map = {}
  const LABELS = {
    'marke': 'brand', 'größe': 'size', 'grösse': 'size', 'size': 'size',
    'zustand': 'condition', 'material': 'material', 'farbe': 'color',
    'stil': 'stil', 'muster': 'muster',
  }

  // Finde alle Blatt-Elemente (ohne Kinder) deren Text exakt ein Label ist
  const all = document.querySelectorAll('div, span, dt, td, th, p, li')
  for (const el of all) {
    if (el.children.length > 0) continue
    const txt = (el.textContent || '').trim().toLowerCase().replace(/\s*\(empfohlen\)/, '')
    const key = LABELS[txt]
    if (!key || map[key]) continue

    const value = findValueForLabel(el)
    if (value) map[key] = value
  }

  _detailMapCache = map
  console.log('[ListSync DETAIL-MAP]', map)
  return map
}

function findValueForLabel(labelEl) {
  const labelText = (labelEl.textContent || '').trim()
  // Bekannte Müll-Suffixe die Vinted in versteckten Menü-/Tooltip-Elementen anhängt
  const scrub = (s) => (s || '')
    .replace(/Marken-Menü|Größen-?Menü|Menü|mehr erfahren|Mehr Informationen/gi, '')
    .replace(/\s+/g, ' ')
    .split('\n')[0].trim()

  // Den umgebenden "Zeilen"-Container finden (Label + Wert)
  let node = labelEl
  for (let depth = 0; depth < 4; depth++) {
    const parent = node.parentElement
    if (!parent) break

    // Bevorzugt: ein <a>-Link im Container (z.B. Marke "Ralph Lauren") – sauberster Wert
    const link = parent.querySelector('a')
    if (link) {
      const lt = scrub(link.textContent)
      if (lt && lt.toLowerCase() !== labelText.toLowerCase()) return lt
    }

    // Sonst: alle Blatt-Texte sammeln die nicht das Label sind
    const candidates = []
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT)
    let tn
    while ((tn = walker.nextNode())) {
      const t = tn.textContent.trim()
      if (t && t.toLowerCase() !== labelText.toLowerCase()) candidates.push(t)
    }
    const real = candidates.find(c => { const s = scrub(c); return s.length > 0 && !/^\(/.test(s) })
    if (real) return scrub(real)

    node = parent
  }
  return ''
}

// ── Button einblenden ─────────────────────────────────────────────────────────
function showImportButton() {
  if (document.getElementById('ls-import-btn')) return

  const btn = document.createElement('div')
  btn.id = 'ls-import-btn'
  btn.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
    background: #4f46e5; color: #fff; font-family: sans-serif;
    padding: 12px 18px; border-radius: 14px; cursor: pointer;
    box-shadow: 0 4px 20px rgba(79,70,229,0.45);
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 700; user-select: none;
    transition: transform 0.15s, box-shadow 0.15s;
  `
  btn.innerHTML = `<span style="font-size:18px">📥</span> In ListSync importieren`
  btn.onmouseenter = () => { btn.style.transform = 'scale(1.04)'; btn.style.boxShadow = '0 6px 28px rgba(79,70,229,0.55)' }
  btn.onmouseleave = () => { btn.style.transform = ''; btn.style.boxShadow = '0 4px 20px rgba(79,70,229,0.45)' }
  btn.onclick = handleImport
  document.body.appendChild(btn)
}

// ── Import durchführen ────────────────────────────────────────────────────────
async function handleImport() {
  const btn = document.getElementById('ls-import-btn')
  if (!btn) return

  btn.innerHTML = `<span style="font-size:18px">⏳</span> Wird importiert…`
  btn.style.pointerEvents = 'none'
  btn.style.opacity = '0.8'

  const listing = {
    title:       scrapeTitle(),
    description: scrapeDescription(),
    price:       scrapePrice(),
    buyPrice:    0,
    category:    scrapeCategory(),
    condition:   scrapeCondition(),
    brand:       scrapeBrand(),
    size:        scrapeSize(),
    images:      scrapeImages(),
    platforms:   ['vinted'],
    shipping:    [],
    shipSize:    '',
    color:       scrapeColor(),
    material:    scrapeMaterial(),
    status:      'aktiv',
  }

  console.log('[ListSync Import] Daten:', listing)

  // An Background schicken der den API-Call macht
  chrome.runtime.sendMessage({ type: 'IMPORT_VINTED_LISTING', listing }, (resp) => {
    if (chrome.runtime.lastError || !resp?.ok) {
      btn.innerHTML = `<span>❌</span> Fehler – bitte erneut versuchen`
      btn.style.background = '#dc2626'
      btn.style.pointerEvents = 'auto'
      btn.style.opacity = '1'
      setTimeout(() => {
        btn.innerHTML = `<span style="font-size:18px">📥</span> In ListSync importieren`
        btn.style.background = '#4f46e5'
      }, 3000)
      return
    }

    btn.innerHTML = `<span>✅</span> Importiert! Jetzt crossposten →`
    btn.style.background = '#16a34a'
    btn.style.pointerEvents = 'auto'
    btn.style.opacity = '1'
    btn.onclick = () => {
      window.open(`${BASE_URL}/listings`, '_blank')
    }
  })
}

// ── Sync-Queue: automatischer Bulk-Import aller aktiven Artikel ───────────────
// vinted-sync.js sammelt alle Artikel-IDs vom Profil und navigiert hierher.
// Jede Artikelseite wird geöffnet, voll ausgelesen (wie der manuelle Import),
// dann automatisch zur nächsten navigiert.

function showSyncBanner(msg, color = '#4f46e5') {
  let d = document.getElementById('ls-sync-banner')
  if (!d) {
    d = document.createElement('div')
    d.id = 'ls-sync-banner'
    d.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:2147483647;color:#fff;font-family:sans-serif;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 3px 16px rgba(0,0,0,.4)`
    document.body.prepend(d)
  }
  d.style.background = color
  d.innerHTML = `<span style="font-size:20px">🔄</span>
    <div style="flex:1"><div style="font-weight:700;font-size:13px">ListSync Import</div>
    <div id="ls-sync-status" style="font-size:11px;opacity:.85">${msg}</div></div>`
}
function setSyncStatus(msg) {
  const el = document.getElementById('ls-sync-status')
  if (el) el.textContent = msg
}

async function runSyncQueue() {
  const store = await chrome.storage.local.get(['syncPhase', 'syncItemQueue', 'syncScrapedItems', 'syncSoldData', 'syncAccount'])
  if (store.syncPhase !== 'items' || !Array.isArray(store.syncItemQueue) || !store.syncItemQueue.length) {
    return false // kein Sync aktiv → normaler Modus (Import-Button)
  }

  const currentId = location.pathname.match(/\/items\/(\d+)/)?.[1]
  const queue     = store.syncItemQueue
  const scraped   = store.syncScrapedItems || []
  const total     = queue.length + scraped.length

  showSyncBanner(`Lese Artikel ${scraped.length + 1}/${total} aus…`)

  // Warten bis die Artikelseite gerendert ist
  try { await waitForEl('h1, [data-testid="item-title"], [itemprop="name"], .breadcrumbs', 9000) } catch {}
  await new Promise(r => setTimeout(r, 1500))

  // Bilder laden lazy → einmal runter- und wieder hochscrollen triggert das Laden
  window.scrollTo(0, 600)
  await new Promise(r => setTimeout(r, 1200))
  window.scrollTo(0, 0)
  await new Promise(r => setTimeout(r, 800))

  // ── Alles aus dem DOM scrapen (Vinted-API gibt HTML zurück, nicht nutzbar) ──
  _detailMapCache = null // Cache pro Seite zurücksetzen
  const domImgs = scrapeImages()
  const queueItem = queue.find(q => q.vintedId === currentId) || {}
  const listing = {
    title:       scrapeTitle() || `Artikel ${currentId}`,
    description: scrapeDescription() || '',
    price:       scrapePrice() || 0,
    images:      domImgs,
    category:    scrapeCategory(),
    condition:   scrapeCondition() || 'Gut',
    brand:       scrapeBrand(),
    size:        scrapeSize(),
    color:       scrapeColor(),
    material:    scrapeMaterial(),
    shipSize:    '',
    status:      'aktiv',
    platforms:   ['vinted'],
    vintedId:    currentId,
    views:       queueItem.views || 0,
    likes:       queueItem.likes || 0,
  }
  console.log('[ListSync SYNC-ITEM]', {
    title: listing.title?.slice(0,25), brand: listing.brand, size: listing.size,
    color: listing.color, material: listing.material, imgs: listing.images.length, cat: listing.category,
  })

  scraped.push(listing)
  const remaining = queue.filter(q => q.vintedId !== currentId)
  await chrome.storage.local.set({ syncScrapedItems: scraped, syncItemQueue: remaining })

  if (remaining.length > 0) {
    // Nächster Artikel
    setSyncStatus(`${scraped.length} fertig · ${remaining.length} übrig – weiter…`)
    await new Promise(r => setTimeout(r, 700))
    location.href = `https://www.vinted.de/items/${remaining[0].vintedId}`
  } else {
    // Alle ausgelesen → importieren (Bilder werden im Background hochgeladen)
    await chrome.storage.local.remove(['syncPhase', 'syncItemQueue', 'syncScrapedItems', 'syncSoldData', 'syncAccount'])
    setSyncStatus(`Lade Bilder hoch & importiere ${scraped.length} Listings…`)

    // Upload-Fortschritt vom Background anzeigen
    const progressListener = (m) => {
      if (m.type === 'SYNC_UPLOAD_PROGRESS') {
        setSyncStatus(`Lade Bilder hoch… Listing ${m.done}/${m.total}`)
      }
    }
    chrome.runtime.onMessage.addListener(progressListener)

    chrome.runtime.sendMessage({
      type: 'VINTED_SYNC_DATA',
      data: {
        sales:     store.syncSoldData || [],
        purchases: [],
        listings:  scraped,
        account:   store.syncAccount || 'Hauptaccount',
      }
    }, (response) => {
      chrome.runtime.onMessage.removeListener(progressListener)
      const r = response?.result || {}
      showSyncBanner(
        response?.ok
          ? `✅ ${(r.created||0)+(r.updated||0)} Listings & ${(store.syncSoldData||[]).length} Verkäufe importiert!`
          : '⚠️ Import fehlgeschlagen',
        response?.ok ? '#16a34a' : '#dc2626'
      )
    })
  }
  return true
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Sync-Queue zuerst prüfen – übernimmt die Seite wenn Bulk-Import läuft
  if (location.pathname.match(/^\/items\/\d+/)) {
    const isSyncing = await runSyncQueue()
    if (isSyncing) return
  }

  // Kurz warten bis Vinted React fertig gerendert hat
  await new Promise(r => setTimeout(r, 2000))

  // Nur auf Artikel-Detailseiten aktivieren (nicht auf /new oder /catalog)
  if (!location.pathname.match(/^\/items\/\d+/)) return

  // Prüfen ob es ein eigenes Listing ist
  if (!isOwnListing()) {
    // Nochmal nach 3s prüfen (React kann noch laden)
    setTimeout(() => {
      if (isOwnListing()) showImportButton()
    }, 3000)
    return
  }

  showImportButton()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
