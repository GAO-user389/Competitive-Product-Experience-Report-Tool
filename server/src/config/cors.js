const cors = require("cors");
const { corsOrigin } = require("./env");

function createCorsMiddleware() {
  return cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim()),
    credentials: false
  });
}

module.exports = { createCorsMiddleware };
