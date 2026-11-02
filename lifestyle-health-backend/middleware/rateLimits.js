const rateLimit = require('express-rate-limit');

const configuredAuthLimit = Number.parseInt(process.env.AUTH_RATE_LIMIT, 10);
const authLimit = Number.isFinite(configuredAuthLimit) && configuredAuthLimit > 0
    ? configuredAuthLimit
    : 10;

const createAuthRateLimit = (operation) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authLimit,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: `Too many ${operation} attempts. Please try again later.` }
});

const authLoginRateLimit = createAuthRateLimit('login');
const authRegisterRateLimit = createAuthRateLimit('registration');

const predictionRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many predictions requested. Please wait and try again.' }
});

module.exports = {
    authLoginRateLimit,
    authRegisterRateLimit,
    predictionRateLimit
};
