#!/usr/bin/env node
// proxy.js — 本地 CORS 代理 + 静态文件服务器

const http = require("http");
const https = require("https");
const fsp = require("fs").promises;
const path = require("path");
const os = require("os");
const YAML = require("yaml");

const PORT = 5555;
const BASE_DIR = __dirname;
const API_KEY = "123456";
const SERVER_BASE_URL = "auto";
const SAVED_CONFIG = path.join(BASE_DIR, "config.yaml");

// ─────────────────────────────────────────
// MIME 类型
// ─────────────────────────────────────────
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
};

// ─────────────────────────────────────────
// YAML 格式化 — 纯函数，便于单元测试
// ─────────────────────────────────────────
function toFlowMap(node) {
  const flowMap = new YAML.YAMLMap();
  flowMap.flow = true;
  for (const pair of node.items) flowMap.items.push(pair);
  return flowMap;
}

function processNode(node, keyName = null) {
  if (YAML.isSeq(node)) {
    node.items = node.items.map((item) => {
      if (YAML.isMap(item)) return toFlowMap(item);
      return item;
    });
    node.items.forEach((item) => processNode(item, keyName));
  } else if (YAML.isMap(node)) {
    node.items.forEach((pair) => {
      const currentKey = pair.key ? pair.key.value : null;
      if (
        (keyName === "rule-providers" || keyName === "proxy-providers") &&
        YAML.isMap(pair.value)
      ) {
        pair.value = toFlowMap(pair.value);
      }
      processNode(pair.value, currentKey);
    });
  }
}

function formatYaml(text) {
  const normalized = YAML.stringify(YAML.parse(text, { maxAliasCount: -1 }));
  const doc = YAML.parseDocument(normalized, { merge: true, maxAliasCount: -1 });
  if (!doc.contents) return text;
  processNode(doc.contents);
  return doc.toString({ lineWidth: Infinity });
}

// ─────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

function getBaseUrl() {
  if (SERVER_BASE_URL !== "auto") return SERVER_BASE_URL;
  const lan = getLanIP();
  return lan ? `http://${lan}:${PORT}` : `http://localhost:${PORT}`;
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// ─────────────────────────────────────────
// 路由表：硬编码白名单，无路径遍历风险
// ─────────────────────────────────────────
const ROUTES = {
  "/":           "index.html",
  "/index.html": "index.html",
  "/app.js":     "app.js",
  "/style.css":  "style.css",
  "/head.yaml":  "../Clash/Head_dns.yaml",
  "/rules.yaml": "../Clash/Rule.yaml",
};

// ─────────────────────────────────────────
// 服务器
// ─────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;
  const search = parsedUrl.search || "";

  // 静态文件 — 路由表驱动（白名单，不存在路径遍历风险）
  if (ROUTES[pathname] !== undefined) {
    const filename = ROUTES[pathname];
    const filePath = path.join(BASE_DIR, filename);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    fsp.readFile(filePath)
      .then((data) => {
        res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
        res.end(data);
      })
      .catch((e) => {
        console.error("Static file error:", pathname, e);
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`Not found: ${pathname}`);
      });
    return;
  }

  // 代理 clash 订阅请求: /proxy?<url>
  if (pathname === "/proxy") {
    const targetUrl = search ? search.slice(1) : "";
    if (!targetUrl) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Usage: /proxy?<subscription-url>");
      return;
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    console.log(`[proxy] GET ${decodedUrl}`);

    const protocol = decodedUrl.startsWith("https") ? https : http;
    const reqOpts = {
      headers: {
        "User-Agent": "ClashForAndroid/2.5.12",
        Accept: "*/*",
      },
      timeout: 30000,
    };

    protocol
      .get(decodedUrl, reqOpts, (proxyRes) => {
        if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode)) {
          const location = proxyRes.headers.location;
          if (location) {
            const newUrl = new URL(location, decodedUrl).href;
            console.log(`[proxy] redirect → ${newUrl}`);
            res.writeHead(302, { Location: `/proxy?${encodeURIComponent(newUrl)}` });
            res.end();
            return;
          }
        }
        res.writeHead(proxyRes.statusCode, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": proxyRes.headers["content-type"] || "application/octet-stream",
        });
        proxyRes.pipe(res);
      })
      .on("error", (err) => {
        console.error(`[proxy] error: ${err.message}`);
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end(`Proxy error: ${err.message}`);
      })
      .on("timeout", () => {
        console.error(`[proxy] timeout`);
        res.writeHead(504);
        res.end("Request timeout");
      });
    return;
  }

  // API: GET /api/info
  if (pathname === "/api/info" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ subUrl: `${getBaseUrl()}/api/sub?key=${API_KEY}` }));
    return;
  }

  // API: POST /api/generate
  if (pathname === "/api/generate" && req.method === "POST") {
    const doSave = parsedUrl.searchParams.get("save") !== "false";

    (async () => {
      try {
        const body = await collectBody(req);
        const data = JSON.parse(body);
        const { headYaml, rulesYaml, proxies = [], proxyGroups = [] } = data;

        const head = headYaml ? (YAML.parse(headYaml) || {}) : {};
        const rules = rulesYaml ? (YAML.parse(rulesYaml) || {}) : {};
        const { rules: rRules, "rule-providers": rProviders, ...headRest } = { ...head, ...rules };
        const config = { ...headRest };

        if (proxies.length > 0) config.proxies = proxies;
        if (proxyGroups.length > 0) config["proxy-groups"] = proxyGroups;
        if (rRules) config.rules = rRules;
        if (rProviders) config["rule-providers"] = rProviders;

        const formatted = formatYaml(YAML.stringify(config));

        if (doSave) await fsp.writeFile(SAVED_CONFIG, formatted);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: true,
          formatted,
          size: formatted.length,
          ...(doSave ? { subUrl: `${getBaseUrl()}/api/sub?key=${API_KEY}` } : {}),
        }));
      } catch (e) {
        const status = e instanceof SyntaxError ? 400 : 500;
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    })();
    return;
  }

  // API: GET /api/sub
  if (pathname === "/api/sub") {
    const key = parsedUrl.searchParams.get("key");
    if (key !== API_KEY) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    (async () => {
      try {
        const data = await fsp.readFile(SAVED_CONFIG, "utf8");
        res.writeHead(200, {
          "Content-Type": "application/x-yaml; charset=utf-8",
          "Content-Disposition": "attachment; filename=config.yaml",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(data);
      } catch (e) {
        console.error("/api/sub read error:", e);
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Config not found. Please save from web UI first." }));
      }
    })();
    return;
  }

  // 未知路径 → 首页
  res.writeHead(302, { Location: "/" });
  res.end();
});

server.listen(PORT, "0.0.0.0", () => {
  const lanIP = getLanIP();
  const subUrl = `${getBaseUrl()}/api/sub?key=${API_KEY}`;
  console.log("");
  console.log("  Local:    http://localhost:" + PORT);
  if (lanIP) console.log("  LAN:      http://" + lanIP + ":" + PORT);
  console.log("");
  console.log("  Sub URL:  " + subUrl);
  console.log("");
});
