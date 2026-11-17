import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ModelChartPoint {
  period: string;
  actual?: number | null;
  prediction?: number | null;
  baseline?: number | null;
  tuned?: number | null;
  baselineError?: number | null;
  tunedError?: number | null;
}

interface ModelSeries {
  key: 'prediction' | 'baseline' | 'tuned' | 'baselineError' | 'tunedError';
  name: string;
  color: string;
}

interface ModelChartProps {
  data: ModelChartPoint[];
  series: ModelSeries[];
  unit: string;
}

export const ModelPredictionChart: React.FC<ModelChartProps> = ({
  data,
  series,
  unit,
}) => (
  <div className="h-72 w-full sm:h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D8E3CC" />
        <XAxis dataKey="period" stroke="#5F7061" fontSize={11} />
        <YAxis
          stroke="#5F7061"
          fontSize={11}
          unit={` ${unit}`}
          domain={['auto', 'auto']}
        />
        <Tooltip />
        <Legend />
        {data.some((point) => point.actual !== undefined) && (
          <Line
            type="monotone"
            dataKey="actual"
            name="Produktivitas aktual"
            stroke="#164A32"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        )}
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.name}
            stroke={item.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const ModelErrorChart: React.FC<Omit<ModelChartProps, 'unit'>> = ({
  data,
  series,
}) => (
  <div className="h-64 w-full sm:h-72">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D8E3CC" />
        <XAxis dataKey="period" stroke="#5F7061" fontSize={11} />
        <YAxis stroke="#5F7061" fontSize={11} unit=" ku/ha" />
        <ReferenceLine y={0} stroke="#5F7061" strokeDasharray="4 4" />
        <Tooltip />
        <Legend />
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.name}
            stroke={item.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);
