import React from 'react';
import { 
  Sprout, 
  Satellite, 
  Cpu, 
  Network, 
  Sparkles,
  Layers,
  Database,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Title & Scope Header */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#164A32]">
            TENTANG SISTEM SIPADI
          </h1>
          <span className="ml-auto text-xs font-bold text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-3 py-1 rounded-full hidden sm:inline">
            Metodologi &amp; Sains Agroklimat
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#5F7061] max-w-3xl">
          Informasi metodologi ilmiah, arsitektur pemrosesan data penginderaan jauh (*remote sensing*), 
          model machine learning XGBoost, dan kerangka interpretasi *Explainable AI* (SHAP &amp; ALE).
        </p>
      </section>

      {/* Overview Hero Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#164A32] text-white shadow-md relative overflow-hidden border border-[#287A4A]">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-60 h-60 rounded-full bg-[#287A4A]/30 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-4 relative z-10 max-w-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#205a3b] border border-[#2e744e] flex items-center justify-center text-[#55A85F] shadow-inner">
              <Sprout className="w-6 h-6 text-[#55A85F]" />
            </div>
            <span className="text-xs font-bold text-[#C8DDAF] uppercase tracking-wider">
              Sistem Informasi Cerdas Produktivitas Tanaman Padi
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            Transformasi Observasi Satelit Menjadi Keputusan Pertanian yang Terjelaskan
          </h2>

          <p className="text-xs sm:text-sm text-[#A2C79A] leading-relaxed">
            Perubahan iklim global dan pergeseran pola hujan musiman menuntut metode estimasi hasil panen
            yang lebih cepat, objektif, dan dapat dipertanggungjawabkan secara agronomis. SIPADI menggabungkan
            citra multispektral orbit bumi dengan algoritma gradient boosting dan penjelasan XAI untuk
            memastikan setiap estimasi panen dapat diverifikasi oleh penyuluh lapangan dan peneliti.
          </p>
        </div>
      </section>

      {/* 3 Core Pillars Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#FFFDF7] border border-[#D8E3CC] shadow-xs flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
            <Satellite className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-[#164A32]">Penginderaan Jauh (Remote Sensing)</h3>
          <p className="text-xs text-[#5F7061] leading-relaxed">
            Memanfaatkan citra Sentinel-2 MSI (resolusi 10 meter) untuk ekstraksi indeks kanopi hijau NDVI,
            data kinetik termal Landsat/MODIS untuk Suhu Permukaan Tanah (LST), dan presipitasi curah hujan CHIRPS v2.0.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFFDF7] border border-[#D8E3CC] shadow-xs flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-[#164A32]">Model Prediktif XGBoost</h3>
          <p className="text-xs text-[#5F7061] leading-relaxed">
            Algoritma Extreme Gradient Boosting dipilih karena ketangguhannya dalam menangani non-linearitas
            faktor iklim, interaksi multivariat, dan ketahanan terhadap overfitting pada data tabular geospasial.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FFFDF7] border border-[#D8E3CC] shadow-xs flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
            <Network className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-[#164A32]">Explainable AI (SHAP &amp; ALE)</h3>
          <p className="text-xs text-[#5F7061] leading-relaxed">
            Membongkar kotak hitam model machine learning. Menghitung kontribusi marjinal aditif per variabel
            menggunakan SHAP TreeExplainer serta kurva respon terisolasi ALE tanpa bias korelasi antar-fitur.
          </p>
        </div>
      </section>

      {/* Data Pipeline & Architecture Breakdown */}
      <section className="p-6 sm:p-7 rounded-2xl bg-[#FAF7F0] border border-[#D8E3CC] shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2.5 border-b border-[#D8E3CC] pb-3">
          <Layers className="w-5 h-5 text-[#287A4A]" />
          <h3 className="text-sm font-extrabold text-[#164A32] uppercase tracking-wider">
            Alur Integrasi Data &amp; Pemrosesan Sistem
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#D8E3CC] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#287A4A]">Tahap 1 • Observasi</span>
            <strong className="text-xs text-[#164A32]">Akuisisi Citra Satelit</strong>
            <p className="text-[11px] text-[#5F7061]">Pengunduhan otomatis spektral Sentinel-2 dan data presipitasi curah hujan.</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#D8E3CC] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#287A4A]">Tahap 2 • Harmonisasi</span>
            <strong className="text-xs text-[#164A32]">Penyelarasan Spasial</strong>
            <p className="text-[11px] text-[#5F7061]">Ekstraksi batas petak sawah, elevasi kontur DEM, dan kalkulasi LST permukaan.</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#D8E3CC] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#287A4A]">Tahap 3 • Inferensi</span>
            <strong className="text-xs text-[#164A32]">Prediksi XGBoost</strong>
            <p className="text-[11px] text-[#5F7061]">Estimasi bobot panen padi (ton/ha) berbasis model pohon gradient boosting.</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#D8E3CC] flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#287A4A]">Tahap 4 • Interpretasi</span>
            <strong className="text-xs text-[#164A32]">Transparansi XAI</strong>
            <p className="text-[11px] text-[#5F7061]">Dekomposisi nilai SHAP dan visualisasi kurva ALE untuk rekomendasi operasional.</p>
          </div>
        </div>
      </section>

      {/* Platform Navigation Strip */}
      <section className="p-5 rounded-2xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Sprout className="w-6 h-6 text-[#287A4A] shrink-0" />
          <div className="flex flex-col">
            <span className="font-extrabold text-[#164A32]">
              Sistem Informasi Agroklimat &amp; Prediksi Produktivitas Padi
            </span>
            <span className="text-[#5F7061]">
              Akses modul pemantauan geospasial real-time dan analisis Explainable AI untuk wilayah binaan.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/monitoring"
            className="px-4 py-2 bg-[#287A4A] text-white rounded-xl font-bold hover:bg-[#164A32] transition-colors"
          >
            Buka Monitoring
          </Link>
          <Link
            to="/dashboard/analysis"
            className="px-4 py-2 bg-white border border-[#C8DDAF] text-[#164A32] rounded-xl font-semibold hover:bg-[#FAF7F0] transition-colors"
          >
            Lihat Analisis XAI
          </Link>
        </div>
      </section>
    </div>
  );
};
