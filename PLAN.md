# ListSync – Vollständiger Projektplan
_Erstellt: 24.05.2026 | Ziel: App läuft vollständig bis Ende nächste Woche_

---

## Was ist ListSync?

Crosslisting-Tool für Reseller. Ein Artikel wird einmal angelegt und automatisch auf **Vinted**, **Kleinanzeigen** und **eBay** gepostet. Dazu Umsatz-/Gewinn-Tracking, Buchhaltung und Relisting-Erinnerungen. Ziel: SaaS-Produkt für andere Reseller.

---

## Aktueller Stand (24.05.2026)

### ✅ Was funktioniert
- Listings anlegen (3-Step-Formular mit Titel, Beschreibung, Preis, Kategorie, Zustand, Bilder)
- Bild-Upload (JPG/PNG/HEIC, bis 8 Bilder, gespeichert lokal in `public/uploads/`)
- **Vinted Extension** – vollautomatisch: Titel, Beschreibung, Preis, Kategorie (hierarchisch), Zustand, Größe, Marke, Farbe, Material, Bilder (via React Fiber Injection)
- Als Verkauft markieren
- Relisten + automatische Erinnerung nach X Tagen
- Umsatzziele (Tag/Monat)
- Plattform-Konten verbinden/trennen
- Buchhaltung-Seite (Listings als Tabelle, CSV-Export)
- Belege-Seite (Rechnungen)
- App läuft live auf: https://project-dle5b.vercel.app

### ⚠️ Code vorhanden, aber nicht getestet
- **Kleinanzeigen Extension** (`chrome-extension/content/kleinanzeigen.js`) – Selektoren müssen live geprüft werden
- **eBay Extension** (`chrome-extension/content/ebay.js`) – Selektoren müssen live geprüft werden

### ❌ Fehlt noch
- Kleinanzeigen & eBay Extensions live-getestet und lauffähig
- Vercel Production mit PostgreSQL (aktuell SQLite lokal, `schema.production.prisma` existiert bereits)
- eBay: Kategorie-Auswahl automatisieren (aktuell manuelle Eingabe nötig)
- Belege: PDF-Export
- SaaS-Features: Registrierung, Onboarding für neue User

---

## Wie die Tools funktionieren sollen

### 1. Chrome Extension – Überblick

Die Extension besteht aus:
- `background.js` (Service Worker): Empfängt den Post-Befehl, lädt Bilder als Base64, öffnet Tabs
- `listsync-bridge.js`: Läuft auf der ListSync-App, leitet `window.postMessage` an die Extension weiter
- `vinted.js`, `kleinanzeigen.js`, `ebay.js`: Füllen die Formulare auf den jeweiligen Plattformen aus
- `vinted-sync.js`: Scraped Bestellhistorie auf Vinted und importiert sie in ListSync
- `vinted-import.js`: Importiert einzelne Vinted-Artikel in ListSync

### 2. Crossposten – So soll es funktionieren

```
User klickt "Crossposten" → wählt Plattformen (Vinted / KA / eBay)
  → window.postMessage({ type: 'LISTSYNC_POST', listing, platforms })
  → listsync-bridge.js leitet weiter an background.js
  → background.js lädt Bilder als Base64 (max 8)
  → speichert alles in chrome.storage.local als "pendingListing"
  → öffnet Tab für jede gewählte Plattform
  → Content Script läuft auf der Plattform und füllt das Formular aus
  → User prüft und klickt "Absenden"
```

### 3. Vinted Extension (✅ FERTIG)

Füllt automatisch aus:
- Titel (max 60 Zeichen)
- Beschreibung
- Preis
- Kategorie (hierarchisch, z.B. "Herren – Kleidung – Jacken & Mäntel" → 3 Klick-Ebenen)
- Zustand (Neu mit Etikett / Neu ohne Etikett / Sehr gut / Gut / Befriedigend)
- Größe
- Marke (Autocomplete-Suche)
- Farbe
- Material
- Bilder (via React Fiber `onUploadFilesStart` oder `onChange`)

Technik: React-bewusster `fullClick()` + `reactClick()` über Fiber-Baum. Kein `element.click()` – das reicht bei React 18 nicht.

### 4. Kleinanzeigen Extension (⚠️ Testen + Fixen)

Soll automatisch ausfüllen:
- Titel (max 70 Zeichen)
- Beschreibung (mit Marke/Zustand/Größe/Farbe als Anhang)
- Preis + "Verhandelbar" Checkbox
- Kategorie (Haupt- und Unterkategorie per Klick)
- Zustand (Dropdown oder Radio)
- Versand (DHL/Hermes Checkboxen)
- Bilder (DataTransfer oder Drop-Zone)

**Bekannte Risiken:**
- Kleinanzeigen hat mehrere URL-Varianten beim Aufgeben: `/anzeige/aufgeben` und `/p-anzeige-aufgeben-schritt2` – beide sind im Manifest
- Selektoren (`#postad-title`, `#postad-description`, `#postad-price`) könnten sich geändert haben
- Kategorie-Auswahl über JavaScript ist fragil – muss live getestet werden
- Bild-Upload: Kleinanzeigen nutzt vermutlich keinen React-Input, DataTransfer sollte reichen

**Debug-Strategie:**
1. Kleinanzeigen-Tab öffnen, DevTools → Console
2. Listing crossposten, Console-Output beobachten
3. Fehlende/falsche Selektoren anpassen

### 5. eBay Extension (⚠️ Testen + Fixen)

Soll automatisch ausfüllen:
- Titel
- Kategorie (per eBay Kategorie-ID, z.B. Damen-Kleidung = `63861`)
- Zustand (per eBay conditionId: Neu=1000, Sehr gut=2750, Gut=3000)
- Beschreibung
- Preis (Festpreis)
- Bilder

**Bekannte Probleme:**
- eBay `/sl/list` ist ein mehrstufiger Assistent → Extension muss wissen auf welchem Schritt sie ist
- Kategorie-Auswahl auf eBay ist besonders komplex (mehrstufig, Ajax-geladen)
- eBay hat starken Bot-Schutz → `execCommand` und native Events können abgeblockt werden

**Pragmatische Lösung für nächste Woche:**
- Titel, Beschreibung, Preis automatisch ausfüllen ✓
- Bilder automatisch hochladen ✓
- Kategorie: Extension öffnet eBay mit vorausgefülltem Kategorie-Parameter in der URL (falls möglich) oder zeigt einen Hinweis-Banner was der User manuell auswählen soll
- Zustand: per Select-Dropdown setzen

### 6. Dashboard

Zeigt:
- Einnahmen (Summe aller verkauften Listings)
- Gewinn (Einnahmen minus Einkaufspreise)
- Monatsziel-Fortschritt (Gauge)
- Umsatz-Chart (Linie, letzte 30 Tage)
- Platform-Breakdown (wie viel auf welcher Plattform verkauft)
- Listings die bald gerelisted werden müssen (Alert nach X Tagen)

### 7. Listings-Seite

Zeigt alle Listings mit:
- Bild, Titel, Preis, Status (aktiv/verkauft/inaktiv)
- Platform-Badges (Vinted / KA / eBay)
- Crossposten-Button (öffnet Plattform-Auswahl)
- Als Verkauft markieren
- Relisten-Button
- Löschen

### 8. Buchhaltung

Tabelle aller Listings mit:
- Titel, Plattform, Verkaufspreis, Einkaufspreis, Gewinn
- CSV-Export
- Steuerrelevante Felder (Kleinunternehmer: keine MwSt.)

### 9. Belege

- Rechnungen/Belege anlegen
- **TODO: PDF-Export** (Seite existiert, Export fehlt noch)

---

## Wochenplan – Ziel: Alles läuft bis So 31.05.2026

### Tag 1–2 (Mo 25. – Di 26.05): Chrome Extension fixen

**Kleinanzeigen debuggen:**
1. App lokal starten: `npm run dev`
2. Extension neu laden in `chrome://extensions`
3. Listing crossposten auf Kleinanzeigen
4. DevTools Console auf kleinanzeigen.de öffnen
5. Selektoren prüfen: `#postad-title`, `#postad-description`, `#postad-price`
6. Kategorie-Auswahl testen (Hauptkat → Unterkat)
7. Bilder-Upload testen
8. Fixes in `chrome-extension/content/kleinanzeigen.js`

**eBay debuggen:**
1. Listing crossposten auf eBay
2. DevTools Console auf ebay.de/sl/list öffnen
3. Prüfen welche Felder auf Schritt 1 sichtbar sind
4. Titel/Beschreibung/Preis ausfüllen ✓
5. Kategorie-Strategie entscheiden (URL-Parameter oder manuell)
6. Bilder-Upload testen
7. Fixes in `chrome-extension/content/ebay.js`

**Extension-Version auf 2.0 setzen, neue ZIP erstellen**

---

### Tag 3–4 (Mi 27. – Do 28.05): Vercel Production

**Datenbank migrieren:**
1. PostgreSQL-Instanz bei Neon.tech (kostenlos) anlegen
2. `DATABASE_URL` in Vercel Environment Variables setzen
3. `prisma/schema.production.prisma` aktivieren (existiert bereits!)
4. `npx prisma migrate deploy` auf Production ausführen
5. Testen ob alle API-Routes funktionieren

**Background.js anpassen:**
- `BASE_URL` ist bereits `https://project-dle5b.vercel.app` ✓
- CORS-Headers in API-Routes prüfen (Extension → Vercel)

**Image-Upload anpassen:**
- Aktuell: `public/uploads/` lokal → funktioniert nicht auf Vercel
- Lösung: `@vercel/blob` (bereits als Dependency drin!) aktivieren
- `app/api/upload/route.js` auf Vercel Blob umstellen

---

### Tag 5–6 (Fr 29. – Sa 30.05): Stabilisierung + SaaS-Ready

**Listing-Status verbessern:**
- Nach erfolgreichem Crossposten: Platform-Badge wird gesetzt
- Tracking: "Wann auf welcher Plattform gepostet?" (Feld `postedAt` pro Plattform)

**Relisting verbessern:**
- Automatischer Alert wenn Listing X Tage alt ist
- Relisten setzt `relistedAt` und startet Timer neu

**PDF-Export für Belege:**
- `app/belege/page.js` → Export-Button
- Einfache PDF-Generierung mit `jsPDF` oder `puppeteer`

**Onboarding für neue User:**
- Register-Seite überprüfen
- Nach Registrierung: Weiterleitung zu Settings (Ziele, Shop-Name)
- Extension-Installationsanleitung in der App

---

### Tag 7 (So 31.05): End-to-End-Test + Launch-vorbereitung

1. Alle 3 Plattformen von vorne bis hinten testen
2. Extension als ZIP für andere User bereitstellen
3. `PROJEKTSTAND.md` aktualisieren
4. Vercel Production als primäre URL verwenden
5. Bugfixes aus dem Test

---

## Technische Checkliste

### Chrome Extension
- [ ] Kleinanzeigen: Selektoren live validiert
- [ ] Kleinanzeigen: Kategorie-Auswahl funktioniert
- [ ] Kleinanzeigen: Bilder werden hochgeladen
- [ ] eBay: Titel/Preis/Beschreibung wird ausgefüllt
- [ ] eBay: Bilder werden hochgeladen
- [ ] eBay: Kategorie-Strategie implementiert
- [ ] Extension Version 2.0, neue ZIP
- [ ] Manifest: `host_permissions` deckt Production-URL ab ✓

### Backend / App
- [ ] PostgreSQL auf Neon.tech eingerichtet
- [ ] Vercel Environment Variables gesetzt
- [ ] Prisma Production-Schema migriert
- [ ] Vercel Blob für Image-Upload aktiv
- [ ] API-Routes CORS für Extension freigegeben
- [ ] Alle Seiten auf Production getestet

### Features
- [ ] Kleinanzeigen Crossposten ✓
- [ ] eBay Crossposten (mit manuellem Kategorie-Fallback) ✓
- [ ] Vinted Crossposten ✓ (bereits fertig)
- [ ] Belege PDF-Export
- [ ] Dashboard läuft auf Production
- [ ] Buchhaltung CSV-Export funktioniert auf Production

---

## Für Claude Code – Wo anfangen

```
# Schritt 1: Kleinanzeigen debuggen
cd ~/Desktop/listsync-app
npm run dev
# Extension neu laden, dann Kleinanzeigen crossposten und Console-Output prüfen
# Datei: chrome-extension/content/kleinanzeigen.js

# Schritt 2: eBay debuggen  
# Datei: chrome-extension/content/ebay.js

# Schritt 3: Vercel Blob aktivieren
# Datei: app/api/upload/route.js
# npm install @vercel/blob (bereits installiert?)

# Schritt 4: PostgreSQL Migration
# Datei: prisma/schema.production.prisma
# npx prisma migrate deploy
```

---

## Offene Fragen (gemeinsam entscheiden)

1. **eBay Kategorie**: URL-Parameter versuchen (`/sl/list?cat=63861`) oder Banner "Bitte Kategorie manuell wählen"?
2. **Bilder auf Production**: Vercel Blob (kostenlos bis 500MB) oder weiter lokal (nur für Dev)?
3. **SaaS später**: Stripe-Abo für Multi-User? Oder erstmal kostenlos mit Invite-Code?
4. **Extension verteilen**: Über Chrome Web Store (Prüfprozess ~1 Woche) oder direkt als ZIP?
