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

  // 1. og:image meta-Tags – von Vinted server-side gerendert, volle Auflösung
  for (const m of document.querySelectorAll('meta[property="og:image"]')) {
    if (m.content && /vinted/.test(m.content)) urls.push(m.content)
  }

  // 2. __NEXT_DATA__ JSON (Next.js – enthält photos in voller Auflösung)
  try {
    const nd = document.getElementById('__NEXT_DATA__')
    if (nd) {
      const json = nd.textContent
      // Alle full_size_url / url die nach Vinted-Fotos aussehen rausziehen
      const matches = json.match(/"(full_size_url|url)":"(https:\\?\/\\?\/[^"]*vinted[^"]*?)"/g) || []
      for (const m of matches) {
        const u = m.match(/:"(.+)"$/)?.[1]?.replace(/\\\//g, '/')
        if (u && /\.(jpe?g|png|webp)/.test(u)) urls.push(u)
      }
    }
  } catch {}

  // 3. Alle img-Tags (inkl. lazy-load Attribute, srcset)
  for (const i of document.querySelectorAll('img')) {
    const cands = [i.src, i.getAttribute('data-src'), i.getAttribute('data-original')]
    const srcset = i.srcset || i.getAttribute('srcset') || ''
    if (srcset) {
      const best = srcset.split(',').map(s => s.trim().split(' '))
        .sort((a, b) => parseFloat(b[1] || 0) - parseFloat(a[1] || 0))[0]?.[0]
      if (best) cands.unshift(best)
    }
    for (const src of cands) {
      if (src && !src.startsWith('data:') && /vinted\.net|vinted-cdn|cloudfront|ce-cdn/.test(src)) {
        urls.push(src)
      }
    }
  }

  // Deduplizieren über Foto-ID im Pfad (gleiche Bilder in versch. Größen filtern)
  const seen = new Set()
  const result = []
  for (const u of urls) {
    // Foto-ID = letzte Zahlfolge vor der Endung
    const idMatch = u.match(/\/(\d{6,})[^/]*\.(jpe?g|png|webp)/i)
    const key = idMatch ? idMatch[1] : u.split('?')[0]
    if (!seen.has(key)) { seen.add(key); result.push(u) }
  }
  console.log('[ListSync IMAGES]', result.length, 'Bilder')
  return result.slice(0, 12)
}

function scrapeCategory() {
  // Breadcrumb-Navigation lesen
  const crumbs = [...document.querySelectorAll(
    '[data-testid*="breadcrumb"] a, nav a[href*="catalog"], [class*="breadcrumb"] a, [class*="Breadcrumb"] a'
  )].map(a => a.textContent.trim()).filter(t => t && !['Vinted', 'Startseite', 'Home'].includes(t))
  if (crumbs.length) return crumbs.join(' – ')
  return 'Sonstiges'
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
  const clean = (s) => {
    if (!s) return ''
    // entferne Label selbst, Info-Icon-Text, Whitespace
    let t = s.replace(labelText, '').trim()
    // nur erste sinnvolle Zeile
    t = t.split('\n')[0].trim()
    return t
  }

  // Strategie 1: direkter nächster Sibling
  let sib = labelEl.nextElementSibling
  if (sib) { const v = sib.textContent.trim(); if (v && v !== labelText) return clean(v) }

  // Strategie 2: im gemeinsamen Eltern-Container ein Geschwister mit anderem Text
  // Gehe bis zu 3 Ebenen hoch und suche eine "Zeile" mit Label + Wert
  let node = labelEl
  for (let depth = 0; depth < 4; depth++) {
    const parent = node.parentElement
    if (!parent) break
    // Alle Blatt-Texte im Parent sammeln, die nicht das Label sind
    const candidates = []
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT)
    let tn
    while ((tn = walker.nextNode())) {
      const t = tn.textContent.trim()
      if (t && t !== labelText && t.toLowerCase() !== labelText.toLowerCase()) candidates.push(t)
    }
    if (candidates.length === 1) return candidates[0]
    if (candidates.length > 1) {
      // Nimm den ersten der nicht nur ein Icon/Zahl-Info ist
      const real = candidates.find(c => c.length > 1 && !/^\(/.test(c))
      if (real) return real
    }
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
  try { await waitForEl('h1, [data-testid="item-title"], [itemprop="name"]', 9000) } catch {}
  await new Promise(r => setTimeout(r, 1500))

  // ── API-Daten holen (zuverlässig für Marke, Größe, Farbe, Material, Bilder) ──
  let api = null
  try {
    const res = await fetch(`https://www.vinted.de/api/v2/items/${currentId}`, {
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
    })
    if (res.ok) { const j = await res.json(); api = j?.item || j }
  } catch {}
  if (scraped.length === 0 && api) console.log('[ListSync ITEM-API]', JSON.stringify(api, null, 2))

  // ── DOM-Scrape (gut für Beschreibung + Kategorie) ──
  const domDesc = scrapeDescription()
  const domCat  = scrapeCategory()

  // ── Hybrid-Merge: API bevorzugt für strukturierte Felder, DOM als Fallback ──
  const apiBrand = api?.brand_dto?.title || (typeof api?.brand === 'string' ? api.brand : '') || api?.brand?.title || ''
  const apiSize  = api?.size_title || (typeof api?.size === 'string' ? api.size : '') || api?.size?.title || ''
  const apiCond  = api?.status || api?.condition || api?.item_condition?.title || ''
  const apiColor = [api?.color1 || api?.color1_title, api?.color2 || api?.color2_title].filter(Boolean).join(', ')
  const apiMat   = api?.composition || (typeof api?.material === 'string' ? api.material : '') || api?.material?.title || ''
  const apiImgs  = Array.isArray(api?.photos)
    ? api.photos.map(p => p.full_size_url || p.url || (p.thumbnails && p.thumbnails[p.thumbnails.length-1]?.url) || '').filter(Boolean)
    : []
  const apiShip  = api?.package_size?.title || api?.package_size_title || ''

  // DOM-Werte (sichtbar in der Detail-Tabelle → zuverlässig)
  const domImgs = scrapeImages()
  const queueItem = queue.find(q => q.vintedId === currentId) || {}
  const listing = {
    title:       scrapeTitle() || api?.title || `Artikel ${currentId}`,
    description: domDesc || api?.description || '',
    price:       scrapePrice() || parseFloat(api?.price?.amount || api?.price_numeric) || 0,
    images:      domImgs.length ? domImgs : apiImgs,        // DOM zuerst, API-Fallback
    category:    domCat !== 'Sonstiges' ? domCat : 'Sonstiges',
    condition:   scrapeCondition() || apiCond  || 'Gut',
    brand:       scrapeBrand()     || apiBrand,
    size:        scrapeSize()      || apiSize,
    color:       scrapeColor()     || apiColor,
    material:    scrapeMaterial()  || apiMat,
    shipSize:    apiShip,
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
