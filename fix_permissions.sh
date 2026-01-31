#!/bin/bash

# Script untuk memperbaiki izin file upload (Solusi Error 403 Forbidden)
# Jalankan script ini di terminal VPS / Server Anda

echo "=== Memulai Perbaikan Izin File Uploads ==="

# 1. Pastikan container server berjalan
if [ -z "$(docker compose ps -q server)" ]; then
    echo "Error: Container 'server' tidak berjalan. Pastikan docker compose up sudah dijalankan."
    exit 1
fi

echo "1. Mengubah izin folder menjadi 755 (Owner: RWX, Group: RX, Public: RX)..."
# Gunakan 'server' container karena dia yang memiliki volume mounting asli
docker compose exec server sh -c "find /app/uploads -type d -exec chmod 755 {} \;"

echo "2. Mengubah izin file menjadi 644 (Owner: RW, Group: R, Public: R)..."
docker compose exec server sh -c "find /app/uploads -type f -exec chmod 644 {} \;"

echo "=== Selesai! Coba refresh preview PPT sekarang. ==="
