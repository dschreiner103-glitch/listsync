// Läuft auf localhost:3000 / Vercel – verbindet ListSync mit der Extension

// DOM-Attribut setzen – sichtbar in MAIN world, CSP-sicher
document.documentElement.setAttribute('data-listsync-extension', '1')
window.dispatchEvent(new CustomEvent('LISTSYNC_EXTENSION_READY'))

// Service Worker aufwecken (MV3 schläft nach Inaktivität)
function wakeAndSend(msg, retries = 3) {
  chrome.runtime.sendMessage({ type: 'PING' }, () => {
    void chrome.runtime.lastError
    setTimeout(() => {
      chrome.runtime.sendMessage(msg, (resp) => {
        if (chrome.runtime.lastError) {
          console.warn('[ListSync Bridge] Fehler:', chrome.runtime.lastError.message)
          if (retries > 0) setTimeout(() => wakeAndSend(msg, retries - 1), 1000)
        } else {
          console.log('[ListSync Bridge] OK:', resp)
        }
      })
    }, 400)
  })
}

// ── Ausgehende Nachrichten: App → Background ──────────────────────────────────

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (!event.data) return

  // Ping: Seite fragt ob Extension aktiv ist → sofort mit PONG antworten
  if (event.data.type === 'LISTSYNC_PING') {
    window.postMessage({ type: 'LISTSYNC_PONG' }, '*')
    return
  }

  // Crosspost-Befehl
  if (event.data.type === 'LISTSYNC_POST') {
    console.log('[ListSync Bridge] Sende an Background:', event.data.listing?.title)
    wakeAndSend({
      type: 'POST_LISTING',
      listing: event.data.listing,
      platforms: event.data.platforms,
    })
    return
  }
})

// ── Eingehende Nachrichten: Background → App (Plattform-Badge setzen) ─────────
// Content Scripts auf Plattform-Seiten senden LISTING_POSTED wenn Submit erfolgreich war.
// Background leitet das an diesen Bridge-Script weiter, der die ListSync-App per Fetch updatet.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Fortschritts-Update → direkt an die App-Seite weiterleiten
  if (msg.type === 'CROSSPOST_PROGRESS') {
    window.postMessage({ type: 'CROSSPOST_PROGRESS', progress: msg.progress }, '*')
    sendResponse({ ok: true })
    return true
  }

  if (msg.type !== 'LISTING_POSTED') return

  const { listingId, platform } = msg
  if (!listingId || !platform) { sendResponse({ ok: false }); return true }

  console.log('[ListSync Bridge] LISTING_POSTED:', platform, 'für Listing', listingId)

  // PATCH /api/listings/:id – fügt Platform zum platforms-Array hinzu
  fetch(`/api/listings/${listingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addPlatform: platform }),
    credentials: 'include',
  })
    .then(r => r.json())
    .then(data => {
      console.log('[ListSync Bridge] ✓ Platform-Badge gesetzt:', data)
      // React-State in der App updaten (falls sie lauscht)
      window.dispatchEvent(new CustomEvent('LISTSYNC_LISTING_UPDATED', {
        detail: { listingId, platform },
      }))
      sendResponse({ ok: true })
    })
    .catch(e => {
      console.warn('[ListSync Bridge] PATCH fehlgeschlagen:', e.message)
      sendResponse({ ok: false, error: e.message })
    })

  return true // Async response
})
