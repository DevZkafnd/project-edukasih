const express = require('express');
const router = express.Router();
const kuisController = require('../controllers/kuisController');

// GET /api/kuis/:materiId -> Get Quiz for specific Materi
router.get('/:materiId', kuisController.getQuizByMateri);

// POST /api/kuis/submit -> Submit answers & get score
router.post('/submit', kuisController.submitQuiz);

// POST /api/kuis -> Create new quiz (admin/seed)
router.post('/', kuisController.createQuiz);

module.exports = router;
