const router = require("express").Router();
const { asyncHandler } = require("../utils/asyncHandler");
const controller = require("../controllers/reports.controller");

router.get("/", asyncHandler(controller.list));
router.post("/", asyncHandler(controller.create));
router.get("/:id", asyncHandler(controller.detail));
router.put("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));
router.post("/:id/duplicate", asyncHandler(controller.duplicate));

module.exports = router;
