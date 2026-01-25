#!/bin/bash

# ==================================================
# Script Pemeliharaan Otomatis EduKasih (VPS Optimizer)
# ==================================================
# Gunakan script ini untuk membersihkan cache dan menjaga VPS tetap sehat.
# Cara pakai: chmod +x maintenance.sh -> ./maintenance.sh

echo "[$(date)] Memulai proses pemeliharaan sistem..."

# 1. Bersihkan Docker System (Image tidak terpakai, Container stop, Cache build)
# PENTING: Kami TIDAK menggunakan flag --volumes agar data database (MongoDB) AMAN.
# -a: Hapus semua unused images (bukan hanya dangling)
# -f: Force (tanpa konfirmasi)
echo "-> Membersihkan Docker System (Images & Build Cache)..."
docker system prune -af

# Bersihkan build cache secara spesifik (sering memakan tempat)
docker builder prune -f

# 2. Rotasi Log Docker (Jika ada yang terlewat dari setting docker-compose)
# Catatan: docker-compose.yml sudah diset max-size, tapi ini double check
echo "-> Mengecek log container..."
# (Opsional: truncate manual jika diperlukan, tapi setting docker-compose lebih aman)

# 3. Bersihkan file temporary di Server (Uploads yang gagal/sampah)
# Hapus file di folder uploads/temp yang lebih tua dari 7 hari
UPLOAD_TEMP_DIR="./server/uploads/temp"
if [ -d "$UPLOAD_TEMP_DIR" ]; then
    echo "-> Membersihkan file temporary upload (> 7 hari)..."
    find "$UPLOAD_TEMP_DIR" -type f -mtime +7 -delete
fi

# 4. Git Garbage Collection (Optimasi ukuran folder .git)
if [ -d ".git" ]; then
    echo "-> Optimasi Git Repository..."
    git gc --auto
fi

echo "[$(date)] Pemeliharaan selesai! VPS Anda sekarang lebih lega."
echo "=================================================="
