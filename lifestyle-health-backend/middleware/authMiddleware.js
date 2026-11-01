const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // 1. Check if the request has a token in the headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Extract the token (It looks like "Bearer eyJhbGciOi...")
            token = req.headers.authorization.split(' ')[1];

            // 3. Decode the token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Find the user in the database, but DO NOT return their password
            req.user = await User.findById(decoded.id).select('-password');

            // 5. The token is valid! Let them pass to the next route.
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Not authorized, invalid token!" });
        }
    }

    // 6. If there is no token at all, kick them out
    if (!token) {
        res.status(401).json({ message: "Not authorized, no token provided!" });
    }
};

module.exports = { protect };