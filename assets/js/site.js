// ============================================================
// Identitas Sekolah — edit file ini untuk mengganti nama/logo/kontak
// di seluruh halaman. Cukup edit satu tempat, semua halaman ikut berubah.
// ============================================================
window.SITE = {
  namaSekolah: "SMA NUSANTARA",
  inisial: "SN",
  tagline: "Prestasi · Akhlak · Masa Depan",
  akreditasi: "Terakreditasi A",
  telepon: "(021) 555-1234",
  email: "info@smanusantara.sch.id",
  alamat: "Jl. Pendidikan No. 1, Jakarta Pusat, DKI Jakarta 10110",
  tahunBerdiri: 1985,
  ppdbLabel: "PPDB 2024",
  sosial: {
    instagram: "#",
    facebook: "#",
    youtube: "#"
  }
};

// Terapkan identitas ke elemen-elemen standar (data-site-*)
document.addEventListener("DOMContentLoaded", function () {
  var S = window.SITE;
  var map = {
    "nama": S.namaSekolah,
    "inisial": S.inisial,
    "tagline": S.tagline,
    "akreditasi": S.akreditasi,
    "telepon": S.telepon,
    "email": S.email,
    "alamat": S.alamat,
    "ppdb": S.ppdbLabel
  };
  Object.keys(map).forEach(function (k) {
    document.querySelectorAll('[data-site="' + k + '"]').forEach(function (el) {
      el.textContent = map[k];
    });
  });
  // link telepon & email
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.href = "tel:" + S.telepon.replace(/[^\d+]/g, "");
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.href = "mailto:" + S.email;
  });
});
