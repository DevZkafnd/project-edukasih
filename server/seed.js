const mongoose = require('mongoose');
const Materi = require('./models/Materi');
const Kuis = require('./models/Kuis');
const Siswa = require('./models/Siswa');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edukasih';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await Materi.deleteMany({});
    await Kuis.deleteMany({});
    await Siswa.deleteMany({});
    console.log('Data cleared.');

    // 0. USERS: Guru & Siswa
    const guru = await Siswa.create({
      nama: 'Ibu Budi',
      username: 'guru1',
      password: 'password123',
      role: 'guru'
    });

    const siswa = await Siswa.create({
      nama: 'Andi',
      username: 'andi',
      password: 'password123',
      role: 'siswa',
      nama_orang_tua: 'Bapak Andi'
    });

    console.log('Users created: guru1/password123, andi/password123');

    // 1. VOKASI: Membuat Sandwich
    const materiSandwich = await Materi.create({
      judul: 'Membuat Sandwich Sehat',
      kategori: 'vokasi',
      tipe_media: 'video_youtube',
      url_media: 'https://www.youtube.com/watch?v=52s5s5s5s5s', // Dummy valid-looking URL
      langkah_langkah: [
        'Ambil 2 lembar roti tawar.',
        'Oleskan mentega di satu sisi roti.',
        'Letakkan selada, tomat, dan keju.',
        'Tutup dengan lembar roti lainnya.',
        'Potong roti menjadi dua bagian segitiga.'
      ]
    });

    await Kuis.create({
      materi: materiSandwich._id,
      pertanyaan: [
        {
          teks_pertanyaan: 'Apa langkah pertama membuat sandwich?',
          opsi_jawaban: [
            { teks: 'Ambil 2 lembar roti' },
            { teks: 'Makan rotinya' },
            { teks: 'Buang roti' },
            { teks: 'Tidur' }
          ],
          indeks_jawaban_benar: 0
        },
        {
          teks_pertanyaan: 'Apa yang dioleskan ke roti?',
          opsi_jawaban: [
            { teks: 'Sabun' },
            { teks: 'Mentega' },
            { teks: 'Tanah' },
            { teks: 'Air' }
          ],
          indeks_jawaban_benar: 1
        }
      ]
    });

    // 2. AKADEMIK: Belajar Berhitung
    const materiHitung = await Materi.create({
      judul: 'Belajar Berhitung 1-10',
      kategori: 'akademik',
      tipe_media: 'video_youtube',
      url_media: 'https://www.youtube.com/watch?v=_UR-l3QI2nE', // Pinkfong numbers
      langkah_langkah: []
    });

    await Kuis.create({
      materi: materiHitung._id,
      pertanyaan: [
        {
          teks_pertanyaan: 'Angka setelah 1 adalah?',
          opsi_jawaban: [
            { teks: 'Lima' },
            { teks: 'Dua' },
            { teks: 'Sepuluh' },
            { teks: 'Nol' }
          ],
          indeks_jawaban_benar: 1
        },
        {
          teks_pertanyaan: 'Berapa jumlah jari tangan kanan?',
          opsi_jawaban: [
            { teks: '2' },
            { teks: '3' },
            { teks: '5' },
            { teks: '10' }
          ],
          indeks_jawaban_benar: 2
        }
      ]
    });

    // 3. LIFESKILL: Cara Cuci Tangan
    const materiCuciTangan = await Materi.create({
      judul: 'Cara Cuci Tangan yang Benar',
      kategori: 'lifeskill',
      tipe_media: 'video_youtube',
      url_media: 'https://www.youtube.com/watch?v=3p6O89qX8bE', // Cuci tangan song
      langkah_langkah: [
        'Basahi tangan dengan air mengalir.',
        'Tuang sabun secukupnya.',
        'Gosok telapak tangan dan punggung tangan.',
        'Gosok sela-sela jari.',
        'Bilas dengan air bersih dan keringkan.'
      ]
    });

    await Kuis.create({
      materi: materiCuciTangan._id,
      pertanyaan: [
        {
          teks_pertanyaan: 'Apa yang kita gunakan untuk mencuci tangan?',
          opsi_jawaban: [
            { teks: 'Pasir' },
            { teks: 'Sabun dan Air' },
            { teks: 'Minyak' },
            { teks: 'Cat' }
          ],
          indeks_jawaban_benar: 1
        },
        {
          teks_pertanyaan: 'Kapan kita harus cuci tangan?',
          opsi_jawaban: [
            { teks: 'Sebelum Makan' },
            { teks: 'Saat Tidur' },
            { teks: 'Tidak pernah' },
            { teks: 'Saat berlari' }
          ],
          indeks_jawaban_benar: 0
        }
      ]
    });

    console.log('Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedData();
