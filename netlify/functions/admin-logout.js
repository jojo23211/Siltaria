const { json, clearCookieHeader } = require("./lib/auth");

exports.handler = async () => {
  return json(200, { ok: true }, { "Set-Cookie": clearCookieHeader() });
};
