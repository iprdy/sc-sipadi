import { 
  MonitoringData, 
  ShapAnalysisData, 
  AleFeatureData, 
  InsightData, 
  PredictionInputPayload, 
  PredictionResult, 
  UserProfile 
} from '../types';
import { 
  getMockMonitoringData, 
  getMockShapData, 
  getMockAleData, 
  getMockInsightData, 
  simulateMachineLearningInference, 
  DEMO_USER 
} from '../mocks/data';

/**
 * API Service Layer - SIPADI
 * 
 * ARSITEKTUR INTEGRASI:
 * Saat ini fungsi-fungsi di bawah menggunakan data simulasi (mock) terpusat.
 * Ketika backend Python FastAPI / Database PostgreSQL telah siap, cukup ubah implementasi fungsi
 * di bawah untuk memanggil endpoint API (misal dengan axios atau fetch),
 * TANPA perlu merombak komponen UI sama sekali.
 */

const SIMULATED_LATENCY_MS = 250;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  // 1. Data Monitoring Agroklimat & Tren
  async getMonitoringData(regionId: string, year: number): Promise<MonitoringData> {
    await delay(SIMULATED_LATENCY_MS);
    return getMockMonitoringData(regionId, year);
  },

  // 2. Data Explainable AI (SHAP Contributions)
  async getShapData(regionId: string, year: number): Promise<ShapAnalysisData> {
    await delay(SIMULATED_LATENCY_MS);
    return getMockShapData(regionId, year);
  },

  // 3. Data Explainable AI (ALE Response Curves)
  async getAleData(feature: 'ndvi' | 'lst' | 'rainfall'): Promise<AleFeatureData> {
    await delay(SIMULATED_LATENCY_MS);
    return getMockAleData(feature);
  },

  // 4. Data Sintesis Insight & Peta Petak Sawah
  async getInsightData(regionId: string, year: number): Promise<InsightData> {
    await delay(SIMULATED_LATENCY_MS);
    return getMockInsightData(regionId, year);
  },

  // 5. Eksekusi Inferensi Model Machine Learning (Prediksi Kustom)
  // Endpoint masa depan: POST http://localhost:8000/api/predict
  async predictYield(payload: PredictionInputPayload): Promise<PredictionResult> {
    return simulateMachineLearningInference(payload);
  },

  // 6. Autentikasi Demo
  async loginDemo(email: string): Promise<UserProfile> {
    await delay(400);
    return {
      ...DEMO_USER,
      email: email || DEMO_USER.email,
    };
  },
};
