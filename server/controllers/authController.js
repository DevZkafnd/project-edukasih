const Siswa = require('../models/Siswa');
const Materi = require('../models/Materi');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to check DB status
const checkDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Service Unavailable: Database connection failed. Please check server logs for auth errors.',
      readyState: mongoose.connection.readyState
    });
  }
  return null;
};

// Helper to cleanup student history
const cleanupStudentHistory = async (student) => {
  if (!student.history || student.history.length === 0) {
      if (student.skor_bintang !== 0) {
          student.skor_bintang = 0;
          await student.save();
      }
      return student;
  }

  const originalLength = student.history.length;
  
  // Filter out any corrupt entries first (missing materi field)
  const validStructureHistory = student.history.filter(h => h && h.materi);

  // Get IDs safely
  const historyMateriIds = validStructureHistory.map(h => (h.materi._id || h.materi).toString());
  
  // Find valid materials in DB
  const validMaterials = await Materi.find({ _id: { $in: historyMateriIds } }).select('_id');
  const validMaterialIds = new Set(validMaterials.map(m => m._id.toString()));

  // Filter history: keep only entries where material exists
  const newHistory = validStructureHistory.filter(h => validMaterialIds.has((h.materi._id || h.materi).toString()));

  // Recalculate stars
  const newTotalStars = newHistory.reduce((acc, curr) => acc + curr.skor, 0);

  // Check if changes needed
  if (originalLength !== newHistory.length || student.skor_bintang !== newTotalStars) {
      student.history = newHistory;
      student.skor_bintang = newTotalStars;
      await student.save();
      console.log(`[Auto-Fix] Corrected stats for student ${student.username}: Stars ${newTotalStars}, History Items ${newHistory.length}`);
  }
  return student;
};

// Register (Untuk Guru membuatkan akun Siswa, atau Register Mandiri)
exports.register = async (req, res) => {
  try {
    if (checkDB(res)) return;

    const { nama, username, password, role, nama_orang_tua } = req.body;

    // Simple validation
    if (!username || !password || !nama) {
      return res.status(400).json({ message: 'Mohon lengkapi semua field' });
    }

    // Check if user exists
    const existingUser = await Siswa.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Siswa({
      nama,
      username,
      password: hashedPassword,
      role: role || 'siswa',
      nama_orang_tua: role === 'guru' ? '' : nama_orang_tua
    });

    await newUser.save();

    res.status(201).json({ message: 'Registrasi berhasil', user: { ...newUser.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    if (checkDB(res)) return;

    const { username, password } = req.body;

    // Find user
    let user = await Siswa.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Username tidak ditemukan' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password salah' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil',
      user: {
        id: user._id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        nama_orang_tua: user.nama_orang_tua
      },
      token
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get Current User (Me)
exports.getMe = async (req, res) => {
  try {
    // Load FULL user first (including password) to allow .save()
    let user = await Siswa.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Auto-cleanup for students
    if (user.role === 'siswa') {
        await cleanupStudentHistory(user);
    }

    // Prepare response
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      id: userObj._id,
      nama: userObj.nama,
      username: userObj.username,
      role: userObj.role,
      nama_orang_tua: userObj.nama_orang_tua
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get All Students (For Teacher Dashboard)
exports.getAllStudents = async (req, res) => {
  try {
    // Load FULL docs to allow .save() inside cleanup
    const students = await Siswa.find({ role: 'siswa' });
    
    // Parallel cleanup
    await Promise.all(students.map(s => cleanupStudentHistory(s)));
    
    // Remove passwords for response
    const cleanedStudents = students.map(s => {
        const obj = s.toObject();
        delete obj.password;
        return obj;
    });
    
    res.json(cleanedStudents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create Student (Guru)
exports.createStudent = async (req, res) => {
  try {
    const { nama, username, password, nama_orang_tua } = req.body;
    if (!nama || !username || !password) {
      return res.status(400).json({ message: 'Nama, username, dan password wajib diisi' });
    }
    const existing = await Siswa.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const siswa = new Siswa({
      nama,
      username,
      password: hashedPassword,
      role: 'siswa',
      nama_orang_tua: nama_orang_tua || ''
    });
    const saved = await siswa.save();
    res.status(201).json({ message: 'Siswa berhasil dibuat', siswa: { ...saved.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create Teacher (Admin Only)
exports.createTeacher = async (req, res) => {
  try {
    const { nama, username, password } = req.body;
    if (!nama || !username || !password) {
      return res.status(400).json({ message: 'Nama, username, dan password wajib diisi' });
    }
    const existing = await Siswa.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const guru = new Siswa({
      nama,
      username,
      password: hashedPassword,
      role: 'guru',
      nama_orang_tua: ''
    });
    const saved = await guru.save();
    res.status(201).json({ message: 'Guru berhasil dibuat', guru: { ...saved.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get All Teachers (Admin)
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Siswa.find({ role: 'guru' }).select('-password');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update Teacher (Admin)
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, username, password } = req.body;
    const guru = await Siswa.findOne({ _id: id, role: 'guru' });
    if (!guru) return res.status(404).json({ message: 'Guru tidak ditemukan' });

    if (nama !== undefined) guru.nama = nama;
    if (username !== undefined) guru.username = username;

    if (password !== undefined && password !== '') {
      const salt = await bcrypt.genSalt(10);
      guru.password = await bcrypt.hash(password, salt);
    }

    const saved = await guru.save();
    res.json({ message: 'Guru berhasil diperbarui', guru: { ...saved.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete Teacher (Admin)
exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const guru = await Siswa.findOne({ _id: id, role: 'guru' });
    if (!guru) return res.status(404).json({ message: 'Guru tidak ditemukan' });
    await Siswa.findByIdAndDelete(id);
    res.json({ message: 'Guru berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update Student (Guru)
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, username, password, nama_orang_tua, skor_bintang } = req.body;
    const siswa = await Siswa.findById(id);
    if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    
    if (nama !== undefined) siswa.nama = nama;
    if (username !== undefined) siswa.username = username;
    
    if (password !== undefined && password !== '') {
        const salt = await bcrypt.genSalt(10);
        siswa.password = await bcrypt.hash(password, salt);
    }
    
    if (nama_orang_tua !== undefined) siswa.nama_orang_tua = nama_orang_tua;
    if (typeof skor_bintang === 'number') siswa.skor_bintang = skor_bintang;
    
    const saved = await siswa.save();
    res.json({ message: 'Siswa berhasil diperbarui', siswa: { ...saved.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete Student (Guru)
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const siswa = await Siswa.findById(id);
    if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    await Siswa.findByIdAndDelete(id);
    res.json({ message: 'Siswa berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
