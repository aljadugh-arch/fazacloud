// ============================================================
// admin-common.js — shared shell untuk halaman admin
// Auth guard via token server, sidebar, topbar, toast
// ============================================================
(function () {
  "use strict";

  // base tenant: /t/<slug> atau "" untuk situs utama
  var TBASE = (location.pathname.match(/^\/t\/[a-z0-9-]+/) || [""])[0];
  if (sessionStorage.getItem("cms_token") === null) {
    location.replace(TBASE + "/admin/login.html");
    return;
  }

  var MENU = [
    { href: "index.html", icon: "dashboard", label: "Dashboard" },
    { href: "berita.html", icon: "newspaper", label: "Berita & Artikel" },
    { href: "galeri.html", icon: "photo_library", label: "Galeri Kegiatan" },
    { href: "guru.html", icon: "groups", label: "Tenaga Pendidik" },
    { href: "konten.html", icon: "edit_note", label: "Konten Halaman" },
    { href: "ppdb.html", icon: "app_registration", label: "Pendaftar PPDB" },
    { href: "pesan.html", icon: "mail", label: "Pesan Masuk" },
    { href: "tema.html", icon: "palette", label: "Tema & Tampilan" },
    { href: "https://jurnalmadrasah.web.id", icon: "menu_book", label: "Jurnal (jurnalmadrasah.web.id)", external: true },
    { href: "pengaturan.html", icon: "settings", label: "Pengaturan Situs" }
  ];

  function buildShell(title) {
    var page = location.pathname.split("/").pop() || "index.html";
    var nav = MENU.map(function (m) {
      var cls = m.href === page ? "active" : "";
      var ext = m.external ? ' target="_blank" rel="noopener"' : "";
      var suffix = m.external ? ' <span class="material-symbols-outlined" style="font-size:14px;opacity:.6;margin-left:auto">open_in_new</span>' : "";
      var href = m.external ? m.href : (TBASE + "/admin/" + m.href);
      return '<a href="' + href + '" class="' + cls + '"' + ext + '><span class="material-symbols-outlined">' + m.icon + '</span> ' + m.label + suffix + '</a>';
    }).join("");

    var shell = document.createElement("div");
    shell.className = "admin-shell";
    shell.innerHTML =
      '<aside class="admin-sidebar" id="adminSidebar">' +
        '<a class="brand" href="' + TBASE + '/index.html" target="_blank">' +
          '<span class="logo-badge">SN</span>' +
          '<span class="brand-text"><span class="b1">SMA NUSANTARA</span><span class="b2">Panel Admin</span></span>' +
        '</a>' +
        '<nav class="admin-nav">' + nav + '</nav>' +
        '<div class="sidebar-foot">Login sebagai admin<br><a href="#" id="btnLogout">Keluar &rarr;</a></div>' +
      '</aside>' +
      '<div class="admin-main">' +
        '<div class="admin-mobile-top">' +
          '<button id="adminMenuBtn" aria-label="Menu"><span class="material-symbols-outlined">menu</span></button>' +
          '<strong>' + title + '</strong>' +
        '</div>' +
        '<div class="admin-topbar">' +
          '<span class="page-title">' + title + '</span>' +
          '<div style="display:flex;align-items:center;gap:16px">' +
            '<div class="user-chip"><span class="avatar">A</span><span>Administrator</span></div>' +
            '<a href="#" id="btnLogoutTop" class="btn btn-sm btn-ghost" style="white-space:nowrap"><span class="material-symbols-outlined" style="font-size:18px">logout</span> Keluar</a>' +
          '</div>' +
        '</div>' +
        '<div class="admin-content" id="adminContent"></div>' +
      '</div>';

    var content = document.getElementById("adminContentSource");
    document.body.prepend(shell);
    if (content) {
      document.getElementById("adminContent").appendChild(content);
      content.style.display = "";
    }

    var btn = document.getElementById("adminMenuBtn");
    if (btn) btn.addEventListener("click", function () {
      document.getElementById("adminSidebar").classList.toggle("open");
    });

    function doLogout(e) {
      if (e) e.preventDefault();
      sessionStorage.removeItem("cms_token");
      location.replace(TBASE + "/admin/login.html");
    }
    document.getElementById("btnLogout").addEventListener("click", doLogout);
    var topBtn = document.getElementById("btnLogoutTop");
    if (topBtn) topBtn.addEventListener("click", doLogout);
  }

  window.AdminShell = {
    build: function (title) { buildShell(title); },
    toast: function (msg) {
      var t = document.createElement("div");
      t.className = "admin-toast";
      t.textContent = msg;
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add("show"); });
      setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 300); }, 2200);
    },
    escHtml: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    // Upload gambar: render widget (tombol + preview + status) ke dalam container,
    // dan isi hidden input dengan path hasil upload.
    // containerId: id div penampung; inputId: id hidden input untuk path; previewTinggi: px
    imageUploader: function (containerId, inputId, previewTinggi) {
      var c = document.getElementById(containerId);
      if (!c) return;
      // pakai hidden input yang sudah ada di form kalau ada (dicari di seluruh dokumen)
      var existing = document.getElementById(inputId);
      c.innerHTML =
        (existing ? "" : '<input type="hidden" id="' + inputId + '">') +
        '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
          '<div style="flex:1;min-width:220px">' +
            '<label class="btn btn-sm btn-ghost" style="cursor:pointer;margin:0">' +
              '<span class="material-symbols-outlined">upload</span> Pilih Gambar…' +
              '<input type="file" accept="image/jpeg,image/png,image/webp" style="display:none" data-role="file">' +
            '</label>' +
            '<div class="muted" style="font-size:12px;margin-top:6px" data-role="status">Belum ada gambar</div>' +
          '</div>' +
          '<div data-role="preview" style="width:140px;height:' + (previewTinggi || 90) + 'px;border-radius:8px;background:var(--surface-container);background-size:cover;background-position:center;border:1px solid var(--outline-variant)"></div>' +
        '</div>';
      var file = c.querySelector('[data-role="file"]');
      var status = c.querySelector('[data-role="status"]');
      var preview = c.querySelector('[data-role="preview"]');
      var hidden = document.getElementById(inputId);

      function setPreview(path) {
        if (path) {
          var src = path.startsWith("assets/") ? "../" + path : path;
          preview.style.backgroundImage = "url('" + src + "')";
        } else {
          preview.style.backgroundImage = "none";
        }
      }

      file.addEventListener("change", function () {
        var f = this.files[0];
        if (!f) return;
        if (f.size > 3 * 1024 * 1024) { status.textContent = "File terlalu besar (maks 3 MB)."; return; }
        status.textContent = "Mengunggah…";
        var reader = new FileReader();
        reader.onload = function () {
          var base64 = reader.result.split(",")[1];
          fetch(((location.pathname.match(/^\/t\/([a-z0-9-]+)/)||[])[0]||"") + "/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + sessionStorage.getItem("cms_token") },
            body: JSON.stringify({ filename: "img-" + Date.now() + "-" + f.name.replace(/[^a-zA-Z0-9._-]/g, "-"), dataBase64: base64 })
          }).then(function (r) { return r.json(); }).then(function (j) {
            if (j.ok && j.path) {
              hidden.value = j.path;
              setPreview(j.path);
              status.textContent = "Terunggah: " + j.path;
            } else {
              status.textContent = "Gagal: " + (j.error || "tidak diketahui");
            }
          }).catch(function () { status.textContent = "Server tidak merespons."; });
        };
        reader.readAsDataURL(f);
      });

      // API untuk form: set nilai awal & ambil nilai
      c.setValue = function (path) { hidden.value = path || ""; setPreview(path); status.textContent = path ? path : "Belum ada gambar"; };
      c.getValue = function () { return hidden.value.trim(); };
    },

    formatTanggal: function (iso) {
      try {
        return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      } catch (e) { return iso; }
    }
  };
})();
