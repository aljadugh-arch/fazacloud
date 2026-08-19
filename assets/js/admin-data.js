// ============================================================
// admin-data.js — store CMS yang bicara ke backend server
// (HTTP API). Fallback ke localStorage bila server tidak jalan,
// supaya situs tetap bisa dipakai sebagai file statis.
// ============================================================
(function () {
  "use strict";

  var USE_API = true; // otomatis dimatikan kalau fetch gagal (mode file statis)

  var TENANT = (function () {
    var m = location.pathname.match(/^\/t\/([a-z0-9-]+)/);
    return m ? m[1] : null;
  })();
  var TP = TENANT ? "/t/" + TENANT : "";
  function apiBase(r) { return TP + "/api/" + r; }

  function headers() {
    var h = { "Content-Type": "application/json" };
    var t = sessionStorage.getItem("cms_token");
    if (t) h.Authorization = "Bearer " + t;
    return h;
  }

  function apiGet(resource, needAuth) {
    return fetch(apiBase(resource), { headers: headers() }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (j) { return j.data; });
  }
  function apiPut(resource, data) {
    return fetch(apiBase(resource), {
      method: "PUT", headers: headers(), body: JSON.stringify({ data: data })
    }).then(function (r) { return r.json(); });
  }
  function apiPost(resource, data) {
    return fetch(apiBase(resource), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  }

  // ---------- Seed lokal (untuk fallback mode statis) ----------
  var SEED = {
    statistik: [
      { id: "st1", angka: "1.250+", label: "Siswa Aktif" },
      { id: "st2", angka: "98", label: "Guru & Tenaga Pendidik" },
      { id: "st3", angka: "150+", label: "Prestasi Nasional" },
      { id: "st4", angka: "32", label: "Ekstrakurikuler" }
    ],
    sambutan: {
      foto: "assets/img/kepsek-sambutan.jpg",
      nama: "Dr. Budi Santoso, M.Pd.",
      jabatan: "Kepala SMA Nusantara",
      kutipan: "Pendidikan bukan sekadar transfer ilmu, melainkan proses penempaan karakter. Di SMA Nusantara, kami berkomitmen mencetak generasi yang cerdas secara intelektual dan luhur secara moral.",
      paragraf1: "Setiap siswa adalah individu unik dengan potensi luar biasa. Melalui Kurikulum Merdeka, pembinaan karakter Profil Pelajar Pancasila, dan ekosistem belajar yang modern, kami mendampingi mereka menemukan jalannya menuju masa depan."
    },
    galeri: [
      { id: "gl1", gambar: "assets/img/galeri-juara-osn.jpg", judul: "Juara 1 Olimpiade Sains Nasional", bentuk: "kotak" },
      { id: "gl2", gambar: "assets/img/galeri-dbl-basket.jpg", judul: "Juara Umum DBL Regional", bentuk: "lebar" },
      { id: "gl3", gambar: "assets/img/galeri-festival-budaya.jpg", judul: "Penampilan Terbaik Festival Budaya", bentuk: "lebar" },
      { id: "gl4", gambar: "assets/img/galeri-robotika.jpg", judul: "Finalis Kompetisi Robotika Nasional", bentuk: "kotak" }
    ],
    guru: [
      { id: "gr1", foto: "assets/img/guru-budi-santoso.jpg", jabatan: "Kepala Sekolah", nama: "Dr. Budi Santoso, M.Pd.", bio: "Membawa visi inovasi dalam pembelajaran berbasis teknologi di era digital." },
      { id: "gr2", foto: "assets/img/guru-siti-rahmawati.jpg", jabatan: "Wakasek Kurikulum", nama: "Siti Rahmawati, M.Si.", bio: "Fokus pada implementasi Kurikulum Merdeka dan pendampingan karakter siswa." },
      { id: "gr3", foto: "assets/img/guru-andi-pratama.jpg", jabatan: "Guru Matematika", nama: "Andi Pratama, S.Pd.", bio: "Membuat matematika menyenangkan melalui pendekatan pemecahan masalah dunia nyata." }
    ],
    ppdb: {
      judul: "Penerimaan Peserta Didik Baru (PPDB) 2024/2025",
      subjudul: "Bergabunglah bersama SMA Nusantara dan wujudkan masa depan gemilang melalui pendidikan berkualitas, berkarakter, dan berwawasan kebangsaan.",
      jalur: [
        { id: "jl1", nama: "Jalur Prestasi", ikon: "emoji_events", warna: "primary", deskripsi: "Diperuntukkan bagi siswa/i yang memiliki prestasi akademik maupun non-akademik tingkat kota/kabupaten hingga internasional." },
        { id: "jl2", nama: "Jalur Zonasi", ikon: "map", warna: "tertiary", deskripsi: "Diperuntukkan bagi siswa/i yang berdomisili di dalam wilayah zonasi yang telah ditetapkan oleh pemerintah." },
        { id: "jl3", nama: "Jalur Afirmasi & Perpindahan Tugas", ikon: "family_home", warna: "secondary", deskripsi: "Diperuntukkan bagi siswa/i dari keluarga ekonomi tidak mampu dan anak mutasi tugas orang tua/wali." }
      ],
      alur: [
        { id: "al1", judul: "Pendaftaran Online", deskripsi: "Mengisi formulir pendaftaran melalui portal PPDB dan mengunggah dokumen persyaratan dasar." },
        { id: "al2", judul: "Verifikasi Berkas", deskripsi: "Tim panitia akan memverifikasi kesesuaian dokumen yang diunggah. Status dapat dicek secara berkala." },
        { id: "al3", judul: "Tes Seleksi (Jalur Tertentu)", deskripsi: "Pelaksanaan tes akademik dan potensi skolastik khusus untuk Jalur Prestasi Akademik." },
        { id: "al4", judul: "Pengumuman & Daftar Ulang", deskripsi: "Hasil seleksi diumumkan secara online. Calon siswa yang diterima wajib melakukan lapor diri." }
      ],
      jadwal: [
        { id: "jd1", tanggal: "10 – 24 Mei 2024", label: "Pendaftaran Online", ikon: "calendar_today", penting: false },
        { id: "jd2", tanggal: "26 – 28 Mei 2024", label: "Verifikasi Berkas", ikon: "verified", penting: false },
        { id: "jd3", tanggal: "30 Mei 2024", label: "Tes Seleksi Akademik", ikon: "draw", penting: false },
        { id: "jd4", tanggal: "5 Juni 2024", label: "Pengumuman Hasil", ikon: "campaign", penting: true }
      ]
    },
    fasilitas: [
      { id: "fs1", nama: "Laboratorium Sains", ikon: "biotech", deskripsi: "Lab Fisika, Kimia, dan Biologi berstandar internasional." },
      { id: "fs2", nama: "Perpustakaan Digital", ikon: "menu_book", deskripsi: "Koleksi 25.000+ buku dan akses jurnal daring." },
      { id: "fs3", nama: "Sport Hall", ikon: "sports_basketball", deskripsi: "Gedung olahraga indoor untuk basket, futsal, dan bulu tangkis." },
      { id: "fs4", nama: "Lab Komputer & Robotika", ikon: "computer", deskripsi: "Ruang pembelajaran teknologi dan klub robotika." }
    ],
    aplikasi: [
      { id: "app1", nama: "Aplikasi Pendataan", ikon: "database", deskripsi: "Master siswa, GTK, kelas, jadwal", url: "jurnal/login.html" },
      { id: "app2", nama: "PPDB Online", ikon: "how_to_reg", deskripsi: "Pendaftaran peserta didik baru", url: "ppdb.html" },
      { id: "app3", nama: "E-Learning / LMS", ikon: "computer", deskripsi: "Jurnal mengajar, modul ajar, penilaian", url: "jurnal/login.html" },
      { id: "app4", nama: "Portal Guru & Tendik", ikon: "groups", deskripsi: "Ceklok GTK, QR absensi siswa", url: "jurnal/login.html" },
      { id: "app5", nama: "E-Perpustakaan", ikon: "menu_book", deskripsi: "Basis menu literasi & download", url: "jurnal/login.html" },
      { id: "app6", nama: "Pengumuman Kelulusan", ikon: "school", deskripsi: "Rapor, kelulusan, pengumuman siswa", url: "jurnal/login.html" }
    ]
  };

  // Fallback localStorage
  function lsRead(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function lsWrite(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  var LS_PREFIX = "cms_fallback_";

  // Inisialisasi fallback: seed sekali
  Object.keys(SEED).forEach(function (k) {
    if (!localStorage.getItem(LS_PREFIX + k)) lsWrite(LS_PREFIX + k, SEED[k]);
  });
  if (!localStorage.getItem(LS_PREFIX + "artikel") && window.ARTIKEL) {
    var arr = Object.keys(window.ARTIKEL).map(function (id) {
      var a = window.ARTIKEL[id];
      return { id: id, judul: a.judul, tanggal: a.tanggal, kategori: a.kategori, gambar: a.gambar || "", isi: a.isi.join("\n\n"), terbit: true };
    });
    lsWrite(LS_PREFIX + "artikel", arr);
  }
  ["pendaftar", "pesan"].forEach(function (k) {
    if (!localStorage.getItem(LS_PREFIX + k)) lsWrite(LS_PREFIX + k, []);
  });
  if (!localStorage.getItem(LS_PREFIX + "identitas") && window.SITE) lsWrite(LS_PREFIX + "identitas", window.SITE);

  function fallbackGet(resource) {
    return Promise.resolve(lsRead(LS_PREFIX + resource, resource === "pendaftar" || resource === "pesan" ? [] : (SEED[resource] !== undefined ? SEED[resource] : null)));
  }
  function fallbackPut(resource, data) {
    lsWrite(LS_PREFIX + resource, data);
    return Promise.resolve({ ok: true });
  }

  // Deteksi API aktif sekali di awal (pakai endpoint publik)
  var apiReady = fetch(apiBase("identitas")).then(function (r) { return r.ok; }).catch(function () { return false; });

  function get(resource) {
    return apiReady.then(function (ok) {
      if (!ok) return fallbackGet(resource);
      // pendaftar & pesan butuh token; kalau tidak ada token, kembalikan kosong
      if ((resource === "pendaftar" || resource === "pesan") && !sessionStorage.getItem("cms_token")) {
        return [];
      }
      return apiGet(resource);
    }).catch(function () { return fallbackGet(resource); });
  }
  function put(resource, data) {
    return apiReady.then(function (ok) {
      return ok ? apiPut(resource, data) : fallbackPut(resource, data);
    }).catch(function () { return fallbackPut(resource, data); });
  }
  function post(resource, data) {
    return apiReady.then(function (ok) {
      return ok ? apiPost(resource, data) : Promise.resolve({ ok: false, error: "offline" });
    });
  }

  function defaultFor(resource) {
    if (resource === "artikel" && window.ARTIKEL) {
      return Object.keys(window.ARTIKEL).map(function (id) {
        var a = window.ARTIKEL[id];
        return { id: id, judul: a.judul, tanggal: a.tanggal, kategori: a.kategori, gambar: a.gambar || "", isi: a.isi.join("\n\n"), terbit: true };
      });
    }
    if (SEED[resource] !== undefined) return SEED[resource];
    if (resource === "pendaftar" || resource === "pesan") return [];
    if (resource === "identitas") return window.SITE || {};
    return null;
  }

  function crud(resource) {
    return {
      get: function () {
        return get(resource).then(function (d) { return d === null || d === undefined ? defaultFor(resource) : d; });
      },
      simpanSemua: function (arr) { return put(resource, arr); },
      simpan: function (item) {
        return this.get().then(function (arr) {
          var idx = arr.findIndex(function (x) { return x.id === item.id; });
          if (idx >= 0) arr[idx] = item; else arr.push(item);
          return put(resource, arr).then(function () { return item; });
        });
      },
      hapus: function (id) {
        return this.get().then(function (arr) {
          return put(resource, arr.filter(function (x) { return x.id !== id; }));
        });
      }
    };
  }

  window.DB = {
    SEED: SEED,

    // Artikel
    getArtikel: function () {
      return get("artikel").then(function (d) { return d === null || d === undefined ? defaultFor("artikel") : d; });
    },
    getArtikelTerbit: function () { return this.getArtikel().then(function (a) { return a.filter(function (x) { return x.terbit; }); }); },
    getArtikelById: function (id) {
      return this.getArtikel().then(function (arr) { return arr.find(function (a) { return a.id === id; }) || null; });
    },
    simpanArtikel: function (data) {
      return this.getArtikel().then(function (arr) {
        var idx = arr.findIndex(function (a) { return a.id === data.id; });
        if (idx >= 0) arr[idx] = data; else arr.unshift(data);
        return put("artikel", arr).then(function () { return data; });
      });
    },
    hapusArtikel: function (id) {
      return this.getArtikel().then(function (arr) {
        return put("artikel", arr.filter(function (a) { return a.id !== id; }));
      });
    },
    buatIdArtikel: function (judul) {
      var base = judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "artikel";
      return this.getArtikel().then(function (arr) {
        var id = base, i = 2;
        var exists = function (x) { return arr.some(function (a) { return a.id === x; }); };
        while (exists(id)) { id = base + "-" + i; i++; }
        return id;
      });
    },

    // Koleksi
    galeri: crud("galeri"),
    guru: crud("guru"),
    statistik: crud("statistik"),
    fasilitas: crud("fasilitas"),
    aplikasi: crud("aplikasi"),

    // Objek tunggal
    getSambutan: function () { return get("sambutan").then(function (d) { return d || SEED.sambutan; }); },
    simpanSambutan: function (d) { return put("sambutan", d); },
    getPpdb: function () { return get("ppdb").then(function (d) { return d || SEED.ppdb; }); },
    simpanPpdb: function (d) { return put("ppdb", d); },
    getIdentitas: function () { return get("identitas").then(function (d) { return d || window.SITE || {}; }); },
    simpanIdentitas: function (d) { return put("identitas", d); },
    getTema: function () { return get("tema").then(function (d) { return d || { aktif: "nusantara", kustom: null }; }); },
    simpanTema: function (d) { return put("tema", d); },

    // Pendaftar
    getPendaftar: function () { return get("pendaftar").then(function (d) { return d || []; }); },
    updateStatusPendaftar: function (id, status) {
      return this.getPendaftar().then(function (arr) {
        arr.forEach(function (p) { if (p.id === id) p.status = status; });
        return put("pendaftar", arr);
      });
    },
    hapusPendaftar: function (id) {
      return this.getPendaftar().then(function (arr) {
        return put("pendaftar", arr.filter(function (p) { return p.id !== id; }));
      });
    },

    // Pesan
    getPesan: function () { return get("pesan").then(function (d) { return d || []; }); },
    tandaiDibaca: function (id) {
      return this.getPesan().then(function (arr) {
        arr.forEach(function (m) { if (m.id === id) m.dibaca = true; });
        return put("pesan", arr);
      });
    },
    hapusPesan: function (id) {
      return this.getPesan().then(function (arr) {
        return put("pesan", arr.filter(function (m) { return m.id !== id; }));
      });
    },

    // Submit publik
    kirimPendaftar: function (d) { return post("pendaftar", d); },
    kirimPesan: function (m) { return post("pesan", m); },

    // Statistik dashboard
    stats: function () {
      return Promise.all([this.getArtikel(), this.getPendaftar(), this.getPesan(), this.galeri.get(), this.guru.get()])
        .then(function (r) {
          var artikel = r[0], pendaftar = r[1], pesan = r[2], galeri = r[3], guru = r[4];
          return {
            artikelTerbit: artikel.filter(function (a) { return a.terbit; }).length,
            artikelTotal: artikel.length,
            pendaftarTotal: pendaftar.length,
            pendaftarBaru: pendaftar.filter(function (p) { return p.status === "baru"; }).length,
            pesanTotal: pesan.length,
            pesanBelumDibaca: pesan.filter(function (m) { return !m.dibaca; }).length,
            galeriTotal: galeri.length,
            guruTotal: guru.length
          };
        });
    },

    resetAll: function () {
      return apiReady.then(function (ok) {
        if (ok) {
          return fetch(apiBase("reset"), { method: "POST", headers: headers() }).then(function () { return; });
        }
        // fallback: reset localStorage
        Object.keys(SEED).concat(["artikel", "identitas"]).forEach(function (k) {
          localStorage.removeItem(LS_PREFIX + k);
        });
      });
    },

    // util untuk tahu mode
    isApiMode: function () { return apiReady; }
  };
})();
