import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sprout, Menu, X, LogIn } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation ONLY contains items that exist on the landing page
  const landingNavLinks = [
    { label: 'Beranda', href: '#hero' },
    { label: 'Indikator Agroklimat', href: '#indikator' },
    { label: 'Alur Kerja', href: '#alur' },
    { label: 'Metodologi AI', href: '#xai' },
    { label: 'Tentang', href: '#tentang' },
  ];

  const handleDashboardClick = () => {
    navigate('/dashboard/monitoring');
  };

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname !== '/') {
      return;
    }
    e.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full">
      <nav className="bg-white/95 backdrop-blur-md rounded-full py-2.5 px-4 sm:px-6 shadow-[0_4px_24px_rgba(20,69,47,0.12)] border border-[#D9E5D2] flex items-center justify-between gap-4">
        {/* Brand Logo: Logo + App Name (SIPADI) */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#14452F] flex items-center justify-center text-[#CFEF8A] shadow-xs group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 text-[#CFEF8A]" />
          </div>
          <span className="font-extrabold text-[20px] text-[#14452F] tracking-tight leading-none font-display">
            SIPADI
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-7">
          {landingNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavLinkClick(e, link.href)}
              className="text-[14px] font-medium text-[#1F2D26] hover:text-[#14452F] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Controls & User Profile (NO "Keluar" button in header, NO Arrow icons) */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleDashboardClick}
                className="inline-flex items-center justify-center min-h-[42px] px-5 rounded-full bg-[#14452F] text-white text-[13px] font-bold hover:bg-[#0E3323] transition-all shadow-xs cursor-pointer"
              >
                <span>Buka Dashboard</span>
              </button>

              {/* Profile Pill Badge */}
              <div
                title={`Profil Pengguna: ${user?.name}`}
                className="inline-flex items-center gap-2 border border-[#D9E5D2] bg-[#FAF7F0] rounded-full py-1 px-3.5 pr-4 text-xs font-semibold text-[#14452F]"
              >
                <div className="w-7 h-7 rounded-full bg-[#14452F] text-white text-[11px] font-extrabold flex items-center justify-center">
                  {user?.avatarInitials || 'WS'}
                </div>
                <span className="max-w-[120px] truncate">
                  {user?.name || 'I Wayan Sudiarta'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-full text-xs font-bold text-[#14452F] hover:bg-[#E3F3D3] transition-colors border border-[#D9E5D2]"
              >
                <span>Masuk</span>
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-full text-xs font-bold text-[#14452F] bg-[#E3F3D3] hover:bg-[#CFEF8A] transition-colors"
              >
                <span>Daftar</span>
              </Link>
              <button
                onClick={handleDashboardClick}
                className="inline-flex items-center justify-center min-h-[42px] px-5 rounded-full bg-[#14452F] text-white text-[13px] font-bold hover:bg-[#0E3323] transition-all shadow-xs cursor-pointer"
              >
                <span>Buka Dashboard</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-full text-[#14452F] hover:bg-[#E3F3D3] transition-colors cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 bg-white rounded-3xl border border-[#D9E5D2] p-4 flex flex-col gap-2 shadow-xl animate-fade-in">
          {landingNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavLinkClick(e, link.href)}
              className="text-sm font-semibold text-[#1F2D26] py-2.5 px-4 rounded-xl hover:bg-[#E3F3D3] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-[#D9E5D2] flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 p-2.5 bg-[#FAF7F0] border border-[#D9E5D2] rounded-full">
                  <div className="w-7 h-7 rounded-full bg-[#14452F] text-white text-[11px] font-bold flex items-center justify-center">
                    {user?.avatarInitials || 'WS'}
                  </div>
                  <span className="text-xs font-bold text-[#14452F]">{user?.name || 'I Wayan Sudiarta'}</span>
                </div>
                <button
                  onClick={() => {
                    handleDashboardClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-3 rounded-full bg-[#14452F] text-white font-bold text-xs hover:bg-[#0E3323] cursor-pointer"
                >
                  Buka Dashboard
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-full text-xs font-bold text-[#14452F] border border-[#D9E5D2]"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-full text-xs font-bold text-[#14452F] bg-[#E3F3D3]"
                  >
                    Daftar
                  </Link>
                </div>
                <button
                  onClick={() => {
                    handleDashboardClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-3 rounded-full bg-[#14452F] text-white font-bold text-xs hover:bg-[#0E3323] cursor-pointer"
                >
                  Buka Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
