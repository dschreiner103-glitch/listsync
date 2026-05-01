'use strict'
// Läuft auf vinted.de/member/sold-items und /member/orders
// Scrapt Verkäufe und Käufe und sendet sie an background.js

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

async function fetchAllSales() {
  const items = []
  let page = 1
  while (true) {
    setSyncStatus(`Lade Verkäufe… Seite ${page}`)
    const data = await callVintedAPI(`/api/v2/current_user/sold_items?page=${page}&per_page=50`)
    if (!data) break
    const batch = data.items || data.data?.items || []
    if (!batch.length) break
    items.push(...batch)
    if (batch.length < 50) break
    page++
    await wait(500)
  }
  return items
}

async function fetchAllPurchases() {
  const items = []
  let page = 1
  while (true) {
    setSyncStatus(`Lade Einkäufe… Seite ${page}`)
    const data = await callVintedAPI(`/api/v2/current_user/bought_items?page=${page}&per_page=50`)
    if (!data) break
    const batch = data.items || data.data?.items || []
    if (!batch.length) break
    items.push(...batch)
    if (batch.length < 50) break
    page++
    await wait(500)
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
    if (title) {
      const priceNum = parseFloat((price || '0').replace(/[^0-9,.]/g, '').replace(',', '.')) || 0
      items.push({ title, price: priceNum, image: img, source: 'dom' })
    }
  })
  return items
}

// ── Normalize items to ListSync format ────────────────────────────────────────

function normalizeSale(item) {
  return {
    title:       item.title || item.name || '(kein Titel)',
    price:       parseFloat(item.price_numeric || item.price || 0),
    buyPrice:    0,
    status:      'verkauft',
    platforms:   ['vinted'],
    images:      item.photos?.map(p => p.url || p.full_size_url || p.src) || [],
    brand:       item.brand?.title || item.brand_title || '',
    size:        item.size?.title || item.size_title || '',
    color:       item.color?.title || item.color_title || '',
    condition:   item.status?.title || item.status_title || 'Gut',
    description: item.description || '',
    soldAt:      item.active_bid?.updated_at || item.updated_at || new Date().toISOString(),
    vintedId:    String(item.id || ''),
  }
}

function normalizePurchase(item) {
  return {
    title:       item.title || item.name || '(kein Titel)',
    price:       0,
    buyPrice:    parseFloat(item.price_numeric || item.price || 0),
    status:      'inaktiv',
    platforms:   ['vinted'],
    images:      item.photos?.map(p => p.url || p.full_size_url || p.src) || [],
    brand:       item.brand?.title || item.brand_title || '',
    size:        item.size?.title || item.size_title || '',
    color:       item.color?.title || item.color_title || '',
    condition:   item.status?.title || item.status_title || 'Gut',
    description: item.description || '',
    boughtAt:    item.updated_at || new Date().toISOString(),
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
