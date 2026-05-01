const BASE_URL = 'https://project-dle5b.vercel.app'

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'POST_LISTING') {
    handlePost(msg.listing, msg.platforms)
      .then(() => sendResponse({ ok: true }))
      .catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
  if (msg.type === 'VINTED_SYNC_DATA') {
    // Called from vinted-sync.js content script with scraped order history
    importVintedHistory(msg.data, sender.tab?.id)
    sendResponse({ ok: true })
    return true
  }
})

// ── Image loader ──────────────────────────────────────────────────────────────

async function fetchImageAsBase64(url) {
  try {
    const res  = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve({ base64: reader.result, type: blob.type || 'image/jpeg' })
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

// ── Post listing to platforms ─────────────────────────────────────────────────

async function handlePost(listing, platforms) {
  // Load images as base64 (max 8)
  const imageData = []
  for (const url of (listing.images || []).slice(0, 8)) {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
    const data = await fetchImageAsBase64(fullUrl)
    if (data) imageData.push(data)
  }

  const fullListing = { ...listing, imageData }
  await chrome.storage.local.set({ pendingListing: fullListing })
  console.log('[ListSync BG] Bilder geladen:', imageData.length, '– ID:', listing.id)

  for (const platform of platforms) {
    if (platform === 'vinted') {
      await openVintedNewListing(imageData)
    }
    if (platform === 'kleinanzeigen') {
      chrome.tabs.create({ url: 'https://www.kleinanzeigen.de/p-anzeige-aufgeben-schritt2.html' })
    }
  }
}

async function openVintedNewListing(imageData) {
  const { activeVintedAccount } = await chrome.storage.local.get('activeVintedAccount')

  const tab = await new Promise(resolve =>
    chrome.tabs.create({ url: 'https://www.vinted.de/items/new' }, resolve)
  )
  const tabId = tab.id

  // Wait for page to fully load, then inject images
  const onUpdated = (id, info) => {
    if (id !== tabId || info.status !== 'complete') return
    chrome.tabs.onUpdated.removeListener(onUpdated)

    // 5s delay – Vinted React needs extra time after DOM complete
    setTimeout(async () => {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          world:  'MAIN',
          func:   injectImages,
          args:   [imageData]
        })
        console.log('[ListSync BG] ✓ Bild-Injection OK')
      } catch(e) {
        console.warn('[ListSync BG] Bild-Injection fehlgeschlagen:', e.message)
      }
    }, 5000)
  }
  chrome.tabs.onUpdated.addListener(onUpdated)
}

// ── Vinted history import ─────────────────────────────────────────────────────

async function importVintedHistory(data, sourceTabId) {
  try {
    const { token } = await chrome.storage.local.get('authToken')
    const res = await fetch(`${BASE_URL}/api/import`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body:    JSON.stringify(data),
      credentials: 'include',
    })
    const result = await res.json()
    console.log('[ListSync BG] Import:', result)
    // Notify popup
    chrome.runtime.sendMessage({ type: 'IMPORT_DONE', result }).catch(() => {})
  } catch(e) {
    console.warn('[ListSync BG] Import fehlgeschlagen:', e.message)
  }
}

// ── Image injection (runs in MAIN world) ──────────────────────────────────────
// This function is serialized and injected into the page – no closures!

function injectImages(imageData) {
  if (!imageData?.length) { console.warn('[ListSync MAIN] Keine Bilder'); return }

  function b64ToFile(img, i) {
    const [, d] = img.base64.split(',')
    const bin = atob(d)
    const arr = new Uint8Array(bin.length)
    for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j)
    const ext = (img.type || 'image/jpeg').split('/')[1] || 'jpg'
    return new File([arr], `listsync_${i + 1}.${ext}`, { type: img.type || 'image/jpeg' })
  }

  const files = imageData.map((img, i) => b64ToFile(img, i))
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))

  // Strategy 1: Find file input, use React Fiber
  const inputSelectors = [
    'input[type="file"][accept*="image"]',
    'input[type="file"][name*="photo"]',
    'input[type="file"][name*="image"]',
    'input[type="file"][multiple]',
    'input[type="file"]',
  ]
  let fi = null
  for (const sel of inputSelectors) {
    fi = document.querySelector(sel)
    if (fi) break
  }

  if (fi) {
    Object.defineProperty(fi, 'files', { get: () => dt.files, configurable: true })

    // Try React Fiber first (most reliable for React apps)
    const fk = Object.keys(fi).find(k =>
      k.startsWith('__reactFiber') ||
      k.startsWith('__reactInternals') ||
      k.startsWith('__reactEventHandlers') ||
      k.startsWith('__reactProps')
    )
    if (fk) {
      let node = fi[fk]
      while (node) {
        const handler = node?.memoizedProps?.onChange || node?.pendingProps?.onChange
        if (handler) {
          try {
            handler({
              target: fi, currentTarget: fi,
              preventDefault: () => {}, stopPropagation: () => {},
              persist: () => {}, nativeEvent: new Event('change', { bubbles: true })
            })
            console.log('[ListSync MAIN] ✓ React Fiber –', files.length, 'Bilder')
            return
          } catch(e) { console.warn('[ListSync MAIN] Fiber-Fehler:', e.message) }
        }
        node = node.return
      }
    }

    // Fallback: native events
    fi.dispatchEvent(new Event('change', { bubbles: true }))
    fi.dispatchEvent(new Event('input',  { bubbles: true }))
    console.log('[ListSync MAIN] ✓ Native Events –', files.length, 'Bilder')
    return
  }

  // Strategy 2: Drop zone
  const dropSelectors = [
    '[data-testid*="photo-upload"]',
    '[data-testid*="upload"]',
    '[class*="photo-upload"]',
    '[class*="upload-zone"]',
    '[class*="dropzone"]',
    '[class*="drop-zone"]',
    '[class*="UploadZone"]',
    '[class*="PhotoUpload"]',
  ]
  for (const sel of dropSelectors) {
    const zone = document.querySelector(sel)
    if (zone) {
      zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }))
      zone.dispatchEvent(new DragEvent('dragover',  { bubbles: true, cancelable: true, dataTransfer: dt }))
      zone.dispatchEvent(new DragEvent('drop',      { bubbles: true, cancelable: true, dataTransfer: dt }))
      console.log('[ListSync MAIN] ✓ Drop-Event auf', sel)
      return
    }
  }

  console.warn('[ListSync MAIN] Kein Upload-Element gefunden')
}
