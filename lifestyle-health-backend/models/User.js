const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // --- PERMANENT PROFILE DATA ---
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    bmi: { type: Number },
    smokingHabit: { type: String, enum: ['Non-smoker', 'Occasional', 'Regular'] },
    alcoholConsumption: { type: String, enum: ['None', 'Occasional', 'Regular'] }
    
}, {
    timestamps: true 
});

module.exports = mongoose.model('User', userSchema);