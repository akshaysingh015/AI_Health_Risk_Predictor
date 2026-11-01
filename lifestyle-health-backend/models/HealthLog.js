const mongoose = require('mongoose');

const healthLogSchema = new mongoose.Schema({
    // Links this specific log to the logged-in user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', 
    },
    // The exact date this log is for
    logDate: {
        type: Date,
        default: Date.now
    },
    
    // --- DAILY LIFESTYLE DATA ---
    sleepHours: { type: Number, required: true },
    dailySteps: { type: Number, required: true },
    exerciseMinutes: { type: Number, required: true },
    screenTime: { type: Number, required: true }, // in hours
    stressLevel: { type: Number, min: 1, max: 10, required: true }, // Scale of 1 to 10
    waterIntake: { type: Number, required: true }, // in liters or glasses
    junkFoodFrequency: { type: Number, required: true }, // meals/snacks per day
    
    // --- AI RESULTS ---
    aiRiskPrediction: {
        type: String,
        default: "Pending AI Analysis"
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('HealthLog', healthLogSchema);