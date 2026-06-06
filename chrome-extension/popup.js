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
    document.getElementById('dot').className = 'dot red'
    document.getElementById('statusText').textContent = 'Nicht erreichbar'
    document.getElementById('statusSub').textContent  = 'Internetverbindung prüfen'
  })

// ── Fortschritts-Anzeige ────────────────────────────────────────────────────
const PLT_LABELS = { vinted: 'Vinted', kleinanzeigen: 'Kleinanzeigen', ebay: 'eBay' }
const STALE_MS = 45_000 // wenn 45s kein Update kam → als hängend behandeln

function dismissPlatform(plt) {
  // Karte ausfaden, dann aus Storage löschen
  const card = document.querySelector(`.progress-card[data-plt="${plt}"]`)
  if (card) card.classList.add('hiding')
  setTimeout(() => {
    chrome.storage.local.get('crosspostProgress', r => {
      const p = r.crosspostProgress || {}
      delete p[plt]
      chrome.storage.local.set({ crosspostProgress: p }, pollProgress)
    })
  }, 220)
}

function renderProgress(prog) {
  const section = document.getElementById('progressSection')
  const cards   = document.getElementById('progressCards')
  const now     = Date.now()

  // Stale-Cleanup: lange keine Updates → automatisch entfernen
  let changed = false
  const cleaned = { ...(prog || {}) }
  for (const [plt, p] of Object.entries(cleaned)) {
    const age = now - (p.ts || 0)
    if (p.done && age > 8000) { delete cleaned[plt]; changed = true; continue }
    if (!p.done && !p.error && age > STALE_MS) { delete cleaned[plt]; changed = true; continue }
  }
  if (changed) chrome.storage.local.set({ crosspostProgress: cleaned })

  const entries = Object.entries(cleaned)
  if (!entries.length) { section.style.display = 'none'; cards.innerHTML = ''; return }
  section.style.display = 'block'

  cards.innerHTML = entries.map(([plt, p]) => {
    const cls   = p.done ? 'done' : p.error ? 'error' : ''
    const pct   = Math.min(100, Math.round(p.percent || 0))
    const label = PLT_LABELS[plt] || plt
    return `
      <div class="progress-card ${cls}" data-plt="${plt}">
        <div class="progress-header">
          <span class="progress-plt"><span class="plt-dot ${plt}"></span>${label}</span>
          <div class="progress-right">
            <span class="progress-pct">${pct}%</span>
            <button class="progress-close" data-close="${plt}" title="Ausblenden">&#x2715;</button>
          </div>
        </div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="progress-step">${p.step || '…'}</div>
      </div>`
  }).join('')

  cards.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      dismissPlatform(btn.dataset.close)
    })
  })
}

function pollProgress() {
  chrome.storage.local.get('crosspostProgress', r => renderProgress(r.crosspostProgress))
}
pollProgress()
setInterval(pollProgress, 800)

// Vinted Accounts — gespeichert als [{name, memberId, syncMode}]
// syncMode: 'sold' | 'active' | 'both' (Default: 'both')
const SYNC_MODES = [
  { id: 'sold',   label: '💰 Verkäufe' },
  { id: 'active', label: '📦 Aktive' },
  { id: 'both',   label: '⚡ Beides' },
]
function loadAccounts(cb) {
  chrome.storage.local.get(['vintedAccounts', 'activeVintedAccount'], r => {
    // Migration: alte String-Arrays / Objekte ohne syncMode auffüllen
    const raw = r.vintedAccounts || []
    const accounts = raw.map(a => {
      if (typeof a === 'string') return { name: a, memberId: '', syncMode: 'both' }
      return { syncMode: 'both', memberId: '', ...a }
    })
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
      list.innerHTML = '<div class="empty">Noch keine Accounts – füge einen hinzu.</div>'
      return
    }
    accounts.forEach((acc, i) => {
      const isActive = acc.name === active
      const mode = acc.syncMode || 'both'
      const item = document.createElement('div')
      item.className = 'account-item' + (isActive ? ' active' : '')
      item.innerHTML = `
        <div class="account-row">
          <div style="flex:1;min-width:0">
            <span class="account-name">${acc.name}</span>
            ${acc.memberId ? `<span class="account-sub">ID: ${acc.memberId}</span>` : '<span class="account-sub warn">⚠ Keine Member-ID</span>'}
          </div>
          ${isActive ? '<span class="active-badge">Aktiv</span>' : ''}
          <button class="del-btn" data-action="del" data-i="${i}" title="Entfernen">&#x2715;</button>
        </div>
        <div class="seg" data-i="${i}">
          ${SYNC_MODES.map(m => `<button type="button" data-mode="${m.id}" class="${mode === m.id ? 'on' : ''}">${m.label}</button>`).join('')}
        </div>
      `

      // Modus-Auswahl (per Account)
      item.querySelectorAll('.seg button').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation()
          const newMode = btn.dataset.mode
          const updated = accounts.map((a, j) => j === i ? { ...a, syncMode: newMode } : a)
          saveAccounts(updated, active)
          renderAccounts()
        })
      })

      // Account-Auswahl / Löschen
      item.querySelector('.account-row').addEventListener('click', e => {
        const target = e.target.closest('[data-action="del"]')
        if (target) {
          const updated = accounts.filter((_, j) => j !== i)
          const newActive = active === acc.name ? (updated[0]?.name || null) : active
          saveAccounts(updated, newActive); renderAccounts()
        } else {
          saveAccounts(accounts, acc.name); renderAccounts()
        }
      })

      list.appendChild(item)
    })
  })
}
// Modus-Selektor für neuen Account
const newSyncMode = document.getElementById('newSyncMode')
newSyncMode.addEventListener('click', e => {
  const btn = e.target.closest('button[data-mode]')
  if (!btn) return
  newSyncMode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn))
})

document.getElementById('addAccountBtn').addEventListener('click', () => {
  const nameInput     = document.getElementById('newAccountName')
  const memberIdInput = document.getElementById('newMemberId')
  const name     = nameInput.value.trim()
  const memberId = memberIdInput.value.trim()
  const syncMode = newSyncMode.querySelector('button.on')?.dataset.mode || 'both'
  if (!name) return
  loadAccounts((accounts, active) => {
    if (accounts.find(a => a.name === name)) return
    const updated = [...accounts, { name, memberId, syncMode }]
    saveAccounts(updated, active || name)
    nameInput.value = ''
    memberIdInput.value = ''
    // Selektor auf "Beides" zurücksetzen
    newSyncMode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.mode === 'both'))
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

  // Aktiven Account + Modus ermitteln
  const { accounts, active } = await new Promise(resolve =>
    loadAccounts((accounts, active) => resolve({ accounts, active })))
  const activeAcc = accounts.find(a => a.name === active) || accounts[0]
  const mode = activeAcc?.syncMode || 'both'

  // Modus 'active': braucht Member-ID, sonst Abbruch
  if (mode === 'active' && !activeAcc?.memberId) {
    result.className = 'sync-result show err'
    result.textContent = 'Aktive-Listings-Modus braucht eine Member-ID am Account.'
    return
  }

  btn.textContent = 'Sync läuft...'
  btn.disabled    = true
  result.className = 'sync-result'

  // syncMode in Storage damit vinted-sync.js es lesen kann
  await chrome.storage.local.set({ syncRequested: true, syncMode: mode })

  if (mode === 'active') {
    // Direkt zum Profil → Phase 2 (mit leeren Verkäufen)
    await chrome.storage.local.set({
      syncSoldData: [],
      syncAccount:  active || activeAcc?.name || 'Hauptaccount',
      syncPhase:    'profile',
    })
    chrome.tabs.create({ url: `https://www.vinted.de/member/${activeAcc.memberId}`, active: true })
  } else {
    // 'sold' oder 'both' → my_orders, Phase 1 startet
    chrome.tabs.create({ url: 'https://www.vinted.de/my_orders?order_type=sold', active: true })
  }

  const listener = (msg) => {
    if (msg.type !== 'IMPORT_DONE') return
    chrome.runtime.onMessage.removeListener(listener)
    const r = msg.result || {}
    result.className = 'sync-result show' + (r.error ? ' err' : '')
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
