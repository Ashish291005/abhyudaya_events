// Abhyudaya Events — zero-dependency Node server
// Serves the public site (/), the admin panel (/admin) and a small JSON API.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const CONTENT_FILE = path.join(DATA, 'content.json');
const ENQUIRY_FILE = path.join(DATA, 'enquiries.json');
const AUTH_FILE = path.join(DATA, 'auth.json');
const UPLOADS = path.join(ROOT, 'public', 'uploads');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm'
};

// ---------- storage helpers ----------
const readJSON = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; } };
const writeJSON = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2));

function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
function ensureAuth() {
  if (!fs.existsSync(AUTH_FILE)) {
    // First run: default credentials (change them from Admin → Settings).
    writeJSON(AUTH_FILE, { username: 'admin', ...hashPassword('Abhyudaya@2026') });
  }
  return readJSON(AUTH_FILE);
}
ensureAuth();
if (!fs.existsSync(CONTENT_FILE)) writeJSON(CONTENT_FILE, require('./data/default-content.js'));
if (!fs.existsSync(ENQUIRY_FILE)) writeJSON(ENQUIRY_FILE, []);

const sessions = new Map(); // token -> expiry
const SESSION_MS = 1000 * 60 * 60 * 8;

function isAuthed(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) { sessions.delete(token); return false; }
  return true;
}

// ---------- http helpers ----------
function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readBody(req, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('Payload too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function serveStatic(res, base, rel) {
  const file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.stat(file, (err, st) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    if (st.isDirectory()) return serveStatic(res, base, path.join(rel, 'index.html'));
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

// ---------- api ----------
const loginAttempts = new Map();

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/content') return send(res, 200, readJSON(CONTENT_FILE, {}));

  if (route === 'POST /api/enquiry') {
    const b = await readBody(req, 50 * 1024);
    const clean = s => String(s || '').slice(0, 2000).trim();
    if (!clean(b.name) || (!clean(b.email) && !clean(b.phone))) return send(res, 400, { error: 'Name and email or phone are required.' });
    const list = readJSON(ENQUIRY_FILE, []);
    list.unshift({ id: crypto.randomUUID(), name: clean(b.name), email: clean(b.email), phone: clean(b.phone),
      eventType: clean(b.eventType), date: clean(b.date), guests: clean(b.guests), budget: clean(b.budget),
      message: clean(b.message), status: 'new', createdAt: new Date().toISOString() });
    writeJSON(ENQUIRY_FILE, list);
    return send(res, 200, { ok: true });
  }

  if (route === 'POST /api/login') {
    const ip = req.socket.remoteAddress;
    const a = loginAttempts.get(ip) || { n: 0, t: Date.now() };
    if (Date.now() - a.t > 15 * 60 * 1000) { a.n = 0; a.t = Date.now(); }
    if (a.n >= 10) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const b = await readBody(req, 10 * 1024);
    const auth = ensureAuth();
    const ok = b.username === auth.username &&
      crypto.timingSafeEqual(Buffer.from(hashPassword(String(b.password || ''), auth.salt).hash, 'hex'), Buffer.from(auth.hash, 'hex'));
    if (!ok) { a.n++; loginAttempts.set(ip, a); return send(res, 401, { error: 'Invalid username or password.' }); }
    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_MS);
    return send(res, 200, { token });
  }

  // ---- everything below requires auth ----
  if (!isAuthed(req)) return send(res, 401, { error: 'Unauthorized' });

  if (route === 'POST /api/logout') { sessions.delete((req.headers.authorization || '').slice(7)); return send(res, 200, { ok: true }); }

  if (route === 'PUT /api/content') {
    const b = await readBody(req);
    if (typeof b !== 'object' || Array.isArray(b)) return send(res, 400, { error: 'Invalid content' });
    // refuse saves made from an out-of-date copy, so one admin tab can't wipe newer changes
    const cur = readJSON(CONTENT_FILE, {});
    if ((b._rev || 0) !== (cur._rev || 0)) return send(res, 409, { error: 'stale', rev: cur._rev || 0 });
    b._rev = (cur._rev || 0) + 1;
    // keep a rolling backup
    fs.copyFileSync(CONTENT_FILE, path.join(DATA, 'content.backup.json'));
    writeJSON(CONTENT_FILE, b);
    return send(res, 200, { ok: true, rev: b._rev });
  }

  if (route === 'GET /api/enquiries') return send(res, 200, readJSON(ENQUIRY_FILE, []));

  const m = url.pathname.match(/^\/api\/enquiries\/([\w-]+)$/);
  if (m && (req.method === 'PATCH' || req.method === 'DELETE')) {
    let list = readJSON(ENQUIRY_FILE, []);
    if (req.method === 'DELETE') list = list.filter(e => e.id !== m[1]);
    else { const b = await readBody(req, 10 * 1024); list = list.map(e => e.id === m[1] ? { ...e, status: String(b.status || e.status) } : e); }
    writeJSON(ENQUIRY_FILE, list);
    return send(res, 200, { ok: true });
  }

  if (route === 'POST /api/upload') {
    const b = await readBody(req);
    const mt = String(b.data || '').match(/^data:(image\/(png|jpe?g|webp|gif|svg\+xml)|video\/(mp4|webm));base64,(.+)$/);
    if (!mt) return send(res, 400, { error: 'Only images (png/jpg/webp/gif/svg) or videos (mp4/webm) are allowed.' });
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'video/mp4': 'mp4', 'video/webm': 'webm' }[mt[1]];
    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS, name), Buffer.from(mt[4], 'base64'));
    return send(res, 200, { url: `/uploads/${name}` });
  }

  if (route === 'POST /api/password') {
    const b = await readBody(req, 10 * 1024);
    const auth = ensureAuth();
    const cur = hashPassword(String(b.current || ''), auth.salt).hash;
    if (cur !== auth.hash) return send(res, 400, { error: 'Current password is incorrect.' });
    if (String(b.next || '').length < 8) return send(res, 400, { error: 'New password must be at least 8 characters.' });
    writeJSON(AUTH_FILE, { username: String(b.username || auth.username).trim() || auth.username, ...hashPassword(String(b.next)) });
    sessions.clear();
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'Not found' });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname === '/admin') { res.writeHead(301, { Location: '/admin/' }); return res.end(); }
    if (url.pathname.startsWith('/admin/')) return serveStatic(res, path.join(ROOT, 'admin'), decodeURIComponent(url.pathname.slice(7)));
    return serveStatic(res, path.join(ROOT, 'public'), decodeURIComponent(url.pathname));
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}).listen(PORT, () => console.log(`Abhyudaya Events running → http://localhost:${PORT}  (admin: /admin)`));
