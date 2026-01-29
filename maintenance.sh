#!/bin/bash

# Script Perawatan Berkala EduKasih (Jalankan Daily)
# Lokasi: di root project folder

echo "=== [$(date)] Mulai Maintenance ==="

# 1. Perbarui SSL Certificate (Jika < 30 hari expired)
echo "1. Cek & Renew SSL..."
# Menggunakan docker compose run untuk menjalankan certbot renew
# --rm akan menghapus container setelah selesai
docker compose run --rm certbot renew

# 2. Reload Nginx agar sertifikat baru terbaca
echo "2. Reload Nginx..."
docker compose exec nginx nginx -s reload

# 3. Bersihkan Docker System (Hemat Space)
# Hapus image/container/network yg tidak terpakai
echo "3. Cleaning Up Docker Garbage & Cache..."
docker system prune -f
docker builder prune -f

# 4. Bersihkan File Sampah & Cache Aplikasi
echo "4. Cleaning App Cache (TTS Audio & Logs)..."
# Hapus file audio TTS lama (> 7 hari)
if [ -d "./server/uploads/audio" ]; then
    find ./server/uploads/audio -name "*.mp3" -type f -mtime +7 -exec rm -f {} +
    echo "   - Old TTS audio files cleaned."
fi

# Rotasi Log Maintenance (Keep last 1000 lines)
if [ -f "maintenance.log" ]; then
    tail -n 1000 maintenance.log > maintenance.log.tmp && mv maintenance.log.tmp maintenance.log
    echo "   - Log rotated."
fi

# 5. Backup Database
echo "5. Backup Database..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/mongo"
mkdir -p $BACKUP_DIR

# Dump data di dalam container
docker compose exec mongo mongodump --out /dump
# Copy ke VPS (Host)
docker cp edukasih_mongo:/dump $BACKUP_DIR/$TIMESTAMP
# Hapus dump di dalam container agar tidak menumpuk (PENTING: Tambahan baru)
docker compose exec mongo rm -rf /dump

# Hapus backup lama di VPS (> 30 hari)
echo "6. Membersihkan backup lama..."
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +

echo "=== [$(date)] Selesai ==="
