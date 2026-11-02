const HealthLog = require('../models/HealthLog');
const { normalizeHealthMetrics, requestPrediction } = require('../services/healthPredictionService');
const { recordAuditEvent } = require('../services/privacyService');
const logger = require('../services/logger');

const riskScoreFromLegacyLog = (log) => {
    if (Number.isFinite(log.aiRiskScore)) return log.aiRiskScore;
    if (!Number.isFinite(log.aiConfidence)) return null;
    return log.aiRiskPrediction === 'High Risk' ? log.aiConfidence : 1 - log.aiConfidence;
};

const riskLabelFromScore = (score) => {
    if (!Number.isFinite(score)) return 'Unknown Risk';
    if (score >= 0.6) return 'High Risk';
    if (score >= 0.3) return 'Moderate Risk';
    return 'Low Risk';
};

const buildRecommendations = (metrics, targets = {}) => [
    [targets.steps !== undefined && metrics.dailySteps < targets.steps, `Aim for ${targets.steps} steps today.`],
    [targets.exercise !== undefined && metrics.exerciseMinutes < targets.exercise, `Add ${Math.max(0, targets.exercise - metrics.exerciseMinutes)} minutes of movement.`],
    [targets.screenTime !== undefined && metrics.screenTime > targets.screenTime, `Try to stay under ${targets.screenTime} hours of screen time.`],
    [targets.water !== undefined && metrics.waterIntake < targets.water, `Drink about ${targets.water} liters of water.`],
    [targets.sleep !== undefined && metrics.sleepHours < targets.sleep, `Protect a ${targets.sleep}-hour sleep window.`]
].filter(([needed]) => needed).slice(0, 3).map(([, recommendation]) => recommendation);

// @desc    Create a new daily health log
// @route   POST /api/health
// @access  Private (Requires Token)
const createHealthLog = async (req, res) => {
    try {
        const numericValues = normalizeHealthMetrics(req.body);
        let aiData;
        try {
            aiData = await requestPrediction(req.user, numericValues);
        } catch (error) {
            await recordAuditEvent(req, 'prediction_failed', {
                statusCode: error.statusCode || 503,
                errorCode: error.code || 'PREDICTION_ERROR'
            });
            if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message, requestId: req.requestId });
            }
            throw error;
        }

        let log;
        try {
            const riskScore = aiData.risk_score;
            const riskLevel = `${aiData.risk} Risk`;
            const inputSnapshot = {
                profile: {
                    age: req.user.age,
                    bmi: req.user.bmi,
                    gender: req.user.gender,
                    smokingHabit: req.user.smokingHabit,
                    alcoholConsumption: req.user.alcoholConsumption
                },
                metrics: numericValues,
                targets: req.user.healthTargets || null
            };
            log = await HealthLog.create({
                user: req.user.id,
                sleepHours: numericValues.sleepHours,
                dailySteps: numericValues.dailySteps,
                exerciseMinutes: numericValues.exerciseMinutes,
                screenTime: numericValues.screenTime,
                stressLevel: numericValues.stressLevel,
                waterIntake: numericValues.waterIntake,
                junkFoodFrequency: numericValues.junkFoodFrequency,
                aiRiskPrediction: riskLevel,
                aiConfidence: aiData.confidence,
                aiRiskScore: riskScore,
                modelVersion: aiData.model_version,
                modelRiskScore: aiData.model_risk_score,
                modelProbability: aiData.model_risk_score,
                ruleBasedScore: aiData.rule_based_score,
                scoreMethod: aiData.score_method,
                featureContributions: aiData.feature_contributions,
                inputSnapshot,
                recommendations: buildRecommendations(numericValues, req.user.healthTargets),
                riskScore,
                riskLevel
            });
        } catch (error) {
            logger.error('Health log persistence failed after prediction', {
                requestId: req.requestId,
                error: error.message
            });
            return res.status(503).json({
                message: 'Prediction completed, but the health log could not be saved. Please try again.',
                requestId: req.requestId
            });
        }
        await recordAuditEvent(req, 'health_log_created');

        res.status(201).json({
            message: "Health log saved and analyzed by AI!",
            log,
            riskLevel: log.riskLevel,
            riskScore: Math.round(log.riskScore * 100),
            modelVersion: log.modelVersion,
            modelProbability: log.modelProbability,
            ruleBasedScore: log.ruleBasedScore,
            recommendations: log.recommendations
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message, requestId: req.requestId });
        }
        logger.error('Prediction request failed', { requestId: req.requestId, error: error.message });
        res.status(503).json({ message: "AI Engine is temporarily unavailable.", requestId: req.requestId });
    }
};

// @desc    Get all daily health logs for the logged-in user
// @route   GET /api/health/history
// @access  Private (Requires Token)
const getHealthHistory = async (req, res) => {
    try {
        // Find logs for this user and sort by newest first (-1)
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const requestedLimit = Number.parseInt(req.query.limit, 10) || 50;
        const limit = Math.min(Math.max(requestedLimit, 1), 100);
        const [history, total] = await Promise.all([
            HealthLog.find({ user: req.user.id })
                .sort({ logDate: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            HealthLog.countDocuments({ user: req.user.id })
        ]);
        const normalizedHistory = history.map((log) => {
            const score = riskScoreFromLegacyLog(log);
            const date = new Date(log.logDate);
            const fallbackDate = new Date(log.createdAt);
            return {
                ...log,
                aiRiskScore: score,
                aiRiskPrediction: riskLabelFromScore(score),
                riskScore: log.riskScore ?? score,
                riskLevel: log.riskLevel || riskLabelFromScore(score),
                modelProbability: log.modelProbability ?? log.modelRiskScore ?? null,
                recommendations: log.recommendations || [],
                logDate: Number.isNaN(date.getTime()) ? fallbackDate : date
            };
        });
        await recordAuditEvent(req, 'history_read', { resultCount: normalizedHistory.length });

        res.status(200).json({
            success: true,
            count: normalizedHistory.length,
            total,
            page,
            limit,
            hasMore: page * limit < total,
            history: normalizedHistory
        });
    } catch (error) {
        logger.error('Health history request failed', { requestId: req.requestId, error: error.message });
        res.status(500).json({ message: "Server error retrieving health history", requestId: req.requestId });
    }
};

module.exports = { createHealthLog, getHealthHistory };