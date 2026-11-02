const rateLimit = require('express-rate-limit');

const configuredAuthLimit = Number.parseInt(process.env.AUTH_RATE_LIMIT, 10);

const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number.isFinite(configuredAuthLimit) && configuredAuthLimit > 0
        ? configuredAuthLimit
        : 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts. Please try again later.' }
});

const predictionRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many predictions requested. Please wait and try again.' }
});

module.exports = { authRateLimit, predictionRateLimit };
