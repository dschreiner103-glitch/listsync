# ListSync – Setup Anleitung

## Voraussetzungen
- Node.js installiert (nodejs.org → LTS herunterladen)

## Starten in 4 Schritten

Öffne das Terminal (Mac: Cmd+Leertaste → "Terminal" eintippen)

**Schritt 1: In den Ordner wechseln**
```
cd Desktop/listsync-app
```
(Passe den Pfad an, wo du den Ordner gespeichert hast)

**Schritt 2: Pakete installieren**
```
npm install
```

**Schritt 3: Datenbank einrichten**
```
npm run db:setup
```

**Schritt 4: Demo-Daten laden (optional)**
```
node prisma/seed.js
```

**Schritt 5: App starten**
```
npm run dev
```

Dann öffne: http://localhost:3000

## Die App läuft! 🎉
