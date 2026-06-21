const { getStore } = require("@netlify/blobs");
const defaultData = require("./lib/default-data.json");
const { json } = require("./lib/auth");

exports.handler = async () => {
  try {
    const store = getStore("siltaria");
    let data = await store.get("site-data", { type: "json" });
    if (!data) {
      data = defaultData;
      await store.setJSON("site-data", data);
    }
    return json(200, data);
  } catch (e) {
    return json(500, { error: "Konnte Inhalte nicht laden." });
  }
};
