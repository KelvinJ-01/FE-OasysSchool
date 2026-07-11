# Oasys School — Dashboard Web

Dasbor web untuk **Administrator** dan **Guru** di platform manajemen presensi & administrasi sekolah Oasys School. Dibangun di atas template [TailAdmin](https://tailadmin.com) (React + Tailwind CSS v4).

> Orang Tua/Wali Murid **tidak** menggunakan dasbor ini — akun mereka hanya bisa dipakai lewat Aplikasi Mobile (lihat NFR-SEC.5 di FSD). Halaman publik registrasi Orang Tua tetap ada di sini (`/signup`), tapi setelah verifikasi mereka diarahkan ke aplikasi mobile.

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Mulai Development](#mulai-development)
- [Environment Variables](#environment-variables)
- [Struktur Folder](#struktur-folder)
- [Modul & Fitur](#modul--fitur)
- [Role & Akses (RBAC)](#role--akses-rbac)
- [Arsitektur & Konvensi](#arsitektur--konvensi)
- [Dokumentasi Terkait](#dokumentasi-terkait)
- [Status & Keterbatasan Diketahui](#status--keterbatasan-diketahui)

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 (konfigurasi berbasis CSS di `src/index.css`, tanpa `tailwind.config.js`) |
| Routing | [`react-router`](https://reactrouter.com) v7 (bukan `react-router-dom` — sudah dikonsolidasi, lihat [Arsitektur & Konvensi](#arsitektur--konvensi)) |
| HTTP client | Axios |
| Ikon | [lucide-react](https://lucide.dev) |
| Auth token | `jwt-decode` |

## Mulai Development

### Prasyarat

- Node.js 18+
- npm

### Instalasi

```bash
npm install
cp .env.example .env   # lalu isi VITE_API_BASE_URL sesuai backend kamu
npm run dev
```

### Scripts

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan dev server (Vite) |
| `npm run build` | Type-check (`tsc -b`) lalu build produksi |
| `npm run lint` | ESLint |
| `npm run preview` | Preview hasil build produksi secara lokal |

## Environment Variables

Lihat `.env.example` untuk daftar lengkap. Yang wajib diisi:

| Variabel | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | Base URL backend NestJS, mis. `http://localhost:3000/api/v1` |
| `VITE_APP_PLATFORM` | Selalu `web` — dikirim di setiap request login/refresh (NFR-SEC.5) |
| `VITE_TOKEN_STORAGE_KEY` | Key `localStorage` untuk access token |
| `VITE_REFRESH_TOKEN_STORAGE_KEY` | Key `localStorage` untuk refresh token |

## Struktur Folder

```
src/
├── components/
│   ├── auth/              # Form-form autentikasi (SignIn, SignUp, dst)
│   ├── common/             # Komponen bersama (DataTable, Avatar, Spinner, Skeleton, Toast, dst)
│   ├── dashboard/          # Widget Dashboard Home
│   ├── UserProfile/        # Kartu profil & ganti password
│   ├── reports/            # Filter ekspor laporan
│   └── header/             # UserDropdown, dll (bawaan template + kustomisasi)
├── context/
│   ├── AuthContext.tsx     # Sesi login, refresh token, decode JWT
│   └── ToastContext.tsx    # Notifikasi toast terpusat
├── hooks/
│   ├── useAuth.ts
│   └── useToast.ts
├── layout/                 # AppLayout, AppSidebar, AppHeader, Backdrop
├── lib/
│   └── apiClient.ts        # Axios instance + interceptor refresh token otomatis
├── pages/
│   ├── AuthPages/           # SignIn, SignUp, VerifyCode, ResetPassword, NewPassword
│   ├── Dashboard/           # Home
│   ├── DataMaster/          # Siswa, Kelas, Tahun Ajaran, Mapel, Guru, Orang Tua
│   ├── Schedules/           # Jadwal Pembelajaran
│   ├── Attendance/          # Presensi
│   ├── Reports/             # Laporan Presensi
│   ├── Donations/           # Donasi (internal)
│   ├── OtherPage/           # NotFound, Forbidden, ServerError
│   ├── Welcome.tsx          # Landing publik
│   ├── DonationLanding.tsx  # Donasi publik (personal, terpisah dari Donations internal)
│   ├── PrivacyPolicy.tsx
│   └── UserProfiles.tsx
├── routes/
│   └── ProtectedRoute.tsx   # Guard login + RBAC per-role
└── types/                   # Tipe TypeScript, 1:1 dengan API Specification Document
```

## Modul & Fitur

| Modul | Route | Guru | Administrator |
|---|---|---|---|
| Dashboard Home | `/dashboard` | Ringkasan kelas yang diampu | Ringkasan seluruh sekolah |
| Data Master — Siswa | `/data-master/students` | Baca | CRUD + ubah status |
| Data Master — Kelas | `/data-master/classes` | Baca | CRUD |
| Data Master — Tahun Ajaran | `/data-master/academic-terms` | Baca | Create + Update (tanpa delete) |
| Data Master — Mata Pelajaran | `/data-master/subjects` | Baca | CRUD |
| Data Master — Guru | `/data-master/teachers` | Tidak ada akses | Baca |
| Data Master — Orang Tua | `/data-master/parents` | Tidak ada akses | Baca |
| Jadwal Pembelajaran | `/schedules` | Baca | CRUD + deteksi bentrok |
| Presensi | `/attendance` | Baca + koreksi status | Baca + koreksi status |
| Laporan Presensi | `/reports` | Ekspor (kelas sendiri, wajib pilih kelas) | Ekspor (opsional per kelas) |
| Donasi | `/donations` | Baca | Baca |
| Profil Saya | `/profile` | Edit profil, foto, ganti password | sama |

Alur publik (tanpa login): `/` (Welcome), `/signin`, `/signup`, `/verify-code`, `/reset-password`, `/new-password`, `/privacy-policy`, `/donasi`.

## Role & Akses (RBAC)

Empat role di sistem: `developer`, `administrator`, `teacher`, `parent`. **Hanya `administrator` dan `teacher` yang bisa masuk dasbor ini** — ditegakkan di `ProtectedRoute` (default `allowedRoles`), bukan cuma disembunyikan di UI. `developer` punya Panel Pengembang terpisah; `parent` eksklusif Aplikasi Mobile.

Route yang butuh role lebih sempit (mis. Data Master Guru/Orang Tua, khusus `administrator`) dibungkus `ProtectedRoute` bertingkat — lihat `App.tsx`.

## Arsitektur & Konvensi

**Autentikasi & sesi**
- `AuthContext` menyimpan `accessToken` (JWT, berumur 1 jam) dan `refreshToken` (±30 hari, dirotasi tiap dipakai) di `localStorage`.
- `apiClient.ts` — interceptor Axios otomatis mencoba refresh sekali saat menerima `401`, dengan antrean supaya request paralel tidak memicu banyak refresh sekaligus. Kalau refresh gagal, sesi dibersihkan dan toast "Sesi berakhir" muncul.
- Klaim JWT yang didekode di frontend: `sub`, `role`, `schoolId`, `fullName`, `photoUrl`, `email`, `platform`, `exp` — beberapa field (`fullName`/`photoUrl`/`email`) baru ikut ter-update setelah refresh/login ulang, bukan real-time.

**Desain & styling**
- Warna brand (`brand-*`, `secondary-*`) diambil **persis** dari logo asli — jangan reka warna baru tanpa mengukur dari aset logo.
- Font `font-jakarta`/`font-display` khusus halaman publik/auth (Welcome, SignIn, dst). Dasbor internal tetap pakai `font-outfit` (default template) — dua bahasa desain yang disengaja beda konteks.
- Ikon: **lucide-react** saja. Sistem ikon lama (`src/icons/*.svg` + `vite-plugin-svgr`) sudah dimigrasikan penuh dan dihapus.

**Komponen bersama penting**
- `DataTable` — tabel generik dengan pagination & skeleton loading, dipakai di 8+ halaman.
- `Spinner` / `Skeleton` / `PageLoader` — indikator loading terstandardisasi (lihat `src/components/common/`).
- `ToastContext` — `useToast().toast.success()/.error()/.info()/.warning()`, dipakai untuk konfirmasi aksi, bukan validasi field (validasi tetap inline dekat input).
- `CopyField` — field info dengan tombol salin-ke-clipboard (dipakai di halaman Donasi).

## Dokumentasi Terkait

Empat dokumen kontrak ini adalah **sumber kebenaran** untuk kontrak API, skema database, dan requirement bisnis — kode frontend ini seharusnya selalu mengikuti dokumen, bukan sebaliknya:

| Dokumen | Versi terakhir |
|---|---|
| API Specification Document | v2.3 |
| Database Design Document | v1.3 |
| Functional Specification Document (FSD) | v1.2 |
| Product Requirements Document (PRD) | v2.2 |

> Setiap kali ada perubahan kontrak (endpoint baru, field baru, aturan RBAC baru), dokumen-dokumen ini **wajib** diperbarui bersamaan dengan kodenya — jangan biarkan kode dan dokumen bercabang.

## Status & Keterbatasan Diketahui

- **Verifikasi backend** — sebagian endpoint sudah didokumentasikan lengkap di API Spec tapi implementasi NestJS-nya perlu dicek satu-satu: `/dashboard/summary`, `/users/me` (+foto), `/legal/privacy-policy`, `/users` (direktori Guru/Admin/Orang Tua), `/schedules` PATCH/DELETE, `/attendance-records/*`, `/donations`.
- **Testing otomatis** — belum ada sama sekali (unit maupun E2E).
- **Tata letak file ekspor (XLSX/CSV)** — spesifikasinya sudah didokumentasikan (API Spec §3.8), tapi implementasi generate file ada di **backend**, bukan repo ini.
- **`/dashboard/summary`, `GET /users`, dll** tidak punya field "target/goal" untuk progres — jangan tambahkan bar persentase yang mengarang angka di frontend tanpa data backing.
- **Refresh token & profil** — `fullName`/`photoUrl`/`email` di UI berasal dari JWT, bukan fetch real-time; ada jeda sampai token berikutnya di-refresh setelah perubahan di halaman Profil.