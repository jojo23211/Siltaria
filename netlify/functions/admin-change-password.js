const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");
const { isAuthed, getBody, hashPassword, getOrCreateAdmin, json } = require("./lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const store = getStore("siltaria");
  const authed = await isAuthed(event, store);
  if (!authed) return json(401, { error: "Nicht angemeldet." });

  const { currentPassword, newPassword } = getBody(event);
  const admin = await getOrCreateAdmin(store);

  if (hashPassword(currentPassword || "", admin.salt) !== admin.hash) {
    return json(401, { error: "Aktuelles Passwort ist falsch." });
  }
  if (!newPassword || newPassword.length < 6) {
    return json(400, { error: "Neues Passwort muss mind. 6 Zeichen haben." });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(newPassword, salt);
  await store.setJSON("admin", { salt, hash });

  return json(200, { ok: true });
};
