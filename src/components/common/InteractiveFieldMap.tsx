import React, { useState } from 'react';
import { FieldParcel } from '../../types';
import { MapPin, User, Wheat, Droplets, Sparkles } from 'lucide-react';

interface InteractiveFieldMapProps {
  parcels: FieldParcel[];
  regionName: string;
}

export const InteractiveFieldMap: React.FC<InteractiveFieldMapProps> = ({
  parcels,
  regionName,
}) => {
  const [selectedParcel, setSelectedParcel] = useState<FieldParcel | null>(parcels[0] || null);

  const getCategoryColor = (cat: FieldParcel['category']) => {
    switch (cat) {
      case 'Tinggi':
        return {
          fill: '#287A4A',
          border: '#164A32',
          badgeBg: '#EDF4E5',
          badgeText: '#287A4A',
        };
      case 'Optimal':
        return {
          fill: '#55A85F',
          border: '#287A4A',
          badgeBg: '#EDF4E5',
          badgeText: '#55A85F',
        };
      case 'Rendah':
        return {
          fill: '#C96F5F',
          border: '#A84E3F',
          badgeBg: '#FFDAD6',
          badgeText: '#C96F5F',
        };
      default:
        return {
          fill: '#55A85F',
          border: '#287A4A',
          badgeBg: '#EDF4E5',
          badgeText: '#55A85F',
        };
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-[#FFFDF7] p-5 sm:p-6 rounded-2xl border border-[#D8E3CC] shadow-xs">
      {/* Interactive Cartographic Grid */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#287A4A]" />
            <h4 className="font-extrabold text-[#164A32] text-sm">
              Distribusi Spasial Petak Sawah Lahan Padi — {regionName}
            </h4>
          </div>
          <span className="text-[11px] text-[#5F7061] bg-[#EDF4E5] px-2.5 py-0.5 rounded-full font-medium border border-[#C8DDAF]">
            Klik petak untuk detail agronomis
          </span>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full aspect-16/9 bg-[#F0EADB] rounded-xl border border-[#D8E3CC] overflow-hidden p-2 flex items-center justify-center shadow-inner">
          <svg className="w-full h-full" viewBox="0 0 550 280">
            {/* Grid pattern */}
            <defs>
              <pattern id="cartoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E3DCBA" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cartoGrid)" />

            {/* Irrigation Stream Line */}
            <path
              d="M 10 135 C 150 135, 200 135, 540 135"
              fill="none"
              stroke="#4D9FC1"
              strokeWidth="4"
              strokeDasharray="6 4"
            />
            <text x="470" y="128" fill="#4D9FC1" fontSize="9" fontWeight="bold">
              Saluran Irigasi
            </text>

            {/* Parcels */}
            {parcels.map((parcel) => {
              const colors = getCategoryColor(parcel.category);
              const isSelected = selectedParcel?.id === parcel.id;

              return (
                <g
                  key={parcel.id}
                  onClick={() => setSelectedParcel(parcel)}
                  className="cursor-pointer transition-all hover:opacity-90"
                >
                  <rect
                    x={parcel.coordinates.x}
                    y={parcel.coordinates.y}
                    width={parcel.coordinates.width}
                    height={parcel.coordinates.height}
                    rx="8"
                    fill={colors.fill}
                    fillOpacity={isSelected ? 0.95 : 0.75}
                    stroke={isSelected ? '#164A32' : colors.border}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all"
                  />
                  {/* Parcel label */}
                  <text
                    x={parcel.coordinates.x + 10}
                    y={parcel.coordinates.y + 24}
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {parcel.fieldName.split('-')[1]?.trim() || parcel.fieldName}
                  </text>
                  <text
                    x={parcel.coordinates.x + 10}
                    y={parcel.coordinates.y + 44}
                    fill="#FFFDF7"
                    fontSize="13"
                    fontWeight="800"
                    className="select-none pointer-events-none"
                  >
                    {parcel.estimatedYield} t/ha
                  </text>
                  <text
                    x={parcel.coordinates.x + 10}
                    y={parcel.coordinates.y + 64}
                    fill="#E8F5E9"
                    fontSize="9.5"
                    className="select-none pointer-events-none"
                  >
                    {parcel.variety}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs pt-1">
          <span className="text-[#5F7061] font-semibold text-[11px]">Legenda Produktivitas:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#287A4A]" />
            <span className="text-[#164A32]">Tinggi (&gt; 5.4 ton/ha)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#55A85F]" />
            <span className="text-[#164A32]">Optimal (4.8 - 5.4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#C96F5F]" />
            <span className="text-[#164A32]">Waspada / Rendah (&lt; 4.8)</span>
          </div>
        </div>
      </div>

      {/* Selected Parcel Inspector Panel */}
      {selectedParcel && (
        <div className="w-full lg:w-72 bg-[#FAF7F0] p-4 rounded-xl border border-[#D8E3CC] flex flex-col justify-between shadow-2xs">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#55A85F] uppercase tracking-wider">
                  Detail Petak Sawah
                </span>
                <h5 className="font-extrabold text-[#164A32] text-sm mt-0.5">
                  {selectedParcel.fieldName}
                </h5>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-[#D8E3CC] flex items-center justify-between">
              <span className="text-xs text-[#5F7061]">Estimasi Hasil:</span>
              <span className="text-lg font-black text-[#164A32]">
                {selectedParcel.estimatedYield}{' '}
                <small className="text-xs font-semibold text-[#5F7061]">ton/ha</small>
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#D8E3CC]/60 pb-1.5">
                <span className="text-[#5F7061] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#287A4A]" />
                  Petani Penggarap:
                </span>
                <strong className="text-[#164A32]">{selectedParcel.farmer}</strong>
              </div>

              <div className="flex items-center justify-between border-b border-[#D8E3CC]/60 pb-1.5">
                <span className="text-[#5F7061] flex items-center gap-1.5">
                  <Wheat className="w-3.5 h-3.5 text-[#287A4A]" />
                  Varietas Padi:
                </span>
                <strong className="text-[#164A32]">{selectedParcel.variety}</strong>
              </div>

              <div className="flex items-center justify-between border-b border-[#D8E3CC]/60 pb-1.5">
                <span className="text-[#5F7061]">Luas Petak:</span>
                <strong className="text-[#164A32]">{selectedParcel.areaHa} Hektar</strong>
              </div>

              <div className="flex items-center justify-between border-b border-[#D8E3CC]/60 pb-1.5">
                <span className="text-[#5F7061] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#55A85F]" />
                  Indeks NDVI:
                </span>
                <strong className="text-[#287A4A]">{selectedParcel.ndvi}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#5F7061] flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-[#4D9FC1]" />
                  Status Lengas Tanah:
                </span>
                <strong className="text-[#164A32]">{selectedParcel.soilMoisture}</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8E3CC] text-[10px] text-[#5F7061] leading-tight">
            Data geospasial petak terverifikasi citra multispektral Sentinel-2 resolusi spasial 10m.
          </div>
        </div>
      )}
    </div>
  );
};
