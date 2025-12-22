# EduKasih

EduKasih adalah aplikasi pembelajaran untuk siswa dengan pendampingan guru dan orang tua. Aplikasi menyediakan materi pembelajaran berupa video (YouTube atau lokal), forum chat kelas, serta fitur kuis yang terhubung ke materi. Guru memiliki dashboard untuk mengelola siswa, materi, dan kuis.

## Fitur Utama
- Autentikasi pengguna dengan peran `guru` dan `siswa`
- Dashboard Guru:
  - Manajemen siswa: tambah, edit, hapus
  - Manajemen materi:
    - Upload video lokal (MP4/WebM) atau tautan YouTube
    - Thumbnail otomatis:
      - Video YouTube: gambar `img.youtube.com`
      - Video lokal: frame awal video (`<video preload="metadata">`)
    - Pencarian judul materi dan filter kategori
    - Pagination daftar materi
  - Editor Kuis: membuat/mengubah pertanyaan kuis untuk materi
- Halaman Siswa:
  - Daftar materi berdasarkan kategori
  - Detail materi: tampilkan video/gambar dan konten pendampingan
  - Kuis terhubung ke materi
  - Teks dibacakan (Text-to-Speech) dan tombol suara
- Forum Chat Kelas:
  - Kirim pesan oleh siswa/guru
  - Balas pesan (reply) dengan kutipan seperti WhatsApp
  - Polling sederhana untuk pembaruan pesan

## Tech Stack
- Frontend:
  - `React` + `Vite`
  - Routing: `react-router-dom`
  - UI: `TailwindCSS`, `lucide-react`
  - Notifikasi: `react-hot-toast`
  - Animasi: `framer-motion` (komponen tertentu)
  - Audio/Voice: Web Speech API (Text-to-Speech)
- Backend:
  - `Node.js` + `Express`
  - Autentikasi JWT (middleware `protect` dan `adminOnly`)
  - Upload media menggunakan `multer`
  - Static file untuk folder `uploads`
- Database:
  - `MongoDB` + `Mongoose`
  - Model: `Siswa`, `Materi`, `Kuis`, `Message`

## Arsitektur Direktori
```
project-edukasih/
  client/              # Frontend React (Vite)
    src/
      pages/           # Halaman (Home, Login, TeacherDashboard, Forum, dll)
      components/      # Komponen UI
      context/         # Provider Context (Auth, Audio) + Base Context
      hooks/           # Custom hooks (useAuth, useAudio)
    eslint.config.js
    package.json
  server/              # Backend Express
    controllers/       # Controller API (materi, kuis, auth, message)
    routes/            # Routing API
    models/            # Mongoose models
    middleware/        # Middleware (auth, upload)
    index.js           # Entrypoint server
    package.json
```

## Model Database
- `Siswa`:
  - `nama`, `username`, `password`, `role` (`guru`|`siswa`), `nama_orang_tua`, `skor_bintang`
- `Materi`:
  - `judul`, `kategori` (`akademik`|`vokasi`|`lifeskill`)
  - `tipe_media` (`video_youtube`|`video_lokal`|`gambar_lokal`)
  - `url_media` (link YouTube atau path `/uploads/...`)
  - `panduan_ortu`, `langkah_langkah` (array langkah)
- `Kuis`:
  - `materi` (ref ke `Materi`)
  - `pertanyaan[]` berisi:
    - `teks_pertanyaan`
    - `gambar_soal` (opsional)
    - `opsi_jawaban[]` (`teks`, `gambar` opsional)
    - `indeks_jawaban_benar`
  - `bobot_bintang` (default 3)
- `Message`:
  - `pengirim` (ref `Siswa`), `nama_pengirim`, `role_pengirim`, `isi`
  - `reply_to` (ref `Message`, opsional) untuk fitur balas

## API Dokumentasi
Base URL: `http://localhost:5000/api`

- Auth
  - `POST /auth/register` — registrasi akun
  - `POST /auth/login` — login, response berisi `token` JWT dan data user
  - `GET /auth/students` — daftar siswa (Guru saja; butuh `Authorization: Bearer <token>`)
  - `POST /auth/students` — buat siswa (Guru)
  - `PUT /auth/students/:id` — ubah data siswa (Guru)
  - `DELETE /auth/students/:id` — hapus siswa (Guru)
- Materi
  - `GET /materi?kategori=<kategori>` — ambil daftar materi (filter opsional)
  - `GET /materi/:id` — detail materi
  - `POST /materi` — buat materi (Guru; multipart form):
    - body: `judul`, `kategori`, `tipe_media` (`video_youtube`|`video_lokal`)
    - jika `video_youtube`: kirim `url_media`
    - jika `video_lokal`: kirim file `media` (MP4/WebM)
  - `PUT /materi/:id` — update materi (Guru; aturan sama dengan `POST`)
  - `DELETE /materi/:id` — hapus materi dan kuis terkait (Guru)
- Kuis
  - `GET /kuis/:materiId` — ambil kuis untuk materi tertentu
  - `POST /kuis` — buat/ubah kuis untuk materi (payload: `{ materi, pertanyaan }`)
  - `POST /kuis/submit` — submit jawaban dan dapatkan skor (opsional; jika diaktifkan)
- Messages (Forum)
  - `GET /messages` — ambil semua pesan, terurut waktu
  - `POST /messages` — kirim pesan
    - body: `{ pengirim_id, isi, reply_to? }`
    - catatan: jika `reply_to` dikirim, server menyimpan referensi; populasi data balasan saat `GET /messages` dapat diaktifkan pada sisi server
- Upload
  - `POST /upload` — upload file (umumnya dipakai editor kuis); response: `{ url: "/uploads/<filename>" }`

## Validasi Media (Dashboard Guru)
- YouTube:
  - URL diverifikasi dengan ekstraksi `videoId` (mendukung `watch?v=`, `youtu.be`, dll)
  - Jika tidak valid, ditolak dengan toast
- Video Lokal:
  - Hanya tipe `video/*`
  - Maksimum ukuran `100MB`
  - Saat membuat materi baru, file wajib dipilih

## Menjalankan Proyek
### Prasyarat
- Node.js 18+
- MongoDB lokal berjalan di `mongodb://127.0.0.1:27017/edukasih` (atau gunakan `MONGO_URI`)

### Konfigurasi Lingkungan
Buat file `.env` di folder `server/`:
```
MONGO_URI=mongodb://127.0.0.1:27017/edukasih
JWT_SECRET=dev_secret
```

### Instalasi
```
cd project-edukasih/client
npm install

cd ../server
npm install
```

### Menjalankan
- Server (port 5000):
```
cd project-edukasih/server
npm run dev
```
- Client (Vite; port default 5173/5174):
```
cd project-edukasih/client
npm run dev
```

## Detail Server
- Arsitektur Server:
  - Entrypoint Express: `server/index.js`
  - Static file uploads: `app.use('/uploads', express.static(...))`
  - Middleware global: `cors`, `express.json`
  - Routing:
    - `/api/materi` → `routes/materiRoutes.js` (controller: `controllers/materiController.js`)
    - `/api/kuis` → `routes/kuisRoutes.js` (controller: `controllers/kuisController.js`)
    - `/api/auth` → `routes/authRoutes.js` (controller: `controllers/authController.js`)
    - `/api/messages` → `routes/messageRoutes.js` (controller: `controllers/messageController.js`)
    - `/api/upload` → `routes/uploadRoutes.js` (multer handler)
- Upload Media:
  - Konfigurasi `multer` di `server/middleware/upload.js`
  - Penyimpanan: folder `server/uploads/` dengan nama berformat waktu-acak + ekstensi
  - `fileFilter`: hanya `image/*` (jpeg/jpg/png/webp) dan `video/*`
  - `limits.fileSize`: maksimum 100MB
  - Endpoint `POST /api/upload` mengembalikan `{ url: "/uploads/<filename>" }`
- Materi:
  - `POST /api/materi` menerima multipart form (`media` untuk video lokal) atau `url_media` untuk YouTube
  - `PUT /api/materi/:id` mendukung penggantian media; jika media lama lokal akan dihapus dari disk
  - `DELETE /api/materi/:id` juga menghapus kuis terkait
- Kuis:
  - Tersimpan di koleksi tersendiri terhubung ke `Materi`
  - Endpoint `GET /api/kuis/:materiId` mengembalikan kuis untuk materi
  - Endpoint `POST /api/kuis` membuat/memperbarui daftar pertanyaan
- Messages (Forum):
  - `GET /api/messages` mengembalikan seluruh pesan terurut waktu
  - `POST /api/messages` menyimpan pesan baru, termasuk opsi `reply_to` (referensi ke `Message`)
  - Populasi detail `reply_to` saat `GET` dapat diaktifkan di controller jika diperlukan

## Sistem Autentikasi
- Model Pengguna:
  - Semua akun tersimpan di koleksi `Siswa` dengan field: `nama`, `username`, `password`, `role` (`guru` atau `siswa`), `nama_orang_tua`
- Login:
  - Endpoint: `POST /api/auth/login`
  - Input: `{ username, password }`
  - Perilaku khusus:
    - Jika username belum ada, sistem membuat akun demo otomatis untuk uji cepat:
      - `guru1` / `password123` → role `guru`
      - `andi` / `password123` → role `siswa`
  - Validasi password saat ini menggunakan perbandingan teks biasa (MVP)
  - Token:
    - Server membuat JWT dengan payload `{ id, role }`
    - `expiresIn: '7d'`
    - Secret: `JWT_SECRET` dari `.env` (default `dev_secret` jika tidak ada)
  - Response berisi objek `user` (tanpa password) dan `token`
- Register:
  - Endpoint: `POST /api/auth/register`
  - Membuat akun baru jika `username` belum digunakan
- Proteksi Endpoint:
  - Middleware `protect`:
    - Membaca header `Authorization: Bearer <token>`
    - Verifikasi token dan menaruh payload di `req.user`
    - Mengembalikan `401` jika token tidak ada atau tidak valid
  - Middleware `adminOnly`:
    - Hanya mengizinkan akses jika `req.user.role === 'guru'`
    - Mengembalikan `403` jika bukan `guru`
- Cara Pakai di Client:
  - Setelah login, simpan `token` dan kirim pada setiap panggilan API yang dilindungi:
    - Header: `Authorization: Bearer <token>`
  - Contoh cURL:
    ```
    curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/auth/students
    ```
- Catatan Keamanan:
  - Password saat ini disimpan dalam bentuk teks (demonstrasi cepat)
  - Disarankan menambahkan hashing (mis. `bcrypt`) dan pengelolaan token yang lebih ketat untuk produksi

## Catatan Implementasi Frontend
- Context dipisah untuk mematuhi aturan Fast Refresh:
  - `context/*Base.js` menyimpan `createContext`
  - `context/*.jsx` hanya mengekspor Provider
  - `hooks/useAuth`, `hooks/useAudio` untuk akses Context yang konsisten
- Audio/Text-to-Speech:
  - `AudioProvider` menyediakan `playText`, `playAudio`, `stopAll`
  - Halaman siswa otomatis membacakan judul/konten sesuai kebutuhan

## Rencana Pengembangan
- Pagination sisi server untuk skala data besar
- Penjadwalan pesan/real-time chat (WebSocket)
- Validasi tambahan dan pengamanan unggah media
- Penilaian kuis di server dan analitik hasil belajar

## Lisensi
Proyek ini untuk keperluan pembelajaran dan demo internal.
