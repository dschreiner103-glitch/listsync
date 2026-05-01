const BASE_URL = 'https://project-dle5b.vercel.app'

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'POST_LISTING') {
    handlePost(msg.listing, msg.platforms).then(() => sendResponse({ ok: true }))
    return true
  }
})

async function fetchImageAsBase64(url) {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve({ base64: reader.result, type: blob.type || 'image/jpeg' })
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch(e) { return null }
}

async function handlePost(listing, platforms) {
  const imageData = []
  for (const url of (listing.images || []).slice(0, 8)) {
    // Unterstütze absolute Blob-URLs und relative Pfade
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
    const data = await fetchImageAsBase64(fullUrl)
    if (data) imageData.push(data)
  }

  const fullListing = { ...listing, imageData }
  await chrome.storage.local.set({ pendingListing: fullListing })
  console.log('[ListSync BG] Bilder geladen:', imageData.length, '– ID:', listing.id)

  for (const platform of platforms) {
    if (platform === 'vinted') {
      const { activeVintedAccount } = await chrome.storage.local.get('activeVintedAccount')

      const tab = await new Promise(resolve =>
        chrome.tabs.create({ url: 'https://www.vinted.de/items/new' }, resolve)
      )
      const tabId = tab.id

      const onUpdated = (id, info) => {
        if (id !== tabId || info.status !== 'complete') return
        chrome.tabs.onUpdated.removeListener(onUpdated)

        // 4 Sekunden warten – Vinted's React braucht Zeit zum Laden
        setTimeout(async () => {
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              world:  'MAIN',
              func:   injectFilesIntoVinted,
              args:   [imageData, activeVintedAccount || null]
            })
            console.log('[ListSync BG] MAIN-World-Injection OK')
          } catch(e) {
            console.warn('[ListSync BG] Injection fehlgeschlagen:', e.message)
          }
        }, 4000)
      }
      chrome.tabs.onUpdated.addListener(onUpdated)
    }

    if (platform === 'kleinanzeigen') {
      chrome.tabs.create({ url: 'https://www.kleinanzeigen.de/p-anzeige-aufgeben-schritt2.html' })
    }
  }
}

// Läuft in der MAIN-World – hat vollen React-Zugriff
function injectFilesIntoVinted(imageData, accountName) {
  if (!imageData?.length) return

  function b64ToFile(img, i) {
    const [, d] = img.base64.split(',')
    const bin = atob(d)
    const arr = new Uint8Array(bin.length)
    for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j)
    const ext = img.type.split('/')[1] || 'jpg'
    return new File([arr], `foto_${i+1}.${ext}`, { type: img.type })
  }

  const files = imageData.map((img, i) => b64ToFile(img, i))

  // File-Input suchen – mehrere Selektoren
  const selectors = [
    'input[type="file"][accept*="image"]',
    'input[type="file"][name="photos"]',
    'input[type="file"]',
  ]
  let fi = null
  for (const sel of selectors) {
    fi = document.querySelector(sel)
    if (fi) break
  }

  if (!fi) {
    // Fallback: Drop-Zone
    const dropZone = document.querySelector(
      '[data-testid*="photo"], [class*="photo-upload"], [class*="upload-zone"], [class*="dropzone"]'
    )
    if (dropZone) {
      const dt = new DataTransfer()
      files.forEach(f => dt.items.add(f))
      dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: dt }))
      dropZone.dispatchEvent(new DragEvent('dragover',  { bubbles: true, dataTransfer: dt }))
      dropZone.dispatchEvent(new DragEvent('drop',      { bubbles: true, dataTransfer: dt }))
      console.log('[ListSync MAIN] Drop-Event gefeuert')
    } else {
      console.warn('[ListSync MAIN] Kein file input oder Drop-Zone gefunden')
    }
    return
  }

  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))
  Object.defineProperty(fi, 'files', { get: () => dt.files, configurable: true })

  // React Fiber onChange direkt aufrufen
  const fk = Object.keys(fi).find(k =>
    k.startsWith('__reactFiber') || k.startsWith('__reactInternals') || k.startsWith('__reactEventHandlers')
  )
  if (fk) {
    let node = fi[fk]
    while (node) {
      const onChange = node?.memoizedProps?.onChange || node?.pendingProps?.onChange
      if (onChange) {
        try {
          onChange({ target: fi, currentTarget: fi, preventDefault:()=>{}, stopPropagation:()=>{}, persist:()=>{}, nativeEvent: new Event('change') })
          console.log('[ListSync MAIN] ✓ React Fiber –', files.length, 'Bilder')
          return
        } catch(e) { console.warn('[ListSync MAIN] Fiber-Fehler:', e.message) }
      }
      node = node.return
    }
  }

  // Letzter Fallback: native Events
  fi.dispatchEvent(new Event('change', { bubbles: true }))
  fi.dispatchEvent(new Event('input',  { bubbles: true }))
  console.log('[ListSync MAIN] ✓ Native Events')
}
