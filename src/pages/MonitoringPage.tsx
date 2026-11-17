import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart2, TrendingUp } from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { useModelRun } from '../context/ModelRunContext';
import { apiService } from '../services/apiService';
import { ModelPrediction, MonitoringData } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import {
  ModelChartPoint,
  ModelPredictionChart,
} from '../components/charts/ModelEvaluationCharts';
import { ProductivityTrendChart } from '../components/charts/ProductivityTrendChart';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatKuHa = (value: number | null) =>
  value === null ? '—' : `${value.toFixed(2)} ku/ha`;

export const MonitoringPage: React.FC = () => {
  const { selectedRegion, selectedYear, currentRegionName } = useFilter();
  const {
    selectedRun,
    selectedRunId,
    selectedModelKey,
    loading: runsLoading,
    error: runsError,
  } = useModelRun();
  const [data, setData] = useState<MonitoringData | null>(null);
  const [predictions, setPredictions] = useState<ModelPrediction[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestKey = selectedRunId
    ? `${selectedRunId}|${selectedRegion}|${selectedYear}`
    : null;

  useEffect(() => {
    let active = true;
    if (!selectedRunId || !requestKey) {
      return () => {
        active = false;
      };
    }

    Promise.all([
      apiService.getRunMonitoring(selectedRunId, selectedRegion, selectedYear),
      apiService.getRunPredictions(selectedRunId, selectedRegion),
    ])
      .then(([monitoring, predictionResponse]) => {
        if (active) {
          setData(monitoring);
          setPredictions(predictionResponse.predictions);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setData(null);
          setPredictions([]);
          setError(reason instanceof Error ? reason.message : 'Data pemantauan gagal dimuat.');
        }
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [selectedRegion, selectedYear, selectedRunId, requestKey]);

  const chartData = useMemo<ModelChartPoint[]>(() => {
    if (selectedYear !== 2025) return [];
    return predictions
      .filter((row) => row.Tahun === selectedYear)
      .sort((left, right) => left.Bulan - right.Bulan)
      .map((row) => ({
        period: `${MONTHS[row.Bulan - 1]} ${row.Tahun}`,
        actual: row.Produktivitas,
        prediction: row.Prediksi,
      }));
  }, [predictions, selectedYear]);

  if (selectedRunId ? loadedKey !== requestKey : runsLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-3 border-[#287A4A] border-t-transparent" />
        <span className="text-xs font-semibold text-[#5F7061]">
          Memuat data run {selectedRunId || 'terpilih'}...
        </span>
      </div>
    );
  }

  if (!selectedRun || error || !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-amber-700" />
        <span className="max-w-2xl text-sm font-semibold text-[#5F7061]">
          {error || runsError || 'Pilih run yang tersedia untuk memuat monitoring.'}
        </span>
      </div>
    );
  }

  const predictionLabel =
    selectedModelKey === 'xgboost_tuned' ? 'XGBoost Tuned' : 'XGBoost Baseline';
  const predictionColor =
    selectedModelKey === 'xgboost_tuned' ? '#C58B2A' : '#287A4A';

  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl font-extrabold tracking-tight text-[#164A32] sm:text-3xl">
            MONITORING PRODUKTIVITAS
          </h1>
          <span className="ml-auto hidden rounded-full border border-[#C8DDAF] bg-[#EDF4E5] px-3 py-1 text-xs font-bold text-[#287A4A] sm:inline">
            Tahun Analisis: {selectedYear}
          </span>
        </div>
        <p className="max-w-3xl text-xs text-[#5F7061] sm:text-sm">
          Data {currentRegionName} memakai model {selectedRun.modelName}; run{' '}
          <span className="font-mono">{selectedRun.runId}</span>.
        </p>
        <p className="text-[11px] text-[#5F7061]">
          Ringkasan tahunan ditampilkan dalam ton/ha. Hasil final test 2025 dan galat tetap dalam ku/ha sesuai API.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Produktivitas Aktual" metric={data.productivity} variant="primary" />
        <MetricCard title="NDVI Kanopi" metric={data.ndvi} variant="ndvi" />
        <MetricCard title="LST (Suhu Permukaan)" metric={data.lst} variant="lst" />
        <MetricCard title="Curah Hujan" metric={data.rainfall} variant="rainfall" />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-5 shadow-xs sm:p-6">
        <div className="border-b border-[#D8E3CC] pb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
            Trend Produktivitas Aktual 2018–2025 · {currentRegionName}
          </h2>
          <p className="text-[11px] text-[#5F7061]">
            Rerata data aktual pada training run terpilih · satuan ton/ha.
          </p>
        </div>
        <ProductivityTrendChart data={data.trend} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8E3CC] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#C8DDAF] bg-[#EDF4E5] text-[#287A4A]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
                AKTUAL VS PREDIKSI · {currentRegionName} · {selectedYear}
              </h2>
              <span className="text-[11px] text-[#5F7061]">
                Final test rolling-origin · run {selectedRun.runId}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#5F7061]">Satuan: ku/ha</span>
        </div>

        {selectedYear !== 2025 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Prediksi yang tersedia pada endpoint ini hanya mencakup final test Januari–Desember 2025. Pilih tahun 2025 untuk melihat aktual, prediksi, dan error berpasangan.
          </p>
        ) : chartData.length === 0 ? (
          <p className="rounded-xl border border-[#D8E3CC] bg-white p-4 text-sm text-[#5F7061]">
            Belum ada hasil final test untuk {currentRegionName}.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4 text-xs text-[#5F7061]">
              <span className="font-semibold text-[#164A32]">Model aktif: {predictionLabel}</span>
              <span>Observasi: {chartData.length}</span>
            </div>
            <ModelPredictionChart
              data={chartData}
              unit="ku/ha"
              series={[{ key: 'prediction', name: `${predictionLabel} · Prediksi`, color: predictionColor }]}
            />
            <div className="overflow-x-auto rounded-xl border border-[#D8E3CC] bg-white">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-[#EDF4E5] text-[#164A32]">
                  <tr>
                    <th className="px-3 py-2.5">Bulan</th>
                    <th className="px-3 py-2.5">Aktual (ku/ha)</th>
                    <th className="px-3 py-2.5">{predictionLabel} (ku/ha)</th>
                    <th className="px-3 py-2.5">Error (ku/ha)</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions
                    .filter((row) => row.Tahun === 2025)
                    .sort((left, right) => left.Bulan - right.Bulan)
                    .map((row) => (
                      <tr key={`${row.Kabupaten}-${row.Tahun}-${row.Bulan}-${row.Origin}`} className="border-t border-[#E8EFE0]">
                        <td className="px-3 py-2">{MONTHS[row.Bulan - 1]} {row.Tahun}</td>
                        <td className="px-3 py-2">{formatKuHa(row.Produktivitas)}</td>
                        <td className="px-3 py-2">{formatKuHa(row.Prediksi)}</td>
                        <td className="px-3 py-2">{formatKuHa(row.Error)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#D8E3CC] bg-[#FFFDF7] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8E3CC] pb-3">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
              Feature Importance · Global SHAP
            </h2>
            <p className="text-[11px] text-[#5F7061]">
              Mean absolute SHAP pada training run {selectedRun.runId}.
            </p>
          </div>
          <span className="rounded-md border border-[#C8DDAF] bg-[#EDF4E5] px-2.5 py-1 text-[11px] font-bold text-[#287A4A]">
            {selectedRun.modelName}
          </span>
        </div>
        {data.featureImportance.length === 0 ? (
          <p className="text-sm text-[#5F7061]">Feature importance SHAP tidak tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.featureImportance.map((feature) => (
              <div key={feature.feature} className="rounded-xl border border-[#D8E3CC] bg-[#FAF7F0] p-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <strong className="text-[#164A32]">{feature.label}</strong>
                  <span className="font-bold text-[#287A4A]">{feature.percentage.toFixed(2)}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EDF4E5]">
                  <div
                    className="h-full rounded-full bg-[#287A4A]"
                    style={{ width: `${feature.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#D8E3CC] bg-[#FFFDF7] p-5">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
          <BarChart2 className="h-4 w-4 text-[#287A4A]" />
          Cakupan run
        </h2>
        <p className="text-xs text-[#5F7061]">
          {data.count} observasi pada {currentRegionName}, {data.year}; model key{' '}
          <span className="font-mono">{data.modelKey || selectedModelKey}</span>.
        </p>
      </section>
    </div>
  );
};
