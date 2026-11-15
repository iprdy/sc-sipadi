import React, { createContext, useContext, useState, useEffect } from 'react';
import { RegionId, RegionOption } from '../types';
import { AVAILABLE_REGIONS, AVAILABLE_YEARS } from '../mocks/data';

interface FilterContextType {
  selectedRegion: RegionId;
  setSelectedRegion: (region: RegionId) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  regions: RegionOption[];
  years: number[];
  currentRegionName: string;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('tabanan');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [regions, setRegions] = useState<RegionOption[]>(AVAILABLE_REGIONS);
  const [years, setYears] = useState<number[]>([...AVAILABLE_YEARS]);

  useEffect(() => {
    // Attempt dynamic filter fetching from backend
    fetch('/api/meta/filters')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch filters');
        return res.json();
      })
      .then((data) => {
        if (data.regions && data.regions.length > 0) {
          setRegions(data.regions.map((r: { id: string; name: string; fields?: number; areaHa?: number }) => ({
            id: r.id as RegionId,
            name: r.name,
            totalFields: r.fields || 100,
            totalAreaHa: r.areaHa || 10000,
          })));
        }
        if (data.years && data.years.length > 0) {
          setYears(data.years);
        }
      })
      .catch(() => {
        // Fallback to AVAILABLE_REGIONS and AVAILABLE_YEARS already set
      });
  }, []);

  const currentRegionName = regions.find((r) => r.id === selectedRegion)?.name || 'Tabanan';

  return (
    <FilterContext.Provider
      value={{
        selectedRegion,
        setSelectedRegion,
        selectedYear,
        setSelectedYear,
        regions,
        years,
        currentRegionName,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
