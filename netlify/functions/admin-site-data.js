const { getStore } = require("@netlify/blobs");
const defaultData = require("./lib/default-data.json");
const { isAuthed, getBody, json } = require("./lib/auth");

exports.handler = async (event) => {
  const store = getStore("siltaria");
  const authed = await isAuthed(event, store);
  if (!authed) return json(401, { error: "Nicht angemeldet." });

  if (event.httpMethod === "GET") {
    const data = (await store.get("site-data", { type: "json" })) || defaultData;
    return json(200, data);
  }

  if (event.httpMethod === "PUT") {
    const incoming = getBody(event);
    if (!incoming || typeof incoming !== "object" || !incoming.general) {
      return json(400, { error: "Ungültige Daten." });
    }
    try {
      await store.setJSON("site-data", incoming);
      return json(200, { ok: true });
    } catch (e) {
      return json(500, { error: "Speichern fehlgeschlagen." });
    }
  }

  return json(405, { error: "Method not allowed" });
};
