# Implementasi 07: Penyesuaian Terminologi, Pembersihan Header, dan Alur Autentikasi

**Tanggal:** 27 Oktober 2026  
**Status:** Selesai  
**Tujuan:** Menghapus seluruh terminologi "Subak" dari aplikasi agar selaras dengan laporan resmi, membersihkan boilerplate simbol SVG eksternal, merapikan header landing page (hanya menampilkan logo dan nama SIPADI), membatasi navigasi landing page hanya pada bagian-bagian beranda, serta mewajibkan login sebelum membuka dashboard tanpa opsi logout di header.

---

## 1. Perubahan yang Dilakukan

### 1.1 Penghapusan Seluruh Istilah "Subak"
- **Tipe Data & Model (`src/types/index.ts`):**
  - Mengubah `SubakParcel` menjadi `FieldParcel` (Petak Sawah Lahan Padi).
  - Mengubah `subakName` menjadi `fieldName`.
  - Mengubah `subakCount` menjadi `totalFields`.
  - Mengubah peran pengguna `'Petani Subak'` menjadi `'Petani Lahan'`.
- **Mock Data (`src/mocks/data.ts`):**
  - Mengganti seluruh nama petak (misal: *Lahan Jatiluwih Kauh - Blok 1A*).
  - Mengubah domain email demo dari `@subak.bali.id` menjadi `@sipadi.id`.
  - Mengganti deskripsi "irigasi Subak" dengan "irigasi pertanian" atau "tata kelola air".
- **Halaman & Komponen UI:**
  - Mengganti judul dan teks pada Monitoring, Analysis, Insight, Prediction Lab, dan About.
  - Mengganti `InteractiveSubakMap.tsx` menjadi `InteractiveFieldMap.tsx`.
  - Mengubah tag judul di `index.html` menjadi *"SIPADI - Sistem Prediksi & Interpretasi Produktivitas Padi"*.
  - Mengubah token warna di `src/index.css` dari `--color-subak-*` menjadi `--color-primary-*` dan `--color-brand-*`.

### 1.2 Penghapusan Simbol SVG Boilerplate & Pembersihan Aset
- Menghapus file `public/icons.svg` bawaan template yang mengandung deklarasi `<svg xmlns="http://www.w3.org/2000/svg">` dan simbol eksternal.
- Mengganti `public/favicon.svg` dengan ikon tunas tanaman hijau minimalis yang bersih.
- Menghapus file aset bawaan template yang tidak digunakan (`react.svg`, `vite.svg`, `hero.png`).

### 1.3 Penghapusan Elemen Pill Badge pada Hero Section
- Menghapus elemen:
  ```html
  <div class="flex items-center gap-2 self-start px-4 py-1.5 rounded-full bg-[#EDF4E5] border border-[#C8DDAF] text-[#164A32] shadow-xs">
    <span class="w-2 h-2 rounded-full bg-[#55A85F] animate-ping"></span>
    <span class="text-[11px] font-bold tracking-wider uppercase text-[#287A4A]">Platform Agri-Intelligence Berbasis Remote Sensing &amp; Explainable AI</span>
  </div>
  ```
- Tampilan Hero Section kini langsung menampilkan headline utama yang bersih, tegas, dan modern.

### 1.4 Penyempurnaan Header Landing Page (`PublicNavbar.tsx`)
- **Identitas Brand:** Hanya menyisakan logo ikon tunas padi dan nama aplikasi **SIPADI** (tanpa badge tambahan atau subtitle panjang).
- **Menu Navigasi:** Hanya berisi tautan ke bagian yang ada di landing page:
  1. *Beranda* (`#hero`)
  2. *Indikator Agroklimat* (`#indikator`)
  3. *Alur Kerja* (`#alur-kerja`)
  4. *Metodologi AI* (`#metodologi`)
  5. *Tentang* (`#tentang`)
  Tidak ada lagi menu dashboard yang membingungkan pengunjung di landing page.
- **Perilaku Tombol "Buka Dashboard":**
  - Jika pengguna **belum login**: Tombol langsung mengarahkan pengguna ke halaman login (`/login`) untuk masuk atau mendaftar terlebih dahulu.
  - Jika pengguna **sudah login**: Mengarahkan langsung ke dashboard monitoring (`/dashboard/monitoring`).
- **Pembersihan Opsi "Keluar":**
  - Opsi *"Keluar"* (Logout) telah **dihilangkan** sepenuhnya dari header.
  - Header saat login hanya menampilkan profil avatar inisial dan nama pengguna (`user.name`). Aksi keluar tetap aman diakses melalui bagian bawah sidebar dashboard.

---

## 2. Hasil Verifikasi Build

Proyek telah diuji kembali dengan perintah build:
```bash
npm run build
```
Hasil: **Berhasil dikompilasi dalam 563ms dengan 0 error dan 0 peringatan tipe data.**
