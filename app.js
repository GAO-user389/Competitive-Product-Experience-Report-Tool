// 竞品体验分析报告工作台 — 纯 localStorage 离线版
// 所有数据（含图片）均保存在浏览器本地，不依赖任何后端。

const STORAGE_KEY = "competitive-report-tool:v2";
const THEME_KEY = "competitive-report-tool:theme";

// 流程图配色（与主题保持一致的科技蓝）
const C = {
  accent: "#0071e3",
  accentSoft: "#e8f1ff",
  nodeStroke: "#d2d2d7",
  arrow: "#9aa0a6",
  text: "#1d1d1f"
};

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
    detailImages: [],
    videoUploads: [],
    interactionText:
      "1. 打开工作区\n2. 进入已有文档或数据库\n3. 选中文本或点击 AI 按钮\n4. 输入改写、总结或生成指令\n5. 预览 AI 输出\n6. 插入到当前页面\n7. 持续编辑和协作",
    flowStyle: "vertical",
    nodeShape: "rounded",
    pros: "AI 能力贴近真实文档场景；学习成本低；信息组织与生成动作衔接自然。",
    cons: "深度自动化能力有限；复杂任务依然需要用户拆解；结果质量依赖文档上下文。",
    prosFormat: "bullets",
    consFormat: "bullets",
    differencesFormat: "bullets",
    inspirationsFormat: "bullets",
    includeDifferences: true,
    includeInspirations: true,
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
    detailImages: [],
    videoUploads: [],
    interactionText:
      "进入团队空间\n选择设计文件\n查看页面结构\n评论关键区域\n切换原型模式\n播放交互路径\n交付给研发",
    flowStyle: "horizontal",
    nodeShape: "rounded",
    pros: "协作实时；设计与原型一体化；插件生态丰富；跨角色交付顺畅。",
    cons: "大型文件性能会波动；非设计角色初次进入容易迷路；高级能力分散在多个面板。",
    prosFormat: "bullets",
    consFormat: "bullets",
    differencesFormat: "bullets",
    inspirationsFormat: "bullets",
    includeDifferences: true,
    includeInspirations: true,
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
  "interactionText",
  "pros",
  "cons",
  "differences",
  "inspirations",
  "summary"
];

let state = loadState();
let activeId = state.activeId || state.reports[0]?.id;

let uiFilter = "all";
let uiSort = "name";
let uiCategory = null;

const competitorList = document.querySelector("#competitorList");
const competitorSearch = document.querySelector("#competitorSearch");
const completionFill = document.querySelector("#completionFill");
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
const detailImageUpload = document.querySelector("#detailImageUpload");
const detailImageList = document.querySelector("#detailImageList");
const evidenceMediaUpload = document.querySelector("#evidenceMediaUpload");
const flowStyle = document.querySelector("#flowStyle");
const nodeShape = document.querySelector("#nodeShape");
const chartPreviewTitle = document.querySelector("#chartPreviewTitle");
const categoryModule = document.querySelector("#categoryModule");
const statGrid = document.querySelector("#statGrid");
const analysisFormatFields = ["pros", "cons", "differences", "inspirations"];
const includeDifferences = document.querySelector("#includeDifferences");
const includeInspirations = document.querySelector("#includeInspirations");

// 文本测量（用于流程图节点内换行）
const measureCtx = document.createElement("canvas").getContext("2d");

function loadState() {
  const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("competitive-report-tool:v1");
  if (!cached) {
    return { reports: sampleReports.map(seedDates), activeId: sampleReports[0].id };
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

  return { reports: sampleReports.map(seedDates), activeId: sampleReports[0].id };
}

function seedDates(report) {
  const now = new Date().toISOString();
  return { ...report, createdAt: report.createdAt || now, updatedAt: report.updatedAt || now };
}

function normalizeReport(report) {
  const now = new Date().toISOString();
  return {
    ...report,
    createdAt: report.createdAt || now,
    updatedAt: report.updatedAt || now,
    apiSupport: report.apiSupport || "未知",
    evidence: Array.isArray(report.evidence) ? report.evidence : [],
    detailImages: Array.isArray(report.detailImages) ? report.detailImages : [],
    videoUploads: Array.isArray(report.videoUploads) ? report.videoUploads : [],
    flowStyle: report.flowStyle || "vertical",
    nodeShape: report.nodeShape || "rounded",
    prosFormat: report.prosFormat || "bullets",
    consFormat: report.consFormat || "bullets",
    differencesFormat: report.differencesFormat || "bullets",
    inspirationsFormat: report.inspirationsFormat || "bullets",
    includeDifferences: report.includeDifferences ?? Boolean(report.differences),
    includeInspirations: report.includeInspirations ?? Boolean(report.inspirations)
  };
}

function getActiveReport() {
  return state.reports.find((report) => report.id === activeId) || state.reports[0];
}

function persist() {
  const report = getActiveReport();
  if (report) report.updatedAt = new Date().toISOString();
  state.activeId = activeId;
  savedState.textContent = "保存中…";
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSavedStatus();
  } catch {
    // 本地配额（通常 5MB）被大图占满时触发
    savedState.textContent = "保存失败";
    showToast("本地存储空间已满，部分图片可能无法保存。请清理或缩小图片后重试。", "error");
  }
}

function setSavedStatus() {
  savedState.textContent = "已自动保存";
}

function renderCompetitors() {
  const keyword = competitorSearch.value.trim().toLowerCase();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const list = state.reports.filter((report) => {
    if (uiFilter === "evidence" && (report.evidence || []).length === 0) return false;
    if (uiFilter === "recent" && new Date(report.updatedAt).getTime() < weekAgo) return false;
    if (uiCategory && (report.category || "未分类") !== uiCategory) return false;
    if (keyword) {
      const haystack = `${report.productName} ${report.category} ${report.audience}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (uiSort === "name") return (a.productName || "").localeCompare(b.productName || "", "zh");
    if (uiSort === "updated") return new Date(b.updatedAt) - new Date(a.updatedAt);
    if (uiSort === "category") return (a.category || "未分类").localeCompare(b.category || "未分类", "zh");
    return 0;
  });

  // 当前选中的竞品若已被筛选条件过滤掉，自动切到可见列表的第一项，
  // 并同步刷新分析页等表单，保证文本框内容与筛选状态一致。
  if (list.length && !list.some((report) => report.id === activeId)) {
    activeId = list[0].id;
    syncActiveReportViews();
  }

  competitorList.innerHTML = "";
  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent =
      keyword || uiCategory || uiFilter !== "all" ? "没有符合条件的竞品" : "还没有竞品，点击右上角 + 新增";
    competitorList.appendChild(empty);
    renderCategoryList();
    return;
  }

  list.forEach((report) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `competitor-card${report.id === activeId ? " is-active" : ""}`;
    button.innerHTML = `
      <span class="cc-main">
        <strong>${highlight(report.productName || "未命名竞品", keyword)}</strong>
        <span>${highlight(report.category || "未填写赛道", keyword)}</span>
      </span>
      <span class="cc-del" title="删除竞品" aria-label="删除竞品">×</span>`;
    button.addEventListener("click", (event) => {
      if (event.target.closest(".cc-del")) return;
      activeId = report.id;
      renderAll();
      persist();
    });
    button.querySelector(".cc-del").addEventListener("click", (event) => {
      event.stopPropagation();
      deleteCompetitor(report.id);
    });
    competitorList.appendChild(button);
  });

  renderCategoryList();
}

function renderCategoryList() {
  const counts = new Map();
  state.reports.forEach((report) => {
    const cat = report.category || "未分类";
    counts.set(cat, (counts.get(cat) || 0) + 1);
  });
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const container = document.querySelector("#categoryList");
  if (!container) return;
  container.innerHTML = "";
  container.appendChild(buildCategoryChip("全部", state.reports.length, uiCategory === null, null));
  entries.forEach(([cat, count]) => container.appendChild(buildCategoryChip(cat, count, uiCategory === cat, cat)));
  updateCategoryVisibility();
}

// 赛道模块仅在「按赛道排序」或「已选中某个赛道」时显示，不常驻
function updateCategoryVisibility() {
  if (!categoryModule) return;
  categoryModule.hidden = !(uiSort === "category" || uiCategory !== null);
}

function buildCategoryChip(label, count, active, value) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = `cat-chip${active ? " is-active" : ""}`;
  chip.innerHTML = `<span>${escapeHtml(label)}</span><span class="cat-count">${count}</span>`;
  chip.addEventListener("click", () => {
    uiCategory = active ? null : value;
    renderCategoryList();
    renderCompetitors();
  });
  return chip;
}

function bindSidebarModules() {
  document.querySelectorAll("#filterSegment .seg").forEach((btn) => {
    btn.addEventListener("click", () => {
      uiFilter = btn.dataset.filter;
      setSegmentActive("#filterSegment", btn);
      renderCompetitors();
    });
  });
  document.querySelectorAll("#sortSegment .seg").forEach((btn) => {
    btn.addEventListener("click", () => {
      uiSort = btn.dataset.sort;
      setSegmentActive("#sortSegment", btn);
      renderCompetitors();
    });
  });
}

function setSegmentActive(selector, activeBtn) {
  document.querySelectorAll(`${selector} .seg`).forEach((b) => b.classList.remove("is-active"));
  activeBtn.classList.add("is-active");
}

function renderStats() {
  if (!statGrid) return;
  const reports = state.reports;
  const total = reports.length;
  const withEvidence = reports.filter((report) => (report.evidence || []).length).length;
  const withSummary = reports.filter((report) => String(report.summary || "").trim()).length;
  const tiles = [
    ["竞品", total],
    ["含证据", withEvidence],
    ["含总结", withSummary]
  ];
  statGrid.innerHTML = tiles
    .map(([label, value]) => `<div class="stat-tile"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></div>`)
    .join("");
}

function bindSidebarExtras() {
  document.querySelector("#sideAddBtn").addEventListener("click", addCompetitor);
}

function highlight(text, keyword) {
  const safe = escapeHtml(text || "");
  if (!keyword) return safe;
  const idx = safe.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return safe;
  return `${safe.slice(0, idx)}<mark>${safe.slice(idx, idx + keyword.length)}</mark>${safe.slice(idx + keyword.length)}`;
}

function deleteCompetitor(id) {
  const target = state.reports.find((report) => report.id === id);
  if (!window.confirm(`确定删除「${target?.productName || "该竞品"}」？此操作不可撤销。`)) return;
  state.reports = state.reports.filter((report) => report.id !== id);

  // 删除最后一个竞品时，自动创建一个空白竞品作为入口，避免列表空掉
  if (!state.reports.length) {
    const now = new Date().toISOString();
    state.reports.unshift({
      id: createId(),
      productName: "新竞品",
      category: "",
      website: "",
      audience: "",
      apiSupport: "未知",
      details: "",
      detailImages: [],
      videoUploads: [],
      interactionText: "",
      flowStyle: "vertical",
      nodeShape: "rounded",
      pros: "",
      cons: "",
      prosFormat: "bullets",
      consFormat: "bullets",
      differencesFormat: "bullets",
      inspirationsFormat: "bullets",
      includeDifferences: false,
      includeInspirations: false,
      differences: "",
      inspirations: "",
      summary: "",
      evidence: [],
      createdAt: now,
      updatedAt: now
    });
  }
  activeId = state.reports[0].id;
  renderAll();
  persist();
  showToast(state.reports.length <= 1 ? "已删除，已自动创建新竞品" : "已删除竞品", "info");
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
      renderAnalysisPreviews();
      if (fieldName === "interactionText") {
        renderFlow();
      }
      persist();
    });
  });

  analysisFormatFields.forEach((fieldName) => {
    const select = document.querySelector(`#${fieldName}Format`);
    select.addEventListener("change", () => {
      const report = getActiveReport();
      report[`${fieldName}Format`] = select.value;
      renderPreview();
      renderAnalysisPreviews();
      persist();
    });
  });

  [
    ["includeDifferences", "differences"],
    ["includeInspirations", "inspirations"]
  ].forEach(([toggleId, fieldName]) => {
    const toggle = document.querySelector(`#${toggleId}`);
    const textarea = document.querySelector(`#${fieldName}`);
    toggle.addEventListener("change", () => {
      const report = getActiveReport();
      report[toggleId] = toggle.checked;
      textarea.disabled = !toggle.checked;
      renderMeta();
      renderPreview();
      renderAnalysisPreviews();
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
  analysisFormatFields.forEach((fieldName) => {
    const select = document.querySelector(`#${fieldName}Format`);
    if (select) select.value = report[`${fieldName}Format`] || "bullets";
  });
  includeDifferences.checked = Boolean(report.includeDifferences);
  includeInspirations.checked = Boolean(report.includeInspirations);
  document.querySelector("#differences").disabled = !includeDifferences.checked;
  document.querySelector("#inspirations").disabled = !includeInspirations.checked;
  flowStyle.value = report.flowStyle || "vertical";
  nodeShape.value = report.nodeShape || "rounded";
  resetEvidenceDraft();
  renderAnalysisPreviews();
}

// 切换竞品时必须清空证据表单的草稿状态，否则 A 竞品的输入会串到 B 竞品上。
function resetEvidenceDraft() {
  document.querySelector("#evidenceTitle").value = "";
  document.querySelector("#evidenceUrl").value = "";
  document.querySelector("#evidenceNotes").value = "";
  document.querySelector("#evidenceType").value = "官网信息";
  document.querySelector("#evidenceMediaUpload").value = "";
}

function renderAnalysisPreviews() {
  analysisFormatFields.forEach((fieldName) => {
    const textarea = document.querySelector(`#${fieldName}`);
    const select = document.querySelector(`#${fieldName}Format`);
    const preview = document.querySelector(`#${fieldName}Preview`);
    if (!textarea || !preview) return;
    if (textarea.disabled) {
      preview.textContent = "";
      preview.hidden = true;
      return;
    }
    const format = select ? select.value : "bullets";
    const formatted = formatAnalysisText(textarea.value, format);
    if (!formatted) {
      preview.textContent = "";
      preview.hidden = true;
      return;
    }
    preview.textContent = formatted;
    preview.hidden = false;
  });
}

function renderMeta() {
  const report = getActiveReport();
  const requiredFields = fields.filter((name) => !["differences", "inspirations", "summary"].includes(name));
  const filled = requiredFields.filter((name) => String(report[name] || "").trim()).length;
  const evidenceReady = (report.evidence || []).length > 0 ? 1 : 0;
  const completion = Math.round(((filled + evidenceReady) / (requiredFields.length + 1)) * 100);
  completionFill.style.width = `${completion}%`;
  completionText.textContent = `${completion}%`;
  document.title = `${report.productName || "竞品"} · 竞品体验分析报告`;
}

function parseSteps(text) {
  if (!text) return [];
  // 先按换行 / 箭头拆成大段，再对每一段检查是否包含多个编号步骤，进一步拆分
  return text
    .split(/\n|→|->|=>/g)
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) return [];
      // 单行内有多个 "1. xxx 2. yyy" 或 "① ② ③" 这类编号时，进一步拆
      // 核心：在"编号+符号"之前的位置切分（用 lookahead）
      if (/[①-⑳]|\d+[\.)．、\]】]/.test(trimmed)) {
        return trimmed
          .split(/(?=[①-⑳])|(?=\d+[\.)．、\]】])/u)
          .map((s) => s.replace(/^\s*[①-⑳]\s*|\s*\d+[\.)．、\]】]\s*/u, "").trim())
          .filter(Boolean);
      }
      return [trimmed];
    })
    .map((step) => step.replace(/^\s*(第?[一二三四五六七八九十\d]+[步、.)．:：-]?|\d+\s*[.)．、-]|[①-⑳])\s*/u, "").trim())
    .filter(Boolean);
}

function renderFlow() {
  const report = getActiveReport();
  const steps = parseSteps(report.interactionText || "");
  chartPreviewTitle.textContent = "流程图";
  flowCount.textContent = `${steps.length} 步`;

  if (!steps.length) {
    flowCanvas.innerHTML =
      '<div class="empty-state">在「详情」里填写交互步骤，或点击「自动拆分步骤」生成流程图</div>';
    return;
  }

  const style = report.flowStyle || "vertical";
  flowCanvas.innerHTML =
    style === "horizontal" ? buildHorizontalFlow(steps) : style === "grid" ? buildGridFlow(steps) : buildVerticalFlow(steps);
}

function buildSvg(width, height, content) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="产品交互流程图">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${C.arrow}"></path>
        </marker>
      </defs>
      ${content}
    </svg>
  `;
}

function buildFlowNode(step, index, x, y, width, height) {
  const escaped = escapeHtml(step);
  const shape = getActiveReport().nodeShape || "rounded";
  const stroke = index === 0 ? C.accent : C.nodeStroke;
  const body =
    shape === "diamond"
      ? `<polygon points="${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}" fill="#ffffff" stroke="${stroke}" stroke-width="${index === 0 ? 2 : 1.4}" />`
      : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${getNodeRadius(shape, height)}" fill="#ffffff" stroke="${stroke}" stroke-width="${index === 0 ? 2 : 1.4}" />`;

  return `
    <g>
      ${body}
      <circle cx="${x + 30}" cy="${y + height / 2}" r="15" fill="${index === 0 ? C.accent : C.accentSoft}" />
      <text x="${x + 30}" y="${y + height / 2 + 5}" text-anchor="middle" font-family='-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif' font-size="13" font-weight="800" fill="${index === 0 ? "#ffffff" : C.accent}">${index + 1}</text>
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
      return `<path d="M ${width / 2} ${startY + 6} L ${width / 2} ${startY + gap - 8}" stroke="${C.arrow}" stroke-width="2" marker-end="url(#arrow)" />`;
    })
    .join("");

  return buildSvg(width, height, `${arrows}${nodes}`);
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
      return `<path d="M ${x} ${top + nodeHeight / 2} L ${x + gap - 16} ${top + nodeHeight / 2}" stroke="${C.arrow}" stroke-width="2" marker-end="url(#arrow)" />`;
    })
    .join("");

  return buildSvg(width, height, `${arrows}${nodes}`);
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

  return buildSvg(width, height, nodes);
}

function autoSplitSteps() {
  const report = getActiveReport();
  const existingSteps = parseSteps(report.interactionText || "");

  // 用户已经写了步骤，不要覆盖
  if (existingSteps.length) {
    showToast("已有步骤，无需自动拆分", "info");
    return;
  }

  const sourceText = [report.details, report.pros, report.audience]
    .filter((s) => s && s.trim())
    .join("。");

  if (!sourceText.trim()) {
    showToast("请先在「详情」里填写一些内容，或手动输入步骤", "warn");
    return;
  }

  const steps = sourceText
    .split(/[。；;，,]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4)
    .slice(0, 7);

  if (!steps.length) {
    showToast("现有文本太短，无法自动拆分步骤，建议手动编写", "warn");
    return;
  }

  report.flowStyle = "vertical";
  report.interactionText = steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  document.querySelector("#interactionText").value = report.interactionText;
  flowStyle.value = report.flowStyle;
  renderFlow();
  renderPreview();
  persist();
  showToast("已自动拆分出步骤", "info");
}

function renderEvidence() {
  const report = getActiveReport();
  const evidence = report.evidence || [];
  evidenceCount.textContent = `${evidence.length} 条`;
  evidenceList.innerHTML = "";

  if (!evidence.length) {
    evidenceList.innerHTML = '<div class="empty-state compact">还没有证据，填写上方表单后点击「添加证据」</div>';
    return;
  }

  evidence.forEach((item) => {
    const mediaId = item.mediaId || item.videoId;
    const linkedMedia = mediaId ? (report.videoUploads || []).find((media) => media.id === mediaId) : null;
    const card = document.createElement("article");
    card.className = "evidence-card";
    card.innerHTML = `
      <div class="evidence-card-header">
        <span class="evidence-type">${escapeHtml(item.type)}</span>
        <button class="icon-button evidence-delete" type="button" title="删除证据" aria-label="删除证据">×</button>
      </div>
      ${linkedMedia ? renderMediaPreview(linkedMedia, "evidence-media") : ""}
      <h3>${escapeHtml(item.title || "未命名证据")}</h3>
      ${item.url ? `<p class="evidence-link">${escapeHtml(item.url)}</p>` : ""}
      <p>${escapeHtml(item.notes || "未填写观察记录")}</p>
    `;
    card.querySelector(".evidence-delete").addEventListener("click", () => {
      if (mediaId) {
        report.videoUploads = (report.videoUploads || []).filter((candidate) => candidate.id !== mediaId);
      }
      report.evidence = evidence.filter((candidate) => candidate.id !== item.id);
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
  document.querySelector("#evidenceType").value = "官网信息";
  renderEvidence();
  renderMeta();
  renderPreview();
  persist();
}

function isImageMedia(media) {
  return (media.type || media.mimeType || "").startsWith("image/");
}

function renderMediaPreview(media, className = "") {
  const source = media.dataUrl || media.url;
  const classes = className ? ` class="${className}"` : "";
  if (!source) {
    const label = isImageMedia(media) ? "本地图片（重开后需重新上传）" : "本地视频（重开后需重新上传）";
    return `<div${classes}>${label}</div>`;
  }
  if (isImageMedia(media)) {
    return `<img${classes} src="${source}" alt="${escapeHtml(media.name || "上传图片")}" />`;
  }
  return `<video${classes} src="${source}" controls muted></video>`;
}

function renderDetailImages() {
  const report = getActiveReport();
  const images = report.detailImages || [];
  detailImageList.innerHTML = "";

  if (!images.length) {
    detailImageList.innerHTML = '<div class="empty-note">还没有详情图片，点击「选择图片」上传</div>';
    return;
  }

  images.forEach((image) => {
    const item = document.createElement("article");
    item.className = "media-item";
    item.innerHTML = `
      ${renderMediaPreview(image, "media-thumbnail")}
      <div>
        <strong>${escapeHtml(image.name)}</strong>
        <span>${formatFileSize(image.size)} · 图片</span>
      </div>
      <button class="icon-button media-delete" type="button" title="删除图片" aria-label="删除图片">×</button>
    `;
    item.querySelector(".media-delete").addEventListener("click", () => {
      report.detailImages = images.filter((candidate) => candidate.id !== image.id);
      renderDetailImages();
      renderPreview();
      persist();
    });
    detailImageList.appendChild(item);
  });
}

async function handleDetailImageUpload(files) {
  const report = getActiveReport();
  report.detailImages = report.detailImages || [];
  const queue = Array.from(files);

  for (const file of queue) {
    const media = await fileToStoredMedia(file);
    report.detailImages.unshift(media);
  }
  detailImageUpload.value = "";
  renderDetailImages();
  renderPreview();
  persist();
}

async function handleEvidenceMediaUpload(files) {
  const report = getActiveReport();
  report.videoUploads = report.videoUploads || [];
  report.evidence = report.evidence || [];
  const queue = Array.from(files);

  for (const file of queue) {
    const media = await fileToStoredMedia(file);
    report.videoUploads.unshift(media);
    const isImage = isImageMedia(media);
    report.evidence.unshift({
      id: createId(),
      type: isImage ? "图片素材" : "视频素材",
      title: file.name,
      url: file.name,
      notes: isImage
        ? `上传图片证据，文件大小：${formatFileSize(file.size)}。`
        : `上传视频证据，文件大小：${formatFileSize(file.size)}。${media.dataUrl ? "" : "（视频较大，重开后需重新上传）"}`,
      mediaId: media.id
    });
  }
  evidenceMediaUpload.value = "";
  renderEvidence();
  renderMeta();
  renderPreview();
  persist();
}

async function fileToStoredMedia(file) {
  const media = {
    id: createId(),
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    addedAt: new Date().toISOString()
  };
  try {
    if (isImageMedia(media)) {
      media.dataUrl = await downscaleImage(file, 1280, 0.82);
    } else if (media.type.startsWith("video/")) {
      if (file.size <= 3 * 1024 * 1024) {
        media.dataUrl = await fileToDataUrl(file);
      } else {
        media.needsReupload = true;
      }
    }
  } catch {
    media.needsReupload = true;
  }
  return media;
}

function downscaleImage(file, maxDim, quality) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const finish = (dataUrl) => {
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    if (typeof createImageBitmap !== "function") {
      fileToDataUrl(file).then(finish);
      return;
    }
    createImageBitmap(file)
      .then((bmp) => {
        const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
        const w = Math.max(1, Math.round(bmp.width * scale));
        const h = Math.max(1, Math.round(bmp.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bmp, 0, 0, w, h);
        if (typeof bmp.close === "function") bmp.close();
        finish(canvas.toDataURL("image/jpeg", quality));
      })
      .catch(() => fileToDataUrl(file).then(finish));
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function wrapSvgText(text, x, y, maxWidth) {
  measureCtx.font = '700 14px "PingFang SC", system-ui, sans-serif';
  const chars = Array.from(text);
  const lines = [];
  let cur = "";
  for (const ch of chars) {
    if (measureCtx.measureText(cur + ch).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) lines.push(cur);

  const maxLines = 3;
  let shown = lines;
  if (lines.length > maxLines) {
    shown = lines.slice(0, maxLines);
    let last = shown[maxLines - 1];
    while (last.length && measureCtx.measureText(last + "…").width > maxWidth) {
      last = last.slice(0, -1);
    }
    shown[maxLines - 1] = last + "…";
  }

  const firstY = y - (shown.length - 1) * 9;
  return shown
    .map(
      (line, index) =>
        `<text x="${x}" y="${firstY + index * 20}" font-family='-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif' font-size="14" font-weight="700" fill="${C.text}">${escapeHtml(line)}</text>`
    )
    .join("");
}

function renderPreview() {
  const report = getActiveReport();
  const updated = report.updatedAt ? new Date(report.updatedAt) : new Date();
  document.querySelector("#previewDate").textContent = formatDate(updated);
  // 总结始终融入报告预览，保证预览是一份完整报告；编辑仍在总结页的文本框中完成
  markdownPreview.innerHTML = markdownToHtml(buildMarkdown(report, { includeSummary: true }));
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDetailImagesText(report) {
  if (!(report.detailImages || []).length) return "";
  return report.detailImages.map((image, index) => `${index + 1}. ${image.name}（${formatFileSize(image.size)}）`).join("\n");
}

function formatAnalysisText(text, format = "bullets") {
  const raw = String(text || "").replace(/\r\n?/g, "\n");
  const items = raw
    .split(/\n|；|;/)
    .map((item) =>
      item
        // 兼容粘贴进来的各种编号 / 项目符号：1. 1、1）(1) （1） 一、 1． - • · * ◦ 等
        .replace(/^\s*(?:[-•·*◦]|\(?\d+[.、)）]?|（\d+）|第[一二三四五六七八九十\d]+[步.、]?)\s*/u, "")
        .trim()
    )
    .filter(Boolean);

  if (!items.length) return "";
  if (format === "numbered") {
    return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
  }
  return items.map((item) => `- ${item}`).join("\n");
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
  const details = [report.details?.trim(), getDetailImagesText(report) ? `详情图片：\n${getDetailImagesText(report)}` : ""]
    .filter(Boolean)
    .join("\n");
  const sections = [
    ["竞品详情", details],
    ["产品交互", report.interactionText],
    ["证据记录", getEvidenceText(report)],
    ["产品优点", formatAnalysisText(report.pros, report.prosFormat)],
    ["产品缺点", formatAnalysisText(report.cons, report.consFormat)],
    ...(report.includeDifferences ? [["与我方产品的差异", formatAnalysisText(report.differences, report.differencesFormat)]] : []),
    ...(report.includeInspirations ? [["对我方产品的启发", formatAnalysisText(report.inspirations, report.inspirationsFormat)]] : []),
    ["是否支持 API 开放", report.apiSupport],
    ["总结", report.summary]
  ];
  return includeSummary ? sections : sections.filter(([title]) => title !== "总结");
}

function buildMarkdown(report, options = {}) {
  return [
    `# ${report.productName || "未命名竞品"} 体验分析报告`,
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
    `${report.productName || "未命名竞品"} 体验分析报告`,
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
  <title>${escapeHtml(report.productName || "竞品")} 体验分析报告</title>
  <style>
    body { font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; color: #1d1d1f; line-height: 1.7; padding: 32px; }
    h1 { font-size: 26px; margin: 0 0 18px; }
    h2 { font-size: 18px; margin: 24px 0 8px; border-bottom: 1px solid #d2d2d7; padding-bottom: 6px; }
    p { margin: 0 0 10px; }
    .meta { color: #6e6e73; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.productName || "未命名竞品")} 体验分析报告</h1>
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
  <title>批量竞品体验分析报告</title>
  <style>
    body { font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; color: #1d1d1f; line-height: 1.7; padding: 32px; }
    h1 { font-size: 26px; margin: 0 0 18px; }
    h2 { font-size: 18px; margin: 24px 0 8px; border-bottom: 1px solid #d2d2d7; padding-bottom: 6px; }
    p { margin: 0 0 10px; }
    .meta { color: #6e6e73; margin-bottom: 20px; }
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
  return exportScope.value === "all" ? "批量竞品体验分析报告" : `${getActiveReport().productName || "竞品"}-体验分析报告`;
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  let html = "";
  let i = 0;
  const inline = (text) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      html += `<h2>${inline(line.slice(3))}</h2>`;
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      html += `<h1>${inline(line.slice(2))}</h1>`;
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      html += `<ul>${items.join("")}</ul>`;
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      html += `<ol>${items.join("")}</ol>`;
      continue;
    }
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("# ") &&
      !lines[i].startsWith("## ") &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      para.push(escapeHtml(lines[i]));
      i++;
    }
    html += `<p>${para.join("<br>")}</p>`;
  }
  return html;
}

function renderAll() {
  renderCompetitors();
  renderForm();
  renderMeta();
  renderFlow();
  renderDetailImages();
  renderEvidence();
  renderStats();
  renderPreview();
}

// 切换当前竞品后，统一刷新依赖该竞品的所有视图（表单、分析文本框、流程图、证据、预览）
function syncActiveReportViews() {
  renderForm();
  renderMeta();
  renderFlow();
  renderDetailImages();
  renderEvidence();
  renderPreview();
}

function addCompetitor() {
  const now = new Date().toISOString();
  const report = {
    id: createId(),
    productName: "未命名竞品",
    category: "",
    website: "",
    audience: "",
    apiSupport: "未知",
    details: "",
    detailImages: [],
    videoUploads: [],
    interactionText: "",
    flowStyle: "vertical",
    nodeShape: "rounded",
    pros: "",
    cons: "",
    prosFormat: "bullets",
    consFormat: "bullets",
    differencesFormat: "bullets",
    inspirationsFormat: "bullets",
    includeDifferences: false,
    includeInspirations: false,
    differences: "",
    inspirations: "",
    summary: "",
    evidence: [],
    createdAt: now,
    updatedAt: now
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
  const now = new Date().toISOString();
  const cloneData = typeof structuredClone === "function"
    ? structuredClone(current)
    : JSON.parse(JSON.stringify(current));

  // 重新生成图片 / 视频素材 id，避免副本和原报告共享同一组 id。
  // 关键：素材 id 变化后，必须同步更新 evidence[].mediaId 的引用。
  const detailImageMap = new Map();
  const videoMap = new Map();
  const clonedDetailImages = (current.detailImages || []).map((image) => {
    const newId = createId();
    detailImageMap.set(image.id, newId);
    return { ...image, id: newId };
  });
  const clonedVideoUploads = (current.videoUploads || []).map((video) => {
    const newId = createId();
    videoMap.set(video.id, newId);
    return { ...video, id: newId };
  });
  const clonedEvidence = (cloneData.evidence || []).map((item) => ({
    ...item,
    id: createId(),
    mediaId: item.mediaId && videoMap.has(item.mediaId) ? videoMap.get(item.mediaId) : item.mediaId
  }));

  const clone = {
    ...cloneData,
    id: createId(),
    productName: `${current.productName || "竞品"} 副本`,
    detailImages: clonedDetailImages,
    videoUploads: clonedVideoUploads,
    evidence: clonedEvidence,
    createdAt: now,
    updatedAt: now
  };
  state.reports.unshift(clone);
  activeId = clone.id;
  renderAll();
  persist();
  showToast("已创建副本", "info");
}

function downloadSvg() {
  const svg = flowCanvas.querySelector("svg");
  if (!svg) {
    showToast("请先生成流程图再下载", "warn");
    return;
  }

  const source = svg.outerHTML.includes('xmlns="http://www.w3.org/2000/svg"')
    ? svg.outerHTML
    : svg.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `${getActiveReport().productName || "flow"}-流程图.svg`);
}

function downloadPng() {
  const svg = flowCanvas.querySelector("svg");
  if (!svg) {
    showToast("请先生成流程图再下载", "warn");
    return;
  }

  const xml = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Number(svg.getAttribute("width")) || svg.viewBox.baseVal.width || 760;
    canvas.height = Number(svg.getAttribute("height")) || svg.viewBox.baseVal.height || 400;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${getActiveReport().productName || "flow"}-流程图.png`);
      else showToast("PNG 生成失败，请重试", "error");
    }, "image/png");
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    showToast("流程图渲染失败，无法导出 PNG", "error");
  };
  image.src = url;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  // 某些浏览器对 display:none 的锚点点击不触发下载，放到视口外而非隐藏
  link.style.position = "fixed";
  link.style.left = "-9999px";
  link.style.top = "0";
  document.body.appendChild(link);
  // 优先用真实点击事件，个别环境回退到 dispatchEvent
  if (typeof link.click === "function") link.click();
  else link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  // 延迟清理，确保浏览器已开始下载再回收资源
  window.setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1500);
}

function formatFileSize(size = 0) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
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
  const reports = getExportReports();
  const html = reports.length > 1 ? buildCombinedHtmlReport(reports) : buildHtmlReport(reports[0]);

  // 用隐藏 iframe 打印，避免 window.open 被拦截导致的 about:blank 报错
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const removeIframe = () => window.setTimeout(() => iframe.remove(), 800);
  iframe.contentWindow.focus();
  if (typeof iframe.contentWindow.print === "function") {
    iframe.contentWindow.onafterprint = removeIframe;
    iframe.contentWindow.print();
  } else {
    showToast("当前环境不支持打印 / PDF 导出", "warn");
    removeIframe();
  }
}

function openExportDialog(scope = "current", format = "plain") {
  exportScope.value = scope;
  exportFormat.value = format;
  updateExportText();
  exportDialog.showModal();
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

function showToast(message, kind = "info") {
  let box = document.getElementById("toastBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "toastBox";
    box.className = "toast-box";
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.textContent = message;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add("is-show"));
  window.setTimeout(() => {
    el.classList.remove("is-show");
    window.setTimeout(() => el.remove(), 300);
  }, 2600);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activateTab(tab.dataset.tab);
  });
});

document.querySelector("#addCompetitorBtn").addEventListener("click", addCompetitor);
document.querySelector("#duplicateBtn").addEventListener("click", duplicateReport);
document.querySelector("#autoFlowBtn").addEventListener("click", autoSplitSteps);
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
detailImageUpload.addEventListener("change", (event) => handleDetailImageUpload(event.target.files));
evidenceMediaUpload.addEventListener("change", (event) => handleEvidenceMediaUpload(event.target.files));
competitorSearch.addEventListener("input", renderCompetitors);
exportFormat.addEventListener("change", updateExportText);
exportScope.addEventListener("change", updateExportText);
document.querySelector("#batchExportBtn").addEventListener("click", () => openExportDialog("all", "plain"));
document.querySelector("#exportBtn").addEventListener("click", () => openExportDialog("current", "plain"));
document.querySelector("#themeToggle").addEventListener("click", toggleTheme);
document.querySelector("#copyExportBtn").addEventListener("click", async () => {
  // Word(HTML) 格式的 exportText 是源码，复制给用户没意义，降级为纯文本
  let toCopy = exportText.value;
  if (exportFormat.value === "word") {
    const reports = getExportReports();
    toCopy = reports.length > 1 ? buildCombinedPlainText(reports) : buildPlainText(reports[0]);
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(toCopy);
  } else {
    // 旧浏览器回退：临时用一个隐藏 textarea 装纯文本再 execCommand
    const ta = document.createElement("textarea");
    ta.value = toCopy;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  document.querySelector("#copyExportBtn").textContent = "已复制";
  window.setTimeout(() => {
    document.querySelector("#copyExportBtn").textContent = "复制内容";
  }, 1100);
});

initTheme();
bindInputs();
bindSidebarModules();
bindSidebarExtras();

renderAll();
activateTab(new URLSearchParams(window.location.search).get("tab") || "overview");
setSavedStatus();
