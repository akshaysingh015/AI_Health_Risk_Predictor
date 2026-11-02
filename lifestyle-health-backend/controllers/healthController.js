const HealthLog = require('../models/HealthLog');
const stressValues = { Low: 1, Moderate: 5, High: 10 };

// @desc    Create a new daily health log
// @route   POST /api/health
// @access  Private (Requires Token)
const createHealthLog = async (req, res) => {
    try {
        const {
            sleepHours, dailySteps, exerciseMinutes,
            screenTime, stressLevel, waterIntake, junkFoodFrequency
        } = req.body;
        const numericValues = {
            sleepHours: Number(sleepHours),
            dailySteps: Number(dailySteps),
            exerciseMinutes: Number(exerciseMinutes),
            screenTime: Number(screenTime),
            waterIntake: Number(waterIntake),
            junkFoodFrequency: Number(junkFoodFrequency)
        };

        if (
            sleepHours === undefined || dailySteps === undefined || exerciseMinutes === undefined ||
            screenTime === undefined || stressLevel === undefined || waterIntake === undefined ||
            junkFoodFrequency === undefined ||
            !Object.values(numericValues).every(Number.isFinite) ||
            Object.values(numericValues).some((value) => value < 0) ||
            !Object.prototype.hasOwnProperty.call(stressValues, stressLevel)
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
                screen_time_hours: numericValues.screenTime,
                water_intake_liters: numericValues.waterIntake,
                junk_food_frequency: numericValues.junkFoodFrequency,
                sleep_hours: numericValues.sleepHours,
                exercise_minutes: numericValues.exerciseMinutes,
                stress_level: stressValues[stressLevel]
            })
        });

        const aiData = await aiResponse.json();
        if (
            !aiResponse.ok ||
            !aiData.risk ||
            typeof aiData.confidence !== 'number' ||
            typeof aiData.risk_score !== 'number'
        ) {
            return res.status(502).json({ message: aiData.error || "AI analysis failed" });
        }

        const log = await HealthLog.create({
            user: req.user.id,
            sleepHours: numericValues.sleepHours,
            dailySteps: numericValues.dailySteps,
            exerciseMinutes: numericValues.exerciseMinutes,
            screenTime: numericValues.screenTime,
            stressLevel: stressValues[stressLevel],
            waterIntake: numericValues.waterIntake,
            junkFoodFrequency: numericValues.junkFoodFrequency,
            aiRiskPrediction: `${aiData.risk} Risk`,
            aiConfidence: aiData.confidence,
            aiRiskScore: aiData.risk_score
        });

        res.status(201).json({
            message: "Health log saved and analyzed by AI!",
            log,
            riskLevel: log.aiRiskPrediction,
            riskScore: Math.round(aiData.risk_score * 100)
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