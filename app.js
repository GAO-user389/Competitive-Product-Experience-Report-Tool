const STORAGE_KEY = "competitive-report-tool:v2";
const API_BASE = location.protocol === "file:" ? "http://localhost:3000/api" : "/api";

function createId() {
  return `report-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const sampleReports = [
  {
    id: createId(),
    productName: "Notion AI",
    category: "AI 文档 / 协作",
    website: "https://www.notion.com/product/ai",
    audience: "知识工作者、内容团队、项目协作团队",
    apiSupport: "部分支持",
    details:
      "Notion AI 将写作、问答、总结和数据库能力嵌入到文档工作流中。核心体验不是单独的聊天窗口，而是在用户已有信息结构里补充智能能力。",
    videos: "可补充：官方产品演示、YouTube 上的 Notion AI workflow 案例。",
    videoUploads: [],
    interactionText:
      "1. 打开工作区\n2. 进入已有文档或数据库\n3. 选中文本或点击 AI 按钮\n4. 输入改写、总结或生成指令\n5. 预览 AI 输出\n6. 插入到当前页面\n7. 持续编辑和协作",
    flowStyle: "vertical",
    nodeShape: "rounded",
    pros: "AI 能力贴近真实文档场景；学习成本低；信息组织与生成动作衔接自然。",
    cons: "深度自动化能力有限；复杂任务依然需要用户拆解；结果质量依赖文档上下文。",
    differences: "我方如果偏流程化报告，可比 Notion 更聚焦“竞品体验 -> 结构化沉淀 -> 团队复用”。",
    inspirations: "把 AI 嵌入具体字段和流程节点，不让用户跳出当前任务；提供可复用报告模板。",
    summary: "Notion AI 的价值来自场景嵌入。对我方启发是减少空白输入，把 AI 输出固定到报告字段和研究流程里。",
    evidence: [
      {
        id: createId(),
        type: "官网信息",
        title: "AI 能力嵌入文档工作流",
        url: "https://www.notion.com/product/ai",
        notes: "官网展示的核心入口集中在文档、数据库和知识问答场景，可作为“场景嵌入强”的依据。"
      }
    ]
  },
  {
    id: createId(),
    productName: "Figma",
    category: "设计协作",
    website: "https://www.figma.com/",
    audience: "产品经理、设计师、研发协作团队",
    apiSupport: "支持",
    details:
      "Figma 的竞品体验重点在多人协作、设计资产管理、原型演示和开发交付。它把设计文件变成团队持续沟通的工作空间。",
    videos: "",
    videoUploads: [],
    interactionText:
      "进入团队空间\n选择设计文件\n查看页面结构\n评论关键区域\n切换原型模式\n播放交互路径\n交付给研发",
    flowStyle: "horizontal",
    nodeShape: "rounded",
    pros: "协作实时；设计与原型一体化；插件生态丰富；跨角色交付顺畅。",
    cons: "大型文件性能会波动；非设计角色初次进入容易迷路；高级能力分散在多个面板。",
    differences: "我方工具更偏研究报告生产，而不是设计生产。差异点应放在信息结构、证据沉淀和决策启发。",
    inspirations: "报告工具可以学习它的评论、版本、组件化模板和可视化路径呈现。",
    summary: "Figma 的强项是把复杂协作放在一个可视化工作台中。竞品报告工具也应该让多人围绕同一份证据和结论协作。",
    evidence: [
      {
        id: createId(),
        type: "体验记录",
        title: "原型播放与评论路径",
        url: "",
        notes: "体验中可以从设计文件切换到原型模式，再围绕具体界面节点评论，适合作为协作流程参考。"
      }
    ]
  }
];

const fields = [
  "productName",
  "category",
  "website",
  "audience",
  "apiSupport",
  "details",
  "videos",
  "interactionText",
  "pros",
  "cons",
  "differences",
  "inspirations",
  "summary"
];

let state = loadState();
let activeId = state.activeId || state.reports[0]?.id;
let backendReady = false;
let syncTimer = null;

const competitorList = document.querySelector("#competitorList");
const competitorSearch = document.querySelector("#competitorSearch");
const completionBar = document.querySelector("#completionBar");
const completionText = document.querySelector("#completionText");
const savedState = document.querySelector("#savedState");
const flowCanvas = document.querySelector("#flowCanvas");
const flowCount = document.querySelector("#flowCount");
const markdownPreview = document.querySelector("#markdownPreview");
const exportDialog = document.querySelector("#exportDialog");
const exportText = document.querySelector("#exportText");
const exportFormat = document.querySelector("#exportFormat");
const exportScope = document.querySelector("#exportScope");
const evidenceList = document.querySelector("#evidenceList");
const evidenceCount = document.querySelector("#evidenceCount");
const videoUpload = document.querySelector("#videoUpload");
const videoList = document.querySelector("#videoList");
const evidenceVideoUpload = document.querySelector("#evidenceVideoUpload");
const flowStyle = document.querySelector("#flowStyle");
const nodeShape = document.querySelector("#nodeShape");
const chartPreviewTitle = document.querySelector("#chartPreviewTitle");

function loadState() {
  const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("competitive-report-tool:v1");
  if (!cached) {
    return { reports: sampleReports, activeId: sampleReports[0].id };
  }

  try {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed.reports) && parsed.reports.length) {
      return {
        ...parsed,
        reports: parsed.reports.map(normalizeReport)
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { reports: sampleReports, activeId: sampleReports[0].id };
}

function normalizeReport(report) {
  return {
    ...report,
    apiSupport: report.apiSupport || "未知",
    evidence: Array.isArray(report.evidence) ? report.evidence : [],
    videoUploads: Array.isArray(report.videoUploads) ? report.videoUploads : [],
    flowStyle: report.flowStyle || "vertical",
    nodeShape: report.nodeShape || "rounded"
  };
}

async function bootstrapFromApi() {
  try {
    const response = await fetch(`${API_BASE}/reports`);
    if (!response.ok) return;
    const payload = await response.json();
    const reports = Array.isArray(payload.data) ? payload.data.map(normalizeReport) : [];
    if (!reports.length) return;

    const preferredId = state.activeId && reports.some((report) => report.id === state.activeId) ? state.activeId : reports[0].id;
    state = { reports, activeId: preferredId };
    activeId = preferredId;
    backendReady = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
  } catch {
    backendReady = false;
  }
}

function getActiveReport() {
  return state.reports.find((report) => report.id === activeId) || state.reports[0];
}

function persist() {
  state.activeId = activeId;
  const durableState = {
    ...state,
    reports: state.reports.map((report) => ({
      ...report,
      videoUploads: (report.videoUploads || []).map(({ previewUrl, ...video }) => video)
    }))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(durableState));
  savedState.textContent = "已保存";
  window.clearTimeout(persist.timer);
  persist.timer = window.setTimeout(() => {
    savedState.textContent = "自动保存";
  }, 900);

  if (backendReady) {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => {
      syncCurrentReportToApi().catch(() => {});
    }, 250);
  }
}

async function syncCurrentReportToApi() {
  if (!backendReady) return;
  const report = getActiveReport();
  if (!report) return;
  const response = await fetch(`${API_BASE}/reports/${encodeURIComponent(report.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report)
  });
  if (response.status === 404) {
    await fetch(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report)
    });
  }
}

function renderCompetitors() {
  const keyword = competitorSearch.value.trim().toLowerCase();
  const filtered = state.reports.filter((report) => {
    const haystack = `${report.productName} ${report.category} ${report.audience}`.toLowerCase();
    return haystack.includes(keyword);
  });

  competitorList.innerHTML = "";
  filtered.forEach((report) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `competitor-card${report.id === activeId ? " is-active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(report.productName || "未命名竞品")}</strong><span>${escapeHtml(report.category || "未填写赛道")}</span>`;
    button.addEventListener("click", () => {
      activeId = report.id;
      renderAll();
      persist();
    });
    competitorList.appendChild(button);
  });
}

function bindInputs() {
  fields.forEach((fieldName) => {
    const input = document.querySelector(`#${fieldName}`);
    input.addEventListener("input", () => {
      const report = getActiveReport();
      report[fieldName] = input.value;
      if (fieldName === "productName" || fieldName === "category" || fieldName === "audience") {
        renderCompetitors();
      }
      renderMeta();
      renderPreview();
      if (fieldName === "interactionText") {
        renderFlow();
      }
      persist();
    });
  });
}

function renderForm() {
  const report = getActiveReport();
  fields.forEach((fieldName) => {
    const input = document.querySelector(`#${fieldName}`);
    input.value = report[fieldName] || "";
  });
  flowStyle.value = report.flowStyle || "vertical";
  nodeShape.value = report.nodeShape || "rounded";
}

function renderMeta() {
  const report = getActiveReport();
  const requiredFields = fields.filter((name) => name !== "videos");
  const filled = requiredFields.filter((name) => String(report[name] || "").trim()).length;
  const evidenceReady = (report.evidence || []).length > 0 ? 1 : 0;
  const completion = Math.round(((filled + evidenceReady) / (requiredFields.length + 1)) * 100);
  completionBar.style.width = `${completion}%`;
  completionText.textContent = `${completion}%`;
  document.title = `${report.productName || "竞品"} - 竞品体验报告工具`;
}

function parseSteps(text) {
  return text
    .split(/\n|→|->|=>/g)
    .map((line) => line.replace(/^\s*(第?[一二三四五六七八九十\d]+[步、.)．:：-]?|\d+\s*[.)．、-])\s*/u, "").trim())
    .filter(Boolean);
}

function renderFlow() {
  const report = getActiveReport();
  const steps = parseSteps(report.interactionText || "");
  chartPreviewTitle.textContent = "流程图";
  flowCount.textContent = `${steps.length} 步`;

  if (!steps.length) {
    flowCanvas.innerHTML = '<div class="empty-state">输入产品交互流程后生成流程图</div>';
    return;
  }

  const style = report.flowStyle || "vertical";
  flowCanvas.innerHTML =
    style === "horizontal" ? buildHorizontalFlow(steps) : style === "grid" ? buildGridFlow(steps) : buildVerticalFlow(steps);
}

function buildSvg(width, height, content, label) {
  return `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${label}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8795a7"></path>
        </marker>
      </defs>
      ${content}
    </svg>
  `;
}

function buildFlowNode(step, index, x, y, width, height) {
  const escaped = escapeHtml(step);
  const shape = getActiveReport().nodeShape || "rounded";
  const body =
    shape === "diamond"
      ? `<polygon points="${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}" fill="#ffffff" stroke="${index === 0 ? "#147d7f" : "#d6dee8"}" stroke-width="${index === 0 ? 2 : 1.4}" />`
      : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${getNodeRadius(shape, height)}" fill="#ffffff" stroke="${index === 0 ? "#147d7f" : "#d6dee8"}" stroke-width="${index === 0 ? 2 : 1.4}" />`;

  return `
    <g>
      ${body}
      <circle cx="${x + 30}" cy="${y + height / 2}" r="15" fill="${index === 0 ? "#147d7f" : "#e1f3f2"}" />
      <text x="${x + 30}" y="${y + height / 2 + 5}" text-anchor="middle" font-size="13" font-weight="800" fill="${index === 0 ? "#ffffff" : "#0f6769"}">${index + 1}</text>
      ${wrapSvgText(escaped, x + 58, y + height / 2 - 5, width - 74)}
    </g>
  `;
}

function getNodeRadius(shape, height) {
  if (shape === "rectangle") return 2;
  if (shape === "pill") return height / 2;
  return 8;
}

function buildVerticalFlow(steps) {
  const width = 760;
  const nodeWidth = 250;
  const nodeHeight = 68;
  const gap = 38;
  const top = 26;
  const left = (width - nodeWidth) / 2;
  const height = top * 2 + steps.length * nodeHeight + (steps.length - 1) * gap;
  const nodes = steps.map((step, index) => buildFlowNode(step, index, left, top + index * (nodeHeight + gap), nodeWidth, nodeHeight)).join("");
  const arrows = steps
    .slice(0, -1)
    .map((_, index) => {
      const startY = top + index * (nodeHeight + gap) + nodeHeight;
      return `<path d="M ${width / 2} ${startY + 6} L ${width / 2} ${startY + gap - 8}" stroke="#8795a7" stroke-width="2" marker-end="url(#arrow)" />`;
    })
    .join("");

  return buildSvg(width, height, `${arrows}${nodes}`, "纵向产品交互流程图");
}

function buildHorizontalFlow(steps) {
  const nodeWidth = 210;
  const nodeHeight = 78;
  const gap = 56;
  const left = 28;
  const top = 52;
  const width = Math.max(760, left * 2 + steps.length * nodeWidth + (steps.length - 1) * gap);
  const height = 190;
  const nodes = steps.map((step, index) => buildFlowNode(step, index, left + index * (nodeWidth + gap), top, nodeWidth, nodeHeight)).join("");
  const arrows = steps
    .slice(0, -1)
    .map((_, index) => {
      const x = left + index * (nodeWidth + gap) + nodeWidth + 8;
      return `<path d="M ${x} ${top + nodeHeight / 2} L ${x + gap - 16} ${top + nodeHeight / 2}" stroke="#8795a7" stroke-width="2" marker-end="url(#arrow)" />`;
    })
    .join("");

  return buildSvg(width, height, `${arrows}${nodes}`, "横向产品交互流程图");
}

function buildGridFlow(steps) {
  const columns = 3;
  const nodeWidth = 210;
  const nodeHeight = 86;
  const gapX = 36;
  const gapY = 34;
  const left = 28;
  const top = 28;
  const rows = Math.ceil(steps.length / columns);
  const width = Math.max(760, left * 2 + columns * nodeWidth + (columns - 1) * gapX);
  const height = top * 2 + rows * nodeHeight + (rows - 1) * gapY;
  const nodes = steps
    .map((step, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      return buildFlowNode(step, index, left + column * (nodeWidth + gapX), top + row * (nodeHeight + gapY), nodeWidth, nodeHeight);
    })
    .join("");

  return buildSvg(width, height, nodes, "矩阵式产品交互流程图");
}

function aiGenerateFlow() {
  const report = getActiveReport();
  const existingSteps = parseSteps(report.interactionText || "");
  const sourceText = [report.interactionText, report.details, report.pros].filter(Boolean).join("。");
  let steps = existingSteps;

  if (!steps.length && sourceText.trim()) {
    steps = sourceText
      .split(/[。；;，,]/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 4)
      .slice(0, 7);
  }

  if (!steps.length) {
    steps = [
      `进入${report.productName || "竞品"}首页或工作台`,
      "定位核心功能入口",
      "完成关键配置或输入",
      "查看系统反馈和结果",
      "保存、导出或分享结果"
    ];
  }

  report.flowStyle = "vertical";
  report.interactionText = steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  document.querySelector("#interactionText").value = report.interactionText;
  flowStyle.value = report.flowStyle;
  renderFlow();
  renderPreview();
  persist();
}

function renderEvidence() {
  const report = getActiveReport();
  const evidence = report.evidence || [];
  evidenceCount.textContent = `${evidence.length} 条`;
  evidenceList.innerHTML = "";

  if (!evidence.length) {
    evidenceList.innerHTML = '<div class="empty-state compact">还没有证据记录</div>';
    return;
  }

  evidence.forEach((item) => {
    const linkedVideo = item.videoId ? (report.videoUploads || []).find((video) => video.id === item.videoId) : null;
    const card = document.createElement("article");
    card.className = "evidence-card";
    card.innerHTML = `
      <div class="evidence-card-header">
        <span class="evidence-type">${escapeHtml(item.type)}</span>
        <button class="icon-button evidence-delete" type="button" title="删除证据" aria-label="删除证据">×</button>
      </div>
      ${
        linkedVideo
          ? linkedVideo.previewUrl || linkedVideo.url
            ? `<video class="evidence-video" src="${resolveAssetUrl(linkedVideo.previewUrl || linkedVideo.url)}" controls muted></video>`
            : '<div class="video-placeholder evidence-video">本地视频</div>'
          : ""
      }
      <h3>${escapeHtml(item.title || "未命名证据")}</h3>
      ${item.url ? `<p class="evidence-link">${escapeHtml(item.url)}</p>` : ""}
      <p>${escapeHtml(item.notes || "未填写观察记录")}</p>
    `;
    card.querySelector(".evidence-delete").addEventListener("click", () => {
      if (item.videoId) {
        const video = (report.videoUploads || []).find((candidate) => candidate.id === item.videoId);
        if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
        report.videoUploads = (report.videoUploads || []).filter((candidate) => candidate.id !== item.videoId);
      }
      report.evidence = evidence.filter((candidate) => candidate.id !== item.id);
      renderVideos();
      renderEvidence();
      renderMeta();
      renderPreview();
      persist();
    });
    evidenceList.appendChild(card);
  });
}

function addEvidence() {
  const report = getActiveReport();
  const title = document.querySelector("#evidenceTitle").value.trim();
  const notes = document.querySelector("#evidenceNotes").value.trim();
  const url = document.querySelector("#evidenceUrl").value.trim();
  const type = document.querySelector("#evidenceType").value;

  if (!title && !notes && !url) {
    document.querySelector("#evidenceTitle").focus();
    return;
  }

  report.evidence = report.evidence || [];
  report.evidence.unshift({
    id: createId(),
    type,
    title: title || "未命名证据",
    url,
    notes
  });

  document.querySelector("#evidenceTitle").value = "";
  document.querySelector("#evidenceUrl").value = "";
  document.querySelector("#evidenceNotes").value = "";
  renderEvidence();
  renderMeta();
  renderPreview();
  persist();
}

function renderVideos() {
  const report = getActiveReport();
  const videos = report.videoUploads || [];
  videoList.innerHTML = "";

  if (!videos.length) {
    videoList.innerHTML = '<div class="empty-note">还没有上传视频</div>';
    return;
  }

  videos.forEach((video) => {
    const item = document.createElement("article");
    item.className = "video-item";
    const videoSrc = video.previewUrl || video.url;
    item.innerHTML = `
      ${videoSrc ? `<video src="${resolveAssetUrl(videoSrc)}" controls muted></video>` : '<div class="video-placeholder">本地视频</div>'}
      <div>
        <strong>${escapeHtml(video.name)}</strong>
        <span>${formatFileSize(video.size)} · ${escapeHtml(video.type || video.mimeType || "video")}</span>
      </div>
      <button class="icon-button video-delete" type="button" title="删除视频" aria-label="删除视频">×</button>
    `;
    item.querySelector(".video-delete").addEventListener("click", () => {
      if (video.previewUrl) URL.revokeObjectURL(video.previewUrl);
      report.videoUploads = videos.filter((candidate) => candidate.id !== video.id);
      renderVideos();
      renderPreview();
      persist();
    });
    videoList.appendChild(item);
  });
}

function handleVideoUpload(files) {
  const report = getActiveReport();
  report.videoUploads = report.videoUploads || [];
  const queue = Array.from(files);

  if (backendReady) {
    const formData = new FormData();
    queue.forEach((file) => formData.append("files", file));
    fetch(`${API_BASE}/reports/${encodeURIComponent(report.id)}/uploads`, {
      method: "POST",
      body: formData
    })
      .then((response) => response.json())
      .then((payload) => {
        const uploaded = Array.isArray(payload.data) ? payload.data.map((item) => ({ ...item })) : [];
        uploaded.reverse().forEach((item) => {
          report.videoUploads.unshift(item);
        });
        videoUpload.value = "";
        renderVideos();
        renderPreview();
        persist();
      })
      .catch(() => {
        queue.forEach((file) => {
          report.videoUploads.unshift({
            id: createId(),
            name: file.name,
            size: file.size,
            type: file.type || "video",
            addedAt: new Date().toISOString(),
            previewUrl: URL.createObjectURL(file)
          });
        });
        videoUpload.value = "";
        renderVideos();
        renderPreview();
        persist();
      });
    return;
  }

  queue.forEach((file) => {
    report.videoUploads.unshift({
      id: createId(),
      name: file.name,
      size: file.size,
      type: file.type || "video",
      addedAt: new Date().toISOString(),
      previewUrl: URL.createObjectURL(file)
    });
  });
  videoUpload.value = "";
  renderVideos();
  renderPreview();
  persist();
}

function handleEvidenceVideoUpload(files) {
  const report = getActiveReport();
  report.videoUploads = report.videoUploads || [];
  report.evidence = report.evidence || [];
  const queue = Array.from(files);

  const addLocalVideos = () => {
    queue.forEach((file) => {
      const video = {
        id: createId(),
        name: file.name,
        size: file.size,
        type: file.type || "video",
        addedAt: new Date().toISOString(),
        previewUrl: URL.createObjectURL(file)
      };
      report.videoUploads.unshift(video);
      report.evidence.unshift({
        id: createId(),
        type: "视频案例",
        title: file.name,
        url: file.name,
        notes: `上传视频证据，文件大小：${formatFileSize(file.size)}。`,
        videoId: video.id
      });
    });
    evidenceVideoUpload.value = "";
    renderVideos();
    renderEvidence();
    renderMeta();
    renderPreview();
    persist();
  };

  if (backendReady) {
    const formData = new FormData();
    queue.forEach((file) => formData.append("files", file));
    fetch(`${API_BASE}/reports/${encodeURIComponent(report.id)}/uploads`, {
      method: "POST",
      body: formData
    })
      .then((response) => response.json())
      .then((payload) => {
        const uploaded = Array.isArray(payload.data) ? payload.data.map((item) => ({ ...item })) : [];
        uploaded.reverse().forEach((video) => {
          report.videoUploads.unshift(video);
          report.evidence.unshift({
            id: createId(),
            type: "视频案例",
            title: video.name,
            url: video.url || video.fileName || video.name,
            notes: `上传视频证据，文件大小：${formatFileSize(video.size)}。`,
            videoId: video.id
          });
        });
        evidenceVideoUpload.value = "";
        renderVideos();
        renderEvidence();
        renderMeta();
        renderPreview();
        persist();
      })
      .catch(addLocalVideos);
    return;
  }

  addLocalVideos();
}

function wrapSvgText(text, x, y, maxWidth) {
  const charsPerLine = Math.max(8, Math.floor(maxWidth / 14));
  const chunks = [];
  let remaining = text;

  while (remaining.length > charsPerLine && chunks.length < 2) {
    chunks.push(remaining.slice(0, charsPerLine));
    remaining = remaining.slice(charsPerLine);
  }
  if (remaining) {
    chunks.push(remaining.length > charsPerLine ? `${remaining.slice(0, charsPerLine - 1)}...` : remaining);
  }

  const firstY = y - (chunks.length - 1) * 9;
  return chunks
    .map(
      (chunk, index) =>
        `<text x="${x}" y="${firstY + index * 20}" font-size="14" font-weight="700" fill="#263447">${chunk}</text>`
    )
    .join("");
}

function renderPreview() {
  const report = getActiveReport();
  const isSummaryPanelActive = document.querySelector("#summaryPanel")?.classList.contains("is-active");
  document.querySelector("#previewDate").textContent = new Date().toLocaleDateString("zh-CN");
  markdownPreview.innerHTML = markdownToHtml(buildMarkdown(report, { includeSummary: !isSummaryPanelActive }));
}

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

function getSections(report, options = {}) {
  const includeSummary = options.includeSummary !== false;
  const sections = [
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
  return includeSummary ? sections : sections.filter(([title]) => title !== "总结");
}

function buildMarkdown(report, options = {}) {
  return [
    `# ${report.productName || "未命名竞品"} 体验报告`,
    "",
    `- 行业 / 赛道：${report.category || "未填写"}`,
    `- 官网 / 产品链接：${report.website || "未填写"}`,
    `- 目标用户：${report.audience || "未填写"}`,
    "",
    ...getSections(report, options).flatMap(([title, value]) => [`## ${title}`, value?.trim() || "未填写", ""])
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

function buildCombinedMarkdown(reports) {
  return reports.map((report) => buildMarkdown(report)).join("\n\n---\n\n");
}

function buildCombinedPlainText(reports) {
  return reports.map((report) => buildPlainText(report)).join("\n\n==============================\n\n");
}

function buildCombinedHtmlReport(reports) {
  const content = reports
    .map((report, index) => {
      const body = buildHtmlReport(report)
        .replace(/^[\s\S]*<body>/, "")
        .replace(/<\/body>[\s\S]*$/, "");
      return `${index > 0 ? '<div class="page-break"></div>' : ""}${body}`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>批量竞品体验报告</title>
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
  ${content}
</body>
</html>`;
}

function getExportReports() {
  return exportScope.value === "all" ? state.reports : [getActiveReport()];
}

function getExportFilenameBase() {
  return exportScope.value === "all" ? "批量竞品体验报告" : `${getActiveReport().productName || "竞品"}-体验报告`;
}

function markdownToHtml(markdown) {
  return markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h2>${escapeHtml(line.replace("# ", ""))}</h2>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.replace("## ", ""))}</h2>`;
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");
}

function renderAll() {
  renderCompetitors();
  renderForm();
  renderMeta();
  renderFlow();
  renderVideos();
  renderEvidence();
  renderPreview();
}

function addCompetitor() {
  const report = {
    id: createId(),
    productName: `新竞品 ${state.reports.length + 1}`,
    category: "",
    website: "",
    audience: "",
    apiSupport: "未知",
    details: "",
    videos: "",
    videoUploads: [],
    interactionText: "",
    flowStyle: "vertical",
    nodeShape: "rounded",
    pros: "",
    cons: "",
    differences: "",
    inspirations: "",
    summary: "",
    evidence: []
  };
  state.reports.unshift(report);
  activeId = report.id;
  competitorSearch.value = "";
  renderAll();
  persist();
  document.querySelector("#productName").focus();
}

function duplicateReport() {
  const current = getActiveReport();
  const clone = {
    ...structuredClone(current),
    id: createId(),
    productName: `${current.productName || "竞品"} 副本`,
    videoUploads: (current.videoUploads || []).map(({ previewUrl, ...video }) => ({ ...video, id: createId() }))
  };
  state.reports.unshift(clone);
  activeId = clone.id;
  renderAll();
  persist();
}

function downloadSvg() {
  const svg = flowCanvas.querySelector("svg");
  if (!svg) return;

  const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${getActiveReport().productName || "flow"}-流程图.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadPng() {
  const svg = flowCanvas.querySelector("svg");
  if (!svg) return;

  const xml = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = svg.viewBox.baseVal.width || svg.width.baseVal.value;
    canvas.height = svg.viewBox.baseVal.height || svg.height.baseVal.value;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${getActiveReport().productName || "flow"}-流程图.png`);
    }, "image/png");
  };
  image.src = url;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatFileSize(size = 0) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function resolveAssetUrl(url) {
  if (!url || url.startsWith("blob:") || /^https?:\/\//.test(url)) return url;
  if (location.protocol === "file:" && url.startsWith("/")) {
    return `${API_BASE.replace(/\/api$/, "")}${url}`;
  }
  return url;
}

function updateExportText() {
  const reports = getExportReports();
  if (exportFormat.value === "plain") {
    exportText.value = reports.length > 1 ? buildCombinedPlainText(reports) : buildPlainText(reports[0]);
  } else if (exportFormat.value === "word") {
    exportText.value = reports.length > 1 ? buildCombinedHtmlReport(reports) : buildHtmlReport(reports[0]);
  } else {
    exportText.value = reports.length > 1 ? buildCombinedMarkdown(reports) : buildMarkdown(reports[0]);
  }
}

function downloadWord() {
  const reports = getExportReports();
  const html = reports.length > 1 ? buildCombinedHtmlReport(reports) : buildHtmlReport(reports[0]);
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  downloadBlob(blob, `${getExportFilenameBase()}.doc`);
}

function printPdf() {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const reports = getExportReports();
  printWindow.document.write(reports.length > 1 ? buildCombinedHtmlReport(reports) : buildHtmlReport(reports[0]));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function activateTab(tabName) {
  const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  const panel = document.querySelector(`#${tabName}Panel`);
  if (!tab || !panel) return;

  document.querySelectorAll(".tab").forEach((item) => item.classList.remove("is-active"));
  document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("is-active"));
  tab.classList.add("is-active");
  panel.classList.add("is-active");
  renderPreview();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activateTab(tab.dataset.tab);
  });
});

document.querySelector("#addCompetitorBtn").addEventListener("click", addCompetitor);
document.querySelector("#duplicateBtn").addEventListener("click", duplicateReport);
document.querySelector("#aiGenerateFlowBtn").addEventListener("click", aiGenerateFlow);
document.querySelector("#generateFlowBtn").addEventListener("click", renderFlow);
document.querySelector("#downloadSvgBtn").addEventListener("click", downloadSvg);
document.querySelector("#downloadPngBtn").addEventListener("click", downloadPng);
document.querySelector("#addEvidenceBtn").addEventListener("click", addEvidence);
document.querySelector("#downloadWordBtn").addEventListener("click", downloadWord);
document.querySelector("#printPdfBtn").addEventListener("click", printPdf);
flowStyle.addEventListener("change", () => {
  const report = getActiveReport();
  report.flowStyle = flowStyle.value;
  renderFlow();
  persist();
});
nodeShape.addEventListener("change", () => {
  const report = getActiveReport();
  report.nodeShape = nodeShape.value;
  renderFlow();
  persist();
});
videoUpload.addEventListener("change", (event) => handleVideoUpload(event.target.files));
evidenceVideoUpload.addEventListener("change", (event) => handleEvidenceVideoUpload(event.target.files));
competitorSearch.addEventListener("input", renderCompetitors);
exportFormat.addEventListener("change", updateExportText);
exportScope.addEventListener("change", updateExportText);
document.querySelector("#batchExportBtn").addEventListener("click", () => {
  exportScope.value = "all";
  exportFormat.value = "plain";
  updateExportText();
  exportDialog.showModal();
});
document.querySelector("#exportBtn").addEventListener("click", () => {
  exportScope.value = "current";
  exportFormat.value = "plain";
  updateExportText();
  exportDialog.showModal();
});
document.querySelector("#copyExportBtn").addEventListener("click", async () => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(exportText.value);
  } else {
    exportText.select();
    document.execCommand("copy");
  }
  document.querySelector("#copyExportBtn").textContent = "已复制";
  window.setTimeout(() => {
    document.querySelector("#copyExportBtn").textContent = "复制内容";
  }, 1100);
});

bindInputs();
renderAll();
activateTab(new URLSearchParams(window.location.search).get("tab") || "overview");
bootstrapFromApi();
