const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fcmToken: { type: String },
    
    // --- PERMANENT PROFILE DATA ---
    age: { type: Number, min: 1, max: 120 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    height: { type: Number, min: 50, max: 250 }, // in cm
    weight: { type: Number, min: 2, max: 400 }, // in kg
    bmi: { type: Number, min: 10, max: 80 },
    smokingHabit: { type: String, enum: ['Non-smoker', 'Occasional', 'Regular'] },
    alcoholConsumption: { type: String, enum: ['None', 'Occasional', 'Regular'] }
    ,
    healthTargets: {
        sleep: { type: Number, min: 0, max: 24 },
        steps: { type: Number, min: 0, max: 100000 },
        exercise: { type: Number, min: 0, max: 1440 },
        screenTime: { type: Number, min: 0, max: 24 },
        stressLevel: { type: String, enum: ['Low', 'Moderate', 'High'] },
        water: { type: Number, min: 0, max: 20 },
        junkFood: { type: Number, min: 0, max: 20 },
        reminderTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ }
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('User', userSchema);