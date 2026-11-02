const express = require('express');
const router = express.Router();
const { updateUserProfile, getUserProfile, exportUserData, deleteAccount } = require('../controllers/userController');
const { createHealthLog } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');
const { predictionRateLimit } = require('../middleware/rateLimits');

// Existing Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.get('/export', protect, exportUserData);
router.delete('/account', protect, deleteAccount);

router.route('/targets')
    .get(protect, (req, res) => {
        res.status(200).json(req.user.healthTargets || null);
    })
    .put(protect, async (req, res) => {
        try {
            const fields = ['sleep', 'steps', 'exercise', 'screenTime', 'water', 'junkFood'];
            const limits = {
                sleep: [0, 24], steps: [0, 100000], exercise: [0, 1440],
                screenTime: [0, 24], water: [0, 20], junkFood: [0, 20]
            };
            const values = Object.fromEntries(fields.map((field) => [field, Number(req.body[field])]));
            const invalidNumber = fields.some((field) => {
                const [minimum, maximum] = limits[field];
                return !Number.isFinite(values[field]) || values[field] < minimum || values[field] > maximum;
            });
            const validStress = ['Low', 'Moderate', 'High'].includes(req.body.stressLevel);
            const validReminder = typeof req.body.reminderTime === 'string' &&
                /^([01]\d|2[0-3]):[0-5]\d$/.test(req.body.reminderTime);
            if (invalidNumber || !validStress || !validReminder) {
                return res.status(400).json({ message: 'Please provide valid health targets.' });
            }
            req.user.healthTargets = { ...values, stressLevel: req.body.stressLevel, reminderTime: req.body.reminderTime };
            await req.user.save();
            res.status(200).json(req.user.healthTargets);
        } catch (error) {
            console.error('Target update error:', error);
            res.status(500).json({ message: 'Unable to save health targets.' });
        }
    });

// 🎯 NEW ROUTE: Catch the Firebase Token from React
router.post('/update-token', protect, async (req, res) => {
    try {
        const { token } = req.body;

        if (typeof token !== 'string' || token.length < 20) {
            return res.status(400).json({ message: 'A valid notification token is required.' });
        }

        await req.user.updateOne({ fcmToken: token });
        res.status(200).json({ success: true, message: "Token received and saved temporarily" });
    } catch (error) {
        res.status(500).json({ error: "Failed to process token" });
    }
});

// Compatibility alias: use the same prediction controller as POST /api/health.
router.post('/daily-log', protect, predictionRateLimit, createHealthLog);

module.exports = router;