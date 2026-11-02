import React, { useEffect, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { apiService } from '../services/apiService';
import { ShapAnalysisData, AleFeatureData } from '../types';
import { ShapContributionChart } from '../components/charts/ShapContributionChart';
import { AleResponseChart } from '../components/charts/AleResponseChart';
import { Network, Sparkles, Layers, Cpu } from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const { selectedRegion, selectedYear, currentRegionName } = useFilter();

  const [shapData, setShapData] = useState<ShapAnalysisData | null>(null);
  const [aleData, setAleData] = useState<AleFeatureData | null>(null);
  const [activeAleFeature, setActiveAleFeature] = useState<'ndvi' | 'lst' | 'rainfall'>('ndvi');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      apiService.getShapData(selectedRegion, selectedYear),
      apiService.getAleData(activeAleFeature),
    ]).then(([shapRes, aleRes]) => {
      if (isMounted) {
        setShapData(shapRes);
        setAleData(aleRes);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedRegion, selectedYear, activeAleFeature]);

  const handleSelectAleFeature = (feature: 'ndvi' | 'lst' | 'rainfall') => {
    setActiveAleFeature(feature);
  };

  if (isLoading || !shapData || !aleData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <span className="w-8 h-8 border-3 border-[#287A4A] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-[#5F7061]">
          Menghitung dekomposisi SHAP &amp; kurva respon ALE...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Title & XAI Scope */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#164A32]">
            EXPLAINABLE AI (XAI) PIPELINE
          </h1>
          <span className="ml-auto text-xs font-bold text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-3 py-1 rounded-full hidden sm:inline">
            SHAP &amp; ALE Interpretability
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#5F7061] max-w-3xl">
          Membongkar cara kerja model prediktif XGBoost untuk wilayah <strong>{currentRegionName}</strong>. 
          Memahami kontribusi aditif setiap faktor agroklimat dan pola respon non-linear terhadap hasil panen padi.
        </p>
      </section>

      {/* SECTION 1: SHAP Feature Contributions */}
      <section className="bg-[#FAF7F0] rounded-2xl border border-[#D8E3CC] p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-[#D8E3CC] pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
              <Network className="w-4 h-4 text-[#287A4A]" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
                1. Kontribusi Nilai SHAP (Shapley Additive exPlanations)
              </h2>
              <span className="text-[11px] text-[#5F7061]">
                Menghitung seberapa banyak setiap variabel menambah (+) atau mengurangi (-) estimasi panen dari nilai baseline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-[#4D9568] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4D9568]" />
              Dampak Positif
            </span>
            <span className="text-[#D8E3CC]">•</span>
            <span className="flex items-center gap-1.5 text-[#C96F5F] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C96F5F]" />
              Dampak Negatif
            </span>
          </div>
        </div>

        {/* SHAP Chart Component */}
        <ShapContributionChart data={shapData} />
      </section>

      {/* SECTION 2: Accumulated Local Effects (ALE) */}
      <section className="bg-[#FAF7F0] rounded-2xl border border-[#D8E3CC] p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-[#D8E3CC] pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
              <Sparkles className="w-4 h-4 text-[#287A4A]" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
                2. Pola Hubungan Marjinal ALE (Accumulated Local Effects)
              </h2>
              <span className="text-[11px] text-[#5F7061]">
                Menampilkan respon model terhadap variasi fitur tanpa bias korelasi antar-variabel lingkungan
              </span>
            </div>
          </div>
        </div>

        {/* ALE Component */}
        <AleResponseChart
          data={aleData}
          activeFeature={activeAleFeature}
          onSelectFeature={handleSelectAleFeature}
        />
      </section>
    </div>
  );
};
