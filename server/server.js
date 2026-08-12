#!/usr/bin/env node
// ============================================================
// FazaCloud — platform website sekolah multi-tenant
// Node.js 18+, TANPA dependency eksternal.
//
// - /                 -> landing page produk
// - /index.html dst   -> situs sekolah utama (tenant "utama", data.json)
// - /t/<slug>/...     -> situs sekolah milik tenant (per-lembaga)
// - /api/...          -> API (tenant-aware via header X-Tenant atau path /t/<slug>)
//
// Data utama : server/data.json
// Data tenant: server/tenants/<slug>.json
// Jalankan   : node server/server.js
// ============================================================
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(__dirname, "data.json");
const TENANT_DIR = path.join(__dirname, "tenants");
const PORT = process.env.PORT || 8000;

const ENV_EMAIL = process.env.ADMIN_EMAIL || "admin@smanusantara.sch.id";
const ENV_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

if (!fs.existsSync(TENANT_DIR)) fs.mkdirSync(TENANT_DIR, { recursive: true });

// ---------- Default content (dipakai untuk seed tenant baru) ----------
function defaultContent(namaSekolah, inisial, email) {
  return {
    identitas: {
      namaSekolah: namaSekolah || "SMA NUSANTARA",
      inisial: inisial || "SN",
      tagline: "Prestasi · Akhlak · Masa Depan",
      akreditasi: "Terakreditasi A",
      telepon: "(021) 555-1234",
      email: email || "info@sekolah.sch.id",
      alamat: "Jl. Pendidikan No. 1",
      tahunBerdiri: 1985,
      ppdbLabel: "PPDB 2024"
    },
    tema: { aktif: "nusantara", kustom: null, heroGambar: "", footerSize: "normal" },
    artikel: null,
    galeri: null,
    guru: null,
    statistik: null,
    sambutan: null,
    ppdb: null,
    fasilitas: null,
    pendaftar: [],
    pesan: [],
    admin: { email: email || ENV_EMAIL, password: ENV_PASSWORD }
  };
}

// ---------- Storage utama (berisi daftar tenant + konten situs utama) ----------
let db = null;
function loadData() {
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    db = defaultContent();
    db.tenants = [];
    saveData();
  }
  if (!db.tenants) db.tenants = [];
  if (!db.admin) db.admin = { email: ENV_EMAIL, password: ENV_PASSWORD };
}
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}
loadData();

// ---------- Storage per-tenant (lazy load + cache) ----------
const tenantCache = new Map(); // slug -> data
function tenantFile(slug) { return path.join(TENANT_DIR, slug + ".json"); }
function loadTenant(slug) {
  if (tenantCache.has(slug)) return tenantCache.get(slug);
  try {
    const d = JSON.parse(fs.readFileSync(tenantFile(slug), "utf8"));
    tenantCache.set(slug, d);
    return d;
  } catch (e) { return null; }
}
function saveTenant(slug, data) {
  tenantCache.set(slug, data);
  fs.writeFileSync(tenantFile(slug), JSON.stringify(data, null, 2), "utf8");
}
function tenantExists(slug) {
  return fs.existsSync(tenantFile(slug));
}

// ---------- Auth ----------
const sessions = new Map(); // token -> { email, slug, exp }
function makeToken(email, slug) {
  const t = crypto.randomBytes(24).toString("hex");
  sessions.set(t, { email, slug, exp: Date.now() + 1000 * 60 * 60 * 12 });
  return t;
}
function authInfo(req) {
  const h = req.headers.authorization || "";
  const t = h.replace(/^Bearer\s+/i, "");
  const s = sessions.get(t);
  if (!s) return null;
  if (Date.now() > s.exp) { sessions.delete(t); return null; }
  return s;
}

// ---------- Helpers ----------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8"
};

function send(res, code, body, type = "application/json; charset=utf-8") {
  res.writeHead(code, {
    "Content-Type": type,
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  });
  if (Buffer.isBuffer(body)) return res.end(body);
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => { b += c; if (b.length > 5e6) req.destroy(); });
    req.on("end", () => {
      try { resolve(JSON.parse(b || "{}")); } catch (e) { resolve({}); }
    });
  });
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

// ---------- Rate limiting ----------
const rateLimitMap = new Map(); // key -> { count, resetAt }
function rateLimit(key, maxPerMinute) {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + 60000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60000; }
  entry.count++;
  rateLimitMap.set(key, entry);
  return entry.count > maxPerMinute;
}

// ---------- Password hash (sha256 + salt sederhana, tanpa dep eksternal) ----------
function hashPassword(plain) {
  return crypto.createHash("sha256").update("fazacloud:" + plain).digest("hex");
}
function verifyPassword(plain, hashed) {
  // dukung plaintext lama (migrasi) dan hash baru
  if (hashed.length === 64) return hashPassword(plain) === hashed;
  return plain === hashed; // plaintext legacy
}

// ---------- Sanitasi teks untuk mencegah XSS di JSON output ----------
function sanitize(s) {
  return String(s || "").replace(/[<>'"]/g, c => ({ "<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;" }[c]));
}

// Tentukan konteks tenant dari URL path (/t/<slug>/...) atau header X-Tenant
function resolveTenant(url, req) {
  // path /t/<slug>/...
  const m = url.pathname.match(/^\/t\/([a-z0-9-]+)/);
  if (m) return m[1];
  // header
  const h = req.headers["x-tenant"];
  if (h && tenantExists(h)) return h;
  return null; // null = situs utama
}

// Ambil "database konten" untuk konteks (utama atau tenant)
function contentDb(slug) {
  if (!slug) return db;
  return loadTenant(slug);
}

// ---------- API ----------
async function handleApi(req, res, url) {
  const route = url.pathname;
  const method = req.method;
  // buang prefix /t/<slug> dari route supaya handler tetap sederhana
  const slug = resolveTenant(url, req);
  const cleanRoute = route.replace(/^\/t\/[a-z0-9-]+/, "") || "/";
  const parts = cleanRoute.split("/").filter(Boolean);
  const resource = parts[1] || "";

  const cdb = contentDb(slug);
  if (slug && !cdb) return send(res, 404, { ok: false, error: "Tenant tidak ditemukan" });

  // ---- LOGIN (tenant-aware) ----
  if (cleanRoute === "/api/login" && method === "POST") {
    const ip = req.socket.remoteAddress || "unknown";
    if (rateLimit("login:" + ip, 10)) return send(res, 429, { ok: false, error: "Terlalu banyak percobaan. Coba lagi 1 menit." });
    const body = await readBody(req);
    if (cdb.admin && body.email === cdb.admin.email && verifyPassword(body.password, cdb.admin.password)) {
      return send(res, 200, { ok: true, token: makeToken(body.email, slug), email: body.email, tenant: slug });
    }
    return send(res, 401, { ok: false, error: "Email atau kata sandi salah." });
  }

  // ---- GET konten publik ----
  if (method === "GET" && ["identitas", "tema", "artikel", "galeri", "guru", "statistik", "sambutan", "ppdb", "fasilitas"].includes(resource)) {
    return send(res, 200, { ok: true, data: cdb[resource] });
  }

  // ---- Submit form publik ----
  if (cleanRoute === "/api/pendaftar" && method === "POST") {
    const body = await readBody(req);
    const d = Object.assign({}, body, { id: "PDB-" + Date.now(), status: "baru", waktu: new Date().toISOString() });
    cdb.pendaftar = cdb.pendaftar || [];
    cdb.pendaftar.unshift(d);
    slug ? saveTenant(slug, cdb) : saveData();
    return send(res, 200, { ok: true, data: d });
  }
  if (cleanRoute === "/api/pesan" && method === "POST") {
    const body = await readBody(req);
    const m = Object.assign({}, body, { id: "MSG-" + Date.now(), waktu: new Date().toISOString(), dibaca: false });
    cdb.pesan = cdb.pesan || [];
    cdb.pesan.unshift(m);
    slug ? saveTenant(slug, cdb) : saveData();
    return send(res, 200, { ok: true, data: m });
  }

  // ---- CEK SUBDOMAIN (publik) ----
  if (cleanRoute === "/api/cek-subdomain" && method === "GET") {
    const nama = (url.searchParams.get("nama") || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!nama) return send(res, 400, { ok: false, error: "nama wajib" });
    const reserved = ["www", "admin", "api", "mail", "ftp", "app", "portal", "t"].includes(nama);
    const terpakai = db.tenants.some((t) => t.subdomain === nama) || tenantExists(nama);
    return send(res, 200, { ok: true, tersedia: !terpakai && !reserved, subdomain: nama + ".fazacloud.web.id" });
  }

  // ---- REGISTER TENANT BARU (publik) -> BUAT INSTANCE ----
  if (cleanRoute === "/api/register" && method === "POST") {
    const ip = req.socket.remoteAddress || "unknown";
    if (rateLimit("register:" + ip, 5)) return send(res, 429, { ok: false, error: "Terlalu banyak pendaftaran. Coba lagi 1 menit." });
    const body = await readBody(req);
    const namaLembaga = String(body.namaLembaga || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 120);
    const password = String(body.password || "").slice(0, 72);
    const tipeDomain = body.tipeDomain === "custom" ? "custom" : "subdomain";
    const subdomain = String(body.subdomain || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    const domainCustom = String(body.domainCustom || "").toLowerCase().trim().slice(0, 120);

    if (!namaLembaga) return send(res, 400, { ok: false, error: "Nama lembaga wajib diisi." });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { ok: false, error: "Email tidak valid." });
    if (password.length < 6) return send(res, 400, { ok: false, error: "Kata sandi minimal 6 karakter." });
    if (db.tenants.some((t) => t.email === email)) return send(res, 400, { ok: false, error: "Email sudah terdaftar." });

    let slug = "";
    let domain = "";
    if (tipeDomain === "subdomain") {
      if (!subdomain) return send(res, 400, { ok: false, error: "Subdomain wajib diisi." });
      const reserved = ["www", "admin", "api", "mail", "ftp", "app", "portal", "t"].includes(subdomain);
      if (reserved || db.tenants.some((t) => t.subdomain === subdomain) || tenantExists(subdomain)) {
        return send(res, 400, { ok: false, error: "Subdomain sudah dipakai. Pilih nama lain." });
      }
      slug = subdomain;
      domain = subdomain + ".fazacloud.web.id";
    } else {
      if (!domainCustom || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domainCustom)) return send(res, 400, { ok: false, error: "Domain custom tidak valid." });
      if (db.tenants.some((t) => t.domain === domainCustom)) return send(res, 400, { ok: false, error: "Domain sudah terdaftar." });
      slug = slugify(domainCustom.split(".")[0]) || "tenant" + Date.now();
      // pastikan slug unik
      let s = slug, i = 2;
      while (tenantExists(s)) { s = slug + "-" + i; i++; }
      slug = s;
      domain = domainCustom;
    }

    // BUAT INSTANCE: seed konten tenant, hash password
    const inisial = namaLembaga.split(/\s+/).map((w) => w[0]).join("").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3) || "SCH";
    const content = defaultContent(namaLembaga, inisial, email);
    content.admin.password = hashPassword(password);
    saveTenant(slug, content);

    const tenant = {
      id: "TNT-" + Date.now(),
      slug: slug,
      namaLembaga: namaLembaga,
      email: email,
      tipeDomain: tipeDomain,
      subdomain: tipeDomain === "subdomain" ? subdomain : null,
      domain: domain,
      status: "aktif",
      dibuat: new Date().toISOString()
    };
    db.tenants.push(tenant);
    saveData();

    return send(res, 200, { ok: true, data: { id: tenant.id, slug: slug, namaLembaga: namaLembaga, domain: domain, email: email, url: "/t/" + slug + "/" } });
  }

  // ---- GANTI PASSWORD (tenant-aware, butuh auth) ----
  if (cleanRoute === "/api/ganti-password" && method === "POST") {
    const auth = authInfo(req);
    if (!auth) return send(res, 401, { ok: false, error: "Unauthorized" });
    const tdb = contentDb(auth.slug);
    if (!tdb) return send(res, 404, { ok: false, error: "Tenant tidak ditemukan" });
    const body = await readBody(req);
    if (!body.passwordLama || !body.passwordBaru) return send(res, 400, { ok: false, error: "passwordLama & passwordBaru wajib" });
    if (body.passwordLama !== tdb.admin.password && !verifyPassword(body.passwordLama, tdb.admin.password)) return send(res, 400, { ok: false, error: "Kata sandi lama salah." });
    if (String(body.passwordBaru).length < 6) return send(res, 400, { ok: false, error: "Kata sandi baru minimal 6 karakter." });
    tdb.admin.password = hashPassword(String(body.passwordBaru));
    auth.slug ? saveTenant(auth.slug, tdb) : saveData();
    return send(res, 200, { ok: true });
  }

  // ---- Daftar tenant (hanya admin utama) ----
  if (cleanRoute === "/api/tenants" && method === "GET") {
    const auth = authInfo(req);
    if (!auth || auth.slug) return send(res, 401, { ok: false, error: "Unauthorized (admin utama saja)" });
    const safe = db.tenants.map((t) => ({ id: t.id, slug: t.slug, namaLembaga: t.namaLembaga, email: t.email, domain: t.domain, status: t.status, dibuat: t.dibuat }));
    return send(res, 200, { ok: true, data: safe });
  }

  // ---- Semua endpoint konten lain butuh auth & scoped ke tenant auth ----
  const auth = authInfo(req);
  if (!auth) return send(res, 401, { ok: false, error: "Unauthorized" });
  // gunakan konteks dari token (bukan dari URL), supaya tenant hanya bisa edit miliknya
  const scopedSlug = auth.slug;
  const tdb = contentDb(scopedSlug);
  if (!tdb) return send(res, 404, { ok: false, error: "Tenant tidak ditemukan" });

  if (method === "GET" && ["pendaftar", "pesan"].includes(resource)) {
    return send(res, 200, { ok: true, data: tdb[resource] || [] });
  }

  if (method === "PUT" && ["identitas", "tema", "artikel", "galeri", "guru", "statistik", "sambutan", "ppdb", "fasilitas", "pendaftar", "pesan"].includes(resource)) {
    const body = await readBody(req);
    tdb[resource] = body.data;
    scopedSlug ? saveTenant(scopedSlug, tdb) : saveData();
    return send(res, 200, { ok: true });
  }

  if (cleanRoute === "/api/reset" && method === "POST") {
    const keep = tdb;
    const fresh = defaultContent(tdb.identitas && tdb.identitas.namaSekolah, tdb.identitas && tdb.identitas.inisial, tdb.admin.email);
    fresh.admin.password = tdb.admin.password;
    fresh.pesan = keep.pesan;
    fresh.pendaftar = keep.pendaftar;
    if (scopedSlug) { saveTenant(scopedSlug, fresh); } else { const t = db.tenants; db = Object.assign(fresh, { tenants: t }); saveData(); }
    return send(res, 200, { ok: true });
  }

  if (cleanRoute === "/api/upload" && method === "POST") {
    const body = await readBody(req);
    if (!body.filename || !body.dataBase64) return send(res, 400, { ok: false, error: "filename & dataBase64 wajib" });
    const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase().slice(0, 80);
    const buf = Buffer.from(body.dataBase64, "base64");
    if (buf.length > 3e6) return send(res, 400, { ok: false, error: "Maks 3MB" });
    // Validasi magic bytes (bukan hanya ekstensi)
    const magic = buf.slice(0, 4);
    const isJpeg = magic[0] === 0xFF && magic[1] === 0xD8;
    const isPng  = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47;
    const isWebp = buf.slice(0,4).toString() === "RIFF" && buf.slice(8,12).toString() === "WEBP";
    const isGif  = buf.slice(0,3).toString() === "GIF";
    if (!isJpeg && !isPng && !isWebp && !isGif) return send(res, 400, { ok: false, error: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." });
    // Tambahkan ekstensi yang benar
    const ext = isJpeg ? ".jpg" : isPng ? ".png" : isWebp ? ".webp" : ".gif";
    const baseName = safeName.replace(/\.[^.]+$/, "") + "-" + Date.now() + ext;
    const dest = path.join(ROOT, "assets", "img", baseName);
    fs.writeFileSync(dest, buf);
    return send(res, 200, { ok: true, path: "assets/img/" + baseName });
  }

  return send(res, 404, { ok: false, error: "Endpoint tidak ditemukan" });
}

// ---------- Static ----------
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);

  // Tenant site: /t/<slug>/... -> sajikan file yang sama dari ROOT,
  // tapi frontend akan otomatis memakai konten tenant lewat prefix /t/<slug> pada API.
  const tm = p.match(/^\/t\/([a-z0-9-]+)(\/.*)?$/);
  if (tm) {
    const slug = tm[1];
    if (!tenantExists(slug)) return send(res, 404, "Sekolah tidak ditemukan", "text/plain");
    let rest = tm[2] || "/";
    if (rest === "/") rest = "/index.html";
    p = rest; // sajikan file bersama; JS membaca slug dari location.pathname
  } else {
    if (p === "/") p = "/landing.html";
    if (p.endsWith("/")) p += "index.html";
  }

  const filePath = path.normalize(path.join(ROOT, p));
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden", "text/plain");
  // Blokir akses langsung ke direktori sensitif
  const blocked = ["/server/", "/node_modules/", "/.git/", "/assets/js/admin-"];
  if (blocked.some(b => filePath.replace(ROOT, "").startsWith(b))) {
    return send(res, 403, "Forbidden", "text/plain");
  }
  const isTenantPage = /^\/t\/[a-z0-9-]+\//.test(decodeURIComponent(url.pathname));
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (!path.extname(p)) {
        const idx = path.join(ROOT, p, "index.html");
        return fs.readFile(idx, (e2, d2) => {
          if (e2) return send(res, 404, "404 Not Found", "text/plain");
          send(res, 200, d2, "text/html; charset=utf-8");
        });
      }
      return send(res, 404, "404 Not Found", "text/plain");
    }
    // inject <base href="/"> untuk halaman tenant supaya asset relatif benar
    if (isTenantPage && filePath.endsWith(".html")) {
      let html = data.toString("utf8");
      if (!/<base /i.test(html)) {
        html = html.replace(/<head>/i, '<head><base href="/">');
      }
      return send(res, 200, html, "text/html; charset=utf-8");
    }
    send(res, 200, data, MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://" + req.headers.host);
  if (url.pathname.startsWith("/api/") || url.pathname.match(/^\/t\/[a-z0-9-]+\/api\//)) {
    return handleApi(req, res, url);
  }
  serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log("================================================");
  console.log("  FazaCloud — platform website sekolah berjalan");
  console.log("  Landing page : http://localhost:" + PORT);
  console.log("  Demo sekolah : http://localhost:" + PORT + "/index.html");
  console.log("  Daftar       : http://localhost:" + PORT + "/register.html");
  console.log("  Admin utama  : " + db.admin.email);
  console.log("  Tenant       : " + db.tenants.length + " lembaga");
  console.log("================================================");
});
