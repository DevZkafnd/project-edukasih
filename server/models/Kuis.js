const mongoose = require('mongoose');

const KuisSchema = new mongoose.Schema({
  materi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materi',
    required: true
  },
  pertanyaan: [{
    teks_pertanyaan: {
      type: String,
      required: true
    },
    gambar_soal: {
      type: String, // URL/Path gambar (opsional)
      default: ''
    },
    opsi_jawaban: [{
      teks: String,
      gambar: String // Jika jawaban berupa gambar
    }],
    indeks_jawaban_benar: {
      type: Number, // 0, 1, 2, 3
      required: true
    }
  }],
  bobot_bintang: {
    type: Number,
    default: 3 // Max stars obtainable
  }
}, { timestamps: true });

module.exports = mongoose.model('Kuis', KuisSchema);
