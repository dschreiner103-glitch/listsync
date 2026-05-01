'use strict'

async function getListing() {
  return new Promise(resolve =>
    chrome.storage.local.get('pendingListing', r => resolve(r.pendingListing || null))
  )
}

function fillReact(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, value)
  el.dispatchEvent(new Event('input',  { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('blur',   { bubbles: true }))
}

function waitFor(selectors, timeout = 20000) {
  const sels = Array.isArray(selectors) ? selectors : [selectors]
  return new Promise((resolve, reject) => {
    for (const s of sels) { const el = document.querySelector(s); if (el) return resolve(el) }
    const ob = new MutationObserver(() => {
      for (const s of sels) { const el = document.querySelector(s); if (el) { ob.disconnect(); return resolve(el) } }
    })
    ob.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { ob.disconnect(); reject(new Error('Timeout')) }, timeout)
  })
}

const wait = ms => new Promise(r => setTimeout(r, ms))

function showBanner(listing, accountName) {
  if (document.getElementById('ls-banner')) return
  const d = document.createElement('div')
  d.id = 'ls-banner'
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#4f46e5;color:#fff;font-family:sans-serif;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 3px 16px rgba(0,0,0,.4)'
  d.innerHTML = `
    <span style="font-size:20px">🔗</span>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:13px">ListSync${accountName ? ' · ' + accountName : ''} – wird ausgefüllt…</div>
      <div style="font-size:11px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${listing.title} · ${listing.price} €</div>
    </div>
    <button onclick="document.getElementById('ls-banner').remove();document.body.style.paddingTop=''"
      style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600">✕</button>
  `
  document.body.prepend(d)
  document.body.style.paddingTop = '54px'
}

async function fillAutocomplete(selectors, value) {
  try {
    const el = await waitFor(selectors, 6000)
    await wait(300)
    fillReact(el, value)
    await wait(900)
    const opt = document.querySelector('[role="option"], [class*="suggestion"] li, [class*="autocomplete"] li')
    if (opt) opt.click()
  } catch {}
}

async function fill() {
  await wait(1500)
  const listing = await getListing()
  if (!listing) return

  const { activeVintedAccount } = await new Promise(r => chrome.storage.local.get('activeVintedAccount', r))
  showBanner(listing, activeVintedAccount)

  // Titel
  try {
    const el = await waitFor([
      'input[data-testid="item-title-input"]',
      'input#title', 'input[name="title"]',
      'input[placeholder*="Titel"]', 'input[placeholder*="title"]',
    ])
    await wait(400); fillReact(el, listing.title.substring(0, 60))
    console.log('[ListSync] ✓ Titel')
  } catch(e) { console.warn('[ListSync] Titel:', e.message) }

  // Beschreibung
  try {
    const el = await waitFor([
      'textarea[data-testid="item-description-input"]',
      'textarea#description', 'textarea[name="description"]',
      'textarea[placeholder*="Beschreibung"]',
    ])
    await wait(300); fillReact(el, listing.description || '')
    console.log('[ListSync] ✓ Beschreibung')
  } catch(e) { console.warn('[ListSync] Beschreibung:', e.message) }

  // Preis
  try {
    const el = await waitFor([
      'input[data-testid="item-price-input"]',
      'input#price', 'input[name="price"]',
      'input[placeholder*="Preis"]', 'input[placeholder*="price"]',
    ])
    await wait(300); fillReact(el, String(listing.price).replace('.', ','))
    console.log('[ListSync] ✓ Preis')
  } catch(e) { console.warn('[ListSync] Preis:', e.message) }

  // Marke
  if (listing.brand) {
    await fillAutocomplete([
      'input[data-testid="brand-input"]',
      'input[placeholder*="Marke"]', 'input[placeholder*="Brand"]', 'input[name="brand"]',
    ], listing.brand)
    console.log('[ListSync] ✓ Marke')
  }

  // Größe
  if (listing.size) {
    await fillAutocomplete([
      'input[data-testid="size-input"]',
      'input[placeholder*="Größe"]', 'input[placeholder*="size"]', 'input[name="size"]',
    ], listing.size)
    console.log('[ListSync] ✓ Größe')
  }

  // Farbe
  if (listing.color) {
    await fillAutocomplete([
      'input[data-testid="color-input"]',
      'input[placeholder*="Farbe"]', 'input[placeholder*="color"]', 'input[name="color"]',
    ], listing.color)
    console.log('[ListSync] ✓ Farbe')
  }

  console.log('[ListSync] ✓ Felder fertig – Bilder kommen via MAIN-World')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fill)
} else {
  fill()
}
