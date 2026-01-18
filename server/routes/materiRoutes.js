const express = require('express');
const router = express.Router();
const materiController = require('../controllers/materiController');
const upload = require('../middleware/upload');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

// GET /api/materi
router.get('/', materiController.getMaterials);

// GET /api/materi/:id
router.get('/:id', materiController.getMaterialById);

// POST /api/materi (Upload image/video supported) - Protected
router.post('/', protect, teacherOnly, upload.single('media'), materiController.createMaterial);

// PUT /api/materi/:id - Protected
router.put('/:id', protect, teacherOnly, upload.single('media'), materiController.updateMaterial);

// DELETE /api/materi/:id - Protected
router.delete('/:id', protect, teacherOnly, materiController.deleteMaterial);

module.exports = router;
