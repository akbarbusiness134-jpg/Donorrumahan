# Halaman Pendaftaran Pendonor Pengganti

## 📋 Deskripsi

Halaman form pendaftaran untuk calon pendonor pengganti yang ingin bergabung dengan jaringan pendonor darah.

## 🔗 Akses Halaman

- **URL Route:** `/daftar-pendonor`
- **Link dari Hero:** Tombol CTA pertama "Daftar Jadi Pendonor"
- **Link dari Footer:** Quick link di kolom brand

## ✨ Fitur

### 1. Form Input Lengkap
- **Nama Lengkap** - Minimal 3 karakter
- **Golongan Darah** - Pilihan: A+, A-, B+, B-, AB+, AB-, O+, O-
- **Usia** - Rentang: 17-65 tahun
- **Berat Badan** - Minimal: 47 kg
- **Nomor Telepon/WhatsApp** - Format Indonesia, otomatis dinormalisasi ke format +62
- **Tempat Lahir** - Text field
- **Tanggal Lahir** - Date picker, validasi usia
- **Tanggal Donor Terakhir** - Opsional, untuk pendonor yang sudah pernah mendonor

### 2. Validasi Real-time
- Error message langsung muncul saat submit
- Error hilang saat user mulai mengetik di field yang error
- Validasi komprehensif untuk semua field wajib

### 3. Persyaratan Donor
Card informasi yang menampilkan 7 persyaratan donor darah:
1. Usia minimal 17 tahun
2. Berat badan minimal 47 kg
3. Dalam kondisi sehat jasmani
4. Tidur minimal 5 jam
5. Tidak sedang dalam masa haid
6. Jarak waktu dari donor darah sebelumnya 8 pekan
7. Sudah makan 30 menit sebelum mendonor

### 4. User Experience
- Tombol "Kembali ke Beranda" di atas form
- Loading state saat submit
- Toast notification sukses/error
- Auto-redirect ke homepage setelah 2 detik jika berhasil
- Responsive design untuk mobile dan desktop

## 🔧 Teknologi

- **Framework:** React + TanStack Router
- **Form Handling:** React useState dengan validasi manual
- **UI Components:** shadcn/ui (Card, Button, Input, Label, Select)
- **Notifications:** Sonner toast
- **State Management:** Admin Store (Zustand + localStorage)

## 📊 Data Flow

1. User mengisi form
2. Klik tombol "Daftar Sekarang"
3. Form divalidasi:
   - Jika gagal: tampilkan error message
   - Jika sukses: lanjut ke langkah 4
4. Generate ID donor otomatis: `D-{timestamp}`
5. Normalisasi nomor telepon ke format +62
6. Simpan ke admin store (localStorage)
7. Tampilkan toast sukses
8. Reset form
9. Redirect ke homepage setelah 2 detik

## 🎨 Desain

### Header
- Icon Droplet dengan background primary/10
- Judul: "Daftar Pendonor Pengganti"
- Subtitle: "Bergabunglah dengan jaringan pendonor..."

### Layout
- Max-width: 3xl (768px)
- Centered content
- Card dengan shadow dan border
- Spacing konsisten

### Color Scheme
- Primary color untuk accent
- Destructive color untuk error messages
- Muted color untuk helper text

## 📝 Validasi Rules

### Nama Lengkap
- Wajib diisi
- Minimal 3 karakter

### Golongan Darah
- Wajib dipilih dari dropdown

### Usia
- Wajib diisi
- Rentang: 17-65 tahun
- Harus berupa angka

### Berat Badan
- Wajib diisi
- Minimal: 47 kg
- Maksimal: 200 kg
- Dapat desimal (contoh: 52.5)

### Nomor Telepon
- Wajib diisi
- Minimal 10 digit
- Maksimal 15 digit
- Auto-convert ke format +62:
  - `0812...` → `62812...`
  - `812...` → `62812...`
  - `+62812...` → `62812...`

### Tempat Lahir
- Wajib diisi

### Tanggal Lahir
- Wajib diisi
- Harus menghasilkan usia 17-65 tahun
- Tidak boleh tanggal masa depan

### Tanggal Donor Terakhir (Opsional)
- Tidak boleh tanggal masa depan
- Kosongkan jika belum pernah donor

## 🔐 Data Storage

Data pendonor disimpan di:
- **Store:** Admin Store (Zustand)
- **Persistence:** localStorage dengan key `sd_admin_store`
- **Type:** `Donor` interface dari `admin-data.ts`

## 🚀 Cara Menggunakan

### Sebagai User
1. Klik tombol "Daftar Jadi Pendonor" di Hero section
2. Atau klik link "Daftar Jadi Pendonor" di Footer
3. Isi semua field yang wajib (bertanda *)
4. Klik "Daftar Sekarang"
5. Tunggu notifikasi sukses
6. Otomatis kembali ke beranda

### Sebagai Admin
Data pendonor yang terdaftar dapat diakses melalui:
1. Dashboard Admin → Menu "Pendonor"
2. Data tersimpan di localStorage
3. Dapat diedit/dihapus dari admin panel

## 📱 Mobile Responsiveness

- Form field full-width di mobile
- Grid 2 kolom (Usia & Berat Badan, Tempat & Tanggal Lahir) collapse ke 1 kolom di mobile
- Button full-width di mobile
- Touch-friendly input fields
- Optimized spacing untuk layar kecil

## 🎯 Use Cases

1. **Pendonor Baru:**
   - Belum pernah donor → kosongkan "Tanggal Donor Terakhir"
   - Sistem akan accept dan simpan data

2. **Pendonor Existing:**
   - Sudah pernah donor → isi "Tanggal Donor Terakhir"
   - Membantu tracking eligibility di masa depan

3. **Pendonor Pengganti:**
   - Daftar saat ada kebutuhan urgent
   - Data langsung masuk database untuk dihubungi

## ⚠️ Error Handling

- Network errors: Toast error "Terjadi kesalahan"
- Validation errors: Inline error messages per field
- Submit disabled saat processing
- Form tidak reset jika submit gagal

## 🔄 Future Improvements

- [ ] Email verification
- [ ] Upload KTP/identitas
- [ ] SMS OTP untuk verifikasi nomor telepon
- [ ] Integration dengan database backend
- [ ] Email confirmation setelah pendaftaran
- [ ] Cek duplikasi nomor telepon
- [ ] Export data pendonor ke Excel/CSV
- [ ] Filter pendonor berdasarkan lokasi/kota
- [ ] Push notification untuk kebutuhan donor urgent

## ✅ Testing Checklist

### Akses Halaman
- [ ] Halaman dapat diakses via URL `/daftar-pendonor`
- [ ] Link "Daftar Jadi Pendonor" di Hero section berfungsi
- [ ] Link "Daftar Jadi Pendonor" di Footer berfungsi

### Form Display & UI
- [ ] Header dengan icon Droplet tampil
- [ ] Judul "Daftar Pendonor Pengganti" tampil
- [ ] Tombol "Kembali ke Beranda" berfungsi
- [ ] Card "Persyaratan Donor" tampil dengan 7 poin
- [ ] Semua form fields tampil lengkap
- [ ] Label bertanda (*) untuk field wajib
- [ ] Placeholder text jelas dan membantu

### Input & Validasi
- [ ] **Nama Lengkap**: Error jika kosong atau < 3 karakter
- [ ] **Golongan Darah**: Dropdown menampilkan 8 pilihan (A+, A-, B+, B-, AB+, AB-, O+, O-)
- [ ] **Usia**: Error jika < 17 atau > 65 tahun
- [ ] **Berat Badan**: Error jika < 47 kg, accept desimal (52.5)
- [ ] **Nomor Telepon**: Auto-convert 0812 → 62812, 812 → 62812
- [ ] **Tempat Lahir**: Error jika kosong
- [ ] **Tanggal Lahir**: Date picker berfungsi, validasi usia sesuai
- [ ] **Tanggal Donor Terakhir**: Opsional, boleh kosong, tidak boleh masa depan

### Error Messages
- [ ] Error message muncul saat submit dengan data invalid
- [ ] Error message hilang saat user mulai mengetik
- [ ] Error message jelas dan spesifik per field
- [ ] Error text berwarna destructive (red)

### Submit & Response
- [ ] Tombol "Daftar Sekarang" disabled saat loading
- [ ] Loading state tampil saat processing
- [ ] Toast success muncul setelah submit berhasil
- [ ] Form di-reset setelah submit berhasil
- [ ] Auto-redirect ke homepage setelah 2 detik
- [ ] Data tersimpan di localStorage (cek DevTools)

### Data Storage
- [ ] Donor ID auto-generate dengan format `D-{timestamp}`
- [ ] Nomor telepon tersimpan dalam format +62
- [ ] Data masuk ke admin store `sd_admin_store`
- [ ] Data dapat dilihat di Admin Panel → Menu Pendonor

### Mobile Responsive
- [ ] Layout baik di layar 375px (mobile)
- [ ] Form fields full-width di mobile
- [ ] Grid 2 kolom collapse ke 1 kolom di mobile
- [ ] Button full-width dan mudah diklik di mobile
- [ ] Touch-friendly input fields
- [ ] Keyboard mobile tidak menutupi input

### Browser Compatibility
- [ ] Chrome/Edge: Semua fitur bekerja
- [ ] Firefox: Semua fitur bekerja
- [ ] Safari: Semua fitur bekerja (jika di Mac/iOS)

### Edge Cases
- [ ] Submit form kosong → Semua error muncul
- [ ] Input usia 16 → Error "minimal 17 tahun"
- [ ] Input usia 66 → Error "maksimal 65 tahun"
- [ ] Input berat 46 → Error "minimal 47 kg"
- [ ] Tanggal lahir masa depan → Error validation
- [ ] Tanggal donor masa depan → Error validation
- [ ] Nomor telepon < 10 digit → Error
- [ ] Nomor telepon > 15 digit → Error

---

## 📞 Support

Jika ada pertanyaan atau masalah dengan halaman pendaftaran, silakan hubungi admin melalui:
- Email resmi di footer
- WhatsApp Badan PDDK
- Phone Kemitraan & Informasi
