import React, { useState } from 'react';
import { useFilter } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { RegionId } from '../../types';
import { 
  Download, 
  MapPin, 
  Calendar, 
  Check
} from 'lucide-react';

interface AppHeaderProps {
  isSidebarExpanded: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isSidebarExpanded }) => {
  const { selectedRegion, setSelectedRegion, selectedYear, setSelectedYear, regions, years } = useFilter();
  const { user } = useAuth();
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExport = () => {
    setExportNotice('File ringkasan berhasil disimulasikan untuk diunduh.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <header className={`fixed top-0 left-[72px] ${isSidebarExpanded ? 'lg:left-[240px]' : 'lg:left-[72px]'} right-0 h-16 bg-[#FFFDF7]/95 backdrop-blur-xl border-b border-[#E3DCBA]/80 z-40 flex items-center justify-between px-4 sm:px-8 transition-all duration-300`}>
      {/* Left side: Global Filters */}
      <div className="flex items-center gap-3">

        {/* Global Filter Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Wilayah Dropdown */}
          <div className="relative flex items-center gap-1.5 bg-[#FFFDF7] border border-[#E3DCBA] rounded-xl px-3 py-1.5 h-9 shadow-xs hover:border-[#287A4A] transition-colors">
            <MapPin className="w-3.5 h-3.5 text-[#287A4A]" />
            <span className="text-[11px] text-[#68766D] font-medium hidden sm:inline">Wilayah:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as RegionId)}
              className="bg-transparent text-xs font-bold text-[#19382A] focus:outline-hidden cursor-pointer pr-1"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun Dropdown */}
          <div className="relative flex items-center gap-1.5 bg-[#FFFDF7] border border-[#E3DCBA] rounded-xl px-3 py-1.5 h-9 shadow-xs hover:border-[#287A4A] transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#287A4A]" />
            <span className="text-[11px] text-[#68766D] font-medium hidden sm:inline">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-[#19382A] focus:outline-hidden cursor-pointer pr-1"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y} {y === 2025 ? '(Proyeksi)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Right side: Export & Profile */}
      <div className="flex items-center gap-3">
        {/* Export Notification Toast */}
        {exportNotice && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#EDF4E5] border border-[#C8DDAF] rounded-lg text-xs font-semibold text-[#164A32] animate-fade-in shadow-xs">
            <Check className="w-3.5 h-3.5 text-[#287A4A]" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Export Button (No Arrow icon) */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#287A4A] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E5D38] transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ekspor Data</span>
        </button>

        {/* User Initial Circle */}
        <div
          title={user ? `Masuk sebagai: ${user.name}` : 'Petugas Sawah'}
          className="w-8 h-8 rounded-full bg-[#164A32] text-white text-xs font-bold flex items-center justify-center border-2 border-[#C8DDAF] shadow-xs cursor-default"
        >
          {user?.avatarInitials || 'WS'}
        </div>
      </div>
    </header>
  );
};
