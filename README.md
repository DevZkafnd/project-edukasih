# EduKasih

EduKasih adalah aplikasi pembelajaran interaktif (LMS sederhana) yang dirancang untuk siswa dengan pendampingan guru dan orang tua. Aplikasi ini menyediakan materi pembelajaran multimedia (Video YouTube & Lokal), kuis interaktif, dan forum diskusi kelas.

## Fitur Utama

### 👨‍🏫 Dashboard Guru
- **Manajemen Siswa**: Tambah, edit, dan hapus data siswa.
- **Manajemen Materi**:
  - Upload video pembelajaran (MP4/WebM) atau sematkan link YouTube.
  - Dukungan thumbnail otomatis untuk video.
  - Kategorisasi materi (Akademik, Vokasi, Life Skill).
- **Editor Kuis**: Membuat soal pilihan ganda dengan dukungan gambar.
- **Monitoring**: Melihat daftar siswa dan progres belajar.

### 👨‍🎓 Halaman Siswa
- **Akses Materi**: Menonton video pembelajaran dan membaca panduan.
- **Kuis Interaktif**: Mengerjakan soal dengan umpan balik instan (suara & animasi).
- **Fitur Aksesibilitas**: Text-to-Speech (membacakan teks materi otomatis).
- **Forum Kelas**: Diskusi tanya jawab dengan guru dan teman sekelas.

---

## Tech Stack

### Frontend (Client)
- **Framework**: React + Vite
- **Styling**: TailwindCSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios (terpusat dengan `config.js`)
- **Icons**: Lucide React
- **Notifikasi**: React Hot Toast
- **Deploy**: Vercel (Static Site)

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Token)
- **File Upload**: Multer
- **Deploy**: Vercel (Serverless Functions)

---

## Struktur Proyek

```
project-edukasih/
├── client/                 # Frontend React
│   ├── public/             # Aset statis
│   ├── src/
│   │   ├── components/     # Komponen UI reusable
│   │   ├── context/        # State management (Auth, Audio)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Halaman aplikasi
│   │   ├── config.js       # Konfigurasi API URL (Local vs Prod)
│   │   └── main.jsx        # Entry point
│   └── vercel.json         # Konfigurasi deploy frontend
│
└── server/                 # Backend Express
    ├── controllers/        # Logika bisnis
    ├── models/             # Schema Database
    ├── routes/             # Endpoint API
    ├── uploads/            # Folder upload (Local Only)
    ├── index.js            # Server entry point
    └── vercel.json         # Konfigurasi deploy backend
```

---

## Instalasi & Menjalankan Lokal

### 1. Clone Repository
```bash
git clone https://github.com/DevZkafnd/project-edukasih.git
cd project-edukasih
```

### 2. Setup Backend
```bash
cd server
npm install
```
Buat file `.env` di dalam folder `server/`:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/edukasih
JWT_SECRET=rahasia_development
PORT=5000
```
Jalankan server:
```bash
npm run dev
# Server berjalan di http://localhost:5000
```

### 3. Setup Frontend
Buka terminal baru:
```bash
cd client
npm install
npm run dev
# Client berjalan di http://localhost:5173
```

---

## 🚀 Panduan Deployment (Vercel)

Karena aplikasi ini menggunakan struktur Monorepo (Client & Server dalam satu folder), kita perlu mendepoy-nya sebagai **dua proyek terpisah** di Vercel.

### Bagian 1: Deploy Backend (Server)
1. Login ke [Vercel Dashboard](https://vercel.com).
2. Klik **Add New > Project**.
3. Import repository `project-edukasih`.
4. **PENTING**: Pada bagian **Root Directory**, klik Edit dan pilih folder `server`.
5. Masukkan **Environment Variables**:
   - `MONGO_URI`: Connection string MongoDB Atlas Anda.
   - `JWT_SECRET`: Kunci rahasia untuk token.
6. Klik **Deploy**.
7. Salin domain yang didapat (contoh: `https://edukasih-server.vercel.app`).

### Bagian 2: Deploy Frontend (Client)
1. Kembali ke Dashboard, klik **Add New > Project** lagi.
2. Import repository yang sama.
3. **PENTING**: Pada bagian **Root Directory**, klik Edit dan pilih folder `client`.
4. Masukkan **Environment Variables**:
   - `VITE_API_URL`: Masukkan URL Backend dari Bagian 1 (tanpa slash di akhir).
     - Contoh: `https://edukasih-server.vercel.app`
5. Klik **Deploy**.

### ⚠️ Catatan Penting (Vercel)
Vercel menggunakan sistem **Serverless / Ephemeral Filesystem**. Artinya:
- **File Upload (Gambar/Video Lokal) akan hilang** beberapa saat setelah diupload.
- **Solusi**:
  - Untuk **Video Materi**: Gunakan opsi **Link YouTube** (sangat disarankan).
  - Untuk **Gambar Kuis**: Gunakan URL gambar eksternal (Google Images, Imgur, dll) atau hosting file storage terpisah (Cloudinary/AWS S3) jika ingin permanen.
  - Data teks (Materi, Soal, User) aman karena tersimpan di MongoDB Atlas.

---

## API Documentation

Base URL (Local): `http://localhost:5000/api`

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login user | No |
| POST | `/auth/register` | Register user baru | No |
| GET | `/materi` | Ambil semua materi | Yes |
| POST | `/materi` | Tambah materi baru | Guru |
| GET | `/kuis/:materiId` | Ambil kuis per materi | Yes |
| POST | `/kuis/submit` | Submit nilai siswa | Siswa |
| GET | `/messages` | Ambil chat forum | Yes |

---

## Lisensi
Proyek ini dibuat untuk tujuan pendidikan dan demonstrasi.
