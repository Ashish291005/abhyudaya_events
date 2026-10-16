// Local preview server for Abhyudaya Events.
// In production the site is static files on Vercel (see vercel.json) and all data lives in Supabase.
// This only serves public/ locally, with the same security headers as vercel.json.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public');
const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm'
};

// apply vercel.json header rules (later rules override earlier ones), minus HTTPS-only headers
function headersFor(urlPath) {
  const out = {};
  for (const rule of vercel.headers) {
    if (!new RegExp(`^${rule.source}$`).test(urlPath)) continue;
    for (const { key, value } of rule.headers) out[key] = value;
  }
  delete out['Strict-Transport-Security'];
  if (out['Content-Security-Policy']) out['Content-Security-Policy'] = out['Content-Security-Policy'].replace(/; upgrade-insecure-requests/, '');
  return out;
}

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  const base = path.join(ROOT, clean);
  if (!base.startsWith(ROOT)) return null;
  for (const f of [base, `${base}.html`, path.join(base, 'index.html')]) {
    try { if (fs.statSync(f).isFile()) return f; } catch {}
  }
  return null;
}

http.createServer((req, res) => {
  const urlPath = new URL(req.url, 'http://localhost').pathname;
  const file = resolve(urlPath);
  const headers = headersFor(urlPath);
  if (!file) { res.writeHead(404, { ...headers, 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  res.writeHead(200, { ...headers, 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': headers['Cache-Control'] || 'no-cache' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Abhyudaya Events preview → http://localhost:${PORT}  (admin: /admin)`));
