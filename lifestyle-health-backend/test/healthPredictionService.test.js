const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeHealthMetrics } = require('../services/healthPredictionService');
const { requestPrediction } = require('../services/healthPredictionService');
const { validateRegistrationInput, validateLoginInput, validateProfileInput } = require('../services/inputValidation');

const validInput = {
    sleep: 7.5,
    steps: 10000,
    exercise: 45,
    screenTime: 4,
    water: 3,
    junkFood: 0,
    stressLevel: 'Low'
};

test('normalizes the frontend daily-log shape', () => {
    assert.deepEqual(normalizeHealthMetrics(validInput), {
        sleepHours: 7.5,
        dailySteps: 10000,
        exerciseMinutes: 45,
        screenTime: 4,
        waterIntake: 3,
        junkFoodFrequency: 0,
        stressLevel: 1
    });
});

test('rejects invalid and out-of-range daily metrics', () => {
    assert.throws(
        () => normalizeHealthMetrics({ ...validInput, steps: -1 }),
        (error) => error.statusCode === 400
    );
    assert.throws(
        () => normalizeHealthMetrics({ ...validInput, stressLevel: 'Unknown' }),
        (error) => error.statusCode === 400
    );
    assert.throws(
        () => normalizeHealthMetrics({ ...validInput, sleep: 'not-a-number' }),
        (error) => error.statusCode === 400
    );
});

test('validates registration and login contracts', () => {
    assert.equal(validateRegistrationInput({ name: 'A', email: 'a@b.com', password: '12345678' }), false);
    assert.equal(validateRegistrationInput({ name: 'Alice', email: 'a@b.com', password: 'Password1' }), true);
    assert.equal(validateLoginInput({ email: '', password: '12345678' }), false);
    assert.equal(validateLoginInput({ email: 'a@b.com', password: '12345678' }), true);
});

test('validates profile ranges and enums', () => {
    assert.equal(validateProfileInput({ age: 30, height: 175, weight: 70, bmi: 22, gender: 'Other' }), true);
    for (const [field, value] of [
        ['age', 0], ['height', 0], ['height', 251], ['weight', 1], ['weight', 401],
        ['bmi', 9], ['bmi', 81], ['age', NaN], ['height', ''], ['weight', true]
    ]) {
        assert.equal(validateProfileInput({ [field]: value }), false, `${field}=${value} should be rejected`);
    }
    for (const [field, value] of [
        ['gender', 'Invalid'], ['smokingHabit', 'Never'], ['alcoholConsumption', 'Heavy']
    ]) {
        assert.equal(validateProfileInput({ [field]: value }), false, `${field}=${value} should be rejected`);
    }
});

test('history labels match exact score boundaries', async () => {
    const { getRiskLabel } = await import('../frontend/src/utils/riskClassification.js');
    assert.equal(getRiskLabel(29.9), 'Low Risk');
    assert.equal(getRiskLabel(30), 'Moderate Risk');
    assert.equal(getRiskLabel(59.9), 'Moderate Risk');
    assert.equal(getRiskLabel(60), 'High Risk');
});

test('reports ML service outages as rejected predictions', async () => {
    const originalUrl = process.env.FLASK_API_URL;
    process.env.FLASK_API_URL = 'http://127.0.0.1:59999';
    await assert.rejects(() => requestPrediction({ age: 30, bmi: 22 }, {
        sleepHours: 7.5, dailySteps: 10000, exerciseMinutes: 45, screenTime: 4,
        waterIntake: 3, junkFoodFrequency: 0, stressLevel: 1
    }));
    process.env.FLASK_API_URL = originalUrl;
});
