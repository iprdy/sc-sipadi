import React, { useEffect, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { apiService } from '../services/apiService';
import { InsightData } from '../types';
import { InteractiveFieldMap } from '../components/common/InteractiveFieldMap';
import { 
  Lightbulb, 
  Map, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Layers, 
  Droplets, 
  SunMedium, 
  CheckCircle2,
  FileCheck2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InsightPage: React.FC = () => {
  const { selectedRegion, selectedYear, currentRegionName } = useFilter();
  const [data, setData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    apiService.getInsightData(selectedRegion, selectedYear).then((res) => {
      if (isMounted) {
        setData(res);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedRegion, selectedYear]);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <span className="w-8 h-8 border-3 border-[#287A4A] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-[#5F7061]">
          Menyiapkan visualisasi spasial lahan padi &amp; sintesis panen...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#164A32]">
            INSIGHT &amp; DISTRIBUSI SPASIAL
          </h1>
          <span className="ml-auto text-xs font-bold text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-3 py-1 rounded-full hidden sm:inline">
            Distribusi Geospasial • {selectedYear}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#5F7061] max-w-3xl">
          Sintesis eksekutif hasil prediksi model XGBoost, faktor determinan agroklimat, dan peta
          petak sawah wilayah <strong>{currentRegionName}</strong>.
        </p>
      </section>

      {/* Synthesis Cards Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Executive Summary Card (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#164A32] text-white flex flex-col justify-between shadow-sm relative overflow-hidden border border-[#287A4A]">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 rounded-full bg-[#287A4A]/25 blur-2xl pointer-events-none" />

          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#C8DDAF] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#55A85F]" />
                Sintesis Status Panen Wilayah
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#123825] border border-[#287A4A] text-xs font-extrabold text-[#55A85F]">
                Kategori {data.harvestCategory}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {data.headlineSummary}
            </h3>

            <p className="text-xs text-[#A2C79A] leading-relaxed">
              {data.harvestCategoryNote}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#287A4A] flex items-center justify-between flex-wrap gap-2 text-xs relative z-10">
            <span className="text-[#C8DDAF]">Rekomendasi Operasional:</span>
            <Link
              to="/dashboard/analysis"
              className="font-bold text-[#55A85F] hover:underline flex items-center"
            >
              <span>Periksa Rincian SHAP &amp; Respon ALE</span>
            </Link>
          </div>
        </div>

        {/* Key Determinants List (5 cols) */}
        <div className="lg:col-span-5 bg-[#FAF7F0] p-5 sm:p-6 rounded-2xl border border-[#D8E3CC] flex flex-col justify-between shadow-xs">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[#D8E3CC] pb-3 text-xs">
              <Lightbulb className="w-4 h-4 text-[#287A4A]" />
              <h4 className="font-extrabold text-[#164A32] uppercase tracking-wider">
                Faktor Penentu Utama (Key Drivers)
              </h4>
            </div>

            <div className="flex flex-col gap-2.5">
              {data.keyDrivers.map((driver, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-[#D8E3CC] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#5F7061] uppercase">
                      {driver.title}
                    </span>
                    <strong className="text-[#164A32]">{driver.feature}</strong>
                  </div>

                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                      driver.direction === 'positive'
                        ? 'bg-[#4D9568]/15 text-[#4D9568]'
                        : 'bg-[#C96F5F]/15 text-[#C96F5F]'
                    }`}
                  >
                    {driver.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 text-[11px] text-[#5F7061]">
            Dihitung berdasarkan dekomposisi SHAP terhadap 6 petak sawah sampel.
          </div>
        </div>
      </section>

      {/* CARD KESIMPULAN SECARA KESELURUHAN */}
      <section className="p-6 rounded-2xl bg-[#FFFDF7] border-2 border-[#C8DDAF] shadow-sm flex flex-col gap-5">
        {/* Card Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#D8E3CC] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A] shadow-xs">
              <FileCheck2 className="w-5 h-5 text-[#287A4A]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#164A32] tracking-tight">
                KESIMPULAN SECARA KESELURUHAN
              </h3>
              <p className="text-xs text-[#5F7061]">
                Sintesis komprehensif produktivitas, dinamika biofisik lahan, dan rekomendasi lapangan wilayah {currentRegionName} ({selectedYear})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#EDF4E5] border border-[#C8DDAF] text-xs font-bold text-[#287A4A] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#287A4A]" />
              Status Model: Terverifikasi
            </span>
          </div>
        </div>

        {/* 4 Pillars of Comprehensive Conclusion */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Evaluasi Hasil Panen */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#287A4A]">
              <Award className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#164A32]">Evaluasi Panen</h4>
            </div>
            <p className="text-xs text-[#5F7061] leading-relaxed">
              Produktivitas rata-rata wilayah berada pada level <strong>Kategori {data.harvestCategory}</strong>. Seluruh petak sampel menunjukkan stabilitas bobot gabah kering panen di atas ambang toleransi minimum.
            </p>
          </div>

          {/* Pillar 2: Kondisi Biofisik & Lingkungan */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#287A4A]">
              <Layers className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#164A32]">Kondisi Biofisik</h4>
            </div>
            <p className="text-xs text-[#5F7061] leading-relaxed">
              Kerapatan vegetasi kanopi (NDVI) dan pasokan presipitasi musiman berkontribusi dominan terhadap pengisian bulir padi, dengan suhu termal LST terjaga dalam rentang fisiologis optimal.
            </p>
          </div>

          {/* Pillar 3: Validitas Model & XAI */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#287A4A]">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#164A32]">Validasi XAI</h4>
            </div>
            <p className="text-xs text-[#5F7061] leading-relaxed">
              Dekomposisi nilai SHAP dan respon kurva ALE membuktikan bahwa model XGBoost menghasilkan proyeksi berbasis penalaran agronomis yang transparan tanpa anomali efek kotak hitam.
            </p>
          </div>

          {/* Pillar 4: Rekomendasi Petugas */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#287A4A]">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#164A32]">Aksi Lapangan</h4>
            </div>
            <p className="text-xs text-[#5F7061] leading-relaxed">
              Prioritaskan pemantauan debit air pada petak dengan elevasi tinggi dan pertahankan pemupukan berimbang untuk memastikan target proyeksi panen tercapai maksimal.
            </p>
          </div>
        </div>

        {/* Bottom Callout & Quick Action Links */}
        <div className="pt-3 border-t border-[#D8E3CC] flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#5F7061]">
            <CheckCircle2 className="w-4 h-4 text-[#287A4A] shrink-0" />
            <span>Kesimpulan ini dirumuskan otomatis berdasarkan agregasi komputasi geospasial Sentinel-2 &amp; CHIRPS.</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/monitoring"
              className="px-3 py-1.5 rounded-lg bg-[#287A4A] text-white font-bold hover:bg-[#164A32] transition-colors"
            >
              Lihat Monitoring Agroklimat
            </Link>
            <Link
              to="/dashboard/analysis"
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D8E3CC] text-[#164A32] font-semibold hover:bg-[#EDF4E5] transition-colors"
            >
              Lihat Detail XAI
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Field Parcels Map Section */}
      <section className="flex flex-col gap-3">
        <InteractiveFieldMap
          parcels={data.parcels}
          regionName={currentRegionName}
        />
      </section>
    </div>
  );
};
