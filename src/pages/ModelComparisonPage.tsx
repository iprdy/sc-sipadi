import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, GitCompareArrows } from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { useModelRun } from '../context/ModelRunContext';
import { apiService } from '../services/apiService';
import { ModelComparison, ModelMetrics, ModelPrediction } from '../types';
import {
  ModelChartPoint,
  ModelErrorChart,
  ModelPredictionChart,
} from '../components/charts/ModelEvaluationCharts';

const METRICS: Array<{ key: keyof ModelMetrics; label: string; percent?: boolean }> = [
  { key: 'mae', label: 'MAE' },
  { key: 'rmse', label: 'RMSE' },
  { key: 'r2', label: 'R²' },
  { key: 'bias', label: 'Bias' },
  { key: 'wape_pct', label: 'WAPE', percent: true },
  { key: 'mape_nonzero_pct', label: 'MAPE', percent: true },
  { key: 'smape_pct', label: 'SMAPE', percent: true },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const metricText = (metrics: ModelMetrics | null, key: keyof ModelMetrics, percent = false) => {
  const value = metrics?.[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${value.toFixed(3)}${percent ? '%' : ''}`;
};

const canonicalOrigin = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : new Date(timestamp).toISOString();
};

const predictionKey = (row: ModelPrediction) =>
  `${row.Kabupaten.trim().toLocaleLowerCase()}|${row.Tahun}|${row.Bulan}|${canonicalOrigin(row.Origin)}`;

const sameObservations = (
  baseline: ModelPrediction[],
  tuned: ModelPrediction[],
): { matched: ModelComparison['alignedPredictions']; warning: string | null } => {
  if (baseline.length !== tuned.length) {
    return {
      matched: [],
      warning: `Jumlah prediksi berbeda: Baseline ${baseline.length}, Tuned ${tuned.length}. Grafik perbandingan tidak ditampilkan.`,
    };
  }
  const baselineByKey = new Map(baseline.map((row) => [predictionKey(row), row]));
  const tunedByKey = new Map(tuned.map((row) => [predictionKey(row), row]));
  if ([...baselineByKey.keys()].some((key) => !tunedByKey.has(key))) {
    return {
      matched: [],
      warning: 'Tanggal, kabupaten, bulan, atau origin prediksi tidak sama. Grafik perbandingan tidak ditampilkan.',
    };
  }

  const matched: ModelComparison['alignedPredictions'] = [];
  for (const [key, baselineRow] of baselineByKey) {
    const tunedRow = tunedByKey.get(key);
    if (!tunedRow || baselineRow.Produktivitas === null || tunedRow.Produktivitas === null) {
      return {
        matched: [],
        warning: 'Nilai aktual pada pasangan run tidak lengkap. Grafik perbandingan tidak ditampilkan.',
      };
    }
    if (baselineRow.Produktivitas !== tunedRow.Produktivitas) {
      return {
        matched: [],
        warning: `Nilai aktual berbeda pada observasi ${baselineRow.Kabupaten}, ${baselineRow.Bulan}/${baselineRow.Tahun}. Perbandingan dibatalkan.`,
      };
    }
    matched.push({
      key,
      Kabupaten: baselineRow.Kabupaten,
      Tahun: baselineRow.Tahun,
      Bulan: baselineRow.Bulan,
      Origin: baselineRow.Origin,
      Produktivitas: baselineRow.Produktivitas,
      baselinePrediction: baselineRow.Prediksi,
      baselineError: baselineRow.Error,
      tunedPrediction: tunedRow.Prediksi,
      tunedError: tunedRow.Error,
    });
  }
  matched.sort((left, right) => left.Bulan - right.Bulan);
  return { matched, warning: null };
};

const formatKuHa = (value: number) => `${value.toFixed(2)} ku/ha`;

export const ModelComparisonPage: React.FC = () => {
  const { selectedRegion, setSelectedRegion, regions, currentRegionName } = useFilter();
  const {
    availableRuns,
    selectedUploadBatchId,
    loading: runsLoading,
    error: runsError,
  } = useModelRun();
  const baseline = availableRuns.find((run) => run.modelKey === 'xgboost_baseline');
  const tuned = availableRuns.find((run) => run.modelKey === 'xgboost_tuned');
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestKey =
    baseline && tuned
      ? `${baseline.runId}|${tuned.runId}|${selectedRegion}`
      : null;

  useEffect(() => {
    let active = true;
    if (!baseline || !tuned || !requestKey) {
      return () => {
        active = false;
      };
    }
    if (!baseline.uploadBatchId || baseline.uploadBatchId !== tuned.uploadBatchId) {
      return () => {
        active = false;
      };
    }

    Promise.all([
      apiService.getRunPredictions(baseline.runId, selectedRegion),
      apiService.getRunPredictions(tuned.runId, selectedRegion),
    ])
      .then(([baselineResponse, tunedResponse]) => {
        if (!active) return;
        const aligned = sameObservations(
          baselineResponse.predictions,
          tunedResponse.predictions,
        );
        if (aligned.warning) {
          setComparison(null);
          setError(aligned.warning);
        } else {
          setError(null);
          setComparison({
            baseline,
            tuned,
            alignedPredictions: aligned.matched,
          });
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setComparison(null);
          setError(reason instanceof Error ? reason.message : 'Prediksi perbandingan gagal dimuat.');
        }
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [baseline, tuned, selectedRegion, requestKey]);

  const chartData = useMemo<ModelChartPoint[]>(
    () =>
      (comparison?.alignedPredictions || []).map((row) => ({
        period: `${MONTHS[row.Bulan - 1]} ${row.Tahun}`,
        actual: row.Produktivitas,
        baseline: row.baselinePrediction,
        tuned: row.tunedPrediction,
        baselineError: row.baselineError,
        tunedError: row.tunedError,
      })),
    [comparison],
  );

  if (runsLoading && !baseline) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-3 border-[#287A4A] border-t-transparent" />
        <span className="text-sm text-[#5F7061]">Memuat batch model terbaru...</span>
      </div>
    );
  }
  if (!baseline || !tuned) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-amber-700" />
        <p className="max-w-xl text-sm text-[#5F7061]">
          {runsError || 'Perbandingan memerlukan Baseline dan Tuned dari satu batch upload yang sama.'}
        </p>
      </div>
    );
  }
  if (!baseline.uploadBatchId || baseline.uploadBatchId !== tuned.uploadBatchId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-center text-sm text-amber-900">
        Baseline dan Tuned harus berasal dari upload_batch_id yang sama.
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl font-extrabold tracking-tight text-[#164A32] sm:text-3xl">
            PERBANDINGAN MODEL
          </h1>
          <span className="ml-auto rounded-full border border-[#C8DDAF] bg-[#EDF4E5] px-3 py-1 text-xs font-bold text-[#287A4A]">
            Satu batch · tanpa pemilihan pemenang
          </span>
        </div>
        <p className="mt-2 text-sm text-[#5F7061]">
          Prediksi final test 2025 disejajarkan per kabupaten, tahun, bulan, dan origin.
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D8E3CC] bg-[#FFFDF7] p-4">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#164A32]">Upload batch yang dibandingkan</p>
          <p className="mt-1 break-all font-mono text-xs text-[#5F7061]">{selectedUploadBatchId}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#164A32]">
          Kabupaten/Kota
          <select
            value={selectedRegion}
            onChange={(event) => setSelectedRegion(event.target.value as typeof selectedRegion)}
            className="rounded-xl border border-[#D8E3CC] bg-white px-3 py-2"
          >
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[baseline, tuned].map((run) => {
          const metrics = run.temporalValidationMetrics;
          const finalMetrics = run.finalTestMetrics;
          const isTuned = run.modelKey === 'xgboost_tuned';
          return (
            <article
              key={run.runId}
              className={`rounded-2xl border bg-[#FFFDF7] p-5 ${isTuned ? 'border-[#EADBAC]' : 'border-[#C8DDAF]'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isTuned ? 'bg-[#FFF4DE] text-[#765A18]' : 'bg-[#EDF4E5] text-[#164A32]'}`}>
                    {isTuned ? 'XGBoost Tuned' : 'XGBoost Baseline'}
                  </span>
                  <h2 className="mt-2 text-lg font-extrabold text-[#164A32]">{run.modelName}</h2>
                </div>
                <span className="text-[11px] text-[#5F7061]">
                  Artifact: {run.artifactStatus === 'available' ? 'tersedia' : run.artifactStatus === 'missing' ? 'tidak ditemukan' : 'tidak diketahui'}
                </span>
              </div>
              <p className="mt-2 break-all font-mono text-[11px] text-[#5F7061]">Run ID: {run.runId}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Temporal validation', metrics],
                  ['Final test 2025', finalMetrics],
                ].map(([label, values]) => (
                  <div key={label as string} className="rounded-xl bg-[#FAF7F0] p-3">
                    <h3 className="mb-2 font-bold text-[#164A32]">{label as string}</h3>
                    <p className="text-[#5F7061]">
                      MAE <strong className="text-[#164A32]">{metricText(values as ModelMetrics | null, 'mae')}</strong>
                      <span className="mx-1">·</span>
                      RMSE <strong className="text-[#164A32]">{metricText(values as ModelMetrics | null, 'rmse')}</strong>
                    </p>
                    <p className="mt-1 text-[#5F7061]">
                      R² <strong className="text-[#164A32]">{metricText(values as ModelMetrics | null, 'r2')}</strong>
                      <span className="mx-1">·</span>
                      Bias <strong className="text-[#164A32]">{metricText(values as ModelMetrics | null, 'bias')}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[#D8E3CC] bg-[#FFFDF7] p-5">
        <h2 className="mb-3 text-sm font-extrabold text-[#164A32]">Metrik kedua model</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-[#EDF4E5] text-[#164A32]">
              <tr>
                <th className="px-3 py-2.5">Metrik</th>
                <th className="px-3 py-2.5">Baseline · Validation</th>
                <th className="px-3 py-2.5">Tuned · Validation</th>
                <th className="px-3 py-2.5">Baseline · Test 2025</th>
                <th className="px-3 py-2.5">Tuned · Test 2025</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric) => (
                <tr key={metric.key} className="border-t border-[#E8EFE0]">
                  <td className="px-3 py-2 font-bold text-[#164A32]">{metric.label}</td>
                  <td className="px-3 py-2 font-mono">{metricText(baseline.temporalValidationMetrics, metric.key, metric.percent)}</td>
                  <td className="px-3 py-2 font-mono">{metricText(tuned.temporalValidationMetrics, metric.key, metric.percent)}</td>
                  <td className="px-3 py-2 font-mono">{metricText(baseline.finalTestMetrics, metric.key, metric.percent)}</td>
                  <td className="px-3 py-2 font-mono">{metricText(tuned.finalTestMetrics, metric.key, metric.percent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {loadedKey !== requestKey ? (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-[#5F7061]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#287A4A] border-t-transparent" />
          Memuat prediksi {currentRegionName}...
        </div>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </p>
      ) : comparison && comparison.alignedPredictions.length === 0 ? (
        <p className="rounded-xl border border-[#D8E3CC] bg-white p-4 text-sm text-[#5F7061]">
          Tidak ada prediksi final test untuk {currentRegionName}.
        </p>
      ) : comparison ? (
        <>
          <section className="flex flex-col gap-4 rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-5 sm:p-6">
            <div className="flex items-center gap-2 border-b border-[#D8E3CC] pb-3">
              <GitCompareArrows className="h-5 w-5 text-[#287A4A]" />
              <div>
                <h2 className="text-sm font-extrabold text-[#164A32]">Aktual vs Prediksi</h2>
                <p className="text-[11px] text-[#5F7061]">
                  {comparison.alignedPredictions.length} observasi yang sama · {currentRegionName} · satuan ku/ha
                </p>
              </div>
            </div>
            <ModelPredictionChart
              data={chartData}
              unit="ku/ha"
              series={[
                { key: 'baseline', name: 'Baseline Prediction', color: '#287A4A' },
                { key: 'tuned', name: 'Tuned Prediction', color: '#C58B2A' },
              ]}
            />
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-[#D8E3CC] bg-[#FFFDF7] p-5">
            <div>
              <h2 className="text-sm font-extrabold text-[#164A32]">Error Prediksi Bulanan</h2>
              <p className="text-[11px] text-[#5F7061]">Error aktual dari API, dalam ku/ha.</p>
            </div>
            <ModelErrorChart
              data={chartData}
              series={[
                { key: 'baselineError', name: 'Baseline Error', color: '#287A4A' },
                { key: 'tunedError', name: 'Tuned Error', color: '#C58B2A' },
              ]}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#D8E3CC] bg-white">
            <div className="border-b border-[#D8E3CC] p-4">
              <h2 className="text-sm font-extrabold text-[#164A32]">Tabel Prediksi Final Test 2025</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-xs">
                <thead className="bg-[#EDF4E5] text-[#164A32]">
                  <tr>
                    <th className="px-3 py-2.5">Bulan</th>
                    <th className="px-3 py-2.5">Origin</th>
                    <th className="px-3 py-2.5">Aktual</th>
                    <th className="px-3 py-2.5">Baseline</th>
                    <th className="px-3 py-2.5">Error</th>
                    <th className="px-3 py-2.5">Tuned</th>
                    <th className="px-3 py-2.5">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.alignedPredictions.map((row) => (
                    <tr key={row.key} className="border-t border-[#E8EFE0]">
                      <td className="px-3 py-2">{MONTHS[row.Bulan - 1]} {row.Tahun}</td>
                      <td className="px-3 py-2 font-mono">{row.Origin}</td>
                      <td className="px-3 py-2">{formatKuHa(row.Produktivitas)}</td>
                      <td className="px-3 py-2">{formatKuHa(row.baselinePrediction)}</td>
                      <td className="px-3 py-2">{formatKuHa(row.baselineError)}</td>
                      <td className="px-3 py-2">{formatKuHa(row.tunedPrediction)}</td>
                      <td className="px-3 py-2">{formatKuHa(row.tunedError)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};
