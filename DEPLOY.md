# 🚀 ListSync öffentlich deployen

Folge diesen Schritten um ListSync live ins Internet zu bringen.
Benötigte Zeit: ca. 15–20 Minuten. Alles kostenlos, keine Kreditkarte nötig.

---

## Schritt 1 – Lokale DB aktualisieren

Im Terminal im Projektordner ausführen:

```bash
npm install
npx prisma db push
```

Das fügt die neuen Felder (shipSize etc.) zur lokalen Datenbank hinzu.

---

## Schritt 2 – Datenbank einrichten (Neon – kostenlos)

1. Gehe zu **https://neon.tech** → „Sign up" → mit Google anmelden
2. Neues Projekt erstellen → Name z.B. „listsync"
3. Klicke auf **„Connect"** → wähle **„Prisma"**
4. Kopiere die angezeigte **DATABASE_URL** (sieht so aus: `postgresql://...`)

---

## Schritt 3 – Code auf GitHub hochladen

1. Gehe zu **https://github.com/new** → neues Repo erstellen
   - Name: `listsync`
   - Privat oder öffentlich – egal
   - **KEIN** README oder .gitignore anklicken → „Create repository"

2. Im Terminal im Projektordner:

```bash
git init
git add .
git commit -m "ListSync initial"
git remote add origin https://github.com/DEIN-USERNAME/listsync.git
git push -u origin main
```

> Ersetze `DEIN-USERNAME` mit deinem GitHub-Benutzernamen.

---

## Schritt 4 – Vercel deployen

1. Gehe zu **https://vercel.com** → „Sign up with GitHub"
2. „Add New Project" → dein `listsync` Repo auswählen → „Import"
3. **Build Command** ändern auf:
   ```
   cp prisma/schema.production.prisma prisma/schema.prisma && npx prisma generate && npx prisma db push && next build
   ```
4. Unter **Environment Variables** folgende Variablen eintragen:

   | Name | Wert |
   |------|------|
   | `DATABASE_URL` | `postgresql://...` (von Neon, Schritt 2) |
   | `BLOB_READ_WRITE_TOKEN` | *(kommt in Schritt 5)* |

5. Noch **nicht** auf Deploy klicken.

---

## Schritt 5 – Bilder-Speicher einrichten (Vercel Blob)

1. In Vercel: Gehe zu deinem Projekt → **„Storage"** Tab
2. „Connect Store" → **„Blob"** auswählen → Store erstellen
3. Der `BLOB_READ_WRITE_TOKEN` wird **automatisch** zu deinen Environment Variables hinzugefügt

---

## Schritt 6 – Deployen!

1. In Vercel: Gehe zu **„Deployments"** → **„Redeploy"** (oder ersten Deploy starten)
2. Warte ca. 2 Minuten
3. Deine App ist unter `https://listsync-xyz.vercel.app` erreichbar! 🎉

---

## ⚙️ Chrome Extension für die Live-URL anpassen

Öffne `chrome-extension/background.js` und ändere:
```js
// ALT:
const data = await fetchImageAsBase64(`http://localhost:3000${url}`)

// NEU (deine Vercel-URL einsetzen):
const baseUrl = window?.location?.origin || 'https://listsync-xyz.vercel.app'
const data = await fetchImageAsBase64(`${baseUrl}${url}`)
```

Und in `chrome-extension/manifest.json` unter `host_permissions`:
```json
"host_permissions": [
  "https://listsync-xyz.vercel.app/*",
  ...
]
```

Nach der Änderung Extension in Chrome neu laden (chrome://extensions → Reload).

---

## 🔒 Tipp: App mit Passwort schützen

Da die App öffentlich ist, kannst du sie mit einem einfachen Passwort schützen.
In Vercel: Project Settings → **„Password Protection"** → Passwort setzen.

---

## ❓ Probleme?

- **Build schlägt fehl**: Prüfe ob DATABASE_URL richtig eingetragen ist
- **Bilder werden nicht angezeigt**: Prüfe ob BLOB_READ_WRITE_TOKEN gesetzt ist
- **DB-Fehler**: In Vercel → Functions Log schauen

