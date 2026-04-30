// Prüfe ob ListSync läuft
fetch('http://localhost:3000/api/listings')
  .then(() => {
    document.getElementById('dot').className = 'dot green'
    document.getElementById('statusText').textContent = 'ListSync läuft ✓'
    document.getElementById('statusSub').textContent  = 'Bereit zum Posten'
  })
  .catch(() => {
    document.getElementById('statusText').textContent = 'ListSync nicht aktiv'
    document.getElementById('statusSub').textContent  = 'Starte ListSync zuerst'
  })
