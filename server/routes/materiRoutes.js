const express = require('express');
const router = express.Router();
const materiController = require('../controllers/materiController');
const upload = require('../middleware/upload');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

// GET /api/materi
router.get('/', protect, materiController.getMaterials);

// DELETE /api/materi/cleanup - Teacher/Admin Only (Place before :id)
router.delete('/cleanup', protect, teacherOnly, materiController.cleanupLegacyMaterials);

// GET /api/materi/:id
router.get('/:id', protect, materiController.getMaterialById);

// GET /api/materi/download/:id (Public or Protected? Let's make it protected but maybe public for flexibility if needed, but user context implies students access it. protect middleware is fine if headers are sent, but for direct links standard auth might be tricky if using JWT in headers. 
// Ideally download links should be protected. If clicked from frontend, browser handles cookies? No, this app likely uses Bearer token.
// If it's a direct link opened in new tab, the Authorization header won't be present.
// For now, let's remove 'protect' for download to allow direct access via link if they have the ID, or use query param token.
// Actually, 'protect' middleware checks 'authorization' header. Browser navigation doesn't send that.
// So, either we use a short-lived token in URL, or just make it public (obscurity by ID) for now to solve the immediate "blank page" issue.
// Given the error was 404, the route was missing.
// Let's add it WITHOUT protect for now to ensure it works for simple <a> links.
router.get('/download/:id', materiController.downloadMaterial);

// POST /api/materi (Upload image/video supported) - Protected
router.post('/', protect, teacherOnly, upload.single('media'), materiController.createMaterial);

// PUT /api/materi/:id - Protected
router.put('/:id', protect, teacherOnly, upload.single('media'), materiController.updateMaterial);

// DELETE /api/materi/:id - Protected
router.delete('/:id', protect, teacherOnly, materiController.deleteMaterial);

module.exports = router;
