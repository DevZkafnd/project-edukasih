const Materi = require('../models/Materi');
const Kuis = require('../models/Kuis');
const fs = require('fs');
const path = require('path');

// Get All Materi (with filtering)
exports.getMaterials = async (req, res) => {
  try {
    const { kategori, siswa } = req.query; 
    let query = {};
    
    // Authorization & Isolation Logic
    // req.user is available because of 'protect' middleware
    if (req.user.role === 'siswa') {
        // Siswa hanya boleh melihat materi miliknya
        query.siswa = req.user.id;
    } else {
        // Guru/Admin bisa melihat semua atau filter by siswa
        if (siswa) {
            query.siswa = siswa;
        }
    }
    
    if (kategori) {
      query.kategori = kategori;
    }

    const materials = await Materi.find(query).sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Materi by ID
exports.getMaterialById = async (req, res) => {
  try {
    const materi = await Materi.findById(req.params.id);
    if (!materi) return res.status(404).json({ message: 'Materi tidak ditemukan' });
    
    // Authorization Check
    if (req.user.role === 'siswa') {
        // Jika materi punya pemilik spesifik dan bukan siswa ini -> Tolak
        if (materi.siswa && materi.siswa.toString() !== req.user.id) {
             return res.status(403).json({ message: 'Akses ditolak. Materi ini bukan untuk Anda.' });
        }
    }

    res.json(materi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cleanup Legacy Materials (Tanpa Siswa)
exports.cleanupLegacyMaterials = async (req, res) => {
    try {
        const result = await Materi.deleteMany({ 
            $or: [
                { siswa: { $exists: false } },
                { siswa: null }
            ]
        });
        res.json({ message: `Cleanup selesai. Menghapus ${result.deletedCount} materi tanpa pemilik.`, count: result.deletedCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create New Materi
exports.createMaterial = async (req, res) => {
  try {
    const { judul, kategori, tipe_media, url_media, panduan_ortu, langkah_langkah, siswa } = req.body;
    
    let finalUrlMedia = '';
    let final_tipe_media = tipe_media;

    // Logic: Image Upload vs YouTube vs Local Video
    if (req.file) {
      // If file uploaded, use file path
      finalUrlMedia = `/uploads/${req.file.filename}`;
      
      // Determine type based on mimetype
      if (req.file.mimetype.startsWith('video/')) {
        final_tipe_media = 'video_lokal';
      } else {
        final_tipe_media = 'gambar_lokal';
      }
    } else if (url_media) {
      // If YouTube link provided
      finalUrlMedia = url_media;
      final_tipe_media = 'video_youtube';
    } else {
      return res.status(400).json({ message: 'Media (Image or YouTube URL) is required' });
    }

    // Parse langkah_langkah if it's sent as stringified JSON (common in multipart/form-data)
    let parsedLangkah = [];
    if (langkah_langkah) {
      if (typeof langkah_langkah === 'string') {
          try {
             // Try parsing if it looks like array string or just split by comma if simple
             if (langkah_langkah.startsWith('[')) {
                 parsedLangkah = JSON.parse(langkah_langkah);
             } else {
                 parsedLangkah = [langkah_langkah];
             }
          } catch (e) {
             parsedLangkah = [langkah_langkah];
          }
      } else if (Array.isArray(langkah_langkah)) {
          parsedLangkah = langkah_langkah;
      }
    }

    const newMateri = new Materi({
      judul,
      kategori,
      tipe_media: final_tipe_media,
      url_media: finalUrlMedia,
      panduan_ortu,
      langkah_langkah: parsedLangkah,
      siswa: siswa || null // Assign to student if provided
    });

    const savedMateri = await newMateri.save();
    res.status(201).json(savedMateri);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Materi
exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, kategori, tipe_media, url_media, panduan_ortu, langkah_langkah } = req.body;

    const materi = await Materi.findById(id);
    if (!materi) {
      return res.status(404).json({ message: 'Materi tidak ditemukan' });
    }

    // Update fields
    if (judul) materi.judul = judul;
    if (kategori) materi.kategori = kategori;
    if (panduan_ortu) materi.panduan_ortu = panduan_ortu;

    // Handle Steps
    if (langkah_langkah) {
        let parsedLangkah = [];
        if (typeof langkah_langkah === 'string') {
            try {
               if (langkah_langkah.startsWith('[')) {
                   parsedLangkah = JSON.parse(langkah_langkah);
               } else {
                   parsedLangkah = [langkah_langkah];
               }
            } catch (e) {
               parsedLangkah = [langkah_langkah];
            }
        } else if (Array.isArray(langkah_langkah)) {
            parsedLangkah = langkah_langkah;
        }
        materi.langkah_langkah = parsedLangkah;
    }

    // Handle Media Update
    if (req.file) {
        // Delete old file if it was local
        if (materi.tipe_media !== 'video_youtube' && materi.url_media.startsWith('/uploads')) {
            const oldPath = path.join(__dirname, '..', materi.url_media);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        materi.url_media = `/uploads/${req.file.filename}`;
        if (req.file.mimetype.startsWith('video/')) {
            materi.tipe_media = 'video_lokal';
        } else {
            materi.tipe_media = 'gambar_lokal';
        }
    } else if (url_media && tipe_media === 'video_youtube') {
        // If switching to YouTube or updating YouTube link
        if (materi.tipe_media !== 'video_youtube' && materi.url_media.startsWith('/uploads')) {
             const oldPath = path.join(__dirname, '..', materi.url_media);
             if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        materi.url_media = url_media;
        materi.tipe_media = 'video_youtube';
    }

    const updatedMateri = await materi.save();
    res.json(updatedMateri);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Materi (and associated Quiz)
exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Find Materi
    const materi = await Materi.findById(id);
    if (!materi) {
      return res.status(404).json({ message: 'Materi tidak ditemukan' });
    }

    // 2. Delete Local File if exists
    if (materi.tipe_media !== 'video_youtube' && materi.url_media.startsWith('/uploads')) {
      const filePath = path.join(__dirname, '..', materi.url_media);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 3. Delete Associated Quiz
    await Kuis.deleteMany({ materi: id });

    // 4. Delete Materi
    await Materi.findByIdAndDelete(id);

    res.json({ message: 'Materi dan kuis terkait berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
