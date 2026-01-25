#!/bin/bash

# Script ini akan mendaftarkan maintenance.sh ke Crontab (Jadwal Otomatis)
# Jalankan sekali saja di awal setup.

chmod +x maintenance.sh

# Dapatkan path absolut project
PROJECT_DIR=$(pwd)
SCRIPT_PATH="$PROJECT_DIR/maintenance.sh"
LOG_PATH="$PROJECT_DIR/maintenance.log"

# Cek apakah sudah ada di crontab
crontab -l | grep -q "maintenance.sh"

if [ $? -eq 0 ]; then
    echo "✅ Jadwal maintenance sudah ada di crontab."
else
    # Tambahkan jadwal: Setiap Senin jam 3 pagi
    (crontab -l 2>/dev/null; echo "0 3 * * 1 cd $PROJECT_DIR && ./maintenance.sh >> $LOG_PATH 2>&1") | crontab -
    echo "🎉 Berhasil menambahkan jadwal maintenance (Setiap Senin 03:00)."
    echo "Logs akan disimpan di: $LOG_PATH"
fi
