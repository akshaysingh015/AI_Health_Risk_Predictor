const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin'); // 👈 Moved up!
require('dotenv').config();

// 1. Initialize Firebase Admin SDK First
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
console.log("🔥 Firebase Admin SDK initialized successfully!");

const app = express();

// 2. Middleware
app.use(cors());
app.use(express.json());

// 3. Spy Logger
app.use((req, res, next) => {
    console.log(`[SPY] Incoming Request: ${req.method} ${req.url}`);
    next();
});

// 4. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// 5. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes')); 

// 🔌 Connect your new Appointment Routes!
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

// 6. Start the Server (This should ALWAYS be at the very bottom)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});