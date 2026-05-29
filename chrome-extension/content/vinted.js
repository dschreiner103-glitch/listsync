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
      if (opt && opt.offsetParent !== null) { reactClick(opt); await wait(400); break }
    }
    setStatus('✓ ' + name)
    return true
  } catch(e) {
    console.warn('[ListSync] Autocomplete Fehler:', name, e.message)
    return false
  }
}

// ── Legacy-Hilfsfunktionen ────────────────────────────────────────────────────

const CATEGORY_MAP = {
  // ── Damen ──────────────────────────────────────────────────────────────
  'Damen – Kleidung':                         ['Damen', 'Kleidung'],
  'Damen – Kleidung – Jacken & Mäntel':       ['Damen', 'Kleidung', 'Jacken & Mäntel'],
  'Damen – Kleidung – Kleider':               ['Damen', 'Kleidung', 'Kleider'],
  'Damen – Kleidung – Röcke':                 ['Damen', 'Kleidung', 'Röcke'],
  'Damen – Kleidung – Tops & T-Shirts':       ['Damen', 'Kleidung', 'Tops & T-Shirts'],
  'Damen – Kleidung – Hosen & Jeans':         ['Damen', 'Kleidung', 'Hosen'],
  'Damen – Kleidung – Pullover & Strickpullover': ['Damen', 'Kleidung', 'Pullover & Strickpullover'],
  'Damen – Kleidung – Blazer & Anzüge':       ['Damen', 'Kleidung', 'Blazer & Anzüge'],
  'Damen – Kleidung – Shorts':                ['Damen', 'Kleidung', 'Shorts'],
  'Damen – Kleidung – Unterwäsche & Socken':  ['Damen', 'Kleidung', 'Unterwäsche & Socken'],
  'Damen – Kleidung – Sportkleidung':         ['Damen', 'Kleidung', 'Sportkleidung'],
  'Damen – Schuhe':                           ['Damen', 'Schuhe'],
  'Damen – Taschen':                          ['Damen', 'Taschen'],
  'Damen – Accessoires':                      ['Damen', 'Accessoires'],
  'Damen – Beauty':                           ['Damen', 'Beauty'],
  // ── Herren ─────────────────────────────────────────────────────────────
  'Herren – Kleidung':                        ['Herren', 'Kleidung'],
  'Herren – Kleidung – Jeans':                ['Herren', 'Kleidung', 'Jeans'],
  'Herren – Kleidung – Jacken & Mäntel':      ['Herren', 'Kleidung', 'Jacken & Mäntel'],
  'Herren – Kleidung – Tops & T-Shirts':      ['Herren', 'Kleidung', 'Tops & T-Shirts'],
  'Herren – Kleidung – Pullover & Sweater':   ['Herren', 'Kleidung', 'Pullover & Sweater'],
  'Herren – Kleidung – Hosen':                ['Herren', 'Kleidung', 'Hosen'],
  'Herren – Kleidung – Shorts':               ['Herren', 'Kleidung', 'Shorts'],
  'Herren – Kleidung – Anzüge & Blazer':      ['Herren', 'Kleidung', 'Anzüge & Blazer'],
  'Herren – Kleidung – Unterwäsche & Socken': ['Herren', 'Kleidung', 'Unterwäsche & Socken'],
  'Herren – Kleidung – Sportkleidung':        ['Herren', 'Kleidung', 'Sportartikel'],
  'Herren – Schuhe':                          ['Herren', 'Schuhe'],
  'Herren – Accessoires':                     ['Herren', 'Accessoires'],
  // ── Kinder ─────────────────────────────────────────────────────────────
  'Kinder – Mädchen':                         ['Kinder', 'Mädchen'],
  'Kinder – Mädchen – Kleider':               ['Kinder', 'Mädchen', 'Kleider'],
  'Kinder – Mädchen – Jacken & Mäntel':       ['Kinder', 'Mädchen', 'Outerwear'],
  'Kinder – Mädchen – Shirts & Tops':         ['Kinder', 'Mädchen', 'Shirts, Tops & Blusen'],
  'Kinder – Mädchen – Hosen & Shorts':        ['Kinder', 'Mädchen', 'Hosen & Shorts'],
  'Kinder – Mädchen – Schuhe':                ['Kinder', 'Mädchen', 'Schuhe'],
  'Kinder – Mädchen – Sportkleidung':         ['Kinder', 'Mädchen', 'Sportkleidung'],
  'Kinder – Jungs':                           ['Kinder', 'Jungs'],
  'Kinder – Jungs – Jacken & Mäntel':         ['Kinder', 'Jungs', 'Outerwear'],
  'Kinder – Jungs – Shirts & Tops':           ['Kinder', 'Jungs', 'Shirts & Tops'],
  'Kinder – Jungs – Hosen & Shorts':          ['Kinder', 'Jungs', 'Hosen & Shorts'],
  'Kinder – Jungs – Schuhe':                  ['Kinder', 'Jungs', 'Schuhe'],
  'Kinder – Jungs – Sportkleidung':           ['Kinder', 'Jungs', 'Sportkleidung'],
  'Kinder – Spielzeug':                       ['Kinder', 'Spielzeug'],
  // ── Sonstiges ──────────────────────────────────────────────────────────
  'Elektronik':                               ['Elektronik'],
  'Home & Living':                            ['Home'],
  'Sport & Outdoor':                          ['Sport'],
  'Unterhaltung':                             ['Unterhaltung'],
  // ── Beauty ─────────────────────────────────────────────────────────────
  'Beauty':                                   ['Damen', 'Beauty'],
  'Beauty – Make-up':                         ['Damen', 'Beauty', 'Make-up'],
  'Beauty – Hautpflege':                      ['Damen', 'Beauty', 'Hautpflege'],
  'Beauty – Haarpflege':                      ['Damen', 'Beauty', 'Haarpflege'],
  'Beauty – Parfüm & Düfte':                  ['Damen', 'Beauty', 'Parfüm & Düfte'],
  'Beauty – Beauty-Tools & -Geräte':          ['Damen', 'Beauty', 'Beauty-Zubehör'],
  // ── Haustiere ──────────────────────────────────────────────────────────
  'Haustiere':                                ['Haustiere'],
  'Haustiere – Hunde':                        ['Haustiere', 'Hunde'],
  'Haustiere – Katzen':                       ['Haustiere', 'Katzen'],
  'Haustiere – Kleintiere':                   ['Haustiere', 'Kleintiere'],
  'Haustiere – Vögel':                        ['Haustiere', 'Vögel'],
  'Sonstiges':                                [],
}

// ── React-bewusstes Klicken ───────────────────────────────────────────────────
// Vollständige Pointer+Mouse Event-Kette PLUS React-Fiber onClick-Aufruf.
// Nötig weil Vinted React-18 Event-Delegation nutzt – .click() reicht nicht.
function fullClick(el) {
  if (!el) return
  el.dispatchEvent(new PointerEvent('pointerover',  { bubbles: true, cancelable: true }))
  el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, cancelable: true }))
  el.dispatchEvent(new PointerEvent('pointerdown',  { bubbles: true, cancelable: true }))
  el.dispatchEvent(new MouseEvent('mousedown',      { bubbles: true, cancelable: true }))
  el.dispatchEvent(new PointerEvent('pointerup',    { bubbles: true, cancelable: true }))
  el.dispatchEvent(new MouseEvent('mouseup',        { bubbles: true, cancelable: true }))
  el.dispatchEvent(new MouseEvent('click',          { bubbles: true, cancelable: true }))
  reactClick(el)
}

// Geht durch Reacts internen Fiber-Baum und ruft onClick direkt auf.
// Viel zuverlässiger als el.click() bei React-18-Apps (Vinted).
function reactClick(el) {
  // React speichert den Fiber unter __reactFiber$xxx oder __reactInternalInstance$xxx
  const fiberKey = Object.keys(el).find(k =>
    k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
  )
  if (fiberKey) {
    let fiber = el[fiberKey]
    // Nach oben durch den Fiber-Baum suchen bis wir ein onClick finden
    let tries = 0
    while (fiber && tries++ < 20) {
      const props = fiber.memoizedProps || fiber.pendingProps
      if (props && typeof props.onClick === 'function') {
        try {
          props.onClick({
            target: el,
            currentTarget: el,
            type: 'click',
            bubbles: true,
            preventDefault: () => {},
            stopPropagation: () => {},
            nativeEvent: new MouseEvent('click', { bubbles: true }),
          })
          return true
        } catch(e) { console.warn('[ListSync] reactClick Fehler:', e) }
      }
      fiber = fiber.return
    }
  }
  // Fallback: normaler Browser-Klick mit vollständigen MouseEvents
  el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }))
  el.dispatchEvent(new MouseEvent('mouseover',  { bubbles: true, cancelable: true }))
  el.dispatchEvent(new MouseEvent('mousedown',  { bubbles: true, cancelable: true }))
  el.dispatchEvent(new MouseEvent('mouseup',    { bubbles: true, cancelable: true }))
  el.dispatchEvent(new MouseEvent('click',      { bubbles: true, cancelable: true }))
  return false
}

async function clickOption(text) {
  // Sucht sichtbare Option mit passendem Text und klickt sie (React-aware)
  const sels = [
    '[role="option"]', '[role="menuitem"]', '[role="listitem"]',
    'li', 'button', '[class*="item"]', '[class*="option"]',
  ]
  for (const s of sels) {
    for (const el of document.querySelectorAll(s)) {
      if (el.offsetParent !== null && el.textContent.trim().toLowerCase().includes(text.toLowerCase())) {
        await wait(100)
        reactClick(el)
        await wait(800)
        return true
      }
    }
  }
  return false
}

// Klickt ein Vinted-Katalog-Item per id="catalog-N" (goldener Selektor)
// KEIN scrollIntoView – Vinted schließt Dropdown bei Scroll-Events!
async function clickCatalogItem(text) {
  const items = document.querySelectorAll('[id^="catalog-"]:not(#catalog-search-input)')
  const target = text.toLowerCase().trim()

  // 1. Exakter Match
  for (const el of items) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const t = (el.innerText || el.textContent || '').trim()
    if (t.toLowerCase() === target) {
      console.log('[ListSync] ✓ catalog-item exakt:', el.id, '"' + t + '"')
      fullClick(getClickTarget(el))
      await wait(1200)
      return true
    }
  }
  // 2. Startswith-Match
  for (const el of items) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const t = (el.innerText || el.textContent || '').trim().toLowerCase()
    if (t.startsWith(target) || target.startsWith(t)) {
      console.log('[ListSync] ✓ catalog-item partial:', el.id, '"' + t + '"')
      fullClick(getClickTarget(el))
      await wait(1200)
      return true
    }
  }
  // Debug
  const visible = [...items]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
    .map(e => `${e.id}: "${(e.innerText||'').trim().substring(0,30)}"`)
  console.log('[ListSync] catalog-Items (kein Treffer für "' + text + '"):', visible)
  return false
}

// Findet den geöffneten Kategorie-Dropdown-Container
function getCatalogContainer() {
  // Suche den gemeinsamen Eltern-Container der catalog-N Items
  const item = document.querySelector('[id^="catalog-"]:not(#catalog-search-input)')
  if (item) {
    let p = item.parentElement
    while (p && p !== document.body) {
      const items = p.querySelectorAll('[id^="catalog-"]')
      if (items.length > 2) return p
      p = p.parentElement
    }
  }
  // Fallback: dialog, listbox oder bekannte Vinted-Klassen
  return document.querySelector(
    '[role="dialog"], [role="listbox"], ' +
    '[class*="catalog"], [class*="Catalog"], ' +
    '[class*="CategoryDropdown"], [class*="category-dropdown"]'
  )
}

// Gibt das tatsächlich klickbare Element zurück – bei Vinted haben <li>-Items
// oft einen inneren <div role="button"|"checkbox"|"radio"> als echten Klick-Target.
function getClickTarget(el) {
  const role = el.getAttribute('role')
  if (['BUTTON', 'A'].includes(el.tagName) || ['button', 'checkbox', 'radio', 'option'].includes(role)) return el
  const inner = el.querySelector('[role="button"], [role="checkbox"], [role="radio"], [role="option"], button, a[href]')
  if (inner) return inner
  return el
}

// Findet und klickt das Element mit dem passendsten Text –
// NUR innerhalb des geöffneten Dropdowns, nie in der Navigation
async function findAndClickText(text, container) {
  const root = container || getCatalogContainer() || document.body
  const all = root.querySelectorAll(
    'li, ul > *, [role="option"], [role="menuitem"], [role="radio"], ' +
    'button, a, label, div[tabindex], span[tabindex], ' +
    '[role="button"], ' +
    '[class*="item"], [class*="Item"], [class*="option"], [class*="Option"], ' +
    '[class*="cell"], [class*="Cell"], [class*="row"], [class*="Row"]'
  )

  const candidates = []
  for (const el of all) {
    if (isInNav(el)) continue  // Navigation immer überspringen
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
      if (r.width > 0 && r.height > 0 && !isInNav(el)) {
        const t = (el.innerText || el.textContent || '').trim().substring(0, 40)
        if (t) visible.push(`${el.tagName}[role=${el.getAttribute('role')||''}]: "${t}"`)
      }
    }
    console.log('[ListSync] Kein Treffer für "' + text + '" in Container:', visible.slice(0, 20))
    return false
  }

  candidates.sort((a, b) => a.score - b.score)
  const { el } = candidates[0]
  // Klicke auf den echten Klick-Target (inner div[role=button] wenn vorhanden)
  const target = getClickTarget(el)
  console.log('[ListSync] Klicke:', target.tagName, '[role=' + (target.getAttribute('role')||'') + ']', '"' + (target.innerText || '').trim().substring(0, 30) + '"')
  fullClick(target)  // fullClick: alle Pointer+Mouse Events + reactClick
  await wait(1200)
  return true
}

// Wartet bis catalog-N Items sichtbar sind (Kategorie-Dropdown)
async function waitForCatalogItems(timeout = 6000) {
  return new Promise(resolve => {
    const check = () => {
      const items = document.querySelectorAll('[id^="catalog-"]:not(#catalog-search-input)')
      return [...items].some(e => {
        const r = e.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      })
    }
    if (check()) return resolve(true)
    const ob = new MutationObserver(() => { if (check()) { ob.disconnect(); resolve(true) } })
    ob.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { ob.disconnect(); resolve(false) }, timeout)
  })
}

// Wartet bis IRGENDEIN Panel geöffnet ist (catalog-N, condition-N, input-dropdown li…)
async function waitForAnyPanelItems(timeout = 6000) {
  return new Promise(resolve => {
    const check = () => {
      // catalog-N (Kategorie)
      const cats = [...document.querySelectorAll('[id^="catalog-"]:not(#catalog-search-input)')]
      if (cats.some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })) return true
      // condition-N (Zustand)
      const conds = [...document.querySelectorAll('[data-testid^="condition-"]')]
      if (conds.some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })) return true
      // input-dropdown Panel (Größe, Farbe, Material) – li Items im input-dropdown__content
      const dropLis = [...document.querySelectorAll('[class*="input-dropdown__content"] li, [class*="input-dropdown"] li')]
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
      if (dropLis.length > 0) return true
      // Größe-Grid: role="radio" Items (Vinted zeigt Größen oft als Radio-Karten)
      const radios = [...document.querySelectorAll('[role="radio"]:not([aria-disabled="true"])')]
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
      if (radios.length > 0) return true
      // Größe/Material: data-testid="size-*" oder "material-*" Items
      const sizeItems = [...document.querySelectorAll('[data-testid^="size-"], [data-testid^="material-"]')]
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
      if (sizeItems.length > 0) return true
      // Generisch: role="option" in Dialog
      const opts = [...document.querySelectorAll('[role="dialog"] [role="option"], [role="listbox"] [role="option"]')]
      if (opts.some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })) return true
      return false
    }
    if (check()) return resolve(true)
    const ob = new MutationObserver(() => { if (check()) { ob.disconnect(); resolve(true) } })
    ob.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { ob.disconnect(); resolve(false) }, timeout)
  })
}

// Findet den geöffneten Panel-Container (catalog-N, condition-N, input-dropdown, dialog)
function getAnyOpenPanel() {
  // 1. input-dropdown Panel (Größe, Farbe, Material) — hat testid="*-dropdown-content"
  const dropdown = [...document.querySelectorAll('[class*="input-dropdown"]')]
    .find(e => {
      const r = e.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && e.querySelector('li')
    })
  if (dropdown) return dropdown

  // 2. catalog-N sichtbar? (Kategorie)
  const catItem = [...document.querySelectorAll('[id^="catalog-"]:not(#catalog-search-input)')]
    .find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  if (catItem) return getCatalogContainer()

  // 3. condition-N sichtbar? (Zustand)
  const condItem = [...document.querySelectorAll('[data-testid^="condition-"]')]
    .find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  if (condItem) {
    let p = condItem.parentElement
    while (p && p !== document.body) {
      if (p.querySelectorAll('[data-testid^="condition-"]').length > 1) return p
      p = p.parentElement
    }
    return condItem.parentElement
  }

  // 4. Generisch: sichtbarer Dialog / Overlay
  for (const sel of ['[role="dialog"]', '[role="listbox"]', '[class*="overlay"]', '[class*="Overlay"]']) {
    const el = document.querySelector(sel)
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) return el
    }
  }

  return null
}

// Klickt condition-N item das den Text enthält (für Zustand-Panel)
async function clickConditionItem(text) {
  const target = text.toLowerCase().trim()
  const items = [...document.querySelectorAll('[data-testid^="condition-"]')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })

  // Exakter Match
  for (const el of items) {
    const t = (el.innerText || el.textContent || '').trim()
    if (t.toLowerCase() === target) {
      console.log('[ListSync] ✓ condition-item exakt:', el.dataset.testid, '"' + t + '"')
      fullClick(getClickTarget(el)); await wait(800); return true
    }
  }
  // Partial Match
  for (const el of items) {
    const t = (el.innerText || el.textContent || '').trim().toLowerCase()
    if (t.includes(target) || target.includes(t.split('\n')[0])) {
      console.log('[ListSync] ✓ condition-item partial:', el.dataset.testid, '"' + t + '"')
      fullClick(getClickTarget(el)); await wait(800); return true
    }
  }
  const debug = items.map(e => `${e.dataset.testid}: "${(e.innerText||'').trim().substring(0,30)}"`)
  console.log('[ListSync] condition-Items (kein Treffer für "' + text + '"):', debug)
  return false
}

// Prüft ob ein Element Teil der Vinted-Navigation ist (nicht das Formular)
function isInNav(el) {
  let p = el
  while (p && p !== document.body) {
    if (['NAV', 'HEADER'].includes(p.tagName)) return true
    const cls = typeof p.className === 'string' ? p.className : ''
    if (/\b(nav|navbar|topbar|header|navigation|menu-bar)\b/i.test(cls)) return true
    if (p.getAttribute && p.getAttribute('role') === 'navigation') return true
    p = p.parentElement
  }
  return false
}

// ── Kategorie-Auswahl: hierarchisch durchklicken ─────────────────────────────
// "Herren – Kleidung – Pullover & Sweater – Pullis & Hoodies"
// → splittet zu ["Herren","Kleidung","Pullover & Sweater","Pullis & Hoodies"]
// → klickt jede Ebene nacheinander durch (kein CATEGORY_MAP nötig)

async function fillCategory(category) {
  if (!category || category === 'Sonstiges') return false

  // CATEGORY_MAP hat Vorrang (enthält korrigierte/kanonische Pfade)
  // z.B. 'Beauty' → ['Damen', 'Beauty'] statt ['Beauty']
  let path = CATEGORY_MAP[category] || null
  if (!path) {
    // Prefix-Match: 'Haustiere – Hunde' → schaut ob ein Prefix-Key passt
    const keys = Object.keys(CATEGORY_MAP).sort((a, b) => b.length - a.length)
    for (const key of keys) {
      if (CATEGORY_MAP[key].length > 0 && (category === key || category.startsWith(key + ' – '))) {
        const extra = category.startsWith(key + ' – ')
          ? category.slice(key.length + 3).split(' – ').map(s => s.trim()).filter(Boolean)
          : []
        path = [...CATEGORY_MAP[key], ...extra]
        break
      }
    }
  }
  // Fallback: direkt aus dem String ableiten
  if (!path || !path.length) path = category.split(' – ').map(s => s.trim()).filter(Boolean)
  if (!path.length) return false

  try {
    // Dropdown-Trigger finden – NUR das Formularfeld, nicht die Navigation!
    let trigger = null

    // 1. data-testid Varianten (Vinted ändert testids gelegentlich)
    for (const sel of [
      '[data-testid="catalog-select-dropdown-input"]',
      '[data-testid="catalog-select"] input',
      '[data-testid*="catalog-select"]',
      '[data-testid*="category-select"]',
      'input#category',
    ]) {
      const el = document.querySelector(sel)
      if (el && !isInNav(el)) { trigger = el; break }
    }

    // 2. Readonly-Input in der Nähe eines "Kategorie"-Labels
    if (!trigger) {
      for (const input of document.querySelectorAll('input[readonly], input[aria-readonly="true"]')) {
        if (isInNav(input)) continue
        const label = document.querySelector(`label[for="${input.id}"]`)
        const labelText = label?.textContent || input.placeholder || input.getAttribute('aria-label') || ''
        if (labelText.toLowerCase().includes('kategorie') || labelText.toLowerCase().includes('catalog')) {
          trigger = input; break
        }
      }
    }

    // 3. Placeholder-Text (falls Vinted die ID ändert)
    if (!trigger) {
      for (const sel of [
        'input[placeholder*="Kategorie"]',
        'input[placeholder*="Wähle eine"]',
        'input[aria-label*="Kategorie"]',
        'input[aria-label*="catalog"]',
      ]) {
        const el = document.querySelector(sel)
        if (el && !isInNav(el)) { trigger = el; break }
      }
    }

    // 4. Button/Combobox/Div mit "Kategorie"-Text – nicht in der Nav
    if (!trigger) {
      const sels = 'button, [role="button"], [role="combobox"], [role="listbox"], div[tabindex], span[tabindex]'
      for (const el of document.querySelectorAll(sels)) {
        if (isInNav(el)) continue
        const text = (el.innerText || el.textContent || '').trim()
        if (text.toLowerCase().includes('kategorie') || text.toLowerCase().includes('catalog')) {
          trigger = el; break
        }
      }
    }

    if (!trigger) {
      console.warn('[ListSync] Kategorie-Trigger nicht gefunden – alle sichtbaren Inputs:',
        [...document.querySelectorAll('input, button, [role="combobox"]')]
          .filter(e => !isInNav(e) && e.offsetParent !== null)
          .map(e => `${e.tagName}[testid=${e.dataset?.testid||''}][placeholder=${e.placeholder||''}]`)
          .join(', ')
      )
      return false
    }

    console.log('[ListSync] Kategorie-Trigger gefunden:', trigger.tagName, trigger.dataset?.testid || trigger.placeholder || trigger.textContent?.trim()?.substring(0, 30))
    fullClick(trigger)   // KEIN scrollIntoView – schließt Dropdown bei Scroll!

    // Warten bis der Dropdown wirklich sichtbar ist
    setStatus('Warte auf Kategorie-Dropdown…')
    let catalogReady = await waitForCatalogItems(8000)

    // Fallback: vielleicht öffnet sich ein anderer Panel-Typ
    if (!catalogReady) {
      console.warn('[ListSync] catalog-N Items nicht gefunden, versuche generischen Panel…')
      // Nochmal klicken – manchmal braucht es zwei Versuche
      fullClick(trigger)
      await wait(800)
      catalogReady = await waitForCatalogItems(6000)
    }

    if (!catalogReady) {
      console.warn('[ListSync] Kategorie-Dropdown nicht geladen – sichtbare IDs:',
        [...document.querySelectorAll('[id^="catalog-"]')].map(e => e.id).join(', ')
      )
      return false
    }
    await wait(400)

    // Hierarchisch durch alle Pfad-Ebenen klicken
    for (const step of path) {
      setStatus(`Kategorie: ${step}…`)
      await wait(500)

      // 1. Versuch: catalog-N IDs (goldener Selektor für Vinted)
      let found = await clickCatalogItem(step)

      // 2. Fallback: Suche NUR im geöffneten Dropdown-Container
      if (!found) {
        console.warn('[ListSync] catalog-item fehlgeschlagen, suche im Container:', step)
        const container = getCatalogContainer()
        found = await findAndClickText(step, container)
      }

      if (!found) {
        console.warn('[ListSync] Kategorie-Schritt nicht gefunden:', step)
        return false
      }

      // Warten bis nächste Ebene erscheint
      await wait(1200)
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
      reactClick(el)
      await wait(500)
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
        reactClick(trigger)
        await wait(800)
        const found = await clickOption(value)
        if (found) { setStatus('✓ ' + name); return true }
      }
    } catch {}
  }

  console.warn('[ListSync] Feld nicht gefunden:', name)
  return false
}

// ── Vinted Attribut-Felder gezielt ausfüllen ────────────────────────────────
// Nutzt die bekannten data-testid Selektoren von vinted.de/items/new

async function clickVintedField(testid, value, name, opts = {}) {
  if (!value) return false

  // 1. Trigger-Input finden (readonly, öffnet Panel bei Klick)
  const trigger = document.querySelector(`[data-testid="${testid}"]`)
  if (!trigger) { console.warn('[ListSync] Kein Trigger gefunden:', testid); return false }

  console.log('[ListSync] Klicke Feld:', testid, '→', value)
  fullClick(trigger)
  await wait(1500)

  // 2. Marke: Autocomplete-Suche (Panel öffnet sich mit eigenem Search-Input)
  if (opts.autocomplete) {
    const searchSels = [
      '[data-testid="brand-search--input"]',       // korrekte testid (live getestet)
      '[data-testid*="brand"][data-testid*="input"]',
      '[class*="input-dropdown"] input:not([readonly]):not([type="hidden"])',
      '[class*="input-dropdown__content"] input:not([readonly])',
    ]
    let searchInput = null
    for (let attempt = 0; attempt < 12; attempt++) {
      for (const s of searchSels) {
        const el = document.querySelector(s)
        if (el && el.offsetParent !== null && !el.readOnly) { searchInput = el; break }
      }
      if (searchInput) break
      await wait(300)
    }
    if (!searchInput) {
      console.warn('[ListSync] Marke-Autocomplete: kein Search-Input gefunden')
      return false
    }
    searchInput.focus()
    setNativeValue(searchInput, value)
    await wait(2000)

    // Suchergebnisse: <li> mit innerem [role="button"] — exakt wie Größe/Farbe
    const dropLis = [...document.querySelectorAll('[class*="input-dropdown"] li')]
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })

    const target = value.toLowerCase().trim()
    // Exakter Match zuerst, dann startsWith
    const match = dropLis.find(e => e.textContent.trim().toLowerCase() === target)
      || dropLis.find(e => e.textContent.trim().toLowerCase().startsWith(target))
      || dropLis[0]  // Fallback: erster Treffer

    if (match) {
      console.log('[ListSync] ✓ Marke gefunden:', match.textContent.trim())
      fullClick(getClickTarget(match))
      await wait(700)
      setStatus('✓ ' + name)
      return true
    }
    console.warn('[ListSync] Marke: kein Suchergebnis für:', value)
    return false
  }

  // 3. Warte bis IRGENDEIN Panel sichtbar ist (catalog-N, condition-N, dialog…)
  const ready = await waitForAnyPanelItems(6000)
  if (!ready) {
    console.warn('[ListSync] Kein klassisches Panel erkannt für:', name, '– versuche trotzdem Text-Suche')
    // Vielleicht gibt es ein Radio-Grid oder unbekanntes Panel – trotzdem versuchen
    const found = await findAndClickText(value, document.body)
    if (found) { setStatus('✓ ' + name + ' (direkt)'); return true }
    // Letzter Versuch: catalog-items nochmal prüfen (können verzögert erscheinen)
    const foundCat = await clickCatalogItem(value)
    if (foundCat) { setStatus('✓ ' + name); return true }
    console.warn('[ListSync] Panel-Timeout für:', name, '– überspringe')
    return false
  }
  await wait(400)

  // 4a. Zustand: condition-N Items
  const condItems = [...document.querySelectorAll('[data-testid^="condition-"]')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  if (condItems.length > 0) {
    const found = await clickConditionItem(value)
    if (found) { setStatus('✓ ' + name); return true }
  }

  // 4b. Material: material-N Items (data-testid="material-{id}")
  const matItems = [...document.querySelectorAll('[data-testid^="material-"]:not([data-testid$="--title"]):not([data-testid$="--suffix"]):not([data-testid$="-checkbox"])')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  if (matItems.length > 0) {
    const target = value.toLowerCase().trim()
    const match = matItems.find(e => e.textContent.trim().toLowerCase() === target)
      || matItems.find(e => e.textContent.trim().toLowerCase().includes(target))
    if (match) {
      console.log('[ListSync] ✓ material-item:', match.dataset.testid, '"' + match.textContent.trim() + '"')
      fullClick(getClickTarget(match))
      await wait(800)
      setStatus('✓ ' + name)
      return true
    }
    console.warn('[ListSync] Material: kein Treffer für:', value, '| Verfügbar:', matItems.slice(0,8).map(e=>e.textContent.trim()).join(', '))
  }

  // 4c. catalog-N Items (Größe, Farbe)
  let found = await clickCatalogItem(value)

  // 4d. Generischer Fallback: Text-Suche im offenen Panel
  if (!found) {
    const container = getAnyOpenPanel() || getCatalogContainer()
    found = await findAndClickText(value, container)
  }

  if (found) {
    await wait(600)
    setStatus('✓ ' + name)
    return true
  }

  // DEBUG: Panel-Inhalt loggen damit wir sehen was dort wirklich steht
  const panelDebug = getAnyOpenPanel() || document.body
  const panelItems = [...panelDebug.querySelectorAll('li, [role="option"], [role="radio"], [data-testid]')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
    .slice(0, 20)
    .map(e => `${e.tagName}[${e.dataset?.testid||e.getAttribute('role')||''}]: "${(e.innerText||'').trim().substring(0,25)}"`)
  console.warn('[ListSync] Kein Treffer im Panel für:', name, '=', value, '| Panel-Items:', panelItems.join(' | '))
  return false
}

// ── Brute-Force: unbekannte Dropdown-Inputs durchsuchen ──────────────────────
// Klappt alle readonly Inputs auf die NICHT zu den excludeKeywords gehören,
// und prüft ob der gesuchte Wert darin vorkommt.
async function tryUnknownDropdown(excludeKeywords, value, name) {
  if (!value) return false
  const inputs = [...document.querySelectorAll('input[readonly], input[aria-readonly="true"]')]
    .filter(el => el.offsetParent !== null && !isInNav(el))
    .filter(el => {
      const tid = (el.dataset?.testid || '').toLowerCase()
      return !excludeKeywords.some(kw => tid.includes(kw.toLowerCase()))
    })

  console.log('[ListSync] tryUnknownDropdown für', name, '– Kandidaten:', inputs.map(e => e.dataset?.testid || 'no-testid').join(', '))

  for (const input of inputs) {
    const testid = input.dataset?.testid
    if (!testid) continue
    console.log('[ListSync] Teste unbekannten Input:', testid, 'für', name)
    fullClick(input)
    await wait(1200)
    const panelOpen = await waitForAnyPanelItems(3000)
    if (panelOpen) {
      const panel = getAnyOpenPanel()
      const found = await findAndClickText(value, panel)
      if (found) {
        await wait(500)
        setStatus('✓ ' + name + ' (unbekannt: ' + testid + ')')
        return true
      }
      // Panel schlließen (Escape)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await wait(400)
    }
  }
  console.warn('[ListSync] tryUnknownDropdown: kein Treffer für', name, '=', value)
  return false
}

// ── Versand / Sendungsgröße ausfüllen ────────────────────────────────────────
// Vinted zeigt Radio-Buttons: Klein / Mittel / Groß (+ Empfohlen-Badge)
// Sie erscheinen wenn man den Versand-Trigger klickt.

const SHIP_SIZE_MAP = {
  'klein':   'Klein',
  's':       'Klein',
  'small':   'Klein',
  'mittel':  'Mittel',
  'm':       'Mittel',
  'medium':  'Mittel',
  'groß':    'Groß',
  'gross':   'Groß',
  'l':       'Groß',
  'xl':      'Groß',
  'large':   'Groß',
  'xxl':     'Groß',
}

async function fillVintedShipping(shipSize) {
  if (!shipSize) return false
  const target = SHIP_SIZE_MAP[shipSize.toLowerCase()] || shipSize

  console.log('[ListSync] Versandgröße suche:', target)

  // ── Strategie 1: Radio-Buttons direkt sichtbar (kein data-testid vorhanden) ─
  // Vinted zeigt Klein/Mittel/Groß als eigene Klick-Elemente ohne testid.
  // Suche JEDES sichtbare Element das genau "Klein"/"Mittel"/"Groß" als erste Zeile hat.
  const allEls = document.querySelectorAll(
    'label, [role="radio"], [role="option"], [role="button"], ' +
    'div[tabindex], span[tabindex], li, button'
  )
  for (const el of allEls) {
    if (el.offsetParent === null || isInNav(el)) continue
    const txt = (el.innerText || el.textContent || '').trim()
    const firstLine = txt.split('\n')[0].trim()
    if (firstLine.toLowerCase() === target.toLowerCase()) {
      console.log('[ListSync] ✓ Versand direkt sichtbar:', firstLine, el.tagName)
      const radio = el.querySelector('input[type="radio"]') || document.getElementById(el.htmlFor)
      if (radio) { radio.click(); await wait(300) }
      reactClick(el)
      fullClick(el)
      await wait(500)
      setStatus('✓ Versand: ' + target)
      return true
    }
  }

  // Strategie 1b: Versand-Abschnitt per Überschriftentext finden, dann darin suchen
  for (const heading of document.querySelectorAll('p, span, div, h2, h3, h4, label')) {
    if (heading.offsetParent === null) continue
    const ht = (heading.innerText || heading.textContent || '').trim().toLowerCase()
    if (ht === 'sendungsgröße' || ht.includes('sendungsgröße') || ht.includes('versandgröße')) {
      const section = heading.closest('section') || heading.closest('[class*="ship"]') || heading.parentElement?.parentElement
      if (section) {
        console.log('[ListSync] Versand-Abschnitt gefunden, suche darin…')
        const found = await findAndClickText(target, section)
        if (found) { setStatus('✓ Versand: ' + target); return true }
      }
    }
  }

  // ── Strategie 2: Trigger-basiert (Dropdown öffnen) ───────────────────────────
  let trigger = null

  const triggerSels = [
    '[data-testid="ship-size-dropdown-input"]',
    '[data-testid="shipment-size-input"]',
    '[data-testid="shipping-size-dropdown-input"]',
    '[data-testid="package-size-dropdown-input"]',
    '[data-testid*="ship"][data-testid*="input"]',
    '[data-testid*="shipment"][data-testid*="input"]',
    '[data-testid*="shipping"][data-testid*="input"]',
  ]
  for (const sel of triggerSels) {
    const el = document.querySelector(sel)
    if (el && el.offsetParent !== null) { trigger = el; break }
  }

  // Fallback: readonly Input / Button mit "Versand"-Label
  if (!trigger) {
    for (const el of document.querySelectorAll('input[readonly], button, [role="combobox"]')) {
      if (isInNav(el) || el.offsetParent === null) continue
      const lbl = document.querySelector(`label[for="${el.id}"]`)
      const txt = (lbl?.textContent || el.placeholder || el.getAttribute('aria-label') || el.textContent || '').toLowerCase()
      if (txt.includes('sendungsgröße') || txt.includes('versand') || txt.includes('paket')) {
        trigger = el; break
      }
    }
  }

  if (trigger) {
    console.log('[ListSync] Versand-Trigger:', trigger.dataset?.testid || trigger.tagName)
    fullClick(trigger)
    await wait(1200)
    await waitForAnyPanelItems(4000)
    await wait(300)

    const panel = getAnyOpenPanel() || document.body
    const found = await findAndClickText(target, panel)
    if (found) {
      await wait(500)
      setStatus('✓ Versand: ' + target)
      return true
    }
  }

  // Debug: alle sichtbaren testids + Labels loggen
  const allVisible = [...document.querySelectorAll('[data-testid]')]
    .filter(e => !isInNav(e) && e.offsetParent !== null)
    .map(e => e.dataset.testid).filter(Boolean)
  console.warn('[ListSync] Versand nicht gefunden für:', target,
    '| Sichtbare testids:', allVisible.slice(0, 20).join(', '))
  return false
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Probiert mehrere testids durch – gibt true zurück wenn einer funktioniert
async function clickVintedFieldMulti(testids, value, name) {
  for (const testid of testids) {
    const el = document.querySelector(`[data-testid="${testid}"]`)
    if (el && el.offsetParent !== null) {
      console.log('[ListSync] Gefunden per testid:', testid)
      return await clickVintedField(testid, value, name)
    }
  }
  // Partial-Match: [data-testid*="size"] o.ä.
  for (const keyword of ['size', 'Size', 'grsse', 'groesse']) {
    const el = document.querySelector(`[data-testid*="${keyword}"][data-testid*="input"], [data-testid*="${keyword}"][data-testid*="select"]`)
    if (el && el.offsetParent !== null) {
      const testid = el.dataset.testid
      console.log('[ListSync] Gefunden per partial testid:', testid)
      return await clickVintedField(testid, value, name)
    }
  }
  console.warn('[ListSync] Kein testid gefunden für:', name, testids)
  return false
}

// Sucht readonly Input per Label-Text und klickt darauf
async function clickVintedFieldByLabel(labelTexts, value, name) {
  for (const labelText of labelTexts) {
    // Per <label> Element
    for (const lbl of document.querySelectorAll('label')) {
      const t = (lbl.innerText || lbl.textContent || '').trim().toLowerCase()
      if (!t.includes(labelText.toLowerCase())) continue
      const input = lbl.querySelector('input') || document.getElementById(lbl.htmlFor)
      if (input && input.offsetParent !== null) {
        const testid = input.dataset?.testid
        if (testid) return await clickVintedField(testid, value, name)
        fullClick(input)
        await waitForAnyPanelItems(4000)
        const found = await findAndClickText(value, getAnyOpenPanel())
        if (found) { setStatus('✓ ' + name); return true }
      }
    }
    // Per aria-label / placeholder
    const input = document.querySelector(
      `input[aria-label*="${labelText}"], input[placeholder*="${labelText}"]`
    )
    if (input && input.offsetParent !== null) {
      fullClick(input)
      await waitForAnyPanelItems(4000)
      const found = await findAndClickText(value, getAnyOpenPanel())
      if (found) { setStatus('✓ ' + name); return true }
    }
  }
  return false
}

// Wartet bis ein neues Feld nach Kategorie-Auswahl sichtbar wird
async function waitForAttributeFields(timeout = 12000) {
  const fieldSels = [
    'input[placeholder*="Marke"]', 'input[placeholder*="brand"]',
    'input[placeholder*="Größe"]', 'input[placeholder*="size"]',
    '[data-testid*="brand"]', '[data-testid*="size"]',
    '[data-testid*="condition"]', 'select[name*="condition"]',
    '[data-testid*="ship"]', '[data-testid*="shipment"]', '[data-testid*="shipping"]',
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

// Wartet bis mindestens ein Upload-Thumbnail sichtbar ist
async function waitForThumbnails(timeout = 25000) {
  // Snapshot: wie viele img-Elemente gibt es im Upload-Bereich vor dem Upload?
  const uploadRoot = document.querySelector('[data-testid="media-upload"]')
    || document.querySelector('[data-testid="dropzone"]')
    || document.body
  const initialImgCount = uploadRoot.querySelectorAll('img').length

  const thumbSels = [
    // Live-bestätigte Vinted-testids (Stand 2025)
    '[data-testid="media-upload"] img[src*="blob:"]',
    '[data-testid="dropzone"] img[src*="blob:"]',
    '[data-testid="plus"] img[src*="blob:"]',
    '[data-testid*="media"] img[src*="blob:"]',
    // Generische Thumbnail-Selektoren
    '[data-testid="photo-thumb-container"]',
    '[data-testid*="photo-thumb"]',
    '[data-testid*="upload-photo"] img',
    '[class*="photo"] img[src*="blob:"]',
    '[class*="upload"] img[src*="blob:"]',
    '[class*="photo-upload"] img',
    'figure img[src*="blob:"]',
    // Fallback: blob-URL-Bild irgendwo auf der Seite
    'img[src*="blob:"]',
  ]
  return new Promise(resolve => {
    const check = () => {
      // Prüfung 1: Upload-Container hat neue img-Elemente bekommen
      const currentCount = uploadRoot.querySelectorAll('img').length
      if (currentCount > initialImgCount) {
        console.warn('[ListSync] Thumbnail erkannt (img-Count: ' + initialImgCount + ' → ' + currentCount + ')')
        return true
      }
      // Prüfung 2: Selektor-Match mit sichtbarem Element
      return thumbSels.some(s => {
        try {
          const el = document.querySelector(s)
          return el != null  // Existenz reicht (Bild könnte noch laden)
        } catch { return false }
      })
    }
    if (check()) return resolve(true)
    const ob = new MutationObserver(() => { if (check()) { ob.disconnect(); resolve(true) } })
    ob.observe(document.body, { childList: true, subtree: true, attributes: true })
    setTimeout(() => { ob.disconnect(); resolve(false) }, timeout)
  })
}

// Findet den Submit/Veröffentlichen-Button auf Vinted
function findSubmitButton() {
  const sels = [
    '[data-testid="upload-form-save-button"]',   // confirmed live: text "Hochladen"
    '[data-testid="submit-button"]',
    '[data-testid="upload-form-submit-button"]',
    '[data-testid*="submit"]',
    '[data-testid*="publish"]',
    'button[type="submit"]',
  ]
  for (const s of sels) {
    const el = document.querySelector(s)
    if (el && el.offsetParent !== null && !el.disabled) return el
  }
  // Fallback: Button mit "Veröffentlichen" / "Hochladen" / "Speichern" Text
  for (const btn of document.querySelectorAll('button')) {
    if (btn.disabled || btn.offsetParent === null) continue
    const t = (btn.innerText || btn.textContent || '').trim().toLowerCase()
    if (t.includes('veröffentlichen') || t.includes('hochladen') || t.includes('speichern') || t.includes('weiter')) {
      return btn
    }
  }
  return null
}

async function fill() {
  await wait(2500) // Vinted React braucht Zeit zum Booten

  const listing = await getListing()
  if (!listing) return

  const { activeVintedAccount } = await new Promise(r => chrome.storage.local.get('activeVintedAccount', r))
  showBanner(listing, activeVintedAccount)
  // DEBUG: Zeige welche Felder das Listing hat
  console.warn('[ListSync DEBUG] Listing-Felder:', JSON.stringify({
    title: listing.title?.substring(0,30),
    price: listing.price,
    category: listing.category,
    condition: listing.condition,
    brand: listing.brand,
    size: listing.size,
    color: listing.color,
    material: listing.material,
    shipSize: listing.shipSize,
    images: listing.imageData?.length ?? 0,
  }))
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
    await waitForAttributeFields(12000)
    await wait(800)
  }

  // ── DEBUG: alle sichtbaren Formular-Elemente + data-testid Buttons ──────
  const debugFields = []
  const debugSel = 'input, textarea, select, button, [role="radio"], [role="combobox"], [role="listbox"], [data-testid]'
  document.querySelectorAll(debugSel).forEach(el => {
    if (el.offsetParent !== null) {
      const testid = el.dataset?.testid || ''
      const text = (el.innerText || el.textContent || '').trim().substring(0, 40)
      if (testid || el.tagName === 'INPUT' || el.tagName === 'SELECT') {
        debugFields.push({
          tag: el.tagName,
          testid,
          placeholder: el.placeholder || '',
          value: el.value || text,
          readonly: el.readOnly || false,
        })
      }
    }
  })
  console.log('[ListSync DEBUG] Felder nach Kategorie (testids):', JSON.stringify(debugFields, null, 2))
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  // ── 3. Felder die nach Kategorie erscheinen ───────────────────────────────────

  // Zustand – data-testid: category-condition-single-list-input
  // Vinted nutzt: "Neu, mit Etikett", "Neu, ohne Etikett", "Sehr gut", "Gut", "Befriedigend"
  if (listing.condition) {
    const condMap = {
      'Neu mit Etikett':  'Neu, mit Etikett',
      'Neu, mit Etikett': 'Neu, mit Etikett',
      'Neu ohne Etikett': 'Neu, ohne Etikett',
      'Neu, ohne Etikett':'Neu, ohne Etikett',
      'Neu':              'Neu, mit Etikett',
      'Sehr gut':         'Sehr gut',
      'Gut':              'Gut',
      'Befriedigend':     'Befriedigend',
      'Stark getragen':   'Stark getragen',
    }
    const condValue = condMap[listing.condition] || listing.condition
    setStatus('Zustand wird gesetzt…')
    await clickVintedField('category-condition-single-list-input', condValue, 'Zustand')
    await wait(600)
  }

  // ── DEBUG: testid-Dump JETZT (nach Kategorie) ─────────────────────────────
  const allFieldEls = [...document.querySelectorAll('[data-testid]')]
    .filter(e => !isInNav(e) && e.offsetParent !== null)
    .map(e => e.dataset.testid)
  console.warn('[ListSync DEBUG] Sichtbare testids:', allFieldEls.join(', '))
  // ── END DEBUG ────────────────────────────────────────────────────────────────

  // Größe – testid variiert je nach Kategorie, daher mehrere Varianten probieren
  if (!listing.size) { console.warn('[ListSync] Größe: leer, wird übersprungen') }
  if (listing.size) {
    setStatus('Größe wird gesetzt…')
    const sizeTriggered = await clickVintedFieldMulti([
      'category-size-single-grid-input',   // ✓ live bestätigt
      'size-select-dropdown-input',
      'catalog-size-input',
      'item-size-input',
      'size-catalog-input',
      'size-dropdown-input',
      'catalog_size-input',
      'item-size-select',
      'size-picker-input',
    ], listing.size, 'Größe')
    if (!sizeTriggered) {
      // Fallback 1: Label-Text
      const byLabel = await clickVintedFieldByLabel(['Größe', 'Größe wählen', 'Size', 'Gr.'], listing.size, 'Größe')
      if (!byLabel) {
        // Fallback 2: Unbekannte readonly Inputs (Brute-Force – alle die noch nicht ausgefüllt sind)
        await tryUnknownDropdown(['brand', 'color', 'material', 'condition', 'catalog-select', 'ship', 'title', 'description', 'price'], listing.size, 'Größe')
      }
    }
    await wait(600)
  }

  // Marke – mehrere testid-Varianten (Vinted ändert sie gelegentlich)
  if (listing.brand) {
    setStatus('Marke wird gesetzt…')
    const brandTestids = [
      'brand-select-dropdown-input',
      'item-brand-dropdown-input',
      'brand-dropdown-input',
      'brand-input',
      'catalog-brand-input',
    ]
    let brandOk = false
    for (const tid of brandTestids) {
      const el = document.querySelector(`[data-testid="${tid}"]`)
      if (el && el.offsetParent !== null) {
        brandOk = await clickVintedField(tid, listing.brand, 'Marke', { autocomplete: true })
        if (brandOk) break
      }
    }
    if (!brandOk) {
      // Fallback: readonly input in der Nähe eines "Marke"-Labels
      await clickVintedFieldByLabel(['Marke', 'Brand', 'Marke wählen'], listing.brand, 'Marke')
    }
    await wait(700)
  }

  // Farbe – data-testid: color-select-dropdown-input
  if (listing.color) {
    setStatus('Farbe wird gesetzt…')
    await clickVintedField('color-select-dropdown-input', listing.color, 'Farbe')
    await wait(600)
  }

  // Material – data-testid: category-material-multi-list-input
  if (!listing.material) { console.warn('[ListSync] Material: leer, wird übersprungen') }
  if (listing.material) {
    setStatus('Material wird gesetzt…')
    const matOk = await clickVintedField('category-material-multi-list-input', listing.material, 'Material')
    if (!matOk) {
      const matByLabel = await clickVintedFieldByLabel(['Material', 'Stoff', 'Zusammensetzung'], listing.material, 'Material')
      if (!matByLabel) {
        await tryUnknownDropdown(['brand', 'color', 'condition', 'catalog-select', 'ship', 'title', 'description', 'price', 'size'], listing.material, 'Material')
      }
    }
    await wait(600)
  }

  // Versand / Sendungsgröße – Radio-Buttons: Klein / Mittel / Groß
  if (listing.shipSize) {
    setStatus('Versandgröße wird gesetzt…')
    await fillVintedShipping(listing.shipSize)
    await wait(600)
  }

  setStatus('✅ Felder fertig – Bilder werden geladen…')
  await injectImages()

  // Warten bis mindestens 1 Thumbnail im DOM sichtbar ist (max 25s)
  setStatus('Warte auf Bild-Thumbnails…')
  const thumbsOk = await waitForThumbnails(25000)

  if (thumbsOk) {
    await wait(1200)
    setStatus('Artikel wird veröffentlicht…')
    const submitBtn = findSubmitButton()
    if (submitBtn) {
      submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await wait(600)
      fullClick(submitBtn)
      setStatus('✅ Veröffentlicht!', true)
      // Feedback an ListSync-App: Platform-Badge setzen
      if (listing?.id) {
        chrome.runtime.sendMessage({ type: 'LISTING_POSTED', listingId: listing.id, platform: 'vinted' })
          .catch(() => {})
      }
    } else {
      setStatus('✅ Fertig! Bitte prüfen und absenden.', true)
      console.warn('[ListSync] Submit-Button nicht gefunden – bitte manuell absenden')
    }
  } else {
    setStatus('✅ Fertig! Bitte prüfen und absenden.', true)
    console.warn('[ListSync] Thumbnails nicht erschienen – bitte Bilder prüfen')
  }

  await chrome.storage.local.remove('pendingListing')
}

// ── Bilder injizieren ─────────────────────────────────────────────────────────
async function injectImages() {
  const { pendingListing } = await new Promise(r => chrome.storage.local.get('pendingListing', r))
  let imageData = pendingListing?.imageData

  // Polling: Background lädt Bilder async – warten bis sie da sind (max 20s)
  if (!imageData?.length) {
    console.warn('[ListSync] imageData leer – warte auf Background-Loader…')
    for (let i = 0; i < 25; i++) {
      await wait(800)
      const fresh = await new Promise(r => chrome.storage.local.get('pendingListing', d => r(d.pendingListing || null)))
      if (fresh?.imageData?.length) { imageData = fresh.imageData; break }
    }
  }
  console.warn('[ListSync] injectImages – imageData:', imageData?.length ?? 'LEER/NULL', 'Bilder')
  if (!imageData?.length) {
    console.warn('[ListSync] ❌ imageData leer – Bilder wurden nicht geladen (background.js)')
    return
  }

  setStatus(`📸 ${imageData.length} Bilder werden hochgeladen…`)

  // Strategie 1: MAIN-World via background.js
  try {
    console.warn('[ListSync] → Sende INJECT_MAIN_IMAGES…')
    const res = await chrome.runtime.sendMessage({ type: 'INJECT_MAIN_IMAGES', imageData })
    console.warn('[ListSync] ← INJECT_MAIN_IMAGES Antwort:', JSON.stringify(res))
    if (res?.ok) {
      console.warn('[ListSync] ✓ Bilder via MAIN-World –', imageData.length, 'Bilder')
      await wait(2000)
      return
    }
    console.warn('[ListSync] MAIN-World fehlgeschlagen:', res?.error)
  } catch(e) {
    console.warn('[ListSync] sendMessage Fehler:', e.message)
  }

  // Strategie 2: File-Input direkt per DataTransfer (Fallback)
  // Echte Vinted-testids: media-upload, plus, dropzone
  let fi = null
  for (let attempt = 0; attempt < 20; attempt++) {
    fi = document.querySelector('[data-testid="media-upload"] input[type="file"]')
      || document.querySelector('[data-testid="plus"] input[type="file"]')
      || document.querySelector('[data-testid="dropzone"] input[type="file"]')
      || document.querySelector('[data-testid="add-photos-input"]')
      || document.querySelector('input[type="file"][accept*="image"]')
      || document.querySelector('input[type="file"]')
    if (fi) break
    await wait(500)
  }
  if (!fi) { console.warn('[ListSync] File-Input nicht gefunden'); return }

  const dt = new DataTransfer()
  for (let i = 0; i < imageData.length; i++) {
    try {
      const { base64, type } = imageData[i]
      const [, d] = base64.split(',')
      const bin = atob(d)
      const arr = new Uint8Array(bin.length)
      for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j)
      dt.items.add(new File([arr], `photo_${i + 1}.jpg`, { type: 'image/jpeg' }))
    } catch(e) { console.warn('[ListSync] Bild-Fehler:', i, e.message) }
  }
  if (!dt.files.length) { console.warn('[ListSync] DataTransfer leer'); return }

  Object.defineProperty(fi, 'files', { get: () => dt.files, configurable: true })
  fi.dispatchEvent(new Event('change', { bubbles: true }))
  fi.dispatchEvent(new Event('input',  { bubbles: true }))
  console.log('[ListSync] Bilder via native DataTransfer –', dt.files.length, 'Bilder')
  await wait(2000)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fill)
} else {
  fill()
}
