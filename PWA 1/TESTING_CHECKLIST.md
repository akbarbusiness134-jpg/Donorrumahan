# ✅ TESTING CHECKLIST - Dashboard Admin

Gunakan checklist ini untuk memverifikasi semua refactoring berjalan dengan baik.

---

## 🔍 PRE-TESTING

- [x] ✅ Compilation successful (no TypeScript errors)
- [x] ✅ No diagnostics errors
- [x] ✅ All new files created
- [x] ✅ All imports resolve correctly

---

## 🧪 FUNCTIONAL TESTING

### 1. Authentication & Layout
- [ ] Login dengan admin@sahabatdarah.id / admin123
- [ ] Dashboard layout muncul dengan benar
- [ ] Sidebar navigation berfungsi
- [ ] Clock di header desktop update setiap detik
- [ ] Mobile menu (hamburger) berfungsi
- [ ] Logout berfungsi

### 2. Admin Dashboard (Ringkasan)
- [ ] Halaman ringkasan menampilkan statistik
- [ ] Counter permintaan baru benar
- [ ] Total pendonor ditampilkan
- [ ] Pengumuman aktif count benar

### 3. Permintaan Masuk
- [ ] List permintaan tampil dengan benar
- [ ] Filter/search berfungsi
- [ ] Badge status (Baru, Diproses, Selesai) tampil
- [ ] Badge golongan darah tampil dengan benar
- [ ] Time difference ("2 jam yang lalu") tampil
- [ ] Date formatting ("20 Juni 2026 14:30") benar
- [ ] Tombol "Proses" buka modal
- [ ] Input nama PIC di modal berfungsi
- [ ] Simpan PIC berhasil
- [ ] Tombol WhatsApp berfungsi (buka WhatsApp)
- [ ] "Cari Donor" redirect ke halaman donors dengan filter
- [ ] "Copy Data Permintaan" copy ke clipboard
- [ ] Badge "Terakhir Dihubungi" muncul setelah WhatsApp
- [ ] Mobile view: cards stack dengan baik

### 4. Pencarian Pendonor
- [ ] Search bar berfungsi (nama & nomor)
- [ ] Filter golongan darah berfungsi
- [ ] Tombol "Semua" show grid view (12 per page)
- [ ] Filter spesifik (A+, O-, dll) show single view
- [ ] Badge "Bisa" / "Tunggu X hari" tampil benar
- [ ] "Terakhir Dihubungi" badge muncul jika ada
- [ ] Tombol WhatsApp berfungsi
- [ ] Confirmation jika sudah pernah dihubungi
- [ ] Timestamp "lastContacted" tersimpan
- [ ] Modal "Detail" tampilkan biodata lengkap
- [ ] Modal "Edit Biodata" berfungsi
  - [ ] Input fields terisi dengan data existing
  - [ ] Save changes berhasil
  - [ ] Data terupdate di list
- [ ] Modal "Riwayat" untuk update tanggal donor
- [ ] Tombol Hapus berfungsi dengan confirmation
- [ ] Navigation "Sebelumnya" / "Berikutnya" berfungsi
- [ ] Pagination persist setelah reload (localStorage)
- [ ] Mobile: Cards responsive, tombol accessible

### 5. Pengumuman
- [ ] List pengumuman tampil
- [ ] Counter "X/5 aktif" benar
- [ ] Checkbox "Tampilkan di beranda" berfungsi
- [ ] Alert jika sudah 5 pengumuman aktif
- [ ] Tombol "Buat Pengumuman" buka modal
- [ ] Form fields (Judul, Deskripsi, Tanggal, Waktu, Lokasi) berfungsi
- [ ] Checkbox "Tandai sebagai Penting" berfungsi
- [ ] Simpan pengumuman baru berhasil
- [ ] Edit pengumuman berfungsi
- [ ] Hapus pengumuman dengan confirmation
- [ ] Toast notifications muncul
- [ ] Mobile: Modal scrollable, form usable

### 6. Publikasi & Dokumentasi
- [ ] List artikel tampil dengan tag
- [ ] Counter "5 artikel terbaru otomatis tampil" info
- [ ] Checkbox "Tampilkan deskripsi section" berfungsi
- [ ] Tombol "Artikel Baru" buka modal
- [ ] Form fields (Judul, Tag) berfungsi
- [ ] Markdown editor toolbar berfungsi:
  - [ ] Bold button
  - [ ] Italic button
  - [ ] List button
  - [ ] Link button (prompt URL & label)
- [ ] Upload foto artikel berfungsi
- [ ] Preview foto tampil
- [ ] Keterangan foto & posisi foto berfungsi
- [ ] Simpan artikel baru berhasil
- [ ] Edit artikel berfungsi (data terisi)
- [ ] Hapus artikel dengan confirmation
- [ ] Mobile: Modal scrollable, editor usable

### 7. Galeri
- [ ] List foto galeri tampil (grid 3 kolom)
- [ ] Counter "(X foto)" benar
- [ ] Checkbox "Tampilkan judul section" berfungsi
- [ ] Checkbox "Tampilkan deskripsi section" berfungsi
- [ ] Upload foto baru:
  - [ ] Click area buka file picker
  - [ ] Preview foto muncul setelah upload
  - [ ] Caption field berfungsi
  - [ ] Tombol "Tambah ke Galeri" berhasil
- [ ] Edit foto galeri:
  - [ ] Data terisi (foto & caption)
  - [ ] Update berhasil
- [ ] Hapus foto dengan confirmation
- [ ] Mobile: Grid responsive (2 kolom di mobile)

### 8. Header · Hero · Footer (CMS)
- [ ] Tab navigation berfungsi
- [ ] **Tab Header:**
  - [ ] Upload logo berfungsi (PNG transparan supported)
  - [ ] Preview logo tampil
  - [ ] Nama Organisasi & Tagline fields berfungsi
  - [ ] Tambah menu navigasi berfungsi
  - [ ] Edit label & href menu berfungsi
  - [ ] Hapus menu berfungsi
  - [ ] Simpan perubahan berhasil
- [ ] **Tab Hero & KSR PMI UNHAS:**
  - [ ] Upload gambar hero berfungsi
  - [ ] Judul & sub-judul hero fields berfungsi
  - [ ] Label & link tombol aksi berfungsi (2 tombol)
  - [ ] Judul KSR PMI UNHAS field berfungsi
  - [ ] Upload foto KSR PMI UNHAS berfungsi
  - [ ] Keterangan & posisi foto berfungsi
  - [ ] Markdown editor untuk isi berfungsi (toolbar)
  - [ ] Tab key indentasi berfungsi
  - [ ] Simpan perubahan berhasil
- [ ] **Tab Footer:**
  - [ ] Deskripsi, hak cipta, tagline fields berfungsi
  - [ ] Nomor telepon, email fields berfungsi
  - [ ] Alamat & URL Google Maps berfungsi
  - [ ] Upload logo PDDK berfungsi
  - [ ] Social media fields (IG, FB, Twitter, Threads, TikTok, YouTube, WhatsApp) berfungsi
  - [ ] Simpan perubahan berhasil
- [ ] Mobile: Tabs scrollable horizontal, forms usable

---

## 💾 DATA PERSISTENCE

- [ ] Refresh halaman: Data tetap ada (localStorage)
- [ ] Logout & login kembali: Data tetap ada
- [ ] Close tab & buka kembali: State tersimpan
- [ ] Filter donor persist setelah reload
- [ ] Pagination index persist setelah reload

---

## 🎨 UI/UX TESTING

### Desktop (1920x1080)
- [ ] Layout tidak broken
- [ ] Sidebar fixed position
- [ ] Clock di header tampil
- [ ] Modal centered
- [ ] Form fields width proper

### Tablet (768x1024)
- [ ] Sidebar collapsible (hamburger menu)
- [ ] Grid layout adjust (2-3 kolom)
- [ ] Modal scrollable
- [ ] Touch targets cukup besar

### Mobile (375x667)
- [ ] Hamburger menu accessible
- [ ] Cards stack vertical
- [ ] Form fields full width
- [ ] Modal full height scrollable
- [ ] Buttons touch-friendly (min 44px)
- [ ] No horizontal scroll
- [ ] Text readable (tidak terlalu kecil)

---

## ⚡ PERFORMANCE TESTING

- [ ] Initial load cepat (<2s)
- [ ] Navigation antar halaman smooth
- [ ] Typing di form tidak lag
- [ ] Upload foto tidak freeze UI
- [ ] localStorage save tidak lag (debounced working)
- [ ] No console errors
- [ ] No console warnings (kecuali expected)

---

## 🔍 EDGE CASES

- [ ] Upload foto sangat besar (>5MB) - handled atau error?
- [ ] Input text sangat panjang - truncated atau wrapped?
- [ ] Tanggal invalid - error handling ok?
- [ ] localStorage full - error handling ok?
- [ ] Network offline - graceful degradation?

---

## 📱 BROWSER COMPATIBILITY

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - if available
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS) - if available

---

## 🐛 KNOWN ISSUES (Jika Ada)

*Catat di sini jika menemukan bug:*

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## ✅ FINAL CHECKLIST

- [ ] Semua functional tests passed
- [ ] Data persistence working
- [ ] UI/UX responsive di all devices
- [ ] Performance acceptable
- [ ] No critical bugs found
- [ ] Ready for staging/production

---

## 📝 NOTES

*Tambahkan catatan tambahan di sini:*

_______________________________________________
_______________________________________________
_______________________________________________

---

**Status:** [ ] IN PROGRESS / [ ] ✅ COMPLETED  
**Tested By:** _______________  
**Date:** _______________

---

## 🚀 NEXT STEPS AFTER TESTING

1. [ ] Fix any bugs found
2. [ ] Document any issues for team
3. [ ] Deploy to staging
4. [ ] Get user acceptance testing (UAT)
5. [ ] Deploy to production

---

**Happy Testing! 🎉**
