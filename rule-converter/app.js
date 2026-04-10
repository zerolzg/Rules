/* ═══════════════════════════════════════
   Clash Rules Generator — JS
   ═══════════════════════════════════════ */

// ─────────────────────────────────────────
// Default YAML content — loaded from server at /head.yaml and /rules.yaml
const DEFAULT_HEAD = '';
const DEFAULT_RULES = '';

// ─────────────────────────────────────────
// Load yaml files from server (fallback to empty)
// ─────────────────────────────────────────
async function loadYamlDefaults() {
  const files = ['/rules.yaml', '/head.yaml'];
  const result = {};
  for (const f of files) {
    try {
      const r = await fetch(f);
      if (r.ok) result[f] = await r.text();
    } catch (_) {}
  }
  return result;
}


// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
let subscriptions = [];   // [{ url, prefix, proxies }]
let manualProxies = [];   // 手动输入节点（始终在最前）
let mergedConfig = null;
let _ignoreInput = false;

// 总订阅节点数（避免多处重复 reduce）
function subProxyCount() {
  return subscriptions.reduce((s, sub) => s + sub.proxies.length, 0);
}

// HTML 转义（防止 XSS）
const _HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => _HTML_ESCAPE_MAP[c]);
}

// 解析 textarea 文本为订阅数组
function parseSubLines(text) {
  return text.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const sepIdx = line.indexOf('|');
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
  document.getElementById(id).classList.toggle('collapsed');
}

// ─────────────────────────────────────────
// Tab switching
// ─────────────────────────────────────────
function switchTab(mode) {
  document.getElementById('tab-url').classList.toggle('active', mode === 'url');
  document.getElementById('tab-manual').classList.toggle('active', mode === 'manual');
  document.getElementById('input-url').classList.toggle('active', mode === 'url');
  document.getElementById('input-manual').classList.toggle('active', mode === 'manual');
  saveState();
}

// ─────────────────────────────────────────
// Notification
// ─────────────────────────────────────────
let _nt = null;
function showNotif(msg, type = 'ok') {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(_nt);
  _nt = setTimeout(() => { el.className = ''; }, 3000);
}

// ─────────────────────────────────────────
// Proxy status
// ─────────────────────────────────────────
function setProxyStatus(text, type = 'ok') {
  const dot = document.getElementById('proxy-dot');
  const txt = document.getElementById('proxy-status-text');
  dot.className = `status-dot ${type}`;
  txt.className = `status-text ${type}`;
  txt.textContent = text;
  const total = manualProxies.length + subProxyCount();
  document.getElementById('proxy-count-num').textContent = total;
}

// ─────────────────────────────────────────
// Fetch subscription
// ─────────────────────────────────────────
async function fetchAllSubscriptions() {
  const textarea = document.getElementById('sub-urls');
  const lines = parseSubLines(textarea.value);

  if (!lines.length) { showNotif('Enter at least one subscription URL.', 'err'); return; }

  const btn = document.getElementById('btn-fetch-all');
  btn.disabled = true;
  btn.textContent = 'Fetching...';

  subscriptions = []; // 用 textarea 最新内容替换
  let successCount = 0;
  let failCount = 0;

  for (const { url, prefix } of lines) {
    try {
      const r = await fetch(`/proxy?${encodeURIComponent(url)}`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const text = decodeBase64(await r.text());
      const proxies = parseProxies(text);
      subscriptions.push({ url, prefix, proxies, rawYaml: text });
      successCount++;
    } catch (e) {
      failCount++;
    }
  }

  btn.disabled = false;
  btn.textContent = '▶ Fetch All';

  const subCount = subProxyCount();
  const total = manualProxies.length + subCount;
  if (failCount === 0) {
    setProxyStatus(`Total: ${total} (manual: ${manualProxies.length}, subs: ${subCount})`, 'ok');
    showNotif(`Fetched ${successCount} subscription(s), ${total} proxies total`, 'ok');
  } else {
    setProxyStatus(`Total: ${total} (manual: ${manualProxies.length}, subs: ${subCount})`, 'warn');
    showNotif(`Fetched ${successCount}, failed ${failCount} subscription(s)`, 'warn');
  }

  renderSubscriptionList();
  saveState();
  refreshPreview();
}

function parseProxies(text) {
  const doc = jsyaml.load(text, { schema: jsyaml.DEFAULT_SCHEMA, merge: true });
  const proxies = Array.isArray(doc) ? doc : (Array.isArray(doc.proxies) ? doc.proxies : []);
  if (!proxies.length) throw new Error('No proxies found.');
  return proxies;
}

function toggleRaw(i) {
  const el = document.getElementById('raw-' + i);
  if (!el) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? 'block' : 'none';
  const btn = document.getElementById('raw-toggle-' + i);
  if (btn) btn.textContent = hidden ? 'Hide' : 'Raw';
}

function removeSubscription(index) {
  subscriptions.splice(index, 1);
  renderSubscriptionList();
  const subCount = subProxyCount();
  const total = manualProxies.length + subCount;
  setProxyStatus(`Total: ${total} (manual: ${manualProxies.length}, subs: ${subCount})`, 'ok');
  saveState();
  refreshPreview();
}

function renderSubscriptionList() {
  const container = document.getElementById('sub-list');
  if (!container) return;

  if (!subscriptions.length) {
    container.innerHTML = '<div class="sub-list-empty">No subscriptions added</div>';
    return;
  }

  container.innerHTML = subscriptions.map((sub, i) => {
    const safeUrl = escapeHtml(sub.url);
    const urlShort = safeUrl.length > 45 ? safeUrl.slice(0, 42) + '...' : safeUrl;
    const safePrefix = escapeHtml(sub.prefix);
    const rawSafe = escapeHtml(sub.rawYaml || '');
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
  }).join('');
}

// ─────────────────────────────────────────
// Manual parse
// ─────────────────────────────────────────
function parseManualInput() {
  const text = document.getElementById('manual-yaml').value.trim();
  if (!text) { showNotif('Paste some node names or YAML first.', 'err'); return; }

  if (text.includes('- name:')) {
    try {
      const list = parseProxies(text);
      if (!list.length) { showNotif('No proxies found.', 'err'); return; }
      manualProxies = list;
      const subCount = subProxyCount();
      const total = manualProxies.length + subCount;
      setProxyStatus(`Total: ${total} (manual: ${manualProxies.length}, subs: ${subCount})`, 'ok');
      showNotif(`Manual: ${manualProxies.length} proxies, Total: ${total}`, 'ok');
      refreshPreview();
    } catch (e) { showNotif(e.message, 'err'); }
  }
}

// ─────────────────────────────────────────
// Base64 decode
// ─────────────────────────────────────────
function decodeBase64(str) {
  str = str.trim();
  if (str.includes('proxies:')) return str;
  str = str.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) str += '='.repeat(4 - pad);
  return decodeURIComponent(
    atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
}

// ─────────────────────────────────────────
// Compress proxy to single line (YAML flow style)
// ─────────────────────────────────────────
function compressValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    if (/[:\[\]{},#&*!|>'"%@`]/.test(v) || /^\s/.test(v) || /\s$/.test(v)) {
      return `"${v.replace(/"/g, '\\"')}"`;
    }
    return v;
  }
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  return undefined; // 数组/对象由 jsyaml.dump 自然处理，保留多行格式；空数组返回 null 以便过滤
}

function compressProxyValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    if (/[:\[\]{},#&*!|>'"%@`]/.test(v) || /^\s/.test(v) || /\s$/.test(v)) {
      return `"${v.replace(/"/g, '\\"')}"`;
    }
    return v;
  }
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    const items = v.map(compressProxyValue).filter(x => x !== null);
    return `[${items.join(', ')}]`;
  }
  if (typeof v === 'object') {
    const pairs = Object.entries(v)
      .filter(([, val]) => val !== undefined && val !== null)
      .map(([k, val]) => `${k}: ${compressProxyValue(val)}`);
    return `{${pairs.join(', ')}}`;
  }
  return null;
}

function compressProxy(proxy) {
  const pairs = Object.entries(proxy)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${compressProxyValue(v)}`);
  return `- {${pairs.join(', ')}}`;
}

function compressRuleProvider(name, rp) {
  const pairs = Object.entries(rp)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${compressProxyValue(v)}`);
  return `  ${name}: {${pairs.join(', ')}}`;
}


function dumpListYaml(key, arr) {
  const lines = [`${key}:`];
  for (const v of arr) lines.push(`  - ${compressValue(v)}`);
  return lines.join('\n');
}

// ─────────────────────────────────────────
// Build merged config
// ─────────────────────────────────────────
// Reserved proxy names that are always kept as-is
const LITERAL = new Set(['DIRECT', 'REJECT', 'Proxy', 'Auto - UrlTest']);

const GROUP_TEMPLATES = [
  { name: 'Proxy',        type: 'select',  proxies: ['Auto - UrlTest', 'DIRECT'],    match: '' },
  { name: 'Domestic',    type: 'select',  proxies: ['DIRECT', 'Proxy'],             match: '' },
  { name: 'Others',      type: 'select',  proxies: ['Proxy', 'DIRECT'],             match: '' },
  { name: 'AdBlock',     type: 'select',  proxies: ['REJECT', 'DIRECT', 'Proxy'],  match: '' },
  { name: 'HTTPDNS',     type: 'select',  proxies: ['DIRECT', 'REJECT', 'Proxy'], match: '' },
  { name: 'YouTube',     type: 'select',  proxies: ['Proxy', 'DIRECT'],           match: '' },
  { name: 'CN Mainland TV', type: 'select', proxies: ['DIRECT', 'Proxy'],         match: '' },
  { name: 'Asian TV',    type: 'select',  proxies: ['Proxy', 'DIRECT'],            match: '' },
  { name: 'Global TV',   type: 'select',  proxies: ['Proxy', 'DIRECT'],           match: '' },
  { name: 'Apple',       type: 'select',  proxies: ['DIRECT', 'Proxy'],           match: '' },
  { name: 'Telegram',    type: 'select',  proxies: ['Proxy', 'DIRECT'],           match: '' },
  { name: 'Google FCM',  type: 'select',  proxies: ['Proxy', 'DIRECT'],           match: '' },
  { name: 'Crypto',      type: 'select',  proxies: ['Proxy', 'DIRECT'],           match: '' },
  { name: 'Discord',     type: 'select',  proxies: ['Proxy', 'DIRECT'],           match: '' },
  { name: 'Microsoft',   type: 'select',  proxies: ['DIRECT', 'Proxy'],          match: '' },
  { name: 'AI Suite',    type: 'select',  proxies: ['Proxy', 'DIRECT'],           match: '' },
  { name: 'PayPal',      type: 'select',  proxies: ['DIRECT', 'Proxy'],           match: '' },
  { name: 'Scholar',     type: 'select',  proxies: ['DIRECT', 'Proxy'],          match: '' },
  { name: 'Speedtest',   type: 'select',  proxies: ['Proxy', 'DIRECT'],          match: '' },
  { name: 'Steam',       type: 'select',  proxies: ['Proxy', 'DIRECT'],          match: '' },
  { name: 'miHoYo',      type: 'select',  proxies: ['DIRECT', 'Proxy'],          match: '' },
  { name: 'Auto - UrlTest', type: 'url-test', proxies: [], match: '', url: 'https://cp.cloudflare.com/generate_204', interval: 3600 },
];

function buildProxyGroups(proxyNames) {
  if (!proxyNames.length) return [];

  const groups = GROUP_TEMPLATES.map(t => {
    const proxies = [];
    for (const p of t.proxies) {
      if (LITERAL.has(p)) proxies.push(p);
    }
    // 空字符串 = 匹配所有节点；其他值 = 名字包含 matchKey 的节点（目前全部为空，即全部追加）
    const matched = t.match ? proxyNames.filter(n => n.includes(t.match)) : proxyNames;
    proxies.push(...matched);
    return { name: t.name, type: t.type, proxies, url: t.url, interval: t.interval };
  });

  return groups;
}

function buildMergedConfig() {
  const head   = parseYamlSafe(window._cmContent['editor-head']   || '{}');
  const rules  = parseYamlSafe(window._cmContent['editor-rules'] || '{}');

  // 合并所有订阅节点，叠加前缀
  const subProxies = subscriptions.flatMap(sub =>
    sub.proxies.map(p => ({
      ...p,
      name: (sub.prefix ? sub.prefix + ' - ' : '') + (p.name || '')
    }))
  );
  const finalProxies = [...manualProxies, ...subProxies];
  const proxyNames   = finalProxies.map(p => p.name);

  // 始终用 GROUP_TEMPLATES 生成 proxy-groups，忽略订阅中的 rawGroups
  const finalGroups = buildProxyGroups(proxyNames);

  const config = { ...head, ...(rules || {}) };
  if (finalProxies.length > 0) config.proxies = finalProxies;
  if (finalGroups.length  > 0) config['proxy-groups'] = finalGroups;

  return config;
}

// ─────────────────────────────────────────
// Safe YAML parse
// ─────────────────────────────────────────
function parseYamlSafe(text) {
  try { return jsyaml.load(text) || {}; } catch (_) { return {}; }
}

// ─────────────────────────────────────────
// Dump config to YAML (proxies compressed, rest normal)
// ─────────────────────────────────────────
function dumpConfigYaml(config) {
  if (!config || typeof config !== 'object') return '';

  const { proxies, 'proxy-groups': proxyGroups, rules, 'rule-providers': ruleProviders, ...headRest } = config;

  const lines = [];

  // 1. Head 内容 (不含 rules 和 rule-providers)
  const headYaml = jsyaml.dump(headRest, { indent: 2, noRefs: true, sortKeys: false });
  if (headYaml.trim()) lines.push(headYaml.trim());

  // 2. proxies (压缩单行)
  if (proxies && proxies.length) {
    lines.push('proxies:');
    for (const p of proxies) lines.push(compressProxy(p));
  }

  // 3. proxy-groups
  if (proxyGroups && proxyGroups.length) {
    lines.push('proxy-groups:');
    for (const g of proxyGroups) {
      const pairs = [`name: "${g.name}"`, `type: ${g.type}`];
      const ps = g.proxies.map(p => `"${p}"`).join(', ');
      pairs.push(`proxies: [${ps}]`);
      if (g.url) pairs.push(`url: ${g.url}`);
      if (g.interval) pairs.push(`interval: ${g.interval}`);
      lines.push(`- {${pairs.join(', ')}}`);
    }
  }

  // 4. rules 内容 (rules, rule-providers)
  if (rules && rules.length) {
    lines.push('rules:');
    for (const r of rules) lines.push(`  - "${r}"`);
  }

  // 5. rule-providers (每条单行)
  if (ruleProviders && Object.keys(ruleProviders).length) {
    lines.push('rule-providers:');
    for (const [name, rp] of Object.entries(ruleProviders)) {
      lines.push(compressRuleProvider(name, rp));
    }
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────
function refreshPreview() {
  let config;
  try {
    config = buildMergedConfig();
    mergedConfig = config;
  } catch (e) {
    window._cmPreview.dispatch({
      changes: { from: 0, to: window._cmPreview.state.doc.length, insert: `# Build error: ${e.message}` }
    });
    return;
  }

  let yaml;
  try {
    yaml = dumpConfigYaml(config);
  } catch (e) {
    yaml = `# YAML dump error: ${e.message}`;
  }

  window._cmPreview.dispatch({
    changes: { from: 0, to: window._cmPreview.state.doc.length, insert: yaml }
  });
  const subCount = subProxyCount();
  document.getElementById('proxy-count-num').textContent = manualProxies.length + subCount;
}

// ─────────────────────────────────────────
// Download
// ─────────────────────────────────────────
function downloadConfig() {
  if (!mergedConfig) { showNotif('Nothing to download yet.', 'err'); return; }
  try {
    const yaml = dumpConfigYaml(mergedConfig);
    const blob = new Blob([yaml], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'config.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showNotif('config.yaml downloaded!', 'ok');
  } catch (e) {
    showNotif('Download failed: ' + e.message, 'err');
  }
}

// ─────────────────────────────────────────
// Copy
// ─────────────────────────────────────────
function copyConfig() {
  if (!mergedConfig) { showNotif('Nothing to copy yet.', 'err'); return; }
  try {
    const yaml = dumpConfigYaml(mergedConfig);
    navigator.clipboard.writeText(yaml)
      .then(() => showNotif('Copied to clipboard!', 'ok'))
      .catch(() => showNotif('Clipboard write failed.', 'err'));
  } catch (e) {
    showNotif('Copy failed: ' + e.message, 'err');
  }
}

// ─────────────────────────────────────────
// Fullscreen editor overlay
// ─────────────────────────────────────────
function expandEditor(id, label, view) {
  const overlay = document.createElement('div');
  overlay.className = 'editor-overlay';
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
    parent: document.getElementById('fs-editor'),
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

  document.getElementById('fs-close').addEventListener('click', close);
  const escHandler = (e) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);
}

// ─────────────────────────────────────────
// Storage
// ─────────────────────────────────────────
const LS_KEY = 'rcg_state';

function saveState() {
  try {
    if (_ignoreInput) return;
    localStorage.setItem(LS_KEY, JSON.stringify({
      subUrls: (document.getElementById('sub-urls') || {}).value || '',
      manualYaml: (document.getElementById('manual-yaml') || {}).value || '',
      activeTab: document.getElementById('tab-url').classList.contains('active') ? 'url' : 'manual',
    }));
  } catch (_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);

    const subEl = document.getElementById('sub-urls');
    if (subEl && s.subUrls !== undefined) {
      try {
        _ignoreInput = true;
        subEl.value = s.subUrls;
      } finally {
        _ignoreInput = false;
      }
    }

    const manualEl = document.getElementById('manual-yaml');
    if (manualEl && s.manualYaml !== undefined) manualEl.value = s.manualYaml;
    if (s.activeTab) switchTab(s.activeTab);
    // 节点数据未缓存，subscriptions 保持为空，用户需重新 Fetch
  } catch (_) {}
}

// ─────────────────────────────────────────
// Init editors — idempotent
// ─────────────────────────────────────────
let _inited = false;
async function init() {
  if (_inited) return;
  _inited = true;

  // Load yaml files from server first (source of truth)
  const yamlDefaults = await loadYamlDefaults();

  const [cm, cmState, yamlLang, oneDarkMod] = await Promise.all([
    import('codemirror'),
    import('@codemirror/state'),
    import('@codemirror/lang-yaml'),
    import('@codemirror/theme-one-dark'),
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
    const dom = document.getElementById(domId);
    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          minimalSetup,
          window._cmYaml(),
          window._cmTheme,
          EditorView.lineWrapping,
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              window._cmContent[domId] = update.state.doc.toString();
              clearTimeout(window._cmRefreshTimer);
              window._cmRefreshTimer = setTimeout(refreshPreview, 200);
            }
          }),
        ],
      }),
      parent: dom,
    });

    // Fullscreen button
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'font-size:11px;padding:4px 10px;margin-top:6px;';
    btn.textContent = '⛶ Fullscreen';
    btn.addEventListener('click', () => expandEditor(domId, label, view));
    dom.parentNode.appendChild(btn);

    window._cmContent[domId] = content;
    return view;
  };

  window._cmContent = {};
  window._cmHead   = makeEditor('editor-head',   '# head.yaml',   yamlDefaults['/head.yaml']  || DEFAULT_HEAD);
  window._cmRules  = makeEditor('editor-rules', 'R rules.yaml',   yamlDefaults['/rules.yaml'] || DEFAULT_RULES);

  // Preview editor (read-only)
  window._cmPreview = new EditorView({
    state: EditorState.create({
      doc: '',
      extensions: [
        minimalSetup,
        yaml(),
        oneDark,
        EditorView.lineWrapping,
        EditorState.readOnly.of(true),
      ],
    }),
    parent: document.getElementById('preview-output'),
  });

  // 订阅输入保存
  document.getElementById('sub-urls').addEventListener('input', () => {
    if (!_ignoreInput) saveState();
  });

  loadState();
  renderSubscriptionList();
  refreshPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
