const express = require('express');
const router = express.Router();
const { updateUserProfile, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const HealthLog = require('../models/HealthLog');

// Existing Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

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

// Existing AI Daily Log Route (The Bridge to Python)
router.post('/daily-log', protect, async (req, res) => {
    try {
        const dailyData = req.body;
        const numericFields = ['sleep', 'steps', 'exercise', 'screenTime', 'water', 'junkFood'];
        const values = Object.fromEntries(numericFields.map((field) => [field, Number(dailyData[field])]));
        const hasInvalidValue = numericFields.some((field) => !Number.isFinite(values[field]) || values[field] < 0);

        if (hasInvalidValue || !['Low', 'Moderate', 'High'].includes(dailyData.stressLevel)) {
            return res.status(400).json({ message: 'Please provide valid daily health metrics.' });
        }

        if (!req.user.age || !req.user.bmi) {
            return res.status(400).json({ message: 'Please complete your health profile before submitting a daily log.' });
        }

        const payload = {
            Age: req.user.age,
            BMI: req.user.bmi,
            daily_steps: values.steps,
            screen_time_hours: values.screenTime,
            water_intake_liters: values.water,
            junk_food_frequency: values.junkFood
        };

        const pythonResponse = await fetch(`${process.env.FLASK_API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const aiResult = await pythonResponse.json();

        if (!pythonResponse.ok || !aiResult.risk || typeof aiResult.confidence !== 'number') {
            return res.status(502).json({ message: aiResult.error || 'AI Engine returned an invalid response.' });
        }

        const riskLevel = aiResult.risk === 'High' ? 'High Risk' : 'Low Risk';
        const riskScore = Math.round(aiResult.confidence * 100);
        const log = await HealthLog.create({
            user: req.user.id,
            sleepHours: values.sleep,
            dailySteps: values.steps,
            exerciseMinutes: values.exercise,
            screenTime: values.screenTime,
            stressLevel: { Low: 1, Moderate: 5, High: 10 }[dailyData.stressLevel],
            waterIntake: values.water,
            junkFoodFrequency: values.junkFood,
            aiRiskPrediction: riskLevel,
            aiConfidence: aiResult.confidence
        });

        res.status(201).json({ riskLevel, riskScore, log });
    } catch (error) {
        console.error("AI Bridge Error:", error);
        res.status(500).json({ message: "AI Engine is unreachable." });
    }
});

module.exports = router;