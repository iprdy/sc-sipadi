import React from 'react';
import { AgroklimatMetric } from '../../types';
import { CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  metric: AgroklimatMetric;
  variant: 'primary' | 'ndvi' | 'lst' | 'rainfall';
  badgeLabel?: string;
  secondaryInfo?: {
    label: string;
    value: string;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  metric,
  variant,
  badgeLabel,
  secondaryInfo,
}) => {
  if (variant === 'primary') {
    return (
      <div className="p-5 rounded-2xl bg-[#164A32] text-white flex flex-col justify-between shadow-sm relative overflow-hidden border border-[#287A4A] group hover:shadow-md transition-all">
        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-28 h-28 rounded-full bg-[#287A4A]/30 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#55A85F] animate-pulse" />
            <span className="text-[11px] font-extrabold text-[#C8DDAF] uppercase tracking-wider">
              {title}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#55A85F] bg-[#123825] px-2 py-0.5 rounded-full border border-[#287A4A]/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#55A85F]" />
            <span>Terkalibrasi</span>
          </span>
        </div>

        <div className="my-3 flex items-baseline gap-2 relative z-10">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            {metric.value.toFixed(2)}
          </span>
          <span className="text-sm font-bold text-[#C8DDAF]">{metric.unit}</span>
        </div>

        <div className="pt-3 border-t border-[#287A4A]/80 flex items-center justify-between text-xs relative z-10">
          <span className="text-[#A2C79A] text-[11px] font-medium">STATUS SIKLUS</span>
          <span className="font-extrabold text-[#55A85F] bg-[#123825] px-2 py-0.5 rounded border border-[#287A4A]/60">
            {metric.statusText} {metric.changePercentage ? `(+${metric.changePercentage}%)` : ''}
          </span>
        </div>
      </div>
    );
  }

  // Variant mappings for secondary cards
  const variantStyles = {
    ndvi: {
      bg: 'bg-[#EDF4E5]',
      border: 'border-[#C8DDAF]',
      titleColor: 'text-[#164A32]',
      dotColor: 'bg-[#55A85F]',
      valueColor: 'text-[#164A32]',
      badgeBg: 'bg-[#55A85F]/20 text-[#164A32]',
      subTextColor: 'text-[#5F7061]',
    },
    lst: {
      bg: 'bg-[#FAF5E6]',
      border: 'border-[#EADBAC]',
      titleColor: 'text-[#7E6A21]',
      dotColor: 'bg-[#C4A83F]',
      valueColor: 'text-[#7E6A21]',
      badgeBg: 'bg-[#C4A83F]/20 text-[#7E6A21]',
      subTextColor: 'text-[#7E6A21]/80',
    },
    rainfall: {
      bg: 'bg-[#EAF3F7]',
      border: 'border-[#BBD9E7]',
      titleColor: 'text-[#1E5D77]',
      dotColor: 'bg-[#4D9FC1]',
      valueColor: 'text-[#1E5D77]',
      badgeBg: 'bg-[#4D9FC1]/20 text-[#1E5D77]',
      subTextColor: 'text-[#1E5D77]/80',
    },
  }[variant];

  return (
    <div
      className={`p-5 rounded-2xl ${variantStyles.bg} border ${variantStyles.border} flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all group`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-extrabold ${variantStyles.titleColor} uppercase tracking-wider`}>
          {title}
        </span>
        <span className={`w-2.5 h-2.5 rounded-full ${variantStyles.dotColor}`} />
      </div>

      <div className="my-3 flex items-baseline gap-2">
        <span className={`text-3xl font-extrabold ${variantStyles.valueColor} tracking-tight`}>
          {metric.value}
        </span>
        <span className={`text-xs font-bold ${variantStyles.subTextColor}`}>{metric.unit}</span>
        {metric.statusText && (
          <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md ${variantStyles.badgeBg}`}>
            {metric.statusText}
          </span>
        )}
      </div>

      <div
        className={`pt-3 border-t ${variantStyles.border} flex items-center justify-between text-[11px] ${variantStyles.subTextColor}`}
      >
        <span>{secondaryInfo?.label || 'Kondisi Relatif'}</span>
        <strong className={`font-bold ${variantStyles.titleColor}`}>
          {secondaryInfo?.value || 'Adekuat'}
        </strong>
      </div>
    </div>
  );
};
