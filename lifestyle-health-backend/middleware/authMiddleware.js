const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const token = req.cookies?.access_token ||
        (req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : null);

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided!' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user no longer exists.' });
        }

        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, invalid token!' });
    }
};

module.exports = { protect };
