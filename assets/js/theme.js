// ============================================================
// theme.js — dipasang di halaman PUBLIK (sebelum css lain selesai
//  adalah ideal, tapi cukup di head/defer). Membaca tema aktif dari
//  server dan menerapkan CSS custom properties + font.
// ============================================================
(function () {
  "use strict";

  // Preset tema (terinspirasi dari situs referensi)
  var TEMA = {
    nusantara: {
      nama: "Nusantara (Bawaan)",
      deskripsi: "Heritage Navy + Academic Gold. Klasik, berwibawa, formal.",
      bodyClass: "tema-nusantara",
      vars: {
        "--heritage-navy": "#233d62",
        "--primary": "#003e67",
        "--primary-container": "#00568c",
        "--academic-gold": "#f8b500",
        "--secondary": "#7d5700",
        "--surface-tint": "#1b6299",
        "--surface": "#f8f9fa",
        "--surface-container-low": "#f3f4f5",
        "--radius": "0.25rem",
        "--radius-lg": "0.5rem",
        "--radius-xl": "0.75rem",
        "--font-head": "'Source Serif 4', Georgia, serif",
        "--font-body": "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif"
      },
      fontImport: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:wght@600;700&display=swap"
    },

    alizzah: {
      nama: "Al-Izzah (Islami Modern)",
      deskripsi: "Ungu keemasan + aksen emas, font Philosopher. Elegan dan islami.",
      bodyClass: "tema-alizzah",
      vars: {
        "--heritage-navy": "#3d2c5a",
        "--primary": "#6020d2",
        "--primary-container": "#4a1a9e",
        "--academic-gold": "#f8b500",
        "--secondary": "#7d5700",
        "--surface-tint": "#6020d2",
        "--surface": "#faf9fc",
        "--surface-container-low": "#f4f2f7",
        "--radius": "0.375rem",
        "--radius-lg": "0.625rem",
        "--radius-xl": "1rem",
        "--font-head": "'Philosopher', 'Source Serif 4', serif",
        "--font-body": "'Inter', sans-serif"
      },
      fontImport: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Philosopher:ital,wght@0,400;0,700;1,400&display=swap"
    },

    luqman: {
      nama: "Luqman Al-Hakim (Hijau Segar)",
      deskripsi: "Biru kehijauan + aksen emerald, font Archivo. Bersih dan modern.",
      bodyClass: "tema-luqman",
      vars: {
        "--heritage-navy": "#0f2645",
        "--primary": "#1c5598",
        "--primary-container": "#163f6e",
        "--academic-gold": "#10b981",
        "--secondary": "#0d9461",
        "--surface-tint": "#1c5598",
        "--surface": "#f6f8fa",
        "--surface-container-low": "#eef2f5",
        "--radius": "0.375rem",
        "--radius-lg": "0.625rem",
        "--radius-xl": "0.875rem",
        "--font-head": "'Archivo', 'Inter', sans-serif",
        "--font-body": "'Archivo', 'Inter', sans-serif"
      },
      fontImport: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap"
    },

    sman1yogya: {
      nama: "SMAN 1 Yogyakarta (Biru Klasik)",
      deskripsi: "Biru korporat + aksen oranye, font Helvetica/Arial. Rapi dan institusional.",
      bodyClass: "tema-sman1yogya",
      vars: {
        "--heritage-navy": "#1f3864",
        "--primary": "#337ab7",
        "--primary-container": "#286090",
        "--academic-gold": "#f0ad4e",
        "--secondary": "#8a6d3b",
        "--surface-tint": "#337ab7",
        "--surface": "#f5f5f5",
        "--surface-container-low": "#ececec",
        "--radius": "0.25rem",
        "--radius-lg": "0.375rem",
        "--radius-xl": "0.5rem",
        "--font-head": "'Helvetica Neue', Helvetica, Arial, sans-serif",
        "--font-body": "'Helvetica Neue', Helvetica, Arial, sans-serif"
      },
      fontImport: null
    }
  };

  function injectFont(url) {
    if (!url) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }

  function applyVars(vars) {
    var root = document.documentElement;
    Object.keys(vars).forEach(function (k) {
      root.style.setProperty(k, vars[k]);
    });
  }

  function applyTheme(key, kustom) {
    var t = TEMA[key] || TEMA.nusantara;
    var vars = Object.assign({}, t.vars, kustom || {});
    applyVars(vars);
    injectFont(t.fontImport);
    if (document.body) {
      Object.keys(TEMA).forEach(function (k) { document.body.classList.remove(TEMA[k].bodyClass); });
      document.body.classList.add(t.bodyClass);
    }
  }

  // Terapkan tema bawaan dulu (supaya tidak ada flash)
  applyTheme("nusantara");

  function applyFull(data) {
    if (!data) return;
    applyTheme(data.aktif || "nusantara", data.kustom);
    // hero custom
    if (data.heroGambar) {
      document.querySelectorAll(".hero, .page-hero").forEach(function (el) {
        el.style.backgroundImage = "url('" + data.heroGambar + "')";
      });
    }
    // ukuran footer
    if (data.footerSize) {
      document.body.classList.remove("footer-compact", "footer-normal", "footer-lebar");
      document.body.classList.add("footer-" + data.footerSize);
    }
  }

  // Ambil tema aktif dari server
  fetch("/api/tema").then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (j && j.data) {
      if (document.body) { applyFull(j.data); }
      else { document.addEventListener("DOMContentLoaded", function () { applyFull(j.data); }); }
    }
  }).catch(function () { /* offline: pakai nusantara */ });

  // Ekspos untuk admin
  window.TEMA_SEKOLAH = TEMA;
  window.applyThemeSekolah = applyTheme;
})();
