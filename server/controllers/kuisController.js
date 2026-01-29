const Kuis = require('../models/Kuis');
const Siswa = require('../models/Siswa');

// Submit Quiz & Calculate Score
exports.submitQuiz = async (req, res) => {
  try {
    const { siswaId, kuisId, jawabanSiswa } = req.body; 
    // jawabanSiswa: Array of indices [0, 2, 1, ...]

    const kuis = await Kuis.findById(kuisId);
    if (!kuis) {
      return res.status(404).json({ message: 'Kuis tidak ditemukan' });
    }

    let correctCount = 0;
    const totalQuestions = kuis.pertanyaan.length;

    // Validate Answers
    kuis.pertanyaan.forEach((pertanyaan, index) => {
      if (jawabanSiswa[index] === pertanyaan.indeks_jawaban_benar) {
        correctCount++;
      }
    });

    // Calculate Stars (Simple Logic)
    // 1 Correct Answer = 1 Star
    const starsEarned = correctCount;

    // Update Student History
    // Note: In real app, we need authentication. Here we trust siswaId from body for demo.
    if (siswaId) {
        const siswa = await Siswa.findById(siswaId);
        if (siswa) {
            // Check existing history for this Materi (Kuis is linked to Materi)
            const existingEntryIndex = siswa.history.findIndex(h => h.materi.toString() === kuis.materi.toString());
            
            const attemptData = {
                skor: starsEarned,
                tanggal: Date.now()
            };

            if (existingEntryIndex > -1) {
                 // Add to detailed history
                 if (!siswa.history[existingEntryIndex].riwayat_percobaan) {
                     siswa.history[existingEntryIndex].riwayat_percobaan = [];
                 }
                 siswa.history[existingEntryIndex].riwayat_percobaan.push(attemptData);
 
                 // Update MAX score only if new score is higher
                if (starsEarned > siswa.history[existingEntryIndex].skor) {
                    siswa.history[existingEntryIndex].skor = starsEarned;
                }
                // Always update last access date
                siswa.history[existingEntryIndex].tanggal = Date.now();
            } else {
                // Add new entry
                siswa.history.push({
                    materi: kuis.materi,
                    skor: starsEarned,
                    tanggal: Date.now(),
                    riwayat_percobaan: [attemptData]
                });
            }
            // Recalculate Total Stars (Sum of max score per material)
            // We can iterate history or aggregation. Since history is embedded, we can just sum it.
            const totalStars = siswa.history.reduce((acc, curr) => acc + curr.skor, 0);
            siswa.skor_bintang = totalStars;

            await siswa.save();
        }
    }

    res.json({
      correctCount,
      totalQuestions,
      starsEarned,
      message: `Kamu mendapatkan ${starsEarned} Bintang!`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Quiz by Materi ID
exports.getQuizByMateri = async (req, res) => {
    try {
        const { materiId } = req.params;
        const kuis = await Kuis.findOne({ materi: materiId });
        if (!kuis) return res.status(404).json({ message: 'Kuis belum tersedia untuk materi ini' });
        
        // Hide correct answers for client? No, client logic needs them or we validate on server only?
        // Instruction says: "Server-Side Validation: Jangan hitung nilai di frontend".
        // So we should send questions WITHOUT 'indeks_jawaban_benar' ideally, 
        // OR we send it but only use it for visual feedback (red/green) but TRUST server for final scoring.
        // For simplicity and "Game Interface" requirements (Red/Green feedback immediately), 
        // we often send the answer key to frontend for immediate feedback, BUT final scoring is double-checked on server.
        // Let's send it for now to enable the "Visual Feedback" requirement easily.
        res.json(kuis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create or Update Quiz
exports.createQuiz = async (req, res) => {
    try {
        const { materi, pertanyaan } = req.body;

        // Check if quiz already exists for this material
        let kuis = await Kuis.findOne({ materi });

        if (kuis) {
            // Update existing quiz
            kuis.pertanyaan = pertanyaan;
            await kuis.save();
            return res.json(kuis);
        } else {
            // Create new quiz
            const newKuis = new Kuis(req.body);
            const savedKuis = await newKuis.save();
            return res.status(201).json(savedKuis);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
