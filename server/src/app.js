const express = require("express");
const path = require("path");
const fs = require("fs");
const { createCorsMiddleware } = require("./config/cors");
const { projectRoot, uploadDir } = require("./config/env");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const healthRoutes = require("./routes/health.routes");
const reportsRoutes = require("./routes/reports.routes");
const evidenceRoutes = require("./routes/evidence.routes");
const uploadsRoutes = require("./routes/uploads.routes");
const exportRoutes = require("./routes/export.routes");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();

app.use(createCorsMiddleware());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/uploads", express.static(uploadDir));
app.use("/uploads", express.static(uploadDir));
app.use(express.static(projectRoot));

app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

app.use("/api/health", healthRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/reports/:id/evidence", evidenceRoutes);
app.use("/api/reports/:id/uploads", uploadsRoutes);
app.use("/api/export", exportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
