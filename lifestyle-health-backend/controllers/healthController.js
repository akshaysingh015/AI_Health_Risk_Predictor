const HealthLog = require('../models/HealthLog');

// @desc    Create a new daily health log
// @route   POST /api/health
// @access  Private (Requires Token)
const createHealthLog = async (req, res) => {
    try {
        const { 
            sleepHours, dailySteps, exerciseMinutes, 
            screenTime, stressLevel, waterIntake, junkFoodFrequency 
        } = req.body;

        if (
            sleepHours === undefined || dailySteps === undefined || exerciseMinutes === undefined ||
            screenTime === undefined || stressLevel === undefined || waterIntake === undefined ||
            junkFoodFrequency === undefined
        ) {
            return res.status(400).json({ message: "Please fill out all daily metrics" });
        }

        if (!req.user.age || !req.user.bmi) {
            return res.status(400).json({ message: "Please complete your health profile before submitting a daily log." });
        }

        const aiResponse = await fetch(`${process.env.FLASK_API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Age: req.user.age,
                BMI: req.user.bmi,
                daily_steps: Number(dailySteps),
                screen_time_hours: Number(screenTime),
                water_intake_liters: Number(waterIntake),
                junk_food_frequency: Number(junkFoodFrequency)
            })
        });

        const aiData = await aiResponse.json();
        if (!aiResponse.ok || !aiData.risk || typeof aiData.confidence !== 'number') {
            return res.status(502).json({ message: aiData.error || "AI analysis failed" });
        }

        const log = await HealthLog.create({
            user: req.user.id, 
            sleepHours,
            dailySteps,
            exerciseMinutes,
            screenTime,
            stressLevel,
            waterIntake,
            junkFoodFrequency,
            aiRiskPrediction: aiData.risk === "High" ? "High Risk" : "Low Risk",
            aiConfidence: aiData.confidence
        });

        res.status(201).json({
            message: "Health log saved and analyzed by AI!",
            log,
            riskLevel: log.aiRiskPrediction,
            riskScore: Math.round(aiData.confidence * 100)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error saving health log" });
    }
};

// @desc    Get all daily health logs for the logged-in user
// @route   GET /api/health/history
// @access  Private (Requires Token)
const getHealthHistory = async (req, res) => {
    try {
        // Find logs for this user and sort by newest first (-1)
        const history = await HealthLog.find({ user: req.user.id }).sort({ logDate: -1 });

        res.status(200).json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error retrieving health history" });
    }
};

module.exports = { createHealthLog, getHealthHistory };