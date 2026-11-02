const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const { authRateLimit } = require('../middleware/rateLimits');

router.post('/register', authRateLimit, registerUser);
router.post('/login', authRateLimit, loginUser);
router.post('/logout', logoutUser);

module.exports = router;