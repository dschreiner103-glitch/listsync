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
  'Beauty':              '26395',
  'Beauty – Make-up':    '26395',
  'Beauty – Hautpflege': '11854',
  'Beauty – Parfüm & Düfte': '180345',
  'Haustiere':           '1281',
  'Haustiere – Hunde':   '20744',
  'Haustiere – Katzen':  '20741',
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

// ── Prelist/Suggest Seite abhandeln ──────────────────────────────────────────
// URL: https://www.ebay.de/sl/prelist/suggest
// eBay zeigt zuerst eine Suchmaske, um die Kategorie vorzuschlagen.
// Wir füllen den Titel ein und klicken "Weiter" / "Überspringen".

async function handlePrelist() {
  const listing = await getListing()
  if (!listing) return

  showBanner(listing)
  updateStatus('Prelist-Seite – Titel wird eingegeben…')
  await wait(2500)

  // Titelfeld finden (Label "Titel", hint "0/80")
  const searchInput = await waitForAny([
    'input[type="text"]',
    'input[id*="title"]',
    'input[name*="title"]',
    'input[aria-label*="Titel"]',
    'input[placeholder*="Angebotstitel"]',
  ], 12000).catch(() => null)

  if (searchInput) {
    searchInput.focus()
    await wait(200)
    setNativeValue(searchInput, listing.title)
    console.log('[ListSync eBay] ✓ Prelist-Titel eingegeben:', listing.title)
    await wait(800)
  }

  // "Weiter"-Button – unten auf der Seite, wird nach Titeleingabe aktiv
  const findNextBtn = () => {
    // Suche nach Button mit Text "Weiter"
    const allBtns = Array.from(document.querySelectorAll('button'))
    return allBtns.find(b => b.textContent.trim() === 'Weiter' || b.textContent.trim() === 'Fortfahren')
      || document.querySelector('button[type="submit"], button[data-testid*="next"], button[data-testid*="submit"]')
  }
  const nextBtn = findNextBtn()

  if (nextBtn) {
    nextBtn.click()
    console.log('[ListSync eBay] ✓ Prelist Weiter-Button geklickt')
    updateStatus('Kategorie-Auswahl – kurz warten…')
  } else {
    // Fallback: direkt zur Listing-Seite navigieren
    console.log('[ListSync eBay] Weiter-Button nicht gefunden – navigiere direkt')
    const catId = getCategoryId(listing.category)
    window.location.href = catId
      ? `https://www.ebay.de/sl/list?category=${catId}`
      : 'https://www.ebay.de/sl/list'
  }
}

// ── Neues /lstng Interface ────────────────────────────────────────────────────

async function fillLstng() {
  const listing = await getListing()
  if (!listing) return
  showBanner(listing)
  updateStatus('Neues eBay-Formular wird ausgefüllt…')

  // Seite braucht Zeit zum Laden (React SPA)
  await wait(3500)

  // 1. TITEL — "Angebotstitel" Feld (vom Prelist bereits befüllt, aber überschreiben)
  try {
    // Suche alle sichtbaren Text-Inputs und nimm den mit Angebotstitel-Label
    const titleInput = await waitForAny([
      'input[aria-label*="Angebotstitel"]',
      'input[aria-label*="Titel"]',
      'input[id*="title"]',
      'input[name*="title"]',
    ], 8000).catch(() => null)

    // Fallback: erstes nicht-hidden text-input
    const inp = titleInput || [...document.querySelectorAll('input[type="text"], input:not([type])')].find(el => {
      const label = document.querySelector(`label[for="${el.id}"]`)
      return label?.textContent?.includes('Angebotstitel') || label?.textContent?.includes('Titel')
    })

    if (inp) {
      inp.focus()
      await wait(200)
      const suffix = ' | Top Zustand ✅'
      const title = (listing.title + suffix).substring(0, 80)
      setNativeValue(inp, title)
      console.log('[ListSync eBay lstng] ✓ Titel:', title)
    }
  } catch(e) { console.warn('[ListSync eBay lstng] Titel-Fehler:', e.message) }

  await wait(400)

  // 2. ZUSTAND — Buttons "Neu" / "Gebraucht"
  try {
    const cond = (listing.condition || '').toLowerCase()
    const isNew = cond.includes('neu') || cond.includes('etikett')
    const targetText = isNew ? 'Neu' : 'Gebraucht'

    // Suche Button mit exaktem Text
    const allBtns = Array.from(document.querySelectorAll('button, [role="button"], [role="radio"]'))
    const condBtn = allBtns.find(b => b.textContent.trim() === targetText)
    if (condBtn) {
      condBtn.click()
      console.log('[ListSync eBay lstng] ✓ Zustand:', targetText)
    } else {
      // Fallback: "Gebraucht" als sicherer Standard
      const gebraucht = allBtns.find(b => b.textContent.trim() === 'Gebraucht')
      if (gebraucht) gebraucht.click()
    }
  } catch(e) { console.warn('[ListSync eBay lstng] Zustand-Fehler:', e.message) }

  await wait(400)

  // 3. BESCHREIBUNG — über "HTML-Code anzeigen" Checkbox → textarea
  try {
    let desc = listing.description || ''
    const extras = []
    if (listing.brand)     extras.push(`Marke: ${listing.brand}`)
    if (listing.condition) extras.push(`Zustand: ${listing.condition}`)
    if (listing.size)      extras.push(`Größe: ${listing.size}`)
    if (listing.color)     extras.push(`Farbe: ${listing.color}`)
    if (extras.length) desc = (desc ? desc + '\n\n' : '') + extras.join('\n')

    // Strategie 1: "HTML-Code anzeigen" Checkbox klicken → gibt einfaches textarea
    const allEls = Array.from(document.querySelectorAll('label, span, div'))
    const htmlLabel = allEls.find(el => el.textContent?.trim() === 'HTML-Code anzeigen')
    let filledViaHtml = false
    if (htmlLabel) {
      const cb = htmlLabel.tagName === 'LABEL'
        ? document.getElementById(htmlLabel.htmlFor) || htmlLabel.querySelector('input[type="checkbox"]')
        : htmlLabel.previousElementSibling?.querySelector?.('input[type="checkbox"]')
          || htmlLabel.closest('label')?.querySelector('input[type="checkbox"]')
      if (cb && !cb.checked) {
        cb.click()
        await wait(600)
      }
      const ta = document.querySelector('textarea[class*="desc"], textarea[name*="desc"], textarea[id*="desc"], textarea')
      if (ta) {
        ta.focus()
        setNativeValue(ta, desc)
        filledViaHtml = true
        console.log('[ListSync eBay lstng] ✓ Beschreibung via HTML-textarea')
      }
    }

    // Strategie 2: contenteditable direkt befüllen
    if (!filledViaHtml) {
      // Scrolle zur Beschreibung – sie erscheint nach Fotos & Merkmalen
      const allSections = Array.from(document.querySelectorAll('section, [class*="section"], [class*="module"]'))
      const descSection = allSections.find(s => s.textContent.includes('BESCHREIBUNG') || s.textContent.includes('Beschreibung'))
      if (descSection) descSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await wait(400)

      const editables = Array.from(document.querySelectorAll('[contenteditable="true"]'))
      // Nimm das größte contenteditable (wahrscheinlich der Editor)
      const editor = editables.sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
      if (editor) {
        editor.click()
        editor.focus()
        await wait(300)
        // Alles selektieren und ersetzen
        document.execCommand('selectAll', false, null)
        document.execCommand('delete', false, null)
        document.execCommand('insertText', false, desc)
        if (!editor.textContent.trim()) {
          // execCommand hat nicht funktioniert – innerHTML setzen
          editor.innerHTML = desc.replace(/\n/g, '<br>')
          editor.dispatchEvent(new Event('input',  { bubbles: true }))
        }
        console.log('[ListSync eBay lstng] ✓ Beschreibung via contenteditable')
      }
    }
  } catch(e) { console.warn('[ListSync eBay lstng] Beschreibung-Fehler:', e.message) }

  await wait(500)

  // 3b. ARTIKELMERKMALE — Marke & Farbe
  // Dropdown-Struktur: Button (chevron) → Klick → Panel mit Suchfeld + Optionsliste
  async function fillAspect(labelText, value) {
    if (!value) return false
    try {
      // Label finden (leaf-node mit exaktem Text)
      const label = Array.from(document.querySelectorAll('span, div, label, a'))
        .find(el => el.children.length === 0 && el.textContent.trim() === labelText)
      if (!label) { console.warn('[ListSync] Label nicht gefunden:', labelText); return false }

      // Dropdown-Button im selben Container klicken
      const container = label.closest('li, tr, [class*="row"], [class*="field"], [class*="aspect"]')
        || label.parentElement?.parentElement?.parentElement
      const dropBtn = container?.querySelector('button, [role="button"], [role="combobox"]')
      if (!dropBtn) { console.warn('[ListSync] Dropdown-Button nicht gefunden für:', labelText); return false }

      dropBtn.click()
      await wait(500)

      // Suchfeld hat placeholder "Suchen oder eigene Angaben machen"
      const searchInput = Array.from(document.querySelectorAll('input'))
        .find(el => el.placeholder?.includes('Suchen') || el.placeholder?.includes('eigene Angaben'))
      if (!searchInput) { console.warn('[ListSync] Suchfeld nicht gefunden für:', labelText); return false }

      searchInput.focus()
      setNativeValue(searchInput, value)
      await wait(500)

      // Passende Option in der Liste klicken
      // Optionen sind einfache Text-Items (span/div/li ohne viele Kinder)
      const options = Array.from(document.querySelectorAll(
        '[role="option"], [role="listitem"], li, [class*="option"], [class*="item"]'
      ))
      const match = options.find(el =>
        el.textContent.trim().toLowerCase() === value.toLowerCase()
      ) || options.find(el =>
        el.textContent.trim().toLowerCase().startsWith(value.toLowerCase().substring(0, 4))
      )

      if (match) {
        match.click()
        console.log('[ListSync eBay lstng] ✓', labelText, '→', value)
        await wait(300)
        return true
      }

      // Kein Treffer → "Eigene Angaben machen" via Enter bestätigen
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }))
      console.log('[ListSync eBay lstng] ✓', labelText, '→ eigene Angabe:', value)
      await wait(300)
      return true
    } catch(e) { console.warn('[ListSync] fillAspect Fehler:', e.message); return false }
  }

  if (listing.brand) { await fillAspect('Marke', listing.brand) }
  if (listing.color) { await fillAspect('Farbe', listing.color) }

  await wait(300)

  // 4. PREIS — "Artikelpreis" Feld mit € Symbol
  try {
    // Suche Input in der Nähe von "Artikelpreis" Label
    const priceInput = await waitForAny([
      'input[aria-label*="Artikelpreis"]',
      'input[aria-label*="Preis"]',
      'input[id*="price"]',
      'input[name*="price"]',
    ], 5000).catch(() => null)

    // Fallback: Input neben einem Label das "Artikelpreis" enthält
    const allLabels = Array.from(document.querySelectorAll('label, [class*="label"]'))
    const priceLabel = allLabels.find(l => l.textContent.trim() === 'Artikelpreis')
    const inp = priceInput || (priceLabel
      ? document.getElementById(priceLabel.htmlFor) || priceLabel.closest('div')?.querySelector('input')
      : null)

    if (inp) {
      inp.focus()
      await wait(200)
      const priceStr = String(Number(listing.price).toFixed(2)).replace('.', ',')
      setNativeValue(inp, priceStr)
      console.log('[ListSync eBay lstng] ✓ Preis:', priceStr)
    }
  } catch(e) { console.warn('[ListSync eBay lstng] Preis-Fehler:', e.message) }

  await wait(400)

  // 5. BILDER hochladen
  updateStatus('Bilder werden hochgeladen…')
  await wait(500)
  await uploadImages(listing.imageData || [])

  updateStatus('✅ Fertig – Lieferung prüfen & Angebot einstellen', true)
  await chrome.storage.local.remove('pendingListing')
  console.log('[ListSync eBay lstng] ✅ Alles ausgefüllt')
}

// ── Altes /sl/list Interface ───────────────────────────────────────────────────

async function fill() {
  const listing = await getListing()
  if (!listing) return
  showBanner(listing)

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

// ── Entry point: Prelist-Seite oder Listing-Seite? ────────────────────────────

function init() {
  const path = window.location.pathname
  if (path.includes('/prelist')) {
    setTimeout(handlePrelist, 2000)
  } else if (path.includes('/lstng')) {
    setTimeout(fillLstng, 3000)
  } else if (path.includes('/sl/list')) {
    setTimeout(fill, 3000)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
