import React, { useState } from 'react';
import { AlertCircle, Cpu, Play } from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { useModelRun } from '../context/ModelRunContext';
import { apiService } from '../services/apiService';
import { PredictionInputPayload, PredictionResult } from '../types';

export const PredictionModelPage: React.FC = () => {
  const { currentRegionName, selectedRegion } = useFilter();
  const {
    selectedRun,
    selectedRunId,
    loading: runsLoading,
    error: runsError,
  } = useModelRun();
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [ndvi, setNdvi] = useState<number | ''>('');
  const [lst, setLst] = useState<number | ''>('');
  const [rainfall, setRainfall] = useState<number | ''>('');
  const [isInferencing, setIsInferencing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunInference = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (year === '' || month === '' || ndvi === '' || lst === '' || rainfall === '') {
      setError('Tahun, bulan, NDVI, LST, dan Rainfall harus diisi.');
      return;
    }
    if (!selectedRunId) {
      setError(runsError || 'Pilih training run yang tersedia sebelum membuat prediksi.');
      return;
    }

    setIsInferencing(true);
    const payload: PredictionInputPayload = {
      regionId: selectedRegion,
      year,
      month,
      ndvi,
      lst,
      rainfall,
    };

    try {
      setResult(await apiService.predictYield(payload, selectedRunId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Prediksi tidak dapat diproses.');
    } finally {
      setIsInferencing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <section>
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#164A32]">
            PREDIKSI PRODUKTIVITAS MODEL B
          </h1>
          <span className="ml-auto hidden rounded-full border border-[#C8DDAF] bg-[#EDF4E5] px-3 py-1 text-xs font-bold text-[#287A4A] sm:inline">
            Model: {selectedRun?.modelName || 'belum tersedia'}
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-[#5F7061]">
          Prediksi memakai run terpilih. Fitur lag menggunakan Produktivitas aktual dari tiga bulan kalender sebelumnya pada run dan kabupaten yang sama.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleRunInference}
          className="flex flex-col gap-5 rounded-2xl border border-[#D8E3CC] bg-[#FFFDF7] p-5 sm:p-6"
        >
          <div className="border-b border-[#D8E3CC] pb-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#164A32]">
              Parameter prediksi
            </h2>
            <p className="mt-1 text-xs text-[#5F7061]">
              Wilayah: {currentRegionName} · Run: {selectedRunId || 'tidak tersedia'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-bold text-[#164A32]">
              Tahun
              <input
                type="number"
                min={1900}
                max={2200}
                value={year}
                onChange={(event) => setYear(event.target.value === '' ? '' : Number(event.target.value))}
                className="rounded-xl border border-[#D8E3CC] bg-white px-3 py-2"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-[#164A32]">
              Bulan
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(event.target.value === '' ? '' : Number(event.target.value))}
                className="rounded-xl border border-[#D8E3CC] bg-white px-3 py-2"
                required
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-bold text-[#164A32]">
            NDVI: {ndvi === '' ? '' : ndvi.toFixed(2)}
            <input
              type="number"
              min={-1}
              max={1}
              step={0.01}
              value={ndvi}
              onChange={(event) => setNdvi(event.target.value === '' ? '' : Number(event.target.value))}
              className="rounded-xl border border-[#D8E3CC] bg-white px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-[#164A32]">
            LST (°C)
            <input
              type="number"
              step={0.1}
              value={lst}
              onChange={(event) => setLst(event.target.value === '' ? '' : Number(event.target.value))}
              className="rounded-xl border border-[#D8E3CC] bg-white px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-[#164A32]">
            Rainfall (mm)
            <input
              type="number"
              min={0}
              step={0.1}
              value={rainfall}
              onChange={(event) => setRainfall(event.target.value === '' ? '' : Number(event.target.value))}
              className="rounded-xl border border-[#D8E3CC] bg-white px-3 py-2"
              required
            />
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isInferencing || runsLoading || !selectedRunId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#287A4A] py-3 text-xs font-extrabold text-white hover:bg-[#164A32] disabled:opacity-60"
          >
            {isInferencing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Play className="h-4 w-4 fill-white" />
            )}
            Prediksi dengan model tersimpan
          </button>
        </form>

        <div className="flex min-h-[360px] flex-col justify-center rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-6">
          {result ? (
            <>
              <div className="flex items-center gap-2 text-sm font-bold text-[#164A32]">
                <Cpu className="h-5 w-5 text-[#287A4A]" />
                Hasil dari {result.modelName} ({result.modelKey || 'model'})
              </div>
              <p className="mt-5 text-4xl font-black text-[#164A32]">
                {result.predictedYieldTonHa.toFixed(2)}
                <span className="ml-2 text-base font-semibold">ton/ha</span>
              </p>
              <p className="mt-1 text-sm text-[#5F7061]">
                {result.predictedYieldKuHa.toFixed(2)} ku/ha · {month}/{year}
              </p>
              <p className="mt-4 text-xs text-[#5F7061]">Training run: {result.runId}</p>
              <div className="mt-5 border-t border-[#D8E3CC] pt-4 text-xs text-[#5F7061]">
                Fitur yang dipakai:
                <ul className="mt-2 grid grid-cols-2 gap-1">
                  {Object.entries(result.features).map(([name, value]) => (
                    <li key={name}>{name}: {typeof value === 'number' ? value.toFixed(4) : value}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-[#5F7061]">
              {runsError || 'Hasil akan tampil setelah prediksi berhasil.'} Jika data target pada salah satu dari tiga bulan sebelumnya tidak tersedia, API menolak prediksi tanpa membuat nilai lag.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
