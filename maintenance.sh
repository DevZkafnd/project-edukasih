#!/bin/bash

# Script Perawatan Berkala EduKasih (Jalankan Weekly)
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
echo "3. Cleaning Up Docker Garbage..."
docker system prune -f

# 4. Backup Database
echo "4. Backup Database..."
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
echo "5. Membersihkan backup lama..."
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +

echo "=== [$(date)] Selesai ==="
