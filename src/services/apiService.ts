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
 * Terhubung ke backend FastAPI (http://localhost:8000/api).
 * Jika backend sedang offline, sistem otomatis beralih ke mock data (graceful fallback)
 * sehingga aplikasi tidak pernah macet atau menampilkan layar kosong.
 */

const API_BASE_URL = '/api';
const SIMULATED_LATENCY_MS = 250;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  // 1. Data Monitoring Agroklimat & Tren
  async getMonitoringData(regionId: string, year: number): Promise<MonitoringData> {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/data?region=${regionId}&year=${year}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error('API monitoring unavailable');
      const data = await response.json();
      
      const baseMock = getMockMonitoringData(regionId, year);
      if (data.count > 0 && data.averages) {
        // Enrich with real aggregated stats & trend from database
        return {
          ...baseMock,
          regionName: data.region_name || baseMock.regionName,
          productivity: {
            ...baseMock.productivity,
            value: data.averages.productivity,
          },
          ndvi: {
            ...baseMock.ndvi,
            value: data.averages.ndvi,
          },
          lst: {
            ...baseMock.lst,
            value: data.averages.lst,
          },
          rainfall: {
            ...baseMock.rainfall,
            value: data.averages.rainfall,
          },
          trend: data.trend && data.trend.length > 0 ? data.trend : baseMock.trend,
          featureImportance:
            data.feature_importance && data.feature_importance.length > 0
              ? data.feature_importance
              : baseMock.featureImportance,
        };
      }
      return baseMock;
    } catch {
      await delay(SIMULATED_LATENCY_MS);
      return getMockMonitoringData(regionId, year);
    }
  },

  // 2. Data Explainable AI (SHAP Contributions)
  async getShapData(regionId: string, year: number): Promise<ShapAnalysisData> {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/data?region=${regionId}&year=${year}`);
      if (!response.ok) throw new Error('Backend Analysis API unavailable');
      const data = await response.json();
      if (!data || !data.features) throw new Error('Invalid analysis payload');

      return {
        baseValue: data.base_value,
        predictedValue: data.predicted_value,
        features: data.features,
      };
    } catch {
      await delay(SIMULATED_LATENCY_MS);
      return getMockShapData(regionId, year);
    }
  },

  // 3. Data Explainable AI (ALE Response Curves)
  async getAleData(
    feature: 'ndvi' | 'lst' | 'rainfall',
    regionId?: string,
    year?: number
  ): Promise<AleFeatureData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analysis/data?region=${regionId || 'tabanan'}&year=${year || 2024}`
      );
      if (!response.ok) throw new Error('Backend ALE API unavailable');
      const data = await response.json();
      if (data?.ale && data.ale[feature]) {
        return data.ale[feature];
      }
      throw new Error('No feature ALE data');
    } catch {
      await delay(SIMULATED_LATENCY_MS);
      return getMockAleData(feature);
    }
  },

  // 4. Data Sintesis Insight & Peta Lahan
  async getInsightData(regionId: string, year: number): Promise<InsightData> {
    try {
      const response = await fetch(`${API_BASE_URL}/insight/data?region=${regionId}&year=${year}`);
      if (!response.ok) throw new Error('Insight API unavailable');
      const data = await response.json();

      if (data.selected_region) {
        return {
          regionId: regionId as any,
          year: data.year,
          headlineSummary: data.headlineSummary,
          harvestCategory: data.harvestCategory,
          harvestCategoryNote: data.harvestCategoryNote,
          keyDrivers: data.keyDrivers || [],
          parcels: data.parcels || [],
          regionalRanking: (data.regional_ranking || []).map((r: {
            regionId: string;
            name: string;
            rank: number;
            avg_productivity_ton_ha: number;
            avg_ndvi: number;
            avg_lst: number;
            avg_rainfall: number;
            samples: number;
          }) => ({
            regionId: r.regionId,
            name: r.name,
            rank: r.rank,
            avgProductivityTonHa: r.avg_productivity_ton_ha,
            avgNdvi: r.avg_ndvi,
            avgLst: r.avg_lst,
            avgRainfall: r.avg_rainfall,
            samples: r.samples,
          })),
          monthlyObservations: data.monthly_observations || [],
        };
      }
      return getMockInsightData(regionId, year);
    } catch {
      await delay(SIMULATED_LATENCY_MS);
      return getMockInsightData(regionId, year);
    }
  },

  // 5. Eksekusi Inferensi Model Machine Learning (Prediksi Kustom)
  async predictYield(payload: PredictionInputPayload): Promise<PredictionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ndvi: payload.ndvi,
          lst: payload.lst,
          rainfall: payload.rainfall,
        }),
      });

      if (!response.ok) throw new Error('Prediksi API backend gagal');
      const data = await response.json();

      // Convert from ku/ha to ton/ha if > 20 (standard agricultural conversion 10 ku = 1 ton)
      const tonHa = data.prediction > 20 
        ? Number((data.prediction / 10).toFixed(2)) 
        : Number(data.prediction.toFixed(2));

      return {
        predictedYieldTonHa: tonHa,
        confidenceScore: 0.92,
        statusCategory: tonHa >= 5.5 ? 'Optimal' : tonHa >= 4.5 ? 'Tinggi' : 'Waspada',
        shapContribution: [
          { feature: 'NDVI Kanopi Padi', impact: 0.38 },
          { feature: 'Curah Hujan Musiman', impact: -0.18 },
          { feature: 'Suhu Permukaan (LST)', impact: 0.12 },
        ],
        recommendations: [
          `Inferensi diproses secara live oleh model ${data.model} (FastAPI Backend)`,
          'Kondisi agroklimat menunjukkan indikasi pertumbuhan tanaman yang terukur',
          'Pertahankan manajemen tata kelola air secara berkala untuk menjaga kelembapan tanah',
        ],
        simulatedTimestamp: new Date().toLocaleString('id-ID'),
      };
    } catch {
      return simulateMachineLearningInference(payload);
    }
  },

  // 6. Autentikasi Demo & Admin
  async loginDemo(email: string): Promise<UserProfile> {
    await delay(400);
    return {
      ...DEMO_USER,
      email: email || DEMO_USER.email,
    };
  },
};
