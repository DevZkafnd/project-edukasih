#!/bin/bash

# Script Perawatan Berkala EduKasih (Jalankan Weekly)
# Lokasi: di root project folder

echo "=== [$(date)] Mulai Maintenance ==="

# 1. Perbarui SSL Certificate (Jika < 30 hari expired)
echo "1. Cek & Renew SSL..."
docker compose run --rm certbot renew

# 2. Reload Nginx agar sertifikat baru terbaca
echo "2. Reload Nginx..."
docker compose exec nginx nginx -s reload

# 3. Bersihkan Docker System (Hemat Space)
# Hapus image/container/network yg tidak terpakai
echo "3. Cleaning Up Docker Garbage..."
docker system prune -f

# 4. (Opsional) Backup Database
echo "4. Backup Database..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/mongo"
mkdir -p $BACKUP_DIR
docker compose exec mongo mongodump --out /dump
docker cp edukasih_mongo:/dump $BACKUP_DIR/$TIMESTAMP
# Hapus backup > 30 hari
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +

echo "=== [$(date)] Selesai ==="
