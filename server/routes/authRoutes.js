const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/students', protect, adminOnly, authController.getAllStudents);
router.post('/students', protect, adminOnly, authController.createStudent);
router.put('/students/:id', protect, adminOnly, authController.updateStudent);
router.delete('/students/:id', protect, adminOnly, authController.deleteStudent);

module.exports = router;
