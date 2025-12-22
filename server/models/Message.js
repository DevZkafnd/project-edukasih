const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  pengirim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Siswa',
    required: true
  },
  nama_pengirim: {
    type: String,
    required: true
  },
  role_pengirim: {
    type: String,
    enum: ['guru', 'siswa'],
    required: true
  },
  isi: {
    type: String,
    required: true
  },
  reply_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
