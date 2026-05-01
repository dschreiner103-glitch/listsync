'use strict'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getListing() {
  return new Promise(resolve =>
    chrome.storage.local.get('pendingListing', r => resolve(r.pendingListing || null))
  )
}

const wait = ms => new Promise(r => setTimeout(r, ms))

function setNativeValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input',  { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('blur',   { bubbles: true }))
}

function waitFor(selectors, timeout = 15000) {
  const sels = Array.isArray(selectors) ? selectors : [selectors]
  return new Promise((resolve, reject) => {
    const find = () => {
      for (const s of sels) {
        try { const el = document.querySelector(s); if (el) return el } catch {}
      }
      return null
    }
    const found = find()
    if (found) return resolve(found)
    const ob = new MutationObserver(() => {
      const el = find()
      if (el) { ob.disconnect(); clearTimeout(tid); resolve(el) }
    })
    ob.observe(document.body, { childList: true, subtree: true, attributes: true })
    const tid = setTimeout(() => { ob.disconnect(); reject(new Error('Timeout: ' + sels[0])) }, timeout)
  })
}

// Find input by nearby label text (fallback)
function findByLabel(text) {
  for (const l of document.querySelectorAll('label')) {
    if (l.textContent.toLowerCase().includes(text.toLowerCase())) {
      if (l.htmlFor) { const el = document.getElementById(l.htmlFor); if (el) return el }
      const el = l.querySelector('input, textarea') || l.parentElement?.querySelector('input, textarea')
      if (el) return el
    }
  }
  return null
}

// ── Banner ────────────────────────────────────────────────────────────────────

function showBanner(listing, accountName) {
  if (document.getElementById('ls-banner')) return
  const d = document.createElement('div')
  d.id = 'ls-banner'
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#4f46e5;color:#fff;font-family:sans-serif;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 3px 16px rgba(0,0,0,.4)'
  d.innerHTML = `
    <span style="font-size:20px">🔗</span>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:13px">ListSync${accountName ? ' · ' + accountName : ''}</div>
      <div id="ls-status" style="font-size:11px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${listing.title} · ${listing.price} €</div>
    </div>
    <button onclick="document.getElementById('ls-banner').remove();document.body.style.paddingTop=''"
      style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600">✕</button>
  `
  document.body.prepend(d)
  document.body.style.paddingTop = '54px'
}

function setStatus(msg, done = false) {
  const el = document.getElementById('ls-status')
  if (el) el.textContent = msg
  if (done) {
    const b = document.getElementById('ls-banner')
    if (b) b.style.background = '#16a34a'
  }
  console.log('[ListSync]', msg)
}

// ── Fill helpers ──────────────────────────────────────────────────────────────

async function fillField(selectors, value, labelHint, name) {
  if (value === undefined || value === null || value === '') return false
  try {
    let el = null
    try { el = await waitFor(selectors, 7000) } catch {}
    if (!el && labelHint) el = findByLabel(labelHint)
    if (!el) { console.warn('[ListSync] Nicht gefunden:', name); return false }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await wait(200)
    el.focus()
    await wait(100)
    setNativeValue(el, String(value))
    await wait(200)
    // Retry once if value didn't stick
    if (el.value !== String(value)) {
      el.focus(); setNativeValue(el, String(value)); await wait(200)
    }
    setStatus('✓ ' + name)
    return true
  } catch(e) {
    console.warn('[ListSync] Fehler bei', name, e.message)
    return false
  }
}

async function fillAutocomplete(selectors, value, labelHint, name) {
  if (!value) return false
  try {
    let el = null
    try { el = await waitFor(selectors, 7000) } catch {}
    if (!el && labelHint) el = findByLabel(labelHint)
    if (!el) { console.warn('[ListSync] Nicht gefunden:', name); return false }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await wait(200)
    el.focus()
    setNativeValue(el, value)
    await wait(1200) // wait for dropdown to appear

    // Click first visible option
    const optSels = [
      '[role="option"]:not([aria-disabled="true"])',
      '[class*="suggestion"] li:first-child',
      '[class*="autocomplete"] li:first-child',
      '[class*="dropdown"] [role="option"]:first-child',
      '[class*="Dropdown"] li:first-child',
    ]
    for (const s of optSels) {
      const opt = document.querySelector(s)
      if (opt && opt.offsetParent !== null) { opt.click(); await wait(300); break }
    }
    setStatus('✓ ' + name)
    return true
  } catch(e) {
    console.warn('[ListSync] Autocomplete Fehler:', name, e.message)
    return false
  }
}

// ── Kategorie-Auswahl (mehrstufiges Klick-Menü) ───────────────────────────────

// Mapping ListSync-Kategorien → Vinted Klick-Pfad
// Muss zu den Werten in components/Badge.js CATEGORIES passen
const CATEGORY_MAP = {
  'Damen – Kleidung':             ['Damen', 'Kleidung'],
  'Damen – Schuhe':               ['Damen', 'Schuhe'],
  'Damen – Taschen & Accessoires':['Damen', 'Taschen & Geldbörsen'],
  'Herren – Kleidung':            ['Herren', 'Kleidung'],
  'Herren – Schuhe':              ['Herren', 'Schuhe'],
  'Herren – Accessoires':         ['Herren', 'Accessoires'],
  'Kinder – Kleidung':            ['Kinder'],
  'Kinder – Schuhe':              ['Kinder', 'Schuhe'],
  'Kinder – Spielzeug':           ['Kinder', 'Spielzeug'],
  'Elektronik & Gadgets':         ['Unterhaltung', 'Elektronik'],
  'Handys & Tablets':             ['Unterhaltung', 'Handys'],
  'Computer & Laptops':           ['Unterhaltung', 'Computer & Laptops'],
  'Sport & Outdoor':              ['Sport'],
  'Haushalt & Garten':            ['Haus & Garten'],
  'Bücher & Medien':              ['Unterhaltung', 'Bücher'],
  'Schmuck & Uhren':              ['Damen', 'Schmuck & Uhren'],
  'Kosmetik & Pflege':            ['Damen', 'Beauty'],
  'Sonstiges':                    [], // offen lassen
}

async function clickOption(text) {
  // Sucht sichtbare Option mit passendem Text und klickt sie
  const sels = [
    '[role="option"]', '[role="menuitem"]', '[role="listitem"]',
    'li', 'button', '[class*="item"]', '[class*="option"]',
  ]
  for (const s of sels) {
    for (const el of document.querySelectorAll(s)) {
      if (el.offsetParent !== null && el.textContent.trim().toLowerCase().includes(text.toLowerCase())) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        await wait(200)
        el.click()
        await wait(700)
        return true
      }
    }
  }
  return false
}

async function fillCategory(category) {
  if (!category || category === 'Sonstiges') return false

  const path = CATEGORY_MAP[category] || category.split('/').map(s => s.trim()).filter(Boolean)
  if (!path.length) return false

  try {
    // Dropdown-Trigger finden: Element mit "Wähle eine Kategorie" oder ähnlichem Text
    let trigger = null
    for (const el of document.querySelectorAll('*')) {
      const t = el.textContent?.trim()
      if (
        el.offsetParent !== null &&
        el.children.length <= 3 &&  // kein Container mit vielen Kindern
        (t === 'Wähle eine Kategorie' || t === 'Kategorie wählen' || t === 'Select category')
      ) {
        trigger = el
        break
      }
    }
    // Fallback: data-testid oder class
    if (!trigger) {
      const fbSels = [
        '[data-testid*="category"]', '[class*="CategorySelect"]',
        '[class*="category-select"]', 'select[name*="category"]',
      ]
      for (const s of fbSels) { trigger = document.querySelector(s); if (trigger) break }
    }

    if (!trigger) { console.warn('[ListSync] Kategorie-Trigger nicht gefunden'); return false }

    trigger.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await wait(300)
    trigger.click()
    await wait(900)

    // Durch Pfadschritte klicken
    for (const step of path) {
      setStatus(`Kategorie: ${step}…`)
      const found = await clickOption(step)
      if (!found) { console.warn('[ListSync] Kategorie-Schritt nicht gefunden:', step); break }
    }

    setStatus('✓ Kategorie')
    return true
  } catch(e) {
    console.warn('[ListSync] Kategorie Fehler:', e.message)
    return false
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function fill() {
  await wait(2500) // Vinted React braucht Zeit zum Booten

  const listing = await getListing()
  if (!listing) return

  const { activeVintedAccount } = await new Promise(r => chrome.storage.local.get('activeVintedAccount', r))
  showBanner(listing, activeVintedAccount)
  setStatus('Starte…')
  await wait(500)

  // Titel
  await fillField([
    'input[data-testid="item-title-input"]',
    'input[data-testid="upload-form-title-field"]',
    'input[data-testid="title"]',
    'input#title', 'input[name="title"]',
    'input[placeholder*="Titel"]',
    'input[placeholder*="title"]',
    'input[placeholder*="Name des Artikels"]',
    'input[placeholder*="Artikelname"]',
  ], listing.title.substring(0, 60), 'titel', 'Titel')
  await wait(400)

  // Beschreibung
  await fillField([
    'textarea[data-testid="item-description-input"]',
    'textarea[data-testid="upload-form-description-field"]',
    'textarea[data-testid="description"]',
    'textarea#description', 'textarea[name="description"]',
    'textarea[placeholder*="Beschreibung"]',
    'textarea[placeholder*="description"]',
    'textarea[placeholder*="Artikelbeschreibung"]',
  ], listing.description || '', 'beschreibung', 'Beschreibung')
  await wait(400)

  // Preis
  await fillField([
    'input[data-testid="item-price-input"]',
    'input[data-testid="upload-form-price-field"]',
    'input[data-testid="price"]',
    'input#price', 'input[name="price"]',
    'input[placeholder*="Preis"]',
    'input[placeholder*="price"]',
    'input[type="number"]',
  ], String(listing.price).replace('.', ','), 'preis', 'Preis')
  await wait(400)

  // Kategorie
  if (listing.category) {
    await fillCategory(listing.category)
    await wait(600)
  }

  // Marke
  if (listing.brand) {
    await fillAutocomplete([
      'input[data-testid="item-brand-input"]',
      'input[data-testid="brand-input"]',
      'input[data-testid="upload-form-brand-field"]',
      'input#brand', 'input[name="brand"]',
      'input[placeholder*="Marke"]',
      'input[placeholder*="brand"]',
      'input[placeholder*="Brand"]',
    ], listing.brand, 'marke', 'Marke')
    await wait(500)
  }

  // Größe
  if (listing.size) {
    await fillAutocomplete([
      'input[data-testid="item-size-input"]',
      'input[data-testid="size-input"]',
      'input[data-testid="upload-form-size-field"]',
      'input#size', 'input[name="size"]',
      'input[placeholder*="Größe"]',
      'input[placeholder*="size"]',
    ], listing.size, 'größe', 'Größe')
    await wait(500)
  }

  // Farbe
  if (listing.color) {
    await fillAutocomplete([
      'input[data-testid="item-color-input"]',
      'input[data-testid="color-input"]',
      'input[data-testid="upload-form-color-field"]',
      'input#color', 'input[name="color"]',
      'input[placeholder*="Farbe"]',
      'input[placeholder*="color"]',
    ], listing.color, 'farbe', 'Farbe')
    await wait(500)
  }

  setStatus('✅ Felder fertig – Bilder werden geladen…')
  await wait(4000) // Bilder kommen von background.js via MAIN-World
  setStatus('✅ Fertig! Bitte prüfen und absenden.', true)
  await chrome.storage.local.remove('pendingListing')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fill)
} else {
  fill()
}
