import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, 
  BarChart2, 
  Clock, 
  ShieldCheck, 
  FileDown,
  Plus,
  Activity,
  Layers,
  Sprout,
  Sun,
  CloudRain,
  Mountain
} from 'lucide-react';

/* ============================================================
   Custom Hook: Scroll Reveal using Intersection Observer
   ============================================================ */
function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.1 }
) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView] as const;
}

/* ============================================================
   Component: Animated Reveal on Scroll (Subtle & Smooth)
   ============================================================ */
interface AnimatedRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

const AnimatedReveal: React.FC<AnimatedRevealProps> = ({
  children,
  className = '',
  delayMs = 0,
  direction = 'up'
}) => {
  const [ref, inView] = useInView({ threshold: 0.08 });

  const getTransformClasses = () => {
    if (inView) {
      return 'opacity-100 translate-y-0 translate-x-0 scale-100';
    }
    switch (direction) {
      case 'up':
        return 'opacity-0 translate-y-8';
      case 'down':
        return 'opacity-0 -translate-y-8';
      case 'left':
        return 'opacity-0 translate-x-8';
      case 'right':
        return 'opacity-0 -translate-x-8';
      default:
        return 'opacity-0';
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${getTransformClasses()} ${className}`}
    >
      {children}
    </div>
  );
};

/* ============================================================
   Component: Animated Counter (Count up on view)
   ============================================================ */
interface AnimatedCounterProps {
  end: number;
  decimals?: number;
  thousandSeparator?: boolean;
  durationMs?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  decimals = 0,
  thousandSeparator = false,
  durationMs = 1400
}) => {
  const [value, setValue] = useState(0);
  const [ref, inView] = useInView({ threshold: 0.1 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      
      // Smooth ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setValue(easedProgress * end);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [inView, end, durationMs]);

  const formatNumber = (num: number) => {
    if (thousandSeparator) {
      const rounded = Math.round(num);
      return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');
    if (parts.length > 1) {
      return `${parts[0]},${parts[1]}`;
    }
    return parts[0];
  };

  return <span ref={ref}>{formatNumber(value)}</span>;
};

/* ============================================================
   Component: Polished Single-Open Mutually Exclusive FAQ Item
   ============================================================ */
interface FAQItemProps {
  number: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ number, question, answer, isOpen, onToggle }) => {
  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen 
          ? 'bg-white border-[#2E9E5B] shadow-md ring-1 ring-[#2E9E5B]/20' 
          : 'bg-white border-[#E2E8DC] hover:border-[#2E9E5B]/40 shadow-xs'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
            isOpen ? 'bg-[#14452F] text-[#CFEF8A]' : 'bg-[#EBF3E5] text-[#14452F]'
          }`}>
            {number}
          </span>
          <span className="font-bold text-[#14452F] text-sm sm:text-base font-display leading-snug">
            {question}
          </span>
        </div>
        
        {/* Toggle Indicator: Rotates 45 deg into an 'x' - NO ARROW ICONS */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
          isOpen ? 'bg-[#14452F] text-[#CFEF8A] rotate-45 scale-105' : 'bg-[#EBF3E5] text-[#14452F] rotate-0'
        }`}>
          <Plus className="w-4 h-4" />
        </div>
      </button>

      {/* Smooth CSS Grid Accordion Transition */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-2 pb-6 px-5 sm:px-6 pl-14 sm:pl-16 text-xs sm:text-[14px] leading-relaxed text-[#4A5A52] border-t border-[#EDF2E8]">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Homepage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Single-open FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Interactive Explainable AI state (Human-friendly, minimal numbers)
  const [selectedFactorId, setSelectedFactorId] = useState<string>('ndvi');
  const [selectedCurveType, setSelectedCurveType] = useState<'ndvi' | 'rain' | 'lst'>('ndvi');

  const handleToggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleDashboardAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard/monitoring');
    } else {
      navigate('/login');
    }
  };

  // 4 Workflow Steps for "ALUR KERJA SISTEM"
  const workflowSteps = [
    {
      step: '01',
      title: 'Akuisisi Citra Satelit',
      desc: 'Pengunduhan citra multispektral Sentinel-2 untuk ekstraksi NDVI dan data presipitasi curah hujan CHIRPS v2.0 secara kontinu.',
      image: '/images/workflow-satellite.jpg'
    },
    {
      step: '02',
      title: 'Harmonisasi Spasial Lahan',
      desc: 'Penyelarasan batas petak sawah dengan resolusi elevasi SRTM DEM 30m serta kalibrasi suhu kinetik permukaan tanah (LST).',
      image: '/images/workflow-geospatial.jpg'
    },
    {
      step: '03',
      title: 'Komputasi Prediksi XGBoost',
      desc: 'Pemodelan pohon keputusan terpadu untuk memproyeksikan bobot tonase panen gabah per petak sawah sebelum masa panen tiba.',
      image: '/images/workflow-machine-learning.jpg'
    },
    {
      step: '04',
      title: 'Explainable AI (XAI)',
      desc: 'Dekomposisi kontribusi tiap parameter agroklimat lokal dan validasi kurva efek non-linear tanpa jebakan kotak hitam.',
      image: '/images/workflow-explainable-ai.jpg'
    }
  ];

  // 4 Distinct Feature Cards for "MENGAPA SIPADI" (Logo only, zero fluff)
  const whySipadiCards = [
    {
      id: '01',
      title: 'Prediksi Lebih Awal',
      description: 'Estimasi hasil panen diketahui 3-4 minggu sebelum masa panen tiba, memberi waktu yang cukup bagi petani dan penggilingan untuk merencanakan logistik, pupuk, dan stabilisasi harga jual.',
      bgClass: 'bg-[#F2F6ED]',
      borderClass: 'border-[#DCE7D6]',
      iconBg: 'bg-[#14452F] text-[#CFEF8A]',
      icon: BarChart2
    },
    {
      id: '02',
      title: 'Pemantauan Berkala',
      description: 'Data satelit Sentinel-2 dan iklim diperbarui otomatis berkala, mendeteksi stres air, kekurangan hara, atau anomali pertumbuhan kanopi sebelum menyebar luas.',
      bgClass: 'bg-[#EEF5F8]',
      borderClass: 'border-[#D6E6EE]',
      iconBg: 'bg-[#184F6E] text-[#D8EFFF]',
      icon: Clock
    },
    {
      id: '03',
      title: 'AI yang Terbuka',
      description: 'Bukan kotak hitam. Setiap estimasi didampingi penjelasan variabel pendukung dan pembatasnya dalam bahasa yang mudah dipahami oleh petani dan penyuluh.',
      bgClass: 'bg-[#F9F5EC]',
      borderClass: 'border-[#ECE2D0]',
      iconBg: 'bg-[#664D14] text-[#FFE8B5]',
      icon: ShieldCheck
    },
    {
      id: '04',
      title: 'Laporan Siap Pakai',
      description: 'Ringkasan kondisi musim tanam dan faktor lahan per petak dapat langsung diunduh dalam format PDF siap cetak maupun data spasial untuk koordinasi dinas.',
      bgClass: 'bg-[#EDF7F2]',
      borderClass: 'border-[#D2EAD9]',
      iconBg: 'bg-[#125238] text-[#D2F5E2]',
      icon: FileDown
    }
  ];

  // SHAP Human-Friendly Factor Explanations (Solid palette, no small borders, no eye-strain)
  const xaiFactors = [
    {
      id: 'ndvi',
      name: 'Kerapatan Daun Padi (NDVI)',
      icon: Sprout,
      role: 'Pendorong Terbesar',
      roleBadgeBg: 'bg-[#205C3B] text-[#CFEF8A]',
      summary: 'Kanopi daun hijau lebat pada umur 65 HST memaksimalkan fotosintesis pembentukan malai.',
      fieldAdvice: 'Pertahankan kecukupan unsur hara agar pengisian bulir gabah berjalan serempak hingga matang fisiologis.'
    },
    {
      id: 'rain',
      name: 'Kecukupan Pasokan Air (CHIRPS)',
      icon: CloudRain,
      role: 'Faktor Pendukung',
      roleBadgeBg: 'bg-[#18485E] text-[#9BE5FF]',
      summary: 'Presipitasi musiman memenuhi kebutuhan transpirasi tanaman tanpa menimbulkan risiko pembusukan akar.',
      fieldAdvice: 'Pola pembagian air irigasi berkala sudah tepat untuk menjaga kelembaban tanah pada fase bunting.'
    },
    {
      id: 'dem',
      name: 'Elevasi & Sirkulasi (DEM)',
      icon: Mountain,
      role: 'Kondisi Ideal',
      roleBadgeBg: 'bg-[#2D4D3A] text-[#BEE3CC]',
      summary: 'Ketinggian terasering memberikan gradien suhu harian yang sejuk serta sirkulasi angin yang sehat.',
      fieldAdvice: 'Sirkulasi udara alami membantu mengurangi kelembaban berlebih yang memicu perkembangan jamur.'
    },
    {
      id: 'lst',
      name: 'Suhu Permukaan Tanah (LST)',
      icon: Sun,
      role: 'Faktor Pembatas',
      roleBadgeBg: 'bg-[#632926] text-[#FFA8A3]',
      summary: 'Suhu permukaan siang hari sedikit meningkat, memicu respirasi malam kanopi lebih cepat.',
      fieldAdvice: 'Jaga lapisan genangan air tipis (2-3 cm) di petak sawah saat siang hari untuk meredam suhu di zona perakaran.'
    }
  ];

  // ALE Human-Friendly Biological Response Curves (Clear Qualitative Story)
  const aleCurves = {
    ndvi: {
      title: 'Pola Respon Daun Padi',
      category: 'Kanopi Vegetasi (NDVI)',
      path: 'M10 95 C70 90 120 70 180 35 C240 18 280 15 310 15',
      points: [
        { label: 'Fase Awal', x: 40, y: 92 },
        { label: 'Fase Cepat', x: 180, y: 35 },
        { label: 'Optimal / Jenuh', x: 280, y: 15 }
      ],
      insight: 'Hasil panen meningkat pesat seiring bertambahnya daun hijau, lalu stabil saat kanopi tanaman sudah menutup sempurna.',
      benefit: 'Membantu penyuluh membedakan sawah yang masih membutuhkan nutrisi daun vs sawah yang kanopinya sudah jenuh.'
    },
    rain: {
      title: 'Pola Kebutuhan Air Tanaman',
      category: 'Curah Hujan (CHIRPS)',
      path: 'M10 90 C60 85 120 35 170 20 C220 20 270 50 310 85',
      points: [
        { label: 'Kering', x: 40, y: 88 },
        { label: 'Ideal', x: 170, y: 20 },
        { label: 'Genangan', x: 290, y: 78 }
      ],
      insight: 'Kebutuhan air optimal berada di titik seimbang: defisit air memicu stres kekeringan, sedangkan air berlebih berisiko merendam perakaran.',
      benefit: 'Memberikan dasar penyesuaian buka-tutup saluran irigasi sesuai fase kritis tanaman padi.'
    },
    lst: {
      title: 'Pola Toleransi Suhu Lahan',
      category: 'Suhu Permukaan (LST)',
      path: 'M10 20 C90 20 160 30 220 55 C270 78 295 90 310 95',
      points: [
        { label: 'Sejuk', x: 50, y: 20 },
        { label: 'Normal', x: 180, y: 38 },
        { label: 'Terik', x: 280, y: 85 }
      ],
      insight: 'Padi tumbuh optimal pada suhu yang sejuk. Pada suhu terik, energi tanaman lebih banyak terpakai untuk respirasi daripada pengisian gabah.',
      benefit: 'Mendeteksi potensi penurunan bobot bulir gabah akibat lonjakan suhu terik di siang hari.'
    }
  };

  const currentFactor = xaiFactors.find(f => f.id === selectedFactorId) || xaiFactors[0];
  const currentCurve = aleCurves[selectedCurveType];

  const faqList = [
    {
      number: '01',
      question: 'Seberapa akurat prediksi hasil panen model ini?',
      answer: 'Berdasarkan validasi model regresi gradient boosting (XGBoost) terhadap data historis panen dan indeks kanopi Sentinel-2, sistem mencapai koefisien determinasi R² > 0,88 dengan galat estimasi (RMSE) yang rendah sebelum masa panen tiba.'
    },
    {
      number: '02',
      question: 'Data penginderaan jauh dan agroklimat apa saja yang digunakan?',
      answer: 'Sistem mengintegrasikan citra multispektral Sentinel-2 (NDVI kanopi vegetasi resolusi 10 m), data presipitasi curah hujan harian CHIRPS v2.0, suhu kinetik permukaan tanah (LST), dan elevasi topografi SRTM DEM.'
    },
    {
      number: '03',
      question: 'Bagaimana metode Explainable AI (SHAP & ALE) membantu pengguna?',
      answer: 'SHAP membongkar kontribusi tiap variabel iklim dan vegetasi terhadap deviasi angka panen (faktor pendorong vs pembatas), sementara ALE memetakan kurva efek marginal murni tanpa terdistorsi korelasi antar-fitur.'
    },
    {
      number: '04',
      question: 'Apakah arsitektur sistem ini dapat diterapkan pada sentra tani wilayah lain?',
      answer: 'Tentu. Arsitektur pemrosesan geospasial dan model analitik SIPADI dirancang secara modular dan dapat dikalibrasikan untuk berbagai sentra produksi padi lainnya di seluruh Indonesia.'
    }
  ];

  return (
    <div className="min-h-screen text-[#1F2D26] font-sans selection:bg-[#CFEF8A] selection:text-[#0E3323] overflow-x-hidden relative flex flex-col">
      {/* Floating Capsule Fixed Navbar (Always follows scroll) */}
      <div className="fixed top-4 left-0 right-0 z-50 w-full px-4 pointer-events-none">
        <div className="max-w-[1280px] mx-auto pointer-events-auto">
          <PublicNavbar />
        </div>
      </div>

      {/* ============================================================
          SECTION 1: HERO (PANORAMIC COVER WITH CRISP TELEMETRY)
          ============================================================ */}
      <section 
        id="hero"
        className="relative w-full min-h-[92vh] lg:min-h-screen flex flex-col justify-between pt-28 sm:pt-32 pb-12 sm:pb-16 shadow-xl rounded-b-[40px] sm:rounded-b-[56px] overflow-hidden group"
      >
        {/* Full panoramic landscape image background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out group-hover:scale-[1.01]"
          style={{
            backgroundImage: `url('/images/hero-rice-terraces.jpg')`
          }}
        />

        {/* Clean dark emerald gradient overlay for contrast */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(14,51,35,0.48) 0%, rgba(14,51,35,0.72) 55%, rgba(10,36,25,0.94) 100%)`
          }}
        />

        {/* Content Container (Center Aligned max-w-[1280px]) */}
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-between gap-10 relative z-10">
          {/* Top Row Location Tag */}
          <div className="flex flex-wrap gap-4 justify-between items-center pt-2">
            <div className="bg-white/95 backdrop-blur-md rounded-full py-2 px-4.5 text-xs sm:text-sm font-bold text-[#14452F] inline-flex items-center gap-2 border border-white/70 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#2E9E5B]" />
              <MapPin className="w-3.5 h-3.5 text-[#14452F]" />
              <span>Wilayah Kajian: Jatiluwih, Tabanan</span>
            </div>
          </div>

          {/* Center Headline & Value Proposition */}
          <div className="py-6 sm:py-8 max-w-4xl">
            {/* Minimalist Technology Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs font-semibold mb-5 tracking-wide">
              <span>Sentinel-2 MSI</span>
              <span className="text-white/40">•</span>
              <span>Prediksi XGBoost</span>
              <span className="text-white/40">•</span>
              <span className="text-[#CFEF8A] font-bold">Explainable AI (SHAP &amp; ALE)</span>
            </div>

            <h1 className="m-0 max-w-[840px] text-4xl sm:text-5xl lg:text-[62px] leading-[1.06] font-extrabold text-white tracking-tight font-display">
              Pantau produktivitas padi, pahami faktor lingkungannya.
            </h1>
            <p className="my-5 max-w-[620px] text-base sm:text-[17px] leading-relaxed text-[#E6F0E2]">
              Integrasi citra satelit multispektral, parameter agroklimat lokal, dan model XGBoost yang dapat dijelaskan secara transparan melalui SHAP &amp; ALE.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={handleDashboardAction}
                className="inline-flex items-center justify-center min-h-[48px] px-7 rounded-full bg-[#CFEF8A] text-[#0E3323] font-bold text-sm hover:bg-white hover:shadow-lg transition-all duration-200 cursor-pointer shadow-sm"
              >
                <span>Mulai Eksplorasi Monitoring</span>
              </button>
              <a
                href="#alur"
                className="inline-flex items-center justify-center min-h-[48px] px-7 rounded-full bg-white/10 text-white border border-white/40 hover:bg-white/20 font-bold text-sm transition-all duration-200 backdrop-blur-xs"
              >
                <span>Pelajari Alur Kerja</span>
              </a>
            </div>
          </div>

          {/* Bottom Telemetry Glass Cards Row with CountUp Animations */}
          <div 
            id="indikator" 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 scroll-mt-24"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold text-[#55695D] tracking-wider uppercase">
                ESTIMASI HASIL PANEN
              </div>
              <div className="text-[30px] font-extrabold text-[#14452F] leading-tight my-1.5 font-display tabular-nums">
                <AnimatedCounter end={5.21} decimals={2} /> <span className="text-xs font-semibold text-[#55695D]">ton/ha</span>
              </div>
              <div className="text-[12px] font-medium text-[#2E7D4F] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D4F]" />
                <span>+0,41 ton/ha di atas rata-rata</span>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold text-[#55695D] tracking-wider uppercase">
                NDVI KANOPI VEGETASI
              </div>
              <div className="text-[30px] font-extrabold text-[#14452F] leading-tight my-1.5 font-display tabular-nums">
                <AnimatedCounter end={0.68} decimals={2} /> <span className="text-xs font-semibold text-[#55695D]">indeks</span>
              </div>
              <div className="text-[12px] font-medium text-[#2E7D4F] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D4F]" />
                <span>Kanopi lebat &amp; seragam</span>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold text-[#55695D] tracking-wider uppercase">
                SUHU PERMUKAAN (LST)
              </div>
              <div className="text-[30px] font-extrabold text-[#14452F] leading-tight my-1.5 font-display tabular-nums">
                <AnimatedCounter end={27.4} decimals={1} /> <span className="text-xs font-semibold text-[#55695D]">°C</span>
              </div>
              <div className="text-[12px] font-medium text-[#7A6128] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B08832]" />
                <span>Rentang fisiologis stabil</span>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold text-[#55695D] tracking-wider uppercase">
                CURAH HUJAN SIKLUS
              </div>
              <div className="text-[30px] font-extrabold text-[#14452F] leading-tight my-1.5 font-display tabular-nums">
                <AnimatedCounter end={1820} thousandSeparator={true} /> <span className="text-xs font-semibold text-[#55695D]">mm</span>
              </div>
              <div className="text-[12px] font-medium text-[#1E5C7D] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E5C7D]" />
                <span>Irigasi musiman tercukupi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: TRUST STRIP & TENTANG (WARM CREAM #FAF7F0)
          ============================================================ */}
      <section className="w-full bg-[#FAF7F0] py-16 sm:py-20 border-b border-[#EAE3D5]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 sm:gap-14">
          {/* Trust Strip */}
          <AnimatedReveal direction="up">
            <div className="text-center">
              <div className="text-xs text-[#55695D] font-bold uppercase tracking-wider mb-4">
                Didukung Data Satelit &amp; Metodologi Terbuka
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-3 font-extrabold text-base sm:text-lg text-[#3E5547] tracking-tight">
                <span>Sentinel-2 MSI</span>
                <span>CHIRPS v2.0</span>
                <span>SRTM DEM 30m</span>
                <span>XGBoost Regressor</span>
                <span>SHAP Values</span>
                <span>ALE Curves</span>
              </div>
            </div>
          </AnimatedReveal>

          {/* Core Statement */}
          <AnimatedReveal direction="up" delayMs={50}>
            <div id="tentang" className="text-center max-w-3xl mx-auto scroll-mt-28">
              <div className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#2E7D4F] mb-3">
                TENTANG SIPADI
              </div>
              <p className="text-2xl sm:text-3xl lg:text-[36px] leading-snug font-extrabold text-[#14452F] font-display">
                Mengubah data penginderaan jauh menjadi keputusan pertanian yang transparan, presisi, dan dapat dipercaya.
              </p>
            </div>
          </AnimatedReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: ALUR KERJA PLATFORM (SOFT SAGE #EEF5E8)
          ============================================================ */}
      <section id="alur" className="w-full bg-[#EEF5E8] py-20 sm:py-24 border-b border-[#DCE8D4] scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedReveal direction="up">
            <div className="flex flex-wrap justify-between items-end gap-4 pb-10">
              <div>
                <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#2E7D4F]">
                  ALUR KERJA SISTEM
                </div>
                <h2 className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-[#14452F] max-w-xl leading-tight font-display">
                  Dari observasi satelit hingga rekomendasi terukur
                </h2>
              </div>
              <p className="m-0 max-w-[380px] text-sm text-[#4A5A52] leading-relaxed">
                Empat langkah terstruktur yang menyatukan data multispektral, pemodelan gradient boosting, dan transparansi ilmiah.
              </p>
            </div>
          </AnimatedReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((stepItem, idx) => (
              <AnimatedReveal key={stepItem.step} direction="up" delayMs={idx * 60}>
                <article className="bg-white rounded-3xl overflow-hidden border border-[#D8E3CC] hover:border-[#2E9E5B]/50 hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2 transition-all duration-300 ease-out h-full flex flex-col group cursor-default">
                  {/* Step Number Centered at Top of Card (Number only, no 'Tahap') */}
                  <div className="pt-5 pb-3 flex justify-center items-center">
                    <span className="w-9 h-9 rounded-full bg-[#14452F] text-[#CFEF8A] font-extrabold text-xs flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                      {stepItem.step}
                    </span>
                  </div>

                  {/* Clean Inset Image Container (No Numbers Stamped On It) */}
                  <div className="mx-4.5 rounded-2xl overflow-hidden h-40 relative bg-[#F0F5EC]">
                    <img 
                      src={stepItem.image} 
                      alt={stepItem.title} 
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" 
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="m-0 mb-2 text-base font-bold text-[#14452F] font-display group-hover:text-[#2E7D4F] transition-colors">
                        {stepItem.title}
                      </h3>
                      <p className="m-0 text-xs sm:text-[13px] leading-relaxed text-[#4A5A52]">
                        {stepItem.desc}
                      </p>
                    </div>
                  </div>
                </article>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: PRATINJAU DASHBOARD (CRISP PURE WHITE #FFFFFF)
          ============================================================ */}
      <section className="w-full bg-[#FFFFFF] py-20 sm:py-24 border-b border-[#E5ECE0]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <AnimatedReveal direction="right" className="lg:col-span-5 flex flex-col items-start">
              <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#2E7D4F]">
                PRATINJAU ANTARMUKA
              </div>
              <h2 className="mt-2 mb-4 text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-[#14452F] leading-tight font-display">
                Semua indikator lahan dalam satu layar terpadu
              </h2>
              <p className="m-0 mb-6 text-sm sm:text-base text-[#4A5A52] leading-relaxed">
                Pantau dinamika vegetasi NDVI, sebaran curah hujan, dan suhu permukaan per petak sawah, lalu telusuri faktor pendorong prediksi panen secara transparan.
              </p>
              <button
                onClick={handleDashboardAction}
                className="inline-flex items-center justify-center min-h-[46px] px-7 rounded-full bg-[#14452F] text-white font-bold text-sm hover:bg-[#0E3323] transition-all duration-200 cursor-pointer shadow-xs"
              >
                <span>Coba Dashboard</span>
              </button>
            </AnimatedReveal>

            <AnimatedReveal direction="left" delayMs={100} className="lg:col-span-7">
              {/* Refined Browser Frame Mockup */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-[#D9E2D2]">
                {/* Title bar */}
                <div className="bg-[#14452F] px-4 py-2.5 flex items-center justify-between border-b border-[#23583C]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                    <span className="text-[11px] font-mono text-white/70 ml-2 hidden sm:inline">
                      sipadi.id/dashboard/monitoring
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#CFEF8A] text-[#0E3323]">
                    Antarmuka Interaktif
                  </span>
                </div>

                {/* Screenshot */}
                <div className="relative overflow-hidden bg-slate-900">
                  <img 
                    src="/images/dashboard-preview.jpg" 
                    alt="Pratinjau Dashboard SIPADI" 
                    className="w-full h-auto object-cover" 
                  />
                </div>
              </div>
            </AnimatedReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: DIRANCANG UNTUK PENYULUH (WARM SAND #F7F5EE)
          ============================================================ */}
      <section className="w-full bg-[#F7F5EE] py-20 sm:py-24 border-b border-[#E5DFD3]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedReveal direction="up">
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#2E7D4F]">
                MENGAPA SIPADI
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-[#14452F] font-display">
                Dirancang untuk penyuluh, analis, dan kelompok tani
              </h2>
              <p className="mt-3 text-sm text-[#4A5A52]">
                Empat keunggulan fungsional yang menjembatani data satelit canggih menjadi panduan praktis dan terpercaya di lapangan.
              </p>
            </div>
          </AnimatedReveal>

          {/* 4 Distinct, Beautifully Tinted Cards (Logo only, hover expand) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whySipadiCards.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <AnimatedReveal key={card.id} direction="up" delayMs={idx * 60}>
                  <div className={`${card.bgClass} rounded-3xl p-8 sm:p-9 border ${card.borderClass} shadow-xs hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2 transition-all duration-300 ease-out h-full flex flex-col justify-between group cursor-default`}>
                    <div className="flex flex-col items-center text-center">
                      {/* Logo Centered (No numbers, no badges) */}
                      <div className="mb-6 flex justify-center">
                        <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 duration-300`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                      </div>

                      <h3 className="m-0 mb-3 text-lg sm:text-xl font-bold text-[#14452F] font-display">
                        {card.title}
                      </h3>
                      <p className="m-0 text-xs sm:text-[13.5px] leading-relaxed text-[#4A5A52]">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </AnimatedReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: METODOLOGI AI TERJELASKAN (DARK GREEN SOLID, NO SMALL BORDERS)
          ============================================================ */}
      <section 
        id="xai" 
        className="w-full bg-[#0C2519] text-white py-20 sm:py-24 border-b border-[#173F2B] scroll-mt-20"
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedReveal direction="up">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="text-xs font-extrabold tracking-[0.14em] uppercase text-[#CFEF8A] mb-2">
                METODOLOGI AI TERJELASKAN (XAI)
              </div>
              <h2 className="m-0 mb-3 text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-white font-display">
                Bagaimana Kami Membuka Kotak Hitam AI
              </h2>
              <p className="m-0 text-sm sm:text-base text-[#BBD4C3] leading-relaxed">
                Kami tidak sekadar memberikan estimasi angka, tetapi menjelaskan alasan di balik setiap prediksi melalui dua sudut pandang: pengurai faktor lokal lahan (SHAP) dan kurva pemahaman biologis alami tanaman padi (ALE).
              </p>
            </div>
          </AnimatedReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Panel: SHAP Human-Friendly Factor Attribution (Col 6) */}
            <AnimatedReveal direction="right" delayMs={100} className="lg:col-span-6 h-full">
              <div className="bg-[#123624] rounded-3xl p-7 sm:p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-[#CFEF8A] tracking-wider uppercase">
                      1. FAKTOR PENENTU PADA LAHAN (SHAP)
                    </span>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-white/90">
                      Analisis Petak
                    </span>
                  </div>
                  <h3 className="m-0 text-xl font-bold font-display text-white mb-2">
                    Faktor yang Mempengaruhi Hasil Panen
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#A7CDB5] leading-relaxed mb-6">
                    Pilih salah satu faktor di bawah untuk melihat bagaimana model memahami pengaruhnya pada kondisi sawah Anda:
                  </p>

                  {/* Clean List Items (No small borders) */}
                  <div className="flex flex-col gap-2.5">
                    {xaiFactors.map((factor) => {
                      const isSelected = selectedFactorId === factor.id;
                      const IconComp = factor.icon;
                      return (
                        <div
                          key={factor.id}
                          onClick={() => setSelectedFactorId(factor.id)}
                          className={`p-4 rounded-2xl transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-white/15 text-white shadow-sm' 
                              : 'bg-transparent hover:bg-white/5 text-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#CFEF8A] text-[#0C2519]' : 'bg-white/10 text-white'
                              }`}>
                                <IconComp className="w-4 h-4" />
                              </span>
                              <span className="font-bold text-sm text-white">
                                {factor.name}
                              </span>
                            </div>
                            <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${factor.roleBadgeBg}`}>
                              {factor.role}
                            </span>
                          </div>

                          <div className="pl-9.5 text-xs text-[#A9C7B3] leading-relaxed">
                            {factor.summary}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Practical Field Advice Box (No small borders) */}
                <div className="mt-6 pt-5 bg-black/25 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#CFEF8A] mb-1.5 uppercase tracking-wide">
                    <Activity className="w-4 h-4 text-[#CFEF8A]" />
                    <span>Rekomendasi Lapangan</span>
                  </div>
                  <p className="m-0 text-xs sm:text-[13.5px] text-[#D4E8DC] leading-relaxed">
                    {currentFactor.fieldAdvice}
                  </p>
                </div>
              </div>
            </AnimatedReveal>

            {/* Right Panel: ALE Biological Nature of Paddy (Col 6) */}
            <AnimatedReveal direction="left" delayMs={150} className="lg:col-span-6 h-full">
              <div className="bg-[#123624] rounded-3xl p-7 sm:p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-[#CFEF8A] tracking-wider uppercase">
                      2. SIFAT BIOLOGIS ALAMI TANAMAN (ALE)
                    </span>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-white/90">
                      Kurva Respon Alami
                    </span>
                  </div>
                  <h3 className="m-0 text-xl font-bold font-display text-white mb-2">
                    Respons Non-Linear Tanpa Bias Data
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#A7CDB5] leading-relaxed mb-5">
                    Tanaman padi memiliki batas toleransi alami. Pilih parameter untuk melihat bagaimana model memahami pola biologisnya:
                  </p>

                  {/* Clean Parameter Selector Tabs (No small borders) */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <button
                      type="button"
                      onClick={() => setSelectedCurveType('ndvi')}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedCurveType === 'ndvi'
                          ? 'bg-white text-[#0C2519] shadow-sm'
                          : 'bg-white/10 text-white/80 hover:bg-white/15'
                      }`}
                    >
                      Kanopi Daun (NDVI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurveType('rain')}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedCurveType === 'rain'
                          ? 'bg-white text-[#0C2519] shadow-sm'
                          : 'bg-white/10 text-white/80 hover:bg-white/15'
                      }`}
                    >
                      Curah Hujan (Air)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurveType('lst')}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedCurveType === 'lst'
                          ? 'bg-white text-[#0C2519] shadow-sm'
                          : 'bg-white/10 text-white/80 hover:bg-white/15'
                      }`}
                    >
                      Suhu Lahan (LST)
                    </button>
                  </div>

                  {/* Minimalist Organic Response Curve Canvas (No small borders) */}
                  <div className="bg-black/25 rounded-2xl p-5 sm:p-6">
                    <div className="flex justify-between items-center text-xs font-bold mb-3 font-display">
                      <span className="text-white">{currentCurve.title}</span>
                      <span className="text-white/60 text-[11px] font-normal">{currentCurve.category}</span>
                    </div>

                    <div className="relative py-2">
                      <svg viewBox="0 0 320 110" className="w-full h-auto overflow-visible" role="img" aria-label="Grafik Respon Biologis">
                        {/* Soft guide line */}
                        <line x1="10" y1="95" x2="310" y2="95" stroke="#25553C" strokeWidth="1" strokeDasharray="4 4" />
                        
                        {/* Smooth Organic Curve */}
                        <path 
                          d={currentCurve.path} 
                          fill="none" 
                          stroke="#CFEF8A" 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                          className="transition-all duration-500 ease-out"
                        />

                        {/* Qualitative Milestones along the curve */}
                        {currentCurve.points.map((pt, i) => (
                          <g key={i}>
                            <circle 
                              cx={pt.x} 
                              cy={pt.y} 
                              r="4" 
                              fill="#FFFFFF" 
                              stroke="#2E9E5B" 
                              strokeWidth="2" 
                            />
                            <text 
                              x={pt.x} 
                              y={pt.y - 8} 
                              fill="#E2EFE6" 
                              fontSize="9" 
                              textAnchor="middle" 
                              fontWeight="bold"
                            >
                              {pt.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    {/* Qualitative Narrative (No small borders) */}
                    <div className="mt-4 p-3.5 rounded-xl bg-white/5 text-xs text-[#D8EEDE] leading-relaxed">
                      {currentCurve.insight}
                    </div>
                  </div>
                </div>

                {/* Practical Value for Extension Officers (No small borders) */}
                <div className="mt-6 pt-5 bg-black/25 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#CFEF8A] mb-1.5 uppercase tracking-wide">
                    <Layers className="w-4 h-4 text-[#CFEF8A]" />
                    <span>Nilai Praktis di Lapangan</span>
                  </div>
                  <p className="m-0 text-xs sm:text-[13.5px] text-[#D4E8DC] leading-relaxed">
                    {currentCurve.benefit}
                  </p>
                </div>
              </div>
            </AnimatedReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 7: SUARA PENGGUNA & PERTANYAAN UMUM (FRESH MINT #F2F8ED)
          ============================================================ */}
      <section className="w-full bg-[#F2F8ED] py-20 sm:py-24 border-b border-[#DBEAD5]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Suara Pengguna (Col 5) */}
            <AnimatedReveal direction="right" className="lg:col-span-5">
              <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#2E7D4F]">
                SUARA PENGGUNA
              </div>
              <h2 className="mt-2 mb-5 text-2xl sm:text-3xl font-extrabold text-[#14452F] leading-tight font-display">
                Pengalaman dari lapangan
              </h2>
              <div className="bg-white rounded-3xl p-7 sm:p-8 border border-[#D9E5D2] shadow-sm">
                <p className="m-0 mb-6 text-base leading-relaxed text-[#1F2D26] italic">
                  “SIPADI sangat membantu kami dalam memantau kesehatan kanopi tanaman padi secara berkala dan memproyeksikan estimasi panen dengan alasan ilmiah yang dapat dipertanggungjawabkan kepada para petani.”
                </p>
                <div className="flex items-center gap-3.5 pt-4 border-t border-[#EDF2E8]">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#D9E2D2] shrink-0">
                    <img 
                      src="/images/testimonial-avatar.jpg" 
                      alt="I Wayan Sudiarta" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <b className="text-sm font-bold text-[#14452F] block">I Wayan Sudiarta</b>
                    <span className="text-xs text-[#4A5A52] block">Penyuluh Pertanian Lapangan, Tabanan</span>
                  </div>
                </div>
              </div>
            </AnimatedReveal>

            {/* FAQ Accordion (Col 7 - Mutually Exclusive Single Open) */}
            <AnimatedReveal direction="left" delayMs={100} className="lg:col-span-7">
              <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#2E7D4F]">
                PERTANYAAN UMUM
              </div>
              <h2 className="mt-2 mb-5 text-2xl sm:text-3xl font-extrabold text-[#14452F] leading-tight font-display">
                Yang sering ditanyakan
              </h2>
              
              {/* Single-Open Mutually Exclusive Accordion List */}
              <div className="flex flex-col gap-3">
                {faqList.map((item, idx) => (
                  <FAQItem
                    key={item.number}
                    number={item.number}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openFaqIndex === idx}
                    onToggle={() => handleToggleFaq(idx)}
                  />
                ))}
              </div>
            </AnimatedReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 8: CALL TO ACTION (SOFT LIME TRANSITION #EBF4E5)
          ============================================================ */}
      <section className="w-full bg-[#EBF4E5] py-16 sm:py-20 border-b border-[#D8E6CF]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedReveal direction="up">
            <div className="rounded-3xl p-8 sm:p-12 bg-[#14452F] text-white flex flex-wrap gap-6 justify-between items-center shadow-lg">
              <div className="max-w-xl">
                <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#CFEF8A] mb-2">
                  AKSES DASHBOARD OPERASIONAL
                </div>
                <h2 className="m-0 mb-2.5 text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-white leading-tight font-display">
                  Mulai eksplorasi data pemantauan &amp; prediksi lahan
                </h2>
                <p className="m-0 text-sm text-[#CFE3D4] leading-relaxed">
                  Masuk dengan akun terdaftar atau langsung jelajahi peta geospasial dan indikator agroklimat presisi SIPADI.
                </p>
              </div>

              <button
                onClick={handleDashboardAction}
                className="inline-flex items-center justify-center min-h-[48px] px-8 rounded-full bg-[#CFEF8A] text-[#0E3323] font-bold text-sm hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer shadow-xs"
              >
                <span>Buka Dashboard</span>
              </button>
            </div>
          </AnimatedReveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 9: FOOTER (DEEP MIDNIGHT FOREST #092015)
          ============================================================ */}
      <footer className="w-full bg-[#092015] text-[#CFE3D4] pt-14 pb-10 border-t border-[#1C422F]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="max-w-[300px]">
              <b className="font-display text-white text-2xl block mb-2 font-bold">SIPADI</b>
              <p className="m-0 text-xs sm:text-[13px] text-[#A9C7B3] leading-relaxed">
                Sistem Prediksi dan Interpretasi Produktivitas Tanaman Padi berbasis penginderaan jauh satelit dan Explainable AI.
              </p>
            </div>

            <div>
              <b className="text-[#CFEF8A] text-xs font-extrabold uppercase tracking-wider block mb-3">
                Platform
              </b>
              <div className="flex flex-col gap-2 text-xs sm:text-[13px]">
                <a href="#hero" className="hover:text-white transition-colors">Beranda</a>
                <a href="#indikator" className="hover:text-white transition-colors">Indikator</a>
                <a href="#alur" className="hover:text-white transition-colors">Alur Kerja</a>
                <a href="#xai" className="hover:text-white transition-colors">Metodologi AI</a>
              </div>
            </div>

            <div>
              <b className="text-[#CFEF8A] text-xs font-extrabold uppercase tracking-wider block mb-3">
                Sumber Data
              </b>
              <div className="flex flex-col gap-2 text-xs sm:text-[13px]">
                <span>Sentinel-2 MSI</span>
                <span>CHIRPS v2.0</span>
                <span>SRTM DEM 30m</span>
                <span>XGBoost &amp; SHAP</span>
              </div>
            </div>

            <div>
              <b className="text-[#CFEF8A] text-xs font-extrabold uppercase tracking-wider block mb-3">
                Kontak &amp; Wilayah
              </b>
              <div className="flex flex-col gap-2 text-xs sm:text-[13px]">
                <span>kontak@sipadi.id</span>
                <span>Tabanan, Bali, Indonesia</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#1C422F] text-xs text-[#8BAE97] flex flex-wrap justify-between items-center gap-2">
            <span>© 2026 SIPADI. Sistem Informasi Produktivitas Padi Berbasis AI.</span>
            <span>Desain Minimalis &amp; Responsif</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
