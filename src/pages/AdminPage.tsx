import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  UploadCloud, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Sparkles, 
  Trophy,
  Lock,
  Layers,
  BarChart3,
  RefreshCw,
  Check,
  Loader2
} from 'lucide-react';

interface MetricDetail {
  r2: number;
  rmse: number;
  mae: number;
}

interface RunResult {
  id: string;
  filename: string;
  rows: number;
  best_model: string;
  metrics: Record<string, MetricDetail>;
  shap: Array<{ feature: string; importance: number; displayName: string }>;
  ale: Record<string, Array<{ x: number; y: number }>>;
  uploaded_by?: string;
}

const API_BASE_URL = '/api';

const PIPELINE_STAGES = [
  { id: 1, title: 'Validasi Dataset', desc: 'Verifikasi kolom Kabupaten, Tahun, NDVI, LST, Rainfall, Produktivitas' },
  { id: 2, title: 'Preprocessing & Split Data', desc: 'Pembersihan nilai kosong dan pemisahan data 80% train / 20% test' },
  { id: 3, title: 'Training XGBoost & Random Forest', desc: 'Melatih kedua arsitektur pohon keputusan ensemble secara paralel' },
  { id: 4, title: 'Evaluasi Metrik Akurasi', desc: 'Menghitung R², RMSE, MAE dan menetapkan model terbaik' },
  { id: 5, title: 'Analisis SHAP & Respon ALE', desc: 'Dekomposisi kontribusi atribusi fitur dan kurva efek marjinal' },
  { id: 6, title: 'Penyimpanan Model & Metadata', desc: 'Menyimpan model ke storage dan memperbarui basis data' },
];

export const AdminPage: React.FC = () => {
  const { user, login } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@sipadi.id';

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  // Admin Auth state
  const [token, setToken] = useState<string>(() => localStorage.getItem('sipadi_token') || localStorage.getItem('sipadi_admin_token') || '');
  const [email, setEmail] = useState('admin@sipadi.id');
  const [password, setPassword] = useState('admin123');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLatestRun = async (showReloadAnimation = false) => {
    try {
      if (showReloadAnimation) {
        setIsReloading(true);
      }
      const response = await fetch(`${API_BASE_URL}/runs/latest`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.run) {
        setResult(data.run);
        if (showReloadAnimation) {
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 3500);
        }
      }
    } catch {
      // Backend offline fallback handled gracefully
    } finally {
      if (showReloadAnimation) {
        setTimeout(() => setIsReloading(false), 600);
      }
    }
  };

  useEffect(() => {
    loadLatestRun();
    if (isAdmin) {
      const activeToken = localStorage.getItem('sipadi_token') || localStorage.getItem('sipadi_admin_token') || 'demo-admin-token';
      setToken(activeToken);
    }
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const success = await login(email, password);
      if (!success) {
        throw new Error('Gagal melakukan autentikasi akun.');
      }
      const savedToken = localStorage.getItem('sipadi_token') || localStorage.getItem('sipadi_admin_token') || 'demo-admin-token';
      setToken(savedToken);
      setSuccessMsg('Autentikasi admin berhasil. Hak akses unggah data dan pelatihan model terbuka.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Koneksi ke server gagal.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUploadAndTrain = async () => {
    if (!file) {
      setError('Harap pilih berkas dataset CSV atau Excel terlebih dahulu.');
      return;
    }
    if (!token) {
      setError('Silakan login sebagai administrator terlebih dahulu sebelum mengunggah dataset.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setActiveStep(1);

    // Simulate pipeline stage progression while server computes
    stepIntervalRef.current = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 900);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/datasets/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Pelatihan model gagal diproses oleh server.');
      }

      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      setActiveStep(6);

      // Trigger reload animation on results panel
      setIsReloading(true);
      setTimeout(() => {
        setResult(data);
        setIsReloading(false);
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 4000);
      }, 700);

      setSuccessMsg(`Pelatihan model berhasil! Model terbaik terpilih: ${data.best_model} dari ${data.rows} baris data valid.`);
      setFile(null);
    } catch (err) {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      setError(err instanceof Error ? err.message : 'Gagal menghubungi server FastAPI backend.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setActiveStep(0);
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Title & Scope Header */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#164A32]">
            UPLOAD DATA &amp; PELATIHAN MODEL
          </h1>
          <span className="ml-auto text-xs font-bold text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-3 py-1 rounded-full hidden sm:inline">
            Automated ML Pipeline
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#5F7061] max-w-3xl">
          Unggah dataset agroklimat terstandardisasi (CSV atau Excel), jalankan validasi dataset otomatis, 
          latih model XGBoost dan Random Forest secara paralel, dan terbitkan model terbaik ke model storage.
        </p>
      </section>

      {/* Access Restriction Notice if logged in as regular user */}
      {user && !isAdmin && (
        <section className="bg-[#FAF7F0] border border-[#D8E3CC] rounded-2xl p-8 shadow-xs text-center max-w-lg mx-auto flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#164A32]">Halaman Khusus Administrator</h2>
          <p className="text-xs text-[#5F7061] max-w-sm">
            Anda saat ini masuk sebagai <strong>{user.name}</strong> ({user.role || 'Pengguna'}). Hak akses untuk mengunggah dataset dan melatih model machine learning hanya diberikan kepada akun Administrator.
          </p>
          <div className="pt-2 flex flex-col gap-2 w-full">
            <button
              onClick={async () => {
                await login('admin@sipadi.id', 'admin123');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#287A4A] text-white text-xs font-bold hover:bg-[#164A32] transition-colors cursor-pointer"
            >
              Beralih ke Akun Administrator (admin@sipadi.id)
            </button>
          </div>
        </section>
      )}

      {/* Admin Login Box (if unauthenticated) */}
      {!user && (
        <section className="bg-[#FAF7F0] border border-[#D8E3CC] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4 text-[#164A32]">
              <div className="p-3 bg-[#EAF2E1] rounded-2xl">
                <Lock className="w-6 h-6 text-[#287A4A]" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Autentikasi Administrator</h2>
                <p className="text-xs text-[#5F7061]">Masukkan kredensial admin untuk membuka akses pelatihan model.</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#164A32] mb-1">Email Administrator</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E3CC] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#287A4A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#164A32] mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E3CC] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#287A4A]"
                  required
                />
                <p className="text-[11px] text-[#5F7061] mt-1">
                  Default kredensial: <span className="font-mono text-[#287A4A]">admin@sipadi.id</span> / <span className="font-mono text-[#287A4A]">admin123</span>
                </p>
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 bg-[#287A4A] hover:bg-[#164A32] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? 'Memverifikasi...' : 'Masuk sebagai Admin'}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Main Workspace (Enabled once authenticated as admin) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-[#FAF7F0] border border-[#D8E3CC] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#D8E3CC] pb-3">
                <div className="flex items-center gap-2 text-[#164A32] font-bold text-sm">
                  <Database className="w-4 h-4 text-[#287A4A]" />
                  <span>Unggah Dataset Baru</span>
                </div>
                <span className="text-[11px] font-semibold text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-2.5 py-0.5 rounded-full">
                  CSV / Excel
                </span>
              </div>

              {/* Required Columns Notice */}
              <div className="p-3.5 bg-white border border-[#E0ECD1] rounded-xl flex flex-col gap-1.5">
                <p className="text-xs font-bold text-[#164A32] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#287A4A]" />
                  Kolom Wajib Terstandardisasi:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Kabupaten', 'Tahun', 'Bulan', 'NDVI', 'LST', 'Rainfall', 'Produktivitas'].map((col) => (
                    <span
                      key={col}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#EDF4E5] text-[#164A32] font-semibold border border-[#D8E3CC]"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dropzone */}
              <label className="border-2 border-dashed border-[#C8DDAF] hover:border-[#287A4A] rounded-xl p-6 text-center cursor-pointer bg-white hover:bg-[#F4F8EE] transition-all flex flex-col items-center justify-center gap-2">
                <UploadCloud className="w-9 h-9 text-[#287A4A]" />
                <span className="text-sm font-bold text-[#164A32]">
                  {file ? file.name : 'Pilih Berkas CSV atau Excel'}
                </span>
                <span className="text-xs text-[#5F7061]">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Klik untuk mencari berkas di perangkat Anda'}
                </span>
                <input
                  className="hidden"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              {/* Alerts */}
              {error && (
                <div className="flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2.5 text-xs text-green-800 bg-green-50 border border-green-200 p-3.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#287A4A]" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                disabled={loading || !file || !token}
                onClick={handleUploadAndTrain}
                className="w-full py-3 px-4 rounded-xl bg-[#287A4A] hover:bg-[#164A32] text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Mengeksekusi Pipeline ML...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>Validasi &amp; Latih Model</span>
                  </>
                )}
              </button>

              {/* Animated Pipeline Stage Indicator */}
              {(loading || activeStep > 0) && (
                <div className="mt-1 pt-4 border-t border-[#D8E3CC] flex flex-col gap-2.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#164A32] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#287A4A]" />
                      Tahap Pipeline Sedang Berjalan:
                    </span>
                    <span className="text-[11px] font-bold text-[#287A4A] bg-[#EDF4E5] px-2 py-0.5 rounded-md">
                      Tahap {activeStep} / {PIPELINE_STAGES.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-[#D8E3CC]">
                    {PIPELINE_STAGES.map((stage) => {
                      const isCompleted = activeStep > stage.id || (activeStep === 6 && stage.id === 6);
                      const isCurrent = activeStep === stage.id && loading;

                      return (
                        <div
                          key={stage.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg transition-all ${
                            isCurrent
                              ? 'bg-[#EDF4E5] border border-[#C8DDAF]'
                              : isCompleted
                              ? 'opacity-85'
                              : 'opacity-40'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <div className="w-5 h-5 rounded-full bg-[#287A4A] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : isCurrent ? (
                              <div className="w-5 h-5 rounded-full bg-[#EDF4E5] border-2 border-[#287A4A] flex items-center justify-center animate-pulse">
                                <Loader2 className="w-3 h-3 text-[#287A4A] animate-spin" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#F0EADB] text-[#5F7061] text-[10px] font-bold flex items-center justify-center">
                                {stage.id}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span
                              className={`text-xs ${
                                isCurrent
                                  ? 'font-extrabold text-[#164A32]'
                                  : isCompleted
                                  ? 'font-bold text-[#164A32]'
                                  : 'font-medium text-[#5F7061]'
                              }`}
                            >
                              {stage.title}
                            </span>
                            <span className="text-[10px] text-[#5F7061] leading-tight">
                              {stage.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Column (7 cols) with Dynamic Reload Animation */}
          <div className="lg:col-span-7">
            <div
              className={`bg-[#FAF7F0] border rounded-2xl p-5 sm:p-6 shadow-xs min-h-[460px] flex flex-col relative transition-all duration-500 ${
                isReloading
                  ? 'border-[#287A4A] opacity-60 scale-[0.99]'
                  : justUpdated
                  ? 'border-[#287A4A] ring-2 ring-[#287A4A]/30 shadow-md'
                  : 'border-[#D8E3CC]'
              }`}
            >
              {/* Reloading Overlay Spinner */}
              {isReloading && (
                <div className="absolute inset-0 bg-[#FAF7F0]/85 backdrop-blur-[2px] rounded-2xl z-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-[#287A4A] animate-spin" />
                  <span className="text-xs font-bold text-[#164A32] tracking-wide">
                    Memperbarui data &amp; metrik model terbaru...
                  </span>
                </div>
              )}

              {!result ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#5F7061]">
                  <FileSpreadsheet className="w-12 h-12 text-[#287A4A]/40 mb-3" />
                  <p className="text-sm font-semibold text-[#164A32]">Belum ada hasil pelatihan model.</p>
                  <p className="text-xs text-[#5F7061] mt-1 max-w-sm">
                    Unggah dataset di panel sebelah kiri untuk memulai pipeline validasi, training XGBoost vs Random Forest, dan komputasi XAI.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-fade-in">
                  {/* Result Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#D8E3CC] flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-2.5 py-0.5 rounded-full">
                          Model Aktif Terdaftar
                        </span>
                        {justUpdated && (
                          <span className="text-[10px] font-bold text-white bg-[#287A4A] px-2 py-0.5 rounded-full animate-bounce">
                            Baru Saja Diperbarui
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-extrabold text-[#164A32] mt-1 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#287A4A]" />
                        {result.filename}
                      </h2>
                      <p className="text-xs text-[#5F7061]">
                        ID Run: <span className="font-mono">{result.id.slice(0, 12)}...</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-[#5F7061]">Data Valid</span>
                        <p className="text-lg font-black text-[#164A32]">
                          {result.rows} <span className="text-xs font-normal">baris</span>
                        </p>
                      </div>
                      <button
                        onClick={() => loadLatestRun(true)}
                        title="Muat ulang metrik model"
                        className="p-2 rounded-xl bg-white border border-[#D8E3CC] text-[#287A4A] hover:bg-[#EDF4E5] transition-all cursor-pointer shadow-2xs"
                      >
                        <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Best Model Badge */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#EDF4E5] to-[#F7FAF2] border border-[#C8DDAF] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#287A4A] text-white rounded-xl shadow-xs">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-[#5F7061] font-semibold">Model Terbaik Terpilih</span>
                        <h3 className="text-lg font-black text-[#164A32]">{result.best_model}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#5F7061] font-semibold">R² Pengujian</span>
                      <p className="text-xl font-black text-[#287A4A]">
                        {result.metrics[result.best_model]?.r2.toFixed(4) || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Comparative Table */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#287A4A]" />
                      Perbandingan Metrik Evaluasi Model
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-[#D8E3CC] bg-white">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#EDF4E5] text-left text-[#164A32] border-b border-[#D8E3CC]">
                            <th className="py-2.5 px-3.5 font-bold">Algoritma</th>
                            <th className="py-2.5 px-3.5 font-bold">R² (Koef. Determ.)</th>
                            <th className="py-2.5 px-3.5 font-bold">RMSE (ku/ha)</th>
                            <th className="py-2.5 px-3.5 font-bold">MAE (ku/ha)</th>
                            <th className="py-2.5 px-3.5 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.metrics).map(([modelName, metric]) => {
                            const isWinner = modelName === result.best_model;
                            return (
                              <tr
                                key={modelName}
                                className={`border-b last:border-b-0 border-[#E8EFE0] ${
                                  isWinner ? 'bg-[#EDF4E5]/50 font-semibold' : ''
                                }`}
                              >
                                <td className="py-2.5 px-3.5 text-[#164A32] font-bold">{modelName}</td>
                                <td className="py-2.5 px-3.5 font-mono">{metric.r2.toFixed(4)}</td>
                                <td className="py-2.5 px-3.5 font-mono">{metric.rmse.toFixed(4)}</td>
                                <td className="py-2.5 px-3.5 font-mono">{metric.mae.toFixed(4)}</td>
                                <td className="py-2.5 px-3.5">
                                  {isWinner ? (
                                    <span className="px-2 py-0.5 rounded-full bg-[#287A4A] text-white text-[10px] font-bold shadow-2xs">
                                      Terpilih (Juara)
                                    </span>
                                  ) : (
                                    <span className="text-[#5F7061] text-[10px] font-medium">Evaluated</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SHAP Feature Importance */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#164A32] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#287A4A]" />
                      Kontribusi Fitur Terpenting (SHAP Analysis)
                    </h3>
                    <div className="flex flex-col gap-2.5 bg-white p-4 rounded-xl border border-[#D8E3CC]">
                      {result.shap.map((item) => {
                        const maxImportance = Math.max(...result.shap.map((x) => x.importance)) || 1;
                        const percentage = Math.max(5, (item.importance / maxImportance) * 100);
                        return (
                          <div key={item.feature} className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-[#164A32]">{item.displayName || item.feature}</span>
                              <span className="font-mono text-[#287A4A] font-bold">
                                {item.importance.toFixed(4)}
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-[#EDF4E5] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#287A4A] to-[#369C5F] rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
