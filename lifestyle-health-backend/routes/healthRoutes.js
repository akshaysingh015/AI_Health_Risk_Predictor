const express = require('express');
const router = express.Router();
const { createHealthLog, getHealthHistory } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createHealthLog);
router.get('/history', protect, getHealthHistory); // 👈 New GET endpoint

module.exports = router;