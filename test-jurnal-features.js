"use strict";
const assert = require("assert");
const { PassThrough } = require("stream");
const { handleJurnal, initJurnalData } = require("./server/jurnal-server");

function req(method, path, body, token) {
  const r = new PassThrough();
  r.method = method;
  r.headers = token ? { authorization: "Bearer " + token } : {};
  r.socket = { remoteAddress: "test" + Math.random() };
  r.end(JSON.stringify(body || {}));
  return r;
}
function res() {
  const chunks = [];
  return {
    writeHead(code, headers) { this.statusCode = code; this.headers = headers; },
    end(data) { chunks.push(Buffer.from(data || "")); this.body = JSON.parse(Buffer.concat(chunks).toString() || "{}"); this.done && this.done(); }
  };
}
function call(tdb, method, path, body, token) {
  return new Promise(resolve => {
    const out = res(); out.done = () => resolve(out);
    handleJurnal(req(method, path, body, token), out, new URL("http://x" + path), null, tdb, () => {});
  });
}

(async () => {
  const tdb = { admin: { email: "admin@test.sch.id", password: "admin123" }, users: { guru: [], siswa: [], wali: [], kasir: [] }, kelas: [], absensi_siswa: [] };
  initJurnalData(tdb);
  tdb.users.siswa.push({ id: "SIS-1", nama: "Ali", nis: "123", nisn: "9988", kelas: "X-A", aktif: true });
  tdb.users.siswa.push({ id: "SIS-2", nama: "Budi", nis: "124", kelas: "X-A", aktif: true });
  tdb.kelas.push({ id: "KLS-XA", nama: "X-A" });

  let admin = await call(tdb, "POST", "/api/jurnal/login", { role: "admin", email: "admin@test.sch.id", password: "admin123" });
  assert.equal(admin.statusCode, 200);
  const token = admin.body.token;

  let siswaLogin = await call(tdb, "POST", "/api/jurnal/login", { role: "siswa", email: "123", password: "123" });
  assert.equal(siswaLogin.statusCode, 200, "siswa bisa login pakai username=NIS dan password=NIS");
  assert.equal(siswaLogin.body.id, "SIS-1");

  let siswaLoginNisn = await call(tdb, "POST", "/api/jurnal/login", { role: "siswa", email: "9988", password: "9988" });
  assert.equal(siswaLoginNisn.statusCode, 200, "siswa bisa login pakai username=NISN dan password=NISN");

  let waliLogin = await call(tdb, "POST", "/api/jurnal/login", { role: "wali", email: "123", password: "123" });
  assert.equal(waliLogin.statusCode, 200, "wali bisa login pakai NIS anak tanpa user wali manual");
  assert.equal(waliLogin.body.role, "wali");

  let batch = await call(tdb, "POST", "/api/jurnal/absensi/siswa/batch", { kelas: "X-A", tanggal: "2026-08-18", jenis: "hadir", siswa_ids: ["SIS-1", "SIS-2"], overrides: { "SIS-2": "sakit" } }, token);
  assert.equal(batch.statusCode, 200);
  assert.equal(batch.body.data.length, 2, "batch absensi buat 2 baris per rombel");
  assert.equal(tdb.absensi_siswa.find(x => x.siswa_id === "SIS-2").jenis, "sakit");

  console.log("ok");
})().catch(e => { console.error(e); process.exit(1); });
