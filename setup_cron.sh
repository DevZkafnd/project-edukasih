#!/bin/bash

# Script ini akan mendaftarkan maintenance.sh ke Crontab (Jadwal Otomatis)
# Jalankan sekali saja di awal setup.

chmod +x maintenance.sh

# Dapatkan path absolut project
PROJECT_DIR=$(pwd)
SCRIPT_PATH="$PROJECT_DIR/maintenance.sh"
LOG_PATH="$PROJECT_DIR/maintenance.log"

# Hapus jadwal lama jika ada (untuk update jadwal)
crontab -l 2>/dev/null | grep -v "maintenance.sh" | crontab -

# Tambahkan jadwal baru: Setiap Hari jam 3 pagi
(crontab -l 2>/dev/null; echo "0 3 * * * cd $PROJECT_DIR && ./maintenance.sh >> $LOG_PATH 2>&1") | crontab -

echo "🎉 Berhasil memperbarui jadwal maintenance (Setiap Hari 03:00)."
echo "Logs akan disimpan di: $LOG_PATH"
