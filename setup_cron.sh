#!/bin/bash

# ==================================================
# EduKasih Cron Job Installer
# ==================================================
# Script ini akan mendaftarkan maintenance.sh ke jadwal otomatis VPS.
# Jadwal: Setiap Hari Minggu, Pukul 00:00 (Tengah Malam)

# 1. Pastikan script maintenance executable
chmod +x maintenance.sh

# 2. Dapatkan absolute path dari script
SCRIPT_PATH=$(pwd)/maintenance.sh

# 3. Cek apakah cron job sudah ada
crontab -l | grep "maintenance.sh" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Jadwal maintenance sudah terdaftar sebelumnya."
    echo "Cek dengan perintah: crontab -l"
else
    # 4. Tambahkan jadwal baru
    # Format Cron: m h dom mon dow command
    # 0 0 * * 0 = Menit 0, Jam 0, Setiap Tgl, Setiap Bulan, Hari Minggu (0)
    
    # Kita tambahkan TZ=Asia/Jakarta di baris cron jika sistem mendukung, 
    # tapi untuk kompatibilitas, kita asumsikan server time atau user menyesuaikan.
    # Jika server UTC, 00:00 WIB = 17:00 UTC (Sabtu).
    # Agar aman, kita set jam 00:00 waktu server.
    
    (crontab -l 2>/dev/null; echo "0 0 * * 0 $SCRIPT_PATH >> $(pwd)/maintenance.log 2>&1") | crontab -
    
    echo "🎉 Berhasil!"
    echo "Script maintenance akan berjalan otomatis setiap Hari Minggu jam 00:00 waktu server."
    echo "Log aktivitas akan disimpan di: $(pwd)/maintenance.log"
fi
