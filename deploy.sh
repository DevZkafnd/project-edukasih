#!/bin/bash

# Warna untuk output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== [1/5] Memulai Proses Deployment EduKasih ===${NC}"

# 1. Pull Code Terbaru
echo -e "${GREEN}=== [2/5] Mengambil Kode Terbaru dari Git... ===${NC}"
git pull origin main

# 2. Stop Container Lama
echo -e "${GREEN}=== [3/5] Menghentikan Container Lama... ===${NC}"
docker compose down

# 3. Rebuild Container (PENTING: --no-cache untuk memastikan perubahan config terbaca)
echo -e "${GREEN}=== [4/5] Membangun Ulang Container (Rebuild)... ===${NC}"
echo "Ini mungkin memakan waktu beberapa menit..."
docker compose build --no-cache client server nginx

# 4. Jalankan Container
echo -e "${GREEN}=== [5/5] Menjalankan Aplikasi... ===${NC}"
docker compose up -d

# 5. Bersihkan Image Sampah
docker image prune -f

echo -e "${GREEN}=== DEPLOYMENT SELESAI ===${NC}"
echo "Silakan tunggu 10-20 detik agar database dan server siap sepenuhnya."
echo "Lalu coba akses kembali website Anda (Ctrl+F5 untuk hard refresh)."
