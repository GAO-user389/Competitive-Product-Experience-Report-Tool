const router = require("express").Router({ mergeParams: true });
const { asyncHandler } = require("../utils/asyncHandler");
const controller = require("../controllers/evidence.controller");

router.get("/", asyncHandler(controller.list));
router.post("/", asyncHandler(controller.create));
router.put("/:evidenceId", asyncHandler(controller.update));
router.delete("/:evidenceId", asyncHandler(controller.remove));

module.exports = router;
