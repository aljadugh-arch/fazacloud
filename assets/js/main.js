// SMA Nusantara — interaksi ringan (tanpa framework)
(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector(".material-symbols-outlined").textContent = open ? "close" : "menu";
    });
  }

  // Chip filter (halaman Berita): filter kartu berdasarkan data-kategori
  var chipRow = document.querySelector("[data-filter-chips]");
  if (chipRow) {
    chipRow.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      chipRow.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      var kat = chip.getAttribute("data-kat");
      document.querySelectorAll("[data-kategori]").forEach(function (card) {
        var show = kat === "semua" || card.getAttribute("data-kategori") === kat;
        card.style.display = show ? "" : "none";
      });
    });
  }

  // Pencarian berita (filter judul secara live)
  var searchInput = document.querySelector("[data-news-search]");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var q = searchInput.value.trim().toLowerCase();
      document.querySelectorAll("[data-kategori]").forEach(function (card) {
        var title = (card.querySelector("h3") || {}).textContent || "";
        card.style.display = title.toLowerCase().indexOf(q) !== -1 ? "" : "none";
      });
    });
  }

  // Form kontak & PPDB: simulasi kirim (tanpa backend)
  document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      if (!btn || btn.disabled) return;
      btn.disabled = true;
      btn.innerHTML = "Terkirim — Terima Kasih";
      btn.style.background = "var(--tertiary-container)";
      var note = form.querySelector(".form-note");
      if (note) note.textContent = "Pesan Anda tercatat (mode demo). Hubungkan form ini ke layanan email/backend untuk produksi.";
    });
  });

  // Tahun dinamis di footer
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
