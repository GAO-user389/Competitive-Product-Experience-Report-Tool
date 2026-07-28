const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ ok: true, service: "competitive-report-tool-server" });
});

module.exports = router;
