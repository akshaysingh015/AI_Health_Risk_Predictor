const User = require('../models/User');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

// 🎟️ Helper Function: Generate JWT (The VIP Pass)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', 
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, password } = req.body;
        const emailAddress = typeof req.body.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';

        if (!name || !emailAddress || !password) {
            return res.status(400).json({ message: "Please enter all fields" });
        }

        const userExists = await User.findOne({ email: emailAddress });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: emailAddress,
            password: hashedPassword
        });

        // 👇 UPDATED: Now sends the token!
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
            message: "User successfully registered!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during registration" });
    }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { password } = req.body;
        const emailAddress = typeof req.body.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';

        if (!emailAddress || !password) {
            return res.status(400).json({ message: "Please enter all fields" });
        }

        const user = await User.findOne({ email: emailAddress });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 👇 UPDATED: Now sends the token!
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
            message: "Login successful!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login" });
    }
};

// Export the controllers
module.exports = { registerUser, loginUser };