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
  // Bilder als Base64 im Background laden (hat CORS-Zugriff auf localhost und Vercel)
  const BASE_URL = 'https://project-dle5b.vercel.app'
  const imageData = []
  for (const url of (listing.images || []).slice(0, 8)) {
    const data = await fetchImageAsBase64(`${BASE_URL}${url}`)
    if (data) imageData.push(data)
  }
  const fullListing = { ...listing, imageData }
  await chrome.storage.local.set({ pendingListing: fullListing })
  console.log('[ListSync BG]', imageData.length, 'Bilder als Base64 geladen')

  for (const platform of platforms) {
    if (platform === 'vinted') {
      const tab = await new Promise(resolve =>
        chrome.tabs.create({ url: 'https://www.vinted.de/items/new' }, resolve)
      )
      // Warten bis Seite geladen, dann MAIN-World-Injection
      const tabId = tab.id
      const onUpdated = (id, info) => {
        if (id !== tabId || info.status !== 'complete') return
        chrome.tabs.onUpdated.removeListener(onUpdated)
        // 2.5 Sekunden warten damit React die Felder aufgebaut hat
        setTimeout(async () => {
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              world:  'MAIN',
              func:   injectFilesIntoVinted,
              args:   [imageData]
            })
            console.log('[ListSync BG] MAIN-World-Injection erfolgreich')
          } catch(e) {
            console.warn('[ListSync BG] MAIN-World-Injection fehlgeschlagen:', e.message)
          }
        }, 2500)
      }
      chrome.tabs.onUpdated.addListener(onUpdated)
    }
    if (platform === 'kleinanzeigen') {
      chrome.tabs.create({ url: 'https://www.kleinanzeigen.de/p-anzeige-aufgeben-schritt2.html' })
    }
  }
}

// Läuft in der MAIN-World der Seite – hat vollen React-Zugriff
function injectFilesIntoVinted(imageData) {
  if (!imageData?.length) return

  function b64ToFile(img, i) {
    const [, d] = img.base64.split(',')
    const bin = atob(d)
    const arr = new Uint8Array(bin.length)
    for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j)
    const ext = img.type.split('/')[1] || 'jpg'
    return new File([arr], `foto_${i+1}.${ext}`, { type: img.type })
  }

  const fi = document.querySelector('input[type="file"][name="photos"], input[type="file"]')
  if (!fi) { console.warn('[ListSync MAIN] Kein file input'); return }

  const files = imageData.map((img, i) => b64ToFile(img, i))
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))

  // Getter setzen – React liest .files wenn change feuert
  Object.defineProperty(fi, 'files', { get: () => dt.files, configurable: true })

  // React Fiber direkt aufrufen (MAIN-World: voller Zugriff)
  const fk = Object.keys(fi).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternals'))
  if (fk) {
    let node = fi[fk]
    while (node) {
      const onChange = node?.memoizedProps?.onChange || node?.pendingProps?.onChange
      if (onChange) {
        try {
          onChange({ target: fi, currentTarget: fi, preventDefault:()=>{}, stopPropagation:()=>{}, persist:()=>{} })
          console.log('[ListSync MAIN] ✓ React Fiber onChange –', files.length, 'Dateien')
          return
        } catch(e) { console.warn('[ListSync MAIN] Fiber-Fehler:', e.message) }
      }
      node = node.return
    }
  }

  // Fallback: native event
  fi.dispatchEvent(new Event('change', { bubbles: true }))
  fi.dispatchEvent(new Event('input',  { bubbles: true }))
  console.log('[ListSync MAIN] ✓ Native change event – Fiber nicht gefunden')
}
