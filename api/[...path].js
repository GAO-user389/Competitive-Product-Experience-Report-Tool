const app = require("../server/src/app");
const { ensureStorage } = require("../server/src/services/reportStore.service");

let ready;

module.exports = async function handler(req, res) {
  if (!ready) {
    ready = ensureStorage();
  }

  await ready;
  return app(req, res);
};

module.exports.default = module.exports;
