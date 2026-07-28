const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = require("express").Router({ mergeParams: true });
const { asyncHandler } = require("../utils/asyncHandler");
const controller = require("../controllers/uploads.controller");
const { uploadDir } = require("../config/env");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const tempDir = path.join(uploadDir, "_tmp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const upload = multer({ dest: tempDir });

router.get("/", asyncHandler(controller.list));
router.post("/", upload.array("files", 10), asyncHandler(controller.create));
router.delete("/:fileId", asyncHandler(controller.remove));

module.exports = router;
