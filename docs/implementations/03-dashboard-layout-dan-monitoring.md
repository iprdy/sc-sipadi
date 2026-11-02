# Implementasi 03: Layout Dashboard Bersama dan Monitoring Produktivitas

**Tanggal:** 27 Oktober 2026  
**Status:** Selesai  
**Tujuan:** Mengimplementasikan shell dashboard persisten dengan sidebar navigasi Subak, toolbar filter global (Wilayah & Tahun), kartu indikator agroklimat, dan grafik tren produktivitas tahun 2018–2025.

---

## 1. Komponen yang Diimplementasikan

### 1.1 Sidebar Persisten (`src/components/layout/AppSidebar.tsx`)
- Lebar presisi **240px** dengan latar belakang hijau tua khas Subak (`#164A32`), border halus `#1e583c`, dan logo tunas padi bersudut membulat.
- Menu navigasi:
  - **Monitoring:** Indikator agroklimat dan tren historis.
  - **Analysis (XAI):** Dekomposisi nilai SHAP dan kurva ALE.
  - **Insight & Peta:** Distribusi petak sawah Subak interaktif.
  - **Simulasi Prediksi ML:** Laboratorium pengujian parameter model ML.
  - **Tentang Sistem:** Metodologi ilmiah dan latar belakang Subak.
- Widget profil pengguna demo di bagian bawah dengan inisial avatar dan tombol keluar (*logout*).

### 1.2 Header & Filter Toolbar (`src/components/layout/AppHeader.tsx`)
- Header tetap (*fixed*) setinggi 64px berlatar `#FFFDF7]/95` dengan efek *backdrop-blur*.
- **Dropdown Filter Global Wilayah:** Tabanan (Lumbung Beras Bali), Badung, Gianyar, dan Buleleng.
- **Dropdown Filter Global Tahun:** 2018 hingga 2025 (Proyeksi).
- Tombol simulasi ekspor data (*CSV/PDF*) dengan notifikasi *toast* interaktif.
- Indikator status data satelit terkalibrasi.

### 1.3 Kartu Metrik Agroklimat (`src/components/common/MetricCard.tsx`)
- **Produktivitas (KPI Utama):** Latar hijau pekat `#164A32`, teks putih, angka besar (misal 5.21 ton/ha), badge status siklus panen optimal (+8.4%), dan efek *ambient glow*.
- **NDVI (Kerapatan Kanopi):** Latar hijau sage muda `#EDF4E5` dengan aksen `#55A85F`.
- **LST (Suhu Permukaan Tanah):** Latar keemasan/olive `#FAF5E6` dengan aksen `#C4A83F`.
- **Curah Hujan (CHIRPS):** Latar biru presipitasi `#EAF3F7` dengan aksen `#4D9FC1`.

### 1.4 Grafik Tren Produktivitas 2018–2025 (`src/components/charts/ProductivityTrendChart.tsx`)
- Dibangun menggunakan **Recharts** berbasis SVG murni yang responsif.
- Membedakan dua seri data:
  - **Realisasi Aktual BPS:** Garis putus-putus (*dashed line*) hijau tua `#164A32`.
  - **Estimasi Model SIPADI:** Garis kontinu dengan area gradien hijau sage `#287A4A`.
- Tooltip kustom interaktif yang menampilkan angka detail ton/ha saat kursor diarahkan ke setiap titik tahun.

### 1.5 Bobot Pengaruh Variabel (Feature Importance)
- Bar persentase kontribusi fitur model XGBoost:
  - NDVI Puncak Vegetasi (38%)
  - Curah Hujan Musim Tanam CHIRPS (28%)
  - Suhu Permukaan Malam Hari LST (18%)
  - Elevasi & Kontur Topografi Subak (10%)
  - Indeks Kelembapan Tanah NDWI (6%)
