import React from 'react';
import { ShapAnalysisData } from '../../types';

interface ShapContributionChartProps {
  data: ShapAnalysisData;
}

export const ShapContributionChart: React.FC<ShapContributionChartProps> = ({ data }) => {
  const maxImportance = Math.max(...data.features.map((feature) => feature.importance), 0);

  if (!data.features.length) {
    return (
      <p className="text-sm text-[#5F7061]">
        Analisis SHAP tidak tersedia pada training run ini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.features.map((feature) => (
        <div key={feature.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <strong className="text-[#164A32]">{feature.name}</strong>
            <span className="text-[#5F7061]">
              {feature.importance.toFixed(4)} ku/ha · {feature.importancePct.toFixed(2)}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-[#EDF4E5]">
            <div
              className="h-3 rounded-full bg-[#287A4A]"
              style={{
                width: `${maxImportance > 0 ? (feature.importance / maxImportance) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
      <p className="border-t border-[#D8E3CC] pt-3 text-[11px] text-[#5F7061]">
        Mean absolute SHAP agregat training run {data.runId} ({data.modelName}).
        Nilai ini tidak menunjukkan arah dampak lokal maupun atribusi untuk wilayah/tahun tertentu.
      </p>
    </div>
  );
};
