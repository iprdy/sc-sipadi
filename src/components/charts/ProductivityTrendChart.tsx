import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TrendItem {
  year: number;
  realisasi?: number;
  estimasi: number;
}

interface ProductivityTrendChartProps {
  data: TrendItem[];
}

export const ProductivityTrendChart: React.FC<ProductivityTrendChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#287A4A" stopOpacity={0.3} />
              <stop offset="60%" stopColor="#C8DDAF" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#C8DDAF" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D8E3CC" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#5F7061"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#D8E3CC' }}
          />
          <YAxis
            domain={[3.5, 6.0]}
            stroke="#5F7061"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#D8E3CC' }}
            unit=" t/ha"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as TrendItem;
                return (
                  <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#D8E3CC] shadow-md text-xs font-sans">
                    <p className="font-bold text-[#164A32] text-sm mb-1.5">Tahun {label}</p>
                    {item.realisasi !== undefined && (
                      <div className="flex items-center justify-between gap-4 py-0.5">
                        <span className="text-[#5F7061] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#164A32]" />
                          Realisasi Aktual:
                        </span>
                        <strong className="text-[#164A32]">{item.realisasi} ton/ha</strong>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4 py-0.5">
                      <span className="text-[#287A4A] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#55A85F]" />
                        Estimasi Model SIPADI:
                      </span>
                      <strong className="text-[#287A4A]">{item.estimasi} ton/ha</strong>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            formatter={(value) => (
              <span className="text-xs font-semibold text-[#164A32]">
                {value === 'realisasi' ? 'Realisasi BPS' : 'Estimasi Model XGBoost'}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="estimasi"
            stroke="#287A4A"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#trendGradient)"
            dot={{ r: 4, fill: '#287A4A', stroke: '#FFFDF7', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#164A32' }}
          />
          <Area
            type="monotone"
            dataKey="realisasi"
            stroke="#164A32"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={0}
            dot={{ r: 3, fill: '#164A32' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
