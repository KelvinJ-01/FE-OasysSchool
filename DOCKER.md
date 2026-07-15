# Menjalankan Oasys School Dashboard dengan Docker

Panduan ini menjelaskan cara membangun dan menjalankan dashboard sebagai kontainer.

## Ringkasan

Aplikasi ini adalah SPA (React + Vite) yang dikompilasi menjadi berkas statis, lalu
disajikan oleh nginx. Prosesnya dua tahap dalam satu `Dockerfile`:

1. **Tahap `build`** — Node 22 memasang dependensi dan menjalankan `npm run build`.
2. **Tahap `runtime`** — nginx menyajikan hasil build. Node tidak ikut ke image akhir,
   sehingga ukurannya kecil dan permukaan serangannya sempit.

## Prasyarat

- Docker Engine 20.10 atau lebih baru
- Docker Compose v2 (`docker compose`, tanpa tanda hubung)

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
**installer terbaru menolak dipasang di Monterey** (biasanya muncul pesan menyesatkan
seperti "Docker.dmg is corrupt", padahal masalahnya versi macOS).

Versi terakhir yang mendukung Monterey adalah **Docker Desktop 4.41.2** (rilis 6 Mei
2025); versi 4.42 ke atas mensyaratkan Ventura 13.3 atau lebih baru. Versi 4.41.2 sudah
membawa Docker Engine modern beserta Compose v2, sehingga seluruh berkas Docker di
repositori ini berjalan tanpa penyesuaian.

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
5. Tunggu ikon paus di menu bar berhenti beranimasi, lalu verifikasi:

   ```bash
   docker version
   docker compose version
   docker run --rm hello-world
   ```

Catatan: 4.41.2 tidak lagi menerima pembaruan keamanan. Ini pilihan yang wajar untuk
pengembangan lokal, namun untuk membangun image yang akan dipakai di produksi sebaiknya
gunakan mesin dengan Docker terkini (misalnya lewat CI/CD).

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
Compose v2 belum tersedia (Docker Anda terlalu tua). Setelah memasang 4.41.2, perintah
`docker compose` akan dikenali. Sebagai alternatif sementara, `docker-compose` dengan
tanda hubung dapat dipakai bila Compose v1 terpasang, namun `docker-compose.yml` di
repositori ini ditulis untuk format Compose v2.
