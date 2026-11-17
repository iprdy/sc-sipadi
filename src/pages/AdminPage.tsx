import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  FileSpreadsheet,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useModelRun } from '../context/ModelRunContext';
import { apiService } from '../services/apiService';
import { ModelMetrics, TrainingRun } from '../types';

const METRICS: Array<{ key: keyof ModelMetrics; label: string; percent?: boolean }> = [
  { key: 'mae', label: 'MAE' },
  { key: 'rmse', label: 'RMSE' },
  { key: 'r2', label: 'R²' },
  { key: 'bias', label: 'Bias' },
  { key: 'wape_pct', label: 'WAPE', percent: true },
  { key: 'mape_nonzero_pct', label: 'MAPE', percent: true },
  { key: 'smape_pct', label: 'SMAPE', percent: true },
];

const formatMetric = (
  metrics: ModelMetrics | null,
  key: keyof ModelMetrics,
  percent = false,
) => {
  const value = metrics?.[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${value.toFixed(3)}${percent ? '%' : ''}`;
};

const formatTime = (value: string | null) => {
  if (!value) return 'Waktu tidak tersedia';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
};

const modelStyle = (modelKey: TrainingRun['modelKey']) =>
  modelKey === 'xgboost_tuned'
    ? { accent: 'border-[#EADBAC]', badge: 'bg-[#FFF4DE] text-[#765A18]', color: '#C58B2A' }
    : { accent: 'border-[#C8DDAF]', badge: 'bg-[#EDF4E5] text-[#164A32]', color: '#287A4A' };

export const AdminPage: React.FC = () => {
  const { user, login } = useAuth();
  const {
    availableRuns,
    refreshRuns,
    loading: runsLoading,
    error: runsError,
  } = useModelRun();
  const isAdmin = user?.role === 'admin';
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [displayedBatchId, setDisplayedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('sipadi_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const displayRuns = availableRuns;
  const activeBatchId = displayedBatchId || availableRuns[0]?.uploadBatchId || null;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const success = await login(email, password);
      if (!success) throw new Error('Gagal melakukan autentikasi akun.');
      setToken(localStorage.getItem('sipadi_token') || '');
      setSuccessMsg('Autentikasi administrator berhasil.');
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : 'Koneksi ke server gagal.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUploadAndTrain = async () => {
    if (!file) {
      setError('Pilih berkas dataset CSV atau Excel terlebih dahulu.');
      return;
    }
    if (!token) {
      setError('Silakan login sebagai administrator sebelum mengunggah dataset.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const uploaded = await apiService.uploadDataset(file, token);
      setDisplayedBatchId(uploaded.uploadBatchId);
      setSuccessMsg(
        `Upload ${uploaded.filename} diterima: ${uploaded.rows} observasi dan ${uploaded.runs.length} hasil training.`,
      );
      setFile(null);
      setFileInputKey((key) => key + 1);
      try {
        const batchRuns = await refreshRuns(uploaded.uploadBatchId);
        if (batchRuns.length !== 2) {
          setError('Upload selesai, tetapi pasangan Baseline dan Tuned belum dapat dimuat lengkap.');
        }
      } catch {
        setError('Upload selesai, tetapi daftar run tidak dapat dimuat ulang. Coba muat ulang hasil.');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal menghubungi backend.');
    } finally {
      setLoading(false);
    }
  };

  const reloadBatch = async () => {
    setIsReloading(true);
    setError('');
    try {
      const runs = await refreshRuns(activeBatchId || undefined);
      setDisplayedBatchId(runs[0]?.uploadBatchId || null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Riwayat training gagal dimuat.');
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div className="flex animate-fade-in flex-col gap-6 pb-10">
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl font-extrabold tracking-tight text-[#164A32] sm:text-3xl">
            UPLOAD DATA &amp; PELATIHAN MODEL
          </h1>
          <span className="ml-auto hidden rounded-full border border-[#C8DDAF] bg-[#EDF4E5] px-3 py-1 text-xs font-bold text-[#287A4A] sm:inline">
            XGBoost Baseline + Tuned
          </span>
        </div>
        <p className="max-w-3xl text-xs text-[#5F7061] sm:text-sm">
          Satu upload menjalankan dua eksperimen berurutan pada Master Dataset yang sama. Kedua hasil disimpan untuk dibandingkan; sistem tidak memilih pemenang otomatis.
        </p>
      </section>

      {user && !isAdmin && (
        <section className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-8 text-center">
          <Lock className="h-8 w-8 text-amber-800" />
          <h2 className="text-lg font-bold text-[#164A32]">Halaman Khusus Administrator</h2>
          <p className="max-w-sm text-xs text-[#5F7061]">
            Akun {user.name} ({user.role || 'Pengguna'}) tidak memiliki hak unggah dataset dan training.
          </p>
        </section>
      )}

      {!user && (
        <section className="rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-6 shadow-xs sm:p-8">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex items-center gap-3 text-[#164A32]">
              <Lock className="h-6 w-6 text-[#287A4A]" />
              <div>
                <h2 className="text-lg font-bold">Autentikasi Administrator</h2>
                <p className="text-xs text-[#5F7061]">Masuk untuk mengunggah dan melatih model.</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="text-xs font-bold text-[#164A32]">
                Email Administrator
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D8E3CC] bg-white px-3.5 py-2.5 text-sm"
                  required
                />
              </label>
              <label className="text-xs font-bold text-[#164A32]">
                Kata Sandi
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D8E3CC] bg-white px-3.5 py-2.5 text-sm"
                  required
                />
              </label>
              {authError && <p className="text-xs text-red-700">{authError}</p>}
              <button
                type="submit"
                disabled={authLoading}
                className="rounded-xl bg-[#287A4A] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {authLoading ? 'Memverifikasi…' : 'Masuk sebagai Admin'}
              </button>
            </form>
          </div>
        </section>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="flex flex-col gap-5 rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-5 shadow-xs lg:col-span-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#D8E3CC] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#164A32]">
                <Database className="h-4 w-4 text-[#287A4A]" />
                <span>Unggah Dataset Baru</span>
              </div>
              <span className="rounded-full border border-[#C8DDAF] bg-[#EDF4E5] px-2.5 py-0.5 text-[11px] font-semibold text-[#287A4A]">
                CSV / Excel
              </span>
            </div>

            <div className="rounded-xl border border-[#D8E3CC] bg-white p-3.5">
              <p className="text-xs font-bold text-[#164A32]">Kolom Master Dataset</p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#5F7061]">
                Kabupaten, Tahun, Bulan, Luas_Panen_ha, Produksi_ton, Produktivitas, NDVI, LST, Rainfall, Status_LST
              </p>
              <p className="mt-1 text-[10px] text-[#5F7061]">Nilai target Produktivitas boleh kosong.</p>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#C8DDAF] bg-white p-6 text-center transition-colors hover:border-[#287A4A] hover:bg-[#F4F8EE]">
              <UploadCloud className="h-9 w-9 text-[#287A4A]" />
              <span className="text-sm font-bold text-[#164A32]">
                {file ? file.name : 'Pilih Berkas CSV atau Excel'}
              </span>
              <span className="text-xs text-[#5F7061]">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Klik untuk mencari berkas'}
              </span>
              <input
                key={fileInputKey}
                className="hidden"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div role="status" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#287A4A]" />
                <span>{successMsg}</span>
              </div>
            )}
            {runsError && !error && (
              <p className="text-xs text-amber-800">{runsError}</p>
            )}
            <button
              type="button"
              disabled={loading || !file || !token}
              onClick={handleUploadAndTrain}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#287A4A] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#164A32] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Melatih Baseline lalu Tuned...</span>
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4" />
                  <span>Validasi &amp; Latih Dua Model</span>
                </>
              )}
            </button>
            {loading && (
              <p className="text-center text-[11px] text-[#5F7061]">
                Permintaan upload tunggal sedang diproses backend secara berurutan.
              </p>
            )}
          </section>

          <section className="flex min-h-[460px] flex-col gap-5 rounded-2xl border border-[#D8E3CC] bg-[#FAF7F0] p-5 shadow-xs lg:col-span-7 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8E3CC] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#164A32]">Hasil Training per Model</h2>
                <p className="text-[11px] text-[#5F7061]">
                  Batch: <span className="font-mono">{activeBatchId || 'belum tersedia'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={reloadBatch}
                disabled={isReloading || runsLoading}
                aria-label="Muat ulang hasil training"
                className="rounded-xl border border-[#D8E3CC] bg-white p-2 text-[#287A4A] disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {runsLoading && displayRuns.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#287A4A]" />
                <p className="text-sm text-[#5F7061]">Memuat batch training terbaru...</p>
              </div>
            ) : displayRuns.length !== 2 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <FileSpreadsheet className="h-12 w-12 text-[#287A4A]/50" />
                <p className="text-sm font-semibold text-[#164A32]">Pasangan model belum tersedia.</p>
                <p className="max-w-md text-xs text-[#5F7061]">
                  {runsError || 'Unggah Master Dataset untuk membuat Baseline dan Tuned pada batch yang sama.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {displayRuns.map((run) => {
                    const style = modelStyle(run.modelKey);
                    const params = run.modelParams?.params || {};
                    const maxImportance = Math.max(
                      ...run.shapFeatures.map((feature) => feature.importance),
                      0,
                    );
                    return (
                      <article key={run.runId} className={`flex flex-col gap-4 rounded-2xl border bg-white p-4 ${style.accent}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${style.badge}`}>
                              {run.modelKey === 'xgboost_tuned' ? 'XGBoost Tuned' : 'XGBoost Baseline'}
                            </span>
                            <h3 className="mt-2 text-sm font-extrabold text-[#164A32]">{run.modelName}</h3>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            run.artifactStatus === 'available'
                              ? 'bg-green-50 text-green-800'
                              : run.artifactStatus === 'missing'
                                ? 'bg-red-50 text-red-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            Artifact: {run.artifactStatus === 'available' ? 'tersedia' : run.artifactStatus === 'missing' ? 'tidak ditemukan' : 'status tidak diketahui'}
                          </span>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <dt className="text-[#5F7061]">Run ID</dt>
                            <dd className="break-all font-mono text-[#164A32]">{run.runId}</dd>
                          </div>
                          <div>
                            <dt className="text-[#5F7061]">Training time</dt>
                            <dd className="font-semibold text-[#164A32]">{formatTime(run.createdAt)}</dd>
                          </div>
                          <div>
                            <dt className="text-[#5F7061]">Observasi</dt>
                            <dd className="font-bold text-[#164A32]">{run.rows}</dd>
                          </div>
                          <div>
                            <dt className="text-[#5F7061]">Supervised rows</dt>
                            <dd className="font-bold text-[#164A32]">{run.supervisedRows}</dd>
                          </div>
                        </dl>

                        <div>
                          <h4 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[#164A32]">Parameter estimator</h4>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl bg-[#FAF7F0] p-3 text-[10px]">
                            {Object.entries(params).map(([name, value]) => (
                              <div key={name} className="flex justify-between gap-2">
                                <span className="text-[#5F7061]">{name}</span>
                                <span className="font-mono font-semibold text-[#164A32]">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ['Temporal validation', run.temporalValidationMetrics],
                            ['Final test 2025', run.finalTestMetrics],
                          ].map(([label, metrics]) => (
                            <div key={label as string} className="rounded-xl border border-[#E8EFE0] p-3">
                              <h4 className="mb-2 text-[10px] font-extrabold text-[#164A32]">{label as string}</h4>
                              <p className="text-[10px] text-[#5F7061]">
                                MAE <strong className="text-[#164A32]">{formatMetric(metrics as ModelMetrics | null, 'mae')}</strong>
                                <span className="mx-1">·</span>
                                RMSE <strong className="text-[#164A32]">{formatMetric(metrics as ModelMetrics | null, 'rmse')}</strong>
                              </p>
                              <p className="mt-1 text-[10px] text-[#5F7061]">
                                R² <strong className="text-[#164A32]">{formatMetric(metrics as ModelMetrics | null, 'r2')}</strong>
                                <span className="mx-1">·</span>
                                Bias <strong className="text-[#164A32]">{formatMetric(metrics as ModelMetrics | null, 'bias')}</strong>
                              </p>
                            </div>
                          ))}
                        </div>

                        {run.shapFeatures.length > 0 && (
                          <div>
                            <h4 className="mb-2 flex items-center gap-1 text-[10px] font-extrabold uppercase text-[#164A32]">
                              <Sparkles className="h-3.5 w-3.5 text-[#287A4A]" />
                              SHAP global · run ini
                            </h4>
                            <div className="flex flex-col gap-2">
                              {run.shapFeatures.slice(0, 3).map((feature) => (
                                <div key={feature.id}>
                                  <div className="flex justify-between text-[10px]">
                                    <span>{feature.name}</span>
                                    <span>{feature.importance.toFixed(3)}</span>
                                  </div>
                                  <div className="mt-1 h-1.5 rounded-full bg-[#EDF4E5]">
                                    <div
                                      className="h-1.5 rounded-full"
                                      style={{
                                        width: `${maxImportance > 0 ? (feature.importance / maxImportance) * 100 : 0}%`,
                                        backgroundColor: style.color,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#164A32]">
                    <BarChart3 className="h-4 w-4 text-[#287A4A]" />
                    Tabel Perbandingan Metrik
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-[#D8E3CC] bg-white">
                    <table className="w-full min-w-[760px] text-xs">
                      <thead className="bg-[#EDF4E5] text-left text-[#164A32]">
                        <tr>
                          <th className="px-3 py-2.5">Evaluasi / Metrik</th>
                          {displayRuns.map((run) => (
                            <th key={run.runId} colSpan={2} className="px-3 py-2.5 text-center">
                              {run.modelKey === 'xgboost_tuned' ? 'XGBoost Tuned' : 'XGBoost Baseline'}
                            </th>
                          ))}
                        </tr>
                        <tr className="border-t border-[#D8E3CC]">
                          <th className="px-3 py-2" />
                          {displayRuns.map((run) => (
                            <React.Fragment key={run.runId}>
                              <th className="px-3 py-2">Validation</th>
                              <th className="px-3 py-2">Final 2025</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {METRICS.map((item) => (
                          <tr key={item.key} className="border-t border-[#E8EFE0]">
                            <td className="px-3 py-2 font-semibold text-[#164A32]">{item.label}</td>
                            {displayRuns.map((run) => (
                              <React.Fragment key={run.runId}>
                                <td className="px-3 py-2 font-mono">
                                  {formatMetric(run.temporalValidationMetrics, item.key, item.percent)}
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {formatMetric(run.finalTestMetrics, item.key, item.percent)}
                                </td>
                              </React.Fragment>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-[#5F7061]">
                    Metrik ditampilkan apa adanya dari backend; tidak ada pemilihan model pemenang otomatis.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
