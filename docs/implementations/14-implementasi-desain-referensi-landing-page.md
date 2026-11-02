# Dokumentasi Implementasi: Penerapan Desain Referensi Landing Page SIPADI

## 1. Ringkasan
Dokumen ini mencatat pembaruan antarmuka (UI/UX) pada halaman utama (Landing Page) aplikasi SIPADI agar sesuai secara visual dan struktural dengan berkas referensi desain di `docs/design-references/SIPADI Landing Page-html` (`Main.dc.html`).

Pembaruan mencakup integrasi tipografi Google Fonts baru (`Bricolage Grotesque` dan `Figtree`), palet warna khas pertanian modern (Deep Forest `#14452F` / `#0E3323`, Vibrant Lime `#CFEF8A`, Soft Lime `#E3F3D3`, Cream Neutral `#F6F2E7`), tata letak kartu bertingkat, telemetry glass cards, alur kerja bertahap, pratinjau grafik fase pertumbuhan NDVI, visualisasi XAI (SHAP & ALE), testimonial, accordion FAQ interaktif, banner CTA, dan footer komprehensif.

Semua aturan proyek tetap dipertahankan:
- **Nol penggunaan terminologi "Subak"** (menggunakan padanan netral terverifikasi seperti *"Lahan Sawah Jatiluwih, Tabanan"* dan *"wilayah binaan"*).
- **Nol ikon panah (*no arrow icons*)** pada tombol aksi dan tautan navigasi.
- **Bebas dari atribut tugas/mata kuliah**.
- Integrasi otentikasi React SPA (`useAuth`) dengan navigasi langsung ke dasbor operasional (`/dashboard/monitoring`).

---

## 2. Berkas yang Diubah & Ditambahkan

| Berkas | Perubahan Utama |
|---|---|
| [`index.html`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/index.html) | Menambahkan tautan Google Fonts untuk `Bricolage Grotesque` (bobot 600, 700, 800) dan `Figtree` (bobot 400, 500, 600, 700, 800). |
| [`src/index.css`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/src/index.css) | Mendaftarkan token warna dan font custom, serta mendefinisikan keyframe animasi interaktif (`@keyframes float`, `@keyframes float-gentle`, `@keyframes pulse-beacon`). |
| [`src/components/layout/PublicNavbar.tsx`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/src/components/layout/PublicNavbar.tsx) | Merekonstruksi navbar publik menjadi desain *floating pill capsule* dengan backdrop blur, logo SIPADI berlatar hijau tua dengan ikon tunas lime, link navigasi jangkar (`#hero`, `#indikator`, `#alur`, `#xai`, `#tentang`), dan tombol aksi tanpa ikon panah. |
| [`src/pages/Homepage.tsx`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/src/pages/Homepage.tsx) | Membangun ulang seluruh 10 seksi halaman dengan latar panorama penuh (tanpa garis pola berulang), menghapus kartu proyeksi panen mini, mengintegrasikan aset gambar dummy hasil generasi (hero background, mockup UI dashboard, foto profil penyuluh, banner satelit), serta menyematkan animasi mikro. |
| `public/images/` | Menyimpan aset visual lokal: `hero-rice-terraces.jpg`, `dashboard-preview.jpg`, `testimonial-avatar.jpg`, `workflow-satellite.jpg`, `workflow-geospatial.jpg`, `workflow-machine-learning.jpg`, dan `workflow-explainable-ai.jpg`. |

---

## 3. Rincian Seksi Halaman Utama (`Homepage.tsx`)

1. **Full-Bleed Panoramic Hero Section (Lebar Penuh & Lengkung Bawah)**
   - Header hero kini membentang penuh 100% lebar viewport (*full-width edge-to-edge*), tidak lagi terkurung dalam kotak terbatas.
   - Menggunakan foto lanskap sawah Jatiluwih asli tanpa garis berulang (`hero-rice-terraces.jpg`).
   - Lengkungan sweeping bawah yang elegan (`rounded-b-[40px] sm:rounded-b-[64px]`) untuk transisi dinamis ke badan halaman.
   - Badge typewriter dinamis (`TypewriterText`) yang mengetik variasi metode platform: *Citra Satelit Sentinel-2*, *Explainable AI (SHAP & ALE)*, *Prediksi Regresi XGBoost Cerdas*, dan *Presipitasi Curah Hujan CHIRPS*.
   - Badge lokasi dengan *live radar ping* aktif dan 4 kartu telemetri kaca dengan interaksi *hover lift* & *border glow*.

2. **Alur Kerja Platform (4 Kartu Gambar Lengkap)**
   - Keempat tahapan alur kerja kini memiliki banner gambar sinematik 16:9 beresolusi tinggi:
     1. *01 Remote Sensing Acquisition*: [`workflow-satellite.jpg`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/public/images/workflow-satellite.jpg) (Satelit Sentinel-2 di orbit bumi).
     2. *02 Geospatial Feature Engineering*: [`workflow-geospatial.jpg`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/public/images/workflow-geospatial.jpg) (Pemetaan poligon batas petak sawah dan kontur elevasi DEM).
     3. *03 Machine Learning Predictive Engine*: [`workflow-machine-learning.jpg`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/public/images/workflow-machine-learning.jpg) (Pohon keputusan gradient boosting XGBoost dengan alur data regresi).
     4. *04 Explainable AI Framework*: [`workflow-explainable-ai.jpg`](file:///c:/Users/iputu/Documents/Kuliah/Semester%205/Sistem%20Cerdas%20(B)/web%20project/public/images/workflow-explainable-ai.jpg) (Visualisasi kristal kubus transparan dekomposisi fitur SHAP & kurva ALE).

3. **Kartu Interaktif Seksi "MENGAPA SIPADI"**
   - Setiap kartu kini dilengkapi widget interaktif dinamis saat disentuh atau di-*hover*:
     - *Prediksi Lebih Awal*: Indikator akurasi model `R² > 0.88` dengan *animated progress bar* dan estimasi timeline `T-30 Hari`.
     - *Pantauan Berkala*: Status siklus orbit Sentinel-2 `Tiap 5 Hari` dengan radar pulse dan tag `Bebas Awan`.
     - *Hasil yang Bisa Dijelaskan*: Tag interaktif atribusi faktor instan (`NDVI +0.28`, `CHIRPS +0.16`, `LST -0.08`).
     - *Laporan Siap Unduh*: Tag format dokumen `PDF Ringkasan` dan `CSV Spasial` untuk dinas dan kelompok tani.

4. **Metodologi AI Terjelaskan (Interactive XAI Workbench)**
   - Dirombak menjadi workbench analitik interaktif yang kaya informasi:
     - **Banner Komparasi Transparansi**: Menampilkan nilai dasar model (`4,80 ton/ha`) vs hasil prediksi lahan (`5,21 ton/ha`) dengan deviasi bersih `+0,41 ton/ha`.
     - **SHAP Feature Inspector Interaktif**: Pengguna dapat mengeklik variabel (NDVI, CHIRPS, DEM, LST) untuk memicu kalkulasi deviasi bar dan membaca interpretasi agronomi spesifik secara langsung di panel interpretasi.
     - **ALE Dynamic Response Curve Workbench**: Tombol selector variabel untuk mengganti kurva respon SVG secara dinamis (NDVI kurva saturasi S, Curah Hujan kurva lonceng, Suhu kurva penurunan), lengkap dengan titik observasi lahan real-time.

4. **Diferensiasi Warna Latar Belakang Per Seksi (Full-Width Bands)**
   - Setiap seksi kini membentang penuh 100% lebar layar (*full-width section band*) dengan palet warna permukaan tematik yang harmonis:
     - **Hero Section**: Foto panorama terasering dengan gradien sinematik zamrud pekat (`#0E3323`).
     - **Trust Strip & Tentang SIPADI**: Porselen krem hangat (`#FAF7F0`) dengan pendaran cahaya radial lembut.
     - **Alur Kerja Platform**: Hijau sage alami (*soft earthy sage* `#EEF5E8`) bertekstur titik kartografi satelit (`bg-grid-dots`).
     - **Pratinjau Dashboard**: Putih bersih modern (*crisp pure white* `#FFFFFF`) dengan aura pendaran gradien di balik bingkai mockup.
     - **Mengapa SIPADI**: Warna oatmeal alami hangat (`#F5F2EB`) yang menenangkan.
     - **Metodologi AI Terjelaskan (XAI)**: Hijau hutan gelap dramatis (`#0E3323`) dengan aksen kartu hijau lumut `#14452F` dan glow sudut.
     - **Suara Pengguna & FAQ**: Hijau embun pagi segar (*fresh mint* `#F2F8ED`).
     - **Call to Action (CTA)**: Pita hijau transisi (`#EBF4E5`) berisikan kartu gradien lime cerah (`#CFEF8A` ke `#9AD66B`).
     - **Footer**: Hijau malam pekat (*midnight forest* `#092015`).

5. **Accordion FAQ Interaktif Eksklusif (Single-Open & Dipercantik)**
   - Mekanisme **Single-Open (Mutually Exclusive)**: Membuka satu pertanyaan otomatis menutup pertanyaan yang sebelumnya sedang terbuka.
   - Desain kartu terstruktur dengan nomor urut (`01`, `02`, `03`, `04`), border hijau zamrud dan ring lembut saat aktif, serta tombol indikator bulat `+` yang berputar 45 derajat menjadi `×` secara mulus tanpa menggunakan ikon panah.
   - Transisi buka-tutup ekspansi isi halus memanfaatkan CSS grid animation.

6. **Mengapa SIPADI (4 Nilai Keunggulan)**
   - Grid 4 kartu dengan ikon bulat hijau muda:
     - *Prediksi lebih awal*: Estimasi panen 2-4 minggu sebelum masa panen.
     - *Pantauan berkala*: Update berkala dari komposit citra satelit bebas awan.
     - *Hasil yang bisa dijelaskan*: Bukan black-box; petani dan analis memahami alasan di balik prediksi.
     - *Laporan siap unduh*: Ekspor ringkasan per petak sawah ke format PDF/CSV.

7. **Showcase XAI (Explainable AI Showcase)**
   - Kontainer tematik hijau tua (`#14452F`) yang mendemonstrasikan transparansi model:
     - **SHAP Proportional Contributions Bar**: Visualisasi kontribusi fitur positif vs negatif (NDVI Vegetasi, Curah Hujan Siklus, Elevasi Topografi, dll.).
     - **ALE Response Curve (Efek Marginal Terisolasi)**: Grafik SVG respon kurva NDVI terhadap tonase panen tanpa bias korelasi silang.

8. **Testimonial & FAQ Interaktif**
   - Kartu kutipan testimoni penyuluh pertanian lapangan berlatar putih dengan badge rating 5 bintang.
   - 3 item accordion `<details>` interaktif mengenai frekuensi data satelit, integrasi sensor IoT, dan interpretasi penjelasan model AI.

9. **Banner Call-To-Action (CTA)**
   - Kontainer gradien warna lime cerah (`#CFEF8A` ke `#9AD66B`) dengan teks kontras tinggi hijau tua, dilengkapi tombol navigasi langsung ke dasbor.

10. **Footer Platform Modern**
    - Latar belakang hijau pekat (`#0E3323`) dengan 4 kolom informasi: Ringkasan Platform, Navigasi Modul, Sumber Data & Metodologi, serta Hak Cipta SIPADI.

---

## 4. Pembaruan Desain Minimalis, Pembedaan Warna Seksi & Penyempurnaan XAI Humanis
Sesuai arahan pengguna terbaru, landing page disempurnakan lebih lanjut:
1. **Pembedaan Warna Latar Belakang Antar-Seksi (Ritmik & Harmonis)**:
   - **Hero**: Foto panorama terasering dengan gradien zamrud pekat (`#0E3323`).
   - **Trust Strip & Tentang SIPADI**: Porselen krem hangat (`#FAF7F0`) dengan batas halus `border-[#EAE3D5]`.
   - **Alur Kerja Platform**: Hijau sage alami sejuk (`#EEF5E8`) dengan batas halus `border-[#DCE8D4]`.
   - **Pratinjau Dashboard**: Putih bersih modern (*pure white* `#FFFFFF`) dengan batas `border-[#E5ECE0]`.
   - **Dirancang untuk Penyuluh (Mengapa SIPADI)**: Pasir oatmeal hangat (*warm sand* `#F6F3EB`) dengan batas `border-[#E5DFD3]`.
   - **Metodologi AI Terjelaskan (XAI)**: Hijau hutan pekat elegan (`#0C2519`) sebagai studio sains presisi.
   - **Suara Pengguna & FAQ**: Hijau embun pagi segar (*fresh mint* `#F2F8ED`) dengan batas `border-[#DBEAD5]`.
   - **Call to Action (CTA)**: Pita hijau transisi lembut (`#EBF4E5`) membungkus kontainer hijau tua (`#14452F`).
   - **Footer**: Hijau malam pekat (*midnight forest* `#092015`).

2. **Penyempurnaan Kartu "MENGAPA SIPADI" (Logo Tengah & Efek Hover Expand)**:
   - Menghilangkan badge (*Pra-Panen*, *Tiap 5 Hari*, dll.) dan angka urut (*01*, *02*, dll.) sesuai permintaan agar kartu benar-benar bersih dan hanya memuat logo/ikon.
   - Posisi logo diatur berada di **tengah kartu (*centered*)**, disertai teks judul dan deskripsi yang selaras di tengah.
   - Memberikan efek hover expand interaktif yang taktil (`hover:scale-[1.03] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ease-out`).
   - Mempertahankan 4 palet warna pastel lembut yang berbeda pada tiap kartu agar tidak monoton (sage, embun, pasir, mint).

3. **Penyempurnaan Alur Kerja Sistem (Nomor Saja di Atas Tengah & Hover Expand)**:
   - Angka tahap diposisikan di **atas tengah kartu** hanya berupa lingkaran angka bersih (`01`, `02`, `03`, `04`) tanpa teks kata "Tahap", terpisah bersih dari kontainer foto agar tidak menutupi gambar.
   - Foto diletakkan rapi di dalam bingkai melengkung (`rounded-2xl`) di bawah nomor tahap.
   - Menambahkan efek ekspansi saat kursor diarahkan (*hover expand*: `hover:scale-[1.03] hover:-translate-y-2 hover:shadow-2xl`) dengan zoom halus pada gambar foto (`group-hover:scale-108`).

4. **Navbar Melayang yang Mengikuti Scroll (*Fixed Floating Capsule*)**:
   - Memperbaiki pembungkus navigasi menjadi `fixed top-4 left-0 right-0 z-50` agar kapsul navbar melayang secara persisten mengikuti posisi layar saat pengguna menggulir halaman ke bawah.

5. **Animasi Angka Bertambah di Hero (*Count-Up Animation*)**:
   - Menambahkan komponen `AnimatedCounter` dengan kurva perlambatan halus (*ease-out cubic*) pada 4 indikator telemetri utama (Estimasi Panen: `0` -> `5,21`, NDVI: `0` -> `0,68`, LST: `0` -> `27,4`, Curah Hujan: `0` -> `1.820`).
   - Format angka menggunakan pemisah desimal koma dan pemisah ribuan titik sesuai kaidah Indonesia, serta didukung `tabular-nums` agar tidak bergetar secara horizontal saat bertambah.

4. **Metodologi AI Terjelaskan (XAI) Hijau Gelap Solid Tanpa Border Kecil**:
   - Mempertahankan kanvas hijau hutan pekat (`bg-[#0C2519]`) yang disukai pengguna karena memberikan wibawa ilmiah dan kontras yang kuat.
   - Menghilangkan seluruh pola *border-border* kecil berlapis (*box-in-a-box*) yang sebelumnya terkesan murahan atau templat AI:
     - **SHAP (Faktor Penentu Lahan)**: Menggunakan kontainer hijau tua solid (`bg-[#123624]`), daftar interaktif tanpa border (`bg-white/15` saat aktif, transparan saat pasif), dan badge peran solid ramah mata tanpa garis tepi kaku.
     - **ALE (Sifat Biologis Alami Tanaman)**: Tab pemilih parameter solid kontras tinggi (*white pill* saat aktif, `bg-white/10` saat pasif), dan kanvas kurva respons SVG di atas bidang gelap solid (`bg-black/25`) yang bersih tanpa border berulang.

---

## 5. Pengujian dan Verifikasi
- Eksekusi `npm run build` (`tsc -b && vite build`) menghasilkan output **exit code 0** tanpa galat TypeScript atau CSS.
- Verifikasi teks bebas dari kata "subak".
- Bebas dari seluruh ikon panah pada tombol aksi dan tautan navigasi.
- Respons HTTP server lokal `http://localhost:5173` terverifikasi **200 OK**.
- Verifikasi seluruh tombol bebas dari elemen ikon panah (*arrow icons*).

