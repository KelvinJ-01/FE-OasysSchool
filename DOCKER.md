# Menjalankan Oasys School Dashboard dengan Docker

Panduan ini menjelaskan cara membangun dan menjalankan dashboard sebagai kontainer.

## Ringkasan

Aplikasi ini adalah SPA (React + Vite) yang dikompilasi menjadi berkas statis, lalu
disajikan oleh nginx. Prosesnya dua tahap dalam satu `Dockerfile`:

1. **Tahap `build`** — Node 22 memasang dependensi dan menjalankan `npm run build`.
2. **Tahap `runtime`** — nginx menyajikan hasil build. Node tidak ikut ke image akhir,
   sehingga ukurannya kecil dan permukaan serangannya sempit.

## Dua cara memakai berkas Docker ini

**Untuk merilis (deploy).** Anda tidak memerlukan Docker di komputer Anda. GitHub Actions
yang membangun image, lalu server produksi menariknya. Langsung ke bagian
[Membangun image tanpa Docker di komputer Anda](#membangun-image-tanpa-docker-di-komputer-anda-cicd).

**Untuk menjalankan kontainer secara lokal.** Barulah Docker perlu terpasang; ikuti
bagian Prasyarat di bawah. Perlu dicatat, untuk pengembangan sehari-hari `npm run dev`
sudah memadai dan lebih cepat — Docker lokal hanya berguna bila Anda ingin menguji
hasil build produksi persis seperti yang berjalan di server.

## Prasyarat (hanya untuk menjalankan Docker secara lokal)

- Docker Engine 20.10 atau lebih baru
- Docker Compose v2 (`docker compose`, tanpa tanda hubung)

Keduanya dapat diperoleh lewat Docker Desktop maupun Colima. Pengguna **macOS 12
Monterey** perlu membaca bagian khusus di bawah karena Docker Desktop terbaru tidak dapat
dipasang di sana. Bila keduanya tidak dapat dipasang, lewati bagian ini — merilis lewat
CI/CD tetap dapat dilakukan.

Periksa versi Anda:

```bash
docker version
docker compose version
```

Perintah pertama harus menampilkan **dua** bagian, `Client` dan `Server`. Bila hanya
`Client` yang muncul disertai pesan `Cannot connect to the Docker daemon`, mesin Docker
belum berjalan — jalankan aplikasi Docker Desktop terlebih dahulu.

### Khusus macOS 12 Monterey

Docker Desktop hanya mendukung versi macOS saat ini dan dua rilis mayor sebelumnya. Per
2026 yang didukung adalah macOS 13 Ventura, 14 Sonoma, dan 15 Sequoia, sehingga
**installer Docker Desktop terbaru menolak dipasang di Monterey** (biasanya muncul pesan
menyesatkan seperti "Docker.dmg is corrupt", padahal masalahnya versi macOS).

Ada dua jalan, keduanya menghasilkan Docker Engine yang mampu menjalankan berkas Docker
di repositori ini tanpa penyesuaian apa pun.

#### Opsi A — Colima (disarankan)

Colima menjalankan Docker Engine di dalam VM Linux ringan dan dikendalikan sepenuhnya
lewat terminal. Karena Colima dipasang melalui Homebrew, ia **tidak terikat batasan versi
macOS milik Docker Desktop**, sehingga Anda tetap memperoleh Docker Engine terkini beserta
pembaruan keamanannya. Colima juga gratis dan bersumber terbuka, tanpa ketentuan lisensi
berbayar Docker Desktop.

1. Copot sisa Docker lama. Ini penting: sisa biner dari pemasangan Docker Desktop
   terdahulu dapat membuat pemasangan lewat Homebrew gagal.

   ```bash
   sudo rm -rf /Applications/Docker.app
   sudo rm -f /usr/local/bin/docker /usr/local/bin/docker-compose /usr/local/bin/hub-tool
   ```

2. Pasang Homebrew bila belum ada:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. Pasang Colima beserta Docker CLI, Compose, dan Buildx:

   ```bash
   brew install colima docker docker-compose docker-buildx
   ```

   Paket `colima` menyediakan mesinnya, `docker` menyediakan perintah CLI, sedangkan
   `docker-compose` dan `docker-buildx` menyediakan sub-perintah `docker compose` dan
   `docker buildx`.

4. Jalankan mesinnya. Bawaannya 2 CPU dan 2 GB memori — cukup untuk proyek ini:

   ```bash
   colima start
   ```

   Bila ingin lebih lega: `colima start --cpu 4 --memory 8`.

5. Verifikasi:

   ```bash
   docker version
   docker compose version
   docker run --rm hello-world
   ```

   `docker version` harus menampilkan bagian `Server`, bukan galat koneksi.

Perintah harian Colima:

```bash
colima status
colima stop
colima start
colima delete
```

Colima tidak berjalan otomatis saat Mac dinyalakan; jalankan `colima start` lebih dulu
sebelum memakai perintah `docker`.

#### Opsi B — Docker Desktop 4.41.2

Versi terakhir yang mendukung Monterey adalah **Docker Desktop 4.41.2** (rilis 6 Mei
2025); versi 4.42 ke atas mensyaratkan Ventura 13.3 atau lebih baru. Pilih opsi ini bila
Anda memang menginginkan antarmuka grafis Docker Desktop.

Tautan unduhan resmi Docker untuk 4.41.2:

- Mac chip Intel: `https://desktop.docker.com/mac/main/amd64/191736/Docker.dmg`
- Mac chip Apple (M1–M4): `https://desktop.docker.com/mac/main/arm64/191736/Docker.dmg`

Untuk memastikan chip Mac Anda, jalankan `uname -m` — hasilnya `x86_64` berarti Intel,
`arm64` berarti Apple Silicon.

Langkah pemasangan:

1. Copot Docker versi lama bila ada. Docker 17.03 (2017) tidak dapat menjalankan berkas
   ini: `HEALTHCHECK` dan multi-stage build membutuhkan Docker 17.06 ke atas, dan versi
   setua itu juga menimbulkan galat `missing signature key` saat menarik image dari
   Docker Hub. Hapus `/Applications/Docker.app` ke Trash sebelum memasang yang baru.
2. Unduh `.dmg` sesuai chip Anda dari tautan di atas.
3. Buka berkas `.dmg`, seret ikon Docker ke folder Applications.
4. Jalankan Docker.app. Bila macOS menolak dengan alasan "cannot check it for malicious
   software", klik kanan aplikasinya lalu pilih **Open**.
5. Tunggu ikon paus di menu bar berhenti beranimasi, lalu verifikasi seperti pada
   langkah 5 opsi Colima.

Catatan: 4.41.2 tidak lagi menerima pembaruan keamanan, dan versi berikutnya tidak akan
bisa dipasang di Monterey. Inilah alasan Colima lebih disarankan untuk macOS 12.

Apa pun opsi yang dipilih, perintah pada bagian-bagian berikutnya berlaku sama.

## Membangun image tanpa Docker di komputer Anda (CI/CD)

Anda tidak perlu Docker terpasang untuk merilis image. Berkas
`.github/workflows/docker.yml` membuat GitHub Actions membangun image setiap kali ada
push ke `main`, lalu menyimpannya di GitHub Container Registry (GHCR).

Pendekatan ini bukan sekadar jalan pintas ketika Docker tidak dapat dipasang; ia memang
lebih baik untuk rilis. Build berjalan di lingkungan yang bersih dan sama setiap kali,
tidak terpengaruh versi Node atau berkas `.env` di komputer masing-masing orang, dan
setiap image punya jejak commit yang jelas.

### Alur kerjanya

1. Push ke `main` (atau buat tag `v1.0.0`).
2. GitHub menjalankan pemeriksaan: `tsc`, `eslint`, `npm run build`, dan `npm audit`.
3. Bila semua lolos, image dibangun dan didorong ke GHCR.
4. Server produksi menarik image tersebut lalu menjalankannya.

Pada pull request, pemeriksaan tetap berjalan namun image tidak didorong — sehingga PR
tidak dapat merusak rilis.

### Melihat hasilnya

Buka tab **Actions** di repositori GitHub Anda untuk memantau prosesnya. Setelah selesai,
image muncul di halaman **Packages** repositori dengan nama:

```
ghcr.io/kelvinj-01/fe-oasysschool:latest
```

Tag yang dihasilkan otomatis:

- `latest` — commit terakhir di `main`
- `main` — sama seperti di atas, dinamai sesuai branch
- `sha-abc1234` — versi tepat dari sebuah commit, berguna untuk rollback
- `1.0.0`, `1.0` — bila Anda membuat tag git `v1.0.0`

### Mengatur alamat API untuk image hasil CI

Karena variabel `VITE_*` dibaca saat build, alamat API ditentukan lewat pengaturan
repositori, bukan saat kontainer dijalankan.

Buka **Settings → Secrets and variables → Actions → Variables**, lalu tambahkan:

| Nama | Contoh nilai |
| --- | --- |
| `VITE_API_BASE_URL` | `https://api.sekolah-anda.sch.id/api/v1` |
| `VITE_APP_NAME` | `Oasys School Dashboard` |

Bila `VITE_API_BASE_URL` tidak diisi, workflow memakai `/api/v1` (alamat relatif), yang
cocok bila nginx meneruskan `/api/` ke backend — lihat bagian proxy di bawah.

Untuk nilai rahasia seperti `VITE_SENTRY_DSN`, gunakan **Secrets**, bukan Variables.

### Menjalankan image di server

Di server mana pun yang punya Docker (VPS Linux, server sekolah, layanan kontainer):

```bash
docker login ghcr.io -u USERNAME_GITHUB_ANDA
docker pull ghcr.io/kelvinj-01/fe-oasysschool:latest
docker run -d --name oasys-dashboard -p 80:80 --restart unless-stopped \
  ghcr.io/kelvinj-01/fe-oasysschool:latest
```

Untuk login, buat Personal Access Token di GitHub dengan cakupan `read:packages`.

Image bersifat privat mengikuti repositori. Bila ingin dapat ditarik tanpa login, ubah
visibilitasnya menjadi publik di halaman Packages.

## Cara tercepat: Docker Compose

Dari folder proyek:

```bash
docker compose up --build -d
```

Buka `http://localhost:8080`.

Menghentikan:

```bash
docker compose down
```

Melihat log:

```bash
docker compose logs -f web
```

## Tanpa Compose

Membangun image:

```bash
docker build -t oasys-school-dashboard:latest .
```

Menjalankan kontainer:

```bash
docker run -d --name oasys-dashboard -p 8080:80 oasys-school-dashboard:latest
```

Menghentikan dan menghapus:

```bash
docker stop oasys-dashboard && docker rm oasys-dashboard
```

## Mengatur alamat API

Penting: variabel `VITE_*` dibaca **saat build**, bukan saat kontainer berjalan. Vite
menyisipkan nilainya langsung ke dalam berkas JavaScript hasil kompilasi. Karena itu
alamat API ditentukan lewat build argument, bukan environment variable kontainer.

Dengan Compose, salin `.env.example` menjadi `.env` lalu sesuaikan:

```bash
cp .env.example .env
```

Isi `.env` (dibaca otomatis oleh Compose):

```
VITE_API_BASE_URL=https://api.sekolah-anda.sch.id/api/v1
WEB_PORT=8080
```

Lalu bangun ulang:

```bash
docker compose up --build -d
```

Tanpa Compose:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.sekolah-anda.sch.id/api/v1 \
  -t oasys-school-dashboard:latest .
```

Mengubah alamat API **wajib** disertai build ulang image.

## Menyatukan API di balik nginx (opsional)

Bila backend berjalan di jaringan Docker yang sama, nginx dapat meneruskan `/api/`
ke sana sehingga browser hanya menghubungi satu alamat dan CORS tidak diperlukan.

1. Ganti config yang disalin di `Dockerfile`:

   ```dockerfile
   COPY docker/nginx.with-api-proxy.conf /etc/nginx/conf.d/default.conf
   ```

2. Sesuaikan `proxy_pass` di `docker/nginx.with-api-proxy.conf` agar menunjuk nama
   service backend Anda (bawaannya `http://api:3000`).

3. Bangun dengan `VITE_API_BASE_URL=/api/v1` supaya klien memanggil alamat relatif:

   ```bash
   docker compose build --build-arg VITE_API_BASE_URL=/api/v1
   ```

4. Pastikan service backend berada pada jaringan Compose yang sama dan bernama `api`.

Catatan: config bawaan (`docker/nginx.conf`) sengaja **tanpa** blok proxy. nginx gagal
start bila `proxy_pass` menunjuk host yang tidak ada, sehingga proxy dibuat sebagai
pilihan sadar, bukan bawaan.

## Perilaku yang sudah diatur

- **Rute SPA** — refresh di `/data-master/students` tidak menghasilkan 404; seluruh
  rute yang tidak cocok dengan berkas dikembalikan ke `index.html`.
- **Cache** — aset ber-hash (JS, CSS, font, gambar) di-cache satu tahun; `index.html`
  tidak pernah di-cache agar rilis baru langsung terlihat.
- **Kompresi** — gzip aktif untuk teks, JSON, JS, CSS, dan SVG.
- **Header keamanan** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- **Health check** — Docker menandai kontainer `unhealthy` bila nginx berhenti melayani.

## Pemecahan masalah

**Port 8080 sudah terpakai**
Ganti lewat `.env` (`WEB_PORT=9090`) atau `-p 9090:80` pada `docker run`.

**Halaman terbuka tetapi semua permintaan API gagal**
Biasanya `VITE_API_BASE_URL` masih menunjuk `localhost` padahal aplikasi diakses dari
mesin lain, atau backend belum mengizinkan asal (CORS) dashboard. Periksa tab Network
di peramban untuk melihat alamat yang benar-benar dipanggil.

**Perubahan kode tidak muncul**
Image lama masih terpakai. Bangun ulang dengan `docker compose up --build -d`, dan bila
perlu paksa tanpa cache: `docker compose build --no-cache`.

**`npm ci` gagal saat build**
`package-lock.json` tidak sinkron dengan `package.json`. Jalankan `npm install` di mesin
Anda, commit lockfile yang diperbarui, lalu bangun ulang.

**`Cannot connect to the Docker daemon at unix:///var/run/docker.sock`**
Mesin Docker belum berjalan. Buka aplikasi Docker Desktop dan tunggu sampai ikon paus di
menu bar berhenti beranimasi, lalu ulangi perintah.

**`missing signature key` saat menarik image**
Docker Engine Anda terlalu tua untuk registry Docker Hub saat ini. Gejala ini muncul pada
Docker 17.x. Pasang Docker Desktop 4.41.2 seperti dijelaskan di bagian Prasyarat.

**`Docker.dmg is corrupt` atau installer menolak dipasang**
Berkasnya tidak rusak — versi macOS Anda yang tidak didukung installer tersebut. Untuk
macOS 12 Monterey, gunakan Docker Desktop 4.41.2.

**`docker: 'compose' is not a docker command`**
Compose v2 belum tersedia (Docker Anda terlalu tua). Setelah memasang Colima beserta
paket `docker-compose`, atau Docker Desktop 4.41.2, perintah `docker compose` akan
dikenali. `docker-compose.yml` di repositori ini ditulis untuk format Compose v2.

### Khusus Colima

**`Cannot connect to the Docker daemon` padahal Colima sudah dipasang**
Mesin Colima belum dijalankan, atau berhenti setelah Mac dinyalakan ulang. Jalankan
`colima start`, lalu periksa dengan `colima status`.

**`docker-credential-osxkeychain: executable file not found`**
Konfigurasi Docker masih menunjuk credential helper bawaan Docker Desktop, yang tidak
tersedia pada pemasangan CLI-saja. Buka `~/.docker/config.json` lalu hapus baris
`"credsStore": "osxkeychain"`, simpan, dan ulangi perintah.

**Homebrew gagal memasang karena biner Docker yang bentrok**
Sisa pemasangan Docker Desktop lama (misalnya `/usr/local/bin/hub-tool` yang menunjuk
`/Applications/Docker.app` yang sudah dihapus). Bersihkan sisa biner seperti pada langkah
1 opsi Colima, lalu ulangi `brew install`.

**Build terasa lambat atau kehabisan memori**
VM bawaan Colima hanya 2 CPU dan 2 GB memori. Buat ulang dengan alokasi lebih besar:

```bash
colima delete
colima start --cpu 4 --memory 8
```
