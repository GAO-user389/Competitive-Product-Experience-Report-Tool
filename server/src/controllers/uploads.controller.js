const path = require("path");
const fs = require("fs/promises");
const { createId } = require("../utils/ids");
const { uploadDir, uploadPublicPath } = require("../config/env");
const { addUpload, deleteUpload, getReport } = require("../services/reportStore.service");

async function list(req, res) {
  const report = await getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.json({ data: report.videoUploads || [] });
}

async function create(req, res) {
  const report = await getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }

  const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
  const uploaded = [];

  for (const file of files) {
    const id = createId("file");
    const ext = path.extname(file.originalname || "");
    const fileName = `${id}${ext}`;
    const targetPath = path.join(uploadDir, fileName);
    await fs.rename(file.path, targetPath);

    const record = await addUpload(req.params.id, {
      id,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      fileName,
      url: `${uploadPublicPath}/${fileName}`,
      createdAt: new Date().toISOString()
    });
    uploaded.push(record?.videoUploads?.[0]);
  }

  res.status(201).json({ data: uploaded.filter(Boolean) });
}

async function remove(req, res) {
  const result = await deleteUpload(req.params.id, req.params.fileId);
  if (!result) {
    return res.status(404).json({ error: { code: "UPLOAD_NOT_FOUND", message: "Upload not found" } });
  }

  const file = result.target;
  if (file?.fileName) {
    const filePath = path.join(uploadDir, file.fileName);
    await fs.unlink(filePath).catch(() => {});
  }

  res.status(204).end();
}

module.exports = {
  list,
  create,
  remove
};
