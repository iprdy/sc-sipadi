# Implementasi 02: Autentikasi Demo dan Halaman Publik (Homepage, Login, Register)

**Tanggal:** 27 Oktober 2026  
**Status:** Selesai  
**Tujuan:** Membangun antarmuka publik yang mengenalkan platform SIPADI, menyediakan alur simulasi login dan registrasi akun, serta memfasilitasi transisi navigasi menuju area dashboard.

---

## 1. Komponen yang Diimplementasikan

### 1.1 Homepage (`src/pages/Homepage.tsx`)
- **Hero Viewport:** Menampilkan headline utama *"Pantau Produktivitas Tanaman, Pahami Faktor Lingkungannya"*, badge status Remote Sensing & XAI, dan visual lanskap Subak Jatiluwih dengan overlay telemetri.
- **Sensor Telemetry Strips:** Menampilkan ringkasan langsung metrik agroklimat (Produktivitas 5.21 ton/ha, NDVI 0.68, LST 27.4°C, Curah Hujan 1.820 mm).
- **Alur Kerja SIPADI (4 Langkah):**
  1. Akuisisi Data Satelit (Sentinel-2 MSI & CHIRPS v2.0)
  2. Harmonisasi Spasial & Elevasi Topografi Subak
  3. Komputasi Prediktif Model XGBoost Regressor
  4. Explainable AI (Dekomposisi SHAP & Kurva Respon ALE)
- **Call-to-Action (CTA):** Tombol menuju eksplorasi monitoring dan simulasi uji model ML.

### 1.2 Navbar Publik (`src/components/layout/PublicNavbar.tsx`)
- Logo SIPADI dengan identitas *Subak AI*.
- Tautan navigasi responsif ke Beranda, Monitoring, Analisis XAI, Insight Spasial, Simulasi Prediksi ML, dan Tentang Sistem.
- Kontrol status autentikasi: tombol *Masuk*, *Daftar*, dan *Buka Dashboard*.

### 1.3 Halaman Login (`src/pages/LoginPage.tsx`)
- Formulir email dan kata sandi dengan tombol *toggle* tampil/sembunyi kata sandi.
- Validasi input di sisi klien.
- **Tombol Pintas 1-Klik:** *"Isi Otomatis Kredensial Demo (Penyuluh)"* untuk memudahkan demonstrasi saat presentasi tanpa harus mengetik manual.
- Penyimpanan sesi simulasi ke `localStorage` melalui `AuthContext`.

### 1.4 Halaman Register (`src/pages/RegisterPage.tsx`)
- Formulir pendaftaran akun (Nama Lengkap, Email, Kata Sandi, dan Konfirmasi Kata Sandi).
- Validasi kesesuaian kata sandi (*password matching*) dan persetujuan ketentuan privasi data subak.
- Notifikasi keberhasilan simulasi dan pengalihan otomatis ke halaman Login.

---

## 2. Kesiapan Integrasi Backend
- Seluruh fungsi autentikasi dibungkus di dalam `src/context/AuthContext.tsx` dan `src/services/apiService.ts`.
- Ketika backend autentikasi produksi (OAuth2 / JWT token di FastAPI) telah dibuat, cukup mengganti fungsi `apiService.loginDemo()` dengan pemanggilan endpoint `POST /api/auth/token`.
