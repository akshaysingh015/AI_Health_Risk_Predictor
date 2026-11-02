const DAILY_LIMITS = {
    sleepHours: [0, 24],
    dailySteps: [0, 100000],
    exerciseMinutes: [0, 1440],
    screenTime: [0, 24],
    waterIntake: [0, 20],
    junkFoodFrequency: [0, 20]
};

const STRESS_VALUES = { Low: 1, Moderate: 5, High: 10 };
const RISK_LEVELS = new Set(['Low', 'Moderate', 'High']);

const asFiniteNumber = (value) => {
    if (typeof value === 'boolean' || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const normalizeHealthMetrics = (input) => {
    const metrics = {
        sleepHours: asFiniteNumber(input.sleepHours ?? input.sleep),
        dailySteps: asFiniteNumber(input.dailySteps ?? input.steps),
        exerciseMinutes: asFiniteNumber(input.exerciseMinutes ?? input.exercise),
        screenTime: asFiniteNumber(input.screenTime ?? input.screenTimeHours),
        waterIntake: asFiniteNumber(input.waterIntake ?? input.water),
        junkFoodFrequency: asFiniteNumber(input.junkFoodFrequency ?? input.junkFood),
        stressLevel: typeof input.stressLevel === 'string'
            ? STRESS_VALUES[input.stressLevel]
            : asFiniteNumber(input.stressLevel)
    };

    const invalid = Object.entries(DAILY_LIMITS).some(([field, [minimum, maximum]]) => {
        const value = metrics[field];
        return value === null || value < minimum || value > maximum;
    });

    if (invalid || metrics.stressLevel === null ||
        metrics.stressLevel === undefined ||
        metrics.stressLevel < 1 || metrics.stressLevel > 10) {
        const error = new Error('Please provide valid daily health metrics.');
        error.statusCode = 400;
        throw error;
    }

    return metrics;
};

const buildPredictionPayload = (profile, metrics) => ({
    Age: asFiniteNumber(profile.age),
    BMI: asFiniteNumber(profile.bmi),
    daily_steps: metrics.dailySteps,
    screen_time_hours: metrics.screenTime,
    water_intake_liters: metrics.waterIntake,
    junk_food_frequency: metrics.junkFoodFrequency,
    sleep_hours: metrics.sleepHours,
    exercise_minutes: metrics.exerciseMinutes,
    stress_level: metrics.stressLevel
});

const buildTargetPayload = (targets = {}) => ({
    sleep: asFiniteNumber(targets.sleep),
    steps: asFiniteNumber(targets.steps),
    exercise: asFiniteNumber(targets.exercise),
    screenTime: asFiniteNumber(targets.screenTime),
    stressLevel: STRESS_VALUES[targets.stressLevel] ?? null,
    water: asFiniteNumber(targets.water),
    junkFood: asFiniteNumber(targets.junkFood)
});

const requestPrediction = async (profile, metrics) => {
    const payload = {
        ...buildPredictionPayload(profile, metrics),
        targets: buildTargetPayload(profile.healthTargets),
        gender: profile.gender || 'Other',
        smoking_habit: profile.smokingHabit || 'Non-smoker',
        alcohol_consumption: profile.alcoholConsumption || 'None'
    };
    if (payload.Age === null || payload.BMI === null) {
        const error = new Error('Please complete your health profile before submitting a daily log.');
        error.statusCode = 400;
        throw error;
    }

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(`${process.env.FLASK_API_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            const result = await response.json();
            if (!response.ok || !RISK_LEVELS.has(result.risk) ||
                result.validation_status !== 'prototype_not_clinically_validated' ||
                result.confidence_status !== 'uncalibrated_research_estimate' ||
                typeof result.score_method !== 'string' ||
                !result.score_method.startsWith('prototype-hybrid-') ||
                !result.feature_contributions ||
                !Number.isFinite(result.confidence) ||
                !Number.isFinite(result.risk_score) ||
                !Number.isFinite(result.model_risk_score) ||
                !Number.isFinite(result.rule_based_score) ||
                result.risk_score < 0 || result.risk_score > 1) {
                const error = new Error(result.error || 'AI Engine returned an invalid response.');
                error.statusCode = response.status >= 500 ? 503 : 502;
                error.retryable = response.status >= 500;
                throw error;
            }
            result.model_version = result.model_version || 'health-risk-model-v1';
            return result;
        } catch (error) {
            const retryable = error.name === 'AbortError' || error.retryable ||
                error.code === 'ECONNREFUSED' || error.code === 'UND_ERR_CONNECT_TIMEOUT';
            if (!retryable || attempt === maxAttempts) {
                if (error.name === 'AbortError') {
                    error.message = 'AI Engine request timed out.';
                    error.statusCode = 503;
                    error.code = 'ML_TIMEOUT';
                } else if (!error.statusCode) {
                    error.message = 'AI Engine is temporarily unavailable.';
                    error.statusCode = 503;
                    error.code = 'ML_UNAVAILABLE';
                }
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        } finally {
            clearTimeout(timeout);
        }
    }
};

module.exports = { normalizeHealthMetrics, requestPrediction };
