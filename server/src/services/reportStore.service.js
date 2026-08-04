const fs = require("fs/promises");
const path = require("path");
const { dataFile, seedDataFile, uploadDir } = require("../config/env");
const { createId } = require("../utils/ids");

async function ensureStorage() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    let initialStore = { reports: [] };
    try {
      const seed = await fs.readFile(seedDataFile, "utf8");
      initialStore = JSON.parse(seed || "{}");
    } catch {
      initialStore = { reports: [] };
    }
    await fs.writeFile(dataFile, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStorage();
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return {
    reports: Array.isArray(parsed.reports) ? parsed.reports : []
  };
}

async function writeStore(store) {
  await ensureStorage();
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function normalizeReport(report) {
  return {
    id: report.id || createId("report"),
    productName: report.productName || "",
    category: report.category || "",
    website: report.website || "",
    audience: report.audience || "",
    apiSupport: report.apiSupport || "未知",
    details: report.details || "",
    detailImages: Array.isArray(report.detailImages) ? report.detailImages : [],
    videoUploads: Array.isArray(report.videoUploads) ? report.videoUploads : [],
    interactionText: report.interactionText || "",
    flowStyle: report.flowStyle || "vertical",
    nodeShape: report.nodeShape || "rounded",
    pros: report.pros || "",
    cons: report.cons || "",
    prosFormat: report.prosFormat || "bullets",
    consFormat: report.consFormat || "bullets",
    differencesFormat: report.differencesFormat || "bullets",
    inspirationsFormat: report.inspirationsFormat || "bullets",
    includeDifferences: report.includeDifferences ?? Boolean(report.differences),
    includeInspirations: report.includeInspirations ?? Boolean(report.inspirations),
    differences: report.differences || "",
    inspirations: report.inspirations || "",
    summary: report.summary || "",
    evidence: Array.isArray(report.evidence) ? report.evidence : []
  };
}

async function listReports() {
  const store = await readStore();
  return store.reports.map(normalizeReport);
}

async function getReport(id) {
  const reports = await listReports();
  return reports.find((report) => report.id === id) || null;
}

async function saveReport(payload) {
  const store = await readStore();
  const report = normalizeReport(payload);
  if (!report.id) {
    report.id = createId("report");
  }

  const index = store.reports.findIndex((item) => item.id === report.id);
  if (index >= 0) {
    store.reports[index] = report;
  } else {
    store.reports.unshift(report);
  }

  await writeStore(store);
  return report;
}

async function updateReport(id, patch) {
  const store = await readStore();
  const index = store.reports.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const current = normalizeReport(store.reports[index]);
  const next = normalizeReport({ ...current, ...patch, id });
  store.reports[index] = next;
  await writeStore(store);
  return next;
}

async function deleteReport(id) {
  const store = await readStore();
  const before = store.reports.length;
  store.reports = store.reports.filter((item) => item.id !== id);
  await writeStore(store);
  return store.reports.length !== before;
}

async function duplicateReport(id) {
  const report = await getReport(id);
  if (!report) return null;
  const clone = normalizeReport({
    ...report,
    id: createId("report"),
    productName: `${report.productName || "竞品"} 副本`,
    detailImages: (report.detailImages || []).map((image) => ({
      ...image,
      id: createId("file")
    })),
    videoUploads: (report.videoUploads || []).map((video) => ({
      ...video,
      id: createId("file")
    })),
    evidence: (report.evidence || []).map((item) => ({
      ...item,
      id: createId("evidence")
    }))
  });
  const store = await readStore();
  store.reports.unshift(clone);
  await writeStore(store);
  return clone;
}

async function listEvidence(reportId) {
  const report = await getReport(reportId);
  return report ? report.evidence : null;
}

async function upsertEvidence(reportId, evidenceItem) {
  const report = await getReport(reportId);
  if (!report) return null;

  const normalized = {
    id: evidenceItem.id || createId("evidence"),
    type: evidenceItem.type || "官网信息",
    title: evidenceItem.title || "未命名证据",
    url: evidenceItem.url || "",
    notes: evidenceItem.notes || "",
    videoId: evidenceItem.videoId || ""
  };

  const evidence = Array.isArray(report.evidence) ? report.evidence : [];
  const index = evidence.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    evidence[index] = normalized;
  } else {
    evidence.unshift(normalized);
  }

  return updateReport(reportId, { evidence });
}

async function deleteEvidence(reportId, evidenceId) {
  const report = await getReport(reportId);
  if (!report) return null;
  const exists = (report.evidence || []).some((item) => item.id === evidenceId);
  if (!exists) return null;
  const evidence = (report.evidence || []).filter((item) => item.id !== evidenceId);
  return updateReport(reportId, { evidence });
}

async function addUpload(reportId, fileMeta) {
  const report = await getReport(reportId);
  if (!report) return null;

  const upload = {
    id: fileMeta.id || createId("file"),
    name: fileMeta.name,
    size: fileMeta.size,
    mimeType: fileMeta.mimeType || "",
    fileName: fileMeta.fileName,
    url: fileMeta.url || "",
    createdAt: fileMeta.createdAt || new Date().toISOString()
  };

  const videoUploads = Array.isArray(report.videoUploads) ? report.videoUploads : [];
  videoUploads.unshift(upload);
  return updateReport(reportId, { videoUploads });
}

async function deleteUpload(reportId, fileId) {
  const report = await getReport(reportId);
  if (!report) return null;
  const target = (report.videoUploads || []).find((item) => item.id === fileId);
  if (!target) return null;
  const videoUploads = (report.videoUploads || []).filter((item) => item.id !== fileId);
  const evidence = (report.evidence || []).filter((item) => item.videoId !== fileId && item.mediaId !== fileId);
  const next = await updateReport(reportId, { videoUploads, evidence });
  return { next, target };
}

module.exports = {
  ensureStorage,
  listReports,
  getReport,
  saveReport,
  updateReport,
  deleteReport,
  duplicateReport,
  listEvidence,
  upsertEvidence,
  deleteEvidence,
  addUpload,
  deleteUpload
};
