const mongoose = require('mongoose');
const Siswa = require('./models/Siswa');
const Kuis = require('./models/Kuis');
const Materi = require('./models/Materi');

// Gunakan environment variable atau hardcoded lokal
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edukasih'; 

async function checkData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Cari satu siswa yang punya history
    console.log('Searching for students with history...');
    const students = await Siswa.find({ 'history': { $not: { $size: 0 } } }).limit(5);
    console.log(`Found ${students.length} students with history.`);

    if (students.length === 0) return;

    for (const siswa of students) {
        console.log(`\nChecking student: ${siswa.nama} (${siswa._id})`);
        
        // Cek setiap history item
        siswa.history.forEach((h, idx) => {
            console.log(`  History #${idx}: Materi ${h.materi}, Score: ${h.skor}`);
            if (h.riwayat_percobaan && h.riwayat_percobaan.length > 0) {
                console.log(`    -> Has ${h.riwayat_percobaan.length} attempts.`);
                console.log(`    -> Attempt #1 Answers:`, JSON.stringify(h.riwayat_percobaan[0].jawaban));
            } else {
                console.log(`    -> NO detailed attempts (Legacy or Empty).`);
            }
        });
    }

    // 3. Cek Kuis terkait
    if (historyItem) {
        const kuis = await Kuis.findOne({ materi: historyItem.materi });
        if (kuis) {
            console.log(`Kuis found. Total Questions: ${kuis.pertanyaan.length}`);
            console.log('Pertanyaan 1 Opsi Jawaban:', JSON.stringify(kuis.pertanyaan[0].opsi_jawaban, null, 2));
        } else {
            console.log('Kuis not found for this materi.');
        }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
