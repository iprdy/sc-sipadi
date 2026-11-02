import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

export const DashboardLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#F7F2E6] flex flex-col font-sans selection:bg-[#C8DDAF] selection:text-[#164A32]">
      {/* Mini-Rail Sidebar (Toggled only by SIPADI Logo, collapses to logo & icons) */}
      <AppSidebar
        isExpanded={isSidebarExpanded}
        onToggle={handleToggleSidebar}
      />

      {/* Main Workspace Wrapper (Offset for 240px expanded or 72px mini-rail) */}
      <div 
        className={`pl-[72px] ${
          isSidebarExpanded ? 'lg:pl-[240px]' : 'lg:pl-[72px]'
        } flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out`}
      >
        {/* Fixed Header */}
        <AppHeader 
          isSidebarExpanded={isSidebarExpanded} 
        />

        {/* Dashboard Main Content Area with Ample Top Padding to Prevent Header Clipping */}
        <main className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col gap-6 max-w-[1500px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
