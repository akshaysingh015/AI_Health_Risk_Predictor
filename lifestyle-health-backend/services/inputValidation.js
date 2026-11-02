const PROFILE_ENUMS = {
    gender: ['Male', 'Female', 'Other'],
    smokingHabit: ['Non-smoker', 'Occasional', 'Regular'],
    alcoholConsumption: ['None', 'Occasional', 'Regular']
};

const validateRegistrationInput = ({ name, email, password }) =>
    typeof name === 'string' && name.trim().length >= 2 &&
    typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    typeof password === 'string' && password.length >= 8 &&
    /[A-Z]/.test(password) && /[a-z]/.test(password) &&
    /\d/.test(password);

const validateLoginInput = ({ email, password }) =>
    typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    typeof password === 'string' && password.length >= 8;

const getRegistrationValidationMessage = ({ name, email, password }) => {
    if (typeof name !== 'string' || name.trim().length < 2) return 'Please enter your full name.';
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Please enter a valid email address.';
    }
    if (typeof password !== 'string' || password.length < 8) {
        return 'Password must be at least 8 characters.';
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        return 'Password must include uppercase, lowercase, and a number.';
    }
    return null;
};

const validateProfileInput = (input) => {
    const ranges = { age: [1, 120], height: [50, 250], weight: [2, 400], bmi: [10, 80] };
    const validNumbers = Object.entries(ranges).every(([field, [minimum, maximum]]) => {
        if (input[field] === undefined) return true;
        if (typeof input[field] === 'boolean' || input[field] === null ||
            (typeof input[field] === 'string' && input[field].trim() === '')) return false;
        const value = Number(input[field]);
        return Number.isFinite(value) && value >= minimum && value <= maximum;
    });
    const validEnums = Object.entries(PROFILE_ENUMS).every(([field, allowed]) =>
        input[field] === undefined || allowed.includes(input[field])
    );
    return validNumbers && validEnums;
};

module.exports = {
    PROFILE_ENUMS,
    validateRegistrationInput,
    getRegistrationValidationMessage,
    validateLoginInput,
    validateProfileInput
};
