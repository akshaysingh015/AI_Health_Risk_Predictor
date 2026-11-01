const express = require('express');
const router = express.Router();
const { updateUserProfile, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Existing Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// 🎯 NEW ROUTE: Catch the Firebase Token from React
router.post('/update-token', (req, res) => {
    try {
        const { token } = req.body;
        
        // Later, we will save this token to your MongoDB User model using req.user
        console.log("📥 Successfully received token from frontend:", token);
        
        res.status(200).json({ success: true, message: "Token received and saved temporarily" });
    } catch (error) {
        res.status(500).json({ error: "Failed to process token" });
    }
});

// Existing AI Daily Log Route (The Bridge to Python)
router.post('/daily-log', protect, async (req, res) => {
    try {
        const dailyData = req.body;
        console.log("Node received data:", dailyData);

        // Map React fields (7) to Python Model fields (6)
        const payload = {
            "Age": 20, // In production, get this from req.user
            "BMI": 22.0, 
            "daily_steps": dailyData.steps,
            "screen_time_hours": dailyData.screenTime,
            "water_intake_liters": dailyData.water,
            "junk_food_frequency": dailyData.junkFood
        };

        // Forward to Python AI Engine running on port 5000
        const pythonResponse = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const aiResult = await pythonResponse.json();
        
        // Return result back to React
        res.status(200).json({
            riskLevel: aiResult.risk === "High" ? "High Risk" : "Low Risk",
            riskScore: Math.round(aiResult.confidence * 100)
        });

    } catch (error) {
        console.error("AI Bridge Error:", error);
        res.status(500).json({ message: "AI Engine is unreachable." });
    }
});

module.exports = router;