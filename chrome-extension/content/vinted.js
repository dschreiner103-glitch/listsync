'use strict'
// Text-Filling läuft als Content Script
// Bild-Upload läuft via chrome.scripting MAIN-World (background.js)

async function getListing() {
  return new Promise(resolve => {
    chrome.storage.local.get('pendingListing', r => resolve(r.pendingListing || null))
  })
}

function fillReact(el, value) {
  el.focus(); el.click()
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

function showBanner(listing) {
  if (document.getElementById('ls-banner')) return
  const d = document.createElement('div')
  d.id = 'ls-banner'
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#4f46e5;color:#fff;font-family:sans-serif;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 3px 16px rgba(0,0,0,.4)'
  d.innerHTML = `
    <span style="font-size:20px">🔗</span>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:13px">ListSync ✓ wird ausgefüllt…</div>
      <div style="font-size:11px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${listing.title} · ${listing.price} €</div>
    </div>
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
    const el = await waitFor('input#title, input[name="title"]')
    await new Promise(r => setTimeout(r, 400))
    fillReact(el, listing.title.substring(0, 60))
  } catch {}

  try {
    const el = await waitFor('textarea#description, textarea[name="description"]')
    await new Promise(r => setTimeout(r, 200))
    fillReact(el, listing.description || '')
  } catch {}

  try {
    const el = await waitFor('input#price, input[name="price"]')
    await new Promise(r => setTimeout(r, 200))
    fillReact(el, String(listing.price).replace('.', ','))
  } catch {}

  // Marke – Vinted hat ein Autocomplete-Feld
  if (listing.brand) {
    try {
      // Vinted-Formular hat einen "Marke"-Input (oft data-testid="brand-input" oder label "Marke")
      const brandSelectors = [
        'input[data-testid="brand-input"]',
        'input[placeholder*="arke"]',
        'input[name="brand"]',
        'input[id*="brand"]'
      ]
      let brandEl = null
      for (const sel of brandSelectors) {
        brandEl = document.querySelector(sel)
        if (brandEl) break
      }
      if (brandEl) {
        await new Promise(r => setTimeout(r, 300))
        fillReact(brandEl, listing.brand)
        // Autocomplete: warte auf Dropdown und klick ersten Treffer
        await new Promise(r => setTimeout(r, 800))
        const suggestion = document.querySelector('[data-testid="brand-suggestion"], [class*="suggestion"] li, [role="option"]')
        if (suggestion) suggestion.click()
      }
    } catch {}
  }

  // Farbe
  if (listing.color) {
    try {
      const colorSelectors = [
        'input[data-testid="color-input"]',
        'input[placeholder*="arbe"]',
        'input[name="color"]',
        'input[id*="color"]'
      ]
      let colorEl = null
      for (const sel of colorSelectors) {
        colorEl = document.querySelector(sel)
        if (colorEl) break
      }
      if (colorEl) {
        await new Promise(r => setTimeout(r, 300))
        fillReact(colorEl, listing.color)
        await new Promise(r => setTimeout(r, 800))
        const suggestion = document.querySelector('[role="option"]')
        if (suggestion) suggestion.click()
      }
    } catch {}
  }

  // Größe
  if (listing.size) {
    try {
      const sizeSelectors = [
        'input[data-testid="size-input"]',
        'input[placeholder*="rö"]',
        'input[name="size"]',
        'input[id*="size"]'
      ]
      let sizeEl = null
      for (const sel of sizeSelectors) {
        sizeEl = document.querySelector(sel)
        if (sizeEl) break
      }
      if (sizeEl) {
        await new Promise(r => setTimeout(r, 300))
        fillReact(sizeEl, listing.size)
        await new Promise(r => setTimeout(r, 800))
        const suggestion = document.querySelector('[role="option"]')
        if (suggestion) suggestion.click()
      }
    } catch {}
  }

  // Bilder kommen via MAIN-World-Injection aus background.js
  // Storage NICHT hier leeren – background.js hat es schon getan
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(fill, 1000))
} else {
  setTimeout(fill, 1000)
}
