// ============================================================
// cms.js — dipasang di halaman PUBLIK.
// Mengambil konten dari backend API (server/server.js) sehingga
// perubahan dari panel admin tampil untuk SEMUA pengunjung.
// Fallback ke data bawaan bila API tidak tersedia (mode file statis).
// ============================================================
(function () {
  "use strict";

  // ---- Deteksi konteks tenant dari URL: /t/<slug>/... ----
  var TENANT = (function () {
    var m = location.pathname.match(/^\/t\/([a-z0-9-]+)/);
    return m ? m[1] : null;
  })();
  // prefix untuk API & link internal
  var TP = TENANT ? "/t/" + TENANT : "";
  function apiUrl(r) { return TP + "/api/" + r; }
  function pageUrl(p) { return TP + "/" + p; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function badgeClass(kat) {
    var k = (kat || "").toLowerCase();
    return { prestasi: "badge-prestasi", akademik: "badge-akademik", kesiswaan: "badge-kesiswaan", pengumuman: "badge-pengumuman", alumni: "badge-alumni", kegiatan: "badge-kesiswaan" }[k] || "badge-akademik";
  }

  // Ambil semua konten sekaligus
  function fetchAll() {
    var resources = ["identitas", "artikel", "galeri", "guru", "statistik", "sambutan", "ppdb", "fasilitas"];
    return Promise.all(resources.map(function (r) {
      return fetch(apiUrl(r)).then(function (res) { return res.ok ? res.json() : { data: null }; })
        .then(function (j) { return j.data; })
        .catch(function () { return null; });
    })).then(function (vals) {
      var out = {};
      resources.forEach(function (r, i) { out[r] = vals[i]; });
      return out;
    });
  }

  // Fallback bila API mati (mode file statis): pakai window.SITE & window.ARTIKEL
  function fallbackData() {
    return Promise.resolve({
      identitas: window.SITE || {},
      artikel: window.ARTIKEL ? Object.keys(window.ARTIKEL).map(function (id) {
        var a = window.ARTIKEL[id];
        return { id: id, judul: a.judul, tanggal: a.tanggal, kategori: a.kategori, gambar: a.gambar || "", isi: a.isi.join("\n\n"), terbit: true };
      }) : [],
      galeri: null, guru: null, statistik: null, sambutan: null, ppdb: null, fasilitas: null
    });
  }

  var dataPromise = fetchAll().then(function (d) {
    // kalau identitas kosong dan window.SITE ada, anggap API mati -> fallback
    if (!d.identitas && window.SITE) return fallbackData();
    return d;
  }).catch(fallbackData);

  // ---------- Render ----------
  function renderIdentitas(S) {
    if (!S || !S.namaSekolah) return;
    var map = { nama: S.namaSekolah, inisial: S.inisial, tagline: S.tagline, akreditasi: S.akreditasi, telepon: S.telepon, email: S.email, alamat: S.alamat, ppdb: S.ppdbLabel };
    Object.keys(map).forEach(function (k) {
      document.querySelectorAll('[data-site="' + k + '"]').forEach(function (el) { el.textContent = map[k]; });
    });
    document.querySelectorAll(".brand .b1").forEach(function (el) { el.textContent = S.namaSekolah; });
    document.querySelectorAll(".brand .b2").forEach(function (el) { el.textContent = S.akreditasi; });
    document.querySelectorAll(".logo-badge").forEach(function (el) { el.textContent = S.inisial; });
    document.querySelectorAll(".topbar-left span:first-child").forEach(function (el) {
      el.innerHTML = '<span class="material-symbols-outlined">call</span> ' + esc(S.telepon);
    });
    var mailTop = document.querySelector(".topbar-left span.hide-m");
    if (mailTop) mailTop.innerHTML = '<span class="material-symbols-outlined">mail</span> ' + esc(S.email);
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) { a.href = "tel:" + (S.telepon || "").replace(/[^\d+]/g, ""); a.textContent = S.telepon; });
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) { a.href = "mailto:" + S.email; a.textContent = S.email; });
    // alamat di footer & kontak
    document.querySelectorAll("footer .contact-line").forEach(function (el) {
      var icon = el.querySelector(".material-symbols-outlined");
      if (!icon) return;
      var ic = icon.textContent.trim();
      if (ic === "location_on") el.innerHTML = '<span class="material-symbols-outlined">location_on</span> ' + esc(S.alamat);
      if (ic === "call") el.innerHTML = '<span class="material-symbols-outlined">call</span> ' + esc(S.telepon);
      if (ic === "mail") el.innerHTML = '<span class="material-symbols-outlined">mail</span> ' + esc(S.email);
    });
    // judul halaman & footer text global (ganti semua "SMA Nusantara" di teks statis)
    var namaRegex = /SMA Nusantara/g;
    document.querySelectorAll("h1, h2, h3, h4, p, span, a, blockquote, .footer-brand p, .footer-bottom span").forEach(function (el) {
      if (el.children.length === 0 && namaRegex.test(el.textContent)) {
        el.textContent = el.textContent.replace(namaRegex, S.namaSekolah);
      }
    });
    var alamatRegex = /Jl\. Pendidikan No\. 1, Jakarta Pusat, DKI Jakarta 10110/g;
    document.querySelectorAll("p, span, div").forEach(function (el) {
      if (el.children.length === 0 && alamatRegex.test(el.textContent)) {
        el.textContent = el.textContent.replace(alamatRegex, S.alamat);
      }
    });
    // footer tahun & akreditasi
    document.querySelectorAll(".footer-bottom span").forEach(function (el) {
      el.innerHTML = el.innerHTML.replace(/SMA Nusantara/g, esc(S.namaSekolah));
    });
  }

  function renderBerita(list) {
    if (!list || !list.length) return;
    var homeGrid = document.querySelector("[data-cms-beranda-berita]");
    if (homeGrid) {
      homeGrid.innerHTML = list.slice(0, 3).map(function (a) {
        return '<article class="news-card" data-kategori="' + esc((a.kategori || "").toLowerCase()) + '">' +
          (a.gambar ? '<div class="thumb" style="background-image:url(\'' + esc(a.gambar) + '\')"><span class="label-tag">' + esc(a.kategori) + "</span></div>" : "") +
          '<div class="body"><span class="date"><span class="material-symbols-outlined">calendar_today</span> ' + esc(a.tanggal) + "</span>" +
          '<h3><a href="" + pageUrl("artikel.html") + "?id=' + encodeURIComponent(a.id) + '">' + esc(a.judul) + "</a></h3>" +
          "<p>" + esc((a.isi.split("\n")[0] || "").slice(0, 140)) + "…</p></div></article>";
      }).join("");
    }
    var utama = document.querySelector("[data-cms-berita-utama]");
    var terbaru = document.querySelector("[data-cms-berita-terbaru]");
    if (utama) {
      utama.innerHTML = list.slice(0, 2).map(function (a) {
        return '<article class="news-card" data-kategori="' + esc((a.kategori || "").toLowerCase()) + '">' +
          (a.gambar ? '<div class="thumb" style="background-image:url(\'' + esc(a.gambar) + '\')"><span class="label-tag">' + esc(a.kategori) + "</span></div>" : "") +
          '<div class="body"><h3><a href="" + pageUrl("artikel.html") + "?id=' + encodeURIComponent(a.id) + '" style="color:inherit">' + esc(a.judul) + "</a></h3>" +
          '<span class="date"><span class="material-symbols-outlined">calendar_today</span> ' + esc(a.tanggal) + "</span></div></article>";
      }).join("");
    }
    if (terbaru) {
      terbaru.innerHTML = list.slice(2).map(function (a) {
        var thumb = a.gambar
          ? '<div class="thumb" style="background-image:url(\'' + esc(a.gambar) + '\')"></div>'
          : '<div class="thumb icon-thumb"><span class="material-symbols-outlined">campaign</span></div>';
        return '<article class="news-list-item" data-kategori="' + esc((a.kategori || "").toLowerCase()) + '">' + thumb +
          '<div class="meta"><div class="row"><span class="badge ' + badgeClass(a.kategori) + '">' + esc(a.kategori) + '</span><span class="date-sm">' + esc(a.tanggal) + "</span></div>" +
          '<h3><a href="" + pageUrl("artikel.html") + "?id=' + encodeURIComponent(a.id) + '" style="color:inherit">' + esc(a.judul) + "</a></h3></div></article>";
      }).join("");
    }
  }

  function renderArtikel(list, S) {
    var artKonten = document.getElementById("artikel-konten");
    if (!artKonten) return;
    var id = new URLSearchParams(location.search).get("id");
    var data = (list || []).find(function (a) { return a.id === id; });
    if (!data) {
      artKonten.innerHTML = '<div class="text-center" style="padding:64px 0"><h1 style="font-size:24px;margin-bottom:12px">Artikel tidak ditemukan</h1><p class="muted mb-24">Konten yang Anda cari tidak tersedia.</p><a class="btn btn-navy" href="' + pageUrl('berita.html') + '">Kembali ke Berita</a></div>';
      return;
    }
    document.title = data.judul + " — " + (S.namaSekolah || "SMA Nusantara");
    var html = "";
    if (data.gambar) html += '<div class="artikel-hero" style="background-image:url(\'' + esc(data.gambar) + '\')"></div>';
    html += '<div class="artikel-body">';
    html += '<div class="meta"><span class="badge ' + badgeClass(data.kategori) + '">' + esc(data.kategori) + '</span><span class="tanggal">' + esc(data.tanggal) + "</span></div>";
    html += "<h1>" + esc(data.judul) + "</h1>";
    data.isi.split(/\n\n+/).forEach(function (p) { html += '<p class="paragraf">' + esc(p).replace(/\n/g, "<br>") + "</p>"; });
    html += '<div class="artikel-nav"><a href="' + pageUrl('berita.html') + '"><span class="material-symbols-outlined">arrow_back</span> Semua Berita</a><a href="' + pageUrl('kontak.html') + '">Hubungi Redaksi <span class="material-symbols-outlined">arrow_forward</span></a></div>';
    var rel = (list || []).filter(function (a) { return a.id !== id && a.kategori === data.kategori; }).slice(0, 3);
    if (rel.length) {
      html += '<div class="related"><h3>Artikel Terkait</h3><div class="grid">';
      rel.forEach(function (r) {
        html += '<article class="news-card">' + (r.gambar ? '<div class="thumb" style="background-image:url(\'' + esc(r.gambar) + '\')"></div>' : "") +
          '<div class="body"><span class="badge ' + badgeClass(r.kategori) + '">' + esc(r.kategori) + "</span>" +
          '<h3 style="margin-top:6px"><a href="" + pageUrl("artikel.html") + "?id=' + encodeURIComponent(r.id) + '">' + esc(r.judul) + "</a></h3>" +
          '<span class="date" style="margin-top:4px"><span class="material-symbols-outlined">calendar_today</span> ' + esc(r.tanggal) + "</span></div></article>";
      });
      html += "</div></div>";
    }
    html += "</div>";
    artKonten.innerHTML = html;
  }

  function renderStatistik(arr) {
    var grid = document.querySelector("[data-cms-statistik]");
    if (grid && arr && arr.length) {
      grid.innerHTML = arr.map(function (st) {
        return '<div class="stat"><div class="num">' + esc(st.angka) + '</div><div class="lbl">' + esc(st.label) + "</div></div>";
      }).join("");
    }
  }

  function renderSambutan(d) {
    var wrap = document.querySelector("[data-cms-sambutan]");
    if (!wrap || !d) return;
    var avatar = wrap.querySelector(".avatar");
    var nama = wrap.querySelector(".name");
    var jabatan = wrap.querySelector(".title");
    var kutipan = wrap.querySelector("blockquote");
    var par1 = wrap.querySelector("[data-cms-sambutan-p1]");
    if (avatar && d.foto) avatar.style.backgroundImage = "url('" + d.foto + "')";
    if (nama) nama.textContent = d.nama || "";
    if (jabatan) jabatan.textContent = d.jabatan || "";
    if (kutipan) kutipan.textContent = '"' + (d.kutipan || "") + '"';
    if (par1 && d.paragraf1) par1.textContent = d.paragraf1;
  }

  function renderGaleri(arr) {
    var grid = document.querySelector("[data-cms-galeri]");
    if (grid && arr && arr.length) {
      grid.innerHTML = arr.map(function (g) {
        return '<div class="gallery-item' + (g.bentuk === "lebar" ? " tall" : "") + '">' +
          '<img alt="' + esc(g.judul) + '" src="' + esc(g.gambar) + '">' +
          '<div class="cap">' + esc(g.judul) + "</div></div>";
      }).join("");
    }
  }

  function renderGuru(arr) {
    var grid = document.querySelector("[data-cms-guru]");
    if (grid && arr && arr.length) {
      grid.innerHTML = arr.map(function (g) {
        return '<div class="teacher-card">' +
          '<img alt="' + esc(g.nama) + '" src="' + esc(g.foto) + '">' +
          '<div class="body"><span class="role">' + esc(g.jabatan) + "</span>" +
          "<h3>" + esc(g.nama) + "</h3><p>" + esc(g.bio) + "</p></div></div>";
      }).join("");
    }
  }

  function renderFasilitas(arr) {
    var grid = document.querySelector("[data-cms-fasilitas]");
    if (grid && arr && arr.length) {
      grid.innerHTML = arr.map(function (f) {
        return '<div class="feature-card" style="flex-direction:column">' +
          '<div class="icon icon-navy"><span class="material-symbols-outlined">' + esc(f.ikon) + "</span></div>" +
          '<div><h3 style="font-size:18px">' + esc(f.nama) + "</h3><p>" + esc(f.deskripsi) + "</p></div></div>";
      }).join("");
    }
  }

  function renderPpdb(d) {
    if (!d) return;
    var judul = document.querySelector("[data-cms-ppdb-judul]");
    var sub = document.querySelector("[data-cms-ppdb-subjudul]");
    if (judul) judul.textContent = d.judul || "";
    if (sub) sub.textContent = d.subjudul || "";

    var warna = { primary: ["var(--primary-fixed)", "var(--primary)"], tertiary: ["var(--tertiary-fixed)", "var(--tertiary)"], secondary: ["var(--secondary-fixed)", "var(--secondary)"] };
    var jalurGrid = document.querySelector("[data-cms-ppdb-jalur]");
    if (jalurGrid && d.jalur && d.jalur.length) {
      jalurGrid.innerHTML = d.jalur.map(function (j) {
        var w = warna[j.warna] || warna.primary;
        return '<div class="feature-card"><div class="icon" style="background:' + w[0] + ';border-radius:99px"><span class="material-symbols-outlined" style="color:' + w[1] + '">' + esc(j.ikon) + "</span></div>" +
          "<div><h3>" + esc(j.nama) + "</h3><p>" + esc(j.deskripsi) + "</p></div></div>";
      }).join("");
    }
    var alurWrap = document.querySelector("[data-cms-ppdb-alur]");
    if (alurWrap && d.alur && d.alur.length) {
      alurWrap.innerHTML = d.alur.map(function (a, i) {
        return '<div class="timeline-item' + (i === 0 ? " done" : "") + '"><div class="dot">' + (i + 1) + "</div>" +
          '<div class="card" style="padding:16px 20px"><h3 style="font-family:var(--font-body);font-size:15px;font-weight:600">' + esc(a.judul) + "</h3>" +
          '<p class="muted" style="font-size:13px;margin-top:4px">' + esc(a.deskripsi) + "</p></div></div>";
      }).join("");
    }
    var jadwalWrap = document.querySelector("[data-cms-ppdb-jadwal]");
    if (jadwalWrap && d.jadwal && d.jadwal.length) {
      jadwalWrap.innerHTML = d.jadwal.map(function (j) {
        return '<div class="row"><div><span class="date' + (j.penting ? " err" : "") + '">' + esc(j.tanggal) + '</span><span class="label">' + esc(j.label) + "</span></div>" +
          '<span class="material-symbols-outlined">' + esc(j.ikon) + "</span></div>";
      }).join("");
    }
  }

  // ---------- Jalankan ----------
  document.addEventListener("DOMContentLoaded", function () {
    dataPromise.then(function (d) {
      var S = d.identitas || window.SITE || {};
      renderIdentitas(S);
      var artikelList = (d.artikel || (window.ARTIKEL ? Object.keys(window.ARTIKEL).map(function (id) {
        var a = window.ARTIKEL[id];
        return { id: id, judul: a.judul, tanggal: a.tanggal, kategori: a.kategori, gambar: a.gambar || "", isi: a.isi.join("\n\n"), terbit: true };
      }) : [])).filter(function (a) { return a.terbit; });
      renderBerita(artikelList);
      renderArtikel(artikelList, S);
      renderStatistik(d.statistik);
      renderSambutan(d.sambutan);
      renderGaleri(d.galeri);
      renderGuru(d.guru);
      renderFasilitas(d.fasilitas);
      renderPpdb(d.ppdb);
    });
  });

  // ---------- Form publik -> kirim ke API ----------
  document.addEventListener("DOMContentLoaded", function () {
    var formKontak = document.querySelector('form[data-demo-form]:not(#formPpdb)');
    if (formKontak && document.getElementById("isiPesan")) {
      formKontak.addEventListener("submit", function () {
        fetch(apiUrl("pesan"), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: (document.getElementById("namaLengkap") || {}).value || "",
            email: (document.getElementById("emailAlamat") || {}).value || "",
            departemen: (document.getElementById("kategoriPesan") || {}).value || "umum",
            isi: (document.getElementById("isiPesan") || {}).value || ""
          })
        }).catch(function () { /* offline: abaikan */ });
      });
    }

    var formPpdb = document.getElementById("formPpdb");
    if (formPpdb) {
      formPpdb.addEventListener("submit", function () {
        fetch(apiUrl("pendaftar"), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: (document.getElementById("namaSiswa") || {}).value || "",
            nisn: (document.getElementById("nisn") || {}).value || "",
            asalSekolah: (document.getElementById("asalSekolah") || {}).value || "",
            jalur: (document.getElementById("jalur") || {}).value || "",
            email: (document.getElementById("emailOrtu") || {}).value || "",
            whatsapp: (document.getElementById("telpOrtu") || {}).value || ""
          })
        }).catch(function () { /* offline */ });
      });
    }
  });
})();
