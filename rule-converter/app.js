/* ═══════════════════════════════════════
   Clash Rules Generator — JS
   ═══════════════════════════════════════ */

// ─────────────────────────────────────────
// Default YAML content — loaded from server at /head.yaml and /rules.yaml
const DEFAULT_HEAD = "";
const DEFAULT_RULES = "";

// ─────────────────────────────────────────
// Load yaml files from server (fallback to empty)
// ─────────────────────────────────────────
async function loadYamlDefaults() {
  const files = ["/rules.yaml", "/head.yaml"];
  const result = {};
  for (const f of files) {
    try {
      const r = await fetch(f);
      if (r.ok) result[f] = await r.text();
    } catch (e) { console.error("loadYamlDefaults:", f, e); }
  }
  return result;
}

// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
const state = {
  subscriptions: [],
  manualProxies: [],
  ignoreInput: false,
  isDirty: false,
  isLoading: false,
};

// 总代理节点数（手动 + 订阅）
function totalProxyCount() {
  return state.manualProxies.length + state.subscriptions.reduce((s, sub) => s + sub.proxies.length, 0);
}

// subProxyCount 保持兼容别名
function subProxyCount() {
  return totalProxyCount() - state.manualProxies.length;
}

// HTML 转义（防止 XSS）
const _HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => _HTML_ESCAPE_MAP[c]);
}

// 解析 textarea 文本为订阅数组
function parseSubLines(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const sepIdx = line.indexOf("|");
      if (sepIdx === -1) return null;
      const prefix = line.slice(0, sepIdx);
      const url = line.slice(sepIdx + 1).trim();
      if (!url || !/^https?:\/\//i.test(url)) return null;
      return { url, prefix };
    })
    .filter(Boolean);
}

// ─────────────────────────────────────────
// Panel collapse
// ─────────────────────────────────────────
function togglePanel(id) {
  document.getElementById(id).classList.toggle("collapsed");
}

// ─────────────────────────────────────────
// Tab switching
// ─────────────────────────────────────────
function switchTab(mode) {
  document.getElementById("tab-url").classList.toggle("active", mode === "url");
  document
    .getElementById("tab-manual")
    .classList.toggle("active", mode === "manual");
  document
    .getElementById("input-url")
    .classList.toggle("active", mode === "url");
  document
    .getElementById("input-manual")
    .classList.toggle("active", mode === "manual");
  saveState();
}

// ─────────────────────────────────────────
// Notification
// ─────────────────────────────────────────
let _nt = null;
function showNotif(msg, type = "ok") {
  const el = document.getElementById("notif");
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(_nt);
  _nt = setTimeout(() => {
    el.className = "";
  }, 3000);
}

// ─────────────────────────────────────────
// Save status indicator
// ─────────────────────────────────────────
function updateSaveStatus() {
  const el = document.getElementById("save-status");
  if (!el) return;
  if (state.isDirty) {
    el.textContent = "● Unsaved";
    el.className = "dirty";
  } else {
    el.textContent = "";
    el.className = "";
  }
}

// ─────────────────────────────────────────
// Button loading state
// ─────────────────────────────────────────
function setLoading(loading) {
  state.isLoading = loading;
  const btn = document.getElementById("btn-generate");
  if (btn) {
    btn.disabled = loading;
    btn.classList.toggle("btn-loading", loading);
    btn.textContent = loading ? "⏳ Fetching..." : "▶ 生成配置";
  }
  document.getElementById("btn-download").disabled = loading;
  document.getElementById("btn-copy").disabled = loading;
  document.getElementById("btn-save").disabled = loading;
}

// ─────────────────────────────────────────
// Proxy status
// ─────────────────────────────────────────
function setProxyStatus(text, type = "ok") {
  const dot = document.getElementById("proxy-dot");
  const txt = document.getElementById("proxy-status-text");
  dot.className = `status-dot ${type}`;
  txt.className = `status-text ${type}`;
  txt.textContent = text;
  document.getElementById("proxy-count-num").textContent = totalProxyCount();
}

// ─────────────────────────────────────────
// Fetch subscription
// ─────────────────────────────────────────
async function fetchAllSubscriptions() {
  if (state.isLoading) return;
  const textarea = document.getElementById("sub-urls");
  const lines = parseSubLines(textarea.value);

  if (!lines.length) {
    showNotif("Enter at least one subscription URL.", "err");
    return;
  }

  setLoading(true);
  state.subscriptions = [];
  let successCount = 0;
  let failCount = 0;
  const failedSubscriptions = []; // [{ url, error }]

  for (const { url, prefix } of lines) {
    try {
      const r = await fetch(`/proxy?${encodeURIComponent(url)}`);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const text = decodeBase64(await r.text());
      const proxies = parseProxies(text);
      state.subscriptions.push({ url, prefix, proxies, rawYaml: text });
      successCount++;
    } catch (e) {
      failCount++;
      failedSubscriptions.push({ url, error: e.message });
    }
  }

  const subCount = subProxyCount();
  const total = totalProxyCount();
  if (failCount === 0) {
    setProxyStatus(
      `Total: ${total} (manual: ${state.manualProxies.length}, subs: ${subCount})`,
      "ok",
    );
    showNotif(
      `Fetched ${successCount} subscription(s), ${total} proxies total`,
      "ok",
    );
  } else {
    setProxyStatus(
      `Total: ${total} (manual: ${state.manualProxies.length}, subs: ${subCount})`,
      "warn",
    );
    const failedDetails = failedSubscriptions
      .map((f) => `${f.url}: ${f.error}`)
      .join("; ");
    showNotif(
      `Fetched ${successCount}, failed ${failCount}: ${failedDetails}`,
      "warn",
    );
  }

  renderSubscriptionList();
  saveState();
  refreshPreview();
  state.isDirty = true;
  updateSaveStatus();
  setLoading(false);
}

function parseProxies(text) {
  const doc = jsyaml.load(text, { schema: jsyaml.DEFAULT_SCHEMA, merge: true });
  const proxies = Array.isArray(doc)
    ? doc
    : Array.isArray(doc.proxies)
      ? doc.proxies
      : [];
  if (!proxies.length) throw new Error("No proxies found.");
  return proxies;
}

function toggleRaw(i) {
  const el = document.getElementById("raw-" + i);
  if (!el) return;
  const hidden = el.style.display === "none";
  el.style.display = hidden ? "block" : "none";
  const btn = document.getElementById("raw-toggle-" + i);
  if (btn) btn.textContent = hidden ? "Hide" : "Raw";
}

function removeSubscription(index) {
  state.subscriptions.splice(index, 1);
  renderSubscriptionList();
  saveState();
  refreshPreview();
}

function renderSubscriptionList() {
  const container = document.getElementById("sub-list");
  if (!container) return;

  if (!state.subscriptions.length) {
    container.innerHTML =
      '<div class="sub-list-empty">No subscriptions added</div>';
    return;
  }

  container.innerHTML = state.subscriptions
    .map((sub, i) => {
      const safeUrl = escapeHtml(sub.url);
      const urlShort =
        safeUrl.length > 45 ? safeUrl.slice(0, 42) + "..." : safeUrl;
      const safePrefix = escapeHtml(sub.prefix);
      const rawSafe = escapeHtml(sub.rawYaml || "");
      return `
      <div class="sub-item">
        <div class="sub-item-info">
          <span class="sub-prefix">${safePrefix || '<span class="sub-no-prefix">—</span>'}</span>
          <span class="sub-count">${sub.proxies.length}</span>
          <span class="sub-url" title="${safeUrl}">${urlShort}</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="toggleRaw(${i})" id="raw-toggle-${i}">Raw</button>
        <button class="btn btn-danger btn-sm" onclick="removeSubscription(${i})">&#10005;</button>
      </div>
      <div class="sub-raw" id="raw-${i}" style="display:none">
        <pre>${rawSafe}</pre>
      </div>
    `;
    })
    .join("");
}

// ─────────────────────────────────────────
// Manual node preview
// ─────────────────────────────────────────
function renderManualNodeList() {
  const container = document.getElementById("manual-node-list");
  if (!container) return;

  if (!state.manualProxies.length) {
    container.innerHTML = '<div class="manual-node-empty">No nodes parsed yet</div>';
    return;
  }

  container.innerHTML = state.manualProxies.map((p) => {
    const name = escapeHtml(p.name || "(unnamed)");
    const type = escapeHtml(p.type || "?");
    const server = escapeHtml(p.server || "");
    return `
      <div class="manual-node-item">
        <span class="manual-node-type">${type}</span>
        <span class="manual-node-name" title="${name}">${name}</span>
        ${server ? `<span class="manual-node-server">${server}</span>` : ""}
      </div>
    `;
  }).join("");
}

// ─────────────────────────────────────────
// Manual parse
// ─────────────────────────────────────────
function parseManualInput() {
  const text = document.getElementById("manual-yaml").value.trim();
  if (!text) {
    // 空输入时不修改 manualProxies，保留现有状态
    return;
  }

  if (text.includes("- name:")) {
    try {
      const list = parseProxies(text);
      if (!list.length) {
        showNotif("No proxies found.", "err");
        return;
      }
      state.manualProxies = list;
      const subCount = subProxyCount();
      const total = totalProxyCount();
      setProxyStatus(
        `Total: ${total} (manual: ${state.manualProxies.length}, subs: ${subCount})`,
        "ok",
      );
      showNotif(
        `Manual: ${state.manualProxies.length} proxies, Total: ${total}`,
        "ok",
      );
      renderManualNodeList();
      refreshPreview();
    } catch (e) {
      console.error("parseManualInput:", e);
      showNotif(e.message, "err");
    }
  }
}

// ─────────────────────────────────────────
// Base64 decode
// ─────────────────────────────────────────
function decodeBase64(str) {
  str = str.trim();
  if (str.includes("proxies:")) return str;
  str = str.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);
  return decodeURIComponent(
    atob(str)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
}

// ─────────────────────────────────────────
// Build merged config
// ─────────────────────────────────────────
// Reserved proxy names that are always kept as-is
const LITERAL = new Set(["DIRECT", "REJECT", "Proxy", "Auto - UrlTest"]);

const GROUP_TEMPLATES = [
  {
    name: "Proxy",
    type: "select",
    proxies: ["Auto - UrlTest", "DIRECT"],
    match: "",
  },
  { name: "Domestic", type: "select", proxies: ["DIRECT", "Proxy"], match: "" },
  { name: "Others", type: "select", proxies: ["Proxy", "DIRECT"], match: "" },
  {
    name: "AdBlock",
    type: "select",
    proxies: ["REJECT", "DIRECT", "Proxy"],
    match: "",
  },
  {
    name: "HTTPDNS",
    type: "select",
    proxies: ["DIRECT", "REJECT", "Proxy"],
    match: "",
  },
  {
    name: "Global Media",
    type: "select",
    proxies: ["Proxy", "DIRECT"],
    match: "",
  },
  {
    name: "Asian Media",
    type: "select",
    proxies: ["Proxy", "DIRECT"],
    match: "",
  },
  { name: "CN Media", type: "select", proxies: ["DIRECT", "Proxy"], match: "" },
  { name: "Apple", type: "select", proxies: ["DIRECT", "Proxy"], match: "" },
  { name: "Telegram", type: "select", proxies: ["Proxy", "DIRECT"], match: "" },
  { name: "Crypto", type: "select", proxies: ["Proxy", "DIRECT"], match: "" },
  {
    name: "Microsoft",
    type: "select",
    proxies: ["DIRECT", "Proxy"],
    match: "",
  },
  { name: "AI Suite", type: "select", proxies: ["Proxy", "DIRECT"], match: "" },
  { name: "PayPal", type: "select", proxies: ["DIRECT", "Proxy"], match: "" },
  { name: "Scholar", type: "select", proxies: ["DIRECT", "Proxy"], match: "" },
  {
    name: "Speedtest",
    type: "select",
    proxies: ["Proxy", "DIRECT"],
    match: "",
  },
  { name: "Steam", type: "select", proxies: ["Proxy", "DIRECT"], match: "" },
  { name: "miHoYo", type: "select", proxies: ["DIRECT", "Proxy"], match: "" },
  {
    name: "Auto - UrlTest",
    type: "url-test",
    proxies: [],
    match: "",
    url: "https://cp.cloudflare.com/generate_204",
    interval: 3600,
  },
];

function buildProxyGroups(proxyNames) {
  if (!proxyNames.length) return [];

  const groups = GROUP_TEMPLATES.map((t) => {
    const proxies = [];
    for (const p of t.proxies) {
      if (LITERAL.has(p)) proxies.push(p);
    }
    // 空字符串 = 匹配所有节点；其他值 = 名字包含 matchKey 的节点（目前全部为空，即全部追加）
    const matched = t.match
      ? proxyNames.filter((n) => n.includes(t.match))
      : proxyNames;
    proxies.push(...matched);
    return {
      name: t.name,
      type: t.type,
      proxies,
      url: t.url,
      interval: t.interval,
    };
  });

  return groups;
}

function buildMergedConfig() {
  const headYaml = window._cmContent["editor-head"] || "";
  const rulesYaml = window._cmContent["editor-rules"] || "";

  // 合并所有订阅节点，叠加前缀
  const subProxies = state.subscriptions.flatMap((sub) =>
    sub.proxies.map((p) => ({
      ...p,
      name: (sub.prefix ? sub.prefix + " - " : "") + (p.name || ""),
    })),
  );
  const finalProxies = [...state.manualProxies, ...subProxies];
  const proxyNames = finalProxies.map((p) => p.name);
  const finalGroups = buildProxyGroups(proxyNames);

  return {
    headYaml,
    rulesYaml,
    proxies: finalProxies,
    proxyGroups: finalGroups,
  };
}

// ─────────────────────────────────────────
// Refresh preview — debounce (200ms) at caller site (makeEditor)
// ─────────────────────────────────────────
async function refreshPreview() {
  document.getElementById("proxy-count-num").textContent = totalProxyCount();

  let data;
  try {
    data = buildMergedConfig();
  } catch (e) {
    window._cmPreview.dispatch({
      changes: {
        from: 0,
        to: window._cmPreview.state.doc.length,
        insert: `# Build error: ${e.message}`,
      },
    });
    return;
  }

  try {
    const r = await fetch("/api/generate?save=false", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const res = await r.json();
    if (!r.ok) throw new Error(res.error);
    window._cmPreview.dispatch({
      changes: {
        from: 0,
        to: window._cmPreview.state.doc.length,
        insert: res.formatted,
      },
    });
  } catch (e) {
    window._cmPreview.dispatch({
      changes: {
        from: 0,
        to: window._cmPreview.state.doc.length,
        insert: `# Format error: ${e.message}`,
      },
    });
  }
}

// ─────────────────────────────────────────
// Generate Config — 先解析手动输入，再拉取订阅
// ─────────────────────────────────────────
async function generateConfig() {
  // 解析手动输入（空 textarea 无副作用，不覆盖现有 manualProxies）
  const hadManualInput = (() => {
    const text = document.getElementById("manual-yaml").value.trim();
    if (!text) return false;
    if (!text.includes("- name:")) return false;
    try {
      const list = parseProxies(text);
      if (!list.length) return false;
      state.manualProxies = list;
      return true;
    } catch (e) {
      return false;
    }
  })();

  await fetchAllSubscriptions();

  // 若有手动输入，重新更新状态以反映正确数字
  if (hadManualInput) {
    const subCount = subProxyCount();
    const total = totalProxyCount();
    setProxyStatus(
      `Total: ${total} (manual: ${state.manualProxies.length}, subs: ${subCount})`,
      "ok",
    );
    renderManualNodeList();
  }
}

// ─────────────────────────────────────────
// Download
// ─────────────────────────────────────────
function downloadConfig() {
  const yaml = window._cmPreview.state.doc.toString();
  if (!yaml || yaml.startsWith("#")) {
    showNotif("Nothing to download yet.", "err");
    return;
  }
  const blob = new Blob([yaml], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "config.yaml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  showNotif("config.yaml downloaded!", "ok");
}

// ─────────────────────────────────────────
// Copy
// ─────────────────────────────────────────
function copyConfig() {
  const yaml = window._cmPreview.state.doc.toString();
  if (!yaml || yaml.startsWith("#")) {
    showNotif("Nothing to copy yet.", "err");
    return;
  }
  navigator.clipboard
    .writeText(yaml)
    .then(() => showNotif("Copied to clipboard!", "ok"))
    .catch((e) => { console.error("Clipboard write failed:", e); showNotif("Clipboard write failed.", "err"); });
}

// ─────────────────────────────────────────
// Save to Server
// ─────────────────────────────────────────
async function saveToServer() {
  if (state.isLoading) return;
  setLoading(true);
  try {
    const reqData = buildMergedConfig();
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqData),
    });
    const res = await r.json();
    if (!r.ok) throw new Error(res.error || (await r.text()));
    state.isDirty = false;
    updateSaveStatus();
    showNotif("Saved to server!", "ok");
    if (res.subUrl) {
      _currentSubUrl = res.subUrl;
      const input = document.getElementById("sub-url-input");
      if (input) {
        input.value = res.subUrl;
        input.style.color = "var(--text)";
      }
      renderQrCode(res.subUrl);
    } else {
      fetchSubUrl();
    }
  } catch (e) {
    console.error("saveToServer:", e);
    showNotif("Save failed: " + e.message, "err");
  } finally {
    setLoading(false);
  }
}

// ─────────────────────────────────────────
// Subscription URL
// ─────────────────────────────────────────
let _currentSubUrl = "";

function renderQrCode(url) {
  const container = document.getElementById("qr-code");
  if (!container || !url) return;
  container.innerHTML = "";
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  container.innerHTML = qr.createSvgTag({ cellsize: 4, margin: 2 });
}

async function fetchSubUrl() {
  try {
    const r = await fetch("/api/info");
    if (!r.ok) return;
    const data = await r.json();
    if (data.subUrl) {
      _currentSubUrl = data.subUrl;
      const input = document.getElementById("sub-url-input");
      if (input) {
        input.value = data.subUrl;
        input.style.color = "var(--text)";
      }
      renderQrCode(data.subUrl);
    }
  } catch (e) { console.error("fetchSubUrl:", e); }
}

function copySubUrl() {
  if (!_currentSubUrl) {
    showNotif("No URL to copy yet.", "err");
    return;
  }
  navigator.clipboard
    .writeText(_currentSubUrl)
    .then(() => showNotif("URL copied!", "ok"))
    .catch((e) => { console.error("copySubUrl:", e); showNotif("Copy failed.", "err"); });
}

// ─────────────────────────────────────────
// Fullscreen editor overlay
// ─────────────────────────────────────────
function expandEditor(id, label, view) {
  const overlay = document.createElement("div");
  overlay.className = "editor-overlay";
  overlay.innerHTML = `
    <div class="fullscreen-backdrop"></div>
    <div class="fullscreen-modal">
      <div class="fullscreen-bar">
        <span class="editor-title">${label}</span>
        <button class="btn btn-secondary" id="fs-close">&#10005; Close (Esc)</button>
      </div>
      <div id="fs-editor"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const content = view.state.doc.toString();
  const fsView = new window._cmEditorClass({
    state: window._cmEditorState.create({
      doc: content,
      extensions: [
        window._cmBasicSetup,
        window._cmYaml(),
        window._cmTheme,
        window._cmEditorClass.lineWrapping,
      ],
    }),
    parent: document.getElementById("fs-editor"),
  });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    const newContent = fsView.state.doc.toString();
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newContent },
    });
    document.body.removeChild(overlay);
    refreshPreview();
  };

  document.getElementById("fs-close").addEventListener("click", close);
  const escHandler = (e) => {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

// ─────────────────────────────────────────
// Storage
// ─────────────────────────────────────────
const LS_KEY = "rcg_state";

function saveState() {
  try {
    if (state.ignoreInput) return;
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        subUrls: (document.getElementById("sub-urls") || {}).value || "",
        manualYaml: (document.getElementById("manual-yaml") || {}).value || "",
        activeTab: document
          .getElementById("tab-url")
          .classList.contains("active")
          ? "url"
          : "manual",
      }),
    );
  } catch (e) { console.error("saveState:", e); }
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);

    const subEl = document.getElementById("sub-urls");
    if (subEl && s.subUrls !== undefined) {
      try {
        state.ignoreInput = true;
        subEl.value = s.subUrls;
      } finally {
        state.ignoreInput = false;
      }
    }

    const manualEl = document.getElementById("manual-yaml");
    if (manualEl && s.manualYaml !== undefined) manualEl.value = s.manualYaml;
    if (s.activeTab) switchTab(s.activeTab);
    // 节点数据未缓存，subscriptions 保持为空，用户需重新 Fetch
  } catch (e) { console.error("loadState:", e); }
}

// ─────────────────────────────────────────
// Init editors — idempotent
// minimalSetup includes basic language support but not yaml,
// so yaml() is safe to add without risk of duplicate instances.
// ─────────────────────────────────────────
let _inited = false;

// DOM 缓存（避免重复 getElementById）
const $ = (id) => document.getElementById(id);

async function init() {
  if (_inited) return;
  _inited = true;

  // Load yaml files from server first (source of truth)
  const yamlDefaults = await loadYamlDefaults();

  const [cm, cmState, yamlLang, oneDarkMod] = await Promise.all([
    import("codemirror"),
    import("@codemirror/state"),
    import("@codemirror/lang-yaml"),
    import("@codemirror/theme-one-dark"),
  ]);
  const { EditorView, minimalSetup } = cm;
  const { EditorState } = cmState;
  const { yaml } = yamlLang;
  const { oneDark } = oneDarkMod;

  window._cmEditorClass = EditorView;
  window._cmEditorState = EditorState;
  window._cmBasicSetup = minimalSetup;
  window._cmYaml = yaml;
  window._cmTheme = oneDark;

  const makeEditor = (domId, label, content) => {
    const domEl = $(domId);
    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          minimalSetup,
          window._cmYaml(),
          window._cmTheme,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              window._cmContent[domId] = update.state.doc.toString();
              state.isDirty = true;
              updateSaveStatus();
              clearTimeout(window._cmRefreshTimer);
              window._cmRefreshTimer = setTimeout(refreshPreview, 200);
            }
          }),
        ],
      }),
      parent: domEl,
    });

    // Fullscreen button
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary";
    btn.style.cssText = "font-size:11px;padding:4px 10px;margin-top:6px;";
    btn.textContent = "⛶ Fullscreen";
    btn.addEventListener("click", () => expandEditor(domId, label, view));
    domEl.parentNode.appendChild(btn);

    window._cmContent[domId] = content;
    return view;
  };

  window._cmContent = {};
  window._cmHead = makeEditor(
    "editor-head",
    "# head.yaml",
    yamlDefaults["/head.yaml"] || DEFAULT_HEAD,
  );
  window._cmRules = makeEditor(
    "editor-rules",
    "R rules.yaml",
    yamlDefaults["/rules.yaml"] || DEFAULT_RULES,
  );

  // Preview editor (read-only)
  // minimalSetup does not include yaml language support,
  // so adding yaml() here does not create a duplicate instance.
  window._cmPreview = new EditorView({
    state: EditorState.create({
      doc: "",
      extensions: [
        minimalSetup,
        yaml(),
        oneDark,
        EditorView.lineWrapping,
        EditorState.readOnly.of(true),
      ],
    }),
    parent: $("preview-output"),
  });

  // 订阅输入和手动节点输入保存
  $("sub-urls").addEventListener("input", () => {
    if (!state.ignoreInput) saveState();
  });
  $("manual-yaml").addEventListener("input", () => {
    if (!state.ignoreInput) saveState();
  });

  loadState();
  renderSubscriptionList();
  renderManualNodeList();
  refreshPreview();
  fetchSubUrl();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
