const mongoose = require('mongoose');

const MateriSchema = new mongoose.Schema({
  judul: {
    type: String,
    required: true
  },
  kategori: {
    type: String,
    enum: ['akademik', 'vokasi', 'lifeskill'], // Normalized to lowercase for consistency
    required: true
  },
  tipe_media: {
    type: String,
    enum: ['video_youtube', 'gambar_lokal', 'video_lokal', 'link_eksternal', 'dokumen', 'ppt'],
    required: true
  },
  // url_media stores the YouTube link OR the file path (e.g., /uploads/timestamp-file.jpg)
  url_media: {
    type: String,
    required: true
  },
  langkah_langkah: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        // Jika kategori vokasi, sebaiknya ada langkah-langkah (warning only, or strict?)
        // Instructions say: "Jika tipe materi adalah 'Vokasional', pastikan ada field array"
        // We ensure the field exists (array), logic to populate it is in controller/frontend.
        return true; 
      },
      message: 'Validation'
    }
  },
  panduan_ortu: {
    type: String,
    default: '' // Tips/Panduan khusus untuk orang tua
  },
  jenjang: {
    type: String,
    enum: ['PAUD', 'TK', 'SD', 'SMP', 'SMA'],
    default: 'SD' // Default untuk migrasi
  },
  // Deprecated: siswa specific assignment is being replaced by jenjang
  siswa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Siswa',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Materi', MateriSchema);
