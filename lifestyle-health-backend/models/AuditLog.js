const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    action: {
        type: String,
        required: true,
        enum: ['profile_read', 'profile_updated', 'health_log_created', 'history_read', 'health_exported', 'account_deleted', 'prediction_failed']
    },
    ipAddress: { type: String, maxlength: 100 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
    timestamps: true
});

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
