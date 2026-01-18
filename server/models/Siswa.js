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
    tanggal: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Siswa', SiswaSchema);
