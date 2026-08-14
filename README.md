# Website Profil Sekolah + CMS

Website profil sekolah lengkap dengan panel admin & CMS, dibangun dari desain Stitch
"Nusantara Academic Excellence". Backend Node.js + penyimpanan JSON (tanpa database eksternal).

## Menjalankan

```
cd sma-nusantara
node server/server.js
```

Lalu buka:
- Landing page  : http://localhost:8000            (halaman produk, tombol Daftar)
- Demo sekolah  : http://localhost:8000/index.html (contoh website sekolah)
- Daftar lembaga: http://localhost:8000/register.html
- Panel admin   : http://localhost:8000/admin/login.html

Kredensial admin default: `admin@smanusantara.sch.id` / `admin123`
(ganti lewat environment variable `ADMIN_EMAIL` dan `ADMIN_PASSWORD` untuk produksi).

## Struktur

```
index.html, profil.html, akademik.html, kesiswaan.html, berita.html,
artikel.html, ppdb.html, kontak.html     Halaman publik
admin/                                   Panel admin (login, dashboard, CRUD konten, tema)
assets/css/style.css                     Tema publik
assets/css/admin.css                     Tema panel admin
assets/js/theme.js                       Theme engine: preset + kustomisasi warna/font
assets/js/cms.js                         Ambil konten dari API untuk halaman publik
assets/js/admin-data.js                  Store CMS (bicara ke API, fallback localStorage)
assets/js/admin-common.js                Shell panel admin (auth, sidebar, toast)
assets/js/site.js / artikel-data.js      Data bawaan (fallback mode statis)
assets/img/                              Gambar lokal
server/server.js                         Backend: API REST + static file + penyimpanan JSON
server/data.json                         Seluruh konten tersimpan di sini
_stitch_source/                          File asli Stitch (referensi)
```

## Yang bisa diatur dari panel admin

Semua konten dinamis, berlaku untuk semua pengunjung dari perangkat mana pun:

- Pengaturan Situs: nama sekolah, inisial logo, tagline, akreditasi, telepon, email, alamat,
  label PPDB, dan ganti kata sandi admin.
- Pendaftaran lembaga baru: halaman `register.html` — lembaga lain mendaftar, memilih
  subdomain gratis `*.fazacloud.my.id` atau domain custom, dan sistem LANGSUNG membuatkan
  instance website sekolah terpisah (multi-tenant aktif). Setiap tenant punya situs, konten,
  dan panel admin sendiri yang terisolasi di `/t/<slug>/`. Data tenant di `server/tenants/<slug>.json`.
- Landing page produk (`landing.html`, jadi halaman `/`) bergaya hosting modern (navy + hijau),
  dengan tombol Daftar dan menu ke jurnal.cc.cd untuk pengelolaan jurnal sekolah.
- Tema & Tampilan: pilih 4 preset tema (Nusantara, Al-Izzah, Luqman Al-Hakim, SMAN 1 Yogyakarta)
  yang mengubah tampilan/layout (bukan hanya warna) — hero, kartu, sudut, tipografi, statistik.
  Aktifkan kustomisasi untuk mengatur warna utama, aksen, background, dan font sendiri.
  Atur juga gambar background hero semua halaman dan ukuran footer (ringkas/normal/lebar).
  Perubahan berlaku untuk semua pengunjung.
- Akses admin: tombol "Login" ada di topbar situs publik; tombol "Keluar" ada di topbar panel admin.
- Gambar diunggah langsung dari panel admin (tombol "Pilih Gambar…"), bukan tempel link:
  hero situs, gambar artikel, foto galeri, foto guru, dan foto kepala sekolah.
  Masing-masing form menampilkan panduan ukuran yang disarankan dan preview thumbnail.
- Berita & Artikel: tambah, edit, hapus, terbitkan/draft
- Galeri Kegiatan: foto + caption + bentuk tampilan
- Tenaga Pendidik: nama, jabatan, foto, bio
- Konten Halaman: statistik beranda, sambutan kepala sekolah, fasilitas,
  konten PPDB (judul, jalur, alur, jadwal penting)
- Pendaftar PPDB: data dari form publik, ubah status, export CSV
- Pesan Masuk: data dari form kontak, tandai dibaca, hapus

## API (untuk pengembang)

```
POST /api/login                { email, password } -> { token }
GET  /api/<resource>           publik: identitas, artikel, galeri, guru, statistik, sambutan, ppdb, fasilitas
POST /api/pendaftar            publik: kirim form PPDB
POST /api/pesan                publik: kirim form kontak
GET  /api/pendaftar|pesan      admin (Authorization: Bearer <token>)
PUT  /api/<resource>           admin: simpan seluruh koleksi/objek
POST /api/reset                admin: reset konten ke bawaan (pesan & pendaftar tetap)
```

## Deploy ke produksi

1. Upload seluruh folder ke server yang punya Node.js 18+.
2. Jalankan dengan process manager: `pm2 start server/server.js --name sekolah`
3. Set kredensial: `ADMIN_EMAIL=... ADMIN_PASSWORD=... pm2 start ...`
4. Port default 8000; ubah dengan `PORT=80 node server/server.js` (butuh izin) atau
   pasang reverse proxy (Nginx) di depannya.

Data tersimpan di `server/data.json` — backup file itu secara berkala.
