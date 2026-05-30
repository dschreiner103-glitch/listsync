'use strict'

// ── eBay Anzeige automatisch ausfüllen ────────────────────────────────────────

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

// Zustand-Mapping
// Live-bestätigt: 1000=Neu mit Etikett, 1500=Neu ohne Etikett, 1750=Neu mit Mängeln,
//                 2990=Gebraucht - Hervorragend, 3000=Gebraucht - Gut, 3010=Gebraucht - Akzeptabel
function getConditionId(condition) {
  if (!condition) return null
  const c = condition.toLowerCase()
  if (c.includes('neu mit etikett'))                                return '1000'
  if (c.includes('neu ohne etikett') || c.includes('nie getragen')) return '1500'
  if (c.includes('neu mit mängeln'))                                return '1750'
  if (c.includes('hervorragend') || c.includes('sehr gut'))         return '2990'
  if (c.includes('befriedigend') || c.includes('akzeptabel'))       return '3010'
  if (c.includes('gut'))                                            return '3000'
  return null
}

function detectProduktart(listing) {
  const text = [listing.category, listing.title, listing.kaCategory, listing.description]
    .filter(Boolean).join(' ').toLowerCase()
  if (text.includes('jeans'))                                     return 'Jeans'
  if (text.includes('legging'))                                   return 'Leggings'
  if (text.includes('shorts') || text.includes('kurze hose'))     return 'Shorts'
  if (text.includes('rock') && !text.includes('pullover'))        return 'Rock'
  if (text.includes('kleid') || text.includes('röcke & kleid'))   return 'Kleid'
  if (text.includes('bluse'))                                     return 'Bluse'
  if (text.includes('overall') || text.includes('jumpsuit'))      return 'Jumpsuit'
  if (text.includes('blazer'))                                    return 'Blazer'
  if (text.includes('mantel'))                                    return 'Mantel'
  if (text.includes('jacke'))                                     return 'Jacke'
  if (text.includes('weste'))                                     return 'Weste'
  if (text.includes('pullover') || text.includes('strick'))       return 'Pullover'
  if (text.includes('hoodie') || text.includes('kapuzenpull'))    return 'Hoodie'
  if (text.includes('sweatshirt'))                                return 'Sweatshirt'
  if (text.includes('t-shirt') || text.includes('tshirt'))        return 'T-Shirt'
  if (text.includes('top') || text.includes('shirt'))             return 'T-Shirt'
  if (text.includes('hose'))                                      return 'Hose'
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
    ob.observe(document.body, { childList: true, subtree: true, attributes: true })
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

// ── Bilder hochladen ──────────────────────────────────────────────────────────

async function uploadImages(imageData) {
  if (!imageData?.length) return
  try {
    const res = await chrome.runtime.sendMessage({ type: 'INJECT_MAIN_IMAGES', imageData })
    if (res?.ok) { console.log('[ListSync eBay] ✓ Bilder via MAIN-World:', imageData.length); return }
  } catch {}
  const files = base64ToFiles(imageData)
  if (!files.length) return
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))
  const fi = document.querySelector('input[type="file"][accept*="image"], input[type="file"][multiple], input[type="file"]')
  if (fi) {
    Object.defineProperty(fi, 'files', { value: dt.files, configurable: true, writable: true })
    fi.dispatchEvent(new Event('change', { bubbles: true }))
    fi.dispatchEvent(new Event('input',  { bubbles: true }))
    console.log('[ListSync eBay] ✓ Bilder via DataTransfer:', files.length)
    return
  }
  const dropZone = document.querySelector('[class*="photo-upload"], [class*="PhotoUpload"], [data-testid*="photo"], [data-testid*="upload"]')
  if (dropZone) {
    dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }))
    dropZone.dispatchEvent(new DragEvent('dragover',  { bubbles: true, cancelable: true, dataTransfer: dt }))
    dropZone.dispatchEvent(new DragEvent('drop',      { bubbles: true, cancelable: true, dataTransfer: dt }))
    console.log('[ListSync eBay] ✓ Bilder via Drop-Zone')
  }
}

// ── Prelist-Seite ─────────────────────────────────────────────────────────────

async function handlePrelist() {
  const listing = await getListing()
  if (!listing) return
  showBanner(listing)
  updateStatus('Prelist – Titel wird eingegeben…')
  await wait(2500)

  const searchInput = await waitForAny([
    'input[type="text"]', 'input[id*="title"]', 'input[name*="title"]',
    'input[aria-label*="Titel"]', 'input[placeholder*="Angebotstitel"]',
  ], 12000).catch(() => null)

  if (searchInput) {
    searchInput.focus()
    await wait(200)
    setNativeValue(searchInput, listing.title)
    await wait(800)
  }

  const nextBtn = Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === 'Weiter' || b.textContent.trim() === 'Fortfahren')
    || document.querySelector('button[type="submit"]')

  if (nextBtn) {
    nextBtn.click()
    updateStatus('Kategorie-Auswahl…')
    await wait(2500)
    if (window.location.pathname.includes('/prelist') || window.location.pathname.includes('/sl/list')) {
      const CLOTHING_KW = ['kleidung', 'mode', 'jeans', 'damen', 'herren', 'hosen', 'jacken', 'shirts', 'tops', 'pullover']
      const allOpts = Array.from(document.querySelectorAll('button, [role="option"], [role="radio"], li, [class*="suggest"], [class*="categor"]')).filter(el => el.offsetParent)
      let picked = null
      for (const kw of CLOTHING_KW) {
        picked = allOpts.find(el => el.textContent.toLowerCase().includes(kw))
        if (picked) break
      }
      if (picked) {
        picked.click()
        await wait(800)
        const confirmBtn = Array.from(document.querySelectorAll('button'))
          .find(b => b.offsetParent && ['Weiter', 'Bestätigen', 'Fortfahren'].includes(b.textContent.trim()))
        if (confirmBtn) confirmBtn.click()
      }
    }
  }
}

// ── /lstng Interface ──────────────────────────────────────────────────────────

async function fillLstng() {
  const listing = await getListing()
  if (!listing) return
  showBanner(listing)
  updateStatus('eBay-Formular wird ausgefüllt…')
  await wait(3500)

  // 0. KATEGORIE: falsche Auto-Kategorie korrigieren
  try {
    const WRONG = ['Kraftstoff', 'Propellerart', 'Modellbauklasse', 'Maßstab', 'Montagezustand', 'Kabinenklasse']
    if (WRONG.some(f => document.body.innerText.includes(f))) {
      updateStatus('⚠️ Falsche Kategorie – korrigiere…')
      const editBtn = Array.from(document.querySelectorAll('button, a, [role="button"]'))
        .find(el => el.offsetParent && el.textContent.trim() === 'Bearbeiten')
      if (editBtn) {
        editBtn.scrollIntoView({ behavior: 'smooth', block: 'center' })
        await wait(500); editBtn.click(); await wait(2000)
        const inp = document.querySelector('input[placeholder*="Suchen"], input[type="search"], input[type="text"]')
        if (inp) {
          const q = (listing.category || '').toLowerCase().includes('herren') ? 'Herren Jeans'
                  : (listing.category || '').toLowerCase().includes('kinder') ? 'Kinder Kleidung'
                  : 'Damen Jeans'
          inp.focus(); setNativeValue(inp, q)
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }))
          await wait(2000)
          const res = Array.from(document.querySelectorAll('[role="option"], li')).filter(el => el.offsetParent && el.textContent.trim().length > 2)
          if (res[0]) { res[0].click(); await wait(1000) }
          const ok = Array.from(document.querySelectorAll('button'))
            .find(b => b.offsetParent && ['Fertig','Bestätigen','OK','Weiter'].includes(b.textContent.trim()))
          if (ok) { ok.click(); await wait(2500) }
        }
      }
    }
  } catch(e) { console.warn('[eBay] Kategorie-Fix:', e.message) }

  // 1. TITEL
  try {
    const inp = await waitForAny([
      'input[aria-label*="Angebotstitel"]', 'input[aria-label*="Titel"]',
      'input[id*="title"]', 'input[name*="title"]',
    ], 8000).catch(() => null)
    if (inp) {
      inp.focus(); await wait(200)
      setNativeValue(inp, (listing.title + ' | Top Zustand ✅').substring(0, 80))
      console.log('[eBay lstng] ✓ Titel')
    }
  } catch(e) { console.warn('[eBay lstng] Titel:', e.message) }

  await wait(400)

  // 2. ZUSTAND
  // Quick-Tiles auf der Seite: "Neu mit Etikett", "Gebraucht - Gut" + Icon-Button "..." (leerer Text!)
  // "..." Button: class enthält "fake-menu-button" UND "icon-btn", ariaLabel="Weitere Optionen"
  try {
    const condId = getConditionId(listing.condition)
    if (condId) {
      const COND_LABELS = {
        '1000': ['Neu mit Etikett'],
        '1500': ['Neu ohne Etikett'],
        '1750': ['Neu mit Mängeln'],
        '2990': ['Gebraucht - Hervorragend', 'Gebraucht – Hervorragend'],
        '3000': ['Gebraucht - Gut', 'Gebraucht – Gut'],
        '3010': ['Gebraucht - Akzeptabel', 'Gebraucht – Akzeptabel'],
      }
      const labels = COND_LABELS[condId] || []

      const zustandHdr = Array.from(document.querySelectorAll('h2,h3,h4,span,div,p'))
        .find(el => { const t = el.textContent.trim().toUpperCase(); return (t === 'ZUSTAND' || t === 'ARTIKELZUSTAND') && !el.children.length })
      if (zustandHdr) { zustandHdr.scrollIntoView({ behavior: 'smooth', block: 'center' }); await wait(700) }

      const allClickable = () => Array.from(document.querySelectorAll('button, [role="radio"], [role="option"], [role="button"]'))
      let condSet = false

      // Stufe 1: Direkt-Tile klicken (z.B. "Gebraucht - Hervorragend" ist sichtbarer Tile)
      for (const lbl of labels) {
        const tile = allClickable().find(el => el.offsetParent && el.textContent.trim() === lbl)
        if (tile) {
          tile.scrollIntoView({ behavior: 'smooth', block: 'center' }); await wait(300)
          tile.click(); condSet = true
          console.log('[eBay] ✓ Zustand Tile:', lbl); break
        }
      }

      // Stufe 2: "..." Icon-Button → Dialog mit Radio-Inputs (value=condId)
      // WICHTIG: Der Button hat KEINEN Text – selector über class+icon-btn
      if (!condSet) {
        const moreBtn = document.querySelector('button[class*="fake-menu-button"][class*="icon-btn"]')
          || document.querySelector('button[aria-label="Weitere Optionen"]')
        if (moreBtn) {
          moreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' }); await wait(300)
          moreBtn.click(); await wait(1200)
          const radio = document.querySelector(`input[type="radio"][value="${condId}"]`)
          if (radio) {
            radio.scrollIntoView({ behavior: 'smooth', block: 'center' }); await wait(300)
            radio.click()
            const lbl = document.querySelector(`label[for="${radio.id}"]`)
            if (lbl) lbl.click()
            condSet = true
            console.log('[eBay] ✓ Zustand Dialog:', condId)
          }
          if (!condSet) {
            for (const lbl of labels) {
              const el = Array.from(document.querySelectorAll('[role="radio"], button, label'))
                .find(e => e.offsetParent && e.textContent.trim() === lbl)
              if (el) { el.click(); condSet = true; break }
            }
          }
          await wait(400)
          const fertig = Array.from(document.querySelectorAll('button'))
            .find(b => b.offsetParent && ['Fertig', 'OK', 'Bestätigen'].includes(b.textContent.trim()))
          if (fertig) { fertig.click(); await wait(500) }
        }
      }
    }
  } catch(e) { console.warn('[eBay lstng] Zustand:', e.message) }

  await wait(400)

  // 3. BESCHREIBUNG
  try {
    let desc = listing.description || ''
    const extras = []
    if (listing.brand)     extras.push(`Marke: ${listing.brand}`)
    if (listing.condition) extras.push(`Zustand: ${listing.condition}`)
    if (listing.size)      extras.push(`Größe: ${listing.size}`)
    if (listing.color)     extras.push(`Farbe: ${listing.color}`)
    if (extras.length) desc = (desc ? desc + '\n\n' : '') + extras.join('\n')

    // Strategie 1: "HTML-Code anzeigen" Checkbox → einfaches textarea
    const htmlLabel = Array.from(document.querySelectorAll('label, span, div'))
      .find(el => el.textContent?.trim() === 'HTML-Code anzeigen')
    let filled = false
    if (htmlLabel) {
      const cb = htmlLabel.tagName === 'LABEL'
        ? document.getElementById(htmlLabel.htmlFor) || htmlLabel.querySelector('input[type="checkbox"]')
        : htmlLabel.closest('label')?.querySelector('input[type="checkbox"]')
      if (cb && !cb.checked) { cb.click(); await wait(600) }
      const ta = document.querySelector('textarea[class*="desc"], textarea[name*="desc"], textarea[id*="desc"], textarea')
      if (ta) { ta.focus(); setNativeValue(ta, desc); filled = true; console.log('[eBay] ✓ Beschreibung HTML-textarea') }
    }

    if (!filled) {
      const editables = Array.from(document.querySelectorAll('[contenteditable="true"]'))
      const editor = editables.sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
      if (editor) {
        editor.click(); editor.focus(); await wait(300)
        document.execCommand('selectAll', false, null)
        document.execCommand('delete', false, null)
        document.execCommand('insertText', false, desc)
        if (!editor.textContent.trim()) { editor.innerHTML = desc.replace(/\n/g, '<br>'); editor.dispatchEvent(new Event('input', { bubbles: true })) }
        console.log('[eBay] ✓ Beschreibung contenteditable')
      }
    }
  } catch(e) { console.warn('[eBay lstng] Beschreibung:', e.message) }

  await wait(500)

  // 4. ARTIKELMERKMALE
  // eBay /lstng DOM (live bestätigt):
  //   [class*="attributes--field"]
  //     ├─ [class*="attributes--label"]  ← Label-Text
  //     ├─ button.toggle-button          ← Größe: direkt anklickbare Toggle-Buttons (XS/S/M/L...)
  //     └─ button[class*="se-expand-button"]  ← Dropdown-Trigger für Marke/Farbe/Material etc.
  //
  // Nach Klick auf Dropdown → Suchfeld placeholder "Suchen oder eigene Angaben machen"
  // WICHTIG für React-Filter: InputEvent mit inputType='insertText', NICHT char-by-char!
  // Optionen: div[role="menuitemradio"] — NICHT der Container div[role="menu"]

  async function fillAspect(labelText, value) {
    if (!value) return false
    try {
      // Row finden
      const allRows = Array.from(document.querySelectorAll('[class*="attributes--field"]'))
      const attrRow = allRows.find(r => {
        const lbl = r.querySelector('[class*="attributes--label"]')
        return lbl && lbl.textContent.trim().startsWith(labelText)
      })
      if (!attrRow) { console.warn('[eBay] Row nicht gefunden:', labelText); return false }

      attrRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await wait(300)

      // STRATEGIE A: Toggle-Buttons (z.B. Größe: XS, S, M, L, XL…)
      // eBay zeigt Größen als direkt anklickbare Buttons im Row
      const toggleBtns = Array.from(attrRow.querySelectorAll('button[class*="toggle-button"], [class*="se-toggle-button"]'))
      if (toggleBtns.length > 0) {
        const valLow = value.toLowerCase()
        const match = toggleBtns.find(b => b.textContent.trim().toLowerCase() === valLow)
                   || toggleBtns.find(b => (b.getAttribute('aria-label') || '').toLowerCase() === valLow)
                   || toggleBtns.find(b => b.textContent.trim().toLowerCase().includes(valLow))
        if (match) {
          match.click()
          console.log('[eBay] ✓', labelText, '→ Toggle:', match.textContent.trim())
          await wait(400)
          return true
        }
        // Kein passender Toggle-Wert → weiter zum Dropdown (z.B. "andere Größe")
      }

      // STRATEGIE B: Dropdown (Marke, Farbe, Material, Produktart etc.)
      const dropBtn = attrRow.querySelector('button[class*="se-expand-button"]')
        || attrRow.querySelector('button[class*="fake-menu-button"]:not([class*="icon-btn"]):not([class*="tooltip"]):not([class*="fake-link"])')

      if (!dropBtn) { console.warn('[eBay] Kein Dropdown-Button für:', labelText); return false }

      dropBtn.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await wait(400)
      dropBtn.click()
      await wait(900)

      // Suchfeld finden (erscheint als Portal)
      const searchInput = Array.from(document.querySelectorAll('input'))
        .filter(el => el.offsetParent !== null)
        .find(el => (el.placeholder || '').toLowerCase().includes('suchen')
                 || (el.placeholder || '').toLowerCase().includes('eigene'))

      if (!searchInput) {
        console.warn('[eBay] Suchfeld nicht gefunden für:', labelText)
        // Dropdown schließen
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }))
        return false
      }

      // React-Filter auslösen: InputEvent mit inputType (NICHT char-by-char — funktioniert nicht!)
      searchInput.focus()
      await wait(100)
      const ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      ns?.call(searchInput, value)
      searchInput.dispatchEvent(new InputEvent('input', {
        bubbles: true, cancelable: true, inputType: 'insertText', data: value,
      }))
      await wait(1000)

      // Optionen: ZUERST [role="menuitemradio"] — das ist das echte Item, NICHT der Container
      const getItems = () => Array.from(document.querySelectorAll('[role="menuitemradio"], [role="option"]'))
        .filter(el => el.offsetParent !== null && el.textContent.trim().length > 0)

      let items = getItems()
      if (!items.length) { await wait(600); items = getItems() }

      const valLow = value.toLowerCase()
      const match = items.find(el => el.textContent.trim().toLowerCase() === valLow)
                 || items.find(el => el.textContent.trim().toLowerCase().includes(valLow))
                 || items.find(el => valLow.includes(el.textContent.trim().toLowerCase()) && el.textContent.trim().length > 2)

      if (match) {
        match.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        await wait(200)
        match.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
        match.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }))
        match.click()
        console.log('[eBay] ✓', labelText, '→', match.textContent.trim())
        await wait(500)
        return true
      }

      // Kein Treffer → Enter (eigene Angabe)
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }))
      searchInput.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Enter', keyCode: 13, bubbles: true }))
      console.log('[eBay] ✓', labelText, '→ eigene Angabe:', value)
      await wait(400)
      return true
    } catch(e) { console.warn('[eBay] fillAspect', labelText, ':', e.message); return false }
  }

  // Artikelmerkmale-Sektion scrollen
  const merkmalSection = Array.from(document.querySelectorAll('h2, h3, h4, div, section'))
    .find(el => { const t = el.textContent.trim(); return t === 'ARTIKELMERKMALE' || t === 'Artikelmerkmale' || t === 'Artikeldetails' })
  if (merkmalSection) { merkmalSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); await wait(1000) }
  else { window.scrollBy(0, 1400); await wait(1000) }

  if (listing.brand)         await fillAspect('Marke',         listing.brand)
  if (listing.size)          await fillAspect('Größe',         listing.size)
  if (listing.color)         await fillAspect('Farbe',         listing.color)
  if (listing.material)      await fillAspect('Material',      listing.material)
  if (listing.stil)          await fillAspect('Stil',          listing.stil)
  if (listing.beinform)      await fillAspect('Beinform',      listing.beinform)
  if (listing.taillenumfang) await fillAspect('Taillenumfang', listing.taillenumfang)
  const produktart = detectProduktart(listing)
  if (produktart)            await fillAspect('Produktart',    produktart)

  await wait(300)

  // 5. PREIS
  try {
    const priceInput = await waitForAny([
      'input[aria-label*="Artikelpreis"]', 'input[aria-label*="Preis"]',
      'input[id*="price"]', 'input[name*="price"]',
    ], 5000).catch(() => null)
    const allLabels = Array.from(document.querySelectorAll('label, [class*="label"]'))
    const priceLabel = allLabels.find(l => l.textContent.trim() === 'Artikelpreis')
    const inp = priceInput || (priceLabel ? document.getElementById(priceLabel.htmlFor) || priceLabel.closest('div')?.querySelector('input') : null)
    if (inp) {
      inp.focus(); await wait(200)
      setNativeValue(inp, String(Number(listing.price).toFixed(2)).replace('.', ','))
      console.log('[eBay lstng] ✓ Preis')
    }
  } catch(e) { console.warn('[eBay lstng] Preis:', e.message) }

  await wait(400)

  // 6. BILDER
  updateStatus('Bilder werden hochgeladen…')
  await wait(500)
  await uploadImages(listing.imageData || [])

  updateStatus('✅ Fertig – Versand prüfen & Angebot einstellen', true)
  await chrome.storage.local.remove('pendingListing')
  console.log('[eBay lstng] ✅ Alles ausgefüllt')
}

// ── Altes /sl/list Interface ──────────────────────────────────────────────────

async function fill() {
  const listing = await getListing()
  if (!listing) return
  showBanner(listing)
  await wait(3000)
  updateStatus('Titel…'); await waitForAny(['input[id="itemTitle"]', 'input[name="itemTitle"]', 'input[aria-label*="Titel"]'], 15000).then(el => { const t = (listing.title + ' | Top Zustand ✅').substring(0, 80); setNativeValue(el, t) }).catch(() => {})
  await wait(500)
  updateStatus('Preis…'); await waitForAny(['input[id="binPrice"]', 'input[name="startPrice"]', 'input[aria-label*="Preis"]', '#price-input'], 10000).then(el => setNativeValue(el, String(Number(listing.price).toFixed(2)).replace('.', ','))).catch(() => {})
  await wait(400)
  updateStatus('Bilder…'); await wait(500); await uploadImages(listing.imageData || [])
  updateStatus('✅ Fertig', true)
  await chrome.storage.local.remove('pendingListing')
}

// ── Entry Point ───────────────────────────────────────────────────────────────

function init() {
  const path = window.location.pathname
  if (path.includes('/prelist'))    setTimeout(handlePrelist, 2000)
  else if (path.includes('/lstng')) setTimeout(fillLstng, 3000)
  else if (path.includes('/sl/list')) setTimeout(fill, 3000)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
else init()
