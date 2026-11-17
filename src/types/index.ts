// SIPADI Core Type Definitions

export type RegionId = 
  | 'tabanan' 
  | 'badung' 
  | 'gianyar' 
  | 'buleleng' 
  | 'bangli' 
  | 'jembrana' 
  | 'karangasem' 
  | 'klungkung' 
  | 'denpasar';

export interface RegionOption {
  id: RegionId;
  name: string;
}

export type YearOption = 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025;

export type ModelKey = 'xgboost_baseline' | 'xgboost_tuned';
export type ArtifactStatus = 'available' | 'missing' | 'unknown';

export interface ModelMetrics {
  n?: number;
  mae?: number | null;
  rmse?: number | null;
  r2?: number | null;
  bias?: number | null;
  wape_pct?: number | null;
  mape_nonzero_pct?: number | null;
  smape_pct?: number | null;
}

export interface ModelParameters {
  model_key?: ModelKey;
  algorithm?: string;
  name?: string;
  params?: Record<string, number | string | boolean>;
}

export interface TrainingRun {
  id: string;
  runId: string;
  modelKey: ModelKey | null;
  modelName: string;
  uploadBatchId: string | null;
  filename: string;
  createdAt: string | null;
  rows: number;
  supervisedRows: number;
  modelParams: ModelParameters | null;
  validationScheme: string | null;
  temporalValidationMetrics: ModelMetrics | null;
  finalTestMetrics: ModelMetrics | null;
  artifactStatus: ArtifactStatus;
  shapFeatures: ShapFeature[];
}

export interface UploadBatchRun {
  id: string;
  modelKey: ModelKey;
  modelName: string;
  modelParams: ModelParameters | null;
  temporalValidationMetrics: ModelMetrics | null;
  finalTestMetrics: ModelMetrics | null;
}

export interface UploadBatch {
  id: string;
  uploadBatchId: string;
  filename: string;
  rows: number;
  supervisedRows: number;
  runs: UploadBatchRun[];
}

export interface ModelPrediction {
  Kabupaten: string;
  Tahun: number;
  Bulan: number;
  Produktivitas: number | null;
  Prediksi: number;
  Error: number;
  Origin: string;
}

export interface ModelPredictionResponse {
  runId: string;
  uploadBatchId: string | null;
  modelKey: ModelKey | null;
  predictions: ModelPrediction[];
  count: number;
}

export interface RegionalSHAP {
  scope: string;
  features: ShapFeature[];
}

export interface RegionalALE {
  scope: string;
  features: AleFeatureData[];
}

export interface RunAnalysis {
  runId: string;
  modelKey: ModelKey | null;
  modelName: string;
  validationScheme: string | null;
  featureImportanceScope: string;
  aleScope: string;
  features: ShapFeature[];
  ale: AleFeatureData[];
}

export interface ModelComparison {
  baseline: TrainingRun;
  tuned: TrainingRun;
  alignedPredictions: Array<{
    key: string;
    Kabupaten: string;
    Tahun: number;
    Bulan: number;
    Origin: string;
    Produktivitas: number;
    baselinePrediction: number;
    baselineError: number;
    tunedPrediction: number;
    tunedError: number;
  }>;
}

export interface AgroklimatMetric {
  value: number | null;
  unit: string;
  statusText: string;
  statusType: 'optimal' | 'normal' | 'warning' | 'alert';
  changePercentage?: number;
  description: string;
}

export interface MonitoringData {
  count: number;
  runId: string | null;
  modelKey?: ModelKey | null;
  regionId: RegionId;
  regionName: string;
  year: number;
  productivity: AgroklimatMetric;
  ndvi: AgroklimatMetric;
  lst: AgroklimatMetric;
  rainfall: AgroklimatMetric;
  trend: {
    year: number;
    realisasi: number | null;
    estimasi?: number | null;
  }[];
  featureImportance: {
    feature: string;
    label: string;
    weight: number; // 0 to 1
    percentage: number;
    unit: string;
  }[];
}

export interface ShapFeature {
  id: string;
  name: string;
  importance: number;
  importancePct: number;
}

export interface ShapAnalysisData {
  modelName: string;
  runId: string;
  modelKey?: ModelKey | null;
  scope: string;
  aleScope?: string;
  validationScheme?: string | null;
  features: ShapFeature[];
}

export interface AlePoint {
  featureValue: number;
  aleEffect: number;
  sampleDensity?: number;
}

export interface AleFeatureData {
  featureKey:
    | 'ndvi'
    | 'lst'
    | 'rainfall'
    | 'produktivitas_lag1'
    | 'produktivitas_roll3_lag1';
  featureTitle: string;
  unit: string;
  currentObservedValue: number | null;
  baseline: number | null;
  summaryText: string;
  dataPoints: AlePoint[];
}

export interface FieldParcel {
  id: string;
  fieldName: string;
  farmer: string;
  areaHa: number;
  variety: string;
  estimatedYield: number; // ton/ha
  category: 'Tinggi' | 'Optimal' | 'Rendah';
  ndvi: number;
  soilMoisture: string;
  coordinates: { x: number; y: number; width: number; height: number; path?: string };
}

export interface RegencyMapMetric {
  regionId: RegionId;
  name: string;
  rank: number;
  avgProductivityTonHa: number | null;
  avgNdvi: number | null;
  avgLst: number | null;
  avgRainfall: number | null;
  samples: number;
}

export interface MonthlyObservation {
  month: number;
  ndvi: number | null;
  lst: number | null;
  rainfall: number | null;
  productivity: number | null;
}

export interface InsightConclusion {
  evaluasiPanen: string;
  kondisiBiofisik: string;
  validasiXai: string;
  aksiLapangan: string;
}

export interface InsightData {
  regionId: RegionId;
  year: number;
  runId?: string | null;
  modelKey?: ModelKey | null;
  regionName: string;
  observationCount: number;
  productivityObservationCount: number;
  averages: {
    productivityTonHa: number | null;
    ndvi: number | null;
    lst: number | null;
    rainfall: number | null;
  };
  headlineSummary: string;
  harvestCategory: 'Optimal' | 'Tinggi' | 'Waspada' | 'Rendah';
  harvestCategoryNote: string;
  keyDrivers: {
    title: string;
    feature: string;
    impact: string;
    direction: 'positive' | 'negative';
  }[];
  parcels: FieldParcel[];
  regionalRanking: RegencyMapMetric[];
  monthlyObservations: MonthlyObservation[];
  conclusion: InsightConclusion | null;
  aiMeta: {
    cached: boolean;
    generatedBy: string;
    generatedAt?: string | null;
  };
}

// Model Prediction Input and Response
export interface PredictionInputPayload {
  regionId: RegionId;
  year: number;
  month: number;
  ndvi: number;
  lst: number;
  rainfall: number;
}

export interface PredictionResult {
  predictedYieldTonHa: number;
  predictedYieldKuHa: number;
  modelName: string;
  modelKey: ModelKey | null;
  runId: string;
  features: Record<string, string | number>;
}

// Auth Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'Penyuluh Pertanian' | 'Peneliti' | 'Petani Lahan' | 'Demo User' | string;
  avatarInitials: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}
