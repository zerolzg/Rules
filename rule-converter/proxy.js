#!/usr/bin/env node
// proxy.js — 本地 CORS 代理 + 静态文件服务器

const http = require("http");
const https = require("https");
const fsp = require("fs").promises;
const path = require("path");
const urlModule = require("url");
const os = require("os");
const YAML = require("yaml");

const PORT = 5555;
const BASE_DIR = __dirname;
const API_KEY = "123456";
// 订阅地址对外访问的根 URL
//   - "auto": 自动检测局域网 IP（默认，适合有公网IP的家用/办公机器）
//   - http://localhost:PORT: 仅本地开发
//   - http://<公网IP>:PORT: VPS 或手动指定
const SERVER_BASE_URL = "auto";
const SAVED_CONFIG = path.join(BASE_DIR, "config.yaml");
const STATIC_FILES = {
  "/": "index.html",
  "/index.html": "index.html",
  "/app.js": "app.js",
  "/style.css": "style.css",
  "/head.yaml": "../Clash/Head_dns.yaml",
  "/rules.yaml": "../Clash/Rule.yaml",
};
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
};

function formatYaml(text) {
  // 标准化：先 stringify 再 parseDocument，抹平已有的 flow/block 混用
  const normalized = YAML.stringify(YAML.parse(text, { maxAliasCount: -1 }));
  const doc = YAML.parseDocument(normalized, {
    merge: true,
    maxAliasCount: -1,
  });

  // 增加 keyName 参数，用于记录父节点的 key
  function processNode(node, keyName = null) {
    if (YAML.isSeq(node)) {
      // 把数组中是映射的元素转成 flow map (处理 proxies, proxy-groups)
      node.items = node.items.map((item) => {
        if (YAML.isMap(item)) {
          const flowMap = new YAML.YAMLMap();
          flowMap.flow = true;
          for (const pair of item.items) flowMap.items.push(pair);
          return flowMap;
        }
        return item;
      });
      // forEach 处理 seq 里可能嵌套的 seq（如 proxies 里有内嵌 seq 的情况）
      node.items.forEach((item) => processNode(item, keyName));
    } else if (YAML.isMap(node)) {
      node.items.forEach((pair) => {
        const currentKey = pair.key ? pair.key.value : null;

        // 【新增逻辑】如果当前处于 rule-providers 或 proxy-providers 节点下
        // 且子节点的值是一个 Map (例如 AdBlock 下面的对象)
        if (
          (keyName === "rule-providers" || keyName === "proxy-providers") &&
          YAML.isMap(pair.value)
        ) {
          const flowMap = new YAML.YAMLMap();
          flowMap.flow = true; // 设为内联花括号格式
          for (const p of pair.value.items) flowMap.items.push(p);
          pair.value = flowMap;
        }

        // 继续往下递归，并将当前的 key 传下去
        processNode(pair.value, currentKey);
      });
    }
  }

  if (!doc.contents) return text;
  // 根节点没有父级 key，所以初始传 null
  processNode(doc.contents);
  return doc.toString({ lineWidth: Infinity });
}

function getLanIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

function getBaseUrl() {
  if (SERVER_BASE_URL !== "auto") return SERVER_BASE_URL;
  const lan = getLanIP();
  return lan ? `http://${lan}:${PORT}` : `http://localhost:${PORT}`;
}

// 收集请求 body
function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = urlModule.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const search = parsedUrl.search || "";

  // 静态文件
  if (STATIC_FILES[pathname]) {
    const filename = STATIC_FILES[pathname];
    const filePath = path.join(BASE_DIR, filename);
    const ext = path.extname(filename);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    (async () => {
      try {
        const data = await fsp.readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
        res.end(data);
      } catch (_) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`Not found: ${pathname}`);
      }
    })();
    return;
  }

  // 代理 clash 订阅请求: /proxy/<url>
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
            const newUrl = new urlModule.URL(location, decodedUrl).href;
            console.log(`[proxy] redirect → ${newUrl}`);
            res.writeHead(302, {
              Location: `/proxy?${encodeURIComponent(newUrl)}`,
            });
            res.end();
            return;
          }
        }
        res.writeHead(proxyRes.statusCode, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type":
            proxyRes.headers["content-type"] || "application/octet-stream",
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

  // API: GET /api/info — 返回订阅地址（无需认证，随时可查）
  if (pathname === "/api/info" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ subUrl: `${getBaseUrl()}/api/sub?key=${API_KEY}` }),
    );
    return;
  }

  // API: POST /api/generate — 构建 + 格式化 YAML
  // query: ?save=false 不写入服务器，仅返回格式化结果
  if (pathname === "/api/generate" && req.method === "POST") {
    const doSave = parsedUrl.query.save !== 'false';

    (async () => {
      try {
        const body = await collectBody(req);
        const data = JSON.parse(body);
        const { headYaml, rulesYaml, proxies = [], proxyGroups = [] } = data;

        const head = headYaml ? (YAML.parse(headYaml) || {}) : {};
        const rules = rulesYaml ? (YAML.parse(rulesYaml) || {}) : {};
        const { rules: rRules, 'rule-providers': rProviders, ...headRest } = { ...head, ...rules };
        const config = { ...headRest };

        if (proxies.length > 0) config.proxies = proxies;
        if (proxyGroups.length > 0) config['proxy-groups'] = proxyGroups;
        if (rRules) config.rules = rRules;
        if (rProviders) config['rule-providers'] = rProviders;

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

  // API: GET /api/sub — 下载已保存的 config.yaml
  if (pathname === "/api/sub") {
    const { key } = parsedUrl.query;
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
      } catch (_) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Config not found. Please save from web UI first." }));
      }
    })();
    return;
  }

  // 未知路径重定向到首页
  res.writeHead(302, { Location: "/" });
  res.end();
});

server.listen(PORT, "0.0.0.0", () => {
  const lanIP = getLanIP();
  const subUrl = `${getBaseUrl()}/api/sub?key=${API_KEY}`;
  console.log("");
  console.log("  Local:    http://localhost:" + PORT);
  if (lanIP) {
    console.log("  LAN:      http://" + lanIP + ":" + PORT);
  }
  console.log("");
  console.log("  Sub URL:  " + subUrl);
  console.log("");
});
