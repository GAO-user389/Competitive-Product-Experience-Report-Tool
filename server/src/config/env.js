const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const serverRoot = path.resolve(__dirname, "../..");
const projectRoot = path.resolve(serverRoot, "..");
const isVercel = process.env.VERCEL === "1";
const writableRoot = isVercel
  ? path.join(process.env.TMPDIR || "/tmp", "competitive-report-tool")
  : serverRoot;
const defaultDataFile = isVercel
  ? path.resolve(writableRoot, "reports.json")
  : path.resolve(serverRoot, "src/data/reports.json");
const defaultUploadDir = isVercel
  ? path.resolve(writableRoot, "uploads")
  : path.resolve(serverRoot, "uploads");

function resolveStoragePath(value, fallback) {
  if (!value) return fallback;
  return path.isAbsolute(value) ? value : path.resolve(writableRoot, value);
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  isVercel,
  serverRoot,
  projectRoot,
  seedDataFile: path.resolve(serverRoot, "src/data/reports.json"),
  dataFile: resolveStoragePath(process.env.DATA_FILE, defaultDataFile),
  uploadDir: resolveStoragePath(process.env.UPLOAD_DIR, defaultUploadDir),
  uploadPublicPath: "/api/uploads"
};
