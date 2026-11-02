import React, { useEffect, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { apiService } from '../services/apiService';
import { MonitoringData } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { ProductivityTrendChart } from '../components/charts/ProductivityTrendChart';
import { 
  TrendingUp, 
  Satellite, 
  BarChart2, 
  Layers, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { selectedRegion, selectedYear, currentRegionName } = useFilter();
  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    apiService.getMonitoringData(selectedRegion, selectedYear).then((res) => {
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
          Memuat data pemantauan agroklimat {currentRegionName}...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title & Scope Header */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#164A32]">
            MONITORING PRODUKTIVITAS
          </h1>
          <span className="ml-auto text-xs font-bold text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-3 py-1 rounded-full hidden sm:inline">
            Tahun Analisis: {selectedYear}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#5F7061] max-w-3xl">
          Instrumen pemantauan keterpusatan indikator agroklimat dan estimasi produktivitas padi
          di wilayah <strong>{currentRegionName}</strong>.
        </p>
      </section>

      {/* KPI Metric Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Produktivitas Padi"
          metric={data.productivity}
          variant="primary"
        />
        <MetricCard
          title="NDVI Kanopi"
          metric={data.ndvi}
          variant="ndvi"
          secondaryInfo={{ label: 'Kerapatan Kanopi', value: 'Tinggi (Sehat)' }}
        />
        <MetricCard
          title="LST (Suhu Permukaan)"
          metric={data.lst}
          variant="lst"
          secondaryInfo={{ label: 'Suhu Permukaan Tanah', value: 'Termal Normal' }}
        />
        <MetricCard
          title="Curah Hujan Siklus"
          metric={data.rainfall}
          variant="rainfall"
          secondaryInfo={{ label: 'Akumulasi Presipitasi', value: 'Adekuat' }}
        />
      </section>

      {/* Main Trend Canvas Section */}
      <section className="bg-[#FAF7F0] rounded-2xl border border-[#D8E3CC] p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-[#D8E3CC] pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
              <TrendingUp className="w-4 h-4 text-[#287A4A]" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
                TREND PRODUKTIVITAS 2018–2025 ({currentRegionName})
              </h2>
              <span className="text-[11px] text-[#5F7061]">
                Perbandingan data realisasi historis BPS dan proyeksi model machine learning terkalibrasi
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#5F7061]">
            <span className="w-2.5 h-1 bg-[#287A4A] rounded-full inline-block" />
            <span>Satuan: ton/ha</span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <ProductivityTrendChart data={data.trend} />
      </section>

      {/* Two Column Grid: Feature Importance & Satellite Sensor Status */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Feature Importance Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF7] rounded-2xl border border-[#D8E3CC] p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#D8E3CC] pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#287A4A]" />
              <h3 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
                Bobot Pengaruh Variabel Prediksi (Feature Importance)
              </h3>
            </div>
            <span className="text-[10px] text-[#5F7061] bg-[#EDF4E5] px-2 py-0.5 rounded-md font-bold">
              XGBoost Gini
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {data.featureImportance.map((item) => (
              <div key={item.feature} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#164A32]">{item.label}</span>
                  <span className="text-[#287A4A] font-extrabold">{item.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#EDF4E5] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className="h-full bg-[#287A4A] rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#5F7061] leading-relaxed pt-2 border-t border-[#D8E3CC]/60 flex items-start gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#287A4A] shrink-0 mt-0.5" />
            <span>
              Persentase dihitung dari gain split pohon keputusan XGBoost yang divalidasi silang
              (cross-validated 5-fold) pada data petak sawah historis Bali.
            </span>
          </p>
        </div>

        {/* Orbit Telemetry & Remote Sensing Context (5 cols) */}
        <div className="lg:col-span-5 bg-[#EDF4E5] rounded-2xl border border-[#C8DDAF] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[#287A4A]">
              <Satellite className="w-4 h-4" />
              <h3 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
                Status Sinkronisasi Satelit
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#C8DDAF] flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5F7061]">Wahana Pengamat:</span>
                <strong className="text-[#164A32]">Sentinel-2A &amp; 2B (ESA)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F7061]">Sensor Optik:</span>
                <strong className="text-[#164A32]">MSI (B4 Red &amp; B8 NIR)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F7061]">Data Presipitasi:</span>
                <strong className="text-[#164A32]">CHIRPS 0.05° UCSB</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F7061]">Status Cloud Cover:</span>
                <span className="font-bold text-[#55A85F]">&lt; 10% (Terkoreksi Awan)</span>
              </div>
            </div>

            <p className="text-[11px] text-[#5F7061] leading-relaxed">
              Data citra telah melalui tahap koreksi radiometrik Bottom-of-Atmosphere (BOA/Level-2A)
              sehingga indeks kehijauan kanopi mencerminkan kondisi riil tanaman.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#C8DDAF] flex items-center justify-between text-[11px] font-semibold text-[#164A32]">
            <span>Re-visit Orbit Berikutnya:</span>
            <span className="text-[#287A4A] bg-white px-2 py-0.5 rounded border border-[#C8DDAF]">
              5 Hari Lagi
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
