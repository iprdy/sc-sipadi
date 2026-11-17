import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apiService } from '../services/apiService';
import { ModelKey, TrainingRun } from '../types';

interface ModelRunContextType {
  selectedRunId: string | null;
  selectedModelKey: ModelKey | null;
  selectedUploadBatchId: string | null;
  selectedRun: TrainingRun | null;
  availableRuns: TrainingRun[];
  loading: boolean;
  error: string | null;
  selectRun: (runId: string) => void;
  selectModelKey: (modelKey: ModelKey) => void;
  refreshRuns: (preferredBatchId?: string) => Promise<TrainingRun[]>;
}

const ModelRunContext = createContext<ModelRunContextType | undefined>(undefined);

function findLatestCompleteBatch(
  runs: TrainingRun[],
  preferredBatchId?: string,
): TrainingRun[] {
  const batches = new Map<string, TrainingRun[]>();
  for (const run of runs) {
    if (!run.uploadBatchId || !run.modelKey) continue;
    const batch = batches.get(run.uploadBatchId) || [];
    batch.push(run);
    batches.set(run.uploadBatchId, batch);
  }

  const completeBatches = [...batches.entries()]
    .map(([batchId, batchRuns]) => {
      const baseline = batchRuns.find((run) => run.modelKey === 'xgboost_baseline');
      const tuned = batchRuns.find((run) => run.modelKey === 'xgboost_tuned');
      return baseline && tuned
        ? { batchId, baseline, tuned, batchRuns }
        : null;
    })
    .filter((batch): batch is NonNullable<typeof batch> => batch !== null)
    .sort((left, right) => {
      const leftTime = Date.parse(left.baseline.createdAt || left.tuned.createdAt || '') || 0;
      const rightTime = Date.parse(right.baseline.createdAt || right.tuned.createdAt || '') || 0;
      return rightTime - leftTime;
    });

  const selectedBatch =
    completeBatches.find((batch) => batch.batchId === preferredBatchId) ||
    completeBatches[0];
  if (!selectedBatch) return [];
  return [selectedBatch.baseline, selectedBatch.tuned];
}

export const ModelRunProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableRuns, setAvailableRuns] = useState<TrainingRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRunIdRef.current = selectedRunId;
  }, [selectedRunId]);

  const applyRuns = useCallback((runs: TrainingRun[], preferredBatchId?: string) => {
    const pair = findLatestCompleteBatch(runs, preferredBatchId);
    setError(null);
    setAvailableRuns(pair);
    const currentSelection = pair.find(
      (run) => run.runId === selectedRunIdRef.current,
    );
    const baseline = pair.find((run) => run.modelKey === 'xgboost_baseline');
    const preserveSelection =
      currentSelection &&
      (!preferredBatchId || currentSelection.uploadBatchId === preferredBatchId);
    const nextSelection = preserveSelection ? currentSelection : baseline;
    setSelectedRunId(nextSelection?.runId || null);
    if (!pair.length) {
      setError(
        runs.length
          ? 'Belum ada batch upload dengan pasangan XGBoost Baseline dan Tuned yang lengkap.'
          : 'Belum ada training run yang tersedia.',
      );
    }
    return pair;
  }, []);

  const refreshRuns = useCallback(async (preferredBatchId?: string) => {
    try {
      const runs = await apiService.getRuns();
      return applyRuns(runs, preferredBatchId);
    } catch (reason) {
      setAvailableRuns([]);
      setSelectedRunId(null);
      const message =
        reason instanceof Error ? reason.message : 'Daftar training run gagal dimuat.';
      setError(message);
      throw reason;
    } finally {
      setLoading(false);
    }
  }, [applyRuns]);

  useEffect(() => {
    let active = true;
    apiService.getRuns()
      .then((runs) => {
        if (active) applyRuns(runs);
      })
      .catch((reason: unknown) => {
        if (active) {
          setAvailableRuns([]);
          setSelectedRunId(null);
          setError(
            reason instanceof Error ? reason.message : 'Daftar training run gagal dimuat.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyRuns]);

  const selectRun = useCallback(
    (runId: string) => {
      const run = availableRuns.find((candidate) => candidate.runId === runId);
      if (!run) {
        setError('Run yang dipilih tidak tersedia. Silakan pilih run dari batch yang tersedia.');
        return;
      }
      setSelectedRunId(run.runId);
      setError(null);
    },
    [availableRuns],
  );

  const selectModelKey = useCallback(
    (modelKey: ModelKey) => {
      const run = availableRuns.find((candidate) => candidate.modelKey === modelKey);
      if (!run) {
        setError('Model tersebut tidak tersedia pada batch upload terpilih.');
        return;
      }
      setSelectedRunId(run.runId);
      setError(null);
    },
    [availableRuns],
  );

  const selectedRun = useMemo(
    () => availableRuns.find((run) => run.runId === selectedRunId) || null,
    [availableRuns, selectedRunId],
  );

  const value = useMemo<ModelRunContextType>(
    () => ({
      selectedRunId,
      selectedModelKey: selectedRun?.modelKey || null,
      selectedUploadBatchId: selectedRun?.uploadBatchId || null,
      selectedRun,
      availableRuns,
      loading,
      error,
      selectRun,
      selectModelKey,
      refreshRuns,
    }),
    [
      selectedRunId,
      selectedRun,
      availableRuns,
      loading,
      error,
      selectRun,
      selectModelKey,
      refreshRuns,
    ],
  );

  return <ModelRunContext.Provider value={value}>{children}</ModelRunContext.Provider>;
};

export const useModelRun = () => {
  const context = useContext(ModelRunContext);
  if (!context) {
    throw new Error('useModelRun must be used within a ModelRunProvider');
  }
  return context;
};
