const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');

router.post('/speak', ttsController.speak);

module.exports = router;
