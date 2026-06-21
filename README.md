# Siltaria – Server-Website

Website für den Minecraft-Survival-Server **Siltaria** (Java & Bedrock), gebaut mit Node.js + Express.
Alle Inhalte (Texte, Farben, Schriften, Team, Regeln, FAQ, Datenschutz, Galerie, Discord-Link, IP …) sind über ein
passwortgeschütztes Admin-Panel unter `/admin` änderbar – ohne Code anzufassen.

## Schnellstart (lokal)

```bash
npm install
npm start
```

Die Seite läuft danach auf `http://localhost:3000`.

## Hosting auf Replit

1. Dieses Projekt als neues Repl importieren (Node.js-Template, `.replit` ist bereits enthalten).
2. Auf **Run** klicken – Replit installiert automatisch die Pakete aus `package.json` und startet `npm start`.
3. Die öffentliche URL erscheint im Webview/"Open in new tab".

## Hosting auf Netlify

Das Projekt enthält **zwei austauschbare Backends**, die auf dieselben `public/`-Dateien zugreifen:

- `server.js` → für Replit/Node-Hosting (Express, Datei-basiert)
- `netlify/functions/*` → für Netlify (Netlify Functions + **Netlify Blobs** als Speicher, keine externe Datenbank nötig)

Beim Deploy auf Netlify wird automatisch nur der Functions-Teil verwendet – `server.js` wird ignoriert.

**Deploy-Schritte:**

1. Den gesamten Ordner als neues Repository zu GitHub/GitLab pushen (oder den Ordner direkt per Drag & Drop
   im Netlify-Dashboard unter "Deploys" hochladen – `netlify.toml` wird automatisch erkannt).
2. Bei Git-Import: Build-Befehl leer lassen, Publish-Verzeichnis ist bereits in `netlify.toml` auf `public`
   gesetzt, Functions-Verzeichnis auf `netlify/functions`.
3. **Netlify Blobs** ist in neuen Netlify-Projekten standardmäßig aktiv – es ist keine zusätzliche Konfiguration
   nötig. Falls Blobs für dein Team manuell aktiviert werden muss, findest du das unter
   *Site settings → Environment variables / Blobs* im Netlify-Dashboard.
4. Fertig – die Seite ist unter deiner `*.netlify.app`-URL erreichbar, das Admin-Panel unter `/admin`.

**Wichtig:** Beim allerersten Aufruf von `/api/admin/login` bzw. `/api/site-data` legt die Funktion automatisch
den Standard-Admin-Account (`siltaria-admin`) und die Default-Inhalte in Netlify Blobs an. Danach bitte sofort
im Admin-Panel unter **„Passwort“** ändern – das neue Passwort wird dauerhaft in Netlify Blobs gespeichert und
übersteht auch künftige Deploys.

## Admin-Panel

Erreichbar unter `/admin` (z. B. `https://deine-repl-url.repl.co/admin`).

- **Standard-Passwort:** `siltaria-admin`
- ⚠️ Bitte direkt nach dem ersten Login unter dem Tab **„Passwort“** ändern!
- Das Passwort wird gehasht in `data/admin.json` gespeichert (wird beim ersten Start automatisch erzeugt).

Im Admin-Panel kannst du steuern:

| Tab | Inhalt |
|---|---|
| Allgemein | Servername, Java-/Bedrock-IP, Headline, Claim, Status-API-URL |
| Design | Hintergrund-, Akzent-, Jade- und Textfarbe, Schriftarten, Eckenradius |
| Über uns | Beschreibungstext + Beschriftung der Schicht-Grafik |
| Features | Die 6 Feature-Karten (Icon, Titel, Text) |
| Regeln | Beliebig viele nummerierte Regeln |
| Team & Bewerbung | Teammitglieder (Name = Minecraft-Name für den Avatar, Rang, Bio) + den Bewerbungs-Bereich mit Rang-Anforderungen ganz unten im Team-Abschnitt |
| Community | Discord-Titel, -Text und -Einladungslink |
| Galerie | Beschriftungen der Platzhalter-Kacheln |
| FAQ | Beliebig viele Frage/Antwort-Paare |
| Datenschutz | Titel + Text der Datenschutzerklärung (Platzhalter – bitte rechtlich prüfen lassen) |
| Passwort | Admin-Passwort ändern |

Alle Änderungen werden erst beim Klick auf **„Änderungen speichern“** in `data/site-data.json` geschrieben und
sind danach sofort auf der öffentlichen Website sichtbar.

## Echte Server-IP eintragen

1. Im Admin-Panel unter **Allgemein** die echte Java-IP und ggf. Bedrock-IP/Port eintragen.
2. Unter **Status-API URL** die mcsrvstat.us-URL für deine IP eintragen, z. B.
   `https://api.mcsrvstat.us/3/play.siltaria.net`.
3. Der Online-Status-Punkt im Hero-Bereich ruft `/api/status` alle 30 Sekunden ab – diese Route fragt automatisch
   die hinterlegte mcsrvstat.us-URL ab, sobald der Server erreichbar ist. Bis dahin zeigt sie einen neutralen
   Platzhalter-Status ("Status folgt").

## „Mit deinem Minecraft-Namen verbinden“

Ganz unten auf der Website gibt es ein Eingabefeld für den Minecraft-Namen (3–16 Zeichen, nur Buchstaben/Zahlen/_).
Es handelt sich **nicht** um ein echtes Login – es wird kein Passwort abgefragt und nichts serverseitig gespeichert.
Beim Absenden wird lediglich der Spieler-Kopf über `https://mc-heads.net/avatar/{name}/120` geladen und
"Verbunden als {name}" angezeigt. Bei ungültigen Namen erscheint eine Fehlermeldung.

## Projektstruktur

```
siltaria/
├── server.js               # Express-Server für Replit (Datei-basiert)
├── netlify.toml             # Netlify-Konfiguration + /api/* Redirects auf Functions
├── netlify/
│   └── functions/           # Netlify Functions für Netlify-Hosting (Blobs-basiert)
│       ├── lib/
│       │   ├── auth.js          # Login/Cookie-Hilfsfunktionen
│       │   └── default-data.json
│       ├── site-data.js         # GET öffentliche Inhalte
│       ├── status.js            # GET Server-Status (Platzhalter/live)
│       ├── admin-login.js
│       ├── admin-logout.js
│       ├── admin-check.js
│       ├── admin-site-data.js   # GET/PUT geschützte Inhalte
│       └── admin-change-password.js
├── data/
│   ├── site-data.json      # Inhalte für die Replit/Express-Variante
│   └── admin.json          # Gehashtes Admin-Passwort (Replit, automatisch erzeugt)
├── public/
│   ├── index.html          # Hauptseite (lädt Inhalte dynamisch via /api/site-data)
│   ├── style.css
│   ├── script.js
│   └── admin/
│       ├── index.html      # Login + Dashboard
│       ├── admin.css
│       └── admin.js
├── package.json
├── .replit
└── replit.nix
```

## Hinweis

Kein Shop, kein Bezahlsystem, keine Datenbank – alle Inhalte liegen in einer einfachen JSON-Datei, die das
Admin-Panel über eine geschützte API liest und schreibt.
