// Läuft auf localhost:3000 – verbindet ListSync mit der Extension

window.__LISTSYNC_EXTENSION__ = true
window.dispatchEvent(new CustomEvent('LISTSYNC_EXTENSION_READY'))
setTimeout(() => window.dispatchEvent(new CustomEvent('LISTSYNC_EXTENSION_READY')), 600)
setTimeout(() => window.dispatchEvent(new CustomEvent('LISTSYNC_EXTENSION_READY')), 2000)

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (!event.data || event.data.type !== 'LISTSYNC_POST') return
  console.log('[ListSync Bridge] Sende an Background:', event.data.listing?.title)
  chrome.runtime.sendMessage({
    type: 'POST_LISTING',
    listing: event.data.listing,
    platforms: event.data.platforms
  }, (resp) => {
    console.log('[ListSync Bridge] Background Antwort:', resp)
  })
})
