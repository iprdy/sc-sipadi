import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  Satellite, 
  Layers, 
  Cpu, 
  Network, 
  BarChart3, 
  MapPin 
} from 'lucide-react';

export const Homepage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleDashboardAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard/monitoring');
    } else {
      navigate('/login');
    }
  };

  const workflowSteps = [
    {
      step: '01',
      title: 'Akuisisi Data Satelit',
      desc: 'Pengambilan citra multispektral Sentinel-2 MSI (resolusi 10m) untuk indeks vegetasi kanopi (NDVI) dan presipitasi curah hujan harian CHIRPS v2.0.',
      icon: Satellite,
      badge: 'Remote Sensing',
    },
    {
      step: '02',
      title: 'Harmonisasi Spasial Lahan',
      desc: 'Penyelarasan batas petak sawah, elevasi kontur topografi DEM, dan suhu kinetik permukaan tanah (Land Surface Temperature).',
      icon: Layers,
      badge: 'Geospatial Data',
    },
    {
      step: '03',
      title: 'Komputasi Prediksi XGBoost',
      desc: 'Model ensemble gradient boosting terlatih untuk memproyeksikan estimasi bobot panen padi (ton/ha) sebelum masa panen tiba.',
      icon: Cpu,
      badge: 'Machine Learning',
    },
    {
      step: '04',
      title: 'Explainable AI (SHAP & ALE)',
      desc: 'Dekomposisi kontribusi setiap variabel agroklimat menggunakan SHAP TreeExplainer dan kurva respon non-linear ALE tanpa efek kotak hitam.',
      icon: Network,
      badge: 'XAI Framework',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F2E6] text-[#164A32] flex flex-col font-sans selection:bg-[#C8DDAF]">
      <PublicNavbar />

      <main className="w-full pt-20 flex-1">
        {/* SECTION 1: HERO VIEWPORT */}
        <section id="hero" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex flex-col gap-6 mb-10">
            {/* Main Headline & Subtitle */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#164A32] tracking-tight leading-[1.15]">
                  Pantau Produktivitas Tanaman, Pahami Faktor Lingkungannya.
                </h1>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-4">
                <p className="text-sm sm:text-base text-[#5F7061] leading-relaxed">
                  Mengintegrasikan citra satelit multispektral, dinamika iklim lokal, dan model
                  prediktif XGBoost yang terinterpretasi penuh dengan SHAP &amp; ALE.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleDashboardAction}
                    className="px-5 py-3 rounded-xl bg-[#287A4A] text-white text-xs font-bold hover:bg-[#164A32] transition-all shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
                  >
                    <span>Mulai Eksplorasi Monitoring</span>
                  </button>
                  <a
                    href="#alur-kerja"
                    className="px-4 py-3 rounded-xl bg-white border border-[#D8E3CC] text-[#164A32] text-xs font-bold hover:bg-[#EDF4E5] transition-all shadow-xs flex items-center gap-2"
                  >
                    <Network className="w-4 h-4 text-[#287A4A]" />
                    <span>Pelajari Alur Kerja</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Hero Visual Showcase Banner */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-[#EDF4E5] border border-[#C8DDAF]">
            <div
              className="relative w-full h-[360px] sm:h-[460px] lg:h-[500px] bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1600&q=80')`,
              }}
            >
              {/* Ambient Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#164A32]/90 via-[#164A32]/35 to-transparent" />

              {/* Orbit HUD Sensor Marker (Top Right) */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-md flex items-center gap-3 border border-white/60">
                <div className="w-9 h-9 rounded-lg bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                  <Satellite className="w-5 h-5 text-[#287A4A]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#5F7061] uppercase tracking-wider">
                    Sensor Orbit Terhubung
                  </span>
                  <span className="text-xs font-extrabold text-[#164A32]">
                    Sentinel-2 MSI • CHIRPS v2.0
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#55A85F] animate-pulse ml-1" />
              </div>

              {/* Geographic Marker (Top Left) */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-md flex items-center gap-2.5 border border-white/60">
                <MapPin className="w-4 h-4 text-[#287A4A]" />
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-[#164A32]">
                    Lahan Sawah Jatiluwih, Tabanan
                  </span>
                  <span className="text-[10px] text-[#5F7061]">
                    8°22′08″S 115°07′52″E • Elevasi 700 mdpl
                  </span>
                </div>
              </div>

              {/* Bottom Quick Metric Telemetry Strips */}
              <div id="indikator" className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/50 flex flex-col shadow-sm">
                  <span className="text-[10px] font-bold text-[#5F7061] uppercase">Produktivitas Sawah</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-[#164A32]">5.21</span>
                    <span className="text-xs font-bold text-[#287A4A]">ton/ha</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#55A85F] mt-1">Siklus Optimal (+8.4%)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/50 flex flex-col shadow-sm">
                  <span className="text-[10px] font-bold text-[#5F7061] uppercase">NDVI Vegetasi</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-[#164A32]">0.68</span>
                    <span className="text-xs font-bold text-[#5F7061]">indeks</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#287A4A] mt-1">Kanopi Lebat &amp; Sehat</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/50 flex flex-col shadow-sm">
                  <span className="text-[10px] font-bold text-[#5F7061] uppercase">Suhu Permukaan LST</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-[#7E6A21]">27.4</span>
                    <span className="text-xs font-bold text-[#7E6A21]">°C</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#C4A83F] mt-1">Rentang Fisiologis Ideal</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/50 flex flex-col shadow-sm">
                  <span className="text-[10px] font-bold text-[#5F7061] uppercase">Curah Hujan Siklus</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-[#1E5D77]">1.820</span>
                    <span className="text-xs font-bold text-[#4D9FC1]">mm</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#4D9FC1] mt-1">Irigasi Pertanian Tercukupi</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WORKFLOW PIPELINE */}
        <section id="alur-kerja" className="w-full bg-[#FAF7F0] border-y border-[#D8E3CC] py-16 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
            <div className="flex flex-col gap-2 max-w-2xl">
              <span className="text-xs font-extrabold text-[#287A4A] uppercase tracking-wider">
                Alur Kerja Platform SIPADI
              </span>
              <h2 className="text-3xl font-extrabold text-[#164A32] tracking-tight">
                Dari Observasi Satelit Menjadi Rekomendasi Terpercaya
              </h2>
              <p className="text-sm text-[#5F7061]">
                Empat tahapan sistem cerdas yang mengubah data penginderaan jauh menjadi
                estimasi hasil panen dan analisis faktor determinan yang transparan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="p-6 rounded-2xl bg-white border border-[#D8E3CC] shadow-xs flex flex-col justify-between hover:border-[#287A4A] transition-all group"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-[#C8DDAF] group-hover:text-[#287A4A] transition-colors">
                          {step.step}
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#EDF4E5] text-[#287A4A] border border-[#C8DDAF]">
                          {step.badge}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                        <Icon className="w-5 h-5 text-[#287A4A]" />
                      </div>
                      <h3 className="text-base font-extrabold text-[#164A32]">{step.title}</h3>
                      <p className="text-xs text-[#5F7061] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: METODOLOGI AI */}
        <section id="metodologi" className="w-full py-16 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2 max-w-2xl">
              <span className="text-xs font-extrabold text-[#287A4A] uppercase tracking-wider">
                Metodologi AI Terjelaskan (Explainable AI)
              </span>
              <h2 className="text-3xl font-extrabold text-[#164A32] tracking-tight">
                Membongkar Kotak Hitam Model Machine Learning
              </h2>
              <p className="text-sm text-[#5F7061]">
                SIPADI mengintegrasikan dua metode interpretasi tingkat lanjut agar pengguna mengetahui
                alasan di balik setiap angka prediksi yang dihasilkan:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#FFFDF7] border border-[#D8E3CC] shadow-xs flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                    <Network className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#164A32]">SHAP (Shapley Additive exPlanations)</h3>
                </div>
                <p className="text-xs text-[#5F7061] leading-relaxed">
                  Mengukur kontribusi marjinal setiap fitur terhadap deviasi nilai rata-rata panen.
                  Membantu mengidentifikasi faktor pendorong positif (seperti NDVI optimal) maupun
                  faktor pembatas negatif (seperti suhu ekstrem atau defisit air).
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#FFFDF7] border border-[#D8E3CC] shadow-xs flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EDF4E5] flex items-center justify-center text-[#287A4A]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#164A32]">ALE (Accumulated Local Effects)</h3>
                </div>
                <p className="text-xs text-[#5F7061] leading-relaxed">
                  Menggambarkan kurva respon non-linear dari model prediksi terhadap perubahan nilai variabel
                  lingkungan secara terisolasi tanpa terdistorsi oleh korelasi antar-fitur agroklimat.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: CTA MENUJU DASHBOARD */}
        <section id="tentang" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex flex-col gap-8 scroll-mt-20">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#164A32] text-white flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl border border-[#287A4A]">
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 rounded-full bg-[#287A4A]/30 blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-3 max-w-2xl relative z-10">
              <span className="text-xs font-bold text-[#C8DDAF] uppercase tracking-wider">
                Akses Dashboard Analisis SIPADI
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Mulai Eksplorasi Data Pemantauan &amp; Prediksi Agroklimat
              </h2>
              <p className="text-sm text-[#A2C79A] leading-relaxed">
                Untuk menjaga privasi dan keteraturan data operasional, silakan masuk dengan akun terdaftar
                atau coba akun demo penyuluh pertanian yang telah disediakan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0 w-full lg:w-auto">
              <button
                onClick={handleDashboardAction}
                className="px-6 py-3.5 rounded-xl bg-[#55A85F] text-[#164A32] text-sm font-extrabold hover:bg-white transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Buka Dashboard</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#164A32] text-white border-t border-[#287A4A]/60 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#A2C79A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#287A4A] flex items-center justify-center text-white">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm">SIPADI</span>
              <span>Sistem Prediksi dan Interpretasi Produktivitas Tanaman Padi</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#hero" className="hover:text-white transition-colors">
              Beranda
            </a>
            <a href="#indikator" className="hover:text-white transition-colors">
              Indikator
            </a>
            <a href="#alur-kerja" className="hover:text-white transition-colors">
              Alur Kerja
            </a>
            <a href="#metodologi" className="hover:text-white transition-colors">
              Metodologi
            </a>
          </div>

          <p className="text-[11px] text-[#A2C79A]/80">
            © 2026 SIPADI. Sistem Informasi Produktivitas Padi Berbasis AI.
          </p>
        </div>
      </footer>
    </div>
  );
};
