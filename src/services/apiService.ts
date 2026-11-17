import {
  AleFeatureData,
  ArtifactStatus,
  InsightData,
  ModelKey,
  ModelMetrics,
  ModelParameters,
  ModelPrediction,
  ModelPredictionResponse,
  MonitoringData,
  PredictionInputPayload,
  PredictionResult,
  RegionId,
  RunAnalysis,
  TrainingRun,
  UploadBatch,
  UploadBatchRun,
} from '../types';

const API_BASE_URL = '/api';

interface ApiError {
  detail?: unknown;
}

interface RunResponse {
  id?: string;
  run_id?: string;
  model_key?: string | null;
  best_model?: string;
  model_name?: string;
  upload_batch_id?: string | null;
  filename?: string;
  created_at?: string | null;
  rows?: number;
  supervised_rows?: number;
  model_params?: ModelParameters | null;
  validation_scheme?: string | null;
  temporal_validation_metrics?: ModelMetrics | null;
  final_test_metrics?: ModelMetrics | null;
  artifact_status?: string;
  shap?: Array<{
    feature: string;
    displayName?: string;
    importance: number;
    importance_pct?: number;
  }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const data = await response.json().catch((): ApiError => ({}));
  if (!response.ok) {
    const detail = (data as ApiError).detail;
    throw new Error(
      typeof detail === 'string' ? detail : 'Permintaan ke backend gagal.',
    );
  }
  return data as T;
}

function isModelKey(value: unknown): value is ModelKey {
  return value === 'xgboost_baseline' || value === 'xgboost_tuned';
}

function mapRun(run: RunResponse): TrainingRun {
  const runId = run.run_id || run.id;
  if (!runId) {
    throw new Error('Respons daftar run tidak memuat id atau run_id.');
  }
  return {
    id: run.id || runId,
    runId,
    modelKey: isModelKey(run.model_key) ? run.model_key : null,
    modelName: run.model_name || run.best_model || 'Model tidak diketahui',
    uploadBatchId: run.upload_batch_id || null,
    filename: run.filename || '—',
    createdAt: run.created_at || null,
    rows: run.rows ?? 0,
    supervisedRows: run.supervised_rows ?? 0,
    modelParams: run.model_params || null,
    validationScheme: run.validation_scheme || null,
    temporalValidationMetrics: run.temporal_validation_metrics || null,
    finalTestMetrics: run.final_test_metrics || null,
    artifactStatus:
      run.artifact_status === 'available' || run.artifact_status === 'missing'
        ? run.artifact_status
        : 'unknown',
    shapFeatures: (run.shap || []).map((feature) => ({
      id: feature.feature,
      name: feature.displayName || feature.feature,
      importance: feature.importance,
      importancePct: feature.importance_pct ?? 0,
    })),
  };
}

function metric(value: number | null, unit: string) {
  return {
    value,
    unit,
    statusText: '',
    statusType: 'normal' as const,
    description: '',
  };
}

function toAleFeatureKey(value: string): AleFeatureData['featureKey'] | null {
  switch (value.toLowerCase()) {
    case 'ndvi':
      return 'ndvi';
    case 'lst':
      return 'lst';
    case 'rainfall':
      return 'rainfall';
    case 'produktivitas_lag1':
      return 'produktivitas_lag1';
    case 'produktivitas_roll3_lag1':
      return 'produktivitas_roll3_lag1';
    default:
      return null;
  }
}

interface ApiRunPredictionResponse {
  run_id: string;
  upload_batch_id: string | null;
  model_key: string | null;
  predictions: ModelPrediction[];
  count: number;
}

interface ApiAnalysisResponse {
  run_id: string;
  model_key: string | null;
  model_name: string;
  validation_scheme: string | null;
  feature_importance_scope: string;
  ale_scope: string;
  features: Array<{
    feature: string;
    displayName?: string;
    importance: number;
    importance_pct: number;
  }>;
  ale: Record<
    string,
    {
      featureTitle: string;
      unit: string;
      currentObservedValue: number | null;
      baseline: number | null;
      summaryText: string;
      dataPoints: Array<{
        featureValue: number;
        aleEffect: number;
        observationCount?: number;
      }>;
    }
  >;
}

export const apiService = {
  async getRuns(): Promise<TrainingRun[]> {
    const data = await request<{ runs: RunResponse[] }>('/runs');
    return data.runs.map(mapRun);
  },

  async getRunsByBatch(uploadBatchId: string): Promise<TrainingRun[]> {
    const params = new URLSearchParams({ upload_batch_id: uploadBatchId });
    const data = await request<{ runs: RunResponse[] }>(`/runs?${params}`);
    return data.runs.map(mapRun);
  },

  async getRunPredictions(
    runId: string,
    kabupaten?: string,
  ): Promise<ModelPredictionResponse> {
    const params = new URLSearchParams();
    if (kabupaten) params.set('kabupaten', kabupaten);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    const data = await request<ApiRunPredictionResponse>(
      `/runs/${encodeURIComponent(runId)}/predictions${suffix}`,
    );
    return {
      runId: data.run_id,
      uploadBatchId: data.upload_batch_id,
      modelKey: isModelKey(data.model_key) ? data.model_key : null,
      predictions: data.predictions,
      count: data.count,
    };
  },

  async getRunAnalysis(
    runId: string,
    regionId?: string,
    year?: number,
  ): Promise<RunAnalysis> {
    const params = new URLSearchParams({ run_id: runId });
    if (regionId) params.set('region', regionId);
    if (year !== undefined) params.set('year', String(year));
    const data = await request<ApiAnalysisResponse>(`/analysis/data?${params}`);
    const ale: AleFeatureData[] = [];

    for (const [feature, curve] of Object.entries(data.ale)) {
      const featureKey = toAleFeatureKey(feature);
      if (!featureKey) continue;
      ale.push({
        featureKey,
        featureTitle: curve.featureTitle,
        unit: curve.unit,
        currentObservedValue: curve.currentObservedValue,
        baseline: curve.baseline,
        summaryText: curve.summaryText,
        dataPoints: curve.dataPoints.map((point) => ({
          featureValue: point.featureValue,
          aleEffect: point.aleEffect,
          sampleDensity: point.observationCount,
        })),
      });
    }

    return {
      runId: data.run_id,
      modelKey: isModelKey(data.model_key) ? data.model_key : null,
      modelName: data.model_name,
      validationScheme: data.validation_scheme,
      featureImportanceScope: data.feature_importance_scope,
      aleScope: data.ale_scope,
      features: data.features.map((feature) => ({
        id: feature.feature,
        name: feature.displayName || feature.feature,
        importance: feature.importance,
        importancePct: feature.importance_pct,
      })),
      ale,
    };
  },

  async getRunMonitoring(
    runId: string,
    regionId: string,
    year: number,
  ): Promise<MonitoringData> {
    const params = new URLSearchParams({
      run_id: runId,
      region: regionId,
      year: String(year),
    });
    const data = await request<{
      count: number;
      run_id: string | null;
      model_key: string | null;
      region_name: string;
      year: number;
      averages: {
        productivity: number | null;
        ndvi: number | null;
        lst: number | null;
        rainfall: number | null;
      };
      trend: { year: number; realisasi: number | null; estimasi?: number | null }[];
      feature_importance: MonitoringData['featureImportance'];
    }>(`/monitoring/data?${params}`);

    return {
      count: data.count,
      runId: data.run_id,
      modelKey: isModelKey(data.model_key) ? data.model_key : null,
      regionId: regionId as RegionId,
      regionName: data.region_name,
      year: data.year,
      productivity: metric(data.averages.productivity, 'ton/ha'),
      ndvi: metric(data.averages.ndvi, 'indeks'),
      lst: metric(data.averages.lst, '°C'),
      rainfall: metric(data.averages.rainfall, 'mm'),
      trend: data.trend,
      featureImportance: data.feature_importance,
    };
  },

  async getRunInsight(
    runId: string,
    regionId: string,
    year: number,
  ): Promise<InsightData> {
    const params = new URLSearchParams({
      run_id: runId,
      region: regionId,
      year: String(year),
    });
    const data = await request<{
      year: number;
      run_id: string | null;
      model_key: string | null;
      region_name: string;
      observation_count: number;
      productivity_observation_count: number;
      averages: {
        productivity_ton_ha: number | null;
        ndvi: number | null;
        lst: number | null;
        rainfall: number | null;
      };
      headlineSummary?: string;
      harvestCategory?: 'Optimal' | 'Tinggi' | 'Waspada' | 'Rendah';
      harvestCategoryNote?: string;
      keyDrivers?: InsightData['keyDrivers'];
      parcels?: InsightData['parcels'];
      regional_ranking: {
        regionId?: string;
        name: string;
        rank?: number;
        avg_productivity_ton_ha: number | null;
        avg_ndvi?: number | null;
        avg_lst?: number | null;
        avg_rainfall?: number | null;
        samples: number;
      }[];
      monthly_observations?: {
        month: number;
        ndvi: number | null;
        lst: number | null;
        rainfall: number | null;
        productivity: number | null;
      }[];
      conclusion?: {
        evaluasiPanen: string;
        kondisiBiofisik: string;
        validasiXai: string;
        aksiLapangan: string;
      } | null;
      aiMeta?: {
        cached: boolean;
        generatedBy: string;
        generatedAt?: string | null;
      };
    }>(`/insight/data?${params}`);

    return {
      regionId: regionId as RegionId,
      year: data.year,
      runId: data.run_id,
      modelKey: isModelKey(data.model_key) ? data.model_key : null,
      regionName: data.region_name,
      observationCount: data.observation_count,
      productivityObservationCount: data.productivity_observation_count,
      averages: {
        productivityTonHa: data.averages.productivity_ton_ha,
        ndvi: data.averages.ndvi,
        lst: data.averages.lst,
        rainfall: data.averages.rainfall,
      },
      headlineSummary:
        data.headlineSummary ||
        `Rangkuman observasi agroklimat dan hasil panen padi untuk Kabupaten ${data.region_name} tahun ${data.year}.`,
      harvestCategory: data.harvestCategory || 'Optimal',
      harvestCategoryNote:
        data.harvestCategoryNote ||
        `Evaluasi produktivitas wilayah ${data.region_name} berdasarkan training run aktif.`,
      keyDrivers: data.keyDrivers || [],
      parcels: data.parcels || [],
      regionalRanking: (data.regional_ranking || []).map((item, idx) => ({
        regionId: (item.regionId || item.name.toLowerCase()) as RegionId,
        name: item.name,
        rank: item.rank ?? idx + 1,
        avgProductivityTonHa: item.avg_productivity_ton_ha,
        avgNdvi: item.avg_ndvi ?? null,
        avgLst: item.avg_lst ?? null,
        avgRainfall: item.avg_rainfall ?? null,
        samples: item.samples,
      })),
      monthlyObservations: data.monthly_observations || [],
      conclusion: data.conclusion ?? null,
      aiMeta: data.aiMeta || {
        cached: false,
        generatedBy: 'template_fallback',
        generatedAt: null,
      },
    };
  },

  async regenerateInsight(
    runId: string,
    regionId: string,
    year: number,
    token: string,
  ): Promise<InsightData> {
    const params = new URLSearchParams({
      run_id: runId,
      region: regionId,
      year: String(year),
    });
    const response = await fetch(`${API_BASE_URL}/admin/insight/regenerate?${params}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch((): ApiError => ({}));
      const detail = (err as ApiError).detail;
      throw new Error(
        typeof detail === 'string' ? detail : 'Gagal meregenerasi ringkasan AI.',
      );
    }
    return this.getRunInsight(runId, regionId, year);
  },

  async predictYield(
    payload: PredictionInputPayload,
    runId: string,
  ): Promise<PredictionResult> {
    const data = await request<{
      prediction: number;
      prediction_ton_ha: number;
      model: string;
      model_key: string | null;
      run_id: string;
      features: Record<string, string | number>;
    }>('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        run_id: runId,
        kabupaten: payload.regionId,
        tahun: payload.year,
        bulan: payload.month,
        ndvi: payload.ndvi,
        lst: payload.lst,
        rainfall: payload.rainfall,
      }),
    });

    return {
      predictedYieldKuHa: data.prediction,
      predictedYieldTonHa: data.prediction_ton_ha,
      modelName: data.model,
      modelKey: isModelKey(data.model_key) ? data.model_key : null,
      runId: data.run_id,
      features: data.features,
    };
  },

  async uploadDataset(file: File, token: string): Promise<UploadBatch> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/admin/datasets/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json().catch((): ApiError => ({}));
    if (!response.ok) {
      const detail = (data as ApiError).detail;
      throw new Error(
        typeof detail === 'string' ? detail : 'Pelatihan model gagal diproses oleh server.',
      );
    }

    const result = data as {
      id: string;
      upload_batch_id: string;
      filename: string;
      rows: number;
      supervised_rows: number;
      runs: Array<{
        id: string;
        model_key: string;
        model_name: string;
        model_params: ModelParameters | null;
        temporal_validation_metrics: ModelMetrics | null;
        final_test_metrics: ModelMetrics | null;
      }>;
    };
    if (!result.upload_batch_id || !Array.isArray(result.runs)) {
      throw new Error('Respons upload tidak memuat upload_batch_id dan daftar run.');
    }
    const runs: UploadBatchRun[] = result.runs.map((run) => {
      if (!isModelKey(run.model_key)) {
        throw new Error('Respons upload memuat model_key yang tidak dikenal.');
      }
      return {
        id: run.id,
        modelKey: run.model_key,
        modelName: run.model_name,
        modelParams: run.model_params,
        temporalValidationMetrics: run.temporal_validation_metrics,
        finalTestMetrics: run.final_test_metrics,
      };
    });
    return {
      id: result.id,
      uploadBatchId: result.upload_batch_id,
      filename: result.filename,
      rows: result.rows,
      supervisedRows: result.supervised_rows,
      runs,
    };
  },
};

export type { ArtifactStatus };
