import React, { useEffect, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { useModelRun } from '../context/ModelRunContext';
import { apiService } from '../services/apiService';
import { InsightData } from '../types';
import { InteractiveFieldMap } from '../components/common/InteractiveFieldMap';
import { 
  AlertCircle,
  Lightbulb, 
  Award, 
  CheckCircle2,
  FileCheck2,
  Sparkles,
  Sprout,
  ThermometerSun,
  CloudRain,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InsightPage: React.FC = () => {
  const { selectedRegion, setSelectedRegion, selectedYear, currentRegionName } = useFilter();
  const { selectedRunId, selectedRun, loading: runsLoading, error: runsError } = useModelRun();
  const [data, setData] = useState<InsightData | null>(null);
  const [loadedKey, setLoadedKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const requestKey = `${selectedRunId || ''}:${selectedRegion}:${selectedYear}`;

  useEffect(() => {
    if (!selectedRunId) return;
    let active = true;
    setError(null);

    apiService
      .getRunInsight(selectedRunId, selectedRegion, selectedYear)
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((reason) => {
        if (active) {
          setData(null);
          setError(reason instanceof Error ? reason.message : 'Gagal memuat insight wilayah.');
        }
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [selectedRegion, selectedYear, selectedRunId, requestKey]);

  if (selectedRunId ? loadedKey !== requestKey : runsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <span className="w-8 h-8 border-3 border-[#287A4A] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-[#5F7061]">
          Menyiapkan ringkasan hasil &amp; peta wilayah Bali...
        </span>
      </div>
    );
  }

  if (error || !data || !selectedRun) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center text-sm text-[#5F7061]">
        <AlertCircle className="h-7 w-7 text-amber-700" />
        {error || runsError || 'Pilih run yang tersedia untuk melihat insight wilayah.'}
      </div>
    );
  }

  const MONTH_LABELS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const ranking = data.regionalRanking || [];
  const activeRegionStat = ranking.find((r) => r.regionId === selectedRegion) || ranking[0];
  const topRegionStat = ranking[0];
  const avgYieldNum = activeRegionStat?.avgProductivityTonHa ?? data.averages.productivityTonHa;
  const avgYieldDisplay = avgYieldNum != null ? avgYieldNum.toFixed(2) : '—';

  const monthly = data.monthlyObservations || [];
  const validMonthly = monthly.filter((m): m is typeof m & { productivity: number } => typeof m.productivity === 'number');
  const sortedMonths = [...validMonthly].sort((a, b) => b.productivity - a.productivity);
  const bestMonth = sortedMonths[0];
  const lowestMonth = sortedMonths[sortedMonths.length - 1];

  const positiveDrivers = data.keyDrivers.filter((d) => d.direction === 'positive');
  const negativeDrivers = data.keyDrivers.filter((d) => d.direction === 'negative');

  const getDriverIcon = (featureName: string) => {
    const lower = featureName.toLowerCase();
    if (lower.includes('ndvi')) return <Sprout className="w-4 h-4 text-[#287A4A]" />;
    if (lower.includes('lst') || lower.includes('suhu')) return <ThermometerSun className="w-4 h-4 text-[#D97706]" />;
    return <CloudRain className="w-4 h-4 text-[#3B8DAD]" />;
  };

  const getCategoryBadgeStyle = (cat: InsightData['harvestCategory']) => {
    switch (cat) {
      case 'Optimal':
      case 'Tinggi':
        return 'bg-[#CFEF8A] text-[#14452F] border-[#A7DC54]';
      case 'Waspada':
        return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
      case 'Rendah':
        return 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
      default:
        return 'bg-[#CFEF8A] text-[#14452F] border-[#A7DC54]';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#164A32]">
            INSIGHT &amp; PETA LAHAN
          </h1>
          <span className="ml-auto text-xs font-bold text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-3 py-1 rounded-full hidden sm:inline">
            {selectedRun.modelName} • {currentRegionName} • {selectedYear}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#5F7061] max-w-3xl">
          Ringkasan kondisi panen padi yang mudah dipahami, faktor utama yang memengaruhi hasil, dan
          peta interaktif blok sawah di wilayah <strong>{currentRegionName}</strong>.
        </p>
      </section>

      {/* Top Row: Executive Summary Card + Key Drivers Card */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Summary Card (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#164A32] via-[#185237] to-[#1D6342] text-white flex flex-col justify-between shadow-sm relative overflow-hidden border border-[#287A4A]">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-52 h-52 rounded-full bg-[#55A85F]/20 blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold text-[#C8DDAF] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#CFEF8A]" />
                Ringkasan Kondisi Panen
              </span>
              <span
                className={`px-3 py-1 rounded-full border text-xs font-extrabold ${getCategoryBadgeStyle(
                  data.harvestCategory
                )}`}
              >
                Status: {data.harvestCategory}
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {avgYieldDisplay}
                </span>
                <span className="text-sm font-bold text-[#CFEF8A]">ton/ha</span>
              </div>
              <span className="text-xs text-[#C8DDAF] font-medium">
                rata-rata produktivitas {currentRegionName} ({selectedYear})
              </span>
            </div>

            <p className="text-sm sm:text-[15px] text-white/95 font-medium leading-relaxed">
              {data.headlineSummary}
            </p>

            <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs text-xs text-[#E3F3D3] leading-relaxed">
              {data.harvestCategoryNote}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-2 text-xs relative z-10">
            <span className="text-[#C8DDAF]">Ingin melihat perhitungan faktor di balik angka ini?</span>
            <Link
              to="/dashboard/analysis"
              className="px-3.5 py-1.5 rounded-lg bg-[#CFEF8A] text-[#14452F] font-bold hover:bg-[#dff6ad] transition-colors"
            >
              Buka Analisis Detail (XAI)
            </Link>
          </div>
        </div>

        {/* Key Determinants List (5 cols) */}
        <div className="lg:col-span-5 bg-[#FAF7F0] p-5 sm:p-6 rounded-2xl border border-[#D8E3CC] flex flex-col justify-between shadow-xs gap-4">
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-[#D8E3CC] pb-3">
              <div className="flex items-center gap-2 text-xs">
                <Lightbulb className="w-4 h-4 text-[#287A4A]" />
                <h4 className="font-extrabold text-[#164A32] uppercase tracking-wider">
                  Faktor Utama Penentu Panen
                </h4>
              </div>
              <span className="text-[10px] font-bold text-[#5F7061] bg-[#EDF4E5] px-2 py-0.5 rounded-md">
                3 Indikator
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {data.keyDrivers.map((driver, idx) => {
                const isPositive = driver.direction === 'positive';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-[#D8E3CC] hover:border-[#287A4A]/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF7F0] border border-[#E3DCBA] flex items-center justify-center shrink-0">
                        {getDriverIcon(driver.feature)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-[#5F7061] uppercase tracking-wide">
                          {driver.title}
                        </span>
                        <strong className="text-xs sm:text-[13px] text-[#164A32] truncate">
                          {driver.feature}
                        </strong>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-[11px] shrink-0 ${
                        isPositive
                          ? 'bg-[#EDF4E5] text-[#287A4A] border border-[#C8DDAF]'
                          : 'bg-[#FDECE8] text-[#B54B3A] border border-[#F2C2BA]'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {driver.impact.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#EDF4E5]/70 border border-[#C8DDAF] text-[11px] text-[#4E6050] leading-relaxed">
            <strong>Cara membaca:</strong> Tanda hijau (<strong>+</strong>) berarti kondisi alam sedang mendukung kenaikan panen, sedangkan tanda merah (<strong>-</strong>) berarti faktor tersebut sedikit menahan hasil maksimal.
          </div>
        </div>
      </section>

      {/* CARD KESIMPULAN SECARA KESELURUHAN */}
      <section className="p-5 sm:p-6 rounded-2xl bg-[#FFFDF7] border border-[#D8E3CC] shadow-xs flex flex-col gap-5">
        {/* Card Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#D8E3CC] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
              <FileCheck2 className="w-5 h-5 text-[#287A4A]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#164A32] tracking-tight">
                KESIMPULAN SECARA KESELURUHAN
              </h3>
              <p className="text-xs text-[#5F7061]">
                Gambaran umum kondisi pertanian padi dan saran praktis untuk wilayah {currentRegionName} tahun {selectedYear}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Comprehensive Conclusion */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Kondisi Hasil Panen */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] hover:border-[#287A4A]/60 transition-colors flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
                Kondisi Hasil Panen
              </h4>
            </div>
            <p className="text-xs text-[#4E6050] leading-relaxed">
              {data.conclusion?.evaluasiPanen ? (
                data.conclusion.evaluasiPanen
              ) : (
                <>
                  Secara umum hasil panen di {currentRegionName} masuk kategori{' '}
                  <strong className="text-[#164A32]">{data.harvestCategory}</strong> dengan rata-rata{' '}
                  <strong className="text-[#164A32]">{avgYieldDisplay} ton/ha</strong>
                  {activeRegionStat ? ` (peringkat #${activeRegionStat.rank} di Bali)` : ''}.
                  {topRegionStat &&
                    activeRegionStat &&
                    topRegionStat.regionId !== activeRegionStat.regionId &&
                    topRegionStat.avgProductivityTonHa != null && (
                      <>
                        {' '}Wilayah tertinggi tahun {selectedYear} adalah{' '}
                        <strong className="text-[#164A32]">{topRegionStat.name}</strong>{' '}
                        ({topRegionStat.avgProductivityTonHa.toFixed(2)} ton/ha).
                      </>
                    )}
                </>
              )}
            </p>
          </div>

          {/* Pillar 2: Cuaca & Kesehatan Tanaman */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] hover:border-[#287A4A]/60 transition-colors flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                <Sprout className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
                Tanaman &amp; Cuaca
              </h4>
            </div>
            <p className="text-xs text-[#4E6050] leading-relaxed">
              {data.conclusion?.kondisiBiofisik ? (
                data.conclusion.kondisiBiofisik
              ) : (
                <>
                  {positiveDrivers.length > 0 ? (
                    <>
                      Pertumbuhan padi ditopang baik oleh{' '}
                      <strong className="text-[#164A32]">
                        {positiveDrivers.map((d) => d.feature.split('(')[0].trim()).join(' dan ')}
                      </strong>
                      .
                    </>
                  ) : (
                    <>Kondisi lingkungan sedang mengalami tekanan cuaca di sebagian wilayah pengamatan.</>
                  )}{' '}
                  {negativeDrivers.length > 0
                    ? `Faktor yang sedikit menahan hasil berasal dari ${negativeDrivers
                        .map((d) => d.feature.split('(')[0].trim())
                        .join(' dan ')}.`
                    : 'Tidak ada faktor cuaca ekstrem yang menghambat fase pengisian bulir padi.'}
                </>
              )}
            </p>
          </div>

          {/* Pillar 3: Transparansi Perhitungan AI */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] hover:border-[#287A4A]/60 transition-colors flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
                Cara Sistem Menilai
              </h4>
            </div>
            <p className="text-xs text-[#4E6050] leading-relaxed">
              {data.conclusion?.validasiXai ? (
                data.conclusion.validasiXai
              ) : (
                <>
                  Angka perkiraan tidak dibuat secara acak—sistem membandingkan tingkat kehijauan daun padi,
                  suhu permukaan lahan, serta curah hujan {currentRegionName} tahun {selectedYear} terhadap
                  pola panen historis di seluruh Bali.
                </>
              )}
            </p>
          </div>

          {/* Pillar 4: Saran Praktis Lapangan */}
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] hover:border-[#287A4A]/60 transition-colors flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
                Saran di Lapangan
              </h4>
            </div>
            <p className="text-xs text-[#4E6050] leading-relaxed">
              {data.conclusion?.aksiLapangan ? (
                data.conclusion.aksiLapangan
              ) : bestMonth && lowestMonth && bestMonth.month !== lowestMonth.month ? (
                <>
                  Hasil terbaik tercatat pada bulan{' '}
                  <strong className="text-[#164A32]">{MONTH_LABELS[(bestMonth.month - 1) % 12]}</strong>{' '}
                  ({bestMonth.productivity.toFixed(2)} ton/ha), sedangkan fase terendah pada bulan{' '}
                  <strong className="text-[#164A32]">{MONTH_LABELS[(lowestMonth.month - 1) % 12]}</strong>{' '}
                  ({lowestMonth.productivity.toFixed(2)} ton/ha) yang perlu prioritas pengairan &amp; pemupukan.
                </>
              ) : (
                <>
                  Pertahankan jadwal pengairan teratur dan pemupukan berimbang selama masa pengisian bulir agar hasil panen tetap optimal.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Quick Action Links Footer */}
        <div className="pt-3 border-t border-[#D8E3CC] flex items-center justify-end flex-wrap gap-2 text-xs">
          <Link
            to="/dashboard/monitoring"
            className="px-4 py-2 rounded-xl bg-[#287A4A] text-white font-bold hover:bg-[#164A32] transition-colors"
          >
            Lihat Monitoring Agroklimat
          </Link>
          <Link
            to="/dashboard/analysis"
            className="px-4 py-2 rounded-xl bg-white border border-[#D8E3CC] text-[#164A32] font-semibold hover:bg-[#EDF4E5] transition-colors"
          >
            Lihat Detail Analisis AI
          </Link>
        </div>
      </section>

      {/* Interactive Satellite + 9 Bali Regencies GeoJSON Map */}
      <section className="flex flex-col gap-3">
        <InteractiveFieldMap
          selectedRegion={selectedRegion}
          regionName={currentRegionName}
          selectedYear={selectedYear}
          regionalRanking={ranking}
          monthlyObservations={monthly}
          onSelectRegion={setSelectedRegion}
        />
      </section>
    </div>
  );
};
