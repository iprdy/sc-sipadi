# Product Requirements Document (PRD) — SIPADI Frontend

**Versi:** 2.0  
**Fokus:** Implementasi antarmuka frontend (UI)  
**Status:** Spesifikasi implementasi frontend; backend belum diimplementasikan

---

## 1. Ringkasan

SIPADI adalah antarmuka web untuk memantau produktivitas padi dan memahami faktor lingkungan yang berkaitan dengan hasil prediksi. Implementasi pada tahap ini **berfokus pada frontend saja**: membangun halaman, komponen UI, navigasi, formulir, visualisasi, serta interaksi antarmuka agar tampilannya dapat digunakan dan nantinya mudah dihubungkan ke backend.

Frontend akan mengikuti empat halaman utama pada desain referensi:

1. **Homepage** — halaman publik yang memperkenalkan SIPADI.
2. **Monitoring Produktivitas** — ringkasan indikator lingkungan dan tren produktivitas.
3. **Explainable Analysis** — visualisasi kontribusi SHAP dan pola respons ALE.
4. **Insight Produktivitas** — ringkasan hasil prediksi dan interpretasinya.

Sistem juga memiliki halaman **Login** dan **Register**. Pengunjung boleh membuka Homepage tanpa akun, tetapi dashboard dirancang untuk diakses setelah login.

Pada tahap ini, proses autentikasi dan data dashboard boleh menggunakan **mock data atau simulasi frontend**. Tidak perlu membangun backend, database, pipeline data, model machine learning, atau layanan autentikasi sungguhan. Struktur frontend harus disiapkan agar integrasi backend dapat dilakukan kemudian tanpa perlu membangun ulang UI.

## 2. Tujuan

- Mengimplementasikan UI yang konsisten dengan empat desain halaman SIPADI.
- Membuat alur navigasi yang berfungsi di sisi frontend.
- Menyediakan halaman Login dan Register sebagai bagian dari alur pengguna.
- Menampilkan kartu metrik, grafik, peta ilustratif, tabel atau ringkasan, dan informasi penjelas.
- Membuat filter, tab, tombol, menu, dan kontrol lain memberikan respons UI yang sesuai.
- Menggunakan mock data terpusat agar konten dapat diganti dengan respons API di kemudian hari.
- Menjaga pemisahan antara komponen UI, data, dan logika presentasi agar siap diintegrasikan dengan backend.

## 3. Batasan Ruang Lingkup

### 3.1 Termasuk dalam tahap ini

- Implementasi seluruh halaman dan layout frontend.
- Responsive layout untuk desktop, tablet, dan mobile.
- Navigasi antarhalaman.
- UI Login dan Register beserta validasi formulir di sisi klien.
- Simulasi alur login/logout di frontend untuk kebutuhan demo.
- Simulasi proteksi route berdasarkan status login di frontend.
- Mock data untuk seluruh kartu, grafik, indikator, dan ringkasan.
- Filter wilayah dan tahun yang memperbarui tampilan menggunakan mock data.
- Interaksi tab fitur, tooltip, menu, tombol ekspor simulasi, dan kontrol grafik.
- Komponen loading, empty state, error state, dan data simulasi bila diperlukan.
- Dokumentasi struktur komponen serta titik integrasi API yang akan digunakan nanti.

### 3.2 Tidak termasuk dalam tahap ini

- Backend/API yang sebenarnya.
- Database dan penyimpanan akun.
- Autentikasi sungguhan, hashing kata sandi, pengelolaan token/sesi di server, atau verifikasi email.
- Fitur pemulihan kata sandi yang mengirim email sungguhan.
- Pengambilan data satelit, cuaca, curah hujan, atau produktivitas dari sumber eksternal.
- Pemrosesan dan harmonisasi data spasial.
- Pelatihan atau inferensi model machine learning.
- Perhitungan SHAP atau ALE secara langsung.
- Penyimpanan permanen data pengguna.
- Sistem role/permission backend.
- Pengiriman laporan ke layanan eksternal.

**Catatan penting:** status login dan proteksi route pada tahap frontend hanya untuk demonstrasi alur UI, bukan keamanan sesungguhnya. Perlindungan akses yang aman harus diterapkan kembali di backend ketika backend dikembangkan.

## 4. Target Pengguna

| Pengguna | Kebutuhan UI |
|---|---|
| Pengunjung | Memahami SIPADI dan menemukan tombol Login/Register. |
| Pengguna demo | Mencoba alur masuk dan menjelajahi dashboard. |
| Analis atau peneliti | Melihat indikator, grafik, SHAP, ALE, dan ringkasan insight. |
| Pengembang backend berikutnya | Memahami bentuk data dan titik integrasi yang disiapkan frontend. |

## 5. Peta Halaman dan Navigasi

| Halaman | URL yang disarankan | Akses UI |
|---|---|---|
| Homepage | `/` | Publik |
| Login | `/login` | Publik |
| Register | `/register` | Publik |
| Monitoring | `/dashboard/monitoring` | Simulasi login diperlukan |
| Explainable Analysis | `/dashboard/analysis` | Simulasi login diperlukan |
| Insight Produktivitas | `/dashboard/insight` | Simulasi login diperlukan |
| Tentang Sistem | `/dashboard/about` atau `/about` | Tentukan berdasarkan desain akhir |

Nama URL dapat disesuaikan dengan framework, tetapi struktur navigasi sebaiknya konsisten.

### 5.1 Alur pengguna

**Pengunjung baru**
1. Membuka Homepage.
2. Memilih Register.
3. Mengisi formulir dan melihat validasi frontend.
4. Setelah simulasi registrasi berhasil, diarahkan ke Login.
5. Melakukan simulasi login.
6. Masuk ke halaman Monitoring.

**Pengguna yang sudah memiliki akun**
1. Membuka Login.
2. Mengisi kredensial demo.
3. Melihat status berhasil/gagal sesuai aturan simulasi.
4. Setelah berhasil, diarahkan ke dashboard.
5. Menjelajahi Monitoring, Analysis, Insight, dan Tentang.
6. Memilih Logout untuk mengakhiri sesi demo dan kembali ke Homepage.

### 5.2 Perilaku route pada frontend

- Pengunjung dapat membuka Homepage, Login, dan Register tanpa login.
- Jika pengguna demo belum login lalu membuka route dashboard, tampilkan redirect ke Login.
- Jika login simulasi berhasil, arahkan pengguna ke halaman yang diminta sebelumnya atau Monitoring.
- Jika pengguna melakukan logout, ubah status UI menjadi belum login dan arahkan ke Homepage.
- Jangan menyimpan kata sandi pengguna. Untuk demo, gunakan mekanisme simulasi yang aman dan sederhana.
- Implementasi ini bukan pengganti autentikasi backend.

---

## 6. Spesifikasi UI — Homepage

### 6.1 Tujuan

Memperkenalkan SIPADI, menjelaskan manfaatnya, memberi gambaran alur kerja, serta mengarahkan pengguna ke Login/Register atau dashboard.

### 6.2 Bagian halaman

1. **Navbar**
   - Logo SIPADI.
   - Beranda, Monitoring, Analysis, Insight, Tentang Sistem.
   - Tombol Login dan Register untuk pengunjung.
   - Tombol Buka Dashboard jika status login demo aktif.

2. **Hero section**
   - Headline tentang pemantauan produktivitas tanaman dan faktor lingkungan.
   - Deskripsi singkat SIPADI.
   - CTA untuk mulai menjelajahi monitoring.
   - CTA sekunder untuk mempelajari alur sistem.
   - Visual lanskap sawah/satelit sesuai desain referensi.

3. **Ringkasan metrik**
   - NDVI.
   - LST.
   - Curah hujan.
   - Estimasi produktivitas.
   - Seluruh angka pada tahap frontend ditampilkan sebagai data contoh dan diberi penanda yang sesuai jika berpotensi disalahartikan sebagai data aktual.

4. **Alur kerja SIPADI**
   - Akuisisi data.
   - Harmonisasi spasial.
   - Komputasi prediktif.
   - Explainable AI.

5. **Preview analitik**
   - Preview peta petak sawah.
   - Preview kontribusi SHAP.
   - Preview kurva ALE.

6. **Aksesibilitas platform**
   - Kartu menuju Monitoring Spasial, Analisis Prediktif, Insight Multivariat, dan Tentang Sistem.

7. **CTA akhir dan footer**
   - Ajakan membuka dashboard.
   - Informasi ringkas platform, metodologi, dan riset.

### 6.3 Interaksi

- Tombol Login membuka `/login`.
- Tombol Register membuka `/register`.
- CTA dashboard membuka Monitoring jika status login demo aktif; jika belum, membuka Login.
- Navbar dapat menggulir ke bagian terkait atau berpindah ke route yang sesuai.
- Kartu preview dapat menjadi tautan ke halaman terkait, dengan pemeriksaan status login demo.

### 6.4 Kriteria penerimaan

- Semua bagian utama Homepage tersedia dan tersusun sesuai desain.
- Navbar dan CTA dapat digunakan.
- Pengunjung dapat membuka halaman Login/Register.
- Data contoh tidak diklaim sebagai data aktual.
- Layout menyesuaikan ukuran layar.

---

## 7. Spesifikasi UI — Login

### 7.1 Tujuan

Menyediakan tampilan untuk pengguna memasukkan kredensial dan melihat hasil simulasi login sebelum integrasi autentikasi backend.

### 7.2 Elemen UI

- Logo dan nama SIPADI.
- Judul dan deskripsi singkat.
- Input email.
- Input kata sandi dengan kontrol tampil/sembunyikan.
- Tombol Masuk.
- Tautan ke Register.
- Tautan Lupa Kata Sandi sebagai UI saja jika ditampilkan.
- Pesan validasi, status loading, pesan gagal, dan pesan berhasil.
- Tautan kembali ke Homepage.

### 7.3 Perilaku frontend

- Validasi kolom wajib dan format email.
- Konfirmasi kata sandi tidak diperlukan di halaman Login.
- Tombol Masuk menunjukkan loading sementara.
- Untuk demo, hasil login boleh menggunakan aturan mock yang terdokumentasi atau tombol mode demo.
- Login berhasil mengubah status autentikasi frontend dan membuka dashboard.
- Login gagal menampilkan pesan umum tanpa mengekspos informasi sensitif.
- Jangan mengirim atau menyimpan kredensial ke layanan eksternal pada tahap ini.

### 7.4 Kriteria penerimaan

- Input dapat digunakan dan divalidasi.
- Tombol tampil/sembunyikan kata sandi bekerja.
- Status loading dan pesan error dapat terlihat.
- Simulasi login berhasil membawa pengguna ke dashboard.
- Tautan Register membuka halaman registrasi.
- UI login dapat nantinya dihubungkan ke fungsi autentikasi tanpa mengubah layout utama.

---

## 8. Spesifikasi UI — Register

### 8.1 Tujuan

Menyediakan antarmuka pembuatan akun dengan validasi dasar di sisi klien.

### 8.2 Elemen UI

- Logo SIPADI.
- Input nama lengkap.
- Input email.
- Input kata sandi.
- Input konfirmasi kata sandi.
- Kontrol tampil/sembunyikan kata sandi.
- Checkbox persetujuan ketentuan/privasi jika diperlukan.
- Tombol Daftar.
- Tautan ke Login.
- Pesan validasi dan hasil simulasi registrasi.

### 8.3 Perilaku frontend

- Memvalidasi kolom wajib.
- Memvalidasi format email.
- Memastikan kata sandi dan konfirmasi kata sandi cocok.
- Menampilkan aturan kata sandi secara jelas.
- Menampilkan status loading saat submit simulasi.
- Setelah simulasi berhasil, tampilkan pesan berhasil dan arahkan pengguna ke Login.
- Tidak membuat akun sungguhan atau menyimpan data ke database pada tahap ini.

### 8.4 Kriteria penerimaan

- Seluruh input dan checkbox bekerja.
- Validasi muncul dekat dengan field yang relevan.
- Tombol Daftar memberi respons visual.
- Registrasi demo tidak diklaim sebagai pembuatan akun produksi.
- UI siap menerima respons dari API registrasi pada tahap berikutnya.

---

## 9. Layout Dashboard Bersama

### 9.1 Elemen global

- Sidebar hijau tua dengan logo SIPADI.
- Menu Monitoring, Analysis, Insight, dan Tentang.
- Header dengan filter Wilayah dan Tahun.
- Avatar atau menu profil.
- Tombol Ekspor pada halaman yang memerlukannya.
- Indikator halaman aktif.
- Area konten utama dengan judul, deskripsi, kartu, dan visualisasi.

### 9.2 Filter global

- Dropdown Wilayah, contoh pilihan: Tabanan, Badung, Gianyar.
- Dropdown Tahun, dengan pilihan tahun yang tersedia di mock data.
- Perubahan filter memperbarui komponen yang terhubung menggunakan mock data.
- Pilihan filter sebaiknya dipertahankan saat berpindah halaman jika memungkinkan.
- Jika kombinasi wilayah/tahun belum memiliki data, tampilkan empty state dan jangan menampilkan nilai yang menyesatkan.

### 9.3 Menu akun

- Menampilkan avatar/inisial pengguna demo.
- Menyediakan opsi Logout.
- Jika diperlukan, tampilkan nama pengguna demo.
- Jangan menampilkan informasi akun sensitif.

---

## 10. Spesifikasi UI — Monitoring Produktivitas

### 10.1 Tujuan

Memberikan gambaran cepat tentang estimasi produktivitas dan indikator lingkungan, serta tren produktivitas dari tahun ke tahun.

### 10.2 Komponen

1. **Judul halaman dan deskripsi**
   - “Monitoring Produktivitas”.
   - Deskripsi singkat mengenai indikator agroklimat dan estimasi produktivitas.

2. **Kartu metrik**
   - Produktivitas (ton/ha).
   - NDVI.
   - LST (°C).
   - Curah hujan (mm).
   - Masing-masing menampilkan nilai, satuan, status, dan keterangan singkat bila tersedia.

3. **Grafik tren produktivitas**
   - Grafik garis per tahun.
   - Label nilai pada titik penting.
   - Tooltip berisi tahun dan nilai.
   - Legenda yang membedakan realisasi dan estimasi jika keduanya ditampilkan.
   - Sumbu dan satuan yang jelas.

4. **Faktor prediksi**
   - Bar indikator seperti NDVI, Curah Hujan, dan LST.
   - Menampilkan nilai/bobot yang sesuai dengan definisi data mock.
   - Label harus menjelaskan apakah angka merupakan feature importance, persentase, atau metrik lain.

5. **Ekspor**
   - Tombol Ekspor.
   - Pada tahap frontend, tombol boleh membuka pilihan format atau mengunduh file contoh statis jika mudah.
   - Tidak perlu membuat proses pelaporan backend.

### 10.3 Interaksi

- Filter wilayah dan tahun memperbarui kartu serta grafik mock.
- Tooltip grafik aktif.
- Tombol Ekspor memberikan feedback UI yang jelas.
- Status loading/error/empty dapat didemonstrasikan melalui state komponen.

### 10.4 Kriteria penerimaan

- Kartu dan grafik konsisten dengan filter mock.
- Satuan dan label terlihat.
- Visualisasi dapat digunakan dengan mouse dan keyboard sejauh didukung library.
- Tampilan tetap terbaca di layar kecil.

---

## 11. Spesifikasi UI — Explainable Analysis

### 11.1 Tujuan

Menampilkan UI untuk memahami kontribusi indikator terhadap prediksi melalui SHAP dan pola respons prediksi melalui ALE. Perhitungan analisis belum dibuat pada tahap ini.

### 11.2 Bagian SHAP

- Judul bagian SHAP dan penjelasan singkat.
- Bar kontribusi untuk Curah Hujan, NDVI, dan LST.
- Nilai mean absolute SHAP atau nilai SHAP ditampilkan sesuai jenis data contoh yang dipilih.
- Bar positif dan negatif dibedakan dengan warna serta label.
- Baseline ditampilkan jika visualisasi memerlukan baseline.
- Keterangan singkat tentang arti nilai dan batas interpretasi.

**Ketentuan UI:** jangan mencampuradukkan mean absolute SHAP dengan SHAP bertanda. Mock data harus mengikuti jenis visualisasi yang ditampilkan.

### 11.3 Bagian ALE

- Judul dan deskripsi hubungan indikator dengan prediksi.
- Tab/pemilih fitur: NDVI, LST, Curah Hujan.
- Grafik garis respons ALE.
- Label sumbu dan satuan.
- Garis referensi baseline nol.
- Penanda nilai observasi atau titik kritis jika tersedia di mock data.
- Tooltip untuk nilai fitur dan efek.
- Ringkasan nilai fitur terpilih.

### 11.4 Interaksi

- Pemilihan tab mengganti grafik dan deskripsi mock.
- Tooltip menampilkan detail titik.
- Nilai ringkasan mengikuti fitur terpilih.
- Filter wilayah dan tahun memperbarui mock data terkait.

### 11.5 Kriteria penerimaan

- SHAP dan ALE dapat dibedakan secara visual dan tekstual.
- Tab fitur bekerja.
- Grafik memiliki label, satuan, dan tooltip.
- UI tidak mengklaim bahwa perhitungan SHAP/ALE sungguhan sudah dilakukan.
- Struktur komponen memungkinkan data grafik diganti dengan respons backend nanti.

---

## 12. Spesifikasi UI — Insight Produktivitas

### 12.1 Tujuan

Merangkum estimasi produktivitas, kontribusi indikator, pola hubungan, dan gambaran spasial dalam bentuk yang mudah dibaca.

### 12.2 Komponen

1. **Kartu prediksi utama**
   - Nilai produktivitas dan satuan.
   - Label periode dan wilayah.
   - Perbandingan dengan rerata atau baseline jika data contoh menyediakan pembanding.
   - Status estimasi sebagai contoh jika belum terhubung ke data aktual.

2. **Status sintesis panen**
   - Kategori seperti rendah, optimum, atau tinggi.
   - Indikator visual/range.
   - Keterangan ambang yang digunakan pada mock data.

3. **Ringkasan insight**
   - Kontributor utama.
   - Karakteristik hubungan model.
   - Indikator dengan kontribusi negatif.
   - Masing-masing berupa kartu dengan deskripsi singkat dan angka contoh.

4. **Kontribusi setiap indikator**
   - Grafik bar untuk NDVI, curah hujan, dan LST.
   - Penjelasan metrik yang digunakan.

5. **Pola hubungan indikator**
   - Grafik respons kecil.
   - Tab NDVI, LST, dan Curah Hujan.

6. **Peta prediksi produktivitas**
   - Peta ilustratif atau mock petak sawah.
   - Legenda kategori produktivitas.
   - Tooltip petak jika memungkinkan.
   - Label bahwa peta adalah ilustrasi/mock data apabila belum menggunakan data geospasial sebenarnya.

### 12.3 Interaksi

- Tab indikator mengganti grafik.
- Hover pada grafik atau petak menampilkan tooltip.
- Filter wilayah/tahun mengubah mock data.
- Kartu dapat menyediakan tautan ke halaman Analysis untuk detail pendukung.

### 12.4 Kriteria penerimaan

- Angka ringkasan dan grafik konsisten dengan mock data.
- Kategori memiliki legenda dan keterangan.
- Peta memiliki penanda data ilustratif.
- UI tidak menyajikan angka contoh sebagai hasil model yang sudah tervalidasi.

---

## 13. Spesifikasi UI — Tentang Sistem

Halaman Tentang dapat dibuat sebagai halaman sederhana yang mengikuti identitas visual SIPADI.

### Komponen yang disarankan

- Ringkasan tujuan SIPADI.
- Penjelasan singkat sumber indikator: NDVI, LST, dan curah hujan.
- Ringkasan alur kerja data.
- Penjelasan model prediktif dan XAI pada tingkat konseptual.
- Catatan keterbatasan dan status prototipe.
- Informasi versi aplikasi atau tim jika diperlukan.

Halaman ini bersifat informatif dan tidak membutuhkan integrasi backend pada tahap frontend.

---

## 14. Strategi Mock Data dan Kesiapan Integrasi Backend

### 14.1 Prinsip

- Simpan mock data di folder terpisah dari komponen presentasi.
- Hindari menulis angka contoh langsung di banyak komponen.
- Gunakan struktur data yang mudah dipetakan ke respons API.
- Gunakan fungsi data/service layer sebagai titik penghubung di masa depan.
- Komponen UI menerima data melalui props atau state, bukan mengambil data langsung di banyak tempat.
- Tandai mock data secara konsisten agar tidak disangka data aktual.

### 14.2 Contoh struktur mock data

```ts
type MonitoringSummary = {
  regionId: string;
  year: number;
  productivity: {
    value: number;
    unit: "ton/ha";
    type: "actual" | "estimate" | "mock";
  };
  ndvi: {
    value: number;
    status?: string;
  };
  lst: {
    value: number;
    unit: "°C";
  };
  rainfall: {
    value: number;
    unit: "mm";
    periodLabel: string;
  };
};
```

Contoh ini hanya kontrak data frontend. Bentuk final dapat disesuaikan saat API backend dirancang.

### 14.3 Lapisan data yang disarankan

```text
src/
  components/       # Komponen UI yang dapat digunakan ulang
  layouts/          # Layout publik dan dashboard
  pages/            # Homepage, Login, Register, Monitoring, Analysis, Insight
  routes/           # Konfigurasi route dan route guard demo
  services/         # Fungsi akses data; saat ini menggunakan mock
  mocks/            # Data contoh untuk seluruh halaman
  types/            # Tipe data dan kontrak frontend
  hooks/            # Hook state/filter yang digunakan bersama
  assets/           # Logo, ikon, dan gambar
  styles/           # Token warna, tipografi, dan styling global
```

Struktur ini merupakan rekomendasi, bukan kewajiban framework tertentu.

### 14.4 Kontrak integrasi masa depan

Ketika backend tersedia:
- Fungsi pada `services/` diganti atau dilengkapi dengan pemanggilan API.
- Bentuk data dari API dipetakan ke tipe frontend.
- Komponen presentasi tetap digunakan selama kontrak data tidak berubah secara mendasar.
- Status loading, error, empty, dan sukses tetap dipakai.
- Simulasi login diganti dengan autentikasi sungguhan.
- Route guard demo diganti/dilengkapi dengan status autentikasi nyata; backend tetap menjadi pihak yang memvalidasi akses.

---

## 15. Design System dan Komponen Reusable

### 15.1 Arah visual

Ikuti desain referensi yang diberikan:
- Hijau tua sebagai warna utama sidebar dan elemen identitas.
- Hijau sedang untuk aksi utama, status positif, dan menu aktif.
- Latar krem/putih hangat.
- Border tipis dengan warna netral hangat.
- Biru untuk curah hujan.
- Hijau untuk NDVI.
- Koral/merah untuk kontribusi negatif.
- Kuning/emas untuk kategori peringatan.
- Sudut kartu membulat, bayangan ringan, dan ruang antarbagian yang konsisten.

Pastikan kontras teks memadai. Jangan hanya mengandalkan warna untuk membedakan status; sertakan label atau ikon.

### 15.2 Komponen reusable

- `AppSidebar`
- `AppHeader`
- `PageTitle`
- `RegionSelect`
- `YearSelect`
- `MetricCard`
- `StatusBadge`
- `ChartCard`
- `ShapContributionChart`
- `AleResponseChart`
- `ProductivityMap`
- `InsightCard`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `LoginForm`
- `RegisterForm`
- `PasswordInput`
- `UserMenu`
- `ExportButton`

Nama dapat menyesuaikan konvensi proyek.

### 15.3 Responsive design

- Desktop: sidebar tetap dan area konten utama luas.
- Tablet: sidebar dapat dipersempit atau diubah menjadi drawer.
- Mobile: navigasi menjadi menu yang mudah dibuka, filter disusun vertikal, kartu menjadi satu kolom, dan grafik tetap dapat dibaca.
- Tabel, grafik, dan peta harus memiliki perilaku overflow yang terkontrol.
- Hindari ukuran teks yang terlalu kecil untuk label dan legenda.

---

## 16. State UI yang Wajib Disiapkan

Untuk komponen yang menampilkan data, siapkan variasi berikut meskipun pada awalnya menggunakan simulasi:

- **Loading:** skeleton atau indikator proses.
- **Success:** data berhasil ditampilkan.
- **Empty:** tidak ada data untuk filter terpilih.
- **Error:** data gagal dimuat.
- **Mock/Demo:** data bersifat ilustratif.
- **Disabled:** aksi belum tersedia.
- **Unauthenticated:** pengguna perlu login.
- **Form validation:** input belum valid.
- **Submitting:** form sedang diproses.
- **Success feedback:** aksi berhasil dalam simulasi.

State ini akan memudahkan penggantian mock data dengan API tanpa perlu merombak seluruh tampilan.

---

## 17. Kebutuhan Nonfungsional Frontend

| Aspek | Persyaratan |
|---|---|
| Responsivitas | Halaman utama berfungsi pada desktop, tablet, dan mobile. |
| Konsistensi | Warna, tipografi, jarak, tombol, dan kartu menggunakan aturan desain yang konsisten. |
| Performa UI | Hindari render ulang yang tidak perlu; grafik berat dapat dimuat sesuai kebutuhan. |
| Aksesibilitas | Input memiliki label; tombol dan menu dapat digunakan dengan keyboard; status tidak hanya dibedakan dengan warna. |
| Maintainability | Komponen reusable dan data terpisah dari presentasi. |
| Type safety | Jika memakai TypeScript, definisikan tipe data untuk metrik dan respons grafik. |
| Penanganan error | Error dan data kosong memiliki tampilan yang terarah. |
| Browser | Mendukung browser desktop modern yang ditetapkan untuk proyek. |
| Keamanan demo | Jangan menyimpan kata sandi atau mengklaim route guard frontend sebagai proteksi keamanan produksi. |
| Integrasi | Pemanggilan data diarahkan melalui service layer agar mudah diganti dengan API. |

---

## 18. Prioritas Implementasi Frontend

### P0 — Wajib untuk demo UI

- [ ] Design tokens dan layout dasar.
- [ ] Homepage sesuai desain.
- [ ] Login dan Register.
- [ ] Navigasi dan simulasi login/logout.
- [ ] Layout dashboard dan sidebar.
- [ ] Filter wilayah/tahun dengan mock data.
- [ ] Halaman Monitoring dan grafik tren.
- [ ] Halaman Explainable Analysis dengan SHAP dan ALE mock.
- [ ] Halaman Insight Produktivitas.
- [ ] Halaman Tentang.
- [ ] Loading, empty, error, dan validasi formulir.
- [ ] Responsive layout.
- [ ] Penanda data contoh/mock.

### P1 — Penyempurnaan UI

- [ ] Tooltip dan interaksi grafik.
- [ ] Peta ilustratif dengan tooltip petak.
- [ ] Tombol ekspor simulasi.
- [ ] Persistensi filter selama navigasi.
- [ ] Animasi ringan dan transisi antarstate.
- [ ] Pengujian aksesibilitas dan responsivitas.

### P2 — Persiapan integrasi

- [ ] Tipe data dan kontrak frontend.
- [ ] Service layer untuk mock data.
- [ ] Dokumentasi titik pemanggilan API.
- [ ] Konfigurasi environment untuk URL API di masa depan.
- [ ] Pemisahan mekanisme autentikasi dari komponen formulir.

---

## 19. Kriteria Penerimaan Keseluruhan

- [ ] Seluruh halaman yang disepakati tersedia dan dapat dinavigasi.
- [ ] Tampilan mengikuti referensi visual SIPADI.
- [ ] Pengunjung dapat membuka Homepage tanpa login.
- [ ] Login dan Register memiliki validasi frontend.
- [ ] Simulasi login mengizinkan pengguna demo masuk ke dashboard.
- [ ] Route dashboard mengarahkan pengguna yang belum login ke Login.
- [ ] Logout mengembalikan status UI menjadi belum login.
- [ ] Seluruh kartu dan grafik menggunakan mock data terpusat.
- [ ] Filter wilayah/tahun mengubah tampilan sesuai mock data.
- [ ] SHAP, ALE, dan peta hanya divisualisasikan menggunakan data contoh pada tahap ini.
- [ ] Loading, empty, error, dan form validation state tersedia.
- [ ] Layout dapat digunakan pada desktop, tablet, dan mobile.
- [ ] Komponen tidak terikat langsung pada satu sumber data sehingga dapat menerima data dari API nanti.
- [ ] Tidak ada klaim bahwa backend, autentikasi produksi, atau model prediktif telah diimplementasikan.

---

## 20. Tahapan Pengerjaan yang Disarankan

1. **Fondasi UI**
   - Siapkan project, routing, font, warna, token desain, dan komponen dasar.

2. **Homepage dan autentikasi**
   - Implementasikan Homepage, Login, Register, validasi, dan simulasi alur pengguna.

3. **Layout dashboard**
   - Implementasikan sidebar, header, filter global, menu akun, dan route guard demo.

4. **Halaman Monitoring**
   - Buat kartu metrik, grafik tren, faktor prediksi, dan tombol ekspor simulasi.

5. **Halaman Explainable Analysis**
   - Buat grafik SHAP, pemilih fitur ALE, grafik respons, dan tooltip.

6. **Halaman Insight**
   - Buat kartu ringkasan, grafik kontribusi, grafik respons, dan peta ilustratif.

7. **Halaman Tentang dan responsive refinement**
   - Lengkapi konten informatif, tampilan mobile, dan state UI.

8. **Validasi frontend**
   - Uji seluruh route, form, filter, tooltip, state kosong/error, dan logout.
   - Pastikan tidak ada ketergantungan pada backend sungguhan.

9. **Persiapan integrasi**
   - Dokumentasikan tipe data dan service layer yang nanti akan dihubungkan ke API.

---

## 21. Keputusan Implementasi yang Perlu Ditentukan

Keputusan berikut berhubungan dengan frontend dan dapat dipilih sebelum atau saat implementasi:

- Framework frontend dan routing yang digunakan.
- Library grafik yang dipakai.
- Library peta yang digunakan atau apakah peta cukup berupa ilustrasi SVG.
- Apakah Homepage memakai gambar statis atau ilustrasi lokal.
- Apakah data demo ditandai dengan badge “Demo” atau “Data Ilustrasi”.
- Aturan simulasi login yang digunakan untuk presentasi.
- Apakah filter global dipertahankan antarhalaman.
- Format dan perilaku tombol ekspor simulasi.
- Target browser dan breakpoint responsive.

Detail backend seperti database, algoritma autentikasi produksi, sumber data satelit, pipeline pemrosesan, dan deployment API **tidak perlu diputuskan untuk menyelesaikan tahap UI ini**.

---

## 22. Kesimpulan

PRD ini secara khusus mendefinisikan **implementasi frontend SIPADI**, bukan pembangunan sistem end-to-end. Fokus pengerjaan adalah menghasilkan UI yang lengkap, konsisten, interaktif, responsif, dan siap dipasangkan dengan backend di tahap berikutnya.

Login dan Register tetap dibuat sebagai bagian dari pengalaman pengguna, tetapi prosesnya hanya berupa simulasi frontend. Data Monitoring, SHAP, ALE, dan Insight menggunakan mock data. Tidak ada backend, database, pemrosesan data satelit, maupun perhitungan machine learning yang dibangun dalam tahap ini.

Prinsip utama implementasi adalah memisahkan UI dari sumber data melalui mock/service layer dan tipe data yang jelas. Dengan demikian, saat backend tersedia, integrasi dapat dilakukan dengan mengganti sumber data dan mekanisme autentikasi tanpa harus membangun ulang seluruh antarmuka.
