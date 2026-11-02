# Implementasi 11: Penyembunyian Menu Simulasi Prediksi ML dari Sidebar

Dokumen ini mencatat penyesuaian navigasi pada platform frontend **SIPADI** (*Sistem Prediksi dan Interpretasi Produktivitas Tanaman Padi*), di mana menu **Simulasi Prediksi ML** disembunyikan sementara dari sidebar menunggu konfirmasi lebih lanjut terkait spesifikasi input dan inferensi model.

---

## 1. Latar Belakang & Tindakan
- **Status Rencana Inferensi:** Rencana arsitektur input, inferensi XGBoost, SHAP, dan ALE telah selesai disusun dalam dokumen [`docs/implementations/10-rencana-implementasi-input-inferensi-shap-ale.md`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/docs/implementations/10-rencana-implementasi-input-inferensi-shap-ale.md).
- **Penyembunyian Halaman Lab:** Sesuai arahan pengguna, menu navigasi *"Simulasi Prediksi ML"* disembunyikan sementara dari [`AppSidebar.tsx`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/src/components/layout/AppSidebar.tsx) agar tidak membingungkan pengguna sebelum format input dikonfirmasi ulang.
- **Konservasi Kode:** Berkas kode halaman [`PredictionModelPage.tsx`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/src/pages/PredictionModelPage.tsx) dan rute `/dashboard/prediction-model` tetap disimpan dalam codebase sehingga siap diaktifkan kembali sewaktu-waktu.

---

## 2. Rincian Modifikasi Berkas

### A. `src/components/layout/AppSidebar.tsx`
- Menghapus entri `Simulasi Prediksi ML` dari array `navItems`.
- Menu navigasi yang aktif di sidebar saat ini:
  1. **Monitoring** (`/dashboard/monitoring`)
  2. **Analysis (XAI)** (`/dashboard/analysis`)
  3. **Insight & Peta** (`/dashboard/insight`)
  4. **Tentang Sistem** (`/dashboard/about`)

### B. `src/pages/InsightPage.tsx`
- Menyesuaikan tombol aksi cepat di bagian bawah kartu *"Kesimpulan Secara Keseluruhan"* agar mengarah ke **"Lihat Monitoring Agroklimat"** (`/dashboard/monitoring`) dan **"Lihat Detail XAI"** (`/dashboard/analysis`).

---

## 3. Validasi Kompilasi
- Perintah `npm run build` dijalankan dan sukses dengan **0 error** (waktu build 600ms).
- Aplikasi berjalan mulus dan bersih.
