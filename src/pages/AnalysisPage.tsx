import React, { useEffect, useState } from 'react';
import { AlertCircle, Network, Sparkles } from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { useModelRun } from '../context/ModelRunContext';
import { apiService } from '../services/apiService';
import { AleFeatureData, RunAnalysis } from '../types';
import { ShapContributionChart } from '../components/charts/ShapContributionChart';
import { AleResponseChart } from '../components/charts/AleResponseChart';

type AnalysisScope = 'regional' | 'global';

const scopeLabel = (scope: string) => {
  switch (scope) {
    case 'rolling_origin_2025_oof':
      return 'Regional SHAP OOF 2025 (rolling-origin)';
    case 'final_model_in_sample':
    case 'global_training_run':
      return 'SHAP global dari training run';
    case 'final_model_by_region':
      return 'ALE final model per kabupaten';
    case 'final_model_global':
      return 'ALE final model global';
    default:
      return scope.replaceAll('_', ' ');
  }
};

export const AnalysisPage: React.FC = () => {
  const { selectedRegion, selectedYear, currentRegionName } = useFilter();
  const {
    selectedRun,
    selectedRunId,
    loading: runsLoading,
    error: runsError,
  } = useModelRun();
  const [analysis, setAnalysis] = useState<RunAnalysis | null>(null);
  const [scope, setScope] = useState<AnalysisScope>('regional');
  const [activeAleFeature, setActiveAleFeature] =
    useState<AleFeatureData['featureKey']>('ndvi');
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestKey = selectedRunId
    ? `${selectedRunId}|${scope}|${selectedRegion}|${selectedYear}`
    : null;

  useEffect(() => {
    let active = true;
    if (!selectedRunId || !requestKey) {
      return () => {
        active = false;
      };
    }

    apiService
      .getRunAnalysis(
        selectedRunId,
        scope === 'regional' ? selectedRegion : undefined,
        selectedYear,
      )
      .then((result) => {
        if (active) {
          setAnalysis(result);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setAnalysis(null);
          setError(reason instanceof Error ? reason.message : 'Analisis model gagal dimuat.');
        }
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [selectedRegion, selectedYear, selectedRunId, requestKey, scope]);

  if (selectedRunId ? loadedKey !== requestKey : runsLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-3 border-[#287A4A] border-t-transparent" />
        <span className="text-xs font-semibold text-[#5F7061]">
          Memuat SHAP dan ALE untuk run terpilih...
        </span>
      </div>
    );
  }

  if (error || !analysis || !selectedRun) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center text-sm text-[#5F7061]">
        <AlertCircle className="h-7 w-7 text-amber-700" />
        {error || runsError || 'Pilih run yang tersedia untuk membuka analisis.'}
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl font-extrabold tracking-tight text-[#164A32] sm:text-3xl">
            EXPLAINABLE AI (XAI) PIPELINE
          </h1>
          <span className="ml-auto hidden rounded-full border border-[#C8DDAF] bg-[#EDF4E5] px-3 py-1 text-xs font-bold text-[#287A4A] sm:inline">
            {selectedRun.modelName}
          </span>
        </div>
        <p className="max-w-3xl text-xs text-[#5F7061] sm:text-sm">
          Interpretasi memakai run <span className="font-mono">{analysis.runId}</span> untuk{' '}
          {scope === 'regional' ? currentRegionName : 'seluruh data'}.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-[#EDF4E5] px-3 py-1 font-semibold text-[#164A32]">
            {scopeLabel(analysis.featureImportanceScope)}
          </span>
          <span className="rounded-full bg-[#FFF4DE] px-3 py-1 font-semibold text-[#765A18]">
            {scopeLabel(analysis.aleScope)}
          </span>
        </div>
        {analysis.featureImportanceScope === 'rolling_origin_2025_oof' && (
          <p className="max-w-3xl text-xs text-[#5F7061]">
            Regional SHAP berasal dari model rolling-origin untuk prediksi OOF 2025; ALE dihitung terpisah dari final model. SHAP global (in-sample final model) tersedia pada cakupan Global.
          </p>
        )}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D8E3CC] bg-[#FFFDF7] p-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
            Cakupan interpretasi
          </p>
          <p className="mt-1 text-[11px] text-[#5F7061]">
            Regional mengikuti filter kabupaten; global memakai seluruh training run.
          </p>
        </div>
        <div className="flex gap-2">
          {(['regional', 'global'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={`rounded-xl px-4 py-2 text-xs font-bold ${
                scope === value
                  ? 'bg-[#164A32] text-white'
                  : 'border border-[#D8E3CC] bg-white text-[#5F7061]'
              }`}
            >
              {value === 'regional' ? 'Kabupaten terpilih' : 'Global'}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-2.5 border-b border-[#D8E3CC] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#C8DDAF] bg-[#EDF4E5] text-[#287A4A]">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
              Kontribusi fitur SHAP
            </h2>
            <span className="text-[11px] text-[#5F7061]">{scopeLabel(analysis.featureImportanceScope)}</span>
          </div>
        </div>
        <ShapContributionChart
          data={{
            runId: analysis.runId,
            modelName: analysis.modelName,
            modelKey: analysis.modelKey,
            scope: analysis.featureImportanceScope,
            validationScheme: analysis.validationScheme,
            features: analysis.features,
          }}
        />
      </section>

      <section className="flex flex-col gap-5 rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-2.5 border-b border-[#D8E3CC] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#C8DDAF] bg-[#EDF4E5] text-[#287A4A]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
              Kurva Accumulated Local Effects (ALE)
            </h2>
            <span className="text-[11px] text-[#5F7061]">{scopeLabel(analysis.aleScope)}</span>
          </div>
        </div>
        <AleResponseChart
          data={analysis.ale}
          activeFeature={activeAleFeature}
          onSelectFeature={setActiveAleFeature}
        />
      </section>
    </div>
  );
};
