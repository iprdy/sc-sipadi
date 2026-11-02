# Implementasi 06: Modul Inferensi Model Machine Learning dan Kesiapan Database

**Tanggal:** 27 Oktober 2026  
**Status:** Selesai  
**Tujuan:** Mengimplementasikan antarmuka pengujian inferensi model Machine Learning yang menerima input kustom pengguna, memvalidasi rentang nilai, mengeksekusi simulasi inferensi XGBoost & dekomposisi SHAP instan, serta menyediakan tabel riwayat yang menyimulasikan persistensi database.

---

## 1. Latar Belakang & Kebutuhan Lanjutan

Sesuai arahan pengguna bahwa aplikasi ini akan dilanjutkan dengan:
1. **Penerapan input data** oleh pengguna/petani/penyuluh.
2. **Koneksi basis data (database)** untuk menyimpan riwayat input dan prediksi.
3. **Penerapan hasil model Machine Learning** yang telah dilatih pada mata kuliah Sistem Cerdas.

Maka pada tahap ini telah dibangun halaman khusus: **`src/pages/PredictionModelPage.tsx`** dan lapisan service **`src/services/apiService.ts`**.

---

## 2. Fitur yang Diimplementasikan

### 2.1 Formulir Input Parameter Model (Kiri)
- **Nama Petak / Subak:** Input teks bebas (misal Subak Jatiluwih Kauh).
- **Varietas Padi:** Pilihan dropdown (Beras Merah Cempaka Jatiluwih, Ciherang Lokal, Inpari 32 HDB, Inpari 42 Agritan GSR, Beras Hitam Bali).
- **Slider NDVI (Kerapatan Kanopi):** Rentang interaktif 0.20 – 0.88 dengan indikator real-time.
- **Slider LST (Suhu Permukaan Tanah):** Rentang 20.0°C – 36.0°C dengan penanda zona optimal dan stres termal.
- **Slider Curah Hujan (CHIRPS):** Rentang 600 mm – 3.000 mm dengan status adekuat vs kekeringan.
- **Tombol Eksekusi:** *"Jalankan Prediksi AI & Evaluasi SHAP"* dengan animasi *loading state* saat proses inferensi berlangsung.

### 2.2 Papan Hasil Inferensi Model (Kanan)
- **Estimasi Bobot Panen:** Angka utama dalam satuan ton/ha berserta kategori panen (*Tinggi*, *Optimal*, *Waspada*, *Rendah*).
- **Tingkat Keyakinan (*Confidence Score*):** Menampilkan skor keyakinan model (misal 91%).
- **Dekomposisi SHAP Real-time:** Menghitung kontribusi marjinal masing-masing variabel secara instan sesuai input yang digeser oleh pengguna.
- **Rekomendasi Agronomis Cerdas:** Rekomendasi otomatis berdasarkan deteksi anomali (misal saran pemupukan susulan jika NDVI rendah, atau instruksi penggenangan air terputus jika LST melampaui 30°C).
- **Tombol Simpan ke Database:** Tombol untuk mencatat hasil ke riwayat dengan notifikasi keberhasilan.

### 2.3 Tabel Riwayat Prediksi (Simulasi Persistensi Database)
- Menampilkan daftar catatan riwayat prediksi yang disimpan ke `localStorage`.
- Kolom tabel: Waktu, Wilayah, Varietas, Nilai NDVI, LST, Curah Hujan, Estimasi Hasil, dan Status.

---

## 3. Titik Integrasi Backend Python (FastAPI) & Database Masa Depan

Komponen ini telah dirancang dengan arsitektur kontrak data (*data contract*) yang identik dengan API backend:

### Skema Request Input (`PredictionInputPayload`):
```json
{
  "regionId": "tabanan",
  "subakName": "Subak Jatiluwih Kauh",
  "year": 2026,
  "month": 10,
  "ndvi": 0.68,
  "lst": 27.5,
  "rainfall": 1820,
  "variety": "Beras Merah Jatiluwih",
  "elevationM": 650
}
```

### Skema Response Output (`PredictionResult`):
```json
{
  "predictedYieldTonHa": 5.48,
  "confidenceScore": 0.91,
  "statusCategory": "Optimal",
  "shapContribution": [
    { "feature": "NDVI Kanopi", "impact": 0.40 },
    { "feature": "Suhu Permukaan (LST)", "impact": 0.18 },
    { "feature": "Curah Hujan", "impact": 0.25 },
    { "feature": "Elevasi Wilayah", "impact": 0.20 }
  ],
  "recommendations": [
    "Kerapatan kanopi sangat prima, pertahankan sanitasi gulma.",
    "Suhu lingkungan optimal untuk fase pengisian bulir."
  ]
}
```

Saat backend FastAPI siap, Anda cukup membuka `src/services/apiService.ts` dan mengubah baris fungsi `predictYield` menjadi:
```ts
async predictYield(payload: PredictionInputPayload): Promise<PredictionResult> {
  const response = await axios.post('http://localhost:8000/api/predict', payload);
  return response.data;
}
```
**Seluruh tampilan antarmuka, formulir input, grafik, dan tabel riwayat akan langsung bekerja tanpa perlu dirombak sama sekali!**
