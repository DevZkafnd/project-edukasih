const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, adminOnly, teacherOnly } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Admin Only: Manage Teachers
router.get('/teachers', protect, adminOnly, authController.getAllTeachers);
router.post('/teachers', protect, adminOnly, authController.createTeacher);
router.put('/teachers/:id', protect, adminOnly, authController.updateTeacher);
router.delete('/teachers/:id', protect, adminOnly, authController.deleteTeacher);

// Admin Only: Manage Students (Moved from Teacher)
// Allow teachers to VIEW students for material assignment
router.get('/students', protect, authController.getAllStudents); 
router.post('/students', protect, adminOnly, authController.createStudent);
router.put('/students/:id', protect, adminOnly, authController.updateStudent);
router.delete('/students/:id', protect, adminOnly, authController.deleteStudent);

module.exports = router;
