import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Eye, EyeOff, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Silakan isi nama lengkap Anda.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Silakan isi alamat email.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Harap setujui ketentuan privasi data pertanian.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Registrasi simulasi akun berhasil! Mengalihkan ke halaman masuk...');
      setTimeout(() => {
        navigate('/login');
      }, 1800);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F7F2E6] flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-[#C8DDAF]">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/login"
          className="text-xs font-semibold text-[#5F7061] hover:text-[#164A32] transition-colors"
        >
          <span>Kembali ke Halaman Masuk</span>
        </Link>
        <span className="text-[11px] font-bold text-[#287A4A] bg-[#EDF4E5] px-2.5 py-0.5 rounded-full border border-[#C8DDAF]">
          Pendaftaran Pengguna
        </span>
      </div>

      <div className="w-full max-w-md bg-[#FFFDF7] rounded-3xl border border-[#D8E3CC] p-6 sm:p-8 shadow-md flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#EDF4E5] border border-[#C8DDAF] flex items-center justify-center text-[#287A4A] shadow-xs">
            <Sprout className="w-6 h-6 text-[#287A4A]" />
          </div>
          <h2 className="text-2xl font-black text-[#164A32] tracking-tight">Daftar Akun SIPADI</h2>
          <p className="text-xs text-[#5F7061]">
            Daftar untuk memantau data satelit dan estimasi produktivitas tanaman padi.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-xs text-[#93000A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-[#EDF4E5] border border-[#C8DDAF] text-xs text-[#164A32] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#287A4A] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#164A32]">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: I Made Astawa"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] text-xs text-[#164A32] focus:outline-hidden focus:border-[#287A4A] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#164A32]">Alamat Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] text-xs text-[#164A32] focus:outline-hidden focus:border-[#287A4A] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#164A32]">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
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

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#164A32]">Konfirmasi Kata Sandi</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8E3CC] text-xs text-[#164A32] focus:outline-hidden focus:border-[#287A4A] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="rounded accent-[#287A4A] cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="text-[11px] text-[#5F7061] cursor-pointer">
              Saya menyetujui ketentuan privasi data agroklimat pertanian.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-[#287A4A] hover:bg-[#164A32] text-white text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Daftar Akun Baru</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[#5F7061]">
          Sudah memiliki akun?{' '}
          <Link to="/login" className="font-bold text-[#287A4A] hover:underline">
            Masuk Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
};
