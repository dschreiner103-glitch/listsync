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

// ── Fetch Vinted API with session cookies (content script has page cookies) ──

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

// ── Parse sold items ──────────────────────────────────────────────────────────

// Vinted API endpoint candidates (their internal API changes sometimes)
const SALES_ENDPOINTS = [
  '/api/v2/current_user/sold_items',
  '/api/v2/users/current/sold_items',
  '/api/v2/items?status[]=2&owned=1',         // status 2 = sold
  '/api/v2/items?order=newest_first&owned=1&status[]=sold',
]
const PURCHASE_ENDPOINTS = [
  '/api/v2/current_user/bought_items',
  '/api/v2/users/current/bought_items',
  '/api/v2/transactions?type=buy',
]

async function tryEndpoints(endpoints, label) {
  for (const ep of endpoints) {
    setSyncStatus(`Lade ${label}…`)
    const data = await callVintedAPI(`${ep}?page=1&per_page=1`)
    if (data && (data.items || data.data?.items || data.transactions)) {
      return ep // found working endpoint
    }
  }
  return null
}

async function fetchAll(endpoint, label) {
  const items = []
  let page = 1
  while (true) {
    setSyncStatus(`Lade ${label}… Seite ${page}`)
    const data = await callVintedAPI(`${endpoint}?page=${page}&per_page=50`)
    if (!data) break
    // Vinted wraps items differently depending on endpoint
    const batch = data.items || data.data?.items || data.transactions || data.orders || []
    if (!batch.length) break
    // Flatten nested item if transaction wraps it
    const flat = batch.map(entry => {
      if (entry.item) {
        // Merge transaction-level date fields onto the item
        return {
          ...entry.item,
          transaction: entry,
          sold_at:  entry.updated_at || entry.created_at || entry.sold_at,
          bought_at: entry.updated_at || entry.created_at || entry.bought_at,
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

async function fetchAllSales() {
  const ep = await tryEndpoints(SALES_ENDPOINTS, 'Verkäufe')
  if (!ep) return []
  return fetchAll(ep, 'Verkäufe')
}

async function fetchAllPurchases() {
  const ep = await tryEndpoints(PURCHASE_ENDPOINTS, 'Einkäufe')
  if (!ep) return []
  return fetchAll(ep, 'Einkäufe')
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

// Alle realistischen Datumsfelder die Vinted zurückgeben könnte (snake_case + camelCase)
const SALE_DATE_FIELDS = [
  'transaction.updated_at', 'transaction.created_at',
  'transaction.updatedAt', 'transaction.createdAt',
  'active_bid.updated_at', 'active_bid.created_at',
  'shipment.created_at', 'shipment.updated_at',
  'sold_at', 'soldAt',
  'closed_at', 'closedAt',
  'transaction_date', 'transactionDate',
  'last_push_up_at', 'lastPushUpAt',
  'updated_at', 'updatedAt',
  'created_at', 'createdAt',
]

const PURCHASE_DATE_FIELDS = [
  'transaction.updated_at', 'transaction.created_at',
  'transaction.updatedAt', 'transaction.createdAt',
  'bought_at', 'boughtAt',
  'purchased_at', 'purchasedAt',
  'payment_date', 'paymentDate',
  'shipment.created_at',
  'updated_at', 'updatedAt',
  'created_at', 'createdAt',
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

// ── Main sync ─────────────────────────────────────────────────────────────────

async function runSync() {
  const { syncRequested } = await new Promise(r => chrome.storage.local.get('syncRequested', r))
  if (!syncRequested) return
  await chrome.storage.local.remove('syncRequested')

  const { activeVintedAccount } = await new Promise(r => chrome.storage.local.get('activeVintedAccount', r))
  showSyncBanner(`Verbinde mit Vinted${activeVintedAccount ? ' (' + activeVintedAccount + ')' : ''}…`)
  await wait(1000)

  // Try API first
  setSyncStatus('Lade Verkäufe…')
  let rawSales = await fetchAllSales()
  let sales = rawSales.map(normalizeSale)

  setSyncStatus('Lade Einkäufe…')
  let rawPurchases = await fetchAllPurchases()
  let purchases = rawPurchases.map(normalizePurchase)

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

  setSyncStatus(`${sales.length} Verkäufe, ${purchases.length} Einkäufe gefunden – importiere…`)
  await wait(500)

  // Send to background.js → /api/import
  chrome.runtime.sendMessage({
    type: 'VINTED_SYNC_DATA',
    data: {
      sales,
      purchases,
      account: activeVintedAccount || 'Hauptaccount',
    }
  }, response => {
    if (response?.ok) {
      setSyncStatus(`✅ ${sales.length} Verkäufe & ${purchases.length} Einkäufe importiert!`)
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
