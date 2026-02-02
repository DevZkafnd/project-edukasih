const Kuis = require('../models/Kuis');
const Siswa = require('../models/Siswa');
const Materi = require('../models/Materi');

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

    // Validate Answers & Cast to Numbers
    const cleanJawaban = jawabanSiswa.map(ans => ans === null || ans === undefined ? -1 : Number(ans));

    kuis.pertanyaan.forEach((pertanyaan, index) => {
      if (cleanJawaban[index] === pertanyaan.indeks_jawaban_benar) {
        correctCount++;
      }
    });

    // Calculate Stars (Normalized to 3 Stars Max)
    // "soal quiz mau ada 5 atau 1 atau berapa ke harus 3 bintang"
    const maxStars = 3;
    let starsEarned = 0;
    
    if (totalQuestions > 0) {
        // Calculate raw percentage
        const percentage = correctCount / totalQuestions;
        
        // Custom logic to avoid 1 star confusion if that was the issue
        // But simple rounding (0-3) is usually best.
        // 0 correct = 0 stars
        // 100% correct = 3 stars
        starsEarned = Math.round(percentage * maxStars);
    }

    console.log(`SubmitQuiz Debug: Siswa ${siswaId}, Correct: ${correctCount}/${totalQuestions}, Stars: ${starsEarned}, Answers:`, cleanJawaban);

    // Update Student History
    if (siswaId) {
        const siswa = await Siswa.findById(siswaId);
        if (siswa) {
            // Check existing history for this Materi
            const existingEntryIndex = siswa.history.findIndex(h => h.materi.toString() === kuis.materi.toString());
            
            const attemptData = {
                skor: starsEarned,
                jawaban: cleanJawaban, // Save clean numeric answers
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
            
            // Recalculate Total Stars
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
    console.error("Submit Quiz Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get Quiz Stats & Leaderboard (Best Attempts Only)
exports.getQuizStats = async (req, res) => {
    try {
        const { materiId } = req.params;
        
        // 1. Get Jenjang from Materi
        const materi = await Materi.findById(materiId);
        if (!materi) return res.status(404).json({ message: 'Materi tidak ditemukan' });
        
        const jenjang = materi.jenjang; // e.g., 'SD'

        // 2. Find all students in this jenjang who have history for this materi
        // We filter by jenjang to ensure we are comparing apples to apples, as requested.
        const students = await Siswa.find({ 
            jenjang: jenjang,
            'history.materi': materiId 
        }).select('nama kelas history');

        const questionStats = {}; // { qIndex: { optionIndex: count } }
        const leaderboard = [];

        students.forEach(student => {
            const historyItem = student.history.find(h => h.materi.toString() === materiId);
            if (historyItem && historyItem.riwayat_percobaan && historyItem.riwayat_percobaan.length > 0) {
                // Find best attempt (highest score)
                // We use the BEST attempt to avoid "ketidakstabilan" (instability) from trial-and-error attempts
                const attempts = historyItem.riwayat_percobaan;
                const bestAttempt = attempts.reduce((prev, current) => (prev.skor >= current.skor ? prev : current));

                // Add to Stats (Distribution of answers in best attempts)
                if (bestAttempt.jawaban && bestAttempt.jawaban.length > 0) {
                    bestAttempt.jawaban.forEach((ans, qIdx) => {
                        const ansIdx = Number(ans);
                        if (!isNaN(ansIdx)) {
                            if (!questionStats[qIdx]) questionStats[qIdx] = {};
                            if (!questionStats[qIdx][ansIdx]) questionStats[qIdx][ansIdx] = 0;
                            questionStats[qIdx][ansIdx]++;
                        }
                    });
                }

                // Add to Leaderboard
                leaderboard.push({
                    nama: student.nama,
                    kelas: student.kelas,
                    skor: bestAttempt.skor,
                    waktu: bestAttempt.tanggal
                });
            }
        });

        // Sort Leaderboard: Highest Score, then Earliest Time (First to achieve is better)
        leaderboard.sort((a, b) => {
            if (b.skor !== a.skor) return b.skor - a.skor;
            return new Date(a.waktu) - new Date(b.waktu);
        });

        // Calculate Percentages
        const finalStats = {};
        Object.keys(questionStats).forEach(qIdx => {
            const options = questionStats[qIdx];
            const total = Object.values(options).reduce((a, b) => a + b, 0);
            finalStats[qIdx] = {
                totalVotes: total,
                distribution: options, // { 0: 5, 1: 2 }
                percentages: {}
            };
            Object.keys(options).forEach(optIdx => {
                finalStats[qIdx].percentages[optIdx] = Math.round((options[optIdx] / total) * 100);
            });
        });

        res.json({
            stats: finalStats,
            leaderboard: leaderboard.slice(0, 5) // Top 5
        });

    } catch (error) {
        console.error("Error getting stats:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get Quiz by Materi ID
exports.getQuizByMateri = async (req, res) => {
    try {
        const { materiId } = req.params;
        const kuis = await Kuis.findOne({ materi: materiId });
        
        // If no quiz, return null or empty object with 200 OK to avoid 404 errors in frontend console
        if (!kuis) return res.status(200).json(null);
        
        res.json(kuis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Quiz Report (Detailed List for PDF)
exports.getQuizReport = async (req, res) => {
    try {
        const { materiId } = req.params;
        
        // 1. Get Materi Info
        const materi = await Materi.findById(materiId);
        if (!materi) return res.status(404).json({ message: 'Materi tidak ditemukan' });
        
        const jenjang = materi.jenjang; 

        // 2. Find students in this jenjang with history
        // Use regex for case-insensitive match on jenjang if needed, but exact match is safer for strict logic
        const students = await Siswa.find({ 
            'history.materi': materiId 
        }).select('nama kelas history jenjang');

        const reportData = [];
        
        // Fetch Quiz to know total questions for stats initialization
        const kuis = await Kuis.findOne({ materi: materiId });
        const totalQuestions = kuis ? kuis.pertanyaan.length : 0;
        
        // Initialize questionStats for ALL questions
        const questionStats = {}; // { qIndex: { optionIndex: count } }
        for (let i = 0; i < totalQuestions; i++) {
            questionStats[i] = {};
        }

        students.forEach(student => {
            const historyItem = student.history.find(h => h.materi.toString() === materiId);
            if (historyItem && historyItem.riwayat_percobaan && historyItem.riwayat_percobaan.length > 0) {
                const attempts = historyItem.riwayat_percobaan;
                
                // Best Attempt Logic (Highest Score, then Earliest Time)
                const sortedAttempts = [...attempts].sort((a, b) => {
                    if (b.skor !== a.skor) return b.skor - a.skor;
                    return new Date(a.tanggal) - new Date(b.tanggal);
                });

                const bestAttempt = sortedAttempts[0];

                // Add to Report Data
                reportData.push({
                    nama: student.nama,
                    kelas: student.kelas || '-', // Ensure default if empty string
                    attemptNumber: attempts.length,
                    skor: bestAttempt.skor,
                    waktu: bestAttempt.tanggal,
                    jenjang: student.jenjang,
                    jawaban: bestAttempt.jawaban // Add answers to report
                });

                // Add to Stats
                // We count ALL students who took this quiz to ensure consistency with the report list.
                if (bestAttempt.jawaban && bestAttempt.jawaban.length > 0) {
                    bestAttempt.jawaban.forEach((ans, qIdx) => {
                        // Ensure ans is a number
                        const ansIdx = Number(ans);
                        if (!isNaN(ansIdx) && ansIdx !== -1) { // Skip unanswered (-1)
                            if (!questionStats[qIdx]) questionStats[qIdx] = {};
                            if (!questionStats[qIdx][ansIdx]) questionStats[qIdx][ansIdx] = 0;
                            questionStats[qIdx][ansIdx]++;
                        }
                    });
                }
            }
        });

        // Sort by Score desc, then Time asc
        reportData.sort((a, b) => {
            if (b.skor !== a.skor) return b.skor - a.skor;
            return new Date(a.waktu) - new Date(b.waktu);
        });

        // Calculate Percentages for Stats
        const finalStats = {};
        Object.keys(questionStats).forEach(qIdx => {
            const options = questionStats[qIdx];
            const total = Object.values(options).reduce((a, b) => a + b, 0);
            finalStats[qIdx] = {
                totalVotes: total,
                distribution: options,
                percentages: {}
            };
            Object.keys(options).forEach(optIdx => {
                finalStats[qIdx].percentages[optIdx] = Math.round((options[optIdx] / total) * 100);
            });
        });

        res.json({
            materiJudul: materi.judul,
            jenjang: jenjang,
            data: reportData,
            stats: finalStats // Return stats for PDF
        });

    } catch (error) {
        console.error("Error getting quiz report:", error);
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
