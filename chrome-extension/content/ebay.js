'use strict'

// ── eBay Anzeige automatisch ausfüllen ────────────────────────────────────────
// Ziel-URL: https://www.ebay.de/sl/list

// Kategorie-Mapping ListSync → eBay Kategorie-IDs (häufigste Kleidungs-Kats)
const CATEGORY_IDS = {
  'Damen':               '63861',
  'Damen – Kleidung':    '63861',
  'Damen – Schuhe':      '63889',
  'Damen – Taschen':     '169291',
  'Herren':              '57988',
  'Herren – Kleidung':   '57988',
  'Herren – Schuhe':     '93427',
  'Kinder':              '171146',
  'Kinder – Mädchen':    '171146',
  'Kinder – Jungs':      '171147',
  'Elektronik':          '293',
  'Sonstiges':           '99',
}

function getCategoryId(category) {
  if (!category) return null
  if (CATEGORY_IDS[category]) return CATEGORY_IDS[category]
  const keys = Object.keys(CATEGORY_IDS).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (category.startsWith(key)) return CATEGORY_IDS[key]
  }
  const first = category.split(' – ')[0]
  return CATEGORY_IDS[first] || null
}

// Zustand-Mapping → eBay conditionId
function getConditionId(condition) {
  if (!condition) return null
  const c = condition.toLowerCase()
  if (c.includes('neu mit etikett'))    return '1000'  // Neu mit Etikett
  if (c.includes('neu ohne etikett'))   return '1500'  // Neu ohne Etikett
  if (c.includes('nie getragen'))       return '1500'
  if (c.includes('sehr gut'))           return '2750'  // Sehr gut
  if (c.includes('gut'))                return '3000'  // Gut
  if (c.includes('akzeptabel'))         return '5000'  // Akzeptabel
  return null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getListing() {
  return new Promise(r => chrome.storage.local.get('pendingListing', d => r(d.pendingListing || null)))
}

const wait = ms => new Promise(r => setTimeout(r, ms))

function waitForAny(selectors, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const find = () => {
      for (const s of selectors) {
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
    ob.observe(document.body, { childList: true, subtree: true })
    const tid = setTimeout(() => { ob.disconnect(); reject(new Error('Timeout: ' + selectors[0])) }, timeout)
  })
}

function setNativeValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input',  { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('blur',   { bubbles: true }))
}

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

// ── Banner ────────────────────────────────────────────────────────────────────

function showBanner(listing) {
  if (document.getElementById('ls-banner')) return
  const d = document.createElement('div')
  d.id = 'ls-banner'
  d.style.cssText = [
    'position:fixed;top:0;left:0;right:0;z-index:2147483647',
    'background:#e53935;color:#fff;font-family:sans-serif',
    'padding:10px 16px;display:flex;align-items:center;gap:10px',
    'box-shadow:0 3px 16px rgba(0,0,0,.4)',
  ].join(';')
  const imgs = (listing.images || []).slice(0, 4).map(u =>
    `<img src="${u.startsWith('http') ? u : 'https://project-dle5b.vercel.app' + u}"
      style="width:34px;height:34px;object-fit:cover;border-radius:5px;border:2px solid rgba(255,255,255,.4)">`
  ).join('')
  d.innerHTML = `
    <span style="font-size:20px">🛒</span>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:13px">ListSync → eBay</div>
      <div id="ls-status" style="font-size:11px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${listing.title} · ${listing.price} €</div>
    </div>
    <div style="display:flex;gap:4px">${imgs}</div>
    <button onclick="document.getElementById('ls-banner').remove();document.body.style.paddingTop=''"
      style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600">✕</button>
  `
  document.body.prepend(d)
  document.body.style.paddingTop = '54px'
}

function updateStatus(msg, done = false) {
  const el = document.getElementById('ls-status')
  if (el) el.textContent = msg
  if (done) {
    const b = document.getElementById('ls-banner')
    if (b) b.style.background = '#16a34a'
  }
  console.log('[ListSync eBay]', msg)
}

// ── Titel ausfüllen ───────────────────────────────────────────────────────────

async function fillTitle(listing) {
  try {
    const el = await waitForAny([
      'input[id="itemTitle"]',
      'input[name="itemTitle"]',
      '[data-testid="title-input"] input',
      '[data-testid="item-title"] input',
      'input[aria-label*="Titel"]',
      'input[aria-label*="Artikelbezeichnung"]',
      'input[placeholder*="Titel"]',
      'input[placeholder*="Artikelbezeichnung"]',
    ], 15000)
    const suffix = ' | Top Zustand ✅'
    const title  = (listing.title + suffix).substring(0, 80)
    setNativeValue(el, title)
    console.log('[ListSync eBay] ✓ Titel:', title)
  } catch(e) { console.warn('[ListSync eBay] Titel-Fehler:', e.message) }
}

// ── Preis ausfüllen ───────────────────────────────────────────────────────────

async function fillPrice(listing) {
  try {
    const el = await waitForAny([
      'input[id="binPrice"]',
      'input[name="startPrice"]',
      'input[name="binPrice"]',
      '[data-testid="bin-price-input"] input',
      '[data-testid="price-input"] input',
      'input[aria-label*="Preis"]',
      'input[aria-label*="Kaufpreis"]',
      'input[placeholder*="Preis"]',
      '#price-input',
    ], 10000)
    // eBay DE uses comma as decimal separator
    const priceStr = String(Number(listing.price).toFixed(2)).replace('.', ',')
    setNativeValue(el, priceStr)
    console.log('[ListSync eBay] ✓ Preis:', priceStr)
  } catch(e) { console.warn('[ListSync eBay] Preis-Fehler:', e.message) }
}

// ── Beschreibung ausfüllen ────────────────────────────────────────────────────

async function fillDescription(listing) {
  try {
    let desc = listing.description || ''
    const extras = []
    if (listing.brand)     extras.push(`Marke: ${listing.brand}`)
    if (listing.condition) extras.push(`Zustand: ${listing.condition}`)
    if (listing.size)      extras.push(`Größe: ${listing.size}`)
    if (listing.color)     extras.push(`Farbe: ${listing.color}`)
    if (extras.length) desc = desc + (desc ? '\n\n' : '') + extras.join('\n')

    // Check for TinyMCE/rich text iframe first
    const iframes = document.querySelectorAll('iframe')
    for (const iframe of iframes) {
      try {
        const iDoc = iframe.contentDocument
        if (!iDoc) continue
        const body = iDoc.querySelector('body[contenteditable], #tinymce, .mce-content-body, [contenteditable="true"]')
        if (body) {
          body.innerHTML = desc.replace(/\n/g, '<br>')
          body.dispatchEvent(new Event('input', { bubbles: true }))
          console.log('[ListSync eBay] ✓ Beschreibung (iframe/TinyMCE)')
          return
        }
      } catch {}
    }

    // Fallback: plain textarea or contenteditable
    const el = await waitForAny([
      'textarea[id*="desc"]',
      'textarea[name*="desc"]',
      '[data-testid*="description"] textarea',
      '[data-testid*="description"] [contenteditable]',
      'textarea[aria-label*="Beschreibung"]',
      'textarea[placeholder*="Beschreibung"]',
      '[contenteditable="true"]',
    ], 8000)

    if (el.contentEditable === 'true') {
      el.innerHTML = desc.replace(/\n/g, '<br>')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      setNativeValue(el, desc)
    }
    console.log('[ListSync eBay] ✓ Beschreibung')
  } catch(e) { console.warn('[ListSync eBay] Beschreibung-Fehler:', e.message) }
}

// ── Zustand auswählen ─────────────────────────────────────────────────────────

async function selectCondition(listing) {
  const condId = getConditionId(listing.condition)
  if (!condId) return
  try {
    // Radio buttons with data value
    const radios = document.querySelectorAll(`input[type="radio"][value="${condId}"]`)
    if (radios.length) {
      radios[0].click()
      console.log('[ListSync eBay] ✓ Zustand (radio):', condId)
      return
    }
    // Select dropdown
    const sel = document.querySelector('select[id*="condition"], select[name*="condition"], [data-testid*="condition"] select')
    if (sel) {
      sel.value = condId
      sel.dispatchEvent(new Event('change', { bubbles: true }))
      console.log('[ListSync eBay] ✓ Zustand (select):', condId)
    }
  } catch(e) { console.warn('[ListSync eBay] Zustand-Fehler:', e.message) }
}

// ── Bilder hochladen ──────────────────────────────────────────────────────────

async function uploadImages(imageData) {
  if (!imageData?.length) return

  // Strategy 1: MAIN world via background (handles React Fiber)
  try {
    const res = await chrome.runtime.sendMessage({ type: 'INJECT_MAIN_IMAGES', imageData })
    if (res?.ok) {
      console.log('[ListSync eBay] ✓ Bilder via MAIN-World:', imageData.length)
      return
    }
  } catch {}

  // Strategy 2: DataTransfer on file input
  const files = base64ToFiles(imageData)
  if (!files.length) return
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))

  const fi = document.querySelector(
    'input[type="file"][accept*="image"], input[type="file"][multiple], input[type="file"]'
  )
  if (fi) {
    Object.defineProperty(fi, 'files', { value: dt.files, configurable: true, writable: true })
    fi.dispatchEvent(new Event('change', { bubbles: true }))
    fi.dispatchEvent(new Event('input',  { bubbles: true }))
    console.log('[ListSync eBay] ✓ Bilder via DataTransfer:', files.length)
    return
  }

  // Strategy 3: Drop zone
  const dropZone = document.querySelector(
    '[class*="photo-upload"], [class*="PhotoUpload"], [data-testid*="photo"], [data-testid*="upload"]'
  )
  if (dropZone) {
    dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }))
    dropZone.dispatchEvent(new DragEvent('dragover',  { bubbles: true, cancelable: true, dataTransfer: dt }))
    dropZone.dispatchEvent(new DragEvent('drop',      { bubbles: true, cancelable: true, dataTransfer: dt }))
    console.log('[ListSync eBay] ✓ Bilder via Drop-Zone')
  }
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────

async function fill() {
  const listing = await getListing()
  if (!listing) return
  showBanner(listing)

  // eBay SPA braucht mehr Zeit zum Laden
  await wait(3000)

  updateStatus('Titel wird ausgefüllt…')
  await fillTitle(listing)
  await wait(500)

  updateStatus('Preis wird ausgefüllt…')
  await fillPrice(listing)
  await wait(400)

  updateStatus('Beschreibung wird ausgefüllt…')
  await fillDescription(listing)
  await wait(400)

  updateStatus('Zustand wird gesetzt…')
  await selectCondition(listing)
  await wait(400)

  updateStatus('Bilder werden hochgeladen…')
  await wait(500)
  await uploadImages(listing.imageData || [])

  updateStatus('✅ Fertig – Kategorie & Versand prüfen, dann absenden', true)
  await chrome.storage.local.remove('pendingListing')
  console.log('[ListSync eBay] ✅ Alles ausgefüllt')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(fill, 3000))
} else {
  setTimeout(fill, 3000)
}
