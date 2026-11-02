const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

const recordAuditEvent = async (req, action, metadata = {}) => {
    try {
        await AuditLog.create({
            userId: String(req.user?.id || req.user?._id || 'system'),
            action,
            ipAddress: req.ip,
            metadata
        });
    } catch (error) {
        logger.error('Privacy audit logging failed', { requestId: req.requestId, error: error.message });
    }
};

module.exports = { recordAuditEvent };
