const Materi = require('../models/Materi');
const Kuis = require('../models/Kuis');
const Siswa = require('../models/Siswa');
const fs = require('fs');
const path = require('path');

// Get All Materi (with filtering)
exports.getMaterials = async (req, res) => {
  try {
    const { kategori, siswa } = req.query; 
    let query = {};
    
    // Authorization & Isolation Logic
    if (req.user.role === 'siswa') {
        // Fetch student to get Jenjang and Ketunaan
        const student = await Siswa.findById(req.user.id);
        const studentJenjang = student?.jenjang || 'SD';
        const studentKetunaan = student?.ketunaan || '';

        console.log(`[MATERI_FETCH] Student: ${req.user.nama} (${req.user.id}), Jenjang: ${studentJenjang}, Ketunaan: ${studentKetunaan}`);

        // Adaptive Curriculum Logic
        let targetJenjang = studentJenjang;

        // Autis & Tunagrahita Downgrade Logic
        // TK-SD -> PAUD (Assuming 'PAUD' exists in Materi Enum)
        // SMP -> SD
        // SMA -> SMP
        if (['Autis', 'Tunagrahita'].includes(studentKetunaan)) {
            if (['TK', 'SD'].includes(studentJenjang)) {
                targetJenjang = 'PAUD';
            } else if (studentJenjang === 'SMP') {
                targetJenjang = 'SD';
            } else if (studentJenjang === 'SMA') {
                targetJenjang = 'SMP';
            }
        }
        
        console.log(`[MATERI_FETCH] Target Jenjang calculated: ${targetJenjang}`);

        // Show materials for this Jenjang (Adaptive OR Original) OR assigned explicitly to this student
        query = {
            $or: [
                { jenjang: targetJenjang },   // Adaptive Level (e.g., SMP for Autis SMA)
                { jenjang: studentJenjang },  // Original Level (e.g., SMA) - Strict match per user request
                { siswa: req.user.id }
            ]
        };
    } else {
        // Guru/Admin: Can view all, or filter by specific student (e.g. to see what they see)
        if (siswa) {
             const targetStudent = await Siswa.findById(siswa);
             if (targetStudent) {
                 const studentJenjang = targetStudent.jenjang || 'SD';
                 const studentKetunaan = targetStudent.ketunaan || '';
                 
                 let targetJenjang = studentJenjang;
                 if (['Autis', 'Tunagrahita'].includes(studentKetunaan)) {
                    if (['TK', 'SD'].includes(studentJenjang)) {
                        targetJenjang = 'PAUD';
                    } else if (studentJenjang === 'SMP') {
                        targetJenjang = 'SD';
                    } else if (studentJenjang === 'SMA') {
                        targetJenjang = 'SMP';
                    }
                 }

                 query = {
                    $or: [
                        { jenjang: targetJenjang },
                        { jenjang: studentJenjang },
                        { siswa: siswa }
                    ]
                };
             } else {
                 query.siswa = siswa; 
             }
        }
    }
    
    if (kategori) {
        if (query.$or) {
             query = {
                 $and: [
                     query,
                     { kategori: kategori }
                 ]
             };
        } else {
             query.kategori = kategori;
        }
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

// Download Materi Document
exports.downloadMaterial = async (req, res) => {
  try {
    const materi = await Materi.findById(req.params.id);
    if (!materi) return res.status(404).json({ message: 'Materi tidak ditemukan' });

    if (materi.tipe_media !== 'dokumen' && materi.tipe_media !== 'video_lokal' && materi.tipe_media !== 'gambar_lokal' && materi.tipe_media !== 'ppt') {
       return res.status(400).json({ message: 'Materi ini bukan file yang dapat didownload' });
    }

    // Determine file path
    // url_media usually stored as '/uploads/filename.ext'
    let relativePath = materi.url_media;
    if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1); // Remove leading slash
    }

    const filePath = path.join(__dirname, '../', relativePath);
    console.log(`[Download Debug] Request ID: ${req.params.id}, DB URL: ${materi.url_media}, Path: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error(`[Download Error] File not found at: ${filePath}`);
        return res.status(404).json({ message: 'File fisik tidak ditemukan di server' });
    }

    // Gunakan judul materi sebagai nama file download
    const ext = path.extname(filePath);
    const filename = `${materi.judul.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;

    res.download(filePath, filename, (err) => {
        if (err) {
            console.error("Error downloading file:", err);
            // Only send error if headers haven't been sent
            if (!res.headersSent) {
                res.status(500).send("Gagal mendownload file");
            }
        }
    });

  } catch (error) {
    console.error("Download Error (Catch):", error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// Create New Materi
exports.createMaterial = async (req, res) => {
  try {
    console.log('[CREATE_MATERI] Request Body:', req.body);
    console.log('[CREATE_MATERI] Request File:', req.file ? req.file.filename : 'No File');

    const { judul, kategori, tipe_media, url_media, panduan_ortu, langkah_langkah, jenjang, siswa } = req.body;
    
    let finalUrlMedia = '';
    let final_tipe_media = tipe_media;

    // Logic: Image Upload vs YouTube vs Local Video
    if (req.file) {
      // If file uploaded, use file path
      finalUrlMedia = `/uploads/${req.file.filename}`;
      
      // Determine type based on mimetype
      if (req.file.mimetype.startsWith('video/')) {
        final_tipe_media = 'video_lokal';
      } else if (req.file.mimetype.startsWith('image/')) {
        final_tipe_media = 'gambar_lokal';
      } else if (req.file.mimetype.includes('presentation') || req.file.mimetype.includes('powerpoint')) {
        final_tipe_media = 'ppt';
      } else {
        final_tipe_media = 'dokumen';
      }
    } else if (url_media) {
      // If URL provided (YouTube or External Link)
      finalUrlMedia = url_media;
      if (tipe_media === 'link_eksternal') {
        final_tipe_media = 'link_eksternal';
      } else {
        final_tipe_media = 'video_youtube';
      }
    } else {
      console.error('[CREATE_MATERI] Error: Media is required');
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
      jenjang: jenjang || 'SD', // Default to SD if not specified
      siswa: siswa || null // Explicitly assign to student if provided
    });

    console.log('[CREATE_MATERI] Saving new material:', newMateri);

    const savedMateri = await newMateri.save();
    console.log('[CREATE_MATERI] Success! ID:', savedMateri._id);
    res.status(201).json(savedMateri);
  } catch (error) {
    console.error('[CREATE_MATERI] Database Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update Materi
exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, kategori, tipe_media, url_media, panduan_ortu, langkah_langkah, jenjang } = req.body;

    const materi = await Materi.findById(id);
    if (!materi) {
      return res.status(404).json({ message: 'Materi tidak ditemukan' });
    }

    // Update fields
    if (judul) materi.judul = judul;
    if (kategori) materi.kategori = kategori;
    if (panduan_ortu) materi.panduan_ortu = panduan_ortu;
    if (jenjang) materi.jenjang = jenjang;

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
        if (materi.tipe_media !== 'video_youtube' && materi.url_media && materi.url_media.startsWith('/uploads')) {
            try {
                const oldPath = path.join(__dirname, '..', materi.url_media);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log(`[UPDATE] Old file deleted: ${oldPath}`);
                }
            } catch (err) {
                console.error(`[UPDATE ERROR] Failed to delete old file: ${err.message}`);
                // Continue with update
            }
        }

        materi.url_media = `/uploads/${req.file.filename}`;
        if (req.file.mimetype.startsWith('video/')) {
            materi.tipe_media = 'video_lokal';
        } else if (req.file.mimetype.startsWith('image/')) {
            materi.tipe_media = 'gambar_lokal';
        } else if (req.file.mimetype.includes('presentation') || req.file.mimetype.includes('powerpoint')) {
            materi.tipe_media = 'ppt';
        } else {
            materi.tipe_media = 'dokumen';
        }
    } else if (url_media && tipe_media === 'video_youtube') {
        // If switching to YouTube or updating YouTube link
        if (materi.tipe_media !== 'video_youtube' && materi.url_media && materi.url_media.startsWith('/uploads')) {
             try {
                const oldPath = path.join(__dirname, '..', materi.url_media);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log(`[UPDATE] Old file deleted (switched to YouTube): ${oldPath}`);
                }
             } catch (err) {
                console.error(`[UPDATE ERROR] Failed to delete old file: ${err.message}`);
             }
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

    // 2. Delete Local File if exists (Safe Delete)
    if (materi.tipe_media !== 'video_youtube' && materi.url_media && materi.url_media.startsWith('/uploads')) {
      try {
        const filePath = path.join(__dirname, '..', materi.url_media);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[DELETE SUCCESS] File deleted from server: ${filePath}`);
        } else {
          console.warn(`[DELETE WARNING] File not found on server, skipping: ${filePath}`);
        }
      } catch (fileErr) {
        console.error(`[DELETE ERROR] Failed to delete physical file: ${fileErr.message}`);
        // Continue execution to ensure DB record is still deleted
        // so we don't have "ghost" materials in the dashboard.
      }
    }

    // 3. Delete Associated Quiz
    await Kuis.deleteMany({ materi: id });

    // 4. Remove this material from ALL students' history to fix "Materi Selesai" count
    await Siswa.updateMany(
      { "history.materi": id },
      { $pull: { history: { materi: id } } }
    );

    // 5. Delete Materi
    await Materi.findByIdAndDelete(id);

    res.json({ message: 'Materi, kuis, dan riwayat terkait berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
