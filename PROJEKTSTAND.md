# ListSync – Projektstand
_Zuletzt aktualisiert: 30.04.2026_

## Was ist ListSync?
Crosslisting-Tool für Reseller in Deutschland/EU.
Artikel einmal anlegen → automatisch auf eBay, Vinted und Kleinanzeigen posten.

## Tech-Stack
- **Framework:** Next.js 14.2.3 (App Router)
- **Datenbank:** Prisma ORM + SQLite (`prisma/dev.db`)
- **Styling:** Tailwind CSS via CDN (kein PostCSS)
- **Pfad-Alias:** `@/` via `jsconfig.json`
- **Bilder:** gespeichert in `public/uploads/`, URLs als JSON-String in DB

## App starten
Doppelklick auf: `/Users/dennyschreiner/Desktop/ListSync starten.command`
→ öffnet http://localhost:3000

## Chrome Extension
Ordner: `listsync-app/chrome-extension/`
Einmalig installieren: chrome://extensions → Entwicklermodus → Entpackte Erweiterung laden

### Wie Extension funktioniert (Vinted ✅ FERTIG)
1. User klickt "Crossposten" → Vinted auswählen → Posten
2. Background lädt Bilder von localhost:3000 als Base64 herunter
3. Neuer Chrome-Tab öffnet vinted.de/items/new
4. Content Script füllt Titel, Beschreibung, Preis aus (via execCommand)
5. Background injiziert Bilder via chrome.scripting MAIN-World direkt in React

### Technische Lösung Bild-Upload
- Content Scripts laufen in isolierter Welt → kein direkter React-Zugriff
- Lösung: `chrome.scripting.executeScript({ world: 'MAIN' })` aus background.js
- MAIN-World hat vollen React Fiber Zugriff → onChange direkt aufrufen
- Bilder werden als Base64 vom Background geladen (CORS-Bypass)

## Was funktioniert ✅
- Listings anlegen (3-Step-Form)
- Echtes Bild-Upload (JPG/PNG/HEIC, max 8 Bilder)
- Crossposten → Vinted (Text + Bilder vollautomatisch)
- Als Verkauft markieren
- Relisten (Button + automatischer Alert nach X Tagen)
- Relist-Frist einstellbar (3/5/7/14 Tage)
- Umsatzziele speichern
- Plattform-Konten verbinden/trennen

## Was noch fehlt ❌
1. **Kleinanzeigen** – Extension noch nicht getestet (braucht Login)
2. **eBay API** – Posting-Logik fehlt noch
3. **Vercel Deploy** – App online stellen (SQLite → PostgreSQL nötig)

## Nächster Schritt
Kleinanzeigen testen + fixen, dann online stellen via Vercel
