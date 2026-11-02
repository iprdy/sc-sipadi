# Implementasi 04: Visualisasi Explainable AI (SHAP dan ALE)

**Tanggal:** 27 Oktober 2026  
**Status:** Selesai  
**Tujuan:** Mengimplementasikan modul interpretasi model kecerdasan buatan (*Explainable AI / XAI*) yang memvisualisasikan kontribusi aditif SHAP dan kurva respon non-linear ALE tanpa efek kotak hitam (*black-box*).

---

## 1. Komponen yang Diimplementasikan

### 1.1 Halaman Analysis (`src/pages/AnalysisPage.tsx`)
- Menggabungkan dua pilar utama transparansi model:
  1. Kontribusi Nilai SHAP (*Shapley Additive exPlanations*)
  2. Pola Hubungan Marjinal ALE (*Accumulated Local Effects*)
- Data terhubung secara reaktif dengan filter Wilayah dan Tahun yang dipilih di header global.

### 1.2 Grafik Kontribusi SHAP (`src/components/charts/ShapContributionChart.tsx`)
- **Diverging Bar Chart:**
  - **Dampak Positif (Warna Hijau `#4D9568`):** Menunjukkan faktor yang mendongkrak estimasi panen padi (misal kanopi lebat NDVI fase vegetatif +0.28 t/ha, presipitasi cukup +0.16 t/ha).
  - **Dampak Negatif (Warna Koral `#C96F5F`):** Menunjukkan faktor pembatas yang menekan estimasi panen (misal anomali panas siang hari LST -0.09 t/ha, hari tanpa hujan beruntun -0.06 t/ha).
- **Interpretasi Kontekstual:** Setiap bar dilengkapi penjelasan agronomis mengenai fenomena fisik yang mendasari perhitungan matematis model.
- **Ringkasan Alur Nilai:**
  $$\text{Nilai Baseline } (4.85\text{ t/ha}) \xrightarrow{+\text{SHAP Net } (+0.36)} \text{Estimasi Akhir } (5.21\text{ t/ha})$$

### 1.3 Kurva Respon ALE (`src/components/charts/AleResponseChart.tsx`)
- **Pemilih Fitur Tab Interaktif:**
  - **NDVI (Kerapatan Kanopi):** Memperlihatkan efek marjinal positif tajam pada rentang 0.45–0.70 sebelum mencapai saturasi kanopi di atas 0.75.
  - **LST (Suhu Permukaan Tanah):** Menampilkan kurva berbentuk kubah optimal pada 25°C–28°C dan penurunan curam di atas 30°C (*heat stress*).
  - **Curah Hujan (Presipitasi CHIRPS):** Menunjukkan kebutuhan esensial pada 1.400–1.800 mm dan perlambatan efek marjinal di atas 2.200 mm.
- Dilengkapi garis referensi baseline $y = 0.0$ dan indikator titik observasi aktual wilayah terpilih.
