import { 
  RegionOption, 
  MonitoringData, 
  ShapAnalysisData, 
  AleFeatureData, 
  InsightData, 
  UserProfile, 
  PredictionResult, 
  PredictionInputPayload,
  FieldParcel
} from '../types';

export const DEMO_USER: UserProfile = {
  id: 'usr-demo-01',
  name: 'I Wayan Sudiarta',
  email: 'wayan.sudiarta@sipadi.id',
  role: 'Penyuluh Pertanian',
  avatarInitials: 'WS',
};

export const AVAILABLE_REGIONS: RegionOption[] = [
  { id: 'tabanan', name: 'Tabanan (Lumbung Beras)', totalFields: 228, totalAreaHa: 21500 },
  { id: 'badung', name: 'Badung', totalFields: 119, totalAreaHa: 9800 },
  { id: 'gianyar', name: 'Gianyar', totalFields: 142, totalAreaHa: 13200 },
  { id: 'buleleng', name: 'Buleleng', totalFields: 164, totalAreaHa: 17400 },
];

export const AVAILABLE_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

// Helper to generate dynamic mock monitoring data
export const getMockMonitoringData = (regionId: string, year: number): MonitoringData => {
  const isTabanan = regionId === 'tabanan';
  const baseYield = isTabanan ? 5.21 : regionId === 'badung' ? 4.95 : 5.08;
  const yieldVariation = ((year - 2018) * 0.08) - (year === 2023 ? 0.35 : 0);
  const finalYield = Number((baseYield + yieldVariation).toFixed(2));

  return {
    regionId: regionId as any,
    regionName: AVAILABLE_REGIONS.find((r) => r.id === regionId)?.name || 'Tabanan',
    year,
    productivity: {
      value: finalYield,
      unit: 'ton/ha',
      statusText: finalYield >= 5.0 ? 'OPTIMAL' : finalYield >= 4.5 ? 'NORMAL' : 'WASPADAI',
      statusType: finalYield >= 5.0 ? 'optimal' : finalYield >= 4.5 ? 'normal' : 'warning',
      changePercentage: Number((((finalYield - 4.8) / 4.8) * 100).toFixed(1)),
      description: 'Estimasi agregat produktivitas panen padi sawah terkalibrasi remote sensing.',
    },
    ndvi: {
      value: isTabanan ? 0.68 : 0.64,
      unit: 'index',
      statusText: 'Sehat',
      statusType: 'optimal',
      description: 'Kerapatan kanopi klorofil tanaman padi Sentinel-2 MSI.',
    },
    lst: {
      value: isTabanan ? 27.4 : 28.6,
      unit: '°C',
      statusText: 'Normal',
      statusType: 'normal',
      description: 'Suhu kinetik permukaan tanah (Land Surface Temperature) sensor MODIS/Landsat.',
    },
    rainfall: {
      value: isTabanan ? 1820 : 1640,
      unit: 'mm',
      statusText: 'Adekuat',
      statusType: 'optimal',
      description: 'Akumulasi presipitasi curah hujan CHIRPS v2.0 siklus tanam.',
    },
    trend: [
      { year: 2018, realisasi: 4.82, estimasi: 4.80 },
      { year: 2019, realisasi: 4.91, estimasi: 4.89 },
      { year: 2020, realisasi: 4.88, estimasi: 4.92 },
      { year: 2021, realisasi: 5.05, estimasi: 5.02 },
      { year: 2022, realisasi: 5.12, estimasi: 5.15 },
      { year: 2023, realisasi: 4.78, estimasi: 4.81 },
      { year: 2024, realisasi: 5.18, estimasi: 5.14 },
      { year: 2025, estimasi: finalYield },
    ],
    featureImportance: [
      { feature: 'ndvi_peak', label: 'NDVI Puncak Vegetasi (Sentinel-2)', weight: 0.38, percentage: 38, unit: 'Koefisien Model' },
      { feature: 'chirps_rainfall', label: 'Curah Hujan Musim Tanam (CHIRPS)', weight: 0.28, percentage: 28, unit: 'Koefisien Model' },
      { feature: 'lst_night', label: 'Suhu Permukaan Malam Hari (LST)', weight: 0.18, percentage: 18, unit: 'Koefisien Model' },
      { feature: 'elevation', label: 'Elevasi & Kontur Topografi Lahan', weight: 0.10, percentage: 10, unit: 'Koefisien Model' },
      { feature: 'soil_index', label: 'Indeks Kelembapan Tanah (NDWI)', weight: 0.06, percentage: 6, unit: 'Koefisien Model' },
    ],
  };
};

// SHAP Analysis Mock
export const getMockShapData = (regionId: string, _year: number): ShapAnalysisData => {
  const isTabanan = regionId === 'tabanan';
  const baseValue = 4.85;
  const predicted = isTabanan ? 5.21 : 4.95;

  return {
    baseValue,
    predictedValue: predicted,
    features: [
      {
        id: 'f1',
        name: 'NDVI Fase Vegetatif Aktif',
        featureValue: '0.68 (Tinggi)',
        shapValue: 0.28,
        absoluteImpact: 0.28,
        unit: 'ton/ha',
        interpretation: 'Kanopi klorofil rimbun secara signifikan mendongkrak biomassa fotosintesis.',
      },
      {
        id: 'f2',
        name: 'Presipitasi Kumulatif CHIRPS',
        featureValue: '1.820 mm (Optimum)',
        shapValue: 0.16,
        absoluteImpact: 0.16,
        unit: 'ton/ha',
        interpretation: 'Ketersediaan air irigasi stabil memenuhi kebutuhan fase pembungaan tanaman padi.',
      },
      {
        id: 'f3',
        name: 'Ketinggian Topografi Wilayah',
        featureValue: '450 - 700 mdpl',
        shapValue: 0.07,
        absoluteImpact: 0.07,
        unit: 'ton/ha',
        interpretation: 'Suhu dataran menengah ideal untuk respirasi tanaman padi.',
      },
      {
        id: 'f4',
        name: 'Anomali Suhu LST Siang Hari',
        featureValue: '31.8 °C (Sedikit Tinggi)',
        shapValue: -0.09,
        absoluteImpact: 0.09,
        unit: 'ton/ha',
        interpretation: 'Suhu permukaan tanah sedikit di atas rerata historis menekan efisiensi transpirasi.',
      },
      {
        id: 'f5',
        name: 'Hari Tanpa Hujan Berturut-turut',
        featureValue: '8 Hari',
        shapValue: -0.06,
        absoluteImpact: 0.06,
        unit: 'ton/ha',
        interpretation: 'Periode jeda hujan singkat menyebabkan fluktuasi pasokan air di saluran tersier.',
      },
    ],
  };
};

// ALE (Accumulated Local Effects) Mock Data
export const getMockAleData = (feature: 'ndvi' | 'lst' | 'rainfall'): AleFeatureData => {
  if (feature === 'ndvi') {
    return {
      featureKey: 'ndvi',
      featureTitle: 'NDVI (Normalized Difference Vegetation Index)',
      unit: 'Indeks (0.0 - 1.0)',
      currentObservedValue: 0.68,
      baseline: 0.0,
      summaryText: 'Pengaruh ALE menunjukkan efek marjinal positif yang tajam pada rentang NDVI 0.45 hingga 0.70. Di atas 0.75, terjadi efek saturasi kanopi di mana penambahan nilai NDVI tidak lagi menambah hasil panen secara signifikan.',
      dataPoints: [
        { featureValue: 0.20, aleEffect: -0.42 },
        { featureValue: 0.30, aleEffect: -0.34 },
        { featureValue: 0.40, aleEffect: -0.18 },
        { featureValue: 0.50, aleEffect: -0.04 },
        { featureValue: 0.60, aleEffect: 0.14 },
        { featureValue: 0.68, aleEffect: 0.27 },
        { featureValue: 0.75, aleEffect: 0.35 },
        { featureValue: 0.85, aleEffect: 0.38 },
      ],
    };
  } else if (feature === 'lst') {
    return {
      featureKey: 'lst',
      featureTitle: 'LST (Land Surface Temperature)',
      unit: '°C',
      currentObservedValue: 27.4,
      baseline: 0.0,
      summaryText: 'Kurva respon ALE menunjukkan suhu optimal pertumbuhan padi berada pada 25°C – 28°C. Peningkatan LST melampaui 30°C menimbulkan dampak penurunan yield akibat tekanan stres panas (heat stress).',
      dataPoints: [
        { featureValue: 22.0, aleEffect: -0.15 },
        { featureValue: 24.0, aleEffect: 0.02 },
        { featureValue: 26.0, aleEffect: 0.12 },
        { featureValue: 27.4, aleEffect: 0.16 },
        { featureValue: 29.0, aleEffect: 0.05 },
        { featureValue: 31.0, aleEffect: -0.14 },
        { featureValue: 33.0, aleEffect: -0.32 },
        { featureValue: 35.0, aleEffect: -0.55 },
      ],
    };
  } else {
    return {
      featureKey: 'rainfall',
      featureTitle: 'Presipitasi Kumulatif Siklus Tanam',
      unit: 'mm',
      currentObservedValue: 1820,
      baseline: 0.0,
      summaryText: 'Respon marjinal curah hujan meningkat pesat dari 800 mm hingga 1.600 mm. Di atas 2.200 mm, efek ALE berbalik melandai akibat risiko genangan berlebih dan kelembapan pemicu penyakit jamur/blas.',
      dataPoints: [
        { featureValue: 600, aleEffect: -0.58 },
        { featureValue: 1000, aleEffect: -0.28 },
        { featureValue: 1400, aleEffect: 0.05 },
        { featureValue: 1820, aleEffect: 0.22 },
        { featureValue: 2100, aleEffect: 0.29 },
        { featureValue: 2500, aleEffect: 0.20 },
        { featureValue: 3000, aleEffect: 0.02 },
      ],
    };
  }
};

// Field Parcels for Interactive Map
export const MOCK_FIELD_PARCELS: FieldParcel[] = [
  {
    id: 'fld-01',
    fieldName: 'Lahan Jatiluwih Kauh - Blok 1A',
    farmer: 'I Made Kertayasa',
    areaHa: 1.8,
    variety: 'Beras Merah Cempaka',
    estimatedYield: 5.65,
    category: 'Tinggi',
    ndvi: 0.74,
    soilMoisture: 'Kecukupan Tinggi (82%)',
    coordinates: { x: 30, y: 30, width: 140, height: 95 },
  },
  {
    id: 'fld-02',
    fieldName: 'Lahan Jatiluwih Kangin - Blok 2B',
    farmer: 'I Ketut Sudana',
    areaHa: 2.2,
    variety: 'Inpari 32',
    estimatedYield: 5.28,
    category: 'Optimal',
    ndvi: 0.69,
    soilMoisture: 'Optimal (75%)',
    coordinates: { x: 190, y: 30, width: 160, height: 95 },
  },
  {
    id: 'fld-03',
    fieldName: 'Lahan Gunungsari - Blok 3C',
    farmer: 'I Wayan Arsana',
    areaHa: 1.5,
    variety: 'Ciherang Lokal',
    estimatedYield: 5.12,
    category: 'Optimal',
    ndvi: 0.66,
    soilMoisture: 'Cukup (70%)',
    coordinates: { x: 370, y: 30, width: 150, height: 95 },
  },
  {
    id: 'fld-04',
    fieldName: 'Lahan Wongaya Betan - Blok 4D',
    farmer: 'I Nyoman Suwitra',
    areaHa: 2.0,
    variety: 'Inpari 42 Agritan',
    estimatedYield: 4.85,
    category: 'Optimal',
    ndvi: 0.62,
    soilMoisture: 'Normal (68%)',
    coordinates: { x: 30, y: 145, width: 140, height: 110 },
  },
  {
    id: 'fld-05',
    fieldName: 'Lahan Babahan Kaler - Blok 5E',
    farmer: 'I Gede Wirata',
    areaHa: 1.2,
    variety: 'Ciherang',
    estimatedYield: 4.25,
    category: 'Rendah',
    ndvi: 0.51,
    soilMoisture: 'Defisit Air (48%)',
    coordinates: { x: 190, y: 145, width: 160, height: 110 },
  },
  {
    id: 'fld-06',
    fieldName: 'Lahan Mengesta - Blok 6F',
    farmer: 'I Gusti Putu Rai',
    areaHa: 2.5,
    variety: 'Beras Hitam',
    estimatedYield: 5.42,
    category: 'Optimal',
    ndvi: 0.71,
    soilMoisture: 'Optimal (78%)',
    coordinates: { x: 370, y: 145, width: 150, height: 110 },
  },
];

export const getMockInsightData = (regionId: string, year: number): InsightData => {
  return {
    regionId: regionId as any,
    year,
    headlineSummary: 'Sintesis model XGBoost mengindikasikan prospek panen stabil di atas ambang batas 5.0 ton/ha didorong oleh kecocokan NDVI fase primordia dan kelancaran tata kelola air irigasi.',
    harvestCategory: 'Optimal',
    harvestCategoryNote: 'Nilai proyeksi melampaui rata-rata provinsi 2018-2024 (+6.2%).',
    keyDrivers: [
      {
        title: 'Pendorong Terkuat',
        feature: 'NDVI Kanopi Kanvas (0.68)',
        impact: '+0.28 ton/ha keunggulan relatif',
        direction: 'positive',
      },
      {
        title: 'Faktor Stabilisator',
        feature: 'Irigasi Presipitasi (1.820 mm)',
        impact: '+0.16 ton/ha penyangga hidrologi',
        direction: 'positive',
      },
      {
        title: 'Faktor Pembatas Kritis',
        feature: 'Thermal Stress LST (31.8 °C)',
        impact: '-0.09 ton/ha reduksi evaporasi',
        direction: 'negative',
      },
    ],
    parcels: MOCK_FIELD_PARCELS,
  };
};

// Simulated Machine Learning Predictor function
export const simulateMachineLearningInference = async (
  payload: PredictionInputPayload
): Promise<PredictionResult> => {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const baseYield = 4.2;
  const ndviContribution = (payload.ndvi - 0.5) * 2.2;
  const lstContribution = payload.lst > 30 ? -((payload.lst - 30) * 0.15) : ((payload.lst - 24) * 0.05);
  const rainfallContribution = payload.rainfall > 2200 ? -0.15 : payload.rainfall < 1000 ? -0.35 : 0.25;
  const elevationBonus = payload.elevationM > 300 && payload.elevationM < 800 ? 0.2 : 0.05;

  const rawYield = baseYield + ndviContribution + lstContribution + rainfallContribution + elevationBonus;
  const finalYield = Number(Math.max(2.5, Math.min(7.2, rawYield)).toFixed(2));

  const statusCategory = finalYield >= 5.3 ? 'Tinggi' : finalYield >= 4.8 ? 'Optimal' : finalYield >= 4.0 ? 'Waspada' : 'Rendah';

  return {
    predictedYieldTonHa: finalYield,
    confidenceScore: 0.91,
    statusCategory,
    shapContribution: [
      { feature: 'NDVI Kanopi', impact: Number(ndviContribution.toFixed(2)) },
      { feature: 'Suhu Permukaan (LST)', impact: Number(lstContribution.toFixed(2)) },
      { feature: 'Curah Hujan', impact: Number(rainfallContribution.toFixed(2)) },
      { feature: 'Elevasi Wilayah', impact: Number(elevationBonus.toFixed(2)) },
    ],
    recommendations: [
      payload.ndvi < 0.6 ? 'Perlu pupuk susulan urea/NPK untuk meningkatkan indeks kehijauan kanopi sebelum bunting.' : 'Kerapatan kanopi sangat prima, pertahankan sanitasi gulma.',
      payload.lst > 30 ? 'Peningkatan suhu mikro terdeteksi; lakukan penggenangan terputus (intermittent) di saluran irigasi.' : 'Suhu lingkungan optimal untuk fase pengisian bulir.',
      payload.rainfall < 1200 ? 'Waspadai penurunan pasokan air; prioritaskan pembagian air terjadwal.' : 'Drainase tersier perlu dicek agar tidak terjadi genangan berlebih.',
    ],
    simulatedTimestamp: new Date().toISOString(),
  };
};
