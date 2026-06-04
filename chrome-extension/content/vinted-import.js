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
  const sels = [
    '[data-testid="item-title"] h2',
    'h2[itemprop="name"]',
    '[itemprop="name"]',
    'h1', 'h2',
  ]
  for (const s of sels) {
    const t = document.querySelector(s)?.textContent?.trim()
    if (t) return t
  }
  return document.querySelector('meta[property="og:title"]')?.content?.replace(' | Vinted', '').trim() || ''
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
  // 1. Galerie-Bilder (alle Fotos des Artikels) – höchste Priorität
  const galleryImgs = [...document.querySelectorAll(
    '[data-testid*="photo"] img, [data-testid*="image-carousel"] img, [class*="gallery"] img, [class*="photo"] img, [class*="Photo"] img, [class*="item-photo"] img'
  )]
    .map(i => {
      // srcset für höchste Auflösung
      const srcset = i.srcset || i.getAttribute('srcset') || ''
      if (srcset) {
        const best = srcset.split(',').map(s => s.trim().split(' '))
          .sort((a, b) => parseFloat(b[1] || 0) - parseFloat(a[1] || 0))[0]?.[0]
        if (best) return best
      }
      return i.src
    })
    .filter(s => s && !s.startsWith('data:') && (s.includes('vinted') || s.includes('cloudfront')))
  const uniqueGallery = [...new Set(galleryImgs)]
  if (uniqueGallery.length) return uniqueGallery.slice(0, 12)

  // 2. Fallback: og:image meta tags
  const og = [...document.querySelectorAll('meta[property="og:image"]')]
    .map(m => m.content).filter(Boolean)
  return [...new Set(og)].slice(0, 12)
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
  const sels = [
    '[data-testid="item-condition"]',
    '[class*="condition"]',
    '[class*="Condition"]',
  ]
  for (const s of sels) {
    const t = document.querySelector(s)?.textContent?.trim()
    if (t) return t
  }
  return ''
}

function scrapeBrand() {
  const sels = [
    '[data-testid="item-brand"]',
    '[itemprop="brand"]',
    '[class*="brand"]',
    '[class*="Brand"]',
  ]
  for (const s of sels) {
    const t = document.querySelector(s)?.textContent?.trim()
    if (t) return t
  }
  return ''
}

function scrapeSize() {
  const sels = [
    '[data-testid="item-size"]',
    '[class*="size"]',
    '[class*="Size"]',
  ]
  for (const s of sels) {
    const t = document.querySelector(s)?.textContent?.trim()
    if (t && t.length < 10) return t
  }
  return ''
}

function scrapeColor() {
  // Vinted zeigt Farbe als Detail-Zeile auf der Artikel-Seite
  const sels = [
    '[data-testid="item-color"]',
    '[class*="color"]',
    '[class*="Color"]',
    '[class*="colour"]',
  ]
  for (const s of sels) {
    const t = document.querySelector(s)?.textContent?.trim()
    if (t && t.length < 30) return t
  }
  // Fallback: Suche in Detail-Zeilen nach "Farbe"
  const rows = document.querySelectorAll('[class*="details"] dt, [class*="Details"] dt, dt, th')
  for (const dt of rows) {
    if (dt.textContent.trim().toLowerCase().includes('farbe') || dt.textContent.trim().toLowerCase().includes('color')) {
      const val = dt.nextElementSibling?.textContent?.trim()
      if (val) return val
    }
  }
  return ''
}

function scrapeMaterial() {
  const rows = document.querySelectorAll('[class*="details"] dt, [class*="Details"] dt, dt, th')
  for (const dt of rows) {
    if (dt.textContent.trim().toLowerCase().includes('material')) {
      const val = dt.nextElementSibling?.textContent?.trim()
      if (val) return val
    }
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
  await new Promise(r => setTimeout(r, 1800))

  // Voll auslesen – exakt wie beim manuellen Import
  const queueItem = queue.find(q => q.vintedId === currentId) || {}
  const listing = {
    title:       scrapeTitle(),
    description: scrapeDescription(),
    price:       scrapePrice(),
    images:      scrapeImages(),
    category:    scrapeCategory(),
    condition:   scrapeCondition(),
    brand:       scrapeBrand(),
    size:        scrapeSize(),
    color:       scrapeColor(),
    material:    scrapeMaterial(),
    status:      'aktiv',
    platforms:   ['vinted'],
    vintedId:    currentId,
    views:       queueItem.views || 0,
    likes:       queueItem.likes || 0,
  }
  console.log('[ListSync SYNC-ITEM]', listing.title, '–', listing.images.length, 'Bilder, Kat:', listing.category)

  scraped.push(listing)
  const remaining = queue.filter(q => q.vintedId !== currentId)
  await chrome.storage.local.set({ syncScrapedItems: scraped, syncItemQueue: remaining })

  if (remaining.length > 0) {
    // Nächster Artikel
    setSyncStatus(`${scraped.length} fertig · ${remaining.length} übrig – weiter…`)
    await new Promise(r => setTimeout(r, 700))
    location.href = `https://www.vinted.de/items/${remaining[0].vintedId}`
  } else {
    // Alle ausgelesen → importieren
    setSyncStatus(`Importiere ${scraped.length} Listings + ${(store.syncSoldData||[]).length} Verkäufe…`)
    chrome.runtime.sendMessage({
      type: 'VINTED_SYNC_DATA',
      data: {
        sales:     store.syncSoldData || [],
        purchases: [],
        listings:  scraped,
        account:   store.syncAccount || 'Hauptaccount',
      }
    }, (response) => {
      showSyncBanner(
        response?.ok ? `✅ ${scraped.length} Listings & ${(store.syncSoldData||[]).length} Verkäufe importiert!` : '⚠️ Import fehlgeschlagen',
        response?.ok ? '#16a34a' : '#dc2626'
      )
    })
    await chrome.storage.local.remove(['syncPhase', 'syncItemQueue', 'syncScrapedItems', 'syncSoldData', 'syncAccount'])
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
