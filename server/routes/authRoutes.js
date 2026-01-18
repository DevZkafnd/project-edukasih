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

// Teacher Only: Manage Students
router.get('/students', protect, teacherOnly, authController.getAllStudents);
router.post('/students', protect, teacherOnly, authController.createStudent);
router.put('/students/:id', protect, teacherOnly, authController.updateStudent);
router.delete('/students/:id', protect, teacherOnly, authController.deleteStudent);

module.exports = router;
