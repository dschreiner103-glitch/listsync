'use strict'
// Läuft auf vinted.de – scrapt Verkäufe und Käufe über interne API

const wait = ms => new Promise(r => setTimeout(r, ms))

// ── Banner ────────────────────────────────────────────────────────────────────

function showSyncBanner(msg, color = '#4f46e5') {
  let d = document.getElementById('ls-sync-banner')
  if (!d) {
    d = document.createElement('div')
    d.id = 'ls-sync-banner'
    d.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:2147483647;color:#fff;font-family:sans-serif;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 3px 16px rgba(0,0,0,.4)`
    document.body.prepend(d)
    document.body.style.paddingTop = '54px'
  }
  d.style.background = color
  d.innerHTML = `
    <span style="font-size:20px">🔄</span>
    <div style="flex:1">
      <div style="font-weight:700;font-size:13px">ListSync Sync</div>
      <div id="ls-sync-status" style="font-size:11px;opacity:.8">${msg}</div>
    </div>
    <button onclick="document.getElementById('ls-sync-banner').remove();document.body.style.paddingTop=''"
      style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600">✕</button>
  `
}

function setSyncStatus(msg) {
  const el = document.getElementById('ls-sync-status')
  if (el) el.textContent = msg
}

// ── Fetch Vinted API with session cookies ────────────────────────────────────

async function callVintedAPI(path) {
  try {
    const res = await fetch(`https://www.vinted.de${path}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
    })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

// ── Schritt 1: aktuelle User-ID ermitteln ─────────────────────────────────────

async function getCurrentUserId() {
  const candidates = [
    '/api/v2/users/current',
    '/api/v2/profile',
    '/api/v2/account',
  ]
  for (const ep of candidates) {
    const data = await callVintedAPI(ep)
    const id = data?.user?.id || data?.id || data?.current_user?.id
    if (id) { console.log('[ListSync] User-ID gefunden:', id, 'via', ep); return id }
  }
  // Fallback: aus dem DOM lesen (Vinted speichert User-ID in data-Attributen)
  const el = document.querySelector('[data-current-user-id]')
  if (el) return el.getAttribute('data-current-user-id')
  // Fallback: aus window.__INITIAL_STATE__ (Vinted SSR)
  try {
    const state = window.__INITIAL_STATE__ || window.__PRELOADED_STATE__
    if (state) {
      const id = state?.currentUser?.id || state?.session?.user?.id
      if (id) return id
    }
  } catch {}
  return null
}

// ── Schritt 2: Items per User-ID laden ───────────────────────────────────────

async function fetchAll(baseUrl, label) {
  const items = []
  let page = 1
  while (true) {
    setSyncStatus(`Lade ${label}… Seite ${page}`)
    const sep = baseUrl.includes('?') ? '&' : '?'
    const data = await callVintedAPI(`${baseUrl}${sep}page=${page}&per_page=50`)
    if (!data) break
    const batch = data.items || data.data?.items || data.transactions || data.orders || []
    if (!batch.length) break
    const flat = batch.map(entry => {
      if (entry.item) {
        return {
          ...entry.item,
          transaction: entry,
          sold_at:   entry.updated_at_ts || entry.updated_at || entry.created_at_ts || entry.created_at,
          bought_at: entry.updated_at_ts || entry.updated_at || entry.created_at_ts || entry.created_at,
        }
      }
      return entry
    })
    items.push(...flat)
    if (batch.length < 50) break
    page++
    await wait(600)
  }
  return items
}

async function fetchAllSales(userId) {
  // Versuche User-ID-basierte Endpunkte zuerst, dann generische
  const endpoints = userId ? [
    `/api/v2/users/${userId}/items?item_statuses[]=sold`,
    `/api/v2/users/${userId}/items?status[]=sold`,
    `/api/v2/users/${userId}/items?statuses[]=2`,
    `/api/v2/users/${userId}/sold_items`,
  ] : []
  // Generische Fallbacks
  endpoints.push(
    '/api/v2/items?status[]=sold&owned=1',
    '/api/v2/items?item_statuses[]=sold&owned=1',
    '/api/v2/items?statuses[]=2&owned=1',
  )
  for (const ep of endpoints) {
    setSyncStatus(`Lade Verkäufe… (${ep.split('?')[0].split('/').pop()})`)
    const test = await callVintedAPI(`${ep}${ep.includes('?')?'&':'?'}page=1&per_page=1`)
    if (test && (test.items?.length >= 0 || test.data?.items?.length >= 0)) {
      console.log('[ListSync] Verkäufe-Endpunkt:', ep)
      return fetchAll(ep, 'Verkäufe')
    }
  }
  return []
}

async function fetchAllPurchases(userId) {
  const endpoints = userId ? [
    `/api/v2/users/${userId}/items?item_statuses[]=bought`,
    `/api/v2/users/${userId}/bought_items`,
    `/api/v2/transactions?buyer_id=${userId}`,
  ] : []
  endpoints.push(
    '/api/v2/transactions?as=buyer',
    '/api/v2/transactions?type=buy',
    '/api/v2/orders?as=buyer',
  )
  for (const ep of endpoints) {
    setSyncStatus(`Lade Einkäufe… (${ep.split('?')[0].split('/').pop()})`)
    const test = await callVintedAPI(`${ep}${ep.includes('?')?'&':'?'}page=1&per_page=1`)
    if (test && (test.items || test.transactions || test.orders)) {
      console.log('[ListSync] Einkäufe-Endpunkt:', ep)
      return fetchAll(ep, 'Einkäufe')
    }
  }
  return []
}

// Versucht Bestelldaten mit Datum über die Vinted-API zu holen
async function fetchOrderDates() {
  const endpoints = [
    '/api/v2/my_orders?order_type=sold&per_page=100',
    '/api/v2/my_orders?status=5&per_page=100',
    '/api/v2/transactions?as=seller&per_page=100',
    '/api/v2/transactions?type=sell&per_page=100',
  ]
  for (const ep of endpoints) {
    const data = await callVintedAPI(ep)
    const orders = data?.orders || data?.transactions || data?.my_orders || []
    if (orders.length > 0) {
      console.log('[ListSync] Order-Datum-Endpunkt:', ep, 'Ergebnis:', orders[0])
      // Baue Map: vintedId/title → Datum
      const map = {}
      for (const o of orders) {
        const item = o.item || o
        const orderId  = String(o.id || '')
        const itemId   = String(item.id || o.item_id || '')
        const title    = (item.title || o.item_title || '').toLowerCase().trim()
        const date = parseDate(o, SALE_DATE_FIELDS) || parseDate(item, SALE_DATE_FIELDS)
        // Beides als Key speichern: Order-ID und Item-ID können verschieden sein
        if (orderId) map[orderId] = date
        if (itemId && itemId !== orderId) map[itemId] = date
        if (title) map[title] = date
        console.log('[ListSync DATE]', { orderId, itemId, title: title.slice(0,30), date })
      }
      return map
    }
  }
  return {}
}

async function fetchAllActive(userId) {
  // Catalog-basierte Endpunkte (robuster als user/items)
  const endpoints = userId ? [
    `/api/v2/catalog/items?seller_ids[]=${userId}&per_page=96`,
    `/api/v2/catalog?seller_ids[]=${userId}&per_page=96`,
    `/api/v2/users/${userId}/items?per_page=50`,
    `/api/v2/users/${userId}/items?item_statuses[]=1&per_page=50`,
  ] : []
  endpoints.push('/api/v2/catalog/items?owned=1&per_page=96')

  for (const ep of endpoints) {
    setSyncStatus(`Lade aktive Listings… (${ep.split('?')[0].split('/').pop()})`)
    const test = await callVintedAPI(`${ep}${ep.includes('?')?'&':'?'}page=1&per_page=1`)
    if (!test) continue
    const hasItems = test.items?.length >= 0 || test.total_items >= 0 || test.catalogItems?.length >= 0
    if (hasItems) {
      console.log('[ListSync] Aktive-Listings-Endpunkt gefunden:', ep)
      // Catalog gibt manchmal catalogItems statt items
      if (test.catalogItems !== undefined) {
        return fetchAllCatalog(ep, 'Aktive Listings')
      }
      return fetchAll(ep, 'Aktive Listings')
    }
  }
  return []
}

async function fetchAllCatalog(baseUrl, label) {
  const items = []
  let page = 1
  while (true) {
    setSyncStatus(`Lade ${label}… Seite ${page}`)
    const sep = baseUrl.includes('?') ? '&' : '?'
    const data = await callVintedAPI(`${baseUrl}${sep}page=${page}&per_page=96`)
    if (!data) break
    const batch = data.catalogItems || data.items || data.data?.items || []
    if (!batch.length) break
    items.push(...batch)
    if (batch.length < 96) break
    page++
    await wait(600)
  }
  return items
}

// Fallback: scrape DOM if API doesn't work
function scrapeSoldDOM() {
  const cards = document.querySelectorAll('[data-testid*="item-"], [class*="ItemCard"], [class*="item-card"]')
  const items = []
  cards.forEach(card => {
    const title = card.querySelector('[class*="title"], h3, h2')?.textContent?.trim()
    const price = card.querySelector('[class*="price"], [data-testid*="price"]')?.textContent?.trim()
    const img   = card.querySelector('img')?.src
    // Try to extract date from card (time element, data-date, aria-label etc.)
    const timeEl = card.querySelector('time')
    const dateStr = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || null
    if (title) {
      const priceNum = parseFloat((price || '0').replace(/[^0-9,.]/g, '').replace(',', '.')) || 0
      items.push({ title, price: priceNum, image: img, dateStr, source: 'dom' })
    }
  })
  return items
}

// ── Normalize items to ListSync format ────────────────────────────────────────

function parseDate(item, fields) {
  for (const f of fields) {
    const val = f.split('.').reduce((o, k) => o?.[k], item)
    if (!val) continue
    // Unix timestamp (Sekunden oder Millisekunden)
    if (typeof val === 'number') {
      const ms = val > 1e10 ? val : val * 1000
      const d = new Date(ms)
      if (!isNaN(d.getTime()) && d.getFullYear() > 2010) return d.toISOString()
    }
    // String
    if (typeof val === 'string') {
      const d = new Date(val)
      if (!isNaN(d.getTime()) && d.getFullYear() > 2010) return d.toISOString()
    }
  }
  return null
}

// Alle realistischen Datumsfelder die Vinted zurückgeben könnte
// Vinted nutzt oft _ts-Suffix für Unix-Timestamps (Sekunden)
const SALE_DATE_FIELDS = [
  'transaction.updated_at_ts', 'transaction.created_at_ts',
  'transaction.updated_at',    'transaction.created_at',
  'transaction.updatedAt',     'transaction.createdAt',
  'active_bid.updated_at_ts',  'active_bid.created_at_ts',
  'active_bid.updated_at',     'active_bid.created_at',
  'shipment.created_at_ts',    'shipment.updated_at_ts',
  'shipment.created_at',       'shipment.updated_at',
  'sold_at_ts', 'sold_at', 'soldAt',
  'closed_at_ts', 'closed_at', 'closedAt',
  'transaction_date', 'transactionDate',
  'last_push_up_at_ts', 'last_push_up_at', 'lastPushUpAt',
  'updated_at_ts', 'updated_at', 'updatedAt',
  'created_at_ts', 'created_at', 'createdAt',
]

const PURCHASE_DATE_FIELDS = [
  'transaction.updated_at_ts', 'transaction.created_at_ts',
  'transaction.updated_at',    'transaction.created_at',
  'transaction.updatedAt',     'transaction.createdAt',
  'bought_at_ts',  'bought_at',  'boughtAt',
  'purchased_at_ts','purchased_at','purchasedAt',
  'payment_date_ts','payment_date','paymentDate',
  'shipment.created_at_ts', 'shipment.created_at',
  'updated_at_ts', 'updated_at', 'updatedAt',
  'created_at_ts', 'created_at', 'createdAt',
]

function normalizeSale(item) {
  return {
    title:       item.title || item.name || '(kein Titel)',
    price:       parseFloat(item.price_numeric || item.price_amount?.amount || item.price || 0),
    buyPrice:    0,
    status:      'verkauft',
    platforms:   ['vinted'],
    images:      item.photos?.map(p => p.url || p.full_size_url || p.src || p.full_size) || [],
    brand:       item.brand?.title || item.brand_title || '',
    size:        item.size?.title  || item.size_title  || '',
    color:       item.color?.title || item.color_title || '',
    condition:   item.status?.title || item.status_title || 'Gut',
    description: item.description || '',
    soldAt:      parseDate(item, SALE_DATE_FIELDS),
    vintedId:    String(item.id || ''),
  }
}

function normalizePurchase(item) {
  return {
    title:       item.title || item.name || '(kein Titel)',
    price:       0,
    buyPrice:    parseFloat(item.price_numeric || item.price_amount?.amount || item.price || 0),
    status:      'inaktiv',
    platforms:   ['vinted'],
    images:      item.photos?.map(p => p.url || p.full_size_url || p.src || p.full_size) || [],
    brand:       item.brand?.title || item.brand_title || '',
    size:        item.size?.title  || item.size_title  || '',
    color:       item.color?.title || item.color_title || '',
    condition:   item.status?.title || item.status_title || 'Gut',
    description: item.description || '',
    boughtAt:    parseDate(item, PURCHASE_DATE_FIELDS),
    vintedId:    String(item.id || ''),
    type:        'purchase',
  }
}

function normalizeActive(item) {
  return {
    title:       item.title || item.name || '(kein Titel)',
    price:       parseFloat(item.price_numeric || item.price_amount?.amount || item.price || 0),
    buyPrice:    0,
    status:      'aktiv',
    platforms:   ['vinted'],
    images:      item.photos?.map(p => p.full_size_url || p.url || p.full_size || p.src || p.thumbnail || '').filter(Boolean) || [],
    brand:       item.brand?.title || item.brand_title || '',
    size:        item.size?.title  || item.size_title  || '',
    color:       item.color?.title || item.color_title || '',
    condition:   item.item_condition?.title || item.condition_title || item.status?.title || 'Gut',
    description: item.description || '',
    vintedId:    String(item.id || ''),
  }
}

// ── Orders page scraper (my_orders?order_type=sold) ──────────────────────────

async function clickAbgeschlossen() {
  await wait(1500)
  const allBtns = [...document.querySelectorAll('button, a, [role="tab"], [role="button"]')]
  const btn = allBtns.find(el => el.textContent.trim() === 'Abgeschlossen')
  if (btn) { btn.click(); await wait(2000); return true }
  return false
}

// Versucht Thumbnail-URL auf volle Auflösung hochzuskalieren
function upscaleVintedImg(url) {
  if (!url || url.startsWith('data:')) return url
  // Vinted: .../thumbs/... oder size params ersetzen
  return url
    .replace(/\/thumbs\//, '/full/')
    .replace(/\/(thumb|small|tiny)\//, '/full/')
    .replace(/[?&](w|width)=\d+/g, '')
    .replace(/[?&](h|height)=\d+/g, '')
    .replace(/[?&]size=\d+/g, '')
    .replace(/\?$/, '')
}

function scrapeOrderCards() {
  const results = []
  const seen = new Set()

  // Anchor: find all text nodes containing "Transaktion erfolgreich beendet"
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const statusNodes = []
  let node
  while ((node = walker.nextNode())) {
    if (node.textContent.includes('Transaktion erfolgreich beendet')) {
      statusNodes.push(node.parentElement)
    }
  }

  for (const statusEl of statusNodes) {
    // Walk up to find the card container (has image + price)
    let card = statusEl
    for (let i = 0; i < 8; i++) {
      if (card?.querySelector?.('img') && /\d+[,.]\d+\s*€/.test(card.textContent)) break
      card = card?.parentElement
    }
    if (!card || seen.has(card)) continue
    seen.add(card)

    // Bild: versuche srcset für höhere Auflösung, dann src
    const imgEl = card.querySelector('img')
    const srcset = imgEl?.srcset || imgEl?.getAttribute('srcset') || ''
    const bestSrc = srcset
      ? srcset.split(',').map(s => s.trim().split(' ')).sort((a,b) => parseFloat(b[1]||0) - parseFloat(a[1]||0))[0]?.[0]
      : null
    const img = upscaleVintedImg(bestSrc || imgEl?.src || '')
    const priceMatch = card.textContent.match(/(\d+[,.]\d+)\s*€/)
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0

    // Title: h2/h3/strong, or longest text node that isn't price/status
    let title = ''
    const headings = card.querySelectorAll('h1,h2,h3,h4,strong,[class*="title"],[class*="Title"],[class*="name"],[class*="Name"]')
    for (const h of headings) {
      const t = h.textContent.trim()
      if (t && t.length > 3 && !t.includes('€') && !t.includes('Transaktion') && !t.includes('Bestellung')) {
        title = t; break
      }
    }
    // Fallback: first substantial text node
    if (!title) {
      const textNodes = [...card.querySelectorAll('*')]
        .filter(el => el.children.length === 0)
        .map(el => el.textContent.trim())
        .filter(t => t.length > 5 && !t.includes('€') && !t.includes('Transaktion') && !t.includes('Bestellung') && !/^\d/.test(t))
      title = textNodes[0] || '(kein Titel)'
    }

    // Date: time element or data attribute
    const timeEl = card.querySelector('time')
    const soldAt = timeEl?.getAttribute('datetime') || timeEl?.dateTime || null

    // VintedId from link href e.g. /orders/12345 or /my_orders/12345
    const link = card.querySelector('a[href*="/orders/"], a[href*="/my_orders/"]')
    const vintedId = link?.href?.match(/\/(\d+)(?:\/|$)/)?.[1] || ''
    console.log('[ListSync DOM]', { title: title.slice(0,30), vintedId, linkHref: link?.href })

    results.push({ title, price, images: img ? [img] : [], soldAt, vintedId, status: 'verkauft' })
  }

  return results
}

async function scrapeAllOrdersWithScroll() {
  let lastCount = 0
  let noChange = 0
  while (noChange < 3) {
    window.scrollTo(0, document.body.scrollHeight)
    await wait(1800)
    const count = scrapeOrderCards().length
    if (count === lastCount) noChange++
    else { noChange = 0; lastCount = count }
    setSyncStatus(`Lade… ${lastCount} Verkäufe gefunden`)
  }
  return scrapeOrderCards()
}

async function runOrdersSync(activeVintedAccount) {
  showSyncBanner('Lese abgeschlossene Verkäufe…')

  // Click "Abgeschlossen" tab
  setSyncStatus('Klicke "Abgeschlossen"…')
  const clicked = await clickAbgeschlossen()
  if (!clicked) setSyncStatus('Tab nicht gefunden – lese alle Bestellungen…')

  // Scrape all completed sales
  setSyncStatus('Scrape Verkäufe…')
  const rawSales = await scrapeAllOrdersWithScroll()
  console.log('[ListSync] DOM Verkäufe:', rawSales.length, rawSales[0])

  // API-Datums-Lookup parallel holen
  setSyncStatus('Hole Verkaufsdaten…')
  const dateMap = await fetchOrderDates()
  console.log('[ListSync] Datums-Map:', Object.keys(dateMap).length, 'Einträge')

  // Normalize + Datum aus API-Map einsetzen falls DOM kein Datum hatte
  const sales = rawSales.map(item => {
    const dateFromApi = dateMap[item.vintedId] || dateMap[item.title.toLowerCase().trim()]
    return {
      title:       item.title,
      price:       item.price,
      buyPrice:    0,
      status:      'verkauft',
      platforms:   ['vinted'],
      images:      item.images,
      brand:       '',
      size:        '',
      color:       '',
      condition:   'Gut',
      description: '',
      soldAt:      item.soldAt || dateFromApi || null,
      vintedId:    item.vintedId,
    }
  })

  // Also fetch active listings from API
  setSyncStatus('Lade aktive Listings…')
  const userId = await getCurrentUserId()
  const rawActive = await fetchAllActive(userId)
  const listings = rawActive.map(normalizeActive)

  setSyncStatus(`${sales.length} Verkäufe + ${listings.length} aktive Listings – importiere…`)
  await wait(500)

  chrome.runtime.sendMessage({
    type: 'VINTED_SYNC_DATA',
    data: { sales, purchases: [], listings, account: activeVintedAccount || 'Hauptaccount' }
  }, response => {
    if (response?.ok) {
      setSyncStatus(`✅ ${sales.length} Verkäufe & ${listings.length} aktive Listings importiert!`)
      const banner = document.getElementById('ls-sync-banner')
      if (banner) banner.style.background = '#16a34a'
    } else {
      setSyncStatus('⚠️ Import fehlgeschlagen – bitte erneut versuchen')
      const banner = document.getElementById('ls-sync-banner')
      if (banner) banner.style.background = '#dc2626'
    }
  })
}

// ── Main sync ─────────────────────────────────────────────────────────────────

async function runSync() {
  const { syncRequested } = await new Promise(r => chrome.storage.local.get('syncRequested', r))
  if (!syncRequested) return
  await chrome.storage.local.remove('syncRequested')

  const { activeVintedAccount } = await new Promise(r => chrome.storage.local.get('activeVintedAccount', r))

  // Auf der Bestellungsseite → neuer DOM-Scraper
  if (location.pathname.includes('/my_orders')) {
    await runOrdersSync(activeVintedAccount)
    return
  }

  showSyncBanner(`Verbinde mit Vinted${activeVintedAccount ? ' (' + activeVintedAccount + ')' : ''}…`)
  await wait(1000)

  // Schritt 1: User-ID ermitteln (wichtig für userId-basierte Endpunkte)
  setSyncStatus('Ermittle Vinted-Account…')
  const userId = await getCurrentUserId()
  console.log('[ListSync] User-ID:', userId)

  // Schritt 2: Verkäufe laden
  setSyncStatus('Lade Verkäufe…')
  let rawSales = await fetchAllSales(userId)
  if (rawSales.length > 0) {
    console.log('[ListSync DEBUG] Erstes Verkauf-Item:', JSON.stringify(rawSales[0], null, 2))
  }
  let sales = rawSales.map(normalizeSale)

  // Fallback: DOM scraping for sales if API returned nothing
  if (!sales.length) {
    setSyncStatus('Lese Seite aus (Fallback)…')
    await wait(1000)
    const domItems = scrapeSoldDOM()
    sales = domItems.map(item => ({
      title: item.title, price: item.price, buyPrice: 0,
      status: 'verkauft', platforms: ['vinted'], images: item.image ? [item.image] : [],
      brand: '', size: '', color: '', condition: 'Gut', description: '',
      soldAt: new Date().toISOString(), vintedId: '',
    }))
  }

  // Schritt 3: Aktive Listings laden
  setSyncStatus('Lade aktive Listings…')
  let rawActive = await fetchAllActive(userId)
  let listings = rawActive.map(normalizeActive)
  console.log('[ListSync] Aktive Listings:', listings.length)

  // Schritt 4: Einkäufe laden
  setSyncStatus('Lade Einkäufe…')
  let rawPurchases = await fetchAllPurchases(userId)
  let purchases = rawPurchases.map(normalizePurchase)

  setSyncStatus(`${sales.length} Verkäufe, ${listings.length} aktive, ${purchases.length} Einkäufe – importiere…`)
  await wait(500)

  // Send to background.js → /api/import
  chrome.runtime.sendMessage({
    type: 'VINTED_SYNC_DATA',
    data: {
      sales,
      purchases,
      listings,
      account: activeVintedAccount || 'Hauptaccount',
    }
  }, response => {
    if (response?.ok) {
      setSyncStatus(`✅ ${sales.length} Verkäufe, ${listings.length} aktive Listings & ${purchases.length} Einkäufe importiert!`)
      const banner = document.getElementById('ls-sync-banner')
      if (banner) banner.style.background = '#16a34a'
    } else {
      setSyncStatus('⚠️ Import fehlgeschlagen – bitte erneut versuchen')
      const banner = document.getElementById('ls-sync-banner')
      if (banner) banner.style.background = '#dc2626'
    }
  })
}

// Run after page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(runSync, 1500))
} else {
  setTimeout(runSync, 1500)
}
