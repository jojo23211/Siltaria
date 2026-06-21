const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data", "site-data.json");
const ADMIN_FILE = path.join(__dirname, "data", "admin.json");

// ---------- helpers ----------

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function ensureAdminFile() {
  if (!fs.existsSync(ADMIN_FILE)) {
    const salt = crypto.randomBytes(16).toString("hex");
    const defaultPassword = "siltaria-admin";
    const hash = hashPassword(defaultPassword, salt);
    writeJSON(ADMIN_FILE, { salt, hash });
    console.log("================================================");
    console.log(" Admin-Panel wurde initialisiert.");
    console.log(" Standard-Passwort: " + defaultPassword);
    console.log(" Bitte im Admin-Panel unter 'Passwort' sofort ändern!");
    console.log("================================================");
  }
}
ensureAdminFile();

// ---------- middleware ----------

app.use(express.json());
app.use(
  session({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 6 }, // 6h
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Nicht angemeldet." });
}

// ---------- public API ----------

app.get("/api/site-data", (req, res) => {
  try {
    res.json(readJSON(DATA_FILE));
  } catch (e) {
    res.status(500).json({ error: "Konnte Inhalte nicht laden." });
  }
});

// Placeholder for live server status (mcsrvstat.us).
// Prepared so the real IP can be plugged in via the admin panel ("general.statusApiUrl")
// and this route will start returning live data automatically once the server is public.
app.get("/api/status", async (req, res) => {
  let statusApiUrl = "https://api.mcsrvstat.us/3/play.siltaria.net";
  try {
    statusApiUrl = readJSON(DATA_FILE).general.statusApiUrl || statusApiUrl;
  } catch (e) {}

  try {
    const response = await fetch(statusApiUrl, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error("API antwortet nicht");
    const data = await response.json();
    return res.json({
      online: !!data.online,
      players: data.players ? data.players.online : 0,
      maxPlayers: data.players ? data.players.max : 0,
      version: data.version || null,
      source: "live",
    });
  } catch (err) {
    // Fallback / placeholder data until the real IP is reachable.
    return res.json({
      online: false,
      players: 0,
      maxPlayers: 0,
      version: null,
      source: "placeholder",
    });
  }
});

// ---------- admin auth ----------

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: "Passwort fehlt." });

  const admin = readJSON(ADMIN_FILE);
  const hash = hashPassword(password, admin.salt);

  if (hash === admin.hash) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Falsches Passwort." });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/check", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ---------- admin content management (protected) ----------

app.get("/api/admin/site-data", requireAuth, (req, res) => {
  res.json(readJSON(DATA_FILE));
});

app.put("/api/admin/site-data", requireAuth, (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ error: "Ungültige Daten." });
  }
  try {
    writeJSON(DATA_FILE, incoming);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Speichern fehlgeschlagen." });
  }
});

app.post("/api/admin/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const admin = readJSON(ADMIN_FILE);

  if (hashPassword(currentPassword || "", admin.salt) !== admin.hash) {
    return res.status(401).json({ error: "Aktuelles Passwort ist falsch." });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Neues Passwort muss mind. 6 Zeichen haben." });
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(newPassword, salt);
  writeJSON(ADMIN_FILE, { salt, hash });
  res.json({ ok: true });
});

// ---------- static files ----------

app.use(express.static(path.join(__dirname, "public")));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Siltaria-Website läuft auf Port ${PORT}`);
});
