const {
  listEvidence,
  upsertEvidence,
  deleteEvidence
} = require("../services/reportStore.service");

async function list(req, res) {
  const evidence = await listEvidence(req.params.id);
  if (!evidence) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.json({ data: evidence });
}

async function create(req, res) {
  const report = await upsertEvidence(req.params.id, req.body || {});
  if (!report) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.status(201).json({ data: report });
}

async function update(req, res) {
  const payload = { ...(req.body || {}), id: req.params.evidenceId };
  const report = await upsertEvidence(req.params.id, payload);
  if (!report) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.json({ data: report });
}

async function remove(req, res) {
  const report = await deleteEvidence(req.params.id, req.params.evidenceId);
  if (!report) {
    return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found" } });
  }
  res.status(204).end();
}

module.exports = {
  list,
  create,
  update,
  remove
};
