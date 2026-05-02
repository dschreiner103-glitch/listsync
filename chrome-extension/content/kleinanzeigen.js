'use strict'

// ── Kleinanzeigen Kategorie-Mapping (ListSync → Kleinanzeigen) ────────────────
// Format: [Hauptkategorie-Text, Unterkategorie-Text (optional)]
const CATEGORY_MAP = {
  // Damen
  'Damen': ['Mode & Beauty', 'Damenmode'],
  'Damen – Kleidung': ['Mode & Beauty', 'Damenmode'],
  'Damen – Schuhe': ['Mode & Beauty', 'Damenschuhe'],
  'Damen – Taschen': ['Mode & Beauty', 'Taschen & Accessoires'],
  'Damen – Accessoires': ['Mode & Beauty', 'Taschen & Accessoires'],
  'Damen – Beauty': ['Mode & Beauty', 'Kosmetik & Wellness'],
  // Herren
  'Herren': ['Mode & Beauty', 'Herrenmode'],
  'Herren – Kleidung': ['Mode & Beauty', 'Herrenmode'],
  'Herren – Schuhe': ['Mode & Beauty', 'Herrenschuhe'],
  'Herren – Accessoires': ['Mode & Beauty', 'Taschen & Accessoires'],
  // Kinder
  'Kinder': ['Familie, Kind & Baby', 'Kinderkleidung & -accessoires'],
  'Kinder – Baby': ['Familie, Kind & Baby', 'Kinderkleidung & -accessoires'],
  'Kinder – Mädchen': ['Familie, Kind & Baby', 'Kinderkleidung & -accessoires'],
  'Kinder – Jungs': ['Familie, Kind & Baby', 'Kinderkleidung & -accessoires'],
  'Kinder – Spielzeug & Freizeit': ['Familie, Kind & Baby', 'Spielzeug'],
  // Sonstiges
  'Sonstiges – Elektronik': ['Elektronik', ''],
  'Sonstiges – Home & Living': ['Haushaltsgeräte & Möbel', ''],
  'Sonstiges – Sport & Outdoor': ['Sport & Camping', ''],
  'Sonstiges – Unterhaltung': ['Musik, Filme & Bücher', ''],
}

function getCategoryForListing(category) {
  if (!category) return null
  // Exakter Match
  if (CATEGORY_MAP[category]) return CATEGORY_MAP[category]
  // Prefix-Match (längster zuerst)
  const keys = Object.keys(CATEGORY_MAP).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (category.startsWith(key)) return CATEGORY_MAP[key]
  }
  // Damen/Herren/Kinder Fallback aus erstem Segment
  const first = category.split(' – ')[0]
  if (CATEGORY_MAP[first]) return CATEGORY_MAP[first]
  return null
}

// ── Zustand-Mapping (Vinted → Kleinanzeigen) ──────────────────────────────────
function mapCondition(condition) {
  if (!condition) return null
  const c = condition.toLowerCase()
  if (c.includes('neu') || c.includes('new') || c.includes('ohne etikett') || c.includes('nie getragen')) return 'Neu'
  if (c.includes('sehr gut') || c.includes('very good')) return 'Sehr gut'
  if (c.includes('gut') || c.includes('good')) return 'Gut'
  if (c.includes('befriedigend') || c.includes('satisfactory') || c.includes('akzeptabel')) return 'Akzeptabel'
  return null
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
async function getListing() {
  return new Promise(resolve => {
    chrome.storage.local.get('pendingListing', r => resolve(r.pendingListing || null))
  })
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

function waitFor(selector, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector)
    if (el) return resolve(el)
    const ob = new MutationObserver(() => {
      const found = document.querySelector(selector)
      if (found) { ob.disconnect(); clearTimeout(tid); resolve(found) }
    })
    ob.observe(document.body, { childList: true, subtree: true })
    const tid = setTimeout(() => { ob.disconnect(); reject(new Error('Timeout: ' + selector)) }, timeout)
  })
}

function waitForAny(selectors, timeout = 10000) {
  return new Promise((resolve, reject) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el) return resolve(el)
    }
    const ob = new MutationObserver(() => {
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el) { ob.disconnect(); clearTimeout(tid); return resolve(el) }
      }
    })
    ob.observe(document.body, { childList: true, subtree: true })
    const tid = setTimeout(() => { ob.disconnect(); reject(new Error('Timeout')) }, timeout)
  })
}

function fillInput(el, value) {
  if (!el || value === undefined || value === null) return
  el.focus()
  // Versuche execCommand (für ältere React-Versionen)
  document.execCommand('selectAll', false)
  document.execCommand('delete', false)
  document.execCommand('insertText', false, String(value))
  // Fallback: native setter
  if (el.value !== String(value)) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (setter) setter.call(el, String(value))
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.dispatchEvent(new Event('blur',   { bubbles: true }))
  }
}

// ── Banner ────────────────────────────────────────────────────────────────────
function showBanner(listing) {
  if (document.getElementById('ls-banner')) return
  const d = document.createElement('div')
  d.id = 'ls-banner'
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#4f46e5;color:#fff;font-family:sans-serif;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 3px 16px rgba(0,0,0,.4)'
  const imgs = (listing.images || []).slice(0, 5).map(u =>
    `<img src="${u.startsWith('http') ? u : 'https://project-dle5b.vercel.app' + u}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:2px solid rgba(255,255,255,.4)">`
  ).join('')
  d.innerHTML = `
    <span style="font-size:20px">🔗</span>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:13px">ListSync – wird ausgefüllt…</div>
      <div style="font-size:11px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${listing.title} · ${listing.price} €</div>
    </div>
    <div style="display:flex;gap:4px">${imgs}</div>
    <button onclick="document.getElementById('ls-banner').remove();document.body.style.paddingTop=''"
      style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600">✕</button>
  `
  document.body.prepend(d)
  document.body.style.paddingTop = '54px'
}

function updateBanner(text) {
  const b = document.getElementById('ls-banner')
  if (!b) return
  const label = b.querySelector('div > div:first-child')
  if (label) label.textContent = text
}

// ── Bilder hochladen ──────────────────────────────────────────────────────────
function base64ToFiles(imageData) {
  return (imageData || []).map((img, i) => {
    const [, data] = img.base64.split(',')
    const mime = img.type || 'image/jpeg'
    const ext  = mime.split('/')[1] || 'jpg'
    const binary = atob(data)
    const arr = new Uint8Array(binary.length)
    for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j)
    return new File([arr], `listsync_${i+1}.${ext}`, { type: mime })
  })
}

async function uploadImages(imageData) {
  if (!imageData?.length) return
  const files = base64ToFiles(imageData)
  if (!files.length) return
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))
  try {
    const fileSelectors = [
      'input[type="file"][accept*="image"]',
      'input[type="file"][multiple]',
      'input[type="file"]',
      '#ui-id-10',
    ]
    let fi = null
    for (const sel of fileSelectors) {
      fi = document.querySelector(sel)
      if (fi) break
    }
    if (!fi) {
      fi = await waitFor('input[type="file"]', 8000)
    }
    Object.defineProperty(fi, 'files', { value: dt.files, configurable: true, writable: true })
    fi.dispatchEvent(new Event('change', { bubbles: true }))
    console.log('[ListSync KA] ✓ Bilder übertragen:', files.length)
  } catch(e) { console.warn('[ListSync KA] Bild-Upload fehlgeschlagen:', e.message) }
}

// ── Kategorie auswählen ───────────────────────────────────────────────────────
async function selectCategory(listing) {
  const catInfo = getCategoryForListing(listing.category)
  if (!catInfo) return

  const [hauptkat, unterkat] = catInfo
  if (!hauptkat) return

  try {
    // Kategorie-Button/Link suchen
    const catBtn = document.querySelector(
      '#category-selector, [data-testid="category-selector"], a[href*="kategorie"], #postad-category-path-selector, .categorybox'
    )
    if (!catBtn) return

    catBtn.click()
    await wait(1000)

    // Hauptkategorie klicken
    const allLinks = [...document.querySelectorAll('a, li, [role="option"], [role="menuitem"]')]
    const hauptEl = allLinks.find(el => el.textContent.trim() === hauptkat || el.textContent.includes(hauptkat))
    if (hauptEl) {
      hauptEl.click()
      await wait(800)
    }

    // Unterkategorie klicken
    if (unterkat) {
      const allLinks2 = [...document.querySelectorAll('a, li, [role="option"], [role="menuitem"]')]
      const unterEl = allLinks2.find(el => el.textContent.trim() === unterkat || el.textContent.includes(unterkat))
      if (unterEl) {
        unterEl.click()
        await wait(600)
      }
    }

    console.log('[ListSync KA] ✓ Kategorie gesetzt:', hauptkat, unterkat)
  } catch(e) {
    console.warn('[ListSync KA] Kategorie-Fehler:', e.message)
  }
}

// ── Zustand auswählen ─────────────────────────────────────────────────────────
async function selectCondition(listing) {
  const condition = mapCondition(listing.condition)
  if (!condition) return

  try {
    // Zustand-Dropdown oder Radio-Buttons
    const conditionSelectors = [
      'select[name*="condition"]',
      'select[id*="condition"]',
      'select[name*="zustand"]',
      '#postad-condition',
      '[data-testid*="condition"]',
    ]
    for (const sel of conditionSelectors) {
      const el = document.querySelector(sel)
      if (el && el.tagName === 'SELECT') {
        const options = [...el.options]
        const match = options.find(o =>
          o.text.toLowerCase().includes(condition.toLowerCase()) ||
          o.value.toLowerCase().includes(condition.toLowerCase())
        )
        if (match) {
          el.value = match.value
          el.dispatchEvent(new Event('change', { bubbles: true }))
          console.log('[ListSync KA] ✓ Zustand:', condition)
          return
        }
      }
    }

    // Radio-Buttons / Checkboxen für Zustand
    const allLabels = [...document.querySelectorAll('label')]
    const condLabel = allLabels.find(l => l.textContent.trim().toLowerCase().includes(condition.toLowerCase()))
    if (condLabel) {
      const input = condLabel.querySelector('input') || document.getElementById(condLabel.htmlFor)
      if (input) {
        input.click()
        console.log('[ListSync KA] ✓ Zustand (radio):', condition)
      }
    }
  } catch(e) {
    console.warn('[ListSync KA] Zustand-Fehler:', e.message)
  }
}

// ── VB (Verhandelbar) Checkbox setzen ────────────────────────────────────────
async function setNegotiable() {
  try {
    const vbSelectors = [
      'input[id*="negotiable"]',
      'input[name*="negotiable"]',
      'input[id*="priceType"]',
      '#postad-priceType-negotiable',
    ]
    for (const sel of vbSelectors) {
      const cb = document.querySelector(sel)
      if (cb && !cb.checked) {
        cb.click()
        await wait(200)
        break
      }
    }
  } catch {}
}

// ── Versand-Optionen setzen ───────────────────────────────────────────────────
async function setShipping(listing) {
  if (!listing.shipping?.length) return
  try {
    // DHL / Hermes Checkboxen
    const shippingMap = {
      'dhl': ['dhl', 'paket'],
      'hermes': ['hermes'],
      'dpd': ['dpd'],
    }
    const checkboxes = [...document.querySelectorAll('input[type="checkbox"]')]
    for (const cb of checkboxes) {
      const label = document.querySelector(`label[for="${cb.id}"]`)
      const text = (label?.textContent || '').toLowerCase()
      for (const ship of listing.shipping) {
        const keywords = shippingMap[ship.toLowerCase()] || [ship.toLowerCase()]
        if (keywords.some(k => text.includes(k)) && !cb.checked) {
          cb.click()
          await wait(200)
        }
      }
    }
  } catch {}
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────
async function fill() {
  const listing = await getListing()
  if (!listing) return
  showBanner(listing)

  await wait(1500)

  // Titel (max 70 Zeichen bei Kleinanzeigen)
  try {
    const el = await waitForAny(['#postad-title', 'input[name="title"]', 'input[placeholder*="Titel"]'])
    await wait(300)
    const title = listing.title.substring(0, 70)
    fillInput(el, title)
    console.log('[ListSync KA] ✓ Titel:', title)
  } catch(e) { console.warn('[ListSync KA] Titel-Fehler:', e.message) }

  await wait(400)

  // Beschreibung
  try {
    const el = await waitForAny(['#postad-description', 'textarea[name="description"]', 'textarea[placeholder*="Beschreibung"]'])
    await wait(200)
    // Beschreibung + Condition + Brand info
    let desc = listing.description || ''
    const extras = []
    if (listing.brand) extras.push(`Marke: ${listing.brand}`)
    if (listing.condition) extras.push(`Zustand: ${listing.condition}`)
    if (listing.size) extras.push(`Größe: ${listing.size}`)
    if (extras.length) desc = desc + (desc ? '\n\n' : '') + extras.join('\n')
    fillInput(el, desc)
    console.log('[ListSync KA] ✓ Beschreibung')
  } catch(e) { console.warn('[ListSync KA] Beschreibung-Fehler:', e.message) }

  await wait(300)

  // Preis
  try {
    const el = await waitForAny(['#postad-price', 'input[name="price"]', 'input[placeholder*="Preis"]', 'input[type="number"]'])
    await wait(200)
    fillInput(el, String(Math.round(listing.price)))
    console.log('[ListSync KA] ✓ Preis:', listing.price)
  } catch(e) { console.warn('[ListSync KA] Preis-Fehler:', e.message) }

  // VB aktivieren
  await wait(300)
  await setNegotiable()

  // Kategorie
  updateBanner('ListSync – Kategorie wird gesetzt…')
  await wait(500)
  await selectCategory(listing)

  // Zustand
  updateBanner('ListSync – Zustand wird gesetzt…')
  await wait(500)
  await selectCondition(listing)

  // Versand
  await wait(300)
  await setShipping(listing)

  // Bilder
  updateBanner('ListSync – Bilder werden hochgeladen…')
  await wait(500)
  await uploadImages(listing.imageData || [])

  updateBanner('ListSync ✅ Fertig – bitte prüfen & absenden')
  await chrome.storage.local.remove('pendingListing')
  console.log('[ListSync KA] ✅ Alles ausgefüllt')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(fill, 1500))
} else {
  setTimeout(fill, 1500)
}
