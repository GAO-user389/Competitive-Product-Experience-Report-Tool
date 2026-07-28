const {
  listReports,
  getReport,
  saveReport,
  updateReport,
  deleteReport,
  duplicateReport
} = require("../services/reportStore.service");

async function list(req, res) {
  const reports = await listReports();
  res.json({ data: reports });
}

async function create(req, res) {
  const report = await saveReport(req.body || {});
  res.status(201).json({ data: report });
}

async function detail(req, res) {
  const report = await getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.json({ data: report });
}

async function update(req, res) {
  const report = await updateReport(req.params.id, req.body || {});
  if (!report) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.json({ data: report });
}

async function remove(req, res) {
  const deleted = await deleteReport(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.status(204).end();
}

async function duplicate(req, res) {
  const report = await duplicateReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.status(201).json({ data: report });
}

module.exports = {
  list,
  create,
  detail,
  update,
  remove,
  duplicate
};
