const { getStore } = require("@netlify/blobs");
const { hashPassword, getOrCreateAdmin, getSecret, sign, json, setCookieHeader } = require("./lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const store = getStore("siltaria");
  let body;
  try {
    body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body || "{}");
  } catch (e) {
    body = {};
  }

  const password = body.password;
  if (!password) return json(400, { error: "Passwort fehlt." });

  const admin = await getOrCreateAdmin(store);
  const hash = hashPassword(password, admin.salt);

  if (hash !== admin.hash) {
    return json(401, { error: "Falsches Passwort." });
  }

  const secret = await getSecret(store);
  const maxAge = 60 * 60 * 6; // 6h
  const token = sign({ isAdmin: true, exp: Date.now() + maxAge * 1000 }, secret);

  return json(200, { ok: true }, { "Set-Cookie": setCookieHeader(token, maxAge) });
};
