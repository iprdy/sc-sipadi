import React from 'react';
import { ShapAnalysisData } from '../../types';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface ShapContributionChartProps {
  data: ShapAnalysisData;
}

export const ShapContributionChart: React.FC<ShapContributionChartProps> = ({ data }) => {
  const maxImpact = Math.max(...data.features.map((f) => Math.abs(f.shapValue)), 0.35);

  return (
    <div className="flex flex-col gap-6">
      {/* SHAP Waterfall / Diverging Bar Container */}
      <div className="flex flex-col gap-3.5">
        {data.features.map((item) => {
          const isPositive = item.shapValue >= 0;
          const percentageWidth = (Math.abs(item.shapValue) / maxImpact) * 100;

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-[#FFFDF7] border border-[#D8E3CC] hover:border-[#287A4A] transition-all flex flex-col gap-2 group shadow-2xs"
            >
              {/* Feature Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isPositive ? 'bg-[#4D9568]' : 'bg-[#C96F5F]'
                    }`}
                  />
                  <strong className="text-[#164A32] text-sm">{item.name}</strong>
                  <span className="text-[#5F7061] text-[11px] bg-[#EDF4E5] px-2 py-0.5 rounded-md font-medium">
                    Nilai: {item.featureValue}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-bold">
                  {isPositive ? (
                    <span className="text-[#4D9568] flex items-center gap-1 bg-[#4D9568]/10 px-2 py-0.5 rounded-md text-xs">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{item.shapValue.toFixed(2)} {item.unit}
                    </span>
                  ) : (
                    <span className="text-[#C96F5F] flex items-center gap-1 bg-[#C96F5F]/10 px-2 py-0.5 rounded-md text-xs">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {item.shapValue.toFixed(2)} {item.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Bar visualization */}
              <div className="w-full h-3 bg-[#EDF4E5] rounded-full overflow-hidden relative flex">
                {/* Center Baseline line at 50% */}
                <div className="w-1/2 h-full flex justify-end">
                  {!isPositive && (
                    <div
                      style={{ width: `${percentageWidth}%` }}
                      className="h-full bg-[#C96F5F] rounded-l-full transition-all duration-500"
                    />
                  )}
                </div>
                <div className="w-0.5 h-full bg-[#164A32]/40 z-10" />
                <div className="w-1/2 h-full flex justify-start">
                  {isPositive && (
                    <div
                      style={{ width: `${percentageWidth}%` }}
                      className="h-full bg-[#4D9568] rounded-r-full transition-all duration-500"
                    />
                  )}
                </div>
              </div>

              {/* Physical Interpretation Context */}
              <p className="text-[11px] text-[#5F7061] leading-relaxed pt-0.5 flex items-start gap-1.5">
                <span className="font-semibold text-[#164A32] shrink-0">Interpretasi:</span>
                <span>{item.interpretation}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Baseline to Prediction Summary Footer */}
      <div className="p-4 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[#5F7061] text-[11px]">Nilai Rerata Baseline (E[f(x)])</span>
            <strong className="text-[#164A32] text-sm">{data.baseValue} ton/ha</strong>
          </div>
          <span className="w-5 h-5 rounded-md bg-white border border-[#C8DDAF] flex items-center justify-center text-xs font-bold text-[#287A4A] shadow-2xs">
            +
          </span>
          <div className="flex flex-col">
            <span className="text-[#5F7061] text-[11px]">Net Kontribusi SHAP</span>
            <strong className="text-[#4D9568] text-sm">
              +{(data.predictedValue - data.baseValue).toFixed(2)} ton/ha
            </strong>
          </div>
          <span className="w-5 h-5 rounded-md bg-white border border-[#C8DDAF] flex items-center justify-center text-xs font-bold text-[#287A4A] shadow-2xs">
            =
          </span>
          <div className="flex flex-col">
            <span className="text-[#5F7061] text-[11px]">Estimasi Akhir Model (f(x))</span>
            <strong className="text-[#164A32] text-base font-extrabold">{data.predictedValue} ton/ha</strong>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#5F7061]">
          <HelpCircle className="w-3.5 h-3.5 text-[#287A4A]" />
          <span>SHAP TreeExplainer terkalibrasi XGBoost</span>
        </div>
      </div>
    </div>
  );
};
