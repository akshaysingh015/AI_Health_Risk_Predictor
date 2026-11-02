const express = require('express');
const router = express.Router();
const { createHealthLog, getHealthHistory } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');
const { predictionRateLimit } = require('../middleware/rateLimits');

router.post('/', protect, predictionRateLimit, createHealthLog);
router.get('/history', protect, getHealthHistory); // 👈 New GET endpoint

module.exports = router;