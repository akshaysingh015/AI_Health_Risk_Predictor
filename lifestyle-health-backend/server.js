const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin'); // 👈 Moved up!
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = path.resolve(
    __dirname,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
);

try {
    let serviceAccount;
    if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }

    if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log('Firebase Admin SDK initialized successfully.');
    } else {
        console.warn('Firebase Admin SDK is not configured; notifications are disabled.');
    }
} catch (error) {
    console.error(`Firebase initialization failed: ${error.message}`);
}

const app = express();

// 2. Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

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
app.use('/api/health', require('./routes/healthRoutes'));

// 🔌 Connect your new Appointment Routes!
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// 6. Start the Server (This should ALWAYS be at the very bottom)
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});