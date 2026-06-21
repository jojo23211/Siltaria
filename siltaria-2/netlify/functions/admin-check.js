const { getStore } = require("@netlify/blobs");
const { isAuthed, json } = require("./lib/auth");

exports.handler = async (event) => {
  const store = getStore("siltaria");
  const ok = await isAuthed(event, store);
  return json(200, { isAdmin: ok });
};
