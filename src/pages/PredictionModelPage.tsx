import React, { useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { apiService } from '../services/apiService';
import { PredictionInputPayload, PredictionResult } from '../types';
import { 
  Cpu, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Sliders, 
  Database, 
  History, 
  Save, 
  Wheat, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle 
} from 'lucide-react';

interface HistoryItem {
  id: string;
  timestamp: string;
  region: string;
  variety: string;
  ndvi: number;
  lst: number;
  rainfall: number;
  predictedYield: number;
  status: string;
}

export const PredictionModelPage: React.FC = () => {
  const { currentRegionName, selectedRegion } = useFilter();

  // Form State
  const [fieldName, setFieldName] = useState('Lahan Jatiluwih - Blok 1A');
  const [variety, setVariety] = useState('Beras Merah Jatiluwih');
  const [elevationM, setElevationM] = useState<number>(650);
  const [ndvi, setNdvi] = useState<number>(0.68);
  const [lst, setLst] = useState<number>(27.5);
  const [rainfall, setRainfall] = useState<number>(1820);

  // Execution & Result State
  const [isInferencing, setIsInferencing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('sipadi_prediction_history');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'hist-1',
            timestamp: '2026-10-26 14:20',
            region: 'Tabanan',
            variety: 'Beras Merah Jatiluwih',
            ndvi: 0.72,
            lst: 26.8,
            rainfall: 1950,
            predictedYield: 5.48,
            status: 'Optimal',
          },
          {
            id: 'hist-2',
            timestamp: '2026-10-25 09:15',
            region: 'Badung',
            variety: 'Inpari 32',
            ndvi: 0.58,
            lst: 32.2,
            rainfall: 1400,
            predictedYield: 4.42,
            status: 'Waspada',
          },
        ];
  });

  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const handleRunInference = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInferencing(true);

    const payload: PredictionInputPayload = {
      regionId: selectedRegion,
      fieldName,
      year: 2026,
      month: 10,
      ndvi,
      lst,
      rainfall,
      variety,
      elevationM,
    };

    const res = await apiService.predictYield(payload);
    setResult(res);
    setIsInferencing(false);
  };

  const handleSaveToDatabase = () => {
    if (!result) return;

    const newItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      region: currentRegionName,
      variety,
      ndvi,
      lst,
      rainfall,
      predictedYield: result.predictedYieldTonHa,
      status: result.statusCategory,
    };

    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('sipadi_prediction_history', JSON.stringify(updated));

    setSavedNotification('Prediksi berhasil dicatat ke basis data simulasi!');
    setTimeout(() => setSavedNotification(null), 3500);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Title & Scope */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-[#287A4A] ring-4 ring-[#C8DDAF]/50" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#164A32]">
            SIMULASI PREDIKSI MODEL MACHINE LEARNING
          </h1>
          <span className="ml-auto text-xs font-bold text-[#287A4A] bg-[#EDF4E5] border border-[#C8DDAF] px-3 py-1 rounded-full hidden sm:inline">
            XGBoost Inference Lab
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#5F7061] max-w-3xl">
          Modul penerapan input parameter agroklimat dan pengujian inferensi model Machine Learning
          secara langsung. Siap dihubungkan ke backend Python FastAPI dan database PostgreSQL di tahap berikutnya.
        </p>
      </section>

      {/* Main Grid: Form Inputs (Left) and Live Inference Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Parameters (6 cols) */}
        <div className="lg:col-span-6 bg-[#FFFDF7] p-5 sm:p-6 rounded-2xl border border-[#D8E3CC] shadow-xs flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#D8E3CC] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#287A4A]" />
              <h3 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
                Parameter Input Lingkungan &amp; Agroklimat
              </h3>
            </div>
            <span className="text-[10px] text-[#287A4A] bg-[#EDF4E5] px-2.5 py-0.5 rounded-full font-bold">
              Formulir Siap API
            </span>
          </div>

          <form onSubmit={handleRunInference} className="flex flex-col gap-4">
            {/* Lokasi Lahan & Varietas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#164A32]">Nama Petak Lahan</label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] text-xs text-[#164A32] focus:bg-white focus:border-[#287A4A] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#164A32]">Varietas Tanaman Padi</label>
                <select
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] text-xs text-[#164A32] focus:bg-white focus:border-[#287A4A] transition-all cursor-pointer"
                >
                  <option value="Beras Merah Jatiluwih">Beras Merah Cempaka</option>
                  <option value="Ciherang Lokal">Ciherang Lokal</option>
                  <option value="Inpari 32">Inpari 32 HDB</option>
                  <option value="Inpari 42 Agritan">Inpari 42 Agritan GSR</option>
                  <option value="Beras Hitam Bali">Beras Hitam</option>
                </select>
              </div>
            </div>

            {/* Slider 1: NDVI */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#164A32] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#55A85F]" />
                  <span>NDVI (Indeks Klorofil Kanopi)</span>
                </label>
                <strong className="text-sm font-extrabold text-[#287A4A]">{ndvi.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.88"
                step="0.02"
                value={ndvi}
                onChange={(e) => setNdvi(parseFloat(e.target.value))}
                className="w-full accent-[#287A4A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5F7061]">
                <span>0.20 (Jarang/Tunas)</span>
                <span>0.65 (Sehat)</span>
                <span>0.88 (Puncak Lebat)</span>
              </div>
            </div>

            {/* Slider 2: LST Temperature */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#7E6A21] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C4A83F]" />
                  <span>Suhu Permukaan Tanah (LST)</span>
                </label>
                <strong className="text-sm font-extrabold text-[#7E6A21]">{lst.toFixed(1)} °C</strong>
              </div>
              <input
                type="range"
                min="20.0"
                max="36.0"
                step="0.5"
                value={lst}
                onChange={(e) => setLst(parseFloat(e.target.value))}
                className="w-full accent-[#C4A83F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5F7061]">
                <span>20.0 °C (Sejuk)</span>
                <span>27.0 °C (Optimal)</span>
                <span>36.0 °C (Stres Termal)</span>
              </div>
            </div>

            {/* Slider 3: Curah Hujan */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1E5D77] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4D9FC1]" />
                  <span>Presipitasi Kumulatif Siklus (CHIRPS)</span>
                </label>
                <strong className="text-sm font-extrabold text-[#1E5D77]">{rainfall} mm</strong>
              </div>
              <input
                type="range"
                min="600"
                max="3000"
                step="50"
                value={rainfall}
                onChange={(e) => setRainfall(parseInt(e.target.value))}
                className="w-full accent-[#4D9FC1] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5F7061]">
                <span>600 mm (Kering)</span>
                <span>1.800 mm (Adekuat)</span>
                <span>3.000 mm (Ekstrem Basah)</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isInferencing}
              className="mt-2 w-full py-3.5 rounded-xl bg-[#287A4A] hover:bg-[#164A32] text-white text-xs font-extrabold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isInferencing ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Mengeksekusi Model XGBoost Regressor...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Jalankan Prediksi AI &amp; Evaluasi SHAP</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output: Inference Results & SHAP Decomposition (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {result ? (
            <div className="bg-[#FAF7F0] p-5 sm:p-6 rounded-2xl border border-[#D8E3CC] shadow-xs flex flex-col gap-5 animate-fade-in">
              {/* Result Header */}
              <div className="flex items-center justify-between border-b border-[#D8E3CC] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#287A4A]" />
                  <h3 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
                    Hasil Prediksi Model Machine Learning
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#EDF4E5] text-[#287A4A] border border-[#C8DDAF]">
                  Kategori {result.statusCategory}
                </span>
              </div>

              {/* Main Score Board */}
              <div className="p-5 rounded-2xl bg-[#164A32] text-white flex items-center justify-between shadow-sm relative overflow-hidden border border-[#287A4A]">
                <div className="flex flex-col gap-1 z-10">
                  <span className="text-[11px] font-bold text-[#C8DDAF] uppercase">
                    Estimasi Hasil Panen Padi
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {result.predictedYieldTonHa}
                    </span>
                    <span className="text-sm font-bold text-[#C8DDAF]">ton / hektar</span>
                  </div>
                  <span className="text-[10px] text-[#A2C79A] mt-1">
                    Tingkat Keyakinan Model (Confidence): {(result.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#287A4A] flex items-center justify-center text-white z-10">
                  <Wheat className="w-6 h-6 text-[#C8DDAF]" />
                </div>
              </div>

              {/* Real-time SHAP Breakdown for This Input */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold text-[#164A32]">
                  Dekomposisi Nilai SHAP pada Input Ini:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {result.shapContribution.map((sc, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white border border-[#D8E3CC] flex items-center justify-between"
                    >
                      <span className="text-[#5F7061] text-[11px] truncate">{sc.feature}:</span>
                      <strong
                        className={`text-xs ${
                          sc.impact >= 0 ? 'text-[#4D9568]' : 'text-[#C96F5F]'
                        }`}
                      >
                        {sc.impact >= 0 ? `+${sc.impact}` : sc.impact} t/ha
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agronomic Recommendations */}
              <div className="p-4 rounded-xl bg-white border border-[#D8E3CC] flex flex-col gap-2 text-xs">
                <strong className="text-[#164A32] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#287A4A]" />
                  <span>Rekomendasi Agronomis Sistem Cerdas:</span>
                </strong>
                <ul className="list-disc list-inside space-y-1 text-[#5F7061] text-[11px]">
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Action: Save to Simulated Database */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleSaveToDatabase}
                  className="px-4 py-2.5 rounded-xl bg-[#164A32] text-white text-xs font-bold hover:bg-[#287A4A] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan ke Database Riwayat</span>
                </button>
                {savedNotification && (
                  <span className="text-xs font-bold text-[#287A4A] animate-fade-in">
                    {savedNotification}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF7F0] p-8 rounded-2xl border border-[#D8E3CC] border-dashed flex flex-col items-center justify-center text-center gap-3 min-h-[380px]">
              <div className="w-12 h-12 rounded-2xl bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                <Cpu className="w-6 h-6 text-[#287A4A]" />
              </div>
              <h4 className="text-sm font-extrabold text-[#164A32]">Menunggu Eksekusi Parameter</h4>
              <p className="text-xs text-[#5F7061] max-w-sm">
                Atur slider parameter lingkungan di sebelah kiri, lalu tekan tombol{' '}
                <strong>&quot;Jalankan Prediksi AI&quot;</strong> untuk melihat estimasi hasil panen dan
                dekomposisi nilai SHAP.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Table (Simulated Database Table) */}
      <section className="bg-[#FAF7F0] p-5 sm:p-6 rounded-2xl border border-[#D8E3CC] shadow-xs flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between border-b border-[#D8E3CC] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#287A4A]" />
            <h3 className="text-xs font-extrabold text-[#164A32] uppercase tracking-wider">
              Tabel Riwayat Prediksi (Simulasi Persistensi Database)
            </h3>
          </div>
          <span className="text-[11px] text-[#5F7061]">
            Total {history.length} Catatan Tersimpan di Storage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D8E3CC] text-[#5F7061] text-[11px] font-bold">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Wilayah</th>
                <th className="py-2.5 px-3">Varietas</th>
                <th className="py-2.5 px-3">NDVI</th>
                <th className="py-2.5 px-3">LST (°C)</th>
                <th className="py-2.5 px-3">Curah Hujan</th>
                <th className="py-2.5 px-3">Hasil Prediksi</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E3CC]/60 font-medium">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-white/60 transition-colors">
                  <td className="py-2.5 px-3 text-[#5F7061]">{row.timestamp}</td>
                  <td className="py-2.5 px-3 font-bold text-[#164A32]">{row.region}</td>
                  <td className="py-2.5 px-3 text-[#164A32]">{row.variety}</td>
                  <td className="py-2.5 px-3 text-[#287A4A] font-bold">{row.ndvi}</td>
                  <td className="py-2.5 px-3 text-[#7E6A21]">{row.lst} °C</td>
                  <td className="py-2.5 px-3 text-[#1E5D77]">{row.rainfall} mm</td>
                  <td className="py-2.5 px-3 font-extrabold text-[#164A32]">
                    {row.predictedYield} t/ha
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        row.status === 'Optimal' || row.status === 'Tinggi'
                          ? 'bg-[#EDF4E5] text-[#287A4A]'
                          : 'bg-[#FFDAD6] text-[#C96F5F]'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
