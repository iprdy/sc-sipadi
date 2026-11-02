// SIPADI Core Type Definitions

export type RegionId = 'tabanan' | 'badung' | 'gianyar' | 'buleleng';

export interface RegionOption {
  id: RegionId;
  name: string;
  totalFields: number;
  totalAreaHa: number;
}

export type YearOption = 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025;

export interface AgroklimatMetric {
  value: number;
  unit: string;
  statusText: string;
  statusType: 'optimal' | 'normal' | 'warning' | 'alert';
  changePercentage?: number;
  description: string;
}

export interface MonitoringData {
  regionId: RegionId;
  regionName: string;
  year: number;
  productivity: AgroklimatMetric;
  ndvi: AgroklimatMetric;
  lst: AgroklimatMetric;
  rainfall: AgroklimatMetric;
  trend: {
    year: number;
    realisasi?: number;
    estimasi: number;
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
  featureValue: string;
  shapValue: number; // positive or negative
  absoluteImpact: number;
  unit: string;
  interpretation: string;
}

export interface ShapAnalysisData {
  baseValue: number; // expected value (ton/ha)
  predictedValue: number;
  features: ShapFeature[];
}

export interface AlePoint {
  featureValue: number;
  aleEffect: number;
  sampleDensity?: number;
}

export interface AleFeatureData {
  featureKey: 'ndvi' | 'lst' | 'rainfall';
  featureTitle: string;
  unit: string;
  currentObservedValue: number;
  baseline: number;
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

export interface InsightData {
  regionId: RegionId;
  year: number;
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
}

// Model Prediction Input and Response (For future ML integration)
export interface PredictionInputPayload {
  regionId: RegionId;
  fieldName?: string;
  year: number;
  month: number;
  ndvi: number;
  lst: number;
  rainfall: number;
  variety: string;
  elevationM: number;
}

export interface PredictionResult {
  predictedYieldTonHa: number;
  confidenceScore: number;
  statusCategory: 'Tinggi' | 'Optimal' | 'Waspada' | 'Rendah';
  shapContribution: {
    feature: string;
    impact: number;
  }[];
  recommendations: string[];
  simulatedTimestamp: string;
}

// Auth Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Penyuluh Pertanian' | 'Peneliti' | 'Petani Lahan' | 'Demo User';
  avatarInitials: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}
