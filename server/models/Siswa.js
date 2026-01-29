const mongoose = require('mongoose');

const SiswaSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'guru', 'siswa'],
    default: 'siswa'
  },
  nama_orang_tua: {
    type: String,
    default: '' // Hanya diisi jika role = 'siswa'
  },
  jenjang: {
    type: String,
    enum: ['TK', 'SD', 'SMP', 'SMA', ''], // Kosong untuk guru/admin
    default: ''
  },
  ketunaan: {
    type: String,
    enum: ['Tunanetra', 'Tunarungu', 'Tunagrahita', 'Tunadaksa', 'Autis', ''],
    default: ''
  },
  kelas: {
    type: String,
    default: '' // e.g. "Kelas 1", "Kelas 7"
  },
  posisi: {
    type: String,
    default: '' // Posisi jabatan di sekolah (untuk guru), misal: "Wali Kelas", "Kepala Lab"
  },
  mata_pelajaran: {
    type: String,
    default: '' // Mata pelajaran yang diajar (untuk guru), misal: "Matematika"
  },
  skor_bintang: {
    type: Number,
    default: 0
  },
  history: [{
    materi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Materi'
    },
    skor: {
      type: Number,
      default: 0
    },
    riwayat_percobaan: [{
      skor: Number,
      tanggal: {
        type: Date,
        default: Date.now
      }
    }],
    tanggal: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Siswa', SiswaSchema);
