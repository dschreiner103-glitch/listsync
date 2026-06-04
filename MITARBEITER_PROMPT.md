# ListSync — Vollständiger Kontext-Prompt für Claude Code

Kopiere diesen gesamten Text und füge ihn am Anfang deiner Claude Code Session ein, BEVOR du irgendwelche Aufgaben stellst.

---

## WIE DER CHEF ARBEITET — WICHTIGSTE REGELN

Der Chef (Denny) kommuniziert auf Deutsch, oft kurz und informal, manchmal mit Tippfehlern. Das ist normal — verstehe den Intent, frag nicht nach was gemeint ist wenn es klar genug ist. Einfach machen.

**Was er will:**
- **Einfach anfangen und machen** — nicht lange fragen, nicht lange erklären
- **Kurze Antworten** — keine langen Textwände, kein Erklärbär
- **Direkt ins Ziel** — wenn er sagt "mach X", dann X machen, nicht erstmal "ich würde vorschlagen..."
- **Deployen können** — nach Änderungen immer committen und pushen, Vercel deployt automatisch
- **Fehlermeldungen ernst nehmen** — wenn er sagt "das funktioniert nicht", glauben und sofort debuggen

**Was ihn nervt:**
- Wenn Claude zu viel erklärt statt zu machen
- Wenn Claude Dinge anders macht als besprochen
- Wenn Claude nach Dingen fragt die offensichtlich sind
- Lange Antworten wenn er etwas Einfaches fragt
- Wenn Code funktioniert aber nicht wie erwartet aussieht

**Kommunikations-Stil:**
- Er schreibt Deutsch, casual, manchmal mit Tippfehlern — das ignorieren und verstehen
- Kurze Nachrichten → kurze Antworten
- Er sagt oft "mach einfach" oder "kannst du mal" → sofort loslegen
- Wenn er Feedback gibt ("das ist falsch", "so nicht") → sofort verstehen und anders machen, nicht diskutieren

---

## SYSTEM-KONTEXT: LISTSYNC PROJEKT

**ListSync** ist ein Crosslisting-Tool für Reseller. Artikel einmal anlegen, automatisch auf Vinted, Kleinanzeigen und eBay posten. Features: Umsatz/Gewinn-Tracking, Dark Mode, Chrome Extension, Community-Chat, Lagersystem, KI-Features, Stripe-Bezahlsystem.

**Design-Inspiration:** Sentra (get-sentra.com) — gleiche Zielgruppe, ähnliche Features. ListSync soll sich genauso anfühlen — clean, modern, Indigo als Akzentfarbe.

---

## ACCOUNTS & ZUGANG

- **Live-App:** https://project-dle5b.vercel.app
- **GitHub:** https://github.com/dschreiner103-glitch/listsync
- **Vercel:** vercel.com — Projekt "project-dle5b" (mit GitHub verbunden)
- **Admin-Emails:** In Vercel env `ADMIN_EMAILS` — diese bekommen Lifetime-Plan gratis

---

## DEPLOYEN — SO GEHT ES

### Standard (automatisch)
```bash
git add .
git commit -m "feat/fix: beschreibung"
git push origin main
# → Vercel deployt automatisch in ~1-2 Min
```

### Manuell
```bash
vercel --prod
```

### Build lokal testen
```bash
npm run build && npm run start
```

### WICHTIG: Build kopiert Production-Schema
`package.json` build-Skript: `cp prisma/schema.production.prisma prisma/schema.tmp.prisma && npx prisma generate --schema=prisma/schema.tmp.prisma && next build`
→ Das ist für PostgreSQL in Produktion. **Nie ändern!**

### Vercel Env-Vars
Vercel Dashboard → Projekt → Settings → Environment Variables
Alle STRIPE_*, NEXTAUTH_SECRET, DATABASE_URL, ADMIN_EMAILS müssen dort gesetzt sein.

---

## LOKAL STARTEN

```bash
npm install
npx prisma db push   # einmalig
npm run dev          # → http://localhost:3000
```

---

## TECH STACK

- **Next.js 14.2.3** App Router, Client Components (`'use client'` überall)
- **Prisma ORM** — lokal: SQLite (`prisma/dev.db`), Produktion: PostgreSQL
- **Tailwind via CDN** — arbiträre Werte funktionieren, komplexe Styles als `style={{}}`
- **NextAuth** Credentials + bcryptjs
- **@vercel/blob** für Bild-Upload (direkt vom Client, kein Server-Round-Trip)
- **Stripe** v22 + @stripe/stripe-js v9
- **jsPDF** für PDF-Generierung
- **@gradio/client** für KI Try-On Feature
- **Chrome Extension Manifest V3**

---

## VOLLSTÄNDIGE ORDNERSTRUKTUR

```
app/
  layout.js                    ← Root Layout, globale CSS-Klassen, Dark Mode
  page.js                      ← Landing Page (3D Animationen, Mockup, Pricing)
  dashboard/page.js            ← StatCards, Linien-Chart, Platform-Breakdown, Insights
  listings/page.js             ← Listings verwalten, crossposten, relisten, Bulk
  new/page.js                  ← Neues Listing erstellen (3 Schritte + Live-Score)
  settings/page.js             ← Ziele, Business-Infos, Plan-Anzeige, Stripe-Portal
  buchhaltung/page.js          ← Alle Listings als Tabelle, CSV-Export
  belege/page.js               ← Rechnungen-Liste
  belege/[id]/page.js          ← Einzelne Rechnung
  belege/monthly/page.js       ← Monatsübersicht
  pricing/page.js              ← Öffentliche Pricing Page (kein Login nötig)
  community/page.js            ← Discord-artiger Community-Chat
  lager/page.js                ← 3D Lagersystem mit Regal → Box → Fach Navigation
  login/page.js
  register/page.js
  api/
    listings/route.js              ← GET (alle), POST (mit Plan-Limit-Check)
    listings/[id]/route.js         ← GET, PATCH, DELETE
    listings/[id]/relist/route.js
    import/route.js                ← Vinted-Sync (Chrome Extension → App)
    settings/route.js
    platforms/route.js
    receipts/route.js
    upload/route.js                ← @vercel/blob Upload
    ai/generate/route.js           ← KI Titel/Beschreibung generieren
    ai/tryon/route.js              ← KI Virtual Try-On (CatVTON via Gradio)
    stripe/checkout/route.js
    stripe/webhook/route.js
    stripe/portal/route.js
    subscription/route.js
    onboard-free/route.js          ← Free-Plan aktivieren
    redeem/route.js                ← Gutschein-Code einlösen
    community/messages/route.js
    community/users/route.js
    community/heartbeat/route.js
    community/notifications/route.js
    community/claim-owner/route.js
    lager/route.js
    auth/[...nextauth]/route.js

components/
  Sidebar.js          ← Dunkel (#111827), Navigation, Dark-Mode Toggle, Upgrade-Link
  MobileNav.js        ← Mobile Bottom Nav
  MobilePostHelper.js ← Crossposten ohne Chrome Extension (mobile)
  RouteGuard.js       ← Auth-Schutz Client-seitig
  SessionWrapper.js   ← NextAuth SessionProvider
  Badge.js            ← PlatformBadge, StatusBadge, PLATFORMS, CATEGORIES, CONDITIONS
  CategoryPicker.js

lib/
  prisma.js           ← Prisma Client Singleton + ensureMigrated()
  auth.js             ← NextAuth authOptions
  theme.js            ← useDark(), useTheme() für Dark Mode
  stripe.js           ← Stripe Client, PLANS, getUserAccess()
  score.js            ← Listing-Score Berechnung (0-100)
  categoryMappings.js ← Kategorie-Mappings KA/eBay

chrome-extension/
  manifest.json       ← v3, MV3
  background.js       ← Service Worker, handlePost(), INJECT_MAIN_IMAGES
  popup.html/js       ← Extension Popup mit Live-Progress
  content/
    vinted.js
    vinted-sync.js    ← Bestellhistorie scrapen (2-Phasen: orders + aktive Listings)
    vinted-import.js
    kleinanzeigen.js
    ebay.js
    listsync-bridge.js

middleware.js         ← NextAuth Middleware, schützt alles außer /, login, register, pricing, api/auth
```

---

## DATENBANK — KRITISCHSTE MUSTER (NIEMALS FALSCH MACHEN)

### Das Prisma-Problem
Das Schema (`prisma/schema.prisma`) ist minimal und wird NICHT für neue Felder genutzt. Neue Felder kommen via `ensureMigrated()` in `lib/prisma.js` per Raw-SQL. Grund: Prisma Client auf Vercel ist nach dem Build "eingefroren" — neue Felder im Schema helfen nichts ohne Neugeneration.

**NIEMALS** neue Felder über `prisma.listing.create/update` schreiben — das schlägt fehl.
**IMMER** `prisma.$executeRawUnsafe()` für neue Felder.
**IMMER** `await ensureMigrated()` am Anfang einer API-Route aufrufen wenn neue Felder genutzt werden.

### SQLite (lokal) vs. PostgreSQL (Vercel) — BEIDE müssen funktionieren
```js
const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')

// ALTER TABLE
const sql = isPostgres
  ? `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "neues_feld" TEXT NOT NULL DEFAULT ''`
  : `ALTER TABLE "Listing" ADD COLUMN neues_feld TEXT NOT NULL DEFAULT ''`
await prisma.$executeRawUnsafe(sql)

// SELECT
const rows = isPostgres
  ? await prisma.$queryRawUnsafe(`SELECT * FROM "Listing" WHERE "userId" = $1`, userId)
  : await prisma.$queryRawUnsafe(`SELECT * FROM Listing WHERE userId = ?`, userId)
```

### Neue Felder in ensureMigrated eintragen (lib/prisma.js)
```js
const cols = [
  ['neues_feld', "TEXT NOT NULL DEFAULT ''"],
  ['neuer_int',  "INTEGER NOT NULL DEFAULT 0"],
]
```

### Listing-Felder aus API immer so parsen
```js
{
  ...listing,
  platforms: JSON.parse(l.platforms || '[]'),
  images: JSON.parse(l.images || '[]'),
  shipping: JSON.parse(l.shipping || '[]')
}
```

### Aktuelle DB-Felder außerhalb Prisma-Schema

**Listing-Tabelle (extra via ensureMigrated):**
- `material`, `stil`, `beinform`, `taillenumfang` — Kleidungsattribute
- `kaCategory` — Kleinanzeigen Kategoriepfad
- `address` — Abholadresse
- `ebayCategory` — eBay Kategoriepfad
- `lagerplatz` — Lagerregal/-fach
- `likes` — Vinted-Likes (INTEGER)

**User-Tabelle (extra via ensureMigrated):**
- `stripe_customer_id`, `stripe_subscription_id`, `plan`, `plan_status`, `plan_ends_at`, `onboarded`

**Eigene Tabellen (via ensureMigrated CREATE TABLE):**
- `community_profiles` (user_id, role, xp, last_seen)
- `community_messages` (id, channel, user_id, user_name, content, image_url, created_at)

---

## CSS / THEME SYSTEM

### Globale CSS-Klassen (in app/layout.js)
- `.ls-card` — weiße Karte (Dark: `var(--surface)`)
- `.ls-btn-primary` — Indigo-Gradient Button
- `.ls-page` — `min-height: 100vh; background: var(--bg)`

### CSS-Variablen
```css
/* Light */
--bg: #f0f2f7;  --surface: #fff;     --border: #e8ecf2;
--text-1: #111827; --text-2: #6b7280; --text-3: #9ca3af;

/* Dark (html.dark) */
--bg: #0d1117;  --surface: #161b22;  --border: #30363d;
--text-1: #e6edf3; --text-2: #b1bac4; --text-3: #8b949e;
```

### Dark Mode
`useDark()` aus `lib/theme.js` — setzt `html.dark` + localStorage.
Sidebar-BG: `#111827` (immer dunkel, egal ob Dark Mode an oder aus).

### Extension-Erkennung (CSP-sicher!)
```js
// NICHT: window.LISTSYNC_EXT (CSP-Problem)
// RICHTIG: DOM-Attribut
document.documentElement.getAttribute('data-listsync-ext') === 'true'
```

---

## AUTH & API-MUSTER

### Jede API-Route prüft Auth
```js
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

### Middleware (middleware.js)
Schützt alles außer: `/` (Landing), `/login`, `/register`, `/api/auth`, `/pricing`

---

## STRIPE ZAHLUNGSSYSTEM

### Pläne
- **Free:** max 5 Listings, 1 Plattform, kein Bulk
- **Pro:** €9,99/Monat — unlimitiert, alle 3 Plattformen, Bulk
- **Lifetime:** €79 einmalig — alles aus Pro für immer

### getUserAccess(userId) — immer damit Plan prüfen
```js
import { getUserAccess } from '@/lib/stripe'
const { plan, onboarded } = await getUserAccess(session.user.id)
```

### Onboarding-Flow
Nach Register → `/pricing` → Plan wählen (oder Free aktivieren via `/api/onboard-free`) → Dashboard.
Ungeboanete User (onboarded=0) werden zur Pricing-Seite weitergeleitet.

### Env-Variablen
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_LIFETIME=price_...
ADMIN_EMAILS=email@beispiel.de
```

### Lokal Webhooks testen
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## CHROME EXTENSION — ARCHITEKTUR

### Flow
1. User ist auf project-dle5b.vercel.app eingeloggt
2. Klickt "Crossposten" → `window.postMessage({ type: 'LISTSYNC_POST', listing, platforms })`
3. `listsync-bridge.js` empfängt und sendet an `background.js`
4. `background.js` lädt Bilder als Base64, öffnet Tabs für jede Platform
5. Content Scripts füllen Formulare aus, klicken Submit automatisch

### Bilder in React-Formulare injizieren (MAIN world)
`chrome.runtime.sendMessage({ type: 'INJECT_MAIN_IMAGES', imageData })` → Background injiziert `injectImages()` im MAIN world. Nötig weil React DataTransfer blockt.

### React-Inputs in Content Scripts befüllen
```js
// Standard (Wert setzen)
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
setter?.call(input, value)
input.dispatchEvent(new Event('input', { bubbles: true }))

// Für React-Suchfelder (InputEvent, NICHT char-by-char!)
input.dispatchEvent(new InputEvent('input', {
  bubbles: true, cancelable: true,
  inputType: 'insertText', data: value
}))
```

### Crosspost-Modi
- `listing.status === 'entwurf'` → Draft: "Entwurf speichern" / "Entwurf speichern" / "Speichern"
- `listing.status === 'aktiv'` → Publish: "Hochladen" / "Anzeige aufgeben" / "Artikel kostenlos einstellen"

---

## EBAY CONTENT SCRIPT — LIVE-BESTÄTIGTE SELEKTOREN

### Flow
`background.js` öffnet `https://www.ebay.de/sl/prelist/suggest` → `handlePrelist()` tippt Titel, wartet auf URL mit `/lstng` → `fillLstng()`.

Guard `_lstngFillStarted` verhindert Doppel-Ausführung.

### Auto-Submit
- **Publish:** Button-Text `"Artikel kostenlos einstellen"` (NICHT "Einstellen"!)
- **Draft:** Button-Text `"Speichern"`
- Scroll nach unten vor Button-Suche (sonst nicht sichtbar)

### Bilder (fehelix Uploader) — RACE CONDITION beachten!
```js
// File-Input: #fehelix-uploader (display:none, kein React)
// imageData kommt async → Retry-Loop bis 24s warten!
// Injection:
Object.defineProperty(fi, 'files', { get: () => dt.files })
fi.style = 'position:fixed;top:-9999px;display:block'  // kurz sichtbar machen
fi.dispatchEvent(new Event('change', { bubbles: true }))
// Upload API:
window.sellingUIUploader['fehelix-uploader'].uploadFiles(files)
// Thumbnail-Check: warten bis [class*="uploader"] img[src*="blob"] erscheint (max 20s)
```

### Zustand — 2 DOM-Zustände (KRITISCH)
```
NICHT GEWÄHLT (class "summary--warn"):
  button.condition-recommendation-value        → Quick-Tiles
  button.condition-recommendation-more-values  → "..." → öffnet Dialog
  aria-label: "Weitere Artikelzustände ansehen"

BEREITS GEWÄHLT:
  button.smry--value.refocus.fake-link         → Klick öffnet Dialog

DIALOG (class: lightbox-dialog__window):
  input[type="radio"][name="condition"]        → wählen
  label[for=radio.id]                          → klicken (zuverlässiger als radio.click())
  button "Fertig"                              → bestätigen
```

condId-Mapping (eBay DE):
- `1000` = Neu mit Etikett
- `1500` = Neu ohne Etikett
- `1750` = Neu mit Mängeln
- `2990` = Sehr gut
- `3000` = Gut ← **Fallback** (niemals null zurückgeben!)
- `3010` = Akzeptabel

Condition-Buttons mit `waitForAny(..., 8000)` abwarten — nie sofort per querySelector (Timing-Problem!).

### Artikelmerkmale (fillAspect)
```
Row:    [class*="attributes--field"]
Label:  [class*="attributes--label"]
Größe:  button[class*="toggle-button"]       → direkt klicken (KEIN Dropdown!)
Andere: button[class*="se-expand-button"]    → öffnet Dropdown
Suche:  InputEvent({ inputType: 'insertText', data: value })  → React-Filter
Option: [role="menuitemradio"]               → klicken (NICHT div[role="menu"])
```

### Kategorie-Erkennung
`ebayCategory` hat höchste Priorität → dann `kaCategory` → dann Keyword-Matching.
eBay öffnet immer via Prelist: `https://www.ebay.de/sl/prelist/suggest`

---

## KLEINANZEIGEN CONTENT SCRIPT — LIVE-BESTÄTIGTE SELEKTOREN

URL: `https://www.kleinanzeigen.de/anzeige/aufgeben` (Hash-Navigation!)
```
Titel:    input#postad-title
Preis:    input#postad-price
Beschr.:  textarea#postad-description
Zustand:  select[id*="condition"] oder [data-testid*="condition"]
PLZ:      input#postad-zipcode
Bilder:   input[type="file"][accept*="image"]
Kategorie: .breadcrump-selector (Hash-Navigation mit waitForAny)
```

Kategorie-Logik:
- `detectCategory()` prüft ZUERST `CATEGORY_PATH`, dann Keyword-Matching
- `CAT_TO_KA_LEAF` mappt App-Kategorienamen → KA-Namen
- Fallback: Original-`kaCategory` aus dem Listing

---

## VINTED CONTENT SCRIPT

URL: `https://www.vinted.de/items/new`
Bilder: React Fiber Injection via `chrome.scripting.executeScript({ world: 'MAIN' })` — DataTransfer wird von React geblockt!

### Vinted-Sync (2-Phasen)
1. Phase 1: `my_orders` scrapen → Verkaufsdaten mit Datum
2. Phase 2: Aktives Profil scrapen → aktive Listings
Sync braucht aktive Browser-Session auf Vinted.

---

## PLATFORM-KONSTANTEN (Badge.js)

```js
PLATFORMS = {
  ebay:          { name: 'eBay',          dot: '#ca8a04' },
  vinted:        { name: 'Vinted',        dot: '#0d9488' },
  kleinanzeigen: { name: 'Kleinanzeigen', dot: '#ea580c' },
}

CONDITIONS = ['Neu mit Etikett', 'Neu ohne Etikett', 'Sehr gut', 'Gut', 'Akzeptabel']
```

---

## KI-FEATURES

### KI Beschreibung generieren (`api/ai/generate/route.js`)
Generiert SEO-Titel (max 80 Zeichen) + Beschreibung + Hashtags.
Hashtags: max 70, artikelspezifische zuerst, dann meistgesuchte SEO-Tags.

### KI Virtual Try-On (`api/ai/tryon/route.js`)
Nutzt CatVTON via Gradio (`@gradio/client`). Unterstützt Hose/Oberteil/Ganzkörper.

### Listing-Score (`lib/score.js`)
Gibt Score 0-100 zurück. Live-Anzeige in `new/page.js` beim Erstellen.

---

## VOLLSTÄNDIGE FEATURE-LISTE (aus Git-History, 183 Commits)

Das wurde alles bereits gebaut und ist live:
- Dashboard mit Analytics (StatCards, Chart, Platform-Breakdown, Einkaufsempfehlungen)
- Listings verwalten (erstellen, bearbeiten, löschen, duplizieren, relisten)
- 3-Schritt Listing-Wizard mit Live-Score
- Bulk-Crossposten
- Chrome Extension: Vinted + Kleinanzeigen + eBay auto-ausfüllen
- Chrome Extension: Background-Modus + Live-Progress im Popup
- Vinted-Sync (Bestellhistorie + aktive Listings importieren)
- Vinted Bulk-Import
- Entwurf vs. Publish-Modus
- Dark Mode (vollständig)
- Mobile-Responsive + PWA
- Stripe Zahlungssystem (Free/Pro/Lifetime)
- Onboarding-Flow mit Plan-Wahl
- Aktivierungscode-System
- KI Beschreibung + SEO-Titel generieren
- KI Virtual Try-On
- Community-Chat (Discord-artig, Channels, Rollen, XP, @mentions, Notifications)
- Lagersystem (3D Regal-Navigation, Lagerplatz pro Artikel)
- Buchhaltung (CSV-Export, Steuer)
- Belege/Rechnungen (Einzeln + Monatsübersicht)
- QR-Codes für Listings
- Mobile Post Helper (ohne Extension)
- Landing Page mit 3D Animationen + Mockup

---

## CODING-REGELN — NIEMALS BRECHEN

1. **Kein TypeScript** — alles ist plain `.js`
2. **`'use client'`** — alle Pages und Components die State/Hooks nutzen
3. **Neue DB-Felder** NUR in `ensureMigrated()`, NICHT im Prisma-Schema
4. **Raw-SQL** für neue Felder — nie `prisma.listing.create/update` für Felder außerhalb Schema
5. **SQLite + PostgreSQL** — SQL immer für beide Datenbanken schreiben
6. **Auth** in jeder API-Route prüfen (`getServerSession`)
7. **JSON-Felder parsen** — `platforms`, `images`, `shipping` nach DB-Abfrage immer JSON.parse
8. **Dark Mode** immer mitdenken — CSS-Variablen nutzen, keine hardcoded Farben wie `#fff`
9. **Kein** TypeScript, keine `.tsx`, keine Interfaces, keine Type-Annotations
10. **Kein** langer Kommentar-Block — maximal eine kurze Zeile wenn wirklich nötig
11. **Tailwind** nur über CDN — keine PostCSS-Klassen die Build brauchen
12. **Extension-Erkennung** nur via DOM-Attribut (`data-listsync-ext`), nie window-Variable (CSP!)

---

## SCHNELL-REFERENZ: WO IST WAS

| Was | Datei |
|-----|-------|
| DB-Migrations / neue Felder | `lib/prisma.js` → `ensureMigrated()` |
| Stripe-Pläne & Limits | `lib/stripe.js` → `PLANS`, `getUserAccess()` |
| Kategorie-Mappings | `lib/categoryMappings.js` |
| Platform-Farben & Badges | `components/Badge.js` |
| Dark Mode Hook | `lib/theme.js` → `useDark()` |
| Auth-Config | `lib/auth.js` |
| Globale CSS-Klassen | `app/layout.js` |
| Listing-Score | `lib/score.js` |
| Chrome Extension Hauptlogik | `chrome-extension/background.js` |
| eBay Formular | `chrome-extension/content/ebay.js` |
| KA Formular | `chrome-extension/content/kleinanzeigen.js` |
| Vinted Formular | `chrome-extension/content/vinted.js` |
| Vinted Sync | `chrome-extension/content/vinted-sync.js` |
| Middleware (Auth-Schutz) | `middleware.js` |

---

Du kennst jetzt das gesamte Projekt, alle Patterns, alle Gotchas und wie der Chef arbeitet. Starte sofort mit der Aufgabe ohne lange Einleitung.
