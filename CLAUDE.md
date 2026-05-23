# ListSync — Projekt-Kontext für Claude Code

## Was ist das?
Crosslisting-Tool für Reseller. Artikel einmal anlegen, automatisch auf **Vinted**, **Kleinanzeigen** und **eBay** posten. Umsatz/Gewinn-Tracking, Dark Mode, Chrome Extension.

Inspiriert von: **Sentra** (get-sentra.com) — ähnliches Design und Feature-Set.

## Live-URL
**https://project-dle5b.vercel.app**
GitHub: https://github.com/dschreiner103-glitch/listsync

## Lokal starten
```bash
npm run dev          # → http://localhost:3000
npx prisma db push   # DB-Schema anlegen (einmalig)
```

## Tech Stack
- **Next.js 14.2.3** App Router, Client Components (`'use client'`)
- **Prisma ORM + SQLite** (`prisma/dev.db`) — lokal
- **Tailwind via CDN** (kein PostCSS) — arbiträre Werte funktionieren, komplexe Styles als inline `style={{}}`
- **NextAuth** Credentials + bcryptjs
- **@vercel/blob** für Bild-Upload
- **Chrome Extension Manifest V3** — background.js (Service Worker) + Content Scripts

## Ordnerstruktur
```
app/
  dashboard/page.js      ← Hauptseite, Sentra-Style Analytics
  listings/page.js       ← Listings verwalten, crossposten, relisten
  new/page.js            ← Neues Listing erstellen (3 Schritte)
  settings/page.js       ← Ziele, Business-Infos, Platform-Accounts
  buchhaltung/page.js    ← Alle Listings als Tabelle, CSV-Export
  belege/page.js         ← Rechnungen/Belege
  login/page.js
  register/page.js
  api/
    listings/route.js         ← GET, POST, DELETE
    listings/[id]/route.js    ← GET, PATCH, DELETE
    listings/[id]/relist/route.js
    import/route.js           ← Vinted-Sync Endpunkt (Chrome Extension → App)
    settings/route.js
    platforms/route.js
    receipts/route.js
    upload/route.js
    auth/[...nextauth]/route.js

components/
  Sidebar.js      ← Dunkel (#111827), Dark-Mode Toggle (Mond-Icon)
  MobileNav.js    ← Mobile Bottom Nav
  Badge.js        ← PlatformBadge, StatusBadge, PLATFORMS, CATEGORIES, etc.
  CategoryPicker.js

lib/
  prisma.js       ← Prisma Client Singleton
  auth.js         ← NextAuth authOptions
  theme.js        ← useDark(), useTheme() Hooks für Dark Mode

chrome-extension/
  manifest.json         ← v1.5, MV3
  background.js         ← Service Worker, handlePost(), INJECT_MAIN_IMAGES
  popup.html / popup.js ← Extension Popup
  content/
    vinted.js           ← Vinted Formular ausfüllen + Bild-Injection (MAIN world)
    vinted-sync.js      ← Vinted Bestellhistorie scrapen
    vinted-import.js    ← Einzelnen Vinted-Artikel importieren
    kleinanzeigen.js    ← Kleinanzeigen Formular ausfüllen
    ebay.js             ← eBay Formular ausfüllen (NEU)
    listsync-bridge.js  ← Läuft auf ListSync-Domain, leitet window.postMessage an Extension weiter
```

## Datenbank (Prisma Schema)
```prisma
model Listing {
  id, title, description, price, buyPrice, condition, category,
  brand, size, color, shipping (JSON), shipSize, status (aktiv/verkauft/inaktiv),
  platforms (JSON), images (JSON), views, days, relistedAt, createdAt, updatedAt, userId
}
model User { id, email, password, name }
model Settings { relistDays, dayGoal, monthGoal, shopName, address, taxId, kleinunternehmer }
model PlatformAccount { platform, connected, apiKey, username, data }
model Receipt { ... }
```

## CSS / Theme System
Globale CSS-Klassen in `app/layout.js`:
- `.ls-card` — weiße Karte mit Border + Shadow (Dark Mode: `var(--surface)`)
- `.ls-btn-primary` — Indigo-Gradient Button
- `.ls-page` — `min-height: 100vh; background: var(--bg)`

CSS-Variablen (Light / Dark):
```css
/* Light */  --bg: #f0f2f7; --surface: #fff; --border: #e8ecf2;
             --text-1: #111827; --text-2: #6b7280; --text-3: #9ca3af;
/* Dark */   --bg: #0d1117; --surface: #161b22; --border: #30363d;
             --text-1: #e6edf3; --text-2: #b1bac4; --text-3: #8b949e;
```

Dark Mode Toggle: `useDark()` aus `lib/theme.js` — setzt `html.dark` Klasse + localStorage.

## Chrome Extension — Wie es funktioniert
1. User ist auf `project-dle5b.vercel.app` eingeloggt
2. Klickt "Crossposten" auf einem Listing → `window.postMessage({ type: 'LISTSYNC_POST', listing, platforms })`
3. `listsync-bridge.js` (läuft auf der ListSync-Domain) empfängt das und sendet an `background.js`
4. `background.js` lädt Bilder als Base64, öffnet Tabs für jede Platform
5. Content Scripts füllen die Formulare aus:
   - Vinted: `vinted.js` — React Fiber Image Injection via `chrome.scripting.executeScript({ world: 'MAIN' })`
   - Kleinanzeigen: `kleinanzeigen.js` — URL: `/anzeige/aufgeben`
   - eBay: `ebay.js` — URL: `ebay.de/sl/list`

**INJECT_MAIN_IMAGES**: Content Scripts können `chrome.runtime.sendMessage({ type: 'INJECT_MAIN_IMAGES', imageData })` senden → Background injiziert `injectImages()` in MAIN world.

**Vinted-Sync**: Extension scrapet Bestellhistorie auf Vinted, sendet an `/api/import`. Braucht aktive Session (Cookies) auf der ListSync-App.

## Wichtige Patterns

### Platform-Farben (Badge.js)
```js
const PLT = {
  ebay:         { name:'eBay', dot:'#ca8a04' },
  vinted:       { name:'Vinted', dot:'#0d9488' },
  kleinanzeigen:{ name:'Kleinanzeigen', dot:'#ea580c' },
}
```

### API-Auth
Alle API-Routes prüfen `getServerSession(authOptions)` — `session.user.id` muss vorhanden sein.

### Listing-Felder aus API parsen
```js
{ ...listing, platforms: JSON.parse(l.platforms), images: JSON.parse(l.images||'[]'), shipping: JSON.parse(l.shipping||'[]') }
```

### Crosspost/Relist aus listings/page.js
```js
window.postMessage({ type: 'LISTSYNC_POST', listing, platforms: ['vinted','kleinanzeigen','ebay'] }, '*')
```

## Noch offen / TODO
- [ ] Belege: PDF-Generierung (Seite existiert, PDF-Export fehlt noch)
- [ ] eBay Kategorie-Auswahl automatisieren (aktuell manuell)
- [ ] Buchhaltung: Steuer-Export verfeinern
- [ ] Vinted-Sync: Zuverlässigkeit verbessern (braucht aktive Browser-Session)
- [ ] Mobile: Einige Dark-Mode Elemente noch nicht perfekt

## Design-Referenz
**Sentra** (get-sentra.com) — Vinted Sales Tracker. Selbe Zielgruppe, ähnliche Features. ListSync soll sich so anfühlen.

Dashboard-Aufbau: 3 StatCards (Einnahmen | Gewinn | Monatsziel-Gauge) → Linien-Chart + Marge-Card → Platform-Breakdown.
