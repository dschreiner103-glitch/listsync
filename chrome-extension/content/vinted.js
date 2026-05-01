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
// Top-Level auf Vinted: Damen, Herren, Kinder, Home, Elektronik
const CATEGORY_MAP = {
  'Damen – Kleidung':             ['Damen', 'Kleidung'],
  'Damen – Schuhe':               ['Damen', 'Schuhe'],
  'Damen – Taschen & Accessoires':['Damen', 'Taschen'],
  'Herren – Kleidung':            ['Herren', 'Kleidung'],
  'Herren – Schuhe':              ['Herren', 'Schuhe'],
  'Herren – Accessoires':         ['Herren', 'Accessoires'],
  'Kinder – Kleidung':            ['Kinder', 'Kleidung'],
  'Kinder – Schuhe':              ['Kinder', 'Schuhe'],
  'Kinder – Spielzeug':           ['Kinder', 'Spielzeug'],
  'Elektronik & Gadgets':         ['Elektronik'],
  'Handys & Tablets':             ['Elektronik', 'Handys'],
  'Computer & Laptops':           ['Elektronik', 'Computer'],
  'Sport & Outdoor':              ['Sport'],
  'Haushalt & Garten':            ['Home'],
  'Bücher & Medien':              ['Unterhaltung', 'Bücher'],
  'Schmuck & Uhren':              ['Damen', 'Schmuck'],
  'Kosmetik & Pflege':            ['Damen', 'Beauty'],
  'Sonstiges':                    [],
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

// Klickt ein Vinted-Katalog-Item per id="catalog-N" (goldener Selektor)
async function clickCatalogItem(text) {
  // Alle sichtbaren catalog-* Elemente (Vinted-spezifisch, kein Navbar-Treffer)
  const items = document.querySelectorAll('[id^="catalog-"]:not(#catalog-search-input)')
  const target = text.toLowerCase().trim()

  // 1. Exakter Match
  for (const el of items) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const t = (el.innerText || el.textContent || '').trim()
    if (t.toLowerCase() === target) {
      console.log('[ListSync] ✓ catalog-item exakt:', el.id, '"' + t + '"')
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      await wait(200)
      el.click()
      await wait(1200)
      return true
    }
  }
  // 2. Startswith-Match (z.B. "Kleidung" trifft "Kleidung & Accessoires")
  for (const el of items) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const t = (el.innerText || el.textContent || '').trim().toLowerCase()
    if (t.startsWith(target) || target.startsWith(t)) {
      console.log('[ListSync] ✓ catalog-item partial:', el.id, '"' + t + '"')
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      await wait(200)
      el.click()
      await wait(1200)
      return true
    }
  }
  // Debug: alle sichtbaren catalog-Items ausgeben
  const visible = [...items]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
    .map(e => `${e.id}: "${(e.innerText||'').trim().substring(0,30)}"`)
  console.log('[ListSync] catalog-Items (kein Treffer für "' + text + '"):', visible)
  return false
}

// Findet und klickt das Element mit dem passendsten Text unter allen sichtbaren Elementen
// Fallback für nicht-Katalog-Dropdowns
async function findAndClickText(text) {
  const all = document.querySelectorAll(
    'li, ul > *, [role="option"], [role="menuitem"], [role="radio"], ' +
    'button, a, label, div[tabindex], span[tabindex], ' +
    '[class*="item"], [class*="Item"], [class*="option"], [class*="Option"], ' +
    '[class*="cell"], [class*="Cell"], [class*="row"], [class*="Row"]'
  )

  const candidates = []
  for (const el of all) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const raw = (el.innerText || el.textContent || '').trim()
    if (!raw) continue
    const firstLine = raw.split('\n')[0].trim()
    const lower = firstLine.toLowerCase()
    const target = text.toLowerCase()

    if (firstLine === text) { candidates.push({ el, score: 1 }); continue }
    if (lower === target)   { candidates.push({ el, score: 2 }); continue }
    if (lower.startsWith(target + ' ') || lower.endsWith(' ' + target)) {
      candidates.push({ el, score: 3 }); continue
    }
    if (lower.includes(target) && firstLine.length < text.length + 30) {
      candidates.push({ el, score: 4 }); continue
    }
  }

  if (!candidates.length) {
    const visible = []
    for (const el of all) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) {
        const t = (el.innerText || el.textContent || '').trim().substring(0, 40)
        if (t) visible.push(`${el.tagName}: "${t}"`)
      }
    }
    console.log('[ListSync] Kein Treffer für "' + text + '":', visible.slice(0, 20))
    return false
  }

  candidates.sort((a, b) => a.score - b.score)
  const { el } = candidates[0]
  console.log('[ListSync] Klicke:', el.tagName, '"' + (el.innerText || '').trim().substring(0, 30) + '"')
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  await wait(300)
  el.click()
  await wait(1200)
  return true
}

async function fillCategory(category) {
  if (!category || category === 'Sonstiges') return false

  const path = CATEGORY_MAP[category] || category.split('/').map(s => s.trim()).filter(Boolean)
  if (!path.length) return false

  try {
    // Dropdown-Trigger finden
    let trigger = null

    // 1. Gezielte data-testid Selektoren
    const fbSels = [
      '[data-testid*="category"]', '[data-testid*="Category"]',
      '[class*="CategorySelect"]', '[class*="category-select"]',
      'select[name*="category"]', 'button[class*="category"]',
      '[aria-label*="ategorie"]',
    ]
    for (const s of fbSels) { trigger = document.querySelector(s); if (trigger) break }

    // 2. XPath – exakten Text suchen
    if (!trigger) {
      for (const phrase of ['Wähle eine Kategorie', 'Kategorie wählen', 'Select category', 'Kategorie']) {
        try {
          const res = document.evaluate(
            `//*[normalize-space(.)="${phrase}"] | //*[@placeholder="${phrase}"]`,
            document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
          )
          if (res.singleNodeValue) { trigger = res.singleNodeValue; break }
        } catch {}
      }
    }

    // 3. Letzter Fallback: beliebiges Element das "Kategorie" enthält
    if (!trigger) {
      for (const el of document.querySelectorAll('button, [role="button"], div[class*="select"], div[class*="Select"]')) {
        if ((el.innerText || el.textContent || '').includes('Kategorie')) {
          trigger = el; break
        }
      }
    }

    if (!trigger) { console.warn('[ListSync] Kategorie-Trigger nicht gefunden'); return false }

    trigger.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await wait(400)
    trigger.click()
    await wait(1500)  // mehr Zeit für React-Render

    // Suchbox leeren (damit kein vorheriger Text filtert)
    const searchBox = document.querySelector(
      'input[type="search"], input[placeholder*="Finde"], input[placeholder*="Suche"], input[placeholder*="Search"]'
    )
    if (searchBox) { setNativeValue(searchBox, ''); await wait(500) }

    // Hierarchisch durch Pfad klicken (Vinted-spezifisch: id="catalog-N")
    for (const step of path) {
      setStatus(`Kategorie: ${step}…`)
      await wait(400)
      const found = await clickCatalogItem(step)
      if (!found) {
        console.warn('[ListSync] Kategorie-Schritt nicht gefunden:', step)
        return false
      }
    }

    setStatus('✓ Kategorie')
    return true
  } catch(e) {
    console.warn('[ListSync] Kategorie Fehler:', e.message)
    return false
  }
}

// ── Universelle Feld-Ausfüll-Funktion ────────────────────────────────────────

// Füllt ein Feld egal ob Input, Select, Radio, Klick-Karte oder Autocomplete
async function fillAny(labelTexts, value, name) {
  if (!value) return false
  const labels = Array.isArray(labelTexts) ? labelTexts : [labelTexts]

  // 1. Input/Textarea per Label finden
  for (const labelText of labels) {
    const el = findByLabel(labelText)
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
      setNativeValue(el, value)
      await wait(400)
      // Dropdown-Option klicken falls autocomplete
      const opt = document.querySelector('[role="option"]:not([aria-disabled="true"])')
      if (opt && opt.offsetParent !== null) { opt.click(); await wait(400) }
      setStatus('✓ ' + name)
      return true
    }
  }

  // 2. Radio-Buttons / Klick-Karten mit passendem Text
  const clickables = document.querySelectorAll(
    '[role="radio"], [role="option"], [role="button"], label, button, [class*="Chip"], [class*="chip"], [class*="tag"], [class*="Tag"]'
  )
  for (const el of clickables) {
    if (el.offsetParent !== null && el.textContent.trim().toLowerCase() === value.toLowerCase()) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await wait(200)
      el.click()
      await wait(400)
      setStatus('✓ ' + name)
      return true
    }
  }

  // 3. Native select
  for (const sel of document.querySelectorAll('select')) {
    for (const opt of sel.options) {
      if (opt.text.toLowerCase().includes(value.toLowerCase())) {
        setNativeValue(sel, opt.value)
        await wait(300)
        setStatus('✓ ' + name)
        return true
      }
    }
  }

  // 4. Dropdown öffnen und Option wählen (falls noch geschlossen)
  for (const labelText of labels) {
    try {
      const result = document.evaluate(
        `//*[contains(normalize-space(text()),"${labelText}")]`,
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
      )
      const trigger = result.singleNodeValue
      if (trigger && trigger.offsetParent !== null) {
        trigger.click()
        await wait(700)
        const found = await clickOption(value)
        if (found) { setStatus('✓ ' + name); return true }
      }
    } catch {}
  }

  console.warn('[ListSync] Feld nicht gefunden:', name)
  return false
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Wartet bis ein neues Feld nach Kategorie-Auswahl sichtbar wird
async function waitForAttributeFields(timeout = 8000) {
  const fieldSels = [
    'input[placeholder*="Marke"]', 'input[placeholder*="brand"]',
    'input[placeholder*="Größe"]', 'input[placeholder*="size"]',
    '[data-testid*="brand"]', '[data-testid*="size"]',
    '[data-testid*="condition"]', 'select[name*="condition"]',
    '[role="radio"]', '[class*="Chip"]', '[class*="chip"]',
  ]
  return new Promise(resolve => {
    const check = () => {
      for (const s of fieldSels) {
        if (document.querySelector(s)) return true
      }
      return false
    }
    if (check()) return resolve(true)
    const ob = new MutationObserver(() => { if (check()) { ob.disconnect(); resolve(true) } })
    ob.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { ob.disconnect(); resolve(false) }, timeout)
  })
}

async function fill() {
  await wait(2500) // Vinted React braucht Zeit zum Booten

  const listing = await getListing()
  if (!listing) return

  const { activeVintedAccount } = await new Promise(r => chrome.storage.local.get('activeVintedAccount', r))
  showBanner(listing, activeVintedAccount)
  setStatus('Starte…')
  await wait(500)

  // ── 1. Basis-Felder (immer sichtbar) ─────────────────────────────────────

  await fillField([
    'input[data-testid="item-title-input"]', 'input[data-testid="title"]',
    'input#title', 'input[name="title"]',
    'input[placeholder*="Titel"]', 'input[placeholder*="Name des Artikels"]',
  ], listing.title.substring(0, 60), 'titel', 'Titel')
  await wait(400)

  await fillField([
    'textarea[data-testid="item-description-input"]', 'textarea[data-testid="description"]',
    'textarea#description', 'textarea[name="description"]',
    'textarea[placeholder*="Beschreibung"]', 'textarea[placeholder*="Artikelbeschreibung"]',
  ], listing.description || listing.title, 'beschreibung', 'Beschreibung')
  await wait(400)

  await fillField([
    'input[data-testid="item-price-input"]', 'input[data-testid="price"]',
    'input#price', 'input[name="price"]',
    'input[placeholder*="Preis"]', 'input[type="number"]',
  ], String(listing.price).replace('.', ','), 'preis', 'Preis')
  await wait(400)

  // ── 2. Kategorie auswählen (öffnet weitere Felder) ───────────────────────

  if (listing.category && listing.category !== 'Sonstiges') {
    setStatus('Kategorie wird ausgewählt…')
    await fillCategory(listing.category)
    // Warten bis die neuen Felder erscheinen
    setStatus('Warte auf Attribut-Felder…')
    await waitForAttributeFields(8000)
    await wait(800)
  }

  // ── DEBUG: alle sichtbaren Formular-Elemente ausgeben ────────────────────
  const debugFields = []
  document.querySelectorAll('input, textarea, select, [role="radio"], [role="combobox"], [role="listbox"]').forEach(el => {
    if (el.offsetParent !== null) {
      debugFields.push({
        tag: el.tagName,
        type: el.type || el.getAttribute('role') || '',
        name: el.name || el.id || '',
        placeholder: el.placeholder || '',
        value: el.value || el.textContent?.trim()?.substring(0, 50) || '',
        testid: el.dataset?.testid || '',
        class: el.className?.substring(0, 60) || '',
      })
    }
  })
  console.log('[ListSync DEBUG] Sichtbare Felder nach Kategorie:', JSON.stringify(debugFields, null, 2))
  // ─────────────────────────────────────────────────────────────────────────

  // ── 3. Felder die nach Kategorie erscheinen ───────────────────────────────

  // Zustand – Vinted zeigt das oft als Klick-Karten/Radio-Buttons
  if (listing.condition) {
    // Vinted Zustand-Mapping (unsere Werte → Vinted-Labels)
    const condMap = {
      'Neu mit Etikett': 'Neu mit Etikett',
      'Neu ohne Etikett': 'Neu ohne Etikett',
      'Sehr gut': 'Sehr gut',
      'Gut': 'Gut',
      'Befriedigend': 'Befriedigend',
    }
    const condValue = condMap[listing.condition] || listing.condition
    await fillAny(['Zustand', 'Condition', 'Zustand des Artikels'], condValue, 'Zustand')
    await wait(400)
  }

  // Größe
  if (listing.size) {
    await fillAny(['Größe', 'Size', 'Kleidergröße'], listing.size, 'Größe')
    await wait(500)
  }

  // Marke
  if (listing.brand) {
    await fillAutocomplete([
      'input[data-testid*="brand"]', 'input#brand', 'input[name="brand"]',
      'input[placeholder*="Marke"]', 'input[placeholder*="brand"]', 'input[placeholder*="Brand"]',
    ], listing.brand, 'marke', 'Marke')
    await wait(500)
  }

  // Farbe
  if (listing.color) {
    await fillAny(['Farbe', 'Color', 'Hauptfarbe'], listing.color, 'Farbe')
    await wait(400)
  }

  // Material – überspringen wenn nicht gesetzt
  // Versand – Standard Vinted-Versand auswählen
  await fillAny(['Versand', 'Versandoptionen', 'Shipping'], 'Vinted-Versand', 'Versand')
  await wait(400)

  setStatus('✅ Felder fertig – Bilder werden geladen…')
  await wait(4000)
  setStatus('✅ Fertig! Bitte prüfen und absenden.', true)
  await chrome.storage.local.remove('pendingListing')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fill)
} else {
  fill()
}
