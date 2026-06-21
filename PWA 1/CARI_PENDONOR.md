# Halaman Bantuan Cari Pendonor

## 📋 Deskripsi

Halaman form untuk pengajuan permintaan pencarian pendonor darah bagi pasien yang membutuhkan transfusi darah.

## 🔗 Akses Halaman

- **URL Route:** `/cari-pendonor`
- **Link dari Hero:** Tombol CTA kedua "Bantuan Cari Pendonor"
- **Link dari Footer:** Quick link di kolom brand

## ✨ Fitur

### 1. Form Input Terstruktur

**DATA PASIEN:**
- Nama Pasien
- Golongan Darah Dibutuhkan (dropdown: A+, A-, B+, B-, AB+, AB-, O+, O-)
- Jumlah Kantong Darah (1-20)
- Nama Rumah Sakit
- Unit Transfusi Darah (UTD)

**DATA PENANGGUNG JAWAB:**
- Nama Penanggung Jawab
- Nomor Telepon/WhatsApp (auto-format ke +62)
- Hubungan dengan Pasien

**INFORMASI TAMBAHAN:**
- Catatan Tambahan (opsional) - untuk menjelaskan kondisi atau kebutuhan khusus

### 2. Alert Card Darurat
- Card khusus dengan warna amber untuk kondisi darurat
- Menampilkan nomor hotline Badan PDDK
- Icon AlertCircle untuk menarik perhatian

### 3. Validasi Real-time
- Validasi semua kolom wajib
- Error message inline per field
- Error hilang saat user mulai mengetik
- Validasi jumlah kantong darah (1-20)
- Validasi nomor telepon (10-15 digit)

### 4. User Experience
- Tombol "Kembali ke Beranda"
- Loading state saat submit
- Toast notification detail dengan ID request
- Auto-redirect ke homepage setelah 3 detik
- Form reset otomatis setelah berhasil
- Responsive design

## 🔧 Teknologi

- **Framework:** React + TanStack Router
- **Form Handling:** React useState dengan validasi manual
- **UI Components:** shadcn/ui (Card, Button, Input, Label, Select, Textarea)
- **Notifications:** Sonner toast
- **State Management:** Admin Store (Zustand + localStorage)

## 📊 Data Flow

1. User mengisi form permintaan donor
2. Klik tombol "Kirim Permintaan"
3. Form divalidasi:
   - Jika gagal: tampilkan error message
   - Jika sukses: lanjut ke langkah 4
4. Generate ID request: `REQ-{timestamp}`
5. Normalisasi nomor telepon ke format +62
6. Generate timestamp format Indonesia
7. Simpan ke admin store dengan status "Baru"
8. Tampilkan toast sukses dengan ID request
9. Reset form
10. Redirect ke homepage setelah 3 detik

## 📝 Validasi Rules

### Nama Pasien
- Wajib diisi
- Minimal 3 karakter

### Golongan Darah
- Wajib dipilih dari dropdown

### Jumlah Kantong Darah
- Wajib diisi
- Minimal: 1 kantong
- Maksimal: 20 kantong
- Harus berupa angka

### Nama Rumah Sakit
- Wajib diisi

### Unit Transfusi Darah (UTD)
- Wajib diisi
- Contoh: UTD PMI Pusat, UTD PMI Jakarta Selatan

### Nama Penanggung Jawab
- Wajib diisi
- Minimal 3 karakter

### Nomor Telepon
- Wajib diisi
- Minimal 10 digit
- Maksimal 15 digit
- Auto-convert ke format +62

### Hubungan dengan Pasien
- Wajib diisi
- Contoh: Suami, Istri, Anak, Saudara

### Catatan Tambahan
- Opsional
- Textarea untuk keterangan detail

## 🔐 Data Storage

Data permintaan disimpan di:
- **Store:** Admin Store (Zustand)
- **Persistence:** localStorage dengan key `sd_admin_store`
- **Type:** `BloodRequest` interface dari `admin-data.ts`
- **Status Default:** "Baru"

## 🎨 Desain

### Header
- Icon Heart dengan background primary/10
- Judul: "Bantuan Cari Pendonor"
- Subtitle: "Kami akan membantu Anda menemukan pendonor darah yang sesuai"

### Alert Card
- Background: amber-50 (light mode) / amber-950/20 (dark mode)
- Border: amber-500/50
- Icon: AlertCircle
- Konten: Hotline darurat + instruksi

### Layout
- Max-width: 3xl (768px)
- Centered content
- 3 section dengan border-bottom separator
- Spacing konsisten

## 📱 Mobile Responsiveness

- Form fields full-width di mobile
- Grid 2 kolom (Golongan Darah & Jumlah Kantong) collapse ke 1 kolom di mobile
- Button full-width di mobile
- Alert card responsive
- Touch-friendly input fields

## 🎯 Use Cases

1. **Kondisi Darurat:**
   - User melihat alert card di atas form
   - Bisa langsung telepon hotline atau isi form
   - Form akan diproses prioritas jika urgent

2. **Permintaan Rutin:**
   - Isi form lengkap
   - Submit dan tunggu konfirmasi
   - Tim akan koordinasi dengan pendonor

3. **Operasi Terjadwal:**
   - Input data pasien yang akan operasi
   - Tentukan jumlah kantong yang dibutuhkan
   - Koordinasi dengan UTD

## 🔄 Integration dengan Admin Panel

Data yang dikirim melalui form ini akan:
1. Muncul di Dashboard Admin → Menu "Permintaan Darah"
2. Status awal: "Baru"
3. Admin dapat update status menjadi:
   - "Sedang Diproses" - saat mencari pendonor
   - "Selesai" - saat pendonor sudah ditemukan
4. Admin dapat assign PIC (Penanggung Jawab Internal)

## 🔔 Notifikasi

**Toast Success:**
- Judul: "Permintaan berhasil dikirim!"
- Deskripsi: "Permintaan {ID} telah tercatat. Tim kami akan segera menghubungi Anda."
- Durasi: 5 detik

**Toast Error:**
- Judul: "Terjadi kesalahan"
- Deskripsi: "Mohon coba lagi dalam beberapa saat."

## ⚠️ Error Handling

- Network errors: Toast error generic
- Validation errors: Inline error messages per field
- Submit disabled saat processing
- Form tidak reset jika submit gagal

## 🚀 Future Improvements

- [ ] Upload dokumen surat keterangan dokter
- [ ] Sistem tracking status permintaan via link/kode unik
- [ ] Email/SMS notification ke penanggung jawab
- [ ] Estimasi waktu pencarian pendonor
- [ ] Auto-matching dengan database pendonor
- [ ] Push notification ke pendonor yang sesuai
- [ ] Chat langsung dengan tim PDDK
- [ ] Rating & feedback setelah donor selesai
- [ ] History permintaan untuk user terdaftar

## ✅ Testing Checklist

### Akses Halaman
- [ ] Halaman dapat diakses via URL `/cari-pendonor`
- [ ] Link "Bantuan Cari Pendonor" di Hero section berfungsi
- [ ] Link "Bantuan Cari Pendonor" di Footer berfungsi

### Form Display & UI
- [ ] Header dengan icon Heart tampil
- [ ] Judul "Bantuan Cari Pendonor" tampil
- [ ] Tombol "Kembali ke Beranda" berfungsi
- [ ] Alert Card Darurat tampil dengan background amber
- [ ] Nomor hotline Badan PDDK tampil di alert card
- [ ] Icon AlertCircle tampil di alert card
- [ ] 3 section terpisah dengan border (Data Pasien, Penanggung Jawab, Info Tambahan)

### Section: Data Pasien
- [ ] **Nama Pasien**: Error jika kosong atau < 3 karakter
- [ ] **Golongan Darah**: Dropdown menampilkan 8 pilihan
- [ ] **Jumlah Kantong**: Input number, min 1, max 20
- [ ] **Nama Rumah Sakit**: Error jika kosong
- [ ] **Unit Transfusi Darah (UTD)**: Error jika kosong

### Section: Data Penanggung Jawab
- [ ] **Nama Penanggung Jawab**: Error jika kosong atau < 3 karakter
- [ ] **Nomor Telepon**: Auto-convert 0812 → 62812, 812 → 62812
- [ ] **Nomor Telepon**: Error jika < 10 digit atau > 15 digit
- [ ] **Hubungan dengan Pasien**: Error jika kosong

### Section: Informasi Tambahan
- [ ] **Catatan Tambahan**: Textarea tampil
- [ ] **Catatan Tambahan**: Opsional, boleh kosong
- [ ] **Catatan Tambahan**: Dapat input teks panjang

### Error Messages
- [ ] Error message muncul saat submit dengan data invalid
- [ ] Error message hilang saat user mulai mengetik
- [ ] Error message jelas dan spesifik per field
- [ ] Error text berwarna destructive (red)

### Submit & Response
- [ ] Tombol "Kirim Permintaan" disabled saat loading
- [ ] Loading state tampil saat processing
- [ ] Toast success muncul dengan ID request (REQ-xxx)
- [ ] Form di-reset setelah submit berhasil
- [ ] Auto-redirect ke homepage setelah 3 detik
- [ ] Data tersimpan di localStorage (cek DevTools)

### Data Storage
- [ ] Request ID auto-generate dengan format `REQ-{timestamp}`
- [ ] Nomor telepon tersimpan dalam format +62
- [ ] Timestamp format Indonesia (DD Bulan YYYY HH:MM)
- [ ] Status default: "Baru"
- [ ] Data masuk ke admin store `sd_admin_store`
- [ ] Data dapat dilihat di Admin Panel → Menu Permintaan Masuk

### Mobile Responsive
- [ ] Layout baik di layar 375px (mobile)
- [ ] Alert card responsive di mobile
- [ ] Form fields full-width di mobile
- [ ] Grid 2 kolom (Golongan Darah & Jumlah Kantong) collapse ke 1 kolom
- [ ] Button full-width dan mudah diklik di mobile
- [ ] Textarea responsive di mobile

### Browser Compatibility
- [ ] Chrome/Edge: Semua fitur bekerja
- [ ] Firefox: Semua fitur bekerja
- [ ] Safari: Semua fitur bekerja (jika di Mac/iOS)

### Edge Cases
- [ ] Submit form kosong → Semua error muncul
- [ ] Input jumlah kantong 0 → Error "minimal 1"
- [ ] Input jumlah kantong 21 → Error "maksimal 20"
- [ ] Input nomor telepon < 10 digit → Error
- [ ] Input nomor telepon > 15 digit → Error
- [ ] Refresh page saat form terisi → Data form hilang (expected)

### Integration dengan Admin
- [ ] Data muncul di Dashboard Admin
- [ ] Status "Baru" tampil dengan badge yang sesuai
- [ ] Admin dapat update status ke "Sedang Diproses"
- [ ] Admin dapat update status ke "Selesai"
- [ ] Admin dapat assign PIC
- [ ] Admin dapat delete request
- [ ] Timestamp tampil dalam format Indonesia

---

## 📞 Support

Untuk bantuan lebih lanjut:
- **Hotline Darurat:** Badan PDDK (lihat di alert card)
- **WhatsApp:** Nomor di footer
- **Email:** Email resmi di footer
