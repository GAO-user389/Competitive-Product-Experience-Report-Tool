const router = require("express").Router();
const { asyncHandler } = require("../utils/asyncHandler");
const { exportReports } = require("../controllers/export.controller");

router.post("/", asyncHandler(exportReports));

module.exports = router;
