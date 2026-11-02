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
    { label: 'Alur Kerja', href: '#alur-kerja' },
    { label: 'Metodologi AI', href: '#metodologi' },
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#D8E3CC]/80 shadow-[0_1px_8px_rgba(22,74,50,0.05)]">
      <div className="h-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo: ONLY Logo + App Name (SIPADI) */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A] shadow-xs group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 text-[#287A4A]" />
          </div>
          <span className="font-extrabold text-[22px] text-[#164A32] tracking-tight leading-none">
            SIPADI
          </span>
        </Link>

        {/* Desktop Navigation - ONLY Landing Page Sections */}
        <nav className="hidden md:flex items-center gap-6">
          {landingNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavLinkClick(e, link.href)}
              className="text-xs sm:text-[13px] font-semibold text-[#5F7061] hover:text-[#164A32] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls & User Profile (NO "Keluar" button in header, NO Arrow icons) */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDashboardClick}
                className="px-4 py-2.5 rounded-xl bg-[#287A4A] text-white text-xs font-bold hover:bg-[#164A32] transition-all shadow-xs cursor-pointer"
              >
                <span>Buka Dashboard</span>
              </button>

              {/* Profile Only (No Logout option here) */}
              <div
                title={`Profil Pengguna: ${user?.name}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF]"
              >
                <div className="w-7 h-7 rounded-full bg-[#164A32] text-white text-[11px] font-extrabold flex items-center justify-center">
                  {user?.avatarInitials || 'US'}
                </div>
                <span className="text-xs font-bold text-[#164A32] max-w-[120px] truncate">
                  {user?.name || 'Pengguna'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#164A32] hover:bg-[#EDF4E5] transition-colors border border-[#D8E3CC] flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#164A32] bg-[#FAF7F0] hover:bg-[#EDF4E5] transition-colors border border-[#D8E3CC]"
              >
                <span>Daftar</span>
              </Link>
              <button
                onClick={handleDashboardClick}
                className="px-4 py-2 rounded-xl bg-[#287A4A] text-white text-xs font-bold hover:bg-[#164A32] transition-all shadow-xs cursor-pointer"
              >
                <span>Buka Dashboard</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#164A32] hover:bg-[#EDF4E5] transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFFFF] border-b border-[#D8E3CC] px-4 pt-3 pb-6 flex flex-col gap-3 shadow-lg">
          {landingNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavLinkClick(e, link.href)}
              className="text-sm font-semibold text-[#164A32] py-2 px-3 rounded-lg hover:bg-[#EDF4E5]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-[#D8E3CC] flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 p-2 bg-[#EDF4E5] rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-[#164A32] text-white text-[11px] font-bold flex items-center justify-center">
                    {user?.avatarInitials || 'US'}
                  </div>
                  <span className="text-xs font-bold text-[#164A32]">{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    handleDashboardClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 rounded-xl bg-[#287A4A] text-white font-bold text-xs"
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
                    className="flex-1 text-center py-2.5 rounded-xl text-xs font-bold text-[#164A32] border border-[#D8E3CC]"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl text-xs font-bold text-[#164A32] bg-[#EDF4E5]"
                  >
                    Daftar
                  </Link>
                </div>
                <button
                  onClick={() => {
                    handleDashboardClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 rounded-xl bg-[#287A4A] text-white font-bold text-xs"
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
