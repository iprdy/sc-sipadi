import React, { useEffect, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { apiService } from '../services/apiService';
import { MonitoringData } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { ProductivityTrendChart } from '../components/charts/ProductivityTrendChart';
import { 
  TrendingUp, 
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

      {/* Feature Importance Breakdown (Full width) */}
      <section className="bg-[#FFFDF7] rounded-2xl border border-[#D8E3CC] p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-[#D8E3CC] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
              <BarChart2 className="w-4 h-4 text-[#287A4A]" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
                Bobot Pengaruh Variabel Prediksi (Feature Importance)
              </h3>
              <span className="text-[11px] text-[#5F7061]">
                Dihitung dari kontribusi marjinal fitur terhadap estimasi produktivitas {currentRegionName} ({selectedYear})
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-2.5 py-1 rounded-md font-bold">
            Atribusi Model Dinamis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.featureImportance.map((item) => (
            <div
              key={item.feature}
              className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#164A32] font-bold">{item.label}</span>
                <span className="text-base text-[#287A4A] font-extrabold">{item.percentage}%</span>
              </div>
              <div className="w-full h-3 bg-[#EDF4E5] rounded-full overflow-hidden">
                <div
                  style={{ width: `${item.percentage}%` }}
                  className="h-full bg-[#287A4A] rounded-full transition-all duration-500"
                />
              </div>
              <span className="text-[10px] text-[#5F7061]">
                {item.feature === 'ndvi' && 'Kerapatan biomassa fotosintesis'}
                {item.feature === 'lst' && 'Kondisi termal suhu permukaan tanah'}
                {item.feature === 'rainfall' && 'Kecukupan suplai presipitasi musiman'}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#5F7061] leading-relaxed pt-2 border-t border-[#D8E3CC]/60 flex items-start gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#287A4A] shrink-0 mt-0.5" />
          <span>
            Persentase bobot pengaruh variabel ini dihitung secara dinamis dari gain split pohon keputusan XGBoost dan dekomposisi atribusi model terhadap nilai observasi aktual di {currentRegionName} pada tahun {selectedYear}.
          </span>
        </p>
      </section>
    </div>
  );
};
