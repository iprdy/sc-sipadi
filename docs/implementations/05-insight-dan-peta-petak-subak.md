# Implementasi 05: Insight Eksekutif dan Peta Petak Sawah Subak Interaktif

**Tanggal:** 27 Oktober 2026  
**Status:** Selesai  
**Tujuan:** Mengimplementasikan halaman ringkasan eksekutif (*Insight*) yang menyajikan sintesis status panen, kartu faktor penentu utama (*Key Drivers*), dan peta kartografis interaktif petak sawah Subak.

---

## 1. Komponen yang Diimplementasikan

### 1.1 Halaman Insight (`src/pages/InsightPage.tsx`)
- **Kartu Sintesis Eksekutif:**
  - Menampilkan ringkasan status panen (Kategori **Optimal**, proyeksi melampaui rata-rata provinsi Bali +6.2%).
  - Latar hijau pekat `#164A32` dengan *ambient lighting* dan tautan cepat ke rincian analisis SHAP.
- **Kartu Faktor Penentu Utama (*Key Drivers*):**
  - *Pendorong Terkuat:* NDVI Kanopi Kanvas (+0.28 ton/ha).
  - *Faktor Stabilisator:* Irigasi Presipitasi (+0.16 ton/ha).
  - *Faktor Pembatas Kritis:* Thermal Stress LST 31.8°C (-0.09 ton/ha).

### 1.2 Peta Petak Sawah Subak Interaktif (`src/components/common/InteractiveSubakMap.tsx`)
- **Visualisasi Kartografis Berbasis SVG:**
  - Merender layout petak sawah Subak (contoh: Jatiluwih Kauh, Jatiluwih Kangin, Gunungsari, Wongaya Betan, Babahan Kaler, Mengesta).
  - Garis saluran irigasi tersier Subak (*Telabah*) berwarna biru presipitasi `#4D9FC1`.
  - Pewarnaan kode status petak:
    - **Tinggi (> 5.4 t/ha):** Hijau tua `#287A4A`.
    - **Optimal (4.8 - 5.4 t/ha):** Hijau cerah `#55A85F`.
    - **Waspada / Rendah (< 4.8 t/ha):** Koral `#C96F5F`.
- **Panel Inspektor Detail Petak:**
  - Ketika pengguna mengklik salah satu petak di peta, panel samping secara dinamis menampilkan:
    - Nama Petak Subak & Nama Petani Penggarap
    - Varietas Padi (misal *Beras Merah Cempaka Jatiluwih*, *Ciherang*, *Inpari 32*)
    - Luas Petak (Hektar)
    - Estimasi Hasil Panen (ton/ha)
    - Indeks NDVI & Status Lengas Tanah (Defisit vs Optimal)
