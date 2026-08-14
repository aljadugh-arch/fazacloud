"use strict";
const crypto = require("crypto");

const jurnalSessions = new Map();
const rateMap = new Map();
const ROLE_KEYS = ["admin", "guru", "siswa", "wali", "kasir"];
const COLLECTIONS = ["kelas","jadwal","absensi_siswa","absensi_ekskul","absensi_jamaah","absensi_kegiatan","absensi_kokurikuler","ceklok_guru","jurnal_mengajar","penilaian","tagihan","tabungan","produk_kanteen","transaksi_kanteen","mapel","tahun_ajaran","posting","catatan_kepribadian","modul_ajar","supervisi","broadcast","settings_jurnal","backup_jurnal","wali_kelas","pengajar","rapor","beasiswa","kalender_kbm","wa_gateway","notif_settings","ekskul","domain_setup","erkam","superadmin","perpustakaan","kelulusan"];
const PREFIX = { guru:"GRU", siswa:"SIS", wali:"WLI", kasir:"KSR", kelas:"KLS", jadwal:"JDW", absensi_siswa:"ABS", absensi_ekskul:"EKS", absensi_jamaah:"JMH", absensi_kegiatan:"KGT", ceklok_guru:"CLK", jurnal_mengajar:"JMG", penilaian:"NIL", tagihan:"TGH", tabungan:"TAB", produk_kanteen:"PRD", transaksi_kanteen:"TRX" };

function send(res, code, body, type = "application/json; charset=utf-8") {
  res.writeHead(code, {
    "Content-Type": type,
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise(resolve => {
    let b = "";
    req.on("data", c => { b += c; if (b.length > 5e6) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
  });
}
function hashPassword(plain) { return crypto.createHash("sha256").update("fazacloud:" + String(plain || "")).digest("hex"); }
function verifyPassword(plain, stored) { return String(stored || "").length === 64 ? hashPassword(plain) === stored : String(plain || "") === String(stored || ""); }
function id(prefix) { return (prefix || "JRN") + "-" + Date.now() + "-" + crypto.randomBytes(2).toString("hex"); }
function today() { return new Date().toISOString().slice(0, 10); }
function nowIso() { return new Date().toISOString(); }
function asMoney(n) { n = Number(n || 0); return Number.isFinite(n) ? n : 0; }
function rateLimit(key, max) {
  const n = Date.now();
  const e = rateMap.get(key) || { count: 0, resetAt: n + 60000 };
  if (n > e.resetAt) { e.count = 0; e.resetAt = n + 60000; }
  e.count++;
  rateMap.set(key, e);
  return e.count > max;
}
function initJurnalData(tdb) {
  if (!tdb.users) tdb.users = { guru: [], siswa: [], wali: [], kasir: [] };
  ROLE_KEYS.forEach(k => { if (!Array.isArray(tdb.users[k])) tdb.users[k] = []; });
  COLLECTIONS.forEach(k => { if (!Array.isArray(tdb[k])) tdb[k] = []; });
  seedDemo(tdb);
  return tdb;
}
function seedDemo(tdb) {
  // ponytail: demo user minimal; replace with admin CRUD/import when production data ready.
  if (!tdb.users.guru.length) tdb.users.guru.push({ id:"GRU-DEMO", nama:"Guru Demo", nip:"-", email:"guru@demo.sch.id", password:hashPassword("guru123"), mapel:["Matematika"], aktif:true });
  if (!tdb.users.siswa.length) tdb.users.siswa.push({ id:"SIS-DEMO", nama:"Siswa Demo", nis:"001", kelas:"X-A", jurusan:"", email:"siswa@demo.sch.id", password:hashPassword("siswa123"), qr_token:"SIS-DEMO-QR", wali_id:"WLI-DEMO", saldo_kanteen:50000, aktif:true });
  if (!tdb.users.wali.length) tdb.users.wali.push({ id:"WLI-DEMO", nama:"Wali Demo", email:"wali@demo.sch.id", password:hashPassword("wali123"), siswa_ids:["SIS-DEMO"] });
  if (!tdb.users.kasir.length) tdb.users.kasir.push({ id:"KSR-DEMO", nama:"Kasir Demo", email:"kasir@demo.sch.id", password:hashPassword("kasir123") });
  if (!tdb.kelas.length) tdb.kelas.push({ id:"KLS-DEMO", nama:"X-A", tingkat:"X", jurusan:"", wali_kelas_id:"GRU-DEMO" });
  if (!tdb.jadwal.length) tdb.jadwal.push({ id:"JDW-DEMO", kelas_id:"KLS-DEMO", hari:"Senin", jam_ke:1, jam_mulai:"07:00", jam_selesai:"08:30", mapel:"Matematika", guru_id:"GRU-DEMO", ruang:"R1" });
  if (!tdb.produk_kanteen.length) tdb.produk_kanteen.push({ id:"PRD-DEMO", nama:"Nasi Goreng", harga:10000, stok:50, kategori:"Makanan", aktif:true });
}
function tokenFor(role, user, slug) {
  const token = crypto.randomBytes(24).toString("hex");
  jurnalSessions.set(token, { role, id:user.id, nama:user.nama, slug, exp:Date.now() + 1000*60*60*12 });
  return token;
}
function auth(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const s = jurnalSessions.get(token);
  if (!s) return null;
  if (Date.now() > s.exp) { jurnalSessions.delete(token); return null; }
  return s;
}
function requireRole(req, roles) { const a = auth(req); return a && roles.includes(a.role) ? a : null; }
function page(url, arr) {
  const p = Math.max(1, Number(url.searchParams.get("page") || 1));
  const l = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  return arr.slice((p-1)*l, p*l);
}
function save(slug, tdb, saveFn) { saveFn(slug, tdb); }
function stripPassword(u) { const x = Object.assign({}, u); delete x.password; return x; }
function getUser(tdb, role, idv) { return (tdb.users[role] || []).find(x => x.id === idv); }
function siswaByAny(tdb, key) { return tdb.users.siswa.find(s => s.id === key || s.qr_token === key); }
function enrichAbsensi(tdb, rows) {
  return rows.map(r => { const s = getUser(tdb,"siswa",r.siswa_id) || {}; return Object.assign({}, r, { siswa_nama:s.nama || r.siswa_id, kelas:s.kelas || r.kelas }); });
}
function filterRows(url, rows, keys) {
  return rows.filter(r => keys.every(k => !url.searchParams.get(k) || String(r[k]) === String(url.searchParams.get(k))));
}
async function crudList(req, res, url, slug, tdb, saveFn, collection, roles) {
  const a = requireRole(req, roles); if (!a) return send(res, 401, { ok:false, error:"Unauthorized" });
  const method = req.method;
  const parts = url.pathname.replace(/^\/t\/[a-z0-9-]+/, "").split("/").filter(Boolean);
  const itemId = parts[parts.length - 1] !== collection.replace(/_/g,"-") ? parts[parts.length - 1] : null;
  const arr = tdb[collection];
  if (method === "GET") return send(res, 200, { ok:true, data:page(url, filterRows(url, arr, ["siswa_id","guru_id","kelas_id","tanggal","status","mapel","semester","hari"])) });
  const body = await readBody(req);
  if (method === "POST") { const row = Object.assign({ id:id(PREFIX[collection]), dibuat:nowIso() }, body); arr.unshift(row); save(slug, tdb, saveFn); return send(res, 200, { ok:true, data:row }); }
  if (!itemId) return send(res, 400, { ok:false, error:"ID wajib" });
  const idx = arr.findIndex(x => x.id === itemId); if (idx < 0) return send(res, 404, { ok:false, error:"Data tidak ditemukan" });
  if (method === "PUT") { arr[idx] = Object.assign({}, arr[idx], body); save(slug, tdb, saveFn); return send(res, 200, { ok:true, data:arr[idx] }); }
  if (method === "DELETE") { const row = arr.splice(idx,1)[0]; save(slug, tdb, saveFn); return send(res, 200, { ok:true, data:row }); }
  return send(res, 405, { ok:false, error:"Method tidak didukung" });
}
async function users(req, res, url, slug, tdb, saveFn, role) {
  const method = req.method;
  const a = auth(req); if (!a) return send(res, 401, { ok:false, error:"Unauthorized" });
  const parts = url.pathname.replace(/^\/t\/[a-z0-9-]+/, "").split("/").filter(Boolean);
  const userId = parts[4];
  if (method === "GET" && userId && parts[5] === "qr" && role === "siswa") {
    const s = getUser(tdb,"siswa",userId); if (!s) return send(res,404,{ok:false,error:"Siswa tidak ditemukan"});
    s.qr_token = crypto.randomBytes(16).toString("hex"); save(slug, tdb, saveFn); return send(res,200,{ok:true,data:{qr_token:s.qr_token}});
  }
  if (method === "GET" && userId) { const u = getUser(tdb,role,userId); return u ? send(res,200,{ok:true,data:stripPassword(u)}) : send(res,404,{ok:false,error:"User tidak ditemukan"}); }
  if (method === "GET") return send(res,200,{ok:true,data:page(url, tdb.users[role].map(stripPassword))});
  if (!requireRole(req,["admin"])) return send(res,401,{ok:false,error:"Admin saja"});
  const body = await readBody(req);
  if (method === "POST") {
    const row = Object.assign({ id:id(PREFIX[role]), aktif:true }, body);
    if (body.password) row.password = hashPassword(body.password);
    if (role === "siswa") { row.qr_token = row.qr_token || crypto.randomBytes(16).toString("hex"); row.saldo_kanteen = asMoney(row.saldo_kanteen); }
    tdb.users[role].unshift(row); save(slug, tdb, saveFn); return send(res,200,{ok:true,data:stripPassword(row)});
  }
  const idx = tdb.users[role].findIndex(x => x.id === userId); if (idx < 0) return send(res,404,{ok:false,error:"User tidak ditemukan"});
  if (method === "PUT") { if (body.password) body.password = hashPassword(body.password); else delete body.password; tdb.users[role][idx] = Object.assign({}, tdb.users[role][idx], body); save(slug,tdb,saveFn); return send(res,200,{ok:true,data:stripPassword(tdb.users[role][idx])}); }
  if (method === "DELETE") { const u = tdb.users[role].splice(idx,1)[0]; save(slug,tdb,saveFn); return send(res,200,{ok:true,data:stripPassword(u)}); }
  return send(res,405,{ok:false,error:"Method tidak didukung"});
}
async function handleJurnal(req, res, url, slug, tdb, saveFn) {
  initJurnalData(tdb);
  const clean = url.pathname.replace(/^\/t\/[a-z0-9-]+/, "");
  const parts = clean.split("/").filter(Boolean);
  const method = req.method;
  const ip = req.socket.remoteAddress || "unknown";

  if (clean === "/api/jurnal/login" && method === "POST") {
    if (rateLimit("jlogin:" + ip, 10)) return send(res,429,{ok:false,error:"Terlalu banyak percobaan."});
    const b = await readBody(req);
    const role = ROLE_KEYS.includes(b.role) ? b.role : "";
    if (!role) return send(res,400,{ok:false,error:"Role tidak valid"});
    let u = null;
    if (role === "admin") {
      if (tdb.admin && tdb.admin.email === b.email && verifyPassword(b.password, tdb.admin.password)) u = { id:"ADMIN", nama:"Admin", email:b.email };
    } else {
      u = (tdb.users[role] || []).find(x => x.email === b.email && verifyPassword(b.password, x.password) && x.aktif !== false);
    }
    if (!u) return send(res,401,{ok:false,error:"Email atau kata sandi salah"});
    return send(res,200,{ok:true,token:tokenFor(role,u,slug),role,id:u.id,nama:u.nama,slug});
  }
  if (clean === "/api/jurnal/dashboard" && method === "GET") {
    const s = requireRole(req,["admin","guru","siswa","wali","kasir"]);
    if (!s) return send(res,401,{ok:false,error:"Unauthorized"});
    const t = today();
    const totalKantin = tdb.transaksi_kanteen.filter(x => String(x.tanggal||"").startsWith(t)).reduce((a,b)=>a+asMoney(b.total),0);
    const base = { siswa:tdb.users.siswa.length,guru:tdb.users.guru.length,absensi_hari_ini:tdb.absensi_siswa.filter(x=>x.tanggal===t).length,transaksi_kanteen_hari_ini:totalKantin,tagihan_belum_lunas:tdb.tagihan.filter(x=>x.status!=="lunas").length };
    if (s.role === "siswa") {
      const siswa = tdb.users.siswa.find(x=>x.id===s.id) || {};
      return send(res,200,{ok:true,data:{...base, ...siswa}});
    }
    if (s.role === "wali") {
      const anak = tdb.users.siswa.filter(x=>x.wali_id===s.id || x.wali_email===s.email);
      return send(res,200,{ok:true,data:{...base, anak}});
    }
    return send(res,200,{ok:true,data:base});
  }
  if (parts[2] === "users" && ROLE_KEYS.includes(parts[3])) return users(req,res,url,slug,tdb,saveFn,parts[3]);
  if (parts[2] === "kelas") return crudList(req,res,url,slug,tdb,saveFn,"kelas",["admin","guru"]);
  if (parts[2] === "jadwal") return crudList(req,res,url,slug,tdb,saveFn,"jadwal",["admin","guru","siswa","wali"]);

  if (clean === "/api/jurnal/absensi/scan" && method === "POST") {
    const a = requireRole(req,["admin","guru"]); if (!a) return send(res,401,{ok:false,error:"Unauthorized"});
    const b = await readBody(req); const s = siswaByAny(tdb, b.qr_token);
    if (!s) return send(res,404,{ok:false,error:"QR siswa tidak ditemukan"});
    const t = today(); let row = tdb.absensi_siswa.find(x => x.siswa_id === s.id && x.tanggal === t);
    if (!row) { row = { id:id("ABS"), siswa_id:s.id, tanggal:t, jenis:"hadir", jam_datang:null, jam_pulang:null, keterangan:"QR" }; tdb.absensi_siswa.unshift(row); }
    const hour = new Date().getHours(); if (!row.jam_datang || hour < 13) row.jam_datang = nowIso(); else row.jam_pulang = nowIso();
    save(slug,tdb,saveFn); return send(res,200,{ok:true,data:Object.assign({}, row, { siswa_nama:s.nama, kelas:s.kelas })});
  }
  if (parts[2] === "absensi" && parts[3] === "siswa") {
    if (method === "GET") { const a = auth(req); if (!a) return send(res,401,{ok:false,error:"Unauthorized"}); return send(res,200,{ok:true,data:page(url,enrichAbsensi(tdb,filterRows(url,tdb.absensi_siswa,["tanggal","siswa_id","kelas_id"]))) }); }
    if (!requireRole(req,["admin","guru"])) return send(res,401,{ok:false,error:"Unauthorized"});
    const b = await readBody(req); const itemId = parts[4];
    if (method === "POST") { const row = Object.assign({ id:id("ABS"), tanggal:today(), jenis:"hadir", jam_datang:nowIso(), jam_pulang:null }, b); tdb.absensi_siswa.unshift(row); save(slug,tdb,saveFn); return send(res,200,{ok:true,data:row}); }
    if (method === "PUT" && itemId) { const i=tdb.absensi_siswa.findIndex(x=>x.id===itemId); if(i<0)return send(res,404,{ok:false,error:"Data tidak ditemukan"}); tdb.absensi_siswa[i]=Object.assign({},tdb.absensi_siswa[i],b); save(slug,tdb,saveFn); return send(res,200,{ok:true,data:tdb.absensi_siswa[i]}); }
  }
  if (parts[2] === "absensi" && parts[3] === "ekskul") return crudList(req,res,url,slug,tdb,saveFn,"absensi_ekskul",["admin","guru"]);
  if (parts[2] === "absensi" && parts[3] === "jamaah") return crudList(req,res,url,slug,tdb,saveFn,"absensi_jamaah",["admin","guru"]);
  if (parts[2] === "absensi" && parts[3] === "kegiatan") return crudList(req,res,url,slug,tdb,saveFn,"absensi_kegiatan",["admin","guru"]);

  if (parts[2] === "ceklok") {
    if (method === "GET") { const a=auth(req); if(!a)return send(res,401,{ok:false,error:"Unauthorized"}); return send(res,200,{ok:true,data:page(url,filterRows(url,tdb.ceklok_guru,["tanggal","guru_id"]))}); }
    const a=requireRole(req,["admin","guru"]); if(!a)return send(res,401,{ok:false,error:"Unauthorized"}); const b=await readBody(req); const t=today(); let r=tdb.ceklok_guru.find(x=>x.guru_id===(b.guru_id||a.id)&&x.tanggal===t);
    if (method === "POST") { if(!r){r={id:id("CLK"),guru_id:b.guru_id||a.id,tanggal:t,jam_masuk:nowIso(),jam_pulang:null,status:"hadir"};tdb.ceklok_guru.unshift(r);} else r.jam_pulang=nowIso(); save(slug,tdb,saveFn); return send(res,200,{ok:true,data:r}); }
    if (method === "PUT" && parts[3]) { const i=tdb.ceklok_guru.findIndex(x=>x.id===parts[3]); if(i<0)return send(res,404,{ok:false,error:"Data tidak ditemukan"}); tdb.ceklok_guru[i]=Object.assign({},tdb.ceklok_guru[i],b); save(slug,tdb,saveFn); return send(res,200,{ok:true,data:tdb.ceklok_guru[i]}); }
  }
  if (parts[2] === "jurnal-mengajar") return crudList(req,res,url,slug,tdb,saveFn,"jurnal_mengajar",["admin","guru"]);
  if (parts[2] === "penilaian") return crudList(req,res,url,slug,tdb,saveFn,"penilaian",["admin","guru","siswa","wali"]);
  if (parts[2] === "tagihan") return crudList(req,res,url,slug,tdb,saveFn,"tagihan",["admin","wali","siswa"]);
  if (parts[2] === "tabungan") return crudList(req,res,url,slug,tdb,saveFn,"tabungan",["admin","wali","siswa"]);

  if (parts[2] === "kanteen" && parts[3] === "produk") return crudList(req,res,url,slug,tdb,saveFn,"produk_kanteen",["admin","kasir"]);
  if (parts[2] === "kanteen" && parts[3] === "saldo" && method === "GET") { const a=auth(req); if(!a)return send(res,401,{ok:false,error:"Unauthorized"}); const s=siswaByAny(tdb, parts[4]); if(!s)return send(res,404,{ok:false,error:"Siswa tidak ditemukan"}); return send(res,200,{ok:true,data:{siswa_id:s.id,nama:s.nama,saldo:asMoney(s.saldo_kanteen)}}); }
  if (clean === "/api/jurnal/kanteen/topup" && method === "POST") { if(!requireRole(req,["admin"]))return send(res,401,{ok:false,error:"Admin saja"}); const b=await readBody(req); const s=getUser(tdb,"siswa",b.siswa_id); if(!s)return send(res,404,{ok:false,error:"Siswa tidak ditemukan"}); s.saldo_kanteen=asMoney(s.saldo_kanteen)+asMoney(b.nominal); save(slug,tdb,saveFn); return send(res,200,{ok:true,data:{siswa_id:s.id,saldo:s.saldo_kanteen}}); }
  if (parts[2] === "kanteen" && parts[3] === "transaksi") {
    if (method === "GET") { const a=auth(req); if(!a)return send(res,401,{ok:false,error:"Unauthorized"}); return send(res,200,{ok:true,data:page(url,filterRows(url,tdb.transaksi_kanteen,["tanggal","siswa_id"]))}); }
    const a=requireRole(req,["admin","kasir"]); if(!a)return send(res,401,{ok:false,error:"Unauthorized"}); const b=await readBody(req); const s=siswaByAny(tdb,b.siswa_id); if(!s)return send(res,404,{ok:false,error:"Siswa tidak ditemukan"});
    const items=(b.items||[]).map(it=>{ const p=tdb.produk_kanteen.find(x=>x.id===it.id||x.id===it.produk_id); if(!p)throw new Error("Produk tidak ditemukan"); return { produk_id:p.id,nama:p.nama,harga:asMoney(p.harga),qty:Number(it.qty||1) }; });
    const total=items.reduce((sum,it)=>sum+it.harga*it.qty,0); if(asMoney(s.saldo_kanteen)<total)return send(res,400,{ok:false,error:"Saldo tidak cukup"});
    items.forEach(it=>{ const p=tdb.produk_kanteen.find(x=>x.id===it.produk_id); p.stok=Number(p.stok||0)-it.qty; }); s.saldo_kanteen=asMoney(s.saldo_kanteen)-total;
    const tr={id:id("TRX"),siswa_id:s.id,siswa_nama:s.nama,kasir_id:a.id,tanggal:today(),waktu:nowIso(),items,total,metode:"qr",status:"sukses"}; tdb.transaksi_kanteen.unshift(tr); save(slug,tdb,saveFn); return send(res,200,{ok:true,data:tr});
  }
  const genericRoutes = {
    mapel: "mapel",
    "tahun-ajaran": "tahun_ajaran",
    posting: "posting",
    "catatan-kepribadian": "catatan_kepribadian",
    "modul-ajar": "modul_ajar",
    supervisi: "supervisi",
    broadcast: "broadcast",
    settings: "settings_jurnal",
    backup: "backup_jurnal",
    "wali-kelas": "wali_kelas",
    pengajar: "pengajar",
    rapor: "rapor",
    beasiswa: "beasiswa",
    "kalender-kbm": "kalender_kbm",
    "wa-gateway": "wa_gateway",
    "notif-settings": "notif_settings",
    ekskul: "ekskul",
    "absensi-kokurikuler": "absensi_kokurikuler",
    "domain-setup": "domain_setup",
    erkam: "erkam",
    superadmin: "superadmin",
    perpustakaan: "perpustakaan",
    kelulusan: "kelulusan"
  };
  if (parts[2] && genericRoutes[parts[2]]) return crudList(req,res,url,slug,tdb,saveFn,genericRoutes[parts[2]],["admin","guru","siswa","wali"]);

  return send(res,404,{ok:false,error:"Endpoint jurnal tidak ditemukan"});
}

module.exports = { handleJurnal, initJurnalData };
