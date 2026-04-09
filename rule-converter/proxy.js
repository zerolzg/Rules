#!/usr/bin/env node
// proxy.js — 本地 CORS 代理 + 静态文件服务器

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const urlModule = require('url');

const PORT = 5555;
const BASE_DIR = __dirname;
const STATIC_FILES = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/app.js': 'app.js',
  '/style.css': 'style.css',
  '/head.yaml': '../Clash/Head_dns.yaml',
  '/rules.yaml': '../Clash/Rule.yaml',
};
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
};

const server = http.createServer((req, res) => {
  const parsedUrl = urlModule.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const search = parsedUrl.search || '';

  // 静态文件
  if (STATIC_FILES[pathname]) {
    const filename = STATIC_FILES[pathname];
    const filePath = path.join(BASE_DIR, filename);
    const ext = path.extname(filename);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Not found: ${pathname}`);
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
    return;
  }

  // 代理 clash 订阅请求: /proxy/<url>
  if (pathname === '/proxy') {
    const targetUrl = search ? search.slice(1) : '';
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Usage: /proxy?<subscription-url>');
      return;
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    console.log(`[proxy] GET ${decodedUrl}`);

    const protocol = decodedUrl.startsWith('https') ? https : http;
    const reqOpts = {
      headers: {
        'User-Agent': 'ClashForAndroid/2.5.12',
        'Accept': '*/*',
      },
      timeout: 30000,
    };

    protocol.get(decodedUrl, reqOpts, (proxyRes) => {
      if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode)) {
        const location = proxyRes.headers.location;
        if (location) {
          const newUrl = new urlModule.URL(location, decodedUrl).href;
          console.log(`[proxy] redirect → ${newUrl}`);
          res.writeHead(302, { Location: `/proxy?${encodeURIComponent(newUrl)}` });
          res.end();
          return;
        }
      }
      res.writeHead(proxyRes.statusCode, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
      });
      proxyRes.pipe(res);
    }).on('error', (err) => {
      console.error(`[proxy] error: ${err.message}`);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error: ${err.message}`);
    }).on('timeout', () => {
      console.error(`[proxy] timeout`);
      res.writeHead(504);
      res.end('Request timeout');
    });
    return;
  }

  // 未知路径重定向到首页
  res.writeHead(302, { Location: '/' });
  res.end();
});

server.listen(PORT, () => {
  console.log(`Server + CORS proxy listening at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in browser`);
  console.log(`Proxy: http://localhost:${PORT}/proxy?<subscription-url>`);
});
