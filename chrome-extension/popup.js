const BASE_URL = 'https://project-dle5b.vercel.app'

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

// ── Vinted Accounts ───────────────────────────────────────────────────────────
function loadAccounts(cb) {
  chrome.storage.local.get(['vintedAccounts','activeVintedAccount'], r =>
    cb(r.vintedAccounts || [], r.activeVintedAccount || null))
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
    accounts.forEach((name, i) => {
      const isActive = name === active
      const item = document.createElement('div')
      item.className = 'account-item' + (isActive ? ' active' : '')
      item.innerHTML = `
        <span class="account-name">${name}</span>
        ${isActive ? '<span class="active-badge">Aktiv</span>' : ''}
        <button class="del-btn" data-i="${i}" title="Entfernen">✕</button>
      `
      item.addEventListener('click', e => {
        if (e.target.classList.contains('del-btn')) {
          const idx = Number(e.target.dataset.i)
          const updated = accounts.filter((_,j) => j !== idx)
          const newActive = active === accounts[idx] ? (updated[0] || null) : active
          saveAccounts(updated, newActive); renderAccounts()
        } else {
          saveAccounts(accounts, name); renderAccounts()
        }
      })
      list.appendChild(item)
    })
  })
}

document.getElementById('addAccountBtn').addEventListener('click', () => {
  const input = document.getElementById('newAccountName')
  const name  = input.value.trim()
  if (!name) return
  loadAccounts((accounts, active) => {
    if (accounts.includes(name)) return
    const updated = [...accounts, name]
    saveAccounts(updated, active || name)
    input.value = ''
    renderAccounts()
  })
})
document.getElementById('newAccountName').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addAccountBtn').click()
})
renderAccounts()
