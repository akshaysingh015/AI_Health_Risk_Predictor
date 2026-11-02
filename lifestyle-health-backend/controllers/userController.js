const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const { recordAuditEvent } = require('../services/privacyService');
const { PROFILE_ENUMS, validateProfileInput } = require('../services/inputValidation');
const logger = require('../services/logger');

const calculateBmi = (height, weight) => weight / ((height / 100) ** 2);

// @desc    Update user profile with biometric data
// @route   PUT /api/users/profile
// @access  Private (Requires Token)
const updateUserProfile = async (req, res) => {
    try {
        const { age, gender, height, weight, bmi, smokingHabit, alcoholConsumption } = req.body;

        if (!validateProfileInput(req.body)) {
            return res.status(400).json({ message: "Please provide valid profile data." });
        }

        // 1. Find the user who is currently logged in
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const proposedHeight = height ?? user.height;
        const proposedWeight = weight ?? user.weight;
        const proposedBmi = bmi ?? user.bmi;
        if ([height, weight, bmi].some((value) => value !== undefined) &&
            [proposedHeight, proposedWeight, proposedBmi].every((value) => Number.isFinite(Number(value)))) {
            const calculatedBmi = calculateBmi(Number(proposedHeight), Number(proposedWeight));
            if (Math.abs(calculatedBmi - Number(proposedBmi)) > 0.5) {
                return res.status(400).json({ message: "BMI must match the supplied height and weight." });
            }
        }

        // 2. Update their permanent profile data
        if (age !== undefined) user.age = age;
        if (gender !== undefined) user.gender = gender;
        if (height !== undefined) user.height = height;
        if (weight !== undefined) user.weight = weight;
        if (bmi !== undefined) user.bmi = bmi;
        if (smokingHabit !== undefined) user.smokingHabit = smokingHabit;
        if (alcoholConsumption !== undefined) user.alcoholConsumption = alcoholConsumption;

        // 3. Save the updated user to MongoDB
        const updatedUser = await user.save();
        await recordAuditEvent(req, 'profile_updated');

        // 4. Send a success response back to React
        res.status(200).json({
            message: "Profile updated successfully!",
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                age: updatedUser.age,
                gender: updatedUser.gender,
                height: updatedUser.height,
                weight: updatedUser.weight,
                bmi: updatedUser.bmi,
                smokingHabit: updatedUser.smokingHabit,
                alcoholConsumption: updatedUser.alcoholConsumption
            }
        });

    } catch (error) {
        logger.error('Profile update failed', { requestId: req.requestId, error: error.message });
        res.status(500).json({ message: "Server error updating profile", requestId: req.requestId });
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
            await recordAuditEvent(req, 'profile_read');
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        logger.error('Profile retrieval failed', { requestId: req.requestId, error: error.message });
        res.status(500).json({ message: "Server error retrieving profile", requestId: req.requestId });
    }
};

const exportUserData = async (req, res) => {
    try {
        const [user, healthLogs] = await Promise.all([
            User.findById(req.user.id).select('-password -fcmToken').lean(),
            HealthLog.find({ user: req.user.id }).select('-__v').sort({ logDate: -1 }).lean()
        ]);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await recordAuditEvent(req, 'health_exported', { healthLogCount: healthLogs.length });
        res.setHeader('Content-Disposition', 'attachment; filename="healthsync-data.json"');
        res.status(200).json({
            exportedAt: new Date().toISOString(),
            retentionPolicy: 'Audit records are retained for up to 2 years; account data is deleted on request.',
            user,
            healthLogs
        });
    } catch (error) {
        logger.error('Data export failed', { requestId: req.requestId, error: error.message });
        res.status(500).json({ message: 'Unable to export your data.', requestId: req.requestId });
    }
};

const deleteAccount = async (req, res) => {
    try {
        await recordAuditEvent(req, 'account_deleted');
        await Promise.all([
            HealthLog.deleteMany({ user: req.user.id }),
            User.deleteOne({ _id: req.user.id })
        ]);
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        res.status(200).json({ message: 'Your account and health data have been deleted.' });
    } catch (error) {
        logger.error('Account deletion failed', { requestId: req.requestId, error: error.message });
        res.status(500).json({ message: 'Unable to delete your account.', requestId: req.requestId });
    }
};

module.exports = { updateUserProfile, getUserProfile, exportUserData, deleteAccount };