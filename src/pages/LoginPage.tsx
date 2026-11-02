import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Silakan masukkan alamat email Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard/monitoring');
    } catch {
      setErrorMessage('Terjadi kesalahan saat masuk. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2E6] flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-[#C8DDAF]">
      {/* Return to Home (No Arrow Icon) */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xs font-semibold text-[#5F7061] hover:text-[#164A32] transition-colors"
        >
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#FFFDF7] rounded-3xl border border-[#D8E3CC] p-6 sm:p-8 shadow-md flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A] shadow-xs">
            <Sprout className="w-6 h-6 text-[#287A4A]" />
          </div>
          <h2 className="text-2xl font-black text-[#164A32] tracking-tight">Masuk ke SIPADI</h2>
          <p className="text-xs text-[#5F7061]">
            Akses dashboard pemantauan agroklimat dan analisis explainable AI produktivitas tanaman padi.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-xs text-[#93000A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#164A32]">Alamat Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sipadi.id"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] text-xs text-[#164A32] focus:outline-hidden focus:border-[#287A4A] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#164A32]">Kata Sandi</label>
              <button
                type="button"
                onClick={() => alert('Fitur pemulihan kata sandi disimulasikan untuk lingkungan pengujian.')}
                className="text-[11px] font-semibold text-[#287A4A] hover:underline"
              >
                Lupa sandi?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] text-xs text-[#164A32] focus:outline-hidden focus:border-[#287A4A] focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F7061] hover:text-[#164A32]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-[#287A4A] hover:bg-[#164A32] text-white text-xs font-extrabold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Register */}
        <div className="pt-2 text-center text-xs text-[#5F7061]">
          Belum memiliki akun pengamat?{' '}
          <Link to="/register" className="font-bold text-[#287A4A] hover:underline">
            Daftar Akun Baru
          </Link>
        </div>
      </div>
    </div>
  );
};
