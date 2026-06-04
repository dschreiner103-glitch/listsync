const BASE_URL = 'https://project-dle5b.vercel.app'

// ── Hintergrund-Modus Toggle ────────────────────────────────────────────────
const bgToggle  = document.getElementById('bgModeToggle')
const bgSubtext = document.getElementById('bgModeSubtext')

chrome.storage.local.get('backgroundMode', r => {
  bgToggle.checked = !!r.backgroundMode
  bgSubtext.textContent = r.backgroundMode ? 'Läuft im Hintergrund + Benachrichtigung' : 'Tabs öffnen sich sichtbar'
})

bgToggle.addEventListener('change', () => {
  const enabled = bgToggle.checked
  chrome.storage.local.set({ backgroundMode: enabled })
  bgSubtext.textContent = enabled ? 'Läuft im Hintergrund + Benachrichtigung' : 'Tabs öffnen sich sichtbar'
})

// Status check
fetch(`${BASE_URL}/api/listings`, { credentials: 'include' })
  .then(r => {
    const dot  = document.getElementById('dot')
    const text = document.getElementById('statusText')
    const sub  = document.getElementById('statusSub')
    dot.className = 'dot green'
    text.textContent = r.ok ? 'ListSync verbunden ✓' : 'ListSync aktiv – bitte anmelden'
    sub.textContent  = 'project-dle5b.vercel.app'
  })
  .catch(() => {
    document.getElementById('statusText').textContent = 'Nicht erreichbar'
    document.getElementById('statusSub').textContent  = 'Internetverbindung prüfen'
  })

// ── Fortschritts-Anzeige ────────────────────────────────────────────────────
const PLT_LABELS = { vinted: '🟢 Vinted', kleinanzeigen: '🟠 Kleinanzeigen', ebay: '🟡 eBay' }

function renderProgress(prog) {
  const section = document.getElementById('progressSection')
  const cards   = document.getElementById('progressCards')
  const entries = Object.entries(prog || {})
  if (!entries.length) { section.style.display = 'none'; return }
  section.style.display = 'block'
  cards.innerHTML = entries.map(([plt, p]) => {
    const cls  = p.done ? 'done' : p.error ? 'error' : ''
    const pct  = Math.min(100, Math.round(p.percent || 0))
    const label = PLT_LABELS[plt] || plt
    return `
      <div class="progress-card ${cls}">
        <div class="progress-header">
          <span class="progress-plt">${label}</span>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="progress-step">${p.step || '…'}</div>
      </div>`
  }).join('')
}

function pollProgress() {
  chrome.storage.local.get('crosspostProgress', r => renderProgress(r.crosspostProgress))
}
pollProgress()
setInterval(pollProgress, 800)

// Vinted Accounts — gespeichert als [{name, memberId}]
function loadAccounts(cb) {
  chrome.storage.local.get(['vintedAccounts', 'activeVintedAccount'], r => {
    // Migration: alte String-Arrays zu Objekten konvertieren
    const raw = r.vintedAccounts || []
    const accounts = raw.map(a => typeof a === 'string' ? { name: a, memberId: '' } : a)
    cb(accounts, r.activeVintedAccount || null)
  })
}
function saveAccounts(accounts, active) {
  chrome.storage.local.set({ vintedAccounts: accounts, activeVintedAccount: active })
}
function renderAccounts() {
  loadAccounts((accounts, active) => {
    const list = document.getElementById('accountList')
    list.innerHTML = ''
    if (!accounts.length) {
      list.innerHTML = '<p style="font-size:12px;color:#9ca3af;padding:4px 0">Noch keine Accounts – füge einen hinzu.</p>'
      return
    }
    accounts.forEach((acc, i) => {
      const isActive = acc.name === active
      const item = document.createElement('div')
      item.className = 'account-item' + (isActive ? ' active' : '')
      item.innerHTML = `
        <div style="flex:1;min-width:0">
          <span class="account-name">${acc.name}</span>
          ${acc.memberId ? `<span style="font-size:10px;color:#9ca3af;display:block">ID: ${acc.memberId}</span>` : '<span style="font-size:10px;color:#ef4444">⚠ Keine Member-ID</span>'}
        </div>
        ${isActive ? '<span class="active-badge">Aktiv</span>' : ''}
        <button class="del-btn" data-i="${i}" title="Entfernen">&#x2715;</button>
      `
      item.addEventListener('click', e => {
        if (e.target.classList.contains('del-btn')) {
          const idx = Number(e.target.dataset.i)
          const updated = accounts.filter((_, j) => j !== idx)
          const newActive = active === accounts[idx]?.name ? (updated[0]?.name || null) : active
          saveAccounts(updated, newActive); renderAccounts()
        } else {
          saveAccounts(accounts, acc.name); renderAccounts()
        }
      })
      list.appendChild(item)
    })
  })
}
document.getElementById('addAccountBtn').addEventListener('click', () => {
  const nameInput     = document.getElementById('newAccountName')
  const memberIdInput = document.getElementById('newMemberId')
  const name     = nameInput.value.trim()
  const memberId = memberIdInput.value.trim()
  if (!name) return
  loadAccounts((accounts, active) => {
    if (accounts.find(a => a.name === name)) return
    const updated = [...accounts, { name, memberId }]
    saveAccounts(updated, active || name)
    nameInput.value = ''
    memberIdInput.value = ''
    renderAccounts()
  })
})
document.getElementById('newAccountName').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('newMemberId').focus()
})
document.getElementById('newMemberId').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addAccountBtn').click()
})
renderAccounts()

// Vinted Sync
document.getElementById('syncBtn').addEventListener('click', async () => {
  const btn    = document.getElementById('syncBtn')
  const result = document.getElementById('syncResult')
  btn.textContent = 'Sync laeuft...'
  btn.disabled    = true
  result.className = 'sync-result'

  await chrome.storage.local.set({ syncRequested: true })
  chrome.tabs.create({ url: 'https://www.vinted.de/my_orders?order_type=sold', active: true })

  const listener = (msg) => {
    if (msg.type !== 'IMPORT_DONE') return
    chrome.runtime.onMessage.removeListener(listener)
    const r = msg.result || {}
    result.className = 'sync-result show'
    if (r.error) {
      result.textContent = 'Fehler: ' + r.error
    } else {
      const parts = []
      if (r.created)  parts.push(r.created + ' neu importiert')
      if (r.updated)  parts.push(r.updated + ' auf "verkauft" aktualisiert')
      if (r.skipped)  parts.push(r.skipped + ' bereits vorhanden')
      result.textContent = parts.join(', ') || 'Keine neuen Einträge'
    }
    btn.textContent = 'Vinted-Historie importieren'
    btn.disabled = false
  }
  chrome.runtime.onMessage.addListener(listener)

  setTimeout(() => {
    chrome.runtime.onMessage.removeListener(listener)
    btn.textContent = 'Vinted-Historie importieren'
    btn.disabled = false
    if (!result.classList.contains('show')) {
      result.className = 'sync-result show'
      result.textContent = 'Timeout - bitte erneut versuchen'
    }
  }, 60000)
})
