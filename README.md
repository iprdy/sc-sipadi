# SIPADI — Sistem Prediksi & Interpretasi Produktivitas Tanaman Padi

SIPADI adalah platform web analitik pertanian presisi yang mengintegrasikan data penginderaan jauh (*remote sensing*) satelit, pemodelan prediktif berbasis *Machine Learning*, dan kerangka *Explainable AI* (XAI: SHAP & ALE) untuk memantau serta memproyeksikan produktivitas padi secara transparan dan objektif.

---

## 🚀 Fitur Utama

- **Monitoring Agroklimat & Tren Produktivitas:** Visualisasi time-series realisasi dan estimasi hasil panen padi, indeks vegetasi kanopi (NDVI), suhu permukaan tanah (LST), dan curah hujan musiman.
- **Explainable AI (SHAP & ALE):**
  - **SHAP (Shapley Additive exPlanations):** Mengurai faktor pendorong positif dan pembatas negatif per petak sawah.
  - **ALE (Accumulated Local Effects):** Menampilkan kurva respon marjinal non-linear tanpa bias korelasi antar-fitur.
- **Insight & Peta Spasial Petak Sawah:** Peta interaktif poligon petak sawah dengan zonasi klasifikasi hasil panen (*Optimal, Tinggi, Waspada, Rendah*).
- **Mini-Rail Responsive Layout:** Sidebar adaptif yang dapat diciutkan (*collapsible*) melalui logo SIPADI untuk ruang kerja analitik yang lebih leluasa.

---

## 🛠️ Tech Stack

- **Frontend Core:** React 19, TypeScript
- **Bundler & Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Visualisasi Data:** Recharts
- **Icons:** Lucide React
- **Form & Validation:** React Hook Form, Zod
- **Data State:** TanStack React Query

---

## 💻 Cara Menjalankan Proyek Secara Lokal

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18+ disarankan)
- npm / pnpm / yarn

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser di alamat [http://localhost:5173](http://localhost:5173).

### 4. Build untuk Produksi
```bash
npm run build
```
Hasil build akan tersimpan di folder `dist/`.

---

## 📁 Struktur Direktori

```text
├── docs/                   # Dokumentasi PRD & riwayat implementasi teknis
├── public/                 # Aset statis & favicon
├── src/
│   ├── assets/             # Gambar & ikon pendukung
│   ├── components/         # Komponen UI modular
│   │   ├── charts/         # Grafik Recharts (Trend, SHAP Bar, ALE Curve)
│   │   ├── common/         # Komponen umum & Peta Interaktif
│   │   └── layout/         # Header, Mini-Rail Sidebar, Public Navbar
│   ├── context/            # AuthContext & FilterContext (Wilayah & Tahun)
│   ├── mocks/              # Mock dataset terpusat (siap diganti API)
│   ├── pages/              # Halaman aplikasi (Homepage, Monitoring, Analysis, Insight, dll.)
│   ├── services/           # Service layer asinkron (API integration layer)
│   └── types/              # Definisi interface & TypeScript data contracts
├── package.json
└── vite.config.ts
```

---

## 📄 Lisensi & Hak Cipta
© 2026 SIPADI. Seluruh hak cipta dilindungi.

