(function(){
  var path=location.pathname;
  var base=(path.match(/^\/t\/[a-z0-9-]+/)||[''])[0];
  var role=sessionStorage.getItem('jurnal_role')||'';
  if(!role){
    if(path.includes('/jurnal/admin/')) role='admin';
    else if(path.includes('/jurnal/guru/')) role='guru';
    else if(path.includes('/jurnal/siswa/')) role='siswa';
    else if(path.includes('/jurnal/wali/')) role='wali';
    else if(path.includes('/jurnal/kanteen/')) role='kasir';
  }
  if(!role || path.endsWith('/jurnal/login.html')) return;
  document.body.classList.add('jurnal-shell','jurnal-'+role);
  var sets={
    admin:[['Utama','index.html','🏠','Dashboard'],['Master Data','users.html','👥','Pengguna'],['','siswa.html','🎓','Data Siswa'],['','gtk.html','👨‍🏫','Data GTK'],['','mapel.html','📚','Mapel'],['','rombel.html','🏫','Rombel'],['','kelas.html','🏫','Kelas'],['','kalender-kbm.html','🗓️','Kalender KBM'],['','jadwal.html','📅','Jadwal'],['','pengajar.html','👨‍🏫','Pengajar'],['','wali-kelas.html','👥','Wali Kelas'],['','tahun-ajaran.html','🗓️','Tahun Ajaran'],['Absensi','absensi-siswa.html','✅','Absensi Siswa'],['','absensi-guru.html','📍','Absensi Guru'],['','ceklok.html','📍','Ceklok Saya'],['','rekap-absensi.html','📊','Rekap'],['','absensi-ekskul.html','⚽','Ekskul'],['','absensi-jamaah.html','🕌','Jamaah'],['','absensi-kegiatan.html','🎯','Kegiatan'],['','absensi-kokurikuler.html','🤝','Kokurikuler'],['Akademik','jurnal.html','📓','Jurnal Mengajar'],['','penilaian.html','📝','Penilaian'],['','rapor.html','📄','Rapor'],['','beasiswa.html','🎓','Beasiswa'],['','modul-ajar.html','📘','Modul Ajar'],['','catatan-kepribadian.html','🧠','Catatan'],['','supervisi.html','✅','Supervisi'],['Keuangan','keuangan.html','💰','Tagihan & Tabungan'],['','tagihan.html','🧾','Tagihan'],['','tabungan.html','🏦','Tabungan'],['','bendahara.html','💼','Bendahara'],['','cashless.html','🛒','Cashless'],['Lainnya','posting.html','📢','Posting'],['','broadcast.html','✉️','Broadcast WA'],['','wa-gateway.html','📲','WA Gateway'],['','notif-settings.html','🔔','Notif Otomatis'],['','domain-setup.html','🌐','Domain Setup'],['','erkam.html','📒','ERKAM'],['','settings.html','⚙️','Pengaturan'],['','backup-restore.html','💾','Backup Restore'],['','superadmin.html','🛡️','Superadmin']],
    guru:[['Utama','index.html','🏠','Dashboard'],['Akademik','jadwal.html','📅','Jadwal Saya'],['','jurnal.html','📓','Jurnal Mengajar'],['','penilaian.html','📝','Penilaian Harian'],['','modul-ajar.html','📘','Modul Ajar'],['','catatan.html','🧠','Catatan'],['','rombel.html','🏫','Kelas Wali Saya'],['','posting.html','📢','Posting'],['Absensi','absensi.html','✅','Absensi Siswa'],['','absensi-siswa.html','✅','Absensi Siswa (Detail)'],['','absensi-ekskul.html','⚽','Absensi Ekskul'],['','ceklok.html','📍','Ceklok Saya'],['','absensi-guru.html','📍','Absensi Saya']],
    siswa:[['Utama','index.html','🏠','Dashboard'],['Siswa','jadwal.html','📅','Jadwal'],['','absensi.html','✅','Absensi Saya'],['','nilai.html','📝','Nilai'],['','ekskul.html','⚽','Ekskul'],['','posting.html','📢','Posting']],
    wali:[['Utama','index.html','🏠','Dashboard Wali']],
    kasir:[['Utama','index.html','🛒','E-Kanteen']]
  };
  var items=sets[role]||[];
  var cur=path.split('/').pop()||'index.html';
  var html='<button class="jurnal-toggle" id="jurnalToggle">☰</button><aside class="jurnal-sidebar" id="jurnalSidebar"><div class="jurnal-brand"><div class="jurnal-logo">JR</div><div><strong>Jurnal Sekolah</strong><span>'+role.toUpperCase()+' · FazaCloud</span></div></div><nav class="jurnal-nav">';
  var last='';
  items.forEach(function(it){ if(it[0]&&it[0]!==last){ html+='<div class="jurnal-section">'+it[0]+'</div>'; last=it[0]; } html+='<a href="'+it[1]+'" class="'+(cur===it[1]?'active':'')+'"><span class="ico">'+it[2]+'</span><span>'+it[3]+'</span></a>'; });
  html+='</nav><div class="jurnal-footer"><div>'+(sessionStorage.getItem('jurnal_nama')||role)+'</div><button class="jurnal-logout" id="jurnalLogout">Keluar</button></div></aside>';
  document.body.insertAdjacentHTML('afterbegin',html);
  var side=document.getElementById('jurnalSidebar');
  document.getElementById('jurnalToggle').onclick=function(){side.classList.toggle('open')};
  document.getElementById('jurnalLogout').onclick=function(){sessionStorage.clear();location.href=base+'/jurnal/login.html'};
})();
