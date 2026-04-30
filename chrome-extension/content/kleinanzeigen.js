'use strict'

async function getListing() {
  return new Promise(resolve => {
    chrome.storage.local.get('pendingListing', r => resolve(r.pendingListing || null))
  })
}

function fillInput(el, value) {
  el.focus()
  document.execCommand('selectAll', false)
  document.execCommand('delete', false)
  document.execCommand('insertText', false, value)
  if (el.value !== value) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    if (setter) setter.call(el, value)
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

function waitFor(selector, timeout = 25000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector)
    if (el) return resolve(el)
    const ob = new MutationObserver(() => {
      const found = document.querySelector(selector)
      if (found) { ob.disconnect(); resolve(found) }
    })
    ob.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { ob.disconnect(); reject() }, timeout)
  })
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

async function uploadImages(imageData) {
  if (!imageData?.length) return
  const files = base64ToFiles(imageData)
  if (!files.length) return
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))
  try {
    const fi = await waitFor('input[type="file"]', 5000)
    Object.defineProperty(fi, 'files', { value: dt.files, configurable: true, writable: true })
    fi.dispatchEvent(new Event('change', { bubbles: true }))
    console.log('[ListSync] ✓ Bilder übertragen')
  } catch { console.warn('[ListSync] Bild-Upload fehlgeschlagen') }
}

function showBanner(listing) {
  if (document.getElementById('ls-banner')) return
  const d = document.createElement('div')
  d.id = 'ls-banner'
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#4f46e5;color:#fff;font-family:sans-serif;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 3px 16px rgba(0,0,0,.4)'
  const imgs = (listing.images||[]).slice(0,6).map((u,i) =>
    `<img src="http://localhost:3000${u}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:2px solid rgba(255,255,255,.4)">`
  ).join('')
  d.innerHTML = `
    <span style="font-size:20px">🔗</span>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:13px">ListSync ✓ wird ausgefüllt</div>
      <div style="font-size:11px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${listing.title} · ${listing.price} € VHB</div>
    </div>
    <div style="display:flex;gap:4px">${imgs}</div>
    <button onclick="document.getElementById('ls-banner').remove();document.body.style.paddingTop=''"
      style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600">✕</button>
  `
  document.body.prepend(d)
  document.body.style.paddingTop = '54px'
}

async function fill() {
  const listing = await getListing()
  if (!listing) return
  showBanner(listing)

  try {
    const el = await waitFor('#postad-title, input[name="title"]')
    await new Promise(r => setTimeout(r, 300))
    fillInput(el, (listing.title + ' (VHB)').substring(0, 80))
  } catch {}

  try {
    const el = await waitFor('#postad-description, textarea[name="description"]')
    await new Promise(r => setTimeout(r, 200))
    fillInput(el, listing.description || '')
  } catch {}

  try {
    const el = await waitFor('#postad-price, input[name="price"]')
    await new Promise(r => setTimeout(r, 200))
    fillInput(el, String(listing.price))
  } catch {}

  await uploadImages(listing.imageData || [])
  await chrome.storage.local.remove('pendingListing')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(fill, 1500))
} else {
  setTimeout(fill, 1500)
}
