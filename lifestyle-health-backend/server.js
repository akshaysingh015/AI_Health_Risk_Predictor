const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin'); // 👈 Moved up!
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const logger = require('./services/logger');
const helmet = require('helmet');
require('dotenv').config();

const requiredEnvironment = ['MONGO_URI', 'JWT_SECRET', 'FLASK_API_URL'];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (missingEnvironment.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
}
if (process.env.NODE_ENV === 'production' &&
    (!process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGIN === 'http://localhost:5173')) {
    throw new Error('CLIENT_ORIGIN must be set to the deployed frontend origin in production.');
}

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
        logger.warn('Firebase Admin SDK is not configured; notifications are disabled.');
    }
} catch (error) {
    logger.error('Firebase initialization failed', { error: error.message });
}

const app = express();

// 2. Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
    req.requestId = req.get('X-Request-ID') || randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    const startedAt = Date.now();
    res.on('finish', () => logger.info('Request completed', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt
    }));
    next();
});
app.use((req, res, next) => {
    if (!req.cookies.csrf_token) {
        res.cookie('csrf_token', crypto.randomBytes(32).toString('hex'), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
    }
    next();
});
app.use((req, res, next) => {
    const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const authEndpoint = req.path === '/api/auth/login' || req.path === '/api/auth/register';
    if (stateChanging && !authEndpoint && req.cookies.access_token &&
        req.headers['x-csrf-token'] !== req.cookies.csrf_token) {
        logger.warn('CSRF validation failed', { requestId: req.requestId, method: req.method, path: req.path });
        return res.status(403).json({ message: 'Invalid CSRF token.', requestId: req.requestId });
    }
    next();
});

// 3. Spy Logger
// 4. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => logger.info('MongoDB connected successfully'))
    .catch((error) => {
        logger.error('MongoDB connection failed', { error: error.message });
        process.exit(1);
    });

// 5. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes')); 
app.use('/api/health', require('./routes/healthRoutes'));

// 🔌 Connect your new Appointment Routes!
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

app.get('/health', (req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? 'healthy' : 'unhealthy',
        database: databaseReady ? 'connected' : 'disconnected'
    });
});

app.use((error, req, res, next) => {
    logger.error('Unhandled request error', { requestId: req.requestId, error: error.message });
    res.status(500).json({ message: 'Internal server error.', requestId: req.requestId });
});

// 6. Start the Server (This should ALWAYS be at the very bottom)
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});