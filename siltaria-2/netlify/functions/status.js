const { getStore } = require("@netlify/blobs");
const defaultData = require("./lib/default-data.json");
const { json } = require("./lib/auth");

exports.handler = async () => {
  let statusApiUrl = "https://api.mcsrvstat.us/3/play.siltaria.net";
  try {
    const store = getStore("siltaria");
    const data = (await store.get("site-data", { type: "json" })) || defaultData;
    statusApiUrl = (data.general && data.general.statusApiUrl) || statusApiUrl;
  } catch (e) {
    // fall back to default URL above
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(statusApiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error("API antwortet nicht");
    const data = await response.json();
    return json(200, {
      online: !!data.online,
      players: data.players ? data.players.online : 0,
      maxPlayers: data.players ? data.players.max : 0,
      version: data.version || null,
      source: "live",
    });
  } catch (err) {
    return json(200, {
      online: false,
      players: 0,
      maxPlayers: 0,
      version: null,
      source: "placeholder",
    });
  }
};
