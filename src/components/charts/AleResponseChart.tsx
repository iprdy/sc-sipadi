import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { AleFeatureData } from '../../types';
import { Info, Sparkles } from 'lucide-react';

interface AleResponseChartProps {
  data: AleFeatureData;
  activeFeature: 'ndvi' | 'lst' | 'rainfall';
  onSelectFeature: (feature: 'ndvi' | 'lst' | 'rainfall') => void;
}

export const AleResponseChart: React.FC<AleResponseChartProps> = ({
  data,
  activeFeature,
  onSelectFeature,
}) => {
  const tabs = [
    { key: 'ndvi' as const, label: 'NDVI (Kerapatan Kanopi)' },
    { key: 'lst' as const, label: 'LST (Suhu Permukaan °C)' },
    { key: 'rainfall' as const, label: 'Curah Hujan (mm)' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Feature Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D8E3CC] pb-3 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeFeature === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectFeature(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#164A32] text-white shadow-sm ring-2 ring-[#287A4A]'
                  : 'bg-[#FFFDF7] text-[#5F7061] hover:text-[#164A32] hover:bg-[#EDF4E5] border border-[#D8E3CC]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Chart Canvas */}
      <div className="bg-[#FFFDF7] p-5 rounded-2xl border border-[#D8E3CC] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div>
            <h4 className="font-extrabold text-[#164A32] text-sm">{data.featureTitle}</h4>
            <span className="text-[#5F7061]">Kurva Efek Marjinal Terakumulasi Lokal (ALE 1D)</span>
          </div>
          <div className="flex items-center gap-2 bg-[#EDF4E5] border border-[#C8DDAF] px-3 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#287A4A]" />
            <span className="text-[#164A32] font-semibold">
              Nilai Observasi Terpilih:{' '}
              <strong className="text-[#287A4A]">
                {data.currentObservedValue} {data.unit}
              </strong>
            </span>
          </div>
        </div>

        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dataPoints} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2EAD8" />
              <XAxis
                dataKey="featureValue"
                stroke="#5F7061"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#D8E3CC' }}
                unit={` ${data.unit.includes('°C') ? '°C' : data.unit.includes('mm') ? 'mm' : ''}`}
              />
              <YAxis
                stroke="#5F7061"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#D8E3CC' }}
                unit=" t/ha"
              />
              <ReferenceLine y={0} stroke="#164A32" strokeWidth={1.5} strokeDasharray="4 4" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload;
                    const effect = Number(pt.aleEffect);
                    return (
                      <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#D8E3CC] shadow-md text-xs font-sans">
                        <p className="font-bold text-[#164A32] mb-1">
                          Nilai Fitur: {pt.featureValue} {data.unit}
                        </p>
                        <p className={`font-semibold ${effect >= 0 ? 'text-[#4D9568]' : 'text-[#C96F5F]'}`}>
                          Efek ALE Terhadap Yield: {effect >= 0 ? `+${effect.toFixed(2)}` : effect.toFixed(2)} ton/ha
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="aleEffect"
                stroke="#287A4A"
                strokeWidth={3}
                dot={{ r: 4, fill: '#287A4A', stroke: '#FFFDF7', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#164A32' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Interpretation Box */}
        <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] flex items-start gap-3 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-[#287A4A] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <strong className="text-[#164A32]">Analisis Perilaku Model (Accumulated Local Effects):</strong>
            <p className="text-[#5F7061]">{data.summaryText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
