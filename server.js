// Tiny dependency-free dev server: serves the app and proxies Notion / Canvas API calls
// (those APIs don't allow direct browser requests from other origins).
//
//   node server.js        ->  http://localhost:5173
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 5173;
const ROOT = __dirname;
const FILES = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/style.css': 'style.css',
  '/script.js': 'script.js',
  '/integrations.js': 'integrations.js',
  '/sw.js': 'sw.js',
  '/manifest.webmanifest': 'manifest.webmanifest',
  '/icon.svg': 'icon.svg',
};
const TYPES = {
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

async function proxy(req, res, target) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = {};
  for (const name of ['authorization', 'content-type', 'notion-version']) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const upstream = await fetch(target, { method: req.method, headers, body: hasBody ? Buffer.concat(chunks) : undefined });
  const out = { 'content-type': upstream.headers.get('content-type') || 'application/json' };
  const link = upstream.headers.get('link');
  if (link) out.link = link;
  res.writeHead(upstream.status, out);
  res.end(Buffer.from(await upstream.arrayBuffer()));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith('/proxy/')) {
      // Only accept calls coming from this app itself.
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) { res.writeHead(403); return res.end('Forbidden'); }

      if (url.pathname.startsWith('/proxy/notion/v1/')) {
        return await proxy(req, res, 'https://api.notion.com' + url.pathname.slice('/proxy/notion'.length) + url.search);
      }
      if (url.pathname.startsWith('/proxy/canvas/api/v1/')) {
        const host = String(req.headers['x-canvas-host'] || '');
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/i.test(host)) { res.writeHead(400); return res.end('Bad Canvas host'); }
        return await proxy(req, res, `https://${host}` + url.pathname.slice('/proxy/canvas'.length) + url.search);
      }
      res.writeHead(404); return res.end('Not found');
    }

    const file = FILES[url.pathname];
    if (!file) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)], 'cache-control': 'no-cache' });
    fs.createReadStream(path.join(ROOT, file)).pipe(res);
  } catch (err) {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`Proxy error: ${err.message}`);
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`Personal Calendar running at http://localhost:${PORT}`));
