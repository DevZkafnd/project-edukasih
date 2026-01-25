const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
// Load model manually to avoid requiring the whole app
const materiSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  kategori: { type: String, required: true },
  tipe_media: { type: String, required: true },
  url_media: { type: String, required: true },
  panduan_ortu: { type: String },
  langkah_langkah: { type: [String] },
  siswa: { type: mongoose.Schema.Types.ObjectId, ref: 'Siswa', default: null }
}, { timestamps: true });

const Materi = mongoose.model('Materi', materiSchema);

const connectDB = async () => {
  try {
    // Use localhost since we run from host accessing exposed port
    const conn = await mongoose.connect('mongodb://localhost:27017/edukasih');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanup = async () => {
  await connectDB();
  try {
    console.log("Cleaning up legacy materials (without siswa)...");
    const result = await Materi.deleteMany({ 
        $or: [
            { siswa: { $exists: false } },
            { siswa: null }
        ]
    });
    console.log(`Deleted ${result.deletedCount} legacy materials.`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanup();