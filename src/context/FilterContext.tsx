import React, { createContext, useContext, useState } from 'react';
import { RegionId, RegionOption } from '../types';
import { AVAILABLE_REGIONS, AVAILABLE_YEARS } from '../mocks/data';

interface FilterContextType {
  selectedRegion: RegionId;
  setSelectedRegion: (region: RegionId) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  regions: RegionOption[];
  years: readonly number[];
  currentRegionName: string;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('tabanan');
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const currentRegionName = AVAILABLE_REGIONS.find((r) => r.id === selectedRegion)?.name || 'Tabanan';

  return (
    <FilterContext.Provider
      value={{
        selectedRegion,
        setSelectedRegion,
        selectedYear,
        setSelectedYear,
        regions: AVAILABLE_REGIONS,
        years: AVAILABLE_YEARS,
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
