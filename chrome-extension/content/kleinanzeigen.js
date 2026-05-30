'use strict'

// ── Keyword → KA-Kategorie-Mapping ───────────────────────────────────────────
const KEYWORD_CATEGORIES = [
  // Damen – Kleidung (153/154)
  { kw:['weste','westen','gilet','bodywarmer','steppweste','fleeceweste'],                     path:'153/154', leaf:'Jacken & Mäntel' },
  { kw:['jacke','jacken','mantel','mäntel','parka','anorak','blazer','trenchcoat',
         'bomberjacke','lederjacke','winterjacke','übergangsjacke','regenjacke',
         'softshell','windjacke','daunenjacke','steppjacke'],                                  path:'153/154', leaf:'Jacken & Mäntel' },
  { kw:['jeans','denim'],                                                                       path:'153/154', leaf:'Jeans' },
  { kw:['pullover','strickjacke','strick','sweater','hoodie','sweatshirt','cardigan',
         'pulli','strickpullover','feinstrick','grobstrick'],                                   path:'153/154', leaf:'Pullover' },
  { kw:['hose','hosen','leggings','jeggings','jogginghose','sporthose','stoffhose',
         'leinenhose','culotte','palazzo'],                                                     path:'153/154', leaf:'Hosen' },
  { kw:['kleid','kleider','minikleid','abendkleid','midikleid','maxikleid','sommerkleid',
         'cocktailkleid','etuikleid','strandkleid'],                                            path:'153/154', leaf:'Röcke & Kleider' },
  { kw:['rock','röcke','minirock','midirock','maxirock','tellerrock','faltenrock',
         'wickelrock','bleistiftrock'],                                                         path:'153/154', leaf:'Röcke & Kleider' },
  { kw:['shirt','top','bluse','blusen','t-shirt','tshirt','tank','longsleeve',
         'tunika','hemdbluse','blusenshirt'],                                                   path:'153/154', leaf:'Shirts & Tops' },
  { kw:['unterwäsche','bh','slip','unterhose','dessous','nachtwäsche','pyjama',
         'schlafanzug','negligé','babydoll','homewear'],                                        path:'153/154', leaf:'Weitere Damenbekleidung' },
  { kw:['badeanzug','bikini','bademode','tankini','monokini'],                                  path:'153/154', leaf:'Bademode' },
  { kw:['overall','jumpsuit','playsuit','romper'],                                              path:'153/154', leaf:'Weitere Damenbekleidung' },
  { kw:['shorts','bermuda'],                                                                    path:'153/154', leaf:'Shorts' },
  { kw:['sportbekleidung','sportjacke','sport-bh','sporttop','running'],                       path:'153/154', leaf:'Sportbekleidung' },
  // Damen – Schuhe (153/159)
  { kw:['sneaker','turnschuh','sportschuh','laufschuh','canvas schuh','low top','high top'],    path:'153/159', leaf:'Sneaker' },
  { kw:['stiefel','stiefelette','chelsea boot','ankle boot','cowboystiefel'],                   path:'153/159', leaf:'Stiefel & Stiefeletten' },
  { kw:['ballerina','ballerinas','flats'],                                                      path:'153/159', leaf:'Ballerinas' },
  { kw:['pumps','high heel','stiletto'],                                                        path:'153/159', leaf:'Pumps' },
  { kw:['sandalen','sandalette','flip flop','flipflop','espadrille'],                           path:'153/159', leaf:'Sandalen & Flip-Flops' },
  // Damen – Taschen (153/156)
  { kw:['tasche','handtasche','umhängetasche','schultertasche','clutch','tote','shopper'],      path:'153/156', leaf:'Handtaschen' },
  { kw:['rucksack','backpack'],                                                                 path:'153/156', leaf:'Rucksäcke' },
  { kw:['geldbörse','portemonnaie','geldbeutel','brieftasche','wallet'],                        path:'153/156', leaf:'Geldbörsen' },
  // Herren – Kleidung (153/160)
  { kw:['poloshirt','polo','hemd','herrenhemd','freizeithemd','businesshemd'],                  path:'153/160', leaf:'Shirts & Hemden' },
  { kw:['herrenpullover','herrensweater','herrencardigan','herren pullover'],                    path:'153/160', leaf:'Pullover & Strickjacken' },
  { kw:['herrenhose','herren hose','chino','chinos','cargohose'],                               path:'153/160', leaf:'Hosen & Chinos' },
  { kw:['herrenjeans','herren jeans'],                                                          path:'153/160', leaf:'Jeans' },
  { kw:['herrenjacke','herren jacke','herrenparka','herrenmantel','herrenblazer'],              path:'153/160', leaf:'Jacken & Mäntel' },
  { kw:['anzug','sakko','businessanzug'],                                                       path:'153/160', leaf:'Anzüge & Sakkos' },
  // Herren – Schuhe (153/158)
  { kw:['herrensneaker','herren sneaker'],                                                      path:'153/158', leaf:'Sneaker' },
  { kw:['herrenstiefel','herren stiefel'],                                                      path:'153/158', leaf:'Stiefel' },
  // Kinder
  { kw:['strampler','babykleidung','baby kleidung','babyschuh'],                                path:'17/22',   leaf:'Babykleidung & -schuhe' },
  { kw:['kinderjacke','kinder jacke','kinderkleidung','kinderpullover'],                        path:'17/22',   leaf:'Kinderkleidung' },
  { kw:['kinderschuh','kinder schuhe','kindersneaker'],                                         path:'17/22',   leaf:'Kinderschuhe' },
  { kw:['spielzeug','lego','puppe','teddybär','brettspiel','puzzle'],                           path:'17/23',   leaf:'Spielzeug' },
  // Beauty (153/224)
  { kw:['parfüm','parfum','eau de toilette','eau de parfum','duftwasser'],                      path:'153/224', leaf:'Parfüm & Düfte' },
  { kw:['make-up','makeup','foundation','lippenstift','mascara','rouge'],                       path:'153/224', leaf:'Make-up' },
  { kw:['hautpflege','gesichtscreme','serum','tagescreme','nachtcreme'],                        path:'153/224', leaf:'Hautpflege' },
  { kw:['haarpflege','shampoo','haarmaske','conditioner','haaröl'],                             path:'153/224', leaf:'Haarpflege' },
  { kw:['nagellack','nail art','gel nägel'],                                                    path:'153/224', leaf:'Nagelpflege' },
]

const CATEGORY_PATH = {
  'Damen':               '153/154',
  'Damen – Kleidung':    '153/154',
  'Damen – Schuhe':      '153/159',
  'Damen – Taschen':     '153/156',
  'Damen – Accessoires': '153/156',
  'Herren':              '153/160',
  'Herren – Kleidung':   '153/160',
  'Herren – Schuhe':     '153/158',
  'Beauty':              '153/224',
  'Kinder':              '17/22',
  'Haustiere':           '130/135',
  'Elektronik':          '161',
  'Home & Living':       '80',
  'Sport & Outdoor':     '185',
  'Unterhaltung':        '73',
  'Sonstiges':           '228',
}

// ── App-Kategorie-String → KA-Leaf-Name ──────────────────────────────────────
// Wenn Keyword-Matching fehlschlägt, wird der letzte Teil des Kategorie-Strings
// direkt auf den KA-Leaf-Namen gemappt (z.B. "Pullover & Strickpullover" → "Pullover")
const CAT_TO_KA_LEAF = {
  // Damen Kleidung
  'Hosen':                        'Hosen',
  'Hosen & Jeans':                'Jeans',
  'Jeans':                        'Jeans',
  'Pullover':                     'Pullover',
  'Pullover & Strickpullover':    'Pullover',
  'Pullover & Sweater':           'Pullover',
  'Pullover & Strickjacken':      'Pullover',
  'Jacken & Mäntel':              'Jacken & Mäntel',
  'Kleider':                      'Röcke & Kleider',
  'Röcke':                        'Röcke & Kleider',
  'Röcke & Kleider':              'Röcke & Kleider',
  'Shirts & Tops':                'Shirts & Tops',
  'Tops & T-Shirts':              'Shirts & Tops',
  'Tops':                         'Shirts & Tops',
  'Shorts':                       'Shorts',
  'Sportbekleidung':              'Sportbekleidung',
  'Sportkleidung':                'Sportbekleidung',
  'Bademode':                     'Bademode',
  'Unterwäsche & Socken':         'Weitere Damenbekleidung',
  'Unterwäsche':                  'Weitere Damenbekleidung',
  'Blazer & Anzüge':              'Weitere Damenbekleidung',
  'Overall':                      'Weitere Damenbekleidung',
  // Damen Schuhe
  'Sneaker':                      'Sneaker',
  'Stiefel & Stiefeletten':       'Stiefel & Stiefeletten',
  'Stiefel':                      'Stiefel & Stiefeletten',
  'Ballerinas':                   'Ballerinas',
  'Pumps':                        'Pumps',
  'Sandalen & Flip-Flops':        'Sandalen & Flip-Flops',
  'Sandalen':                     'Sandalen & Flip-Flops',
  // Damen Taschen
  'Handtaschen':                  'Handtaschen',
  'Rucksäcke':                    'Rucksäcke',
  'Geldbörsen':                   'Geldbörsen',
  // Herren Kleidung
  'Shirts & Hemden':              'Shirts & Hemden',
  'Hemden':                       'Shirts & Hemden',
  'Hosen & Chinos':               'Hosen & Chinos',
  'Chinos':                       'Hosen & Chinos',
  'Anzüge & Sakkos':              'Anzüge & Sakkos',
  'Anzüge & Blazer':              'Anzüge & Sakkos',
  'Sakkos':                       'Anzüge & Sakkos',
  // Herren Schuhe
  'Stiefel (Herren)':             'Stiefel',
}

function detectCategory(listing) {
  // Kategorie-String mit einbeziehen – z.B. "Hosen & Jeans" → "jeans" matcht vor "hosen"
  const text = (
    (listing.title || '') + ' ' +
    (listing.description || '') + ' ' +
    (listing.category || '')
  ).toLowerCase()
  // 1. Keyword-Matching aus Titel/Beschreibung/Kategorie
  for (const entry of KEYWORD_CATEGORIES) {
    for (const kw of entry.kw) {
      if (text.includes(kw)) {
        console.log(`[ListSync KA] Keyword-Match: "${kw}" → ${entry.path} / ${entry.leaf}`)
        return entry
      }
    }
  }
  // 2. Kategorie-String direkt mappen
  const cat = listing.category || ''
  const pathKeys = Object.keys(CATEGORY_PATH).sort((a, b) => b.length - a.length)
  for (const key of pathKeys) {
    if (!cat.startsWith(key)) continue
    const path = CATEGORY_PATH[key]
    // Leaf aus dem Teil nach dem gematchten Key extrahieren
    const rest = cat.slice(key.length).replace(/^\s*–\s*/, '').trim()
    if (rest) {
      // Direktes Mapping (z.B. "Pullover & Strickpullover" → "Pullover")
      const mapped = CAT_TO_KA_LEAF[rest]
      if (mapped) {
        console.log(`[ListSync KA] Kategorie-Map: "${rest}" → "${mapped}"`)
        return { path, leaf: mapped }
      }
      // Fallback: Rest-String direkt als Leaf versuchen (clickItemByText hat Partial-Match)
      const leafPart = rest.split(' – ').pop().trim()
      console.log(`[ListSync KA] Kategorie-Fallback-Leaf: "${leafPart}"`)
      return { path, leaf: leafPart || null }
    }
    return { path, leaf: null }
  }
  return null
}

// ── Zustand → KA radio value ──────────────────────────────────────────────────
// Confirmed values: new_with_tag | new | like_new | ok | alright
function mapConditionValue(condition) {
  const c = (condition || '').toLowerCase()
  if (c.includes('neu mit etikett'))                                  return 'new_with_tag'
  if (c.includes('neu ohne etikett') || c.includes('nie getragen'))  return 'new'
  if (c.includes('sehr gut'))                                         return 'like_new'
  if (c.includes('befriedigend') || c.includes('akzeptabel') || c.includes('in ordnung')) return 'alright'
  if (c.includes('gut'))                                              return 'ok'
  return null
}

// ── Utilities ─────────────────────────────────────────────────────────────────
async function getListing() {
  return new Promise(r => chrome.storage.local.get('pendingListing', d => r(d.pendingListing || null)))
}

const wait = ms => new Promise(r => setTimeout(r, ms))

function isVisible(el) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

function waitForAny(selectors, timeout = 12000) {
  return new Promise((resolve, reject) => {
    const find = () => {
      for (const s of selectors) {
        try { const el = document.querySelector(s); if (el && isVisible(el)) return el } catch {}
      }
      return null
    }
    const el = find()
    if (el) return resolve(el)
    const ob = new MutationObserver(() => {
      const found = find()
      if (found) { ob.disconnect(); clearTimeout(tid); resolve(found) }
    })
    // attributes:true fängt CSS-Klassen-/Style-Änderungen die z.B. "display:none" → sichtbar machen
    ob.observe(document.body, { childList: true, subtree: true, attributes: true })
    const tid = setTimeout(() => { ob.disconnect(); reject(new Error('Timeout: ' + selectors[0])) }, timeout)
  })
}

// React-freundliches Input-Befüllen
function fillInput(el, value) {
  if (!el || value === undefined || value === null) return
  const v = String(value)
  el.focus()
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) {
    setter.call(el, v)
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.dispatchEvent(new Event('blur',   { bubbles: true }))
  }
  if (el.value !== v) {
    document.execCommand('selectAll', false)
    document.execCommand('delete',    false)
    document.execCommand('insertText', false, v)
    if (el.value !== v) el.value = v
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
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
      <div style="font-weight:700;font-size:13px">ListSync → Kleinanzeigen</div>
      <div id="ls-ka-status" style="font-size:11px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${listing.title} · ${listing.price} €</div>
    </div>
    <div style="display:flex;gap:4px">${imgs}</div>
    <button onclick="document.getElementById('ls-banner').remove();document.body.style.paddingTop=''"
      style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600">✕</button>
  `
  document.body.prepend(d)
  document.body.style.paddingTop = '54px'
}

function updateStatus(text, done = false) {
  const el = document.getElementById('ls-ka-status')
  if (el) el.textContent = text
  if (done) {
    const b = document.getElementById('ls-banner')
    if (b) b.style.background = '#16a34a'
  }
  console.log('[ListSync KA]', text)
}

// ── Generic Combobox helper ───────────────────────────────────────────────────
// Opens a button[role="combobox"] and clicks the matching option by text.
async function fillCombobox(btn, targetText) {
  if (!btn || !targetText) return false
  btn.click()
  await wait(450)
  const listbox = document.querySelector('[role="listbox"]')
  if (!listbox) { document.body.click(); return false }
  const opts = [...listbox.querySelectorAll('[role="option"]')]
  const tgt = targetText.toLowerCase().trim()
  const opt = opts.find(o => o.textContent.trim().toLowerCase() === tgt)
    || opts.find(o => o.textContent.trim().toLowerCase().startsWith(tgt + ' '))
    || opts.find(o => o.textContent.trim().toLowerCase().startsWith(tgt))
    || opts.find(o => tgt.split(' ').filter(w => w.length > 3).some(w => o.textContent.trim().toLowerCase().includes(w)))
  if (opt) { opt.click(); await wait(300); return true }
  document.body.click()
  return false
}

// Finds a size option like "XS (34)" from listing.size = "XS" or "34"
function findSizeOption(opts, size) {
  if (!size) return null
  const s = size.toString().trim()
  return opts.find(o => o.textContent.trim().toLowerCase().startsWith(s.toLowerCase() + ' '))
    || opts.find(o => /^\d+$/.test(s) && o.textContent.includes(`(${s})`))
    || opts.find(o => o.textContent.trim().toLowerCase() === s.toLowerCase())
}

// ── Zustand auswählen ─────────────────────────────────────────────────────────
// Opens the Zustand dialog (button[aria-haspopup="dialog"]), selects radio by value, confirms.
async function fillZustand(conditionValue) {
  if (!conditionValue) return
  const zustandBtn = [...document.querySelectorAll('button')].find(b =>
    b.getAttribute('aria-haspopup') === 'dialog' && isVisible(b)
  )
  if (!zustandBtn) { console.warn('[ListSync KA] Zustand-Button nicht gefunden'); return }
  zustandBtn.click()
  await wait(800)
  // Select radio by confirmed value (new_with_tag | new | like_new | ok | alright)
  const radio = document.querySelector(`input[value="${conditionValue}"]`)
  if (radio) {
    radio.click()
    console.log('[ListSync KA] ✓ Zustand:', conditionValue)
    await wait(200)
  } else {
    console.warn('[ListSync KA] Zustand-Radio nicht gefunden für:', conditionValue)
  }
  await wait(200)
  const confirmBtn = [...document.querySelectorAll('button')].find(b =>
    isVisible(b) && b.textContent.trim() === 'Bestätigen'
  )
  if (confirmBtn) { confirmBtn.click(); await wait(400) }
}

// ── Preistyp auf VB setzen ────────────────────────────────────────────────────
// Confirmed: #ad-price-type[role=combobox] → #ad-price-type-menu-option-1 = "VB"
async function setPriceTypeVB() {
  // Trigger: #ad-price-type oder button mit "Festpreis"/"Preistyp"-Text
  let btn = document.getElementById('ad-price-type')
  if (!btn) {
    btn = [...document.querySelectorAll('button')].find(b =>
      isVisible(b) && (b.textContent.includes('Festpreis') || b.id?.includes('price-type'))
    )
  }
  if (!btn) { console.warn('[ListSync KA] Preistyp-Button nicht gefunden'); return }
  btn.click()
  await wait(600)
  // Methode 1: direkte ID
  let vbOpt = document.getElementById('ad-price-type-menu-option-1')
  if (vbOpt) { vbOpt.click(); await wait(300); console.log('[ListSync KA] ✓ Preistyp VB'); return }
  // Methode 2: Text-Match in sichtbaren Optionen
  const allOpts = [...document.querySelectorAll('[role="option"], [role="menuitem"], li')]
    .filter(o => o.offsetParent !== null)
  const vb = allOpts.find(o =>
    o.textContent.trim().toUpperCase() === 'VB' ||
    o.textContent.toLowerCase().includes('verhandelbar')
  )
  if (vb) { vb.click(); await wait(300); console.log('[ListSync KA] ✓ Preistyp VB (text-match)'); return }
  document.body.click()
  console.warn('[ListSync KA] VB-Option nicht gefunden')
}

// ── Bilder hochladen ──────────────────────────────────────────────────────────
function base64ToFiles(imageData) {
  return (imageData || []).map((img, i) => {
    try {
      const [, data] = img.base64.split(',')
      const mime = img.type || 'image/jpeg'
      const ext  = mime.split('/')[1] || 'jpg'
      const binary = atob(data)
      const arr = new Uint8Array(binary.length)
      for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j)
      return new File([arr], `listsync_${i + 1}.${ext}`, { type: mime })
    } catch { return null }
  }).filter(Boolean)
}

async function uploadImages(imageData) {
  if (!imageData?.length) return
  const files = base64ToFiles(imageData)
  if (!files.length) return

  // Foto-Bereich in Sicht scrollen damit der file-input im DOM aktiv ist
  const photoArea = document.querySelector(
    '[data-testid*="photo"], [data-testid*="image"], [class*="photo-upload"], [class*="image-upload"], [id*="photo"]'
  )
  if (photoArea) photoArea.scrollIntoView({ block: 'center' })
  await wait(400)

  // ── Strategy 1 (primär): MAIN-World via background ───────────────────────────
  // Läuft im Seiten-Kontext → Object.defineProperty sichtbar für KA-JS,
  // React-Fiber-onChange wird direkt aufgerufen (kein isTrusted-Problem).
  try {
    const res = await chrome.runtime.sendMessage({ type: 'INJECT_MAIN_IMAGES', imageData })
    if (res?.ok) {
      console.log('[ListSync KA] ✓ Bilder via MAIN-World gesendet:', imageData.length)
      await wait(1200)
      return
    }
  } catch(e) { console.warn('[ListSync KA] MAIN-World-Fehler:', e?.message) }

  // ── Strategy 2: DataTransfer direkt (Isolated-World-Fallback) ────────────────
  const fi = document.querySelector('input[type="file"]')
  if (fi) {
    const dt = new DataTransfer()
    files.forEach(f => dt.items.add(f))
    try {
      Object.defineProperty(fi, 'files', { value: dt.files, writable: true, configurable: true })
      fi.dispatchEvent(new Event('change', { bubbles: true }))
      fi.dispatchEvent(new Event('input',  { bubbles: true }))
      console.log('[ListSync KA] ✓ Bilder via DataTransfer:', files.length)
      await wait(800)
      return
    } catch(e) { console.warn('[ListSync KA] DataTransfer-Fehler:', e.message) }
  }

  // ── Strategy 3: Drop-Zone ────────────────────────────────────────────────────
  const dt2 = new DataTransfer()
  files.forEach(f => dt2.items.add(f))
  const dropZone = document.querySelector(
    '[class*="photo"], [class*="upload"], [data-testid*="photo"], [data-testid*="upload"]'
  ) || [...document.querySelectorAll('button')].find(b =>
    b.textContent.includes('Foto') || b.textContent.includes('Hochladen')
  )
  if (dropZone) {
    dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt2 }))
    dropZone.dispatchEvent(new DragEvent('dragover',  { bubbles: true, cancelable: true, dataTransfer: dt2 }))
    dropZone.dispatchEvent(new DragEvent('drop',      { bubbles: true, cancelable: true, dataTransfer: dt2 }))
    console.log('[ListSync KA] ✓ Bilder via Drop-Zone')
    return
  }

  updateStatus('⚠️ Fotos konnten nicht hochgeladen werden – bitte manuell hinzufügen')
}

// ── SCHRITT 1: Kategorie navigieren ──────────────────────────────────────────
async function clickItemByText(targetText, timeout = 6000) {
  const target = targetText.toLowerCase().trim()
  // Schlüsselwörter aus leaf (> 3 Zeichen) für Partial-Match
  const keywords = target.split(/[\s&,/]+/).filter(w => w.length > 3)
  const deadline = Date.now() + timeout

  const tryClick = async (el) => {
    // In Sicht scrollen (wichtig falls Element off-screen → 0-Dimensionen)
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    await wait(150)
    // Vollständige Maus-Event-Sequenz für React/SPA-Frameworks
    el.dispatchEvent(new MouseEvent('mouseover',  { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    el.dispatchEvent(new MouseEvent('mousedown',  { bubbles: true, cancelable: true }))
    el.dispatchEvent(new MouseEvent('mouseup',    { bubbles: true, cancelable: true }))
    el.dispatchEvent(new MouseEvent('click',      { bubbles: true, cancelable: true }))
    await wait(300)
    return true
  }

  while (Date.now() < deadline) {
    for (const sel of ['a', 'button', '[role="option"]', '[role="menuitem"]', 'li', 'span', 'label']) {
      for (const el of document.querySelectorAll(sel)) {
        if (!isVisible(el)) continue
        const txt = el.textContent.trim().toLowerCase()
        // Pass 1: Exakter Match oder starts-with
        if (txt === target || txt.startsWith(target + ' ') || txt.startsWith(target + ' ›')) {
          return await tryClick(el)
        }
        // Pass 2: Alle Keywords enthalten (z.B. "Hosen" matcht "Hosen & Shorts")
        if (keywords.length && keywords.every(kw => txt.includes(kw))) {
          return await tryClick(el)
        }
      }
    }
    await wait(300)
  }
  return false
}

// Findet und klickt den "Weiter"-Button (submit oder Text-Match)
async function clickWeiter() {
  const candidates = [
    // Alle submit-Buttons (nicht nur den ersten)
    ...document.querySelectorAll('button[type="submit"]'),
    ...document.querySelectorAll('input[type="submit"]'),
    // Text-basiert: Weiter, Fortfahren, etc.
    ...[...document.querySelectorAll('button, a[role="button"]')].filter(b =>
      /weiter|nächste|bestätigen|auswählen|fortfahren/i.test(b.textContent.trim())
    ),
  ].filter(Boolean)
  for (const btn of candidates) {
    if (isVisible(btn)) {
      btn.scrollIntoView({ block: 'nearest' })
      btn.click()
      await wait(400)
      return true
    }
  }
  return false
}

async function fillStep1(listing) {
  showBanner(listing)
  let cat = detectCategory(listing)
  // Explizit gesetztes kaCategory aus dem Listing hat Vorrang
  if (listing.kaCategory && cat) {
    cat = { ...cat, leaf: listing.kaCategory }
    console.log('[ListSync KA] kaCategory überschreibt Leaf:', listing.kaCategory)
  }
  if (!cat) {
    updateStatus('⚠️ Kein Kategorie-Mapping – bitte manuell wählen')
    return
  }
  console.log('[ListSync KA] Schritt 1 – Path:', cat.path, '| Leaf:', cat.leaf || '(kein)')

  // Hash-Navigation → KA SPA rendert die Unterkategorie-Liste
  window.location.hash = `#?path=${cat.path}&isParent=true`
  // Warte länger auf SPA-Render (API-Calls können dauern)
  await wait(4000)

  // Leaf-Kategorie automatisch klicken (ERST dann Weiter – niemals vorher!)
  if (cat.leaf) {
    updateStatus(`Wähle: ${cat.leaf}…`)
    // 10s Timeout: SPA lädt Kategorie-Items manchmal langsam
    const clicked = await clickItemByText(cat.leaf, 10000)
    if (clicked) {
      updateStatus('Kategorie gewählt – warte auf Weiter…')
      // MutationObserver (mit attributes:true) erkennt wenn KA den Submit-Button einblendet
      try {
        await waitForAny(['button[type="submit"]', 'input[type="submit"]'], 6000)
      } catch {
        console.warn('[ListSync KA] Submit-Button nach 6s noch nicht sichtbar – versuche trotzdem')
      }
      await wait(500)
      if (await clickWeiter()) return
      await wait(2500)
      if (await clickWeiter()) return
      updateStatus('⚠️ Bitte „Weiter" manuell klicken')
    } else {
      updateStatus(`⚠️ Kategorie „${cat.leaf}" nicht gefunden – bitte manuell wählen`)
      return
    }
  } else {
    // Kein Leaf → Hash-Pfad reichte, direkt Weiter klicken
    await wait(500)
    if (await clickWeiter()) return
    updateStatus('⚠️ Bitte Kategorie wählen → Weiter')
  }
}

// ── SCHRITT 2: Formular ausfüllen ─────────────────────────────────────────────
// Findet ein Element ohne Sichtbarkeits-Check (nur DOM-Existenz)
async function pollFor(selector, timeout = 8000) {
  const el = document.querySelector(selector)
  if (el) return el
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    await wait(250)
    const el = document.querySelector(selector)
    if (el) return el
  }
  return null
}

async function fillStep2(listing) {
  showBanner(listing)
  updateStatus('Formular wird ausgefüllt…')
  await wait(2000)

  // ① Titel
  const titleEl = await pollFor('#ad-title')
  if (titleEl) { fillInput(titleEl, listing.title.substring(0, 70)); console.log('[ListSync KA] ✓ Titel') }
  else console.warn('[ListSync KA] Titel nicht gefunden')

  await wait(300)

  // ② Beschreibung — pollFor ohne isVisible-Check (textarea kann initial height=0 haben)
  if (listing.description) {
    const descEl = await pollFor('#ad-description')
    if (descEl) {
      fillInput(descEl, listing.description)
      // Sicherstellen dass React/KA den Wert erkennt
      descEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }))
      descEl.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true }))
      console.log('[ListSync KA] ✓ Beschreibung')
    } else console.warn('[ListSync KA] Beschreibung nicht gefunden')
  }

  await wait(300)

  // ③ Marke — pollFor (async rendered), dann Autocomplete-Suggestion klicken
  if (listing.brand) {
    const brandInp = await pollFor('input[id$=".brand"]', 5000)
    if (brandInp) {
      brandInp.focus()
      fillInput(brandInp, listing.brand)
      await wait(900)
      // Erste sichtbare Autocomplete-Suggestion klicken (falls vorhanden)
      const sug = [...document.querySelectorAll(
        '[role="option"], [role="listbox"] li, [class*="suggestion"] li, [class*="autocomplete"] li'
      )].find(el => isVisible(el))
      if (sug) { sug.click(); await wait(300) }
      console.log('[ListSync KA] ✓ Marke:', listing.brand)
    } else console.warn('[ListSync KA] Marke-Input nicht gefunden')
  }

  await wait(300)

  // ④ Art-Dropdown
  const cat = detectCategory(listing)
  if (cat?.leaf) {
    const artBtn = document.querySelector('button[id$=".art"]')
    if (artBtn) {
      const ok = await fillCombobox(artBtn, cat.leaf)
      console.log('[ListSync KA]', ok ? '✓' : '⚠️', 'Art:', cat.leaf)
    }
  }

  // ⑤ Größe — warte bis KA den Button nach Art-Auswahl async rendert
  if (listing.size) {
    let groesseBtn = null
    try { groesseBtn = await waitForAny(['button[id$=".groesse"]'], 4000) } catch {}
    if (!groesseBtn) groesseBtn = await pollFor('button[id$=".groesse"]', 2000)
    if (groesseBtn) {
      groesseBtn.click()
      await wait(500)
      const listbox = document.querySelector('[role="listbox"]')
      if (listbox) {
        const opts = [...listbox.querySelectorAll('[role="option"]')]
        const opt = findSizeOption(opts, listing.size)
        if (opt) { opt.click(); await wait(300); console.log('[ListSync KA] ✓ Größe:', listing.size) }
        else { document.body.click(); console.warn('[ListSync KA] Größe nicht gefunden:', listing.size) }
      }
    } else console.warn('[ListSync KA] Größe-Button nicht gefunden')
  }

  await wait(200)

  // ⑥ Farbe
  if (listing.color) {
    let colorBtn = null
    try { colorBtn = await waitForAny(['button[id$=".color"]'], 4000) } catch {}
    if (!colorBtn) colorBtn = await pollFor('button[id$=".color"]', 2000)
    if (colorBtn) {
      const ok = await fillCombobox(colorBtn, listing.color)
      console.log('[ListSync KA]', ok ? '✓' : '⚠️', 'Farbe:', listing.color)
    } else console.warn('[ListSync KA] Farbe-Button nicht gefunden')
  }

  await wait(300)

  // ⑦ Zustand
  const conditionValue = mapConditionValue(listing.condition)
  await fillZustand(conditionValue)

  await wait(300)

  // ⑧ Versand aktivieren
  if (listing.shipping?.length) {
    const yesRadio = document.querySelector('#ad-shipping-enabled-yes')
    if (yesRadio && !yesRadio.checked) { yesRadio.click(); await wait(200) }
    console.log('[ListSync KA] ✓ Versand aktiviert')
  }

  await wait(300)

  // ⑨ Preis — pollFor damit auch nicht-sichtbare Inputs gefunden werden
  const priceEl = await pollFor('#ad-price-amount')
  if (priceEl) {
    fillInput(priceEl, String(Math.round(listing.price)))
    console.log('[ListSync KA] ✓ Preis:', listing.price)
  } else console.warn('[ListSync KA] Preis nicht gefunden')

  await wait(300)

  // ⑩ Preistyp → VB
  await setPriceTypeVB()

  await wait(400)

  // ⑪ Adresse (nur wenn im Listing gesetzt)
  if (listing.address) {
    // KA hat ein Adress-Autocomplete: input[id*="address"], input[placeholder*="PLZ"]
    const addrEl = await pollFor('#ad-address, input[id*="address"], input[placeholder*="PLZ"], input[placeholder*="Ort"]', 3000)
    if (addrEl) {
      fillInput(addrEl, listing.address)
      await wait(600)
      // Erstes Autocomplete-Ergebnis klicken
      const suggestion = document.querySelector('[role="option"], [class*="suggestion"], [class*="autocomplete"] li')
      if (suggestion && isVisible(suggestion)) { suggestion.click(); await wait(300) }
      console.log('[ListSync KA] ✓ Adresse:', listing.address)
    }
  }

  await wait(400)

  // ⑫ Bilder – warte auf imageData vom Background-Loader
  updateStatus('Bilder werden hochgeladen…')
  let imgData = listing.imageData || []
  if (!imgData.length) {
    for (let i = 0; i < 25; i++) {
      await wait(800)
      const fresh = await getListing()
      if (fresh?.imageData?.length) { imgData = fresh.imageData; break }
    }
  }
  if (imgData.length) {
    await uploadImages(imgData)
    await wait(1500)
  } else {
    console.warn('[ListSync KA] Keine Bilder – imageData leer nach 20s')
  }

  // ── Auto-Submit: "Anzeige aufgeben" klicken ──────────────────────────────
  await wait(800)
  updateStatus('Anzeige wird aufgegeben…')
  try {
    // Mögliche Submit-Button-Texte auf KA Schritt 2
    const submitTexts = ['Anzeige aufgeben', 'Veröffentlichen', 'Absenden', 'Weiter']
    let submitBtn = null
    for (const txt of submitTexts) {
      submitBtn = Array.from(document.querySelectorAll('button, input[type="submit"]'))
        .find(b => b.offsetParent && !b.disabled && (b.textContent?.trim() === txt || b.value === txt))
      if (submitBtn) break
    }
    // Fallback: letzter sichtbarer Submit-Button
    if (!submitBtn) {
      submitBtn = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"]'))
        .filter(b => b.offsetParent && !b.disabled).pop()
    }
    if (submitBtn) {
      submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await wait(600)
      submitBtn.click()
      updateStatus('✅ Anzeige aufgegeben!', true)
      console.log('[ListSync KA] ✓ Auto-Submit: Anzeige aufgegeben')
    } else {
      updateStatus('✅ Fertig – bitte "Anzeige aufgeben" klicken', true)
      console.warn('[ListSync KA] Submit-Button nicht gefunden')
    }
  } catch(e) {
    updateStatus('✅ Fertig – bitte "Anzeige aufgeben" klicken', true)
    console.warn('[ListSync KA] Auto-Submit Fehler:', e.message)
  }

  await chrome.storage.local.remove('pendingListing')
  if (listing?.id) {
    chrome.runtime.sendMessage({ type: 'LISTING_POSTED', listingId: listing.id, platform: 'kleinanzeigen' })
      .catch(() => {})
  }
}

// ── Entry Point ───────────────────────────────────────────────────────────────
async function init() {
  const listing = await getListing()
  if (!listing) return

  const href = window.location.href
  if (href.includes('schritt2') || href.includes('step2') || href.includes('-schritt2')) {
    setTimeout(() => fillStep2(listing), 1500)
  } else {
    setTimeout(() => fillStep1(listing), 1500)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
