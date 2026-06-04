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
  Badge.js        ← PlatformBadge, StatusBadge, PLATFORMS, CATEGORIES, CONDITIONS etc.
  CategoryPicker.js

lib/
  prisma.js       ← Prisma Client Singleton + ensureMigrated()
  auth.js         ← NextAuth authOptions
  theme.js        ← useDark(), useTheme() Hooks für Dark Mode

chrome-extension/
  manifest.json         ← v3.2, MV3
  background.js         ← Service Worker, handlePost(), INJECT_MAIN_IMAGES
  popup.html / popup.js ← Extension Popup
  content/
    vinted.js           ← Vinted Formular ausfüllen + Bild-Injection (MAIN world)
    vinted-sync.js      ← Vinted Bestellhistorie scrapen
    vinted-import.js    ← Einzelnen Vinted-Artikel importieren
    kleinanzeigen.js    ← Kleinanzeigen Formular ausfüllen
    ebay.js             ← eBay Formular ausfüllen
    listsync-bridge.js  ← Läuft auf ListSync-Domain, leitet window.postMessage an Extension weiter
```

## Datenbank (Prisma Schema + Raw-SQL Felder)

Das Prisma-Schema ist bewusst minimal gehalten. Neue Felder werden über `ensureMigrated()` in `lib/prisma.js` per Raw-SQL hinzugefügt (umgeht stale Prisma Client).

```prisma
model Listing {
  id, title, description, price, buyPrice, condition, category,
  brand, size, color, shipping (JSON), shipSize, address,
  status (aktiv/verkauft/inaktiv),
  platforms (JSON), images (JSON), views, days,
  relistedAt, createdAt, updatedAt, userId,
  -- Raw-SQL Felder (in ensureMigrated hinzugefügt):
  material, stil, beinform, taillenumfang, kaCategory, ebayCategory
}
model User { id, email, password, name }
model Settings { relistDays, dayGoal, monthGoal, shopName, address, taxId, kleinunternehmer }
model PlatformAccount { platform, connected, apiKey, username, data }
model Receipt { ... }
```

### ensureMigrated() Pattern
Neue DB-Spalten IMMER in `lib/prisma.js` → `ensureMigrated()` eintragen:
```js
const cols = [
  ['material', "TEXT NOT NULL DEFAULT ''"],
  ['kaCategory', "TEXT NOT NULL DEFAULT ''"],
  ['ebayCategory', "TEXT NOT NULL DEFAULT ''"],
  // ... alle neuen Felder hier
]
```
API-Routes die neue Felder schreiben: `await ensureMigrated()` am Anfang aufrufen.
Neue Felder lesen/schreiben: immer per `prisma.$executeRawUnsafe()` — NICHT über `prisma.listing.create/update` (stale schema).

### Condition-Werte (Badge.js)
```js
CONDITIONS = ['Neu mit Etikett', 'Neu ohne Etikett', 'Sehr gut', 'Gut', 'Akzeptabel']
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
3. `listsync-bridge.js` empfängt das und sendet an `background.js`
4. `background.js` lädt Bilder als Base64, öffnet Tabs für jede Platform
5. Content Scripts füllen die Formulare aus

**INJECT_MAIN_IMAGES**: `chrome.runtime.sendMessage({ type: 'INJECT_MAIN_IMAGES', imageData })` → Background injiziert `injectImages()` in MAIN world (für React-Bild-Uploads nötig).

**Vinted-Sync**: Extension scrapet Bestellhistorie auf Vinted, sendet an `/api/import`. Braucht aktive Browser-Session auf der ListSync-App.

## eBay Content Script (ebay.js) — Live-bestätigte DOM-Selektoren

**Flow**: `background.js` öffnet `https://www.ebay.de/sl/prelist/suggest` → `handlePrelist()` gibt Titel ein, wartet bis URL `/lstng` enthält → `fillLstng()` füllt alles aus.

### Auto-Submit (live bestätigt)
- Publish: `"Artikel kostenlos einstellen"` (NICHT "Einstellen"!)
- Draft:   `"Speichern"`
- Script scrollt vor Suche nach unten damit Button sichtbar ist

### Bilder (fehelix Uploader)
- File-Input: `#fehelix-uploader` (display:none, kein React)
- Injection: `Object.defineProperty(fi, 'files', {get: ()=>dt.files})` + `change` Event
- Input wird kurz sichtbar gemacht (`position:fixed;top:-9999px`) damit fehelix feuert
- RACE CONDITION FIX: `imageData` wird beim Tab-Öffnen noch geladen → Retry-Loop bis zu 24s
- eBay Upload-API: `window.sellingUIUploader['fehelix-uploader'].uploadFiles(files)`
- Thumbnail-Check: wartet bis `[class*="uploader"] img[src*="blob"]` erscheint (max 20s)

### Prelist → lstng Navigation
- `handlePrelist()` probiert Button-Texte: "Weiter", "Suchen", "Los", "Kategorien anzeigen"
- Wartet bis URL `/lstng` enthält (max 15s), ruft dann `fillLstng()` direkt auf
- Guard `_lstngFillStarted` verhindert Doppel-Ausführung

### Zustand (Condition) — KRITISCH
eBay hat zwei DOM-Zustände für die Condition-Section:

```
ZUSTAND NICHT GEWÄHLT (class "summary--warn"):
  button.condition-recommendation-value     → Quick-Tiles ("Neu mit Etikett", "Gebraucht - Gut")
  button.condition-recommendation-more-values  → "..." öffnet Artikelzustand-Dialog
  aria-label: "Weitere Artikelzustände ansehen"

ZUSTAND BEREITS GEWÄHLT (kein summary--warn):
  button.smry--value.refocus.fake-link      → aktueller Zustand, Klick öffnet Dialog

DIALOG "Artikelzustand" (class: lightbox-dialog__window):
  input[type="radio"][name="condition"][value="1000|1500|1750|2990|3000|3010"]
  label[for=radio.id]   ← klicken ist zuverlässiger als radio.click()
  button "Fertig"       ← Bestätigen
```

condId-Mapping (eBay DE):
- `1000` = Neu mit Etikett
- `1500` = Neu ohne Etikett / Wie neu / Neuwertig
- `1750` = Neu mit Mängeln
- `2990` = Gebraucht - Hervorragend / Sehr gut
- `3000` = Gebraucht - Gut ← Fallback für unbekannte Werte
- `3010` = Gebraucht - Akzeptabel / Befriedigend

**Wichtig**: `getConditionId()` gibt IMMER einen Wert zurück (nie null). Fallback = '3000'.
**Wichtig**: Condition-Buttons mit `waitForAny(..., 8000)` abwarten — nicht sofort per `querySelector` suchen (Timing-Problem).

### Artikelmerkmale (fillAspect)
```
Row:    [class*="attributes--field"]
Label:  [class*="attributes--label"]
Größe:  button[class*="toggle-button"]  → direkt klicken (KEIN Dropdown!)
Andere: button[class*="se-expand-button"]  → öffnet Dropdown
Suche:  InputEvent({ inputType: 'insertText', data: value })  → React-Filter (NICHT char-by-char!)
Option: [role="menuitemradio"]  → klicken (NICHT der Container div[role="menu"])
```

### Kategorie-Erkennung (background.js)
`ebayCategory` hat höchste Priorität → dann `kaCategory` → dann Keyword-Matching auf title/category.
eBay öffnet immer via Prelist-URL: `https://www.ebay.de/sl/prelist/suggest`

## Kleinanzeigen Content Script (kleinanzeigen.js) — Live-bestätigte Selektoren

URL-Pattern: `https://www.kleinanzeigen.de/anzeige/aufgeben` (Hash-Navigation!)
Seiten werden über `#` navigiert — URL ändert sich nicht, nur der Hash.

```
Titel:       input#postad-title
Preis:       input#postad-price
Beschr.:     textarea#postad-description
Kategorie:   .breadcrump-selector (Hash-Navigation mit waitForAny)
Zustand:     select[id*="condition"] oder [data-testid*="condition"]
PLZ:         input#postad-zipcode
Bilder:      input[type="file"][accept*="image"]
```

## Vinted Content Script (vinted.js) — Live-bestätigte Selektoren

URL: `https://www.vinted.de/items/new`
Bilder: React Fiber Image Injection via `chrome.scripting.executeScript({ world: 'MAIN' })` — NICHT DataTransfer (wird von React geblockt).

```
Titel:       input[data-testid="title-input"] o.ä.
Preis:       input[data-testid="price-input"] o.ä.
Beschr.:     textarea[data-testid="description-input"] o.ä.
Bilder:      MAIN world injection via INJECT_MAIN_IMAGES
```

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

### Neue Raw-SQL Felder (material, kaCategory, ebayCategory etc.) lesen
Die Felder werden beim GET nicht automatisch mitgegeben (stale Prisma schema).
PATCH-Route gibt sie im Response zurück: `material: data.material ?? existing.material ?? ''`

### Crosspost aus listings/page.js
```js
window.postMessage({ type: 'LISTSYNC_POST', listing, platforms: ['vinted','kleinanzeigen','ebay'] }, '*')
```

### React-Inputs in Content Scripts befüllen
```js
// Setter via Object.getOwnPropertyDescriptor (umgeht React's synthetisches Event-System)
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
setter?.call(input, value)
input.dispatchEvent(new Event('input', { bubbles: true }))

// Für Suchfelder mit React-Filter: InputEvent (NICHT char-by-char KeyboardEvent!)
input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }))
```

## Crosspost-Modus (Entwurf vs. Hochladen)

`listing.status === 'entwurf'` → Extension klickt Draft-Button auf allen Plattformen:
- Vinted:         "Entwurf speichern"
- Kleinanzeigen:  "Entwurf speichern"
- eBay:           "Speichern"

`listing.status === 'aktiv'` → Extension klickt Publish-Button:
- Vinted:         "Hochladen"  
- Kleinanzeigen:  "Anzeige aufgeben"
- eBay:           "Artikel kostenlos einstellen"

Modus wählen:
- Neues Listing → Schritt 3: Karten "Als Entwurf" / "Jetzt hochladen"
- Bestehende Listings → Crosspost-Modal: Karten oben im Modal

## Kleinanzeigen — Kategorie-Mapping
`detectCategory()` prüft ZUERST `CATEGORY_PATH` (Herren/Damen/etc.), dann Keyword-Matching.
`CAT_TO_KA_LEAF` übersetzt App-Namen → KA-Namen (z.B. "Pullover & Strickjacken" → "Pullover" für Damen).
Fallback: wenn gemappter Leaf nicht gefunden → Original-`kaCategory` wird versucht (z.B. Herren hat "Pullover & Strickjacken" exakt).

## Noch offen / TODO
- [ ] Belege: PDF-Generierung (Seite existiert, PDF-Export fehlt noch)
- [ ] eBay: Versandoptionen automatisch setzen
- [ ] Buchhaltung: Steuer-Export verfeinern
- [ ] Vinted-Sync: Zuverlässigkeit verbessern (braucht aktive Browser-Session)
- [ ] Mobile: Einige Dark-Mode Elemente noch nicht perfekt

## Stripe-Zahlungssystem (implementiert 2026-06-02)

Vollständige Free/Pro/Lifetime-Integration ist live im Code.

### Dateien
- `lib/stripe.js` — Stripe-Client, PLANS-Objekt, `getUserPlan(userId)` Helper
- `app/api/stripe/checkout/route.js` — Checkout Session (POST `{plan: 'pro'|'lifetime'}`)
- `app/api/stripe/webhook/route.js` — Webhooks: checkout.session.completed, subscription.updated/deleted, invoice.payment_failed
- `app/api/stripe/portal/route.js` — Customer Portal URL
- `app/api/subscription/route.js` — Aktuellen Plan abfragen (GET)
- `app/pricing/page.js` — Öffentliche Pricing Page (in middleware.js aus Auth ausgenommen)

### DB-Felder (via ensureMigrated in lib/prisma.js)
User-Tabelle: `stripe_customer_id`, `stripe_subscription_id`, `plan`, `plan_status`, `plan_ends_at`

### Pläne
- **Free**: max 5 Listings, 1 Plattform
- **Pro**: €9,99/Monat, alles unlimitiert
- **Lifetime**: €79 einmalig, Pro für immer

### Limit-Enforcement
`app/api/listings/route.js` POST — gibt `{upgrade: true}` zurück wenn Free-Limit erreicht.

### Env-Variablen (.env)
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_LIFETIME=price_...
```

### Lokal testen
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Auf Vercel: Env-Vars im Dashboard setzen, Webhook-URL = `https://project-dle5b.vercel.app/api/stripe/webhook`

---

## Design-Referenz
**Sentra** (get-sentra.com) — Vinted Sales Tracker. Selbe Zielgruppe, ähnliche Features. ListSync soll sich so anfühlen.

Dashboard-Aufbau: 3 StatCards (Einnahmen | Gewinn | Monatsziel-Gauge) → Linien-Chart + Marge-Card → Platform-Breakdown.
