const { listReports, getReport } = require("../services/reportStore.service");
const { buildExportContent, getExportMeta, streamPdf } = require("../services/export.service");

async function exportReports(req, res, next) {
  try {
    const scope = req.body?.scope || req.query.scope || "current";
    const format = req.body?.format || req.query.format || "markdown";
    const reportId = req.body?.reportId || req.query.reportId;

    let reports = [];
    if (scope === "all") {
      reports = await listReports();
    } else {
      const report = await getReport(reportId || req.body?.id || req.query.id);
      if (!report) {
        return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
      }
      reports = [report];
    }

    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", buildAttachmentHeader(getExportMeta(format, scope).filename));
      return streamPdf(reports, res);
    }

    const content = buildExportContent(reports, format);
    const meta = getExportMeta(format, scope);
    res.setHeader("Content-Type", meta.contentType);
    res.setHeader("Content-Disposition", buildAttachmentHeader(meta.filename));
    res.send(content);
  } catch (error) {
    next(error);
  }
}

function buildAttachmentHeader(filename) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

module.exports = { exportReports };
