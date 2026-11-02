import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Sprout, 
  BarChart3, 
  Network, 
  Lightbulb, 
  Info, 
  LogOut, 
  Home
} from 'lucide-react';

interface AppSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  highlight?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ 
  isExpanded, 
  onToggle 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems: NavItem[] = [
    {
      label: 'Monitoring',
      path: '/dashboard/monitoring',
      icon: BarChart3,
      desc: 'Agroklimat & Tren',
    },
    {
      label: 'Analysis (XAI)',
      path: '/dashboard/analysis',
      icon: Network,
      desc: 'SHAP & Efek ALE',
    },
    {
      label: 'Insight & Peta',
      path: '/dashboard/insight',
      icon: Lightbulb,
      desc: 'Petak Sawah & Spasial',
    },
    {
      label: 'Tentang Sistem',
      path: '/dashboard/about',
      icon: Info,
      desc: 'Metodologi & Data',
    },
  ];

  return (
    <>
      {/* Optional mobile backdrop when sidebar is expanded on small screens */}
      {isExpanded && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 animate-fade-in"
          onClick={onToggle}
        />
      )}

      {/* Persistent / Collapsible Mini-Rail Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full ${
          isExpanded ? 'w-[240px]' : 'w-[72px]'
        } bg-[#164A32] text-white flex flex-col justify-between pt-4 pb-5 select-none shadow-2xl border-r border-[#1e583c] z-50 transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col">
          {/* Brand Header: SIPADI Logo Button that Toggles Expand / Collapse */}
          <div className={`px-3.5 pb-4 flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} border-b border-[#215a3d]`}>
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center gap-3 group cursor-pointer focus:outline-hidden"
              title={isExpanded ? 'Ciutkan Sidebar (Sisakan Logo Saja)' : 'Perluas Sidebar SIPADI'}
            >
              <div className="w-10 h-10 rounded-xl bg-[#205a3b] border border-[#2e744e] flex items-center justify-center shadow-inner text-[#55A85F] group-hover:scale-105 group-hover:bg-[#287A4A] group-hover:text-white transition-all shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
              {isExpanded && (
                <span className="font-extrabold text-[20px] text-white tracking-tight leading-none animate-fade-in truncate">
                  SIPADI
                </span>
              )}
            </button>
          </div>

          {/* Navigation Items (Icons only when collapsed, with full labels when expanded) */}
          <nav className="flex flex-col gap-1.5 px-2 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isExpanded ? 'justify-between px-3.5' : 'justify-center px-0'
                    } h-11 rounded-xl text-[13px] font-semibold transition-all group ${
                      isActive
                        ? 'bg-[#287A4A] text-white shadow-sm ring-1 ring-[#55A85F]/50'
                        : item.highlight
                        ? 'text-[#C8DDAF] bg-[#1a4f36]/70 hover:bg-[#205b3e] hover:text-white border border-[#2f6f4d]'
                        : 'text-[#C8DDAF] hover:text-white hover:bg-[#1f593b]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
                        <Icon
                          className={`w-5 h-5 shrink-0 ${
                            isActive
                              ? 'text-white'
                              : item.highlight
                              ? 'text-[#55A85F]'
                              : 'text-[#C8DDAF] group-hover:text-white'
                          }`}
                        />
                        {isExpanded && <span className="truncate">{item.label}</span>}
                      </div>
                      {isExpanded && (
                        isActive ? (
                          <span className="w-2 h-2 rounded-full bg-[#55A85F] shadow-[0_0_8px_#55A85F]" />
                        ) : item.highlight ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#55A85F]/30 text-[#C8DDAF]">
                            Baru
                          </span>
                        ) : null
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Widget & Navigation Back (No Arrow Icons) */}
        <div className="px-2 flex flex-col gap-2">
          {isExpanded ? (
            <div className="p-3 rounded-xl bg-[#123825] border border-[#215a3d] flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#287A4A] border border-[#55A85F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {user?.avatarInitials || 'WS'}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-white truncate">{user?.name || 'Petugas Lapangan'}</span>
                  <span className="text-[10px] text-[#A2C79A] truncate">{user?.role || 'Penyuluh Pertanian'}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-1.5 rounded-lg text-[#C8DDAF] hover:text-[#C96F5F] hover:bg-[#1a4731] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div 
                title={`${user?.name || 'Petugas Lapangan'} (${user?.role || 'Penyuluh Pertanian'})`}
                className="w-9 h-9 rounded-full bg-[#287A4A] border border-[#55A85F] text-white text-xs font-bold flex items-center justify-center cursor-default shadow-xs"
              >
                {user?.avatarInitials || 'WS'}
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-2 rounded-lg text-[#C8DDAF] hover:text-[#C96F5F] hover:bg-[#1a4731] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <Link
            to="/"
            title="Kembali ke Beranda Utama"
            className={`flex items-center ${
              isExpanded ? 'justify-center py-2' : 'justify-center p-2'
            } text-[11px] font-semibold text-[#A2C79A] hover:text-white transition-colors rounded-xl hover:bg-[#1f593b]`}
          >
            {isExpanded ? (
              <span>Kembali ke Beranda Utama</span>
            ) : (
              <Home className="w-4 h-4" />
            )}
          </Link>
        </div>
      </aside>
    </>
  );
};
