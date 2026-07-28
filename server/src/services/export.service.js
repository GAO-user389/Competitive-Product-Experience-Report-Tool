const PDFDocument = require("pdfkit");
const fs = require("fs");

function getUploadedVideosText(report) {
  if (!(report.videoUploads || []).length) return "未上传";
  return report.videoUploads.map((video, index) => `${index + 1}. ${video.name}（${formatFileSize(video.size)}）`).join("\n");
}

function getEvidenceText(report, mode = "markdown") {
  if (!(report.evidence || []).length) return "未填写";
  return report.evidence
    .map((item, index) =>
      [
        `${index + 1}. 【${item.type}】${item.title || "未命名证据"}`,
        item.url ? `${mode === "markdown" ? "   - " : "  "}链接 / 文件名：${item.url}` : "",
        item.notes ? `${mode === "markdown" ? "   - " : "  "}观察记录：${item.notes}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n");
}

function getSections(report) {
  return [
    ["竞品详情", report.details],
    ["产品交互", report.interactionText],
    ["证据记录", getEvidenceText(report)],
    ["产品优点", report.pros],
    ["产品缺点", report.cons],
    ["视频案例参考", [report.videos?.trim(), getUploadedVideosText(report)].filter(Boolean).join("\n")],
    ["与我方产品的差异", report.differences],
    ["对我方产品的启发", report.inspirations],
    ["是否支持 API 开放", report.apiSupport],
    ["总结", report.summary]
  ];
}

function buildMarkdown(report) {
  return [
    `# ${report.productName || "未命名竞品"} 体验报告`,
    "",
    `- 行业 / 赛道：${report.category || "未填写"}`,
    `- 官网 / 产品链接：${report.website || "未填写"}`,
    `- 目标用户：${report.audience || "未填写"}`,
    "",
    ...getSections(report).flatMap(([title, value]) => [`## ${title}`, value?.trim() || "未填写", ""])
  ].join("\n");
}

function buildPlainText(report) {
  return [
    `${report.productName || "未命名竞品"} 体验报告`,
    "",
    `行业 / 赛道：${report.category || "未填写"}`,
    `官网 / 产品链接：${report.website || "未填写"}`,
    `目标用户：${report.audience || "未填写"}`,
    "",
    ...getSections(report).flatMap(([title, value]) => [`【${title}】`, value?.trim() || "未填写", ""])
  ].join("\n");
}

function buildHtmlReport(report) {
  const sections = getSections(report)
    .map(([title, value]) => `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(value?.trim() || "未填写").replaceAll("\n", "<br>")}</p>`)
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(report.productName || "竞品")} 体验报告</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; color: #18212f; line-height: 1.7; padding: 32px; }
    h1 { font-size: 26px; margin: 0 0 18px; }
    h2 { font-size: 18px; margin: 24px 0 8px; border-bottom: 1px solid #dce3ec; padding-bottom: 6px; }
    p { margin: 0 0 10px; }
    .meta { color: #657386; margin-bottom: 20px; }
    .page-break { break-before: page; page-break-before: always; margin-top: 40px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.productName || "未命名竞品")} 体验报告</h1>
  <div class="meta">
    行业 / 赛道：${escapeHtml(report.category || "未填写")}<br>
    官网 / 产品链接：${escapeHtml(report.website || "未填写")}<br>
    目标用户：${escapeHtml(report.audience || "未填写")}
  </div>
  ${sections}
</body>
</html>`;
}

function buildCombined(reports, builder, separator) {
  return reports.map((report) => builder(report)).join(separator);
}

function buildExportContent(reports, format) {
  if (format === "plain") {
    return buildCombined(reports, buildPlainText, "\n\n==============================\n\n");
  }
  if (format === "html" || format === "word") {
    const bodies = reports.map((report, index) => {
      const body = buildHtmlReport(report)
        .replace(/^[\s\S]*<body>/, "")
        .replace(/<\/body>[\s\S]*$/, "");
      return `${index > 0 ? '<div class="page-break"></div>' : ""}${body}`;
    });
    return buildHtmlShell("竞品体验报告", bodies.join(""));
  }
  return buildCombined(reports, buildMarkdown, "\n\n---\n\n");
}

function buildHtmlShell(title, content) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; color: #18212f; line-height: 1.7; padding: 32px; }
    h1 { font-size: 26px; margin: 0 0 18px; }
    h2 { font-size: 18px; margin: 24px 0 8px; border-bottom: 1px solid #dce3ec; padding-bottom: 6px; }
    p { margin: 0 0 10px; }
    .meta { color: #657386; margin-bottom: 20px; }
    .page-break { break-before: page; page-break-before: always; margin-top: 40px; }
  </style>
</head>
<body>${content}</body>
</html>`;
}

function streamPdf(reports, writable) {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  useReadableFont(doc);
  doc.pipe(writable);

  reports.forEach((report, reportIndex) => {
    if (reportIndex > 0) doc.addPage();
    doc.fontSize(20).text(`${report.productName || "未命名竞品"} 体验报告`, { underline: true });
    doc.moveDown();
    doc.fontSize(11).text(`行业 / 赛道：${report.category || "未填写"}`);
    doc.text(`官网 / 产品链接：${report.website || "未填写"}`);
    doc.text(`目标用户：${report.audience || "未填写"}`);
    doc.moveDown();
    getSections(report).forEach(([title, value]) => {
      doc.fontSize(14).text(title, { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(10).text(value?.trim() || "未填写");
      doc.moveDown();
    });
  });

  doc.end();
}

function useReadableFont(doc) {
  const candidates = [
    process.env.PDF_FONT_PATH,
    "C:\\Windows\\Fonts\\msyh.ttc",
    "C:\\Windows\\Fonts\\simhei.ttf",
    "C:\\Windows\\Fonts\\simsun.ttc"
  ].filter(Boolean);

  for (const fontPath of candidates) {
    try {
      if (fs.existsSync(fontPath)) {
        doc.font(fontPath);
        return;
      }
    } catch {
      // Fall back to PDFKit's default font when a system font cannot be loaded.
    }
  }
}

function getExportMeta(format, scope) {
  const baseName = scope === "all" ? "批量竞品体验报告" : "竞品体验报告";
  if (format === "plain") return { contentType: "text/plain; charset=utf-8", filename: `${baseName}.txt` };
  if (format === "html") return { contentType: "text/html; charset=utf-8", filename: `${baseName}.html` };
  if (format === "word") return { contentType: "application/msword; charset=utf-8", filename: `${baseName}.doc` };
  if (format === "pdf") return { contentType: "application/pdf", filename: `${baseName}.pdf` };
  return { contentType: "text/markdown; charset=utf-8", filename: `${baseName}.md` };
}

function formatFileSize(size = 0) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = {
  buildExportContent,
  getExportMeta,
  streamPdf
};
