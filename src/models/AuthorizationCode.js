const mongoose = require('mongoose');

const authorizationCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        clientId: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        codeChallenge: {
            type: String,
            required: true,
        },
        codeChallengeMethod: {
            type: String,
            required: true,
            enum: ['s256'],
        },
        redirectUrl: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-delete expired codes
authorizationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthorizationCode', authorizationCodeSchema);
