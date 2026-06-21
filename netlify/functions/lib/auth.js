const crypto = require("crypto");

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token, secret) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  try {
    const expectedSig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

const COOKIE_NAME = "siltaria_admin";

async function getOrCreateAdmin(store) {
  let admin = await store.get("admin", { type: "json" });
  if (!admin) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = hashPassword("siltaria-admin", salt);
    admin = { salt, hash };
    await store.setJSON("admin", admin);
  }
  return admin;
}

async function getSecret(store) {
  let secret = await store.get("session-secret");
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    await store.set("session-secret", secret);
  }
  return secret;
}

function readCookieToken(event) {
  const header = (event.headers && (event.headers.cookie || event.headers.Cookie)) || "";
  return parseCookies(header)[COOKIE_NAME];
}

async function isAuthed(event, store) {
  const token = readCookieToken(event);
  const secret = await getSecret(store);
  const payload = verify(token, secret);
  return !!(payload && payload.isAdmin);
}

function getBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function json(statusCode, data, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign({ "Content-Type": "application/json" }, extraHeaders || {}),
    body: JSON.stringify(data),
  };
}

function setCookieHeader(token, maxAgeSeconds) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Strict; Secure`;
}

function clearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`;
}

module.exports = {
  hashPassword,
  sign,
  verify,
  parseCookies,
  getOrCreateAdmin,
  getSecret,
  isAuthed,
  getBody,
  json,
  setCookieHeader,
  clearCookieHeader,
};
