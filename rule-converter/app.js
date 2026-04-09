/* ═══════════════════════════════════════
   Clash Rules Generator — JS
   ═══════════════════════════════════════ */

// ─────────────────────────────────────────
// Default YAML content
// ─────────────────────────────────────────
const DEFAULT_HEAD = ``;

const DEFAULT_RULES = `
rules:
  # 拦截 QUIC 流量功能（强制谷歌/YouTube回退到TCP，防降速）
  - AND,((NETWORK,UDP),(DST-PORT,443)),REJECT
  # 使用 Mihomo 内置的 geosite 拦截 BT 追踪器
  - "GEOSITE,category-pt,DIRECT"
  - "RULE-SET,AdBlock,AdBlock"
  - "RULE-SET,HTTPDNS,HTTPDNS"
  - "RULE-SET,Special,DIRECT"
  - "RULE-SET,Netflix,Global TV"
  - "RULE-SET,Disney Plus,Global TV"
  - "RULE-SET,YouTube,YouTube"
  - "RULE-SET,Max,Global TV"
  - "RULE-SET,Spotify,Global TV"
  - "RULE-SET,Abema TV,Asian TV"
  - "RULE-SET,Bahamut,Asian TV"
  - "RULE-SET,DMM,Asian TV"
  - "RULE-SET,Fox+,Asian TV"
  - "RULE-SET,Hulu Japan,Asian TV"
  - "RULE-SET,IQ,Asian TV"
  - "RULE-SET,Japonx,Asian TV"
  - "RULE-SET,JOOX,Asian TV"
  - "RULE-SET,KKBOX,Asian TV"
  - "RULE-SET,KKTV,Asian TV"
  - "RULE-SET,Line TV,Asian TV"
  - "RULE-SET,myTV SUPER,Asian TV"
  - "RULE-SET,Niconico,Asian TV"
  - "RULE-SET,ViuTV,Asian TV"
  - "RULE-SET,ABC,Global TV"
  - "RULE-SET,Amazon,Global TV"
  - "RULE-SET,BBC iPlayer,Global TV"
  - "RULE-SET,DAZN,Global TV"
  - "RULE-SET,Discovery Plus,Global TV"
  - "RULE-SET,encoreTVB,Global TV"
  - "RULE-SET,F1 TV,Global TV"
  - "RULE-SET,Fox Now,Global TV"
  - "RULE-SET,Hulu,Global TV"
  - "RULE-SET,Pandora,Global TV"
  - "RULE-SET,PBS,Global TV"
  - "RULE-SET,Pornhub,Global TV"
  - "RULE-SET,Soundcloud,Global TV"
  - "RULE-SET,Bilibili,CN Mainland TV"
  - "RULE-SET,IQIYI,CN Mainland TV"
  - "RULE-SET,Letv,CN Mainland TV"
  - "RULE-SET,Netease Music,CN Mainland TV"
  - "RULE-SET,Tencent Video,CN Mainland TV"
  - "RULE-SET,WeTV,CN Mainland TV"
  - "RULE-SET,Youku,CN Mainland TV"
  - "RULE-SET,Telegram,Telegram"
  - "RULE-SET,Crypto,Crypto"
  - "RULE-SET,Discord,Discord"
  - "RULE-SET,Google FCM,Google FCM"
  - "RULE-SET,Microsoft,Microsoft"
  - "RULE-SET,AI Suite,AI Suite"
  - "RULE-SET,PayPal,PayPal"
  - "RULE-SET,Scholar,Scholar"
  - "RULE-SET,Speedtest,Speedtest"
  - "RULE-SET,Steam,Steam"
  - "RULE-SET,TikTok,Global TV"
  - "RULE-SET,Apple Music,Global TV"
  - "RULE-SET,Apple News,Global TV"
  - "RULE-SET,Apple TV,Global TV"
  - "RULE-SET,Apple,Apple"
  - "RULE-SET,miHoYo,miHoYo"
  - "RULE-SET,PROXY,Proxy"
  - "RULE-SET,Domestic,Domestic"
  - "RULE-SET,Domestic IPs,Domestic"
  - "RULE-SET,LAN,DIRECT"
  - "GEOIP,CN,Domestic"
  - "MATCH,Others"

rule-providers:
  AdBlock:
    type: "http"
    behavior: "domain"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/AdBlock.yaml"
    path: ./Rules/AdBlock
    interval: 86400
  HTTPDNS:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/HTTPDNS.yaml"
    path: ./Rules/HTTPDNS
    interval: 86400
  Special:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Special.yaml"
    path: ./Rules/Special
    interval: 86400
  PROXY:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Proxy.yaml"
    path: ./Rules/Proxy
    interval: 86400
  Domestic:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Domestic.yaml"
    path: ./Rules/Domestic
    interval: 86400
  Domestic IPs:
    type: "http"
    behavior: "ipcidr"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Domestic%20IPs.yaml"
    path: ./Rules/Domestic_IPs
    interval: 86400
  LAN:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/LAN.yaml"
    path: ./Rules/LAN
    interval: 86400
  Netflix:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Netflix.yaml"
    path: ./Rules/Media/Netflix
    interval: 86400
  Spotify:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Spotify.yaml"
    path: ./Rules/Media/Spotify
    interval: 86400
  YouTube:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/YouTube.yaml"
    path: ./Rules/Media/YouTube
    interval: 86400
  Max:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Max.yaml"
    path: ./Rules/Media/Max
    interval: 86400
  Bilibili:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Bilibili.yaml"
    path: ./Rules/Media/Bilibili
    interval: 86400
  IQ:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/IQ.yaml"
    path: ./Rules/Media/IQI
    interval: 86400
  IQIYI:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/IQIYI.yaml"
    path: ./Rules/Media/IQYI
    interval: 86400
  Letv:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Letv.yaml"
    path: ./Rules/Media/Letv
    interval: 86400
  Netease Music:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Netease%20Music.yaml"
    path: ./Rules/Media/Netease_Music
    interval: 86400
  Tencent Video:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Tencent%20Video.yaml"
    path: ./Rules/Media/Tencent_Video
    interval: 86400
  Youku:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Youku.yaml"
    path: ./Rules/Media/Youku
    interval: 86400
  WeTV:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/WeTV.yaml"
    path: ./Rules/Media/WeTV
    interval: 86400
  ABC:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/ABC.yaml"
    path: ./Rules/Media/ABC
    interval: 86400
  Abema TV:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Abema%20TV.yaml"
    path: ./Rules/Media/Abema_TV
    interval: 86400
  Amazon:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Amazon.yaml"
    path: ./Rules/Media/Amazon
    interval: 86400
  Apple Music:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Apple%20Music.yaml"
    path: ./Rules/Media/Apple_Music
    interval: 86400
  Apple News:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Apple%20News.yaml"
    path: ./Rules/Media/Apple_News
    interval: 86400
  Apple TV:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Apple%20TV.yaml"
    path: ./Rules/Media/Apple_TV
    interval: 86400
  Bahamut:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Bahamut.yaml"
    path: ./Rules/Media/Bahamut
    interval: 86400
  BBC iPlayer:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/BBC%20iPlayer.yaml"
    path: ./Rules/Media/BBC_iPlayer
    interval: 86400
  DAZN:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/DAZN.yaml"
    path: ./Rules/Media/DAZN
    interval: 86400
  Discovery Plus:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Discovery%20Plus.yaml"
    path: ./Rules/Media/Discovery_Plus
    interval: 86400
  Disney Plus:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Disney%20Plus.yaml"
    path: ./Rules/Media/Disney_Plus
    interval: 86400
  DMM:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/DMM.yaml"
    path: ./Rules/Media/DMM
    interval: 86400
  encoreTVB:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/encoreTVB.yaml"
    path: ./Rules/Media/encoreTVB
    interval: 86400
  F1 TV:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/F1%20TV.yaml"
    path: ./Rules/Media/F1_TV
    interval: 86400
  Fox Now:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Fox%20Now.yaml"
    path: ./Rules/Media/Fox_Now
    interval: 86400
  Fox+:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Fox%2B.yaml"
    path: ./Rules/Media/Fox+
    interval: 86400
  Hulu Japan:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Hulu%20Japan.yaml"
    path: ./Rules/Media/Hulu_Japan
    interval: 86400
  Hulu:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Hulu.yaml"
    path: ./Rules/Media/Hulu
    interval: 86400
  Japonx:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Japonx.yaml"
    path: ./Rules/Media/Japonx
    interval: 86400
  JOOX:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/JOOX.yaml"
    path: ./Rules/Media/JOOX
    interval: 86400
  KKBOX:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/KKBOX.yaml"
    path: ./Rules/Media/KKBOX
    interval: 86400
  KKTV:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/KKTV.yaml"
    path: ./Rules/Media/KKTV
    interval: 86400
  Line TV:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Line%20TV.yaml"
    path: ./Rules/Media/Line_TV
    interval: 86400
  myTV SUPER:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/myTV%20SUPER.yaml"
    path: ./Rules/Media/myTV_SUPER
    interval: 86400
  Niconico:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Niconico.yaml"
    path: ./Rules/Media/Niconico
    interval: 86400
  Pandora:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Pandora.yaml"
    path: ./Rules/Media/Pandora
    interval: 86400
  PBS:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/PBS.yaml"
    path: ./Rules/Media/PBS
    interval: 86400
  Pornhub:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Pornhub.yaml"
    path: ./Rules/Media/Pornhub
    interval: 86400
  Soundcloud:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/Soundcloud.yaml"
    path: ./Rules/Media/Soundcloud
    interval: 86400
  ViuTV:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Media/ViuTV.yaml"
    path: ./Rules/Media/ViuTV
    interval: 86400
  Telegram:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Telegram.yaml"
    path: ./Rules/Telegram
    interval: 86400
  Crypto:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Crypto.yaml"
    path: ./Rules/Crypto
    interval: 86400
  Discord:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Discord.yaml"
    path: ./Rules/Discord
    interval: 86400
  Steam:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Steam.yaml"
    path: ./Rules/Steam
    interval: 86400
  TikTok:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/TikTok.yaml"
    path: ./Rules/TikTok
    interval: 86400
  Speedtest:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Speedtest.yaml"
    path: ./Rules/Speedtest
    interval: 86400
  PayPal:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/PayPal.yaml"
    path: ./Rules/PayPal
    interval: 86400
  Microsoft:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Microsoft.yaml"
    path: ./Rules/Microsoft
    interval: 86400
  AI Suite:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/AI%20Suite.yaml"
    path: ./Rules/AI Suite
    interval: 86400
  Apple:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Apple.yaml"
    path: ./Rules/Apple
    interval: 86400
  Google FCM:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Google%20FCM.yaml"
    path: ./Rules/Google FCM
    interval: 86400
  Scholar:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/Scholar.yaml"
    path: ./Rules/Scholar
    interval: 86400
  miHoYo:
    type: "http"
    behavior: "classical"
    url: "https://cdn.jsdelivr.net/gh/zerolzg/Rules@main/Clash/Provider/miHoYo.yaml"
    path: ./Rules/miHoYo
    interval: 86400
`;

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
let rawProxies = [];      // 订阅节点
let manualProxies = [];   // 手动输入节点（始终在前面）
let mergedConfig = null;

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
  document.getElementById('proxy-count-num').textContent = manualProxies.length + rawProxies.length;
}

// ─────────────────────────────────────────
// Fetch subscription
// ─────────────────────────────────────────
async function fetchSubscription() {
  const url = document.getElementById('sub-url').value.trim();
  if (!url) { showNotif('Enter a subscription URL first.', 'err'); return; }

  setProxyStatus('Fetching...', 'warn');

  try {
    const r = await fetch(`/proxy?${encodeURIComponent(url)}`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    processYAML(decodeBase64(await r.text()));
  } catch (e) {
    setProxyStatus('CORS blocked', 'err');
    showNotif('Could not fetch the URL. Try a CORS proxy or paste content manually.', 'err');
  }
}

// ─────────────────────────────────────────
// Manual parse
// ─────────────────────────────────────────
function parseManualInput() {
  const text = document.getElementById('manual-yaml').value.trim();
  if (!text) { showNotif('Paste some node names or YAML first.', 'err'); return; }

  // 有 - name: -> 解析节点列表存入 manualProxies
  if (text.includes('- name:')) {
    try {
      const doc = jsyaml.load(text, { schema: jsyaml.DEFAULT_SCHEMA, merge: true });
      const list = Array.isArray(doc) ? doc : (Array.isArray(doc.proxies) ? doc.proxies : []);
      if (!list.length) { showNotif('No proxies found.', 'err'); return; }
      manualProxies = list;
      setProxyStatus(`Manual: ${manualProxies.length} proxies`, 'ok');
      showNotif(`Manual: ${manualProxies.length} proxies`, 'ok');
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
// Process decoded YAML → extract proxies + groups (订阅专用)
// ─────────────────────────────────────────
function processYAML(text) {
  const doc = jsyaml.load(text, { schema: jsyaml.DEFAULT_SCHEMA, merge: true });
  const proxies = Array.isArray(doc.proxies) ? doc.proxies : [];

  if (!proxies.length) throw new Error('No proxies found.');

  rawProxies = proxies;

  const total = manualProxies.length + rawProxies.length;
  setProxyStatus(`Total: ${total} (manual: ${manualProxies.length}, sub: ${rawProxies.length})`, 'ok');
  showNotif(`Subscription: ${rawProxies.length} proxies, Total: ${total}`, 'ok');
  refreshPreview();
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
  if (Array.isArray(v)) {
    const items = v.map(compressValue).filter(x => x !== null);
    return `[${items.join(', ')}]`;
  }
  if (typeof v === 'object') {
    const pairs = Object.entries(v)
      .filter(([, val]) => val !== undefined && val !== null)
      .map(([k, val]) => `${k}: ${compressValue(val)}`);
    return `{${pairs.join(', ')}}`;
  }
  return String(v);
}

function compressProxy(proxy) {
  const pairs = Object.entries(proxy)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${compressValue(v)}`);
  return `- {${pairs.join(', ')}}`;
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

  const finalProxies = [...manualProxies, ...rawProxies];
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

  // 1. Head_dns 内容 (不含 rules 和 rule-providers)
  const headYaml = jsyaml.dump(headRest, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false });
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
  const rulesContent = {};
  if (rules) rulesContent.rules = rules;
  if (ruleProviders) rulesContent['rule-providers'] = ruleProviders;
  const rulesYaml = jsyaml.dump(rulesContent, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false });
  if (rulesYaml.trim()) lines.push(rulesYaml.trim());

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
  document.getElementById('proxy-count-num').textContent = manualProxies.length + rawProxies.length;
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
  localStorage.setItem(LS_KEY, JSON.stringify({
    subUrl: document.getElementById('sub-url').value,
    manualYaml: document.getElementById('manual-yaml').value,
    activeTab: document.getElementById('tab-url').classList.contains('active') ? 'url' : 'manual',
  }));
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.subUrl)    document.getElementById('sub-url').value = s.subUrl;
    if (s.manualYaml) document.getElementById('manual-yaml').value = s.manualYaml;
    if (s.activeTab) switchTab(s.activeTab);
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

  // 订阅 URL 输入保存
  document.getElementById('sub-url').addEventListener('input', saveState);

  loadState();
  refreshPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
