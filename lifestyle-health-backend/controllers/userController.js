const User = require('../models/User');

// @desc    Update user profile with biometric data
// @route   PUT /api/users/profile
// @access  Private (Requires Token)
const updateUserProfile = async (req, res) => {
    try {
        const { age, gender, height, weight, bmi, smokingHabit, alcoholConsumption } = req.body;

        // 1. Find the user who is currently logged in
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Update their permanent profile data
        user.age = age || user.age;
        user.gender = gender || user.gender;
        user.height = height || user.height;
        user.weight = weight || user.weight;
        user.bmi = bmi || user.bmi;
        user.smokingHabit = smokingHabit || user.smokingHabit;
        user.alcoholConsumption = alcoholConsumption || user.alcoholConsumption;

        // 3. Save the updated user to MongoDB
        const updatedUser = await user.save();

        // 4. Send a success response back to React
        res.status(200).json({
            message: "Profile updated successfully!",
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                age: updatedUser.age,
                bmi: updatedUser.bmi
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error updating profile" });
    }
};

// We will also add a quick GET route in case your frontend ever needs to fetch the profile!
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Exclude the password!
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error retrieving profile" });
    }
};

module.exports = { updateUserProfile, getUserProfile };