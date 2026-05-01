// Läuft auf localhost:3000 / Vercel – verbindet ListSync mit der Extension

window.__LISTSYNC_EXTENSION__ = true
window.dispatchEvent(new CustomEvent('LISTSYNC_EXTENSION_READY'))
setTimeout(() => window.dispatchEvent(new CustomEvent('LISTSYNC_EXTENSION_READY')), 600)
setTimeout(() => window.dispatchEvent(new CustomEvent('LISTSYNC_EXTENSION_READY')), 2000)

// Service Worker aufwecken (MV3 schläft nach Inaktivität)
function wakeAndSend(msg, retries = 3) {
  chrome.runtime.sendMessage({ type: 'PING' }, () => {
    void chrome.runtime.lastError // Fehler unterdrücken
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

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (!event.data || event.data.type !== 'LISTSYNC_POST') return
  console.log('[ListSync Bridge] Sende an Background:', event.data.listing?.title)
  wakeAndSend({
    type: 'POST_LISTING',
    listing: event.data.listing,
    platforms: event.data.platforms
  })
})
