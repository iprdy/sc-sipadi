import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import baliRegenciesData from '../../data/baliRegencies.json';
import { MonthlyObservation, RegencyMapMetric, RegionId } from '../../types';
import {
  MapPin,
  Layers,
  RotateCcw,
  Sparkles,
  ThermometerSun,
  CloudRain,
  Trophy,
  CalendarDays,
} from 'lucide-react';

interface InteractiveFieldMapProps {
  selectedRegion: RegionId;
  regionName: string;
  selectedYear: number;
  regionalRanking: RegencyMapMetric[];
  monthlyObservations: MonthlyObservation[];
  onSelectRegion: (regionId: RegionId) => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const BALI_CENTER: [number, number] = [-8.4095, 115.1889];
const BALI_BOUNDS: L.LatLngBoundsExpression = [
  [-8.86, 114.42],
  [-8.05, 115.72],
];

const getYieldColor = (tonHa?: number | null) => {
  if (tonHa === undefined || tonHa === null) return '#55A85F';
  if (tonHa >= 6.2) return '#1B6B3A';
  if (tonHa >= 5.8) return '#287A4A';
  if (tonHa >= 5.2) return '#55A85F';
  return '#D97706';
};

const getShortRegencyName = (name: string) =>
  name.replace(/^Kabupaten\s+/i, '').replace(/^Kota\s+/i, '').trim();

export const InteractiveFieldMap: React.FC<InteractiveFieldMapProps> = ({
  selectedRegion,
  regionName,
  selectedYear,
  regionalRanking,
  monthlyObservations,
  onSelectRegion,
}) => {
  const [baseLayerMode, setBaseLayerMode] = useState<'satellite' | 'street'>('satellite');
  const [viewMode, setViewMode] = useState<'bali' | 'focused'>('focused');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRegionRef = useRef(onSelectRegion);

  useEffect(() => {
    onSelectRegionRef.current = onSelectRegion;
  }, [onSelectRegion]);

  // Build quick lookup map: regionId -> RegencyMapMetric
  const metricsByRegion = React.useMemo(() => {
    const map: Record<string, RegencyMapMetric> = {};
    for (const r of regionalRanking) {
      map[r.regionId] = r;
    }
    return map;
  }, [regionalRanking]);

  const activeMetric =
    metricsByRegion[selectedRegion] ||
    regionalRanking[0] || {
      regionId: selectedRegion,
      name: regionName,
      rank: 1,
      avgProductivityTonHa: 0,
      avgNdvi: 0,
      avgLst: 0,
      avgRainfall: 0,
      samples: 0,
    };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BALI_CENTER,
      zoom: 10,
      minZoom: 9,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      labelsLayerRef.current = null;
      geoJsonLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Switch Base Map Tiles (Esri Satellite + Labels vs OpenStreetMap)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (baseLayerMode === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Sentinel / Aerial Imagery',
          maxZoom: 17,
        }
      ).addTo(map);

      labelsLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 17,
          opacity: 0.85,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 17,
        }
      ).addTo(map);
    }
  }, [baseLayerMode]);

  // Render & Update 9 Bali Regency GeoJSON Polygons + Labels with real metrics
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }
    markersGroup.clearLayers();

    let selectedBounds: L.LatLngBounds | null = null;

    const layer = L.geoJSON(baliRegenciesData as GeoJSON.GeoJsonObject, {
      style: (feature) => {
        const rid = feature?.properties?.regionId as string;
        const metric = metricsByRegion[rid];
        const isSelected = rid === selectedRegion;
        const fill = getYieldColor(metric?.avgProductivityTonHa);

        return {
          fillColor: fill,
          fillOpacity: isSelected ? 0.42 : 0.28,
          color: isSelected ? '#CFEF8A' : '#FFFFFF',
          weight: isSelected ? 3.5 : 1.5,
          opacity: isSelected ? 1 : 0.75,
          dashArray: isSelected ? undefined : '3 3',
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const rid = feature?.properties?.regionId as RegionId;
        const fullName = feature?.properties?.name || rid;
        const shortName = getShortRegencyName(fullName);
        const metric = metricsByRegion[rid];

        const tooltipHtml = metric
          ? `
            <div style="font-family: inherit; min-width: 175px; padding: 2px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong style="color:#164A32; font-size:12px;">${metric.name}</strong>
                <span style="background:#EDF4E5; color:#287A4A; font-weight:800; font-size:10px; padding:1px 6px; border-radius:99px;">#${metric.rank}</span>
              </div>
              <div style="font-size:11px; color:#334436; line-height:1.5;">
                <div>Produktivitas: <strong style="color:#164A32;">${metric.avgProductivityTonHa != null ? `${metric.avgProductivityTonHa.toFixed(2)} ton/ha` : '—'}</strong></div>
                <div>NDVI Kanopi: <strong>${metric.avgNdvi != null ? metric.avgNdvi.toFixed(3) : '—'}</strong> • LST: <strong>${metric.avgLst != null ? `${metric.avgLst} °C` : '—'}</strong></div>
                <div>Curah Hujan: <strong>${metric.avgRainfall != null ? `${Math.round(metric.avgRainfall).toLocaleString('id-ID')} mm` : '—'}</strong></div>
              </div>
            </div>
          `
          : `<strong>${fullName}</strong>`;

        featureLayer.bindTooltip(tooltipHtml, {
          sticky: true,
          direction: 'top',
          opacity: 0.96,
        });

        featureLayer.on({
          mouseover: (e) => {
            const target = e.target as L.Path;
            target.setStyle({
              fillOpacity: 0.55,
              weight: 3,
              color: '#CFEF8A',
            });
          },
          mouseout: (e) => {
            layer.resetStyle(e.target as L.Path);
          },
          click: () => {
            setViewMode('focused');
            onSelectRegionRef.current(rid);
          },
        });

        // Compute bounds for centroid label & zoom-to-selected
        const polyBounds = (featureLayer as L.Polygon).getBounds();
        if (rid === selectedRegion) {
          selectedBounds = polyBounds;
        }

        const center = polyBounds.getCenter();
        // Slight manual nudge for Badung (very elongated N-S) so label doesn't overlap Denpasar
        const labelPos: [number, number] =
          rid === 'badung' ? [center.lat + 0.04, center.lng - 0.01] : [center.lat, center.lng];

        const isSel = rid === selectedRegion;
        const badgeHtml = `
          <div style="
            transform: translate(-50%, -50%);
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 10.5px;
            font-weight: 700;
            cursor: pointer;
            border: 1.5px solid ${isSel ? '#CFEF8A' : 'rgba(255,255,255,0.85)'};
            background: ${isSel ? '#14452F' : 'rgba(255, 253, 247, 0.92)'};
            color: ${isSel ? '#FFFFFF' : '#164A32'};
            box-shadow: 0 2px 6px rgba(0,0,0,0.28);
          ">
            <span>${shortName}</span>
            ${
              metric && metric.avgProductivityTonHa != null
                ? `<span style="color: ${isSel ? '#CFEF8A' : '#287A4A'}; font-weight: 800;">${metric.avgProductivityTonHa.toFixed(2)}</span>`
                : ''
            }
          </div>
        `;

        const marker = L.marker(labelPos, {
          icon: L.divIcon({
            className: 'sipadi-regency-label',
            html: badgeHtml,
            iconSize: [0, 0],
          }),
        });
        marker.on('click', () => {
          setViewMode('focused');
          onSelectRegionRef.current(rid);
        });
        marker.addTo(markersGroup);
      },
    }).addTo(map);

    geoJsonLayerRef.current = layer;

    if (viewMode === 'focused' && selectedBounds) {
      map.flyToBounds(selectedBounds, {
        padding: [36, 36],
        maxZoom: 11,
        duration: 0.75,
      });
    } else if (viewMode === 'bali') {
      map.flyToBounds(BALI_BOUNDS, {
        padding: [16, 16],
        duration: 0.75,
      });
    }
  }, [selectedRegion, metricsByRegion, viewMode]);

  const handleSelectFromCard = (rid: RegionId) => {
    setViewMode('focused');
    onSelectRegion(rid);
  };

  const handleResetToBali = () => {
    setViewMode('bali');
    mapRef.current?.flyToBounds(BALI_BOUNDS, { padding: [16, 16], duration: 0.75 });
  };

  const ndviPct = Math.min(100, Math.max(0, Math.round((activeMetric.avgNdvi ?? 0) * 100)));

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-[#FFFDF7] p-5 sm:p-6 rounded-2xl border border-[#D8E3CC] shadow-xs">
      {/* Left: Interactive Real Satellite + GeoJSON Map */}
      <div className="flex-1 flex flex-col gap-3.5 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#164A32] text-sm">
                Peta Satelit &amp; Sebaran Kabupaten Bali — {selectedYear}
              </h4>
              <p className="text-[11px] text-[#5F7061]">
                Klik wilayah kabupaten mana saja pada peta untuk melihat detail data aktualnya
              </p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setBaseLayerMode('satellite')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  baseLayerMode === 'satellite'
                    ? 'bg-[#287A4A] text-white shadow-2xs'
                    : 'text-[#5F7061] hover:text-[#164A32]'
                }`}
              >
                <Layers className="w-3 h-3" />
                Citra Satelit
              </button>
              <button
                type="button"
                onClick={() => setBaseLayerMode('street')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  baseLayerMode === 'street'
                    ? 'bg-[#287A4A] text-white shadow-2xs'
                    : 'text-[#5F7061] hover:text-[#164A32]'
                }`}
              >
                Peta Jalan
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToBali}
              className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] text-[11px] font-bold text-[#164A32] hover:bg-[#EDF4E5] transition-colors cursor-pointer flex items-center gap-1"
              title="Tampilkan seluruh Pulau Bali"
            >
              <RotateCcw className="w-3 h-3 text-[#287A4A]" />
              Seluruh Bali
            </button>
          </div>
        </div>

        {/* Leaflet Map Container (isolated stacking context so fixed header/sidebar stays on top) */}
        <div className="relative z-0 isolate w-full h-[360px] sm:h-[420px] rounded-2xl border border-[#D8E3CC] overflow-hidden shadow-inner bg-[#E6ECE1]">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Choropleth Legend + Quick Regency Pills */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <span className="text-[#5F7061] font-semibold text-[11px]">Warna Produktivitas:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#1B6B3A]" />
                <span className="text-[#164A32] font-medium">≥ 6.2 t/ha</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#287A4A]" />
                <span className="text-[#164A32] font-medium">5.8 – 6.1 t/ha</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#55A85F]" />
                <span className="text-[#164A32] font-medium">5.2 – 5.7 t/ha</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#D97706]" />
                <span className="text-[#164A32] font-medium">&lt; 5.2 t/ha</span>
              </div>
            </div>
            <span className="text-[11px] text-[#5F7061]">
              Angka di peta adalah produktivitas rata-rata (ton/ha) tahun {selectedYear}
            </span>
          </div>

          {/* Quick clickable regency ranking strip */}
          {regionalRanking.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {regionalRanking.map((reg) => {
                const isSelected = reg.regionId === selectedRegion;
                return (
                  <button
                    key={reg.regionId}
                    type="button"
                    onClick={() => handleSelectFromCard(reg.regionId)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#164A32] text-white border-[#164A32] shadow-2xs'
                        : 'bg-[#FAF7F0] text-[#164A32] border-[#D8E3CC] hover:bg-[#EDF4E5]'
                    }`}
                  >
                    <span className={isSelected ? 'text-[#CFEF8A] mr-1' : 'text-[#5F7061] mr-1'}>
                      #{reg.rank}
                    </span>
                    {getShortRegencyName(reg.name)}{' '}
                    <span className={isSelected ? 'text-[#CFEF8A] font-bold' : 'text-[#287A4A] font-bold'}>
                      {reg.avgProductivityTonHa != null ? reg.avgProductivityTonHa.toFixed(2) : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: 100% Real Telemetry & Monthly Observations Panel */}
      <div className="w-full lg:w-84 bg-[#FAF7F0] p-5 rounded-2xl border border-[#D8E3CC] flex flex-col justify-between shadow-2xs gap-4 shrink-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#287A4A] uppercase tracking-wider">
                Data Aktual Wilayah ({selectedYear})
              </span>
              <h5 className="font-extrabold text-[#164A32] text-base mt-0.5 leading-snug">
                {activeMetric.name || regionName}
              </h5>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#EDF4E5] text-[#164A32] border border-[#C8DDAF]">
              <Trophy className="w-3 h-3 text-[#287A4A]" />
              #{activeMetric.rank} di Bali
            </span>
          </div>

          {/* Primary KPI Card */}
          <div className="p-3.5 rounded-xl bg-white border border-[#D8E3CC] flex items-center justify-between shadow-2xs">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#5F7061]">Rata-rata Produktivitas</span>
              <span className="text-[10px] text-[#5F7061]">
                Dari {activeMetric.samples || monthlyObservations.length} data observasi bulanan
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-[#164A32]">
                {activeMetric.avgProductivityTonHa != null ? activeMetric.avgProductivityTonHa.toFixed(2) : '—'}
              </span>
              <span className="text-xs font-bold text-[#287A4A] ml-1">ton/ha</span>
            </div>
          </div>

          {/* 3 Real Agroklimat Indicators */}
          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-white border border-[#D8E3CC]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5F7061] flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#287A4A]" />
                  Kehijauan Kanopi (NDVI)
                </span>
                <strong className="text-[#287A4A]">
                  {activeMetric.avgNdvi != null ? activeMetric.avgNdvi.toFixed(3) : '—'}
                </strong>
              </div>
              <div className="w-full h-2 bg-[#EDF4E5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#287A4A] rounded-full transition-all duration-500"
                  style={{ width: `${ndviPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#D8E3CC]/60">
              <span className="text-[#5F7061] flex items-center gap-1.5 font-medium">
                <ThermometerSun className="w-3.5 h-3.5 text-[#D97706]" />
                Suhu Permukaan (LST)
              </span>
              <strong className="text-[#164A32]">
                {activeMetric.avgLst != null ? `${activeMetric.avgLst.toFixed(1)} °C` : '—'}
              </strong>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#D8E3CC]/60">
              <span className="text-[#5F7061] flex items-center gap-1.5 font-medium">
                <CloudRain className="w-3.5 h-3.5 text-[#3B8DAD]" />
                Curah Hujan Rata-rata
              </span>
              <strong className="text-[#164A32]">
                {activeMetric.avgRainfall != null
                  ? `${Math.round(activeMetric.avgRainfall).toLocaleString('id-ID')} mm`
                  : '—'}
              </strong>
            </div>
          </div>

          {/* Real Monthly Observations Table */}
          {monthlyObservations.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="font-bold text-[#164A32] flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-[#287A4A]" />
                  Catatan Bulanan ({selectedYear})
                </span>
                <span className="text-[10px] text-[#5F7061]">{monthlyObservations.length} bulan</span>
              </div>

              <div className="max-h-44 overflow-y-auto rounded-xl border border-[#D8E3CC] bg-white divide-y divide-[#EDF4E5]">
                {monthlyObservations.map((m) => (
                  <div
                    key={m.month}
                    className="px-3 py-2 flex items-center justify-between text-[11px] hover:bg-[#FAF7F0] transition-colors"
                  >
                    <span className="font-bold text-[#164A32] w-10">
                      {MONTH_NAMES[(m.month - 1) % 12] || `Bln ${m.month}`}
                    </span>
                    <span className="text-[#5F7061]">
                      NDVI <strong className="text-[#287A4A]">{m.ndvi != null ? m.ndvi.toFixed(2) : '—'}</strong>
                    </span>
                    <span className="text-[#5F7061] hidden sm:inline">
                      {m.lst != null ? `${m.lst.toFixed(1)}°C` : '—'}
                    </span>
                    <strong className="text-[#164A32] font-extrabold">
                      {m.productivity != null ? `${m.productivity.toFixed(2)} t/ha` : '—'}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
