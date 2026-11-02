const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const {
    authLoginRateLimit,
    authRegisterRateLimit
} = require('../middleware/rateLimits');

router.post('/register', authRegisterRateLimit, registerUser);
router.post('/login', authLoginRateLimit, loginUser);
router.post('/logout', logoutUser);

module.exports = router;