const app = require("./app");
const { port } = require("./config/env");
const { ensureStorage } = require("./services/reportStore.service");

async function start() {
  await ensureStorage();
  app.listen(port, () => {
    console.log(`competitive-report-tool server is running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
